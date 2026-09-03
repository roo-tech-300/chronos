import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, User, Check, X } from 'lucide-react'
import { useWorkspaceRoster } from '../../hooks/useWorkspaceRoster'
import { useWorkspace } from '../../context/useWorkspace'

interface LeadPickerProps {
  value: string
  leadMemberId?: string | null
  onChange: (selected: { name: string; memberId?: string; roleLabel?: string; email?: string }) => void
  workspaceId?: string
}

export default function LeadPicker({ value, onChange, workspaceId }: LeadPickerProps) {
  const { currentWorkspace } = useWorkspace()
  const activeWorkspaceId = workspaceId || currentWorkspace?.id || ''
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const { roster, isLoading } = useWorkspaceRoster(activeWorkspaceId)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roster
    return roster.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.roleLabel.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)),
    )
  }, [roster, search])

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          className="w-full h-11 pl-10 pr-9 bg-zinc-50/50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#7c007e] focus:outline-none text-[14px] text-zinc-900 placeholder:text-zinc-400"
          placeholder={value ? value : 'Search staff members or enter name...'}
          value={isOpen ? search : value}
          onFocus={() => {
            setSearch(value)
            setIsOpen(true)
          }}
          onChange={(e) => {
            setSearch(e.target.value)
            onChange({ name: e.target.value })
          }}
        />
        {value && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
            onClick={() => {
              setSearch('')
              onChange({ name: '', memberId: undefined, roleLabel: '', email: '' })
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-56 overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {isLoading && <div className="p-3 text-xs text-zinc-400 text-center">Loading roster...</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-3 text-xs text-zinc-500 text-center">
              {search.trim() ? `Use custom name "${search}"` : 'No staff members registered.'}
            </div>
          )}
          {!isLoading &&
            filtered.map((member) => {
              const isSelected = value === member.name
              return (
                <button
                  key={member.memberId}
                  type="button"
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-sm transition-colors cursor-pointer ${
                    isSelected ? 'bg-purple-50 text-purple-900 font-medium' : 'hover:bg-zinc-100 text-zinc-800'
                  }`}
                  onClick={() => {
                    onChange({
                      name: member.name,
                      memberId: member.memberId,
                      roleLabel: member.roleLabel,
                      email: member.email,
                    })
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {member.name.slice(0, 2).toUpperCase() || <User size={14} />}
                    </div>
                    <div className="truncate">
                      <p className="font-semibold text-xs leading-tight truncate">{member.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {member.roleLabel} · {member.department}
                      </p>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-[#7c007e] flex-shrink-0" />}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
