import { useState } from 'react'
import { ConfirmModal } from './ConfirmModal.jsx'
import { stickerLabelFromId } from '../data.js'

function StrikeChipGroup({ stickers, showNames }) {
  const grouped = {}
  for (const id of stickers) {
    const code = id.split('-')[0]
    if (!grouped[code]) grouped[code] = []
    const label = showNames ? stickerLabelFromId(id) : String(id.split('-')[1] || '').padStart(2, '0')
    grouped[code].push(label)
  }
  return (
    <div className="trade-stickers">
      {Object.entries(grouped).map(([code, labels]) => (
        <span className="trade-chip other-acct-chip" key={code}>
          <strong>{code}</strong>{' '}
          {labels.join(' · ')}
        </span>
      ))}
    </div>
  )
}

function ChipGroup({ stickers, showNames }) {
  const grouped = {}
  for (const id of stickers) {
    const code = id.split('-')[0]
    if (!grouped[code]) grouped[code] = []
    const label = showNames ? stickerLabelFromId(id) : String(id.split('-')[1] || '').padStart(2, '0')
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

export function AccountTransferCard({ transfer, onEdit, onDelete, onComplete }) {
  const { id, person, otherAcctStickers, dupeStickers } = transfer
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showNames, setShowNames] = useState(() => localStorage.getItem('swap-show-names') !== 'false')
  const toggleNames = () => setShowNames(v => {
    localStorage.setItem('swap-show-names', String(!v))
    return !v
  })

  return (
    <div className="swap-card acct-transfer-card">
      <div className="swap-card-head">
        <div className="swap-card-title">
          <span className="acct-transfer-title">
            <span className="swap-other-acct-badge">2nd acct</span>
            <span className="swap-arrow mono">→</span>
            <span>Main album</span>
          </span>
        </div>
        <span className="swap-status-badge swap-status-badge--pending">pending</span>
        <button
          className={`toggle-names-btn${showNames ? ' active' : ''}`}
          onClick={toggleNames}
          title={showNames ? 'Hide player names' : 'Show player names'}
          style={{ marginLeft: 8 }}
        >
          {showNames ? 'Names on' : 'Names off'}
        </button>
      </div>

      <div className="swap-card-cols">
        <div className="swap-col">
          <div className="swap-col-label">
            <span style={{ color: 'var(--warn)', fontFamily: 'var(--mono)', fontSize: 10.5 }}>
              2nd acct stickers
            </span>
            <span className="swap-col-count mono">({otherAcctStickers.length})</span>
          </div>
          {otherAcctStickers.length > 0
            ? <StrikeChipGroup stickers={otherAcctStickers} showNames={showNames} />
            : <span className="swap-col-empty">— none —</span>
          }
        </div>
        <div className="swap-col">
          <div className="swap-col-label">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5 }}>
              Duplicates (ref)
            </span>
            <span className="swap-col-count mono">({dupeStickers.length})</span>
          </div>
          {dupeStickers.length > 0
            ? <ChipGroup stickers={dupeStickers} showNames={showNames} />
            : <span className="swap-col-empty">— none —</span>
          }
        </div>
      </div>

      <div className="swap-card-actions">
        <button className="btn primary swap-btn-complete" onClick={() => onComplete(transfer)}>
          Complete
        </button>
        <button className="btn" onClick={() => onEdit(id)}>
          Edit
        </button>
        <button className="btn danger" onClick={() => setConfirmDelete(true)}>
          Delete
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          kind="delete-swap"
          swap={{ id, fromPerson: person, toPerson: 'main album', fromOffers: otherAcctStickers, toOffers: dupeStickers }}
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
