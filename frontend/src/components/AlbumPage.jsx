import { Icon } from './Icons.jsx'
import { normalize } from '../data.js'

function FlagChip({ colors }) {
  return <>{colors.map((c, i) => <i key={i} style={{ background: c }} />)}</>
}

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

function albumOf(personData, id) { return personData?.[id]?.count || 0 }
function extraOf(personData, id) { return personData?.[id]?.extra || 0 }

function AlbumSticker({ sticker, count, extra, onClick, isFWC, searchQ }) {
  const owned = count >= 1
  const isLogo = !isFWC && sticker.num === 0
  return (
    <div
      className={`sticker ${owned ? 'owned' : 'missing'} ${isLogo ? 'logo' : ''}`}
      onClick={onClick}
    >
      <div className="sticker-top">
        <div className="sticker-id">
          <span>{sticker.code}</span>
          <span className="num">{String(sticker.num).padStart(2, '0')}</span>
        </div>
        <div className="sticker-state">
          {owned && <Icon.Check />}
        </div>
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
      {extra > 0 && (
        <div className="sticker-dupe-badge mono" title={`${extra} dupe${extra === 1 ? '' : 's'} on hand`}>+{extra}</div>
      )}
    </div>
  )
}

export function AlbumPage({ isFWC, team, stickers, personData, onToggle, onMarkAll, onUnmarkAll, count, ownedCount, progress, activePerson, searchQ }) {
  const allOwned = ownedCount === count
  const noneOwned = ownedCount === 0
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
            <div className="pt-eyebrow">{isFWC ? 'Intro · FWC' : `Group ${team.group} · ${team.code}`}</div>
            <h2><Highlight text={isFWC ? 'FIFA World Cup' : team.name} query={searchQ} /></h2>
            <div className="pt-meta">{activePerson}'s album · {ownedCount}/{count} collected</div>
          </div>
        </div>
        <div className="page-head-right">
          {!noneOwned && (
            <button className="btn danger" onClick={onUnmarkAll}>Reset page</button>
          )}
          <button
            className={`btn ${allOwned ? 'ghost' : 'primary'}`}
            onClick={onMarkAll}
            disabled={allOwned}
            style={allOwned ? { opacity: 0.5, cursor: 'default' } : null}
          >
            <Icon.Check /> {allOwned ? 'Page complete' : 'Mark page collected'}
          </button>
        </div>
      </div>

      <div className="page-progress">
        <span className="mono">{Math.round(progress * 100)}%</span>
        <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>
        <span className="mono">{ownedCount}/{count}</span>
      </div>

      <div className="stickers">
        {stickers.map(s => (
          <AlbumSticker
            key={s.id}
            sticker={s}
            count={albumOf(personData, s.id)}
            extra={extraOf(personData, s.id)}
            onClick={() => onToggle(s.id)}
            isFWC={isFWC}
            searchQ={searchQ}
          />
        ))}
      </div>

      <div className="legend">
        <div><span className="swatch"></span> Missing</div>
        <div><span className="swatch dim"></span> Collected (dimmed)</div>
        <div>Click any sticker to toggle</div>
      </div>
    </div>
  )
}
