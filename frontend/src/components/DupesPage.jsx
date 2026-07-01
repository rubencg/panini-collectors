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

function albumOf(personData, id) { return personData?.[id]?.count || 0 }
function extraOf(personData, id) { return personData?.[id]?.extra || 0 }

function DupeSticker({ sticker, count, extra, onPlus, onMinus, section, searchQ }) {
  const owned = count >= 1
  const isLogo = !section && sticker.num === 0
  return (
    <div className={`sticker dupe-sticker ${extra > 0 ? 'has-dupes' : owned ? 'owned' : 'missing'} ${isLogo ? 'logo' : ''} ${sticker.update ? 'update' : ''}`}>
      <div className="sticker-top">
        <div className="sticker-id">
          <span>{sticker.code}</span>
          <span className="num">{String(sticker.num).padStart(2, '0')}</span>
        </div>
        {extra > 0 && (
          <div className="dupe-pill mono">+{extra}</div>
        )}
      </div>
      {!section && (
        <>
          <div className="sticker-tag">{isLogo ? 'Federation' : sticker.update ? 'Update' : 'Player'}</div>
          <div className="sticker-name"><Highlight text={sticker.label} query={searchQ} /></div>
        </>
      )}
      {section && (
        <>
          <div className="sticker-name"><Highlight text={sticker.label} query={searchQ} /></div>
          <div className="sticker-tag" style={{ marginTop: 'auto' }}>{section.tag}</div>
        </>
      )}

      <div className="dupe-controls">
        <button
          className="dupe-btn"
          onClick={onMinus}
          disabled={extra === 0}
          title="Remove a dupe"
        >
          <Icon.Minus />
        </button>
        <span className={`dupe-count mono ${extra > 0 ? 'active' : ''}`}>{extra}</span>
        <button
          className="dupe-btn primary"
          onClick={onPlus}
          title="Add a dupe"
        >
          <Icon.Plus />
        </button>
      </div>
    </div>
  )
}

export function DupesPage({ section, team, stickers, personData, onAdjust, activePerson, searchQ, onPrev, onNext }) {
  const totalDupes = stickers.reduce((acc, s) => acc + extraOf(personData, s.id), 0)
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-head-left">
          {!section ? (
            <div className="page-flag"><FlagChip colors={team.colors} /></div>
          ) : (
            <div className="page-flag" style={{ background: 'var(--bg-3)', display: 'grid', placeItems: 'center' }}>
              <section.icon style={{ color: 'var(--cyan)' }} />
            </div>
          )}
          <div className="page-titles">
            <div className="pt-eyebrow">{section ? `Dupes · ${section.short}` : `Dupes · Group ${team.group} · ${team.code}`}</div>
            <h2><Highlight text={section ? section.title : team.name} query={searchQ} /></h2>
            <div className="pt-meta">{activePerson}'s dupes · {totalDupes} extra copies on this page</div>
          </div>
        </div>
        <div className="page-head-right">
          <div className="page-nav">
            <button className="page-nav-btn" onClick={onPrev} title="Previous team (←)"><Icon.ChevronLeft /></button>
            <button className="page-nav-btn" onClick={onNext} title="Next team (→)"><Icon.ChevronRight /></button>
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
            count={albumOf(personData, s.id)}
            extra={extraOf(personData, s.id)}
            onPlus={() => onAdjust(s.id, +1)}
            onMinus={() => onAdjust(s.id, -1)}
            section={section}
            searchQ={searchQ}
          />
        ))}
      </div>
    </div>
  )
}
