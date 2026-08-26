import { useState, useRef, useEffect, useCallback, type PointerEvent as ReactPointerEvent } from 'react'
import { ShieldCheck, UserCheck, User, GripVertical } from 'lucide-react'
import { useDevPersona } from '../../context/DevPersonaContext'

interface Position {
  x: number
  y: number
}

export default function DevPersonaSwitcher() {
  const { role, toggleRole, currentDepartment, currentStaff } = useDevPersona()
  const [position, setPosition] = useState<Position | null>(() => {
    const saved = sessionStorage.getItem('chronos_dev_switcher_pos')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Position
        return { x: parsed.x, y: parsed.y }
      } catch {
        return null
      }
    }
    return null
  })

  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    moved: false,
  })
  const cardRef = useRef<HTMLDivElement>(null)

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Only drag from primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const el = cardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      moved: false,
    }
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.startX
    const dy = e.clientY - dragStartRef.current.startY

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.moved = true
    }

    const card = cardRef.current
    const cardWidth = card ? card.offsetWidth : 280
    const cardHeight = card ? card.offsetHeight : 44

    const minX = 8
    const maxX = Math.max(8, window.innerWidth - cardWidth - 8)
    const minY = 8
    const maxY = Math.max(8, window.innerHeight - cardHeight - 8)

    const rawX = dragStartRef.current.initX + dx
    const rawY = dragStartRef.current.initY + dy

    const newX = Math.min(Math.max(rawX, minX), maxX)
    const newY = Math.min(Math.max(rawY, minY), maxY)

    setPosition({ x: newX, y: newY })
  }, [])

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
    if (position) {
      sessionStorage.setItem('chronos_dev_switcher_pos', JSON.stringify(position))
    }
  }, [position])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      return () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const isAdmin = role === 'admin'
  const isHod = role === 'hod'

  const styleProps = position
    ? { left: `${position.x}px`, top: `${position.y}px`, bottom: 'auto', right: 'auto' }
    : { left: '16px', bottom: '16px' }

  return (
    <div
      ref={cardRef}
      style={styleProps}
      onPointerDown={handlePointerDown}
      className={`fixed z-[70] flex items-center gap-2 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-2 rounded-full border border-zinc-700/60 shadow-2xl transition-shadow select-none touch-none ${
        isDragging ? 'cursor-grabbing shadow-purple-900/20 scale-[1.02]' : 'cursor-grab'
      }`}
    >
      <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-700 pointer-events-none">
        <GripVertical size={14} className="text-zinc-500 hover:text-zinc-300" />
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
          Dev
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => {
          if (dragStartRef.current.moved) {
            e.preventDefault()
            return
          }
          toggleRole()
        }}
        className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors cursor-pointer"
        title="Cycle persona between Global Admin, HOD, and Staff"
      >
        {isAdmin ? (
          <>
            <ShieldCheck size={14} className="text-amber-400" />
            <span>Global Admin</span>
          </>
        ) : isHod ? (
          <>
            <UserCheck size={14} className="text-emerald-400" />
            <span>HOD: {currentDepartment.name}</span>
          </>
        ) : (
          <>
            <User size={14} className="text-sky-400" />
            <span>Staff: {currentStaff.name}</span>
          </>
        )}
      </button>

      <span className="text-[10px] text-zinc-400 px-1 hidden sm:inline pointer-events-none">
        Drag to move
      </span>
    </div>
  )
}