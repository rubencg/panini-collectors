import { TOTAL_STICKERS } from '../data.js'
import { Icon } from './Icons.jsx'

export function Header() {
  return (
    <div className="top">
      <div className="brand">
        <div className="brand-mark">
          <Icon.Brand style={{ color: 'var(--mint)' }} />
        </div>
        <div className="brand-text">
          <div className="t1">Collection Tracker</div>
          <div className="t2">The Bros · WC26</div>
        </div>
      </div>
      <div className="top-meta">
        <span className="kbd mono">{TOTAL_STICKERS} STICKERS</span>
      </div>
    </div>
  )
}
