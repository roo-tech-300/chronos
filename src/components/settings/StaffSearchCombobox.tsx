import { useState, useRef, useEffect, useId } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useDebounce } from '../../hooks/useDebounce'
import { useStaffSearch } from '../../hooks/useStaffSearch'
import type { WorkspaceMemberRecord } from '../../types/tasks'

interface StaffSearchComboboxProps {
  workspaceId: string
  selectedMember: WorkspaceMemberRecord | null
  onSelect: (member: WorkspaceMemberRecord | null) => void
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
}

/**
 * Searchable staff picker that replaces the static `<Select>` dropdown.
 * Fetches 20 results per keystroke (debounced 300 ms) instead of
 * loading the entire workspace roster up-front.
 *
 * UX: click-outside to close (Rule 3), Escape to dismiss (Rule 3),
 * Arrow Up/Down + Enter keyboard navigation, debounced search (Rule 4).
 */
export function StaffSearchCombobox({
  workspaceId,
  selectedMember,
  onSelect,
  label = 'Staff Member',
  placeholder = 'Type to search staff...',
  required,
  error,
}: StaffSearchComboboxProps) {
  const comboboxId = useId()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const { results: searchResults, isFetching, error: searchError } =
    useStaffSearch(workspaceId, debouncedSearch)

  const filteredResults = searchResults.filter(
    (r) => r.memberId !== selectedMember?.memberId
  )

  // Click outside to close (Rule 3: overlay controls)
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        listRef.current &&
        !listRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // Escape key to dismiss (Rule 3: keyboard triggers)
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown)
      return () => document.removeEventListener('keydown', handleKeydown)
    }
  }, [isOpen])

  const displayValue = selectedMember
    ? `${selectedMember.name}${selectedMember.roleLabel ? ` (${selectedMember.roleLabel})` : ''}`
    : searchTerm

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setSearchTerm(val)
    if (selectedMember) onSelect(null)
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  function handleFocus() {
    if (searchTerm.length >= 2 || filteredResults.length > 0) setIsOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault()
      setIsOpen(true)
      return
    }
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((i) => (i + 1) % filteredResults.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((i) => (i - 1 + filteredResults.length) % filteredResults.length)
        break
      case 'Enter':
        e.preventDefault()
        selectHighlighted()
        break
    }
  }

  function selectHighlighted() {
    if (highlightedIndex >= 0 && highlightedIndex < filteredResults.length) {
      const member = filteredResults[highlightedIndex]
      onSelect(member)
      setSearchTerm('')
      setIsOpen(false)
    }
  }

  function handleClear() {
    onSelect(null)
    setSearchTerm('')
    setIsOpen(false)
    inputRef.current?.focus()
  }
  
  const inputClass = `peer w-full h-10 pl-3.5 pr-10 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${
    error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
  }`

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={comboboxId} className="text-xs font-semibold text-zinc-700 tracking-wide select-none">
          {label}
          {required && ' *'}
        </label>
      )}

      <div className="relative w-full">
        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={searchTerm ? '' : placeholder}
          className={inputClass}
          autoComplete="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />

        {selectedMember && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
            aria-label="Clear selection"
          >
            <X size={14} />
          </button>
        )}

        <div className="absolute right-3.5 flex items-center pointer-events-none text-zinc-400">
          <ChevronDown size={16} />
        </div>

        {isOpen && (
          <div
            ref={listRef}
            className="absolute inset-x-0 top-full mt-1 z-20 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredResults.length === 0 ? (
              <div className="p-3 text-xs text-zinc-500 text-center">
                {isFetching
                  ? 'Searching...'
                  : searchTerm.length < 2
                  ? 'Type at least 2 characters to search...'
                  : searchError
                  ? searchError
                  : 'No staff members found'}
              </div>
            ) : (
              filteredResults.map((member, index) => {
                const isHighlighted = index === highlightedIndex
                const initials =
                  member.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'U'

                return (
                  <button
                    key={member.memberId}
                    type="button"
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      isHighlighted
                        ? 'bg-[#7c007e]/10 text-zinc-900'
                        : 'hover:bg-zinc-50 text-zinc-900'
                    } ${index === 0 ? 'rounded-t-xl' : ''} ${
                      index === filteredResults.length - 1 ? 'rounded-b-xl' : ''
                    }`}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => {
                      onSelect(member)
                      setSearchTerm('')
                      setIsOpen(false)
                    }}
                  >
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#7c007e]/10 text-[#7c007e] font-bold text-[10px] flex items-center justify-center">
                        {initials}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold truncate">{member.name}</span>
                      <span className="text-[10px] text-zinc-500 truncate">
                        {member.roleLabel || member.department}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}