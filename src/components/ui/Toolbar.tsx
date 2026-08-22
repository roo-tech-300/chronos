import type { ReactNode, ChangeEvent } from 'react'
import { SearchInput } from './SearchInput'
import { Tabs, type TabItem } from './Tabs'

export interface ToolbarSearchProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  width?: string
}

export interface ToolbarTabsProps {
  tabs: readonly (string | TabItem)[] | (string | TabItem)[]
  activeTab: string
  onChange: (tabId: string) => void
  variant?: 'pill' | 'segmented' | 'underline'
}

export interface ToolbarProps {
  id?: string
  className?: string
  variant?: 'default' | 'card' | 'transparent'
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
  search?: ToolbarSearchProps
  tabs?: ToolbarTabsProps
  leftContent?: ReactNode
  rightContent?: ReactNode
  children?: ReactNode
}

export function Toolbar({
  id,
  className = '',
  variant = 'default',
  primaryAction,
  secondaryAction,
  search,
  tabs,
  leftContent,
  rightContent,
  children,
}: ToolbarProps) {
  const containerStyles =
    variant === 'card'
      ? 'flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm gap-4'
      : 'flex flex-col md:flex-row md:items-center justify-between gap-4'

  const hasLeft = Boolean(primaryAction || secondaryAction || search || leftContent)
  const hasRight = Boolean(tabs || rightContent)

  return (
    <div id={id} className={`${containerStyles} ${className}`}>
      {children ? (
        children
      ) : (
        <>
          {hasLeft && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
              {primaryAction}
              {secondaryAction}
              {search && (
                <div className={search.width ?? 'w-full sm:w-64 md:w-72'}>
                  <SearchInput
                    placeholder={search.placeholder ?? 'Search...'}
                    value={search.value}
                    onChange={search.onChange}
                    onClear={search.onClear}
                    className={search.className}
                  />
                </div>
              )}
              {leftContent}
            </div>
          )}

          {hasRight && (
            <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
              {tabs && (
                <Tabs
                  tabs={tabs.tabs}
                  activeTab={tabs.activeTab}
                  onChange={tabs.onChange}
                  variant={tabs.variant ?? 'pill'}
                />
              )}
              {rightContent}
            </div>
          )}
        </>
      )}
    </div>
  )
}
