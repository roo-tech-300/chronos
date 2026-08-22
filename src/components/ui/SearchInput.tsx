import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Search...', className = '', ...props }, ref) => {
    const hasValue = Boolean(value && String(value).length > 0)

    return (
      <div className="relative flex items-center w-full min-w-[200px]">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-zinc-400">
          <Search size={16} />
        </div>
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full h-10 pl-10 pr-9 text-sm bg-white border border-zinc-200 rounded-xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all ${className}`}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 text-zinc-400 hover:text-zinc-600 rounded-full transition-colors"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
