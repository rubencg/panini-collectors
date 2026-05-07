import { useMemo } from 'react'
import { TEAMS, FWC_COUNT, STICKERS_PER_TEAM, TEAM_LABELS, normalize } from '../data.js'
import { Icon } from './Icons.jsx'

function FlagChip({ colors }) {
  return <>{colors.map((c, i) => <i key={i} style={{ background: c }} />)}</>
}

function countOf(personData, id) {
  return (personData && personData[id]) || 0
}
function inAlbum(personData, id) { return countOf(personData, id) >= 1 }
function dupeCount(personData, id) { return Math.max(0, countOf(personData, id) - 1) }

export function TeamGrid({ personData, activePage, onPick, mode, searchQ }) {
  const progress = useMemo(() => {
    const out = {}
    for (const t of TEAMS) {
      let owned = 0
      for (let i = 0; i < STICKERS_PER_TEAM; i++) {
        if (inAlbum(personData, `${t.code}-${i}`)) owned++
      }
      out[t.code] = owned / STICKERS_PER_TEAM
    }
    let fwcOwned = 0
    for (let i = 1; i <= FWC_COUNT; i++) {
      if (inAlbum(personData, `FWC-${i}`)) fwcOwned++
    }
    out.FWC = fwcOwned / FWC_COUNT
    return out
  }, [personData])

  const teamDupes = useMemo(() => {
    const out = {}
    for (const t of TEAMS) {
      let d = 0
      for (let i = 0; i < STICKERS_PER_TEAM; i++) {
        d += dupeCount(personData, `${t.code}-${i}`)
      }
      out[t.code] = d
    }
    let fwcD = 0
    for (let i = 1; i <= FWC_COUNT; i++) fwcD += dupeCount(personData, `FWC-${i}`)
    out.FWC = fwcD
    return out
  }, [personData])

  const groupedTeams = useMemo(() => {
    const groups = {}
    for (const t of TEAMS) {
      if (!groups[t.group]) groups[t.group] = []
      groups[t.group].push(t)
    }
    return groups
  }, [])

  const groupKeys = Object.keys(groupedTeams).sort()
  const fwcProg = progress.FWC || 0
  const fwcOwned = Math.round(fwcProg * FWC_COUNT)
  const fwcDupes = teamDupes.FWC || 0

  const matches = (t) => {
    if (!searchQ) return true
    const qNorm = normalize(searchQ)
    if (t.code.startsWith(searchQ) || normalize(t.name).toUpperCase().includes(qNorm)) return true
    const labels = TEAM_LABELS[t.code] || []
    return labels.some(l => normalize(l).toUpperCase().includes(qNorm))
  }

  return (
    <div className="teamgrid-wrap">
      <button
        className={`fwc-tile ${activePage === 'FWC' ? 'active' : ''}`}
        onClick={() => onPick('FWC')}
      >
        <div className="fwc-tile-mark">
          <Icon.Brand style={{ color: 'var(--cyan)' }} />
        </div>
        <div className="fwc-tile-text">
          <div className="l1">Intro Pages</div>
          <div className="l2">FIFA World Cup</div>
        </div>
        <div className="fwc-tile-prog mono">
          {mode === 'dupes' ? (fwcDupes > 0 ? `+${fwcDupes}` : '—') : `${fwcOwned}/${FWC_COUNT}`}
        </div>
      </button>

      <div className="teamgrid-head">
        <h3>Teams</h3>
        <span className="sub">{TEAMS.length} total</span>
      </div>

      {groupKeys.map(g => {
        const teams = groupedTeams[g].filter(matches)
        if (!teams.length) return null
        return (
          <div className="group-block" key={g}>
            <h4>Group {g}</h4>
            <div className="team-row">
              {teams.map(t => {
                const p = progress[t.code] || 0
                const d = teamDupes[t.code] || 0
                const complete = p >= 1
                return (
                  <button
                    key={t.code}
                    className={`team-tile ${activePage === t.code ? 'active' : ''} ${complete ? 'complete' : ''} ${mode === 'dupes' && d > 0 ? 'has-dupes' : ''}`}
                    onClick={() => onPick(t.code)}
                    title={`${t.name}${d > 0 ? ` · ${d} dupe${d === 1 ? '' : 's'}` : ''}`}
                  >
                    <div className="tile-flag"><FlagChip colors={t.colors} /></div>
                    <div className="tile-code mono">{t.code}</div>
                    {mode === 'dupes' ? (
                      <div className="tile-dupe mono">{d > 0 ? `+${d}` : '·'}</div>
                    ) : (
                      <div className="tile-prog"><i style={{ width: `${p * 100}%` }} /></div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
