import type { SortOrder } from '../types'

type TopBarProps = {
  query: string
  onQueryChange: (value: string) => void
  sortOrder: SortOrder
  onSortChange: (value: SortOrder) => void
  lockMinutes: number
  onLockMinutesChange: (value: number) => void
  onAdd: () => void
}

export function TopBar({
  query,
  onQueryChange,
  sortOrder,
  onSortChange,
  lockMinutes,
  onLockMinutesChange,
  onAdd,
}: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="search-wrap">
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search entries…"
        />
        {query && (
          <button type="button" className="clear-search" onClick={() => onQueryChange('')} aria-label="Clear search">×</button>
        )}
      </div>
      <select value={sortOrder} onChange={(e) => onSortChange(e.target.value as SortOrder)} className="bar-select">
        <option value="alpha">A–Z</option>
        <option value="recent">Recent</option>
      </select>
      <select value={lockMinutes} onChange={(e) => onLockMinutesChange(Number(e.target.value))} className="bar-select">
        <option value={1}>1 min</option>
        <option value={3}>3 min</option>
        <option value={5}>5 min</option>
        <option value={15}>15 min</option>
        <option value={30}>30 min</option>
      </select>
      <button type="button" className="add-btn" onClick={onAdd}>+ Add</button>
    </header>
  )
}
