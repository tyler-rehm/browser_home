import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { readableForeground } from '../color'
import { host } from '../records'

export function DroppableTab({ id, label, selected, onSelect }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tab:${id}` })
  return (
    <button
      ref={setNodeRef}
      id={`tab-${id}`}
      className={isOver ? 'link-tab is-over' : 'link-tab'}
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls="link-panel"
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
    >
      {label}
    </button>
  )
}

export function SortableQuickLink(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.link.id,
  })
  return (
    <QuickLinkCard
      {...props}
      setNodeRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      dragging={isDragging}
      handleProps={{ ...attributes, ...listeners }}
    />
  )
}

export function QuickLinkOverlay(props) {
  return <QuickLinkCard {...props} overlay />
}

function StarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2.8 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.2 6.8 19l1-5.9-4.3-4.1 5.9-.8L12 2.8Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function QuickLinkCard({
  link,
  fill,
  linkTarget,
  dragging = false,
  overlay = false,
  setNodeRef,
  style,
  handleProps,
  onFavorite,
  onEdit,
  onArchive,
  onRemove,
  onMoveKey,
}) {
  const favoriteLabel = link.favorite
    ? `Remove ${link.name} from Favorites`
    : `Add ${link.name} to Favorites`
  const className = overlay
    ? 'link-card is-overlay'
    : dragging
      ? 'link-card is-dragging'
      : 'link-card'
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      aria-hidden={overlay ? true : undefined}
    >
      <button
        className="move-link"
        type="button"
        aria-label={`Reorder ${link.name}`}
        data-tip="Drag, or press the arrow keys"
        aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
        {...handleProps}
        onKeyDown={(event) => {
          handleProps?.onKeyDown?.(event)
          onMoveKey?.(event)
        }}
      >
        <svg viewBox="0 0 10 16" aria-hidden="true">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="8" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="2" cy="14" r="1.2" />
          <circle cx="8" cy="14" r="1.2" />
        </svg>
      </button>
      <a className="link-open" href={link.url} {...linkTarget}>
        <span className="link-icon" style={{ background: fill, color: readableForeground(fill) }}>
          {link.icon ? (
            <img src={link.icon} alt="" />
          ) : (
            link.short || link.name.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className="link-copy">
          <strong>{link.name}</strong>
          <small>{host(link.url)}</small>
        </span>
      </a>
      <button
        className="star-link"
        type="button"
        aria-pressed={link.favorite}
        aria-label={favoriteLabel}
        data-tip={favoriteLabel}
        onClick={onFavorite}
      >
        <StarIcon filled={link.favorite} />
      </button>
      <button
        className="edit-link"
        type="button"
        aria-label={`Edit ${link.name}`}
        data-tip={`Edit ${link.name}`}
        onClick={onEdit}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M11.2 1.8 14.2 4.8 5.5 13.5 2 14.2 2.7 10.7 11.2 1.8Z" />
        </svg>
      </button>
      <button
        className="archive-link"
        type="button"
        aria-label={`Archive ${link.name}`}
        data-tip={`Archive ${link.name}`}
        onClick={onArchive}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 3h12v2H2z" />
          <path d="M3 6h10v7H3z" />
        </svg>
      </button>
      <button
        className="remove-link"
        type="button"
        aria-label={`Remove ${link.name}`}
        data-tip={`Remove ${link.name}`}
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  )
}
