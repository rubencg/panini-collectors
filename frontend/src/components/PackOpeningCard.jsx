import { useState } from 'react'
import { STICKER_BY_ID } from '../data.js'

function chipLabel(id) {
  const s = STICKER_BY_ID[id]
  if (!s) return id
  const num = String(s.num).padStart(2, '0')
  const tail = s.num !== 0 && s.label ? ` ${s.label.split(' ').slice(-1)[0]}` : ''
  return `${s.code} ${num}${tail}`
}

function MiniPile({ label, color, ids }) {
  if (ids.length === 0) return null

  // Count duplicates for dupe pile display
  const counts = {}
  for (const id of ids) counts[id] = (counts[id] || 0) + 1
  const uniqueIds = [...new Set(ids)]

  return (
    <div className="po-card-pile">
      <span className="po-card-pile-label" style={{ color }}>{label}</span>
      <div className="trade-stickers" style={{ marginTop: 4 }}>
        {uniqueIds.map(id => {
          const s = STICKER_BY_ID[id]
          const code = id.split('-')[0]
          const num = s ? String(s.num).padStart(2, '0') : (id.split('-')[1] || '')
          const tail = s && s.num !== 0 && s.label ? ` ${s.label.split(' ').slice(-1)[0]}` : ''
          const countBadge = counts[id] > 1 ? ` ×${counts[id]}` : ''
          return (
            <span className="trade-chip" key={id} style={{ fontSize: 11 }}>
              <strong>{code}</strong> {num}{tail}{countBadge}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function PackOpeningCard({ packOpening, onEdit, onDelete, onComplete }) {
  const { id, person, albumItems, dupesItems, otherAcctItems, createdAt } = packOpening
  const [confirmDelete, setConfirmDelete] = useState(false)

  const total = albumItems.length + dupesItems.length + otherAcctItems.length
  const date = new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  if (confirmDelete) {
    return (
      <div className="swap-card acct-transfer-card">
        <div className="swap-card-head">
          <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
            Delete this pack opening ({total} sticker{total !== 1 ? 's' : ''})?
          </span>
        </div>
        <div className="swap-card-actions">
          <button className="btn danger" onClick={() => { setConfirmDelete(false); onDelete(id) }}>
            Delete
          </button>
          <button className="btn ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="swap-card acct-transfer-card">
      <div className="swap-card-head">
        <div className="swap-card-title">
          <span style={{ fontWeight: 700, fontSize: 13 }}>Pack Opening</span>
          <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 8 }}>
            {date}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono" style={{ color: 'var(--ink-dim)', fontSize: 11 }}>
            {total} sticker{total !== 1 ? 's' : ''}
          </span>
          <span className="swap-status-badge swap-status-badge--pending">pending</span>
        </div>
      </div>

      <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MiniPile label="→ Album" color="var(--mint)" ids={albumItems} />
        <MiniPile label="→ 2nd Account" color="var(--warn)" ids={otherAcctItems} />
        <MiniPile label="→ Dupes" color="var(--cyan)" ids={dupesItems} />
      </div>

      <div className="swap-card-actions">
        <button className="btn primary swap-btn-complete" onClick={() => onComplete(packOpening)}>
          Complete
        </button>
        <button className="btn" onClick={() => onEdit(id)}>
          Edit
        </button>
        <button className="btn danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>
    </div>
  )
}
