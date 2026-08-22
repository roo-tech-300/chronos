import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = '',
}: PaginationProps) {
  function getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = []
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  const startItem = itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined
  const endItem =
    itemsPerPage && totalItems
      ? Math.min(currentPage * itemsPerPage, totalItems)
      : undefined

  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 flex-wrap text-sm text-zinc-600 ${className}`}
    >
      {totalItems !== undefined ? (
        <span className="text-xs text-zinc-500 font-medium">
          {startItem && endItem ? (
            <>
              Showing <span className="font-semibold text-zinc-800">{startItem}</span> to{' '}
              <span className="font-semibold text-zinc-800">{endItem}</span> of{' '}
              <span className="font-semibold text-zinc-800">{totalItems}</span> results
            </>
          ) : (
            <>
              Total <span className="font-semibold text-zinc-800">{totalItems}</span> items
            </>
          )}
        </span>
      ) : (
        <div />
      )}

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 transition-all cursor-pointer"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((p, i) =>
          typeof p === 'number' ? (
            <button
              key={i}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[36px] h-9 px-2.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="px-2 text-zinc-400 select-none text-xs">
              ...
            </span>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 transition-all cursor-pointer"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
