import { PEOPLE, TOTAL_STICKERS } from '../data.js'

export function PersonTabs({ activePerson, setActivePerson, personStats }) {
  return (
    <div className="persons" role="tablist">
      {PEOPLE.map(p => {
        const initials = p.slice(0, 2).toUpperCase()
        const s = personStats[p] || { album: 0, dupes: 0 }
        const pct = TOTAL_STICKERS ? s.album / TOTAL_STICKERS : 0
        return (
          <button
            key={p}
            className={`person-tab ${activePerson === p ? 'active' : ''}`}
            onClick={() => setActivePerson(p)}
          >
            <div className="pt-name">
              <span className="pt-avatar">{initials}</span>
              <span>{p}</span>
              {s.dupes > 0 && (
                <span className="pt-dupes mono" title={`${s.dupes} dupe${s.dupes === 1 ? '' : 's'}`}>
                  +{s.dupes}
                </span>
              )}
            </div>
            <div className="pt-progress">
              <div className="pt-bar"><i style={{ width: `${pct * 100}%` }} /></div>
              <span>{s.album}/{TOTAL_STICKERS}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
