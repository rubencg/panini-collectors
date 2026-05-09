import { useMemo } from 'react'
import { ALL_STICKERS } from '../data.js'

export function InOtherAccount({ personData, activePerson }) {
  const stickers = useMemo(() => {
    return ALL_STICKERS.filter(s => personData?.[s.id]?.inOtherAccount)
  }, [personData])

  // Group by team code (s.code)
  const grouped = useMemo(() => {
    const g = {}
    for (const s of stickers) {
      if (!g[s.code]) g[s.code] = []
      g[s.code].push(s)
    }
    return g
  }, [stickers])

  return (
    <div className="trades">
      <div className="trades-head">
        <div>
          <h2 style={{ margin: 0 }}>In another account</h2>
          <p>Stickers {activePerson} has in a second account and <strong>won't</strong> be trading.</p>
        </div>
        <span className="mono" style={{ color: 'var(--warn)', fontSize: 12, alignSelf: 'flex-start' }}>
          {stickers.length} sticker{stickers.length === 1 ? '' : 's'}
        </span>
      </div>

      {stickers.length === 0 ? (
        <div className="trade-empty">// NO STICKERS IN ANOTHER ACCOUNT</div>
      ) : (
        <div className="trade-pair">
          <div className="trade-stickers">
            {Object.entries(grouped).map(([code, items]) => (
              <span className="trade-chip other-acct-chip" key={code}>
                <strong>{code}</strong>{' '}
                {items.map(s => {
                  const num = String(s.num).padStart(2, '0')
                  const namePart = s.num !== 0 && s.label
                    ? ` ${s.label.split(' ').slice(-1)[0]}`
                    : ''
                  return `${num}${namePart}`
                }).join(' · ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
