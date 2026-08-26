export interface TabItem {
  id: string
  label: string
  count?: number
}

export interface TabsProps {
  tabs: readonly (string | TabItem)[] | (string | TabItem)[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'pill' | 'segmented' | 'underline'
  className?: string
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  className = '',
}: TabsProps) {
  const normalizedTabs: TabItem[] = tabs.map((t) =>
    typeof t === 'string' ? { id: t, label: t } : t
  )

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center p-1 bg-zinc-100/90 border border-zinc-200/60 rounded-xl gap-1 ${className}`}
      >
        {normalizedTabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200/70 text-zinc-700">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {normalizedTabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isActive
                ? 'bg-[#7c007e] border-[#7c007e] text-white shadow-xs'
                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-purple-50/50 hover:text-zinc-900'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-[#570058] text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
