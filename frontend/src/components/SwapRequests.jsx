import { SwapRequestCard } from './SwapRequestCard.jsx'
import { Icon } from './Icons.jsx'

export function SwapRequests({ requests, activePerson, onNew, onEdit, onDelete, onComplete }) {
  return (
    <div className="swap-list-wrap">
      <div className="swap-list-head">
        <div>
          <h2 className="swap-list-title">Swap requests</h2>
          <p className="swap-list-sub">
            Formalize a trade with a bro — pick stickers, both sides agree, hit Complete.
          </p>
        </div>
        <button className="btn primary" onClick={onNew}>
          <Icon.Plus /> New swap request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="trade-empty">// NO SWAP REQUESTS YET — HIT "NEW SWAP REQUEST" TO START ONE</div>
      ) : (
        <div className="swap-list">
          {requests.map(swap => (
            <SwapRequestCard
              key={swap.id}
              swap={swap}
              activePerson={activePerson}
              onEdit={onEdit}
              onDelete={onDelete}
              onComplete={onComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
