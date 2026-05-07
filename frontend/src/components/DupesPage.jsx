import { Icon } from './Icons.jsx'
import { normalize } from '../data.js'

function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>
  const normText = normalize(text).toUpperCase()
  const normQuery = normalize(query)
  const idx = normText.indexOf(normQuery)
  if (idx === -1) return <>{text}</>
  return <>
    {text.slice(0, idx)}
    <mark style={{ background: 'var(--cyan)', color: 'var(--bg)', borderRadius: 2, padding: '0 1px' }}>
      {text.slice(idx, idx + query.length)}
    </mark>
    {text.slice(idx + query.length)}
  </>
}

function FlagChip({ colors }) {
  return <>{colors.map((c, i) => <i key={i} style={{ background: c }} />)}</>
}

function countOf(personData, id) { return (personData && personData[id]) || 0 }
function dupeCount(personData, id) { return Math.max(0, countOf(personData, id) - 1) }

function DupeSticker({ sticker, count, onPlus, onMinus, isFWC, searchQ }) {
  const owned = count >= 1
  const dupes = Math.max(0, count - 1)
  const isLogo = !isFWC && sticker.num === 0
  return (
    <div className={`sticker dupe-sticker ${dupes > 0 ? 'has-dupes' : owned ? 'owned' : 'missing'} ${isLogo ? 'logo' : ''}`}>
      <div className="sticker-top">
        <div className="sticker-id">
          <span>{sticker.code}</span>
          <span className="num">{String(sticker.num).padStart(2, '0')}</span>
        </div>
        {dupes > 0 && (
          <div className="dupe-pill mono">+{dupes}</div>
        )}
      </div>
      {!isFWC && (
        <>
          <div className="sticker-tag">{isLogo ? 'Federation' : 'Player'}</div>
          <div className="sticker-name"><Highlight text={sticker.label} query={searchQ} /></div>
        </>
      )}
      {isFWC && (
        <>
          <div className="sticker-name"><Highlight text={sticker.label} query={searchQ} /></div>
          <div className="sticker-tag" style={{ marginTop: 'auto' }}>FIFA · Intro</div>
        </>
      )}

      <div className="dupe-controls">
        <button
          className="dupe-btn"
          onClick={onMinus}
          disabled={dupes === 0}
          title="Remove a dupe"
        >
          <Icon.Minus />
        </button>
        <span className={`dupe-count mono ${dupes > 0 ? 'active' : ''}`}>{dupes}</span>
        <button
          className="dupe-btn primary"
          onClick={onPlus}
          disabled={!owned}
          title={owned ? 'Add a dupe' : 'Mark in album first'}
        >
          <Icon.Plus />
        </button>
      </div>
      {!owned && (
        <div className="dupe-locked mono">not in album</div>
      )}
    </div>
  )
}

export function DupesPage({ isFWC, team, stickers, personData, onAdjust, activePerson, searchQ }) {
  const totalDupes = stickers.reduce((acc, s) => acc + dupeCount(personData, s.id), 0)
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-left">
          {!isFWC ? (
            <div className="page-flag"><FlagChip colors={team.colors} /></div>
          ) : (
            <div className="page-flag" style={{ background: 'var(--bg-3)', display: 'grid', placeItems: 'center' }}>
              <Icon.Brand style={{ color: 'var(--cyan)' }} />
            </div>
          )}
          <div className="page-titles">
            <div className="pt-eyebrow">{isFWC ? 'Dupes · FWC' : `Dupes · Group ${team.group} · ${team.code}`}</div>
            <h2><Highlight text={isFWC ? 'FIFA World Cup' : team.name} query={searchQ} /></h2>
            <div className="pt-meta">{activePerson}'s dupes · {totalDupes} extra copies on this page</div>
          </div>
        </div>
      </div>

      <div className="dupes-help mono">
        + adds an extra copy (dupe) · − removes one. dupes are what you can trade away.
      </div>

      <div className="stickers">
        {stickers.map(s => (
          <DupeSticker
            key={s.id}
            sticker={s}
            count={countOf(personData, s.id)}
            onPlus={() => onAdjust(s.id, +1)}
            onMinus={() => onAdjust(s.id, -1)}
            isFWC={isFWC}
            searchQ={searchQ}
          />
        ))}
      </div>
    </div>
  )
}
