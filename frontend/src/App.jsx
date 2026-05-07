import { useState, useEffect, useMemo, useCallback } from 'react'
import { PEOPLE, TEAMS, ALL_STICKERS, TOTAL_STICKERS, FWC_COUNT, STICKERS_PER_TEAM } from './data.js'
import { Header } from './components/Header.jsx'
import { PersonTabs } from './components/PersonTabs.jsx'
import { ViewTabs } from './components/ViewTabs.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { TeamGrid } from './components/TeamGrid.jsx'
import { AlbumPage } from './components/AlbumPage.jsx'
import { DupesPage } from './components/DupesPage.jsx'
import { Trades } from './components/Trades.jsx'
import { ConfirmModal } from './components/ConfirmModal.jsx'

function countOf(personData, id) { return (personData && personData[id]) || 0 }
function inAlbum(personData, id) { return countOf(personData, id) >= 1 }
function dupeCount(personData, id) { return Math.max(0, countOf(personData, id) - 1) }

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiPut(person, stickerId, count) {
  try {
    await fetch(`${API_BASE}/api/sticker`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person, stickerId, count }),
    })
  } catch (e) { console.error('apiPut failed', e) }
}

async function apiBulk(person, stickers) {
  try {
    await fetch(`${API_BASE}/api/stickers/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person, stickers }),
    })
  } catch (e) { console.error('apiBulk failed', e) }
}

export default function App() {
  const [people, setPeople] = useState(() => Object.fromEntries(PEOPLE.map(p => [p, {}])))
  const [loading, setLoading] = useState(true)
  const [activePerson, setActivePerson] = useState(PEOPLE[0])
  const [activeView, setActiveView] = useState('album')
  const [activePage, setActivePage] = useState('FWC')
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/state`)
      .then(r => r.json())
      .then(data => {
        setPeople(prev => {
          const next = { ...prev }
          for (const p of PEOPLE) next[p] = data[p] || {}
          return next
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Jump to team when search matches a code
  useEffect(() => {
    const q = search.trim().toUpperCase()
    if (!q) return
    const m = q.match(/^([A-Z]{3})\s*-?\s*(\d+)?$/)
    if (m) {
      const code = m[1]
      if (code === 'FWC') setActivePage('FWC')
      else if (TEAMS.find(t => t.code === code)) setActivePage(code)
    }
  }, [search])

  const personData = people[activePerson] || {}

  const adjustCount = useCallback((person, stickerId, delta) => {
    setPeople(prev => {
      const cur = countOf(prev[person], stickerId)
      const next = Math.max(0, cur + delta)
      const updated = { ...prev, [person]: { ...prev[person] } }
      if (next <= 0) delete updated[person][stickerId]
      else updated[person][stickerId] = next
      apiPut(person, stickerId, next)
      return updated
    })
  }, [])

  const toggleAlbum = useCallback((person, stickerId) => {
    setPeople(prev => {
      const cur = countOf(prev[person], stickerId)
      const updated = { ...prev, [person]: { ...prev[person] } }
      if (cur === 0) { updated[person][stickerId] = 1; apiPut(person, stickerId, 1) }
      else { delete updated[person][stickerId]; apiPut(person, stickerId, 0) }
      return updated
    })
  }, [])

  const setBulkAlbum = useCallback((person, stickerIds, owned) => {
    setPeople(prev => {
      const updated = { ...prev, [person]: { ...prev[person] } }
      const batch = []
      for (const id of stickerIds) {
        const cur = updated[person][id] || 0
        if (owned) {
          if (cur < 1) { updated[person][id] = 1; batch.push({ id, count: 1 }) }
        } else {
          delete updated[person][id]; batch.push({ id, count: 0 })
        }
      }
      apiBulk(person, batch)
      return updated
    })
  }, [])

  // Person stats
  const personStats = useMemo(() => {
    const out = {}
    for (const p of PEOPLE) {
      const data = people[p] || {}
      let album = 0, dupes = 0
      for (const id of Object.keys(data)) {
        const c = data[id]
        if (c >= 1) album++
        if (c >= 2) dupes += c - 1
      }
      out[p] = { album, dupes }
    }
    return out
  }, [people])

  // Page stickers
  const pageStickers = useMemo(
    () => ALL_STICKERS.filter(s => s.group === activePage),
    [activePage]
  )
  const pageCount = pageStickers.length
  const pageOwned = pageStickers.filter(s => inAlbum(personData, s.id)).length
  const pageProgress = pageCount > 0 ? pageOwned / pageCount : 0
  const activeTeam = TEAMS.find(t => t.code === activePage)
  const isFWC = activePage === 'FWC'

  // Trade matches
  const tradeMatches = useMemo(() => {
    const matches = {}
    for (const giver of PEOPLE) {
      for (const taker of PEOPLE) {
        if (giver === taker) continue
        const giverData = people[giver] || {}
        const takerData = people[taker] || {}
        const list = []
        for (const s of ALL_STICKERS) {
          if (dupeCount(giverData, s.id) >= 1 && countOf(takerData, s.id) === 0) list.push(s)
        }
        if (list.length) matches[`${giver}|${taker}`] = list
      }
    }
    return matches
  }, [people])

  const stats = personStats[activePerson] || { album: 0, dupes: 0 }
  const searchQ = search.trim().toUpperCase()

  const handleMarkPage = (mode) => {
    setConfirm({
      kind: mode === 'all' ? 'mark-all' : 'unmark-all',
      action: () => {
        setBulkAlbum(activePerson, pageStickers.map(s => s.id), mode === 'all')
        setConfirm(null)
      },
    })
  }

  if (loading) {
    return (
      <div className="app">
        <Header />
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Loading collection…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header />

      <PersonTabs
        activePerson={activePerson}
        setActivePerson={(p) => { setActivePerson(p); setSearch('') }}
        personStats={personStats}
      />

      <ViewTabs
        activeView={activeView}
        setActiveView={(v) => { setActiveView(v); setSearch('') }}
        albumCount={stats.album}
        dupesCount={stats.dupes}
      />

      {(activeView === 'album' || activeView === 'dupes') && (
        <>
          <SearchBar value={search} onChange={setSearch} />
          <div className="layout">
            <TeamGrid
              personData={personData}
              activePage={activePage}
              onPick={setActivePage}
              mode={activeView}
              searchQ={searchQ}
            />
            {activeView === 'album' ? (
              <AlbumPage
                isFWC={isFWC}
                team={activeTeam}
                stickers={pageStickers}
                personData={personData}
                onToggle={(id) => toggleAlbum(activePerson, id)}
                onMarkAll={() => handleMarkPage('all')}
                onUnmarkAll={() => handleMarkPage('none')}
                count={pageCount}
                ownedCount={pageOwned}
                progress={pageProgress}
                activePerson={activePerson}
              />
            ) : (
              <DupesPage
                isFWC={isFWC}
                team={activeTeam}
                stickers={pageStickers}
                personData={personData}
                onAdjust={(id, d) => adjustCount(activePerson, id, d)}
                activePerson={activePerson}
              />
            )}
          </div>
        </>
      )}

      {activeView === 'trades' && (
        <Trades tradeMatches={tradeMatches} activePerson={activePerson} />
      )}

      <div className="footer">// COLLECTION TRACKER · WC26 EDITION · OFFLINE PROTOTYPE</div>

      {confirm && (
        <ConfirmModal
          kind={confirm.kind}
          person={activePerson}
          page={isFWC ? 'FWC' : activeTeam?.name}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.action}
        />
      )}
    </div>
  )
}
