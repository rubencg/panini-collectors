import { useState, useMemo, useEffect } from 'react'
import { PEOPLE, STICKER_BY_ID } from '../data.js'

function ChipButton({ stickerId, selected, stale, onClick }) {
  const s = STICKER_BY_ID[stickerId]
  const code = stickerId.split('-')[0]
  const num = s ? String(s.num).padStart(2, '0') : (stickerId.split('-')[1] || '')
  const nameTail = s && s.num !== 0 && s.label
    ? ` ${s.label.split(' ').slice(-1)[0]}`
    : ''
  const tooltip = stale
    ? 'No longer a valid trade — sticker may have changed hands'
    : (s?.label || stickerId)

  return (
    <button
      className={`swap-chip${selected ? ' swap-chip--selected' : ''}${stale ? ' swap-chip--stale' : ''}`}
      onClick={onClick}
      title={tooltip}
    >
      <strong>{code}</strong> {num}{nameTail}
    </button>
  )
}

function BucketPanel({ label, candidates, staleIds, selected, onToggle, countLabel }) {
  // Group candidates + stale items by team code for display
  const allIds = useMemo(() => {
    const ids = new Set([...candidates.map(s => s.id), ...staleIds])
    return [...ids]
  }, [candidates, staleIds])

  const grouped = useMemo(() => {
    const g = {}
    for (const id of allIds) {
      const code = id.split('-')[0]
      if (!g[code]) g[code] = []
      g[code].push(id)
    }
    return g
  }, [allIds])

  const candidateSet = useMemo(() => new Set(candidates.map(s => s.id)), [candidates])

  return (
    <div className="swap-modal-bucket">
      <div className="swap-modal-bucket-head">
        <span className="swap-modal-bucket-label">{label}</span>
        <span className="swap-modal-bucket-count mono">
          {selected.size} / {allIds.length} selected
        </span>
      </div>
      {allIds.length === 0 ? (
        <div className="swap-modal-bucket-empty">No trade candidates with this bro</div>
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
                  stale={!candidateSet.has(id)}
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

export function SwapRequestModal({ mode, initial, activePerson, tradeMatches, onCancel, onSubmit }) {
  const otherPeople = PEOPLE.filter(p => p !== activePerson)

  const [otherBro, setOtherBro] = useState(initial?.toPerson || null)
  const [fromOffers, setFromOffers] = useState(() => new Set(initial?.fromOffers || []))
  const [toOffers, setToOffers] = useState(() => new Set(initial?.toOffers || []))
  const [submitting, setSubmitting] = useState(false)

  // When otherBro changes in create mode, reset selections
  useEffect(() => {
    if (mode === 'create') {
      setFromOffers(new Set())
      setToOffers(new Set())
    }
  }, [otherBro, mode])

  const fromCandidates = otherBro ? (tradeMatches[`${activePerson}|${otherBro}`] || []) : []
  const toCandidates = otherBro ? (tradeMatches[`${otherBro}|${activePerson}`] || []) : []

  // Stale IDs: in initial but no longer a valid candidate
  const staleFromIds = useMemo(() => {
    if (mode !== 'edit' || !initial?.fromOffers) return []
    const candidateIds = new Set(fromCandidates.map(s => s.id))
    return initial.fromOffers.filter(id => !candidateIds.has(id))
  }, [mode, initial, fromCandidates])

  const staleToIds = useMemo(() => {
    if (mode !== 'edit' || !initial?.toOffers) return []
    const candidateIds = new Set(toCandidates.map(s => s.id))
    return initial.toOffers.filter(id => !candidateIds.has(id))
  }, [mode, initial, toCandidates])

  const toggleFrom = (id) => {
    setFromOffers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleTo = (id) => {
    setToOffers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const canSubmit = otherBro && (fromOffers.size + toOffers.size > 0) && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        fromPerson: activePerson,
        toPerson: otherBro,
        fromOffers: [...fromOffers],
        toOffers: [...toOffers],
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="swap-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="swap-modal-header">
          <h3>{mode === 'create' ? 'New swap request' : 'Edit swap request'}</h3>
          <button className="swap-modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        {/* Counterparty picker */}
        <div className="swap-modal-section">
          <div className="swap-modal-section-label">
            {mode === 'create' ? 'Pick the other bro' : 'Swap with'}
          </div>
          {mode === 'edit' ? (
            <div className="swap-modal-locked-bro">
              <span className="badge mono">{otherBro?.slice(0, 2).toUpperCase()}</span>
              {otherBro}
            </div>
          ) : (
            <div className="swap-modal-bro-picker">
              {otherPeople.map(p => (
                <button
                  key={p}
                  className={`swap-modal-bro-btn${otherBro === p ? ' active' : ''}`}
                  onClick={() => setOtherBro(p)}
                >
                  <span className="badge mono">{p.slice(0, 2).toUpperCase()}</span>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buckets */}
        {otherBro && (
          <div className="swap-modal-buckets">
            <BucketPanel
              label={`${activePerson} offers`}
              candidates={fromCandidates}
              staleIds={staleFromIds}
              selected={fromOffers}
              onToggle={toggleFrom}
              countLabel={`${fromOffers.size} / ${fromCandidates.length + staleFromIds.length}`}
            />
            <BucketPanel
              label={`${otherBro} offers`}
              candidates={toCandidates}
              staleIds={staleToIds}
              selected={toOffers}
              onToggle={toggleTo}
              countLabel={`${toOffers.size} / ${toCandidates.length + staleToIds.length}`}
            />
          </div>
        )}

        {/* Footer */}
        <div className="swap-modal-footer">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting
              ? 'Saving…'
              : mode === 'create' ? 'Request' : 'Save changes'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
