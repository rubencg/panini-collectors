import { useState, useMemo } from 'react'
import { ALL_STICKERS, STICKER_BY_ID } from '../data.js'

function ChipButton({ stickerId, selected, onClick }) {
  const s = STICKER_BY_ID[stickerId]
  const code = stickerId.split('-')[0]
  const num = s ? String(s.num).padStart(2, '0') : (stickerId.split('-')[1] || '')
  const nameTail = s && s.num !== 0 && s.label ? ` ${s.label.split(' ').slice(-1)[0]}` : ''
  return (
    <button
      className={`swap-chip${selected ? ' swap-chip--selected' : ''}`}
      onClick={onClick}
      title={s?.label || stickerId}
    >
      <strong>{code}</strong> {num}{nameTail}
    </button>
  )
}

function BucketPanel({ label, stickers, selected, onToggle, accentColor }) {
  const grouped = useMemo(() => {
    const g = {}
    for (const s of stickers) {
      const code = s.id.split('-')[0]
      if (!g[code]) g[code] = []
      g[code].push(s.id)
    }
    return g
  }, [stickers])

  return (
    <div className="swap-modal-bucket">
      <div className="swap-modal-bucket-head">
        <span className="swap-modal-bucket-label" style={accentColor ? { color: accentColor } : {}}>
          {label}
        </span>
        <span className="swap-modal-bucket-count mono">
          {selected.size} / {stickers.length} selected
        </span>
      </div>
      {stickers.length === 0 ? (
        <div className="swap-modal-bucket-empty">No stickers available</div>
      ) : (
        <div className="swap-modal-chips">
          {Object.entries(grouped).map(([code, ids]) => (
            <div key={code} className="swap-modal-chip-group">
              <span className="swap-modal-chip-code mono">{code}</span>
              {ids.map(id => (
                <ChipButton
                  key={id}
                  stickerId={id}
                  selected={selected.has(id)}
                  onClick={() => onToggle(id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AccountTransferModal({ mode, initial, personData, onCancel, onSubmit }) {
  const otherAcctStickers = useMemo(() =>
    ALL_STICKERS.filter(s => personData?.[s.id]?.inOtherAccount),
    [personData]
  )

  const dupeStickers = useMemo(() =>
    ALL_STICKERS.filter(s => (personData?.[s.id]?.extra || 0) > 0),
    [personData]
  )

  const [selectedOtherAcct, setSelectedOtherAcct] = useState(
    () => new Set(initial?.otherAcctStickers || [])
  )
  const [selectedDupes, setSelectedDupes] = useState(
    () => new Set(initial?.dupeStickers || [])
  )
  const [submitting, setSubmitting] = useState(false)

  const toggle = (setter) => (id) => {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const canSubmit = selectedOtherAcct.size > 0 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        otherAcctStickers: [...selectedOtherAcct],
        dupeStickers: [...selectedDupes],
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="swap-modal" onClick={e => e.stopPropagation()}>
        <div className="swap-modal-header">
          <h3>{mode === 'create' ? 'New account transfer' : 'Edit account transfer'}</h3>
          <button className="swap-modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <div className="swap-modal-buckets">
          <BucketPanel
            label="2nd account stickers"
            stickers={otherAcctStickers}
            selected={selectedOtherAcct}
            onToggle={toggle(setSelectedOtherAcct)}
            accentColor="var(--warn)"
          />
          <BucketPanel
            label="My duplicates (reference)"
            stickers={dupeStickers}
            selected={selectedDupes}
            onToggle={toggle(setSelectedDupes)}
          />
        </div>

        <div className="swap-modal-footer">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? 'Saving…' : mode === 'create' ? 'Create transfer' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
