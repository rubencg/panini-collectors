import { useState, useMemo, useEffect } from 'react'
import { PEOPLE, STICKER_BY_ID, STICKERS_PER_TEAM, FWC_COUNT, TROPHY_TOUR_COUNT } from '../data.js'

function ownedCountForCode(personData, code) {
  let owned = 0, total
  if (code === 'FWC' || code === 'TT') {
    total = code === 'FWC' ? FWC_COUNT : TROPHY_TOUR_COUNT
    for (let i = 1; i <= total; i++) {
      const s = personData?.[`${code}-${i}`]
      if ((s?.count || 0) >= 1 || s?.inOtherAccount) owned++
    }
  } else {
    total = STICKERS_PER_TEAM
    for (let i = 0; i < total; i++) {
      const s = personData?.[`${code}-${i}`]
      if ((s?.count || 0) >= 1 || s?.inOtherAccount) owned++
    }
  }
  return { owned, total }
}

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

function BucketPanel({ label, candidates, staleIds, selected, onToggle, countLabel, personData }) {
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
          {Object.entries(grouped).map(([code, ids]) => {
            const { owned, total } = ownedCountForCode(personData, code)
            const oneLeft = owned === total - 1
            return (
            <div key={code} className="swap-modal-chip-group">
              <span className="swap-modal-chip-code mono">{code}</span>
              <span className={`swap-modal-chip-progress mono${oneLeft ? ' swap-modal-chip-progress--near' : ''}`}>{owned}/{total}</span>
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
            )
          })}
        </div>
      )}
    </div>
  )
}

export function SwapRequestModal({ mode, initial, activePerson, tradeMatches, people, onCancel, onSubmit }) {
  const otherPeople = PEOPLE.filter(p => p !== activePerson)

  // When activePerson is the toPerson (swap was created by the other side), flip perspective
  const flipped = !!initial && initial.toPerson === activePerson

  const [otherBro, setOtherBro] = useState(flipped ? initial.fromPerson : (initial?.toPerson || null))
  const [fromOffers, setFromOffers] = useState(() => new Set(flipped ? initial.toOffers : (initial?.fromOffers || [])))
  const [toOffers, setToOffers] = useState(() => new Set(flipped ? initial.fromOffers : (initial?.toOffers || [])))
  const [fromForOtherAccount, setFromForOtherAccount] = useState(flipped ? (initial?.toForOtherAccount || false) : (initial?.fromForOtherAccount || false))
  const [toForOtherAccount, setToForOtherAccount] = useState(flipped ? (initial?.fromForOtherAccount || false) : (initial?.toForOtherAccount || false))
  const [submitting, setSubmitting] = useState(false)

  // When otherBro changes in create mode, reset selections
  useEffect(() => {
    if (mode === 'create') {
      setFromOffers(new Set())
      setToOffers(new Set())
    }
  }, [otherBro, mode])

  // In edit mode, add back this swap's own committed stickers so they don't
  // falsely appear stale (they were excluded from tradeMatches because they're
  // committed, but that commitment will be replaced when the edit is saved)
  const fromCandidates = useMemo(() => {
    const base = otherBro ? (tradeMatches[`${activePerson}|${otherBro}`] || []) : []
    if (mode !== 'edit' || !initial) return base
    const ownIds = flipped ? initial.toOffers : initial.fromOffers
    const baseIds = new Set(base.map(s => s.id))
    const ownMissing = ownIds
      .filter(id => !baseIds.has(id))
      .map(id => STICKER_BY_ID[id])
      .filter(Boolean)
    return [...base, ...ownMissing]
  }, [otherBro, tradeMatches, activePerson, mode, initial, flipped])

  const toCandidates = useMemo(() => {
    const base = otherBro ? (tradeMatches[`${otherBro}|${activePerson}`] || []) : []
    if (mode !== 'edit' || !initial) return base
    const ownIds = flipped ? initial.fromOffers : initial.toOffers
    const baseIds = new Set(base.map(s => s.id))
    const ownMissing = ownIds
      .filter(id => !baseIds.has(id))
      .map(id => STICKER_BY_ID[id])
      .filter(Boolean)
    return [...base, ...ownMissing]
  }, [otherBro, tradeMatches, activePerson, mode, initial, flipped])

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
        fromForOtherAccount,
        toForOtherAccount,
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
          <>
            <div className="swap-modal-buckets">
              <BucketPanel
                label={`${activePerson} offers`}
                candidates={fromCandidates}
                staleIds={staleFromIds}
                selected={fromOffers}
                onToggle={toggleFrom}
                countLabel={`${fromOffers.size} / ${fromCandidates.length + staleFromIds.length}`}
                personData={people?.[otherBro] || {}}
              />
              <BucketPanel
                label={`${otherBro} offers`}
                candidates={toCandidates}
                staleIds={staleToIds}
                selected={toOffers}
                onToggle={toggleTo}
                countLabel={`${toOffers.size} / ${toCandidates.length + staleToIds.length}`}
                personData={people?.[activePerson] || {}}
              />
            </div>
            <div className="swap-modal-other-acct-row">
              <label className="swap-modal-other-acct-check">
                <input
                  type="checkbox"
                  checked={toForOtherAccount}
                  onChange={e => setToForOtherAccount(e.target.checked)}
                />
                <span>&#8594; {otherBro}&apos;s 2nd account</span>
              </label>
              <label className="swap-modal-other-acct-check">
                <input
                  type="checkbox"
                  checked={fromForOtherAccount}
                  onChange={e => setFromForOtherAccount(e.target.checked)}
                />
                <span>&#8594; {activePerson}&apos;s 2nd account</span>
              </label>
            </div>
          </>
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
