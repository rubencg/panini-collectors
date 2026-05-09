import { useState } from 'react'
import { ConfirmModal } from './ConfirmModal.jsx'
import { stickerLabelFromId } from '../data.js'

function ChipGroup({ stickers, showNames }) {
  // Group by team code
  const grouped = {}
  for (const id of stickers) {
    const code = id.split('-')[0]
    if (!grouped[code]) grouped[code] = []
    const label = showNames
      ? stickerLabelFromId(id)
      : String(id.split('-')[1] || '').padStart(2, '0')
    grouped[code].push(label)
  }
  return (
    <div className="trade-stickers">
      {Object.entries(grouped).map(([code, labels]) => (
        <span className="trade-chip" key={code}>
          <strong>{code}</strong> {labels.join(' · ')}
        </span>
      ))}
    </div>
  )
}

export function SwapRequestCard({ swap, activePerson, onEdit, onDelete, onComplete }) {
  const { id, fromPerson, toPerson, status, fromOffers, toOffers } = swap
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showNames, setShowNames] = useState(() => localStorage.getItem('swap-show-names') !== 'false')
  const toggleNames = () => setShowNames(v => {
    localStorage.setItem('swap-show-names', String(!v))
    return !v
  })

  const isCompleted = status === 'completed'

  return (
    <div className={`swap-card${isCompleted ? ' swap-card--completed' : ''}`}>
      {/* Header */}
      <div className="swap-card-head">
        <div className="swap-card-title">
          <span className="swap-card-person">
            {fromPerson === activePerson && <span className="swap-you-pill">you</span>}
            <span className="trade-pair-head from">
              <span className="badge mono">{fromPerson.slice(0, 2).toUpperCase()}</span>
              {fromPerson}
            </span>
          </span>
          <span className="swap-arrow mono">⇄</span>
          <span className="swap-card-person">
            {toPerson === activePerson && <span className="swap-you-pill">you</span>}
            <span className="trade-pair-head to">
              <span className="badge mono">{toPerson.slice(0, 2).toUpperCase()}</span>
              {toPerson}
            </span>
          </span>
        </div>
        {isCompleted && (
          <span className="swap-status-badge swap-status-badge--completed">Completed ✓</span>
        )}
        {!isCompleted && (
          <span className="swap-status-badge swap-status-badge--pending">pending</span>
        )}
        <button
          className={`toggle-names-btn${showNames ? ' active' : ''}`}
          onClick={toggleNames}
          title={showNames ? 'Hide player names' : 'Show player names'}
          style={{ marginLeft: 8 }}
        >
          {showNames ? 'Names on' : 'Names off'}
        </button>
      </div>

      {/* Two columns */}
      <div className="swap-card-cols">
        <div className="swap-col">
          <div className="swap-col-label">
            <span className="badge mono">{fromPerson.slice(0, 2).toUpperCase()}</span>
            <span>{fromPerson} offers</span>
            <span className="swap-col-count mono">({fromOffers.length})</span>
          </div>
          {fromOffers.length > 0
            ? <ChipGroup stickers={fromOffers} showNames={showNames} />
            : <span className="swap-col-empty">— nothing —</span>
          }
        </div>
        <div className="swap-col">
          <div className="swap-col-label">
            <span className="badge mono">{toPerson.slice(0, 2).toUpperCase()}</span>
            <span>{toPerson} offers</span>
            <span className="swap-col-count mono">({toOffers.length})</span>
          </div>
          {toOffers.length > 0
            ? <ChipGroup stickers={toOffers} showNames={showNames} />
            : <span className="swap-col-empty">— nothing —</span>
          }
        </div>
      </div>

      {/* Footer actions */}
      <div className="swap-card-actions">
        {!isCompleted && (
          <button className="btn primary swap-btn-complete" onClick={() => onComplete(swap)}>
            Complete
          </button>
        )}
        {!isCompleted && (
          <button className="btn" onClick={() => onEdit(id)}>
            Edit
          </button>
        )}
        <button className="btn danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          kind="delete-swap"
          swap={swap}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false)
            onDelete(id)
          }}
        />
      )}
    </div>
  )
}
