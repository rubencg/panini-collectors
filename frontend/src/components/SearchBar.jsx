import { Icon } from './Icons.jsx'

export function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar">
      <Icon.Search />
      <input
        type="text"
        placeholder="Search team code or player name · MEX, Messi, Haaland…"
        value={value}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
      />
      {value && (
        <button className="btn ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => onChange('')}>
          clear
        </button>
      )}
    </div>
  )
}
