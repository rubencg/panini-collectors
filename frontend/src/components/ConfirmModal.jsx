export function ConfirmModal({ kind, person, page, swap, onCancel, onConfirm }) {
  if (kind === 'delete-swap') {
    return (
      <div className="modal-bg" onClick={onCancel}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Delete swap request?</h3>
          <p>
            This will permanently delete the swap request between{' '}
            <strong>{swap?.fromPerson}</strong> and <strong>{swap?.toPerson}</strong>.
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={onCancel}>Cancel</button>
            <button className="btn danger" onClick={onConfirm}>Yes, delete</button>
          </div>
        </div>
      </div>
    )
  }

  if (kind === 'complete-swap') {
    return (
      <div className="modal-bg" onClick={onCancel}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Complete swap?</h3>
          <p>
            Complete the swap between <strong>{swap?.fromPerson}</strong> and{' '}
            <strong>{swap?.toPerson}</strong>?
          </p>
          <p>
            This marks the offered stickers as owned in each album and removes the
            corresponding dupes. This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={onCancel}>Cancel</button>
            <button className="btn primary" onClick={onConfirm}>Yes, complete swap</button>
          </div>
        </div>
      </div>
    )
  }

  if (kind === 'complete-transfer') {
    return (
      <div className="modal-bg" onClick={onCancel}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <h3>Complete transfer?</h3>
          <p>
            This will mark the selected 2nd account stickers as owned in{' '}
            <strong>{swap?.fromPerson}</strong>&apos;s main album and remove the 2nd account flag.
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button className="btn ghost" onClick={onCancel}>Cancel</button>
            <button className="btn primary" onClick={onConfirm}>Yes, complete transfer</button>
          </div>
        </div>
      </div>
    )
  }

  const isMark = kind === 'mark-all'
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{isMark ? 'Mark whole page collected?' : 'Reset whole page?'}</h3>
        <p>
          {isMark
            ? `This will mark every sticker on the ${page} page as collected for ${person}. Existing dupes are kept.`
            : `This will mark every sticker on the ${page} page as missing for ${person} and clear any dupes on this page.`}
        </p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${isMark ? 'primary' : 'danger'}`} onClick={onConfirm}>
            {isMark ? 'Yes, mark all' : 'Yes, reset'}
          </button>
        </div>
      </div>
    </div>
  )
}
