import { useMemo } from 'react'
import { ALL_STICKERS, TEAMS } from '../data.js'

const TEAM_ORDER = ['FWC', ...TEAMS.map(t => t.code)]

export function MissingPage({ personData, activePerson }) {
  const grouped = useMemo(() => {
    const g = {}
    for (const s of ALL_STICKERS) {
      const d = personData?.[s.id]
      if ((d?.count || 0) < 1 && !d?.inOtherAccount) {
        const code = s.id.split('-')[0]
        if (!g[code]) g[code] = []
        g[code].push(s)
      }
    }
    return g
  }, [personData])

  const total = useMemo(
    () => Object.values(grouped).reduce((n, arr) => n + arr.length, 0),
    [grouped]
  )

  const orderedCodes = TEAM_ORDER.filter(c => grouped[c])

  return (
    <div className="trades">
      <div className="trades-head">
        <div>
          <h2 style={{ margin: 0 }}>Missing stickers</h2>
          <p>{activePerson} still needs these to complete the album.</p>
        </div>
        <span className="mono" style={{ color: 'var(--danger)', fontSize: 12, alignSelf: 'flex-start' }}>
          {total} missing
        </span>
      </div>

      {total === 0 ? (
        <div className="trades-empty">Collection complete! Nothing missing.</div>
      ) : (
        <div className="missing-groups">
          {orderedCodes.map(code => {
            const stickers = grouped[code]
            return (
              <div key={code} className="missing-group">
                <div className="missing-group-head">
                  <span className="mono missing-group-code">{code}</span>
                  <span className="mono missing-group-count">{stickers.length} missing</span>
                </div>
                <div className="missing-group-chips">
                  {stickers.map(s => {
                    const num = String(s.num).padStart(2, '0')
                    const nameTail = s.num !== 0 && s.label ? ` ${s.label.split(' ').slice(-1)[0]}` : ''
                    return (
                      <span key={s.id} className="missing-chip mono" title={s.label || s.id}>
                        {num}{nameTail}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
