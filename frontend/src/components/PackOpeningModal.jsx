import { useState, useMemo, useRef, useEffect } from 'react'
import { ALL_STICKERS, STICKER_BY_ID, normalize } from '../data.js'

function stickerStatus(personData, id) {
  const d = personData?.[id]
  return {
    inAlbum: (d?.count || 0) >= 1,
    inOtherAccount: d?.inOtherAccount || false,
    dupeCount: d?.extra || 0,
  }
}

function statusLabel({ inAlbum, inOtherAccount, dupeCount }) {
  const parts = []
  if (inAlbum) parts.push('In album ✓')
  if (inOtherAccount) parts.push('In 2nd acct')
  if (dupeCount > 0) parts.push(`${dupeCount} dupe${dupeCount > 1 ? 's' : ''}`)
  if (parts.length === 0) parts.push('Not collected')
  return parts.join(' · ')
}

function suggestedPile({ inAlbum, inOtherAccount }) {
  return (inAlbum || inOtherAccount) ? 'dupe' : '2nd-acct'
}

function chipLabel(s) {
  const num = String(s.num).padStart(2, '0')
  const tail = s.num !== 0 && s.label ? ` ${s.label.split(' ').slice(-1)[0]}` : ''
  return `${num}${tail}`
}

function SetPile({ title, ids, color, onRemove }) {
  const stickers = [...ids].map(id => STICKER_BY_ID[id]).filter(Boolean)
  return (
    <div className="pack-pile">
      <div className="pack-pile-header">
        <span style={{ color }}>{title}</span>
        <span className="mono pack-pile-count">({ids.size})</span>
      </div>
      {ids.size === 0 ? (
        <div className="pack-pile-empty">// empty</div>
      ) : (
        <div className="pack-pile-chips">
          {stickers.map(s => (
            <span key={s.id} className="pack-pile-chip">
              <strong>{s.code}</strong> {chipLabel(s)}
              {onRemove && (
                <button className="pack-pile-chip-remove" onClick={() => onRemove(s.id)}>✕</button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function DupePile({ title, ids, color, onRemove }) {
  const counts = useMemo(() => {
    const c = {}
    for (const id of ids) c[id] = (c[id] || 0) + 1
    return c
  }, [ids])

  const uniqueStickers = useMemo(() =>
    Object.keys(counts).map(id => STICKER_BY_ID[id]).filter(Boolean),
    [counts]
  )

  return (
    <div className="pack-pile">
      <div className="pack-pile-header">
        <span style={{ color }}>{title}</span>
        <span className="mono pack-pile-count">({ids.length})</span>
      </div>
      {ids.length === 0 ? (
        <div className="pack-pile-empty">// empty</div>
      ) : (
        <div className="pack-pile-chips">
          {uniqueStickers.map(s => (
            <span key={s.id} className="pack-pile-chip">
              <strong>{s.code}</strong> {chipLabel(s)}
              {counts[s.id] > 1 && (
                <span className="pack-pile-chip-count">×{counts[s.id]}</span>
              )}
              {onRemove && (
                <button className="pack-pile-chip-remove" onClick={() => onRemove(s.id)}>✕</button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function PackOpeningModal({ mode, initial, personData, onCancel, onSave, submitting }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [stagedAlbum, setStagedAlbum] = useState(
    () => new Set(initial?.albumItems || [])
  )
  const [stagedDupes, setStagedDupes] = useState(
    () => [...(initial?.dupesItems || [])]
  )
  const [staged2ndAcct, setStaged2ndAcct] = useState(
    () => new Set(initial?.otherAcctItems || [])
  )
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const searchResults = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const qn = normalize(q).toLowerCase()
    return ALL_STICKERS.filter(s =>
      normalize(s.id).toLowerCase().includes(qn) ||
      normalize(s.label || '').toLowerCase().includes(qn) ||
      normalize(s.code || '').toLowerCase().includes(qn)
    ).slice(0, 40)
  }, [query])

  const groupedResults = useMemo(() => {
    const g = {}
    for (const s of searchResults) {
      if (!g[s.code]) g[s.code] = []
      g[s.code].push(s)
    }
    return g
  }, [searchResults])

  const selectedSticker = selected ? STICKER_BY_ID[selected] : null
  const selectedStatus = selected ? stickerStatus(personData, selected) : null

  const addToStaged = (id, pile) => {
    if (pile === 'album') setStagedAlbum(prev => new Set([...prev, id]))
    else if (pile === 'dupe') setStagedDupes(prev => [...prev, id])
    else setStaged2ndAcct(prev => new Set([...prev, id]))
    setSelected(null)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const removeFromAlbum = (id) => setStagedAlbum(prev => { const n = new Set(prev); n.delete(id); return n })
  const removeFromDupes = (id) => setStagedDupes(prev => {
    const idx = prev.lastIndexOf(id)
    return idx === -1 ? prev : prev.filter((_, i) => i !== idx)
  })
  const removeFrom2ndAcct = (id) => setStaged2ndAcct(prev => { const n = new Set(prev); n.delete(id); return n })

  const canSave = (stagedAlbum.size > 0 || stagedDupes.length > 0 || staged2ndAcct.size > 0) && !submitting

  const handleSave = () => {
    if (!canSave) return
    onSave({
      albumItems: [...stagedAlbum],
      dupesItems: stagedDupes,
      otherAcctItems: [...staged2ndAcct],
    })
  }

  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="pack-modal" onClick={e => e.stopPropagation()}>
        <div className="swap-modal-header">
          <h3>{mode === 'edit' ? 'Edit Pack Opening' : 'New Pack Opening'}</h3>
          <button className="swap-modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        <div className="pack-modal-body">
          <input
            ref={inputRef}
            className="pack-modal-search"
            placeholder="Search sticker (e.g. Lozano, MEX, ARG-05)…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null) }}
          />

          {searchResults.length > 0 && (
            <div className="pack-modal-results">
              {Object.entries(groupedResults).map(([code, stickers]) => (
                <div key={code} className="pack-modal-result-group">
                  <span className="pack-modal-group-code mono">{code}</span>
                  {stickers.map(s => {
                    const status = stickerStatus(personData, s.id)
                    const has = status.inAlbum || status.inOtherAccount
                    return (
                      <button
                        key={s.id}
                        className={`pack-result-chip${selected === s.id ? ' pack-result-chip--selected' : ''}${has ? ' pack-result-chip--has' : ''}`}
                        onClick={() => setSelected(selected === s.id ? null : s.id)}
                        title={statusLabel(status)}
                      >
                        <strong>{code}</strong> {chipLabel(s)}
                        {has && <span className="pack-chip-dot" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {selectedSticker && selectedStatus && (
            <div className="pack-modal-preview">
              <div className="pack-preview-name mono">
                {selectedSticker.id} — {selectedSticker.label}
              </div>
              <div className="pack-preview-status">{statusLabel(selectedStatus)}</div>
              <div className="pack-preview-actions">
                <button
                  className="btn ghost"
                  disabled={selectedStatus.inAlbum}
                  title={selectedStatus.inAlbum ? 'Already in album' : 'Mark as collected in main album'}
                  onClick={() => addToStaged(selected, 'album')}
                >
                  → Album
                  {selectedStatus.inOtherAccount && !selectedStatus.inAlbum && (
                    <span className="pack-btn-note"> +dupe</span>
                  )}
                </button>
                <button
                  className={`btn${suggestedPile(selectedStatus) === '2nd-acct' ? ' primary' : ' ghost'}`}
                  onClick={() => addToStaged(selected, '2nd-acct')}
                >
                  → 2nd Account
                </button>
                <button
                  className={`btn${suggestedPile(selectedStatus) === 'dupe' ? ' primary' : ' ghost'}`}
                  onClick={() => addToStaged(selected, 'dupe')}
                >
                  → Dupes
                </button>
              </div>
            </div>
          )}

          <div className="pack-modal-piles">
            <SetPile title="Album" ids={stagedAlbum} color="var(--mint)" onRemove={removeFromAlbum} />
            <SetPile title="2nd Account" ids={staged2ndAcct} color="var(--warn)" onRemove={removeFrom2ndAcct} />
            <DupePile title="Dupes" ids={stagedDupes} color="var(--cyan)" onRemove={removeFromDupes} />
          </div>
        </div>

        <div className="swap-modal-footer">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className="btn primary" disabled={!canSave} onClick={handleSave}>
            {submitting ? 'Saving…' : mode === 'edit' ? 'Update' : 'Save Pack Opening'}
          </button>
        </div>
      </div>
    </div>
  )
}
