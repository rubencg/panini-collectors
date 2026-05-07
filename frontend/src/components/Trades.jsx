import { PEOPLE, ALL_STICKERS } from '../data.js'

function countOf(personData, id) { return (personData && personData[id]) || 0 }
function dupeCount(personData, id) { return Math.max(0, countOf(personData, id) - 1) }

export function Trades({ tradeMatches, activePerson }) {
  const incoming = []
  const outgoing = []
  for (const key of Object.keys(tradeMatches)) {
    const [from, to] = key.split('|')
    if (to === activePerson) incoming.push({ from, to, list: tradeMatches[key] })
    if (from === activePerson) outgoing.push({ from, to, list: tradeMatches[key] })
  }

  const renderPair = ({ from, to, list }, i) => {
    const grouped = {}
    for (const s of list) {
      if (!grouped[s.code]) grouped[s.code] = []
      grouped[s.code].push(s)
    }
    return (
      <div className="trade-pair" key={i}>
        <div className="trade-pair-head">
          <span className="from"><span className="badge mono">{from.slice(0,2).toUpperCase()}</span>{from}</span>
          <span className="arrow mono">→</span>
          <span className="to"><span className="badge mono">{to.slice(0,2).toUpperCase()}</span>{to}</span>
          <span className="mono" style={{ marginLeft: 'auto', color: 'var(--ink-faint)', fontSize: 11 }}>
            {list.length} sticker{list.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="trade-stickers">
          {Object.entries(grouped).map(([code, items]) => (
            <span className="trade-chip" key={code}>
              <strong>{code}</strong> {items.map(it => String(it.num).padStart(2, '0')).join(' · ')}
            </span>
          ))}
        </div>
      </div>
    )
  }

  const empty = !incoming.length && !outgoing.length

  return (
    <div className="trades">
      <div className="trades-head">
        <div>
          <h2>Trade matches</h2>
          <p>Real swaps: someone has a <strong style={{ color: 'var(--mint)' }}>dupe</strong> · the other person is <strong style={{ color: 'var(--mint)' }}>missing</strong> it from their album.</p>
        </div>
      </div>

      {empty && (
        <div className="trade-empty">// NO TRADES POSSIBLE YET — ADD DUPES IN THE DUPES TAB</div>
      )}

      {!!incoming.length && (
        <div style={{ marginBottom: 18 }}>
          <h4 className="trade-section-head">↓ Bros with dupes {activePerson} needs</h4>
          {incoming.map(renderPair)}
        </div>
      )}

      {!!outgoing.length && (
        <div>
          <h4 className="trade-section-head">↑ {activePerson}'s dupes that other bros are missing</h4>
          {outgoing.map(renderPair)}
        </div>
      )}
    </div>
  )
}
