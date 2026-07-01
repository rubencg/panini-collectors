import { Icon } from './Icons.jsx'
import { normalize } from '../data.js'

function inOtherAccountOf(personData, id) { return personData?.[id]?.inOtherAccount || false }

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

function AlbumSticker({ sticker, count, extra, inOtherAccount, onClick, onToggleOtherAccount, section, searchQ }) {
  const owned = count >= 1
  const isLogo = !section && sticker.num === 0
  return (
    <div
      className={`sticker ${owned ? 'owned' : 'missing'} ${isLogo ? 'logo' : ''} ${sticker.update ? 'update' : ''} ${!owned && inOtherAccount ? 'in-other-account' : ''}`}
      onClick={onClick}
    >
      <div className="sticker-top">
        <div className="sticker-id">
          <span>{sticker.code}</span>
          <span className="num">{String(sticker.num).padStart(2, '0')}</span>
        </div>
        <div className="sticker-top-right">
          <div className="sticker-state">
            {owned && <Icon.Check />}
          </div>
          {!owned && (
            <button
              className={`sticker-other-acct-btn${inOtherAccount ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleOtherAccount() }}
              title={inOtherAccount ? 'In another account — click to remove' : 'Mark as in another account'}
            >
              {inOtherAccount ? '2nd acct ✓' : '2nd acct'}
            </button>
          )}
        </div>
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
      {extra > 0 && (
        <div className="sticker-dupe-badge mono" title={`${extra} dupe${extra === 1 ? '' : 's'} on hand`}>+{extra}</div>
      )}
    </div>
  )
}

export function AlbumPage({ section, team, stickers, personData, onToggle, onToggleOtherAccount, onMarkAll, onUnmarkAll, count, ownedCount, progress, activePerson, searchQ, onPrev, onNext }) {
  const allOwned = ownedCount === count
  const noneOwned = ownedCount === 0
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
            <div className="pt-eyebrow">{section ? section.eyebrow : `Group ${team.group} · ${team.code}`}</div>
            <h2><Highlight text={section ? section.title : team.name} query={searchQ} /></h2>
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
            <Icon.Check /> {allOwned ? 'Page complete' : 'Mark collected'}
          </button>
          <div className="page-nav">
            <button className="page-nav-btn" onClick={onPrev} title="Previous team (←)"><Icon.ChevronLeft /></button>
            <button className="page-nav-btn" onClick={onNext} title="Next team (→)"><Icon.ChevronRight /></button>
          </div>
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
            inOtherAccount={inOtherAccountOf(personData, s.id)}
            onClick={() => onToggle(s.id)}
            onToggleOtherAccount={() => onToggleOtherAccount(s.id)}
            section={section}
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
