import type { VaultItem } from '../types'
import { getFaviconUrl, getPasswordAge } from '../lib/utils'

type ItemCardProps = {
  item: VaultItem
  onOpen: (item: VaultItem) => void
  onCopyUsername: (item: VaultItem) => void
  onCopyPassword: (item: VaultItem) => void
}

export function ItemCard({ item, onOpen, onCopyUsername, onCopyPassword }: ItemCardProps) {
  const faviconUrl = item.website ? getFaviconUrl(item.website) : ''
  const age = getPasswordAge(item.updatedAt)

  return (
    <article
      className="item-card"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
    >
      <div className="item-card-left">
        {faviconUrl ? (
          <img
            src={faviconUrl}
            alt=""
            width={32}
            height={32}
            className="favicon-lg"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="favicon-placeholder">{item.title[0]?.toUpperCase() ?? '?'}</div>
        )}
        <div className="item-card-info">
          <h3>{item.title}</h3>
          <p>{item.username}</p>
          {age > 180 && <span className="age-badge">Outdated</span>}
        </div>
      </div>
      <div className="item-card-right" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="secondary small" onClick={() => onCopyUsername(item)}>
          User
        </button>
        <button type="button" className="secondary small" onClick={() => onCopyPassword(item)}>
          PW
        </button>
      </div>
    </article>
  )
}
