export function ConfirmModal({ kind, person, page, onCancel, onConfirm }) {
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
