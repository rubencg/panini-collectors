import { useMemo } from 'react'
import { ALL_STICKERS } from '../data.js'
import { AccountTransferCard } from './AccountTransferCard.jsx'

export function InOtherAccount({ personData, activePerson, accountTransfers, onNewTransfer, onEditTransfer, onDeleteTransfer, onCompleteTransfer }) {
  const committedIds = useMemo(() => {
    const ids = new Set()
    for (const t of accountTransfers) {
      for (const id of t.otherAcctStickers) ids.add(id)
    }
    return ids
  }, [accountTransfers])

  const stickers = useMemo(() => {
    return ALL_STICKERS.filter(s => personData?.[s.id]?.inOtherAccount && !committedIds.has(s.id))
  }, [personData, committedIds])

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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span className="mono" style={{ color: 'var(--warn)', fontSize: 12, alignSelf: 'flex-start' }}>
            {stickers.length} sticker{stickers.length === 1 ? '' : 's'}
          </span>
          <button className="btn primary" style={{ fontSize: 12, padding: '4px 10px' }} onClick={onNewTransfer}>
            + Transfer
          </button>
        </div>
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

      {accountTransfers.length > 0 && (
        <div className="acct-transfers-section">
          <div className="acct-transfers-section-label mono">Pending transfers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {accountTransfers.map(t => (
              <AccountTransferCard
                key={t.id}
                transfer={t}
                onEdit={onEditTransfer}
                onDelete={onDeleteTransfer}
                onComplete={onCompleteTransfer}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
