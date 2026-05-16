import { Icon } from './Icons.jsx'
import { TOTAL_STICKERS } from '../data.js'

export function ViewTabs({ activeView, setActiveView, albumCount, dupesCount, swapCount, inOtherAccountCount }) {
  return (
    <div className="viewtabs">
      <button className={`viewtab ${activeView === 'album' ? 'active' : ''}`} onClick={() => setActiveView('album')}>
        <Icon.Album /> Album
        <span className="count mono">{albumCount}/{TOTAL_STICKERS}</span>
      </button>
      <button className={`viewtab ${activeView === 'dupes' ? 'active' : ''}`} onClick={() => setActiveView('dupes')}>
        <Icon.Stack /> Dupes
        <span className="count mono">{dupesCount}</span>
      </button>
      <button className={`viewtab ${activeView === 'trades' ? 'active' : ''}`} onClick={() => setActiveView('trades')}>
        <Icon.Trade /> Trades
      </button>
      <button className={`viewtab ${activeView === 'swap-requests' ? 'active' : ''}`} onClick={() => setActiveView('swap-requests')}>
        <Icon.Trade /> Swaps
        {swapCount > 0 && (
          <span className="count mono swap-tab-badge">{swapCount}</span>
        )}
      </button>
      <button className={`viewtab ${activeView === 'other-account' ? 'active' : ''}`} onClick={() => setActiveView('other-account')}>
        <Icon.Stack /> Other Acct
        {inOtherAccountCount > 0 && (
          <span className="count mono other-acct-tab-badge">{inOtherAccountCount}</span>
        )}
      </button>
    </div>
  )
}
