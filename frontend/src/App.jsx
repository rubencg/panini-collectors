import { useState, useEffect, useMemo, useCallback } from 'react'
import { PEOPLE, TEAMS, ALL_STICKERS, TOTAL_STICKERS, FWC_COUNT, STICKERS_PER_TEAM, TEAM_LABELS, normalize } from './data.js'
import { Header } from './components/Header.jsx'
import { PersonTabs } from './components/PersonTabs.jsx'
import { ViewTabs } from './components/ViewTabs.jsx'
import { SearchBar } from './components/SearchBar.jsx'
import { TeamGrid } from './components/TeamGrid.jsx'
import { AlbumPage } from './components/AlbumPage.jsx'
import { DupesPage } from './components/DupesPage.jsx'
import { Trades } from './components/Trades.jsx'
import { SwapRequests } from './components/SwapRequests.jsx'
import { SwapRequestModal } from './components/SwapRequestModal.jsx'
import { ConfirmModal } from './components/ConfirmModal.jsx'

// personData shape: { "MEX-0": { count: 1, extra: 0 }, ... }
// count = 1 means in album; extra = N means N tradeable dupes (independent of album)
function albumOf(personData, id) { return personData?.[id]?.count || 0 }
function extraOf(personData, id) { return personData?.[id]?.extra || 0 }
function inAlbum(personData, id) { return albumOf(personData, id) >= 1 }

const API_BASE = import.meta.env.VITE_API_URL || ''

async function apiPut(person, stickerId, fields) {
  try {
    await fetch(`${API_BASE}/api/sticker`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ person, stickerId, ...fields }),
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

  // Swap requests state
  const [swapRequests, setSwapRequests] = useState([])
  const [swapModal, setSwapModal] = useState(null) // { mode: 'create' | 'edit', id?: number }

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

  useEffect(() => {
    fetch(`${API_BASE}/api/swap-requests`)
      .then(r => r.json())
      .then(setSwapRequests)
      .catch(() => {})
  }, [])

  const refreshSwaps = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/swap-requests`)
      setSwapRequests(await r.json())
    } catch (e) { console.error('refreshSwaps failed', e) }
  }, [])

  // Jump to team when search matches a code or player name
  useEffect(() => {
    const q = search.trim()
    if (!q) return
    const qUp = q.toUpperCase()
    const m = qUp.match(/^([A-Z]{3})\s*-?\s*(\d+)?$/)
    if (m) {
      const code = m[1]
      if (code === 'FWC') { setActivePage('FWC'); return }
      if (TEAMS.find(t => t.code === code)) { setActivePage(code); return }
    }
    const qNorm = normalize(q).toUpperCase()
    for (const [code, labels] of Object.entries(TEAM_LABELS)) {
      if (labels.some(l => normalize(l).toUpperCase().includes(qNorm))) {
        setActivePage(code)
        return
      }
    }
  }, [search])

  const personData = people[activePerson] || {}

  const toggleAlbum = useCallback((person, stickerId) => {
    setPeople(prev => {
      const cur = albumOf(prev[person], stickerId)
      const existing = prev[person]?.[stickerId] || { count: 0, extra: 0 }
      const updated = { ...prev, [person]: { ...prev[person] } }
      if (cur === 0) {
        updated[person][stickerId] = { ...existing, count: 1 }
        apiPut(person, stickerId, { count: 1 })
      } else {
        if (existing.extra > 0) {
          updated[person][stickerId] = { ...existing, count: 0 }
        } else {
          delete updated[person][stickerId]
        }
        apiPut(person, stickerId, { count: 0 })
      }
      return updated
    })
  }, [])

  const adjustExtra = useCallback((person, stickerId, delta) => {
    setPeople(prev => {
      const existing = prev[person]?.[stickerId] || { count: 0, extra: 0 }
      const newExtra = Math.max(0, existing.extra + delta)
      const updated = { ...prev, [person]: { ...prev[person] } }
      if (newExtra <= 0 && existing.count <= 0) {
        delete updated[person][stickerId]
      } else {
        updated[person][stickerId] = { ...existing, extra: newExtra }
      }
      apiPut(person, stickerId, { extra: newExtra })
      return updated
    })
  }, [])

  const setBulkAlbum = useCallback((person, stickerIds, owned) => {
    setPeople(prev => {
      const updated = { ...prev, [person]: { ...prev[person] } }
      const batch = []
      for (const id of stickerIds) {
        const existing = updated[person][id] || { count: 0, extra: 0 }
        if (owned) {
          if (existing.count < 1) {
            updated[person][id] = { ...existing, count: 1 }
            batch.push({ id, count: 1 })
          }
        } else {
          if (existing.extra > 0) {
            updated[person][id] = { ...existing, count: 0 }
          } else {
            delete updated[person][id]
          }
          batch.push({ id, count: 0 })
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
      for (const val of Object.values(data)) {
        if (val.count >= 1) album++
        if (val.extra >= 1) dupes += val.extra
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

  // Trade matches: giver must have extra >= 1, taker must be missing from album
  const tradeMatches = useMemo(() => {
    const matches = {}
    for (const giver of PEOPLE) {
      for (const taker of PEOPLE) {
        if (giver === taker) continue
        const giverData = people[giver] || {}
        const takerData = people[taker] || {}
        const list = []
        for (const s of ALL_STICKERS) {
          if (extraOf(giverData, s.id) >= 1 && albumOf(takerData, s.id) === 0) list.push(s)
        }
        if (list.length) matches[`${giver}|${taker}`] = list
      }
    }
    return matches
  }, [people])

  // Swap requests filtered by active person
  const swapRequestsForActive = useMemo(
    () => swapRequests.filter(s => s.fromPerson === activePerson || s.toPerson === activePerson),
    [swapRequests, activePerson]
  )

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

  // Swap request helpers
  const createSwap = async (payload) => {
    const r = await fetch(`${API_BASE}/api/swap-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const created = await r.json()
    setSwapRequests(prev => [created, ...prev])
  }

  const updateSwap = async (id, payload) => {
    const r = await fetch(`${API_BASE}/api/swap-requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const updated = await r.json()
    setSwapRequests(prev => prev.map(s => s.id === id ? updated : s))
  }

  const deleteSwap = useCallback(async (id) => {
    await fetch(`${API_BASE}/api/swap-requests/${id}`, { method: 'DELETE' })
    setSwapRequests(prev => prev.filter(s => s.id !== id))
  }, [])

  const completeSwap = useCallback(async (id) => {
    const r = await fetch(`${API_BASE}/api/swap-requests/${id}/complete`, { method: 'POST' })
    if (!r.ok) {
      const err = await r.json().catch(() => ({}))
      alert(`Could not complete swap: ${err.error || r.status}`)
      return
    }
    // Re-fetch state because both bros' counts/extras changed.
    const [stateRes, swapsRes] = await Promise.all([
      fetch(`${API_BASE}/api/state`).then(res => res.json()),
      fetch(`${API_BASE}/api/swap-requests`).then(res => res.json()),
    ])
    setPeople(prev => {
      const next = { ...prev }
      for (const p of PEOPLE) next[p] = stateRes[p] || {}
      return next
    })
    setSwapRequests(swapsRes)
  }, [])

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
        swapCount={swapRequestsForActive.length}
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
                searchQ={searchQ}
              />
            ) : (
              <DupesPage
                isFWC={isFWC}
                team={activeTeam}
                stickers={pageStickers}
                personData={personData}
                onAdjust={(id, d) => adjustExtra(activePerson, id, d)}
                activePerson={activePerson}
                searchQ={searchQ}
              />
            )}
          </div>
        </>
      )}

      {activeView === 'trades' && (
        <Trades tradeMatches={tradeMatches} activePerson={activePerson} />
      )}

      {activeView === 'swap-requests' && (
        <SwapRequests
          requests={swapRequestsForActive}
          activePerson={activePerson}
          onNew={() => setSwapModal({ mode: 'create' })}
          onEdit={(id) => setSwapModal({ mode: 'edit', id })}
          onDelete={(id) => setConfirm({
            kind: 'delete-swap',
            swap: swapRequests.find(s => s.id === id),
            action: async () => { await deleteSwap(id); setConfirm(null) },
          })}
          onComplete={(swap) => setConfirm({
            kind: 'complete-swap',
            swap,
            action: async () => { await completeSwap(swap.id); setConfirm(null) },
          })}
        />
      )}

      <div className="footer">// COLLECTION TRACKER · WC26 EDITION</div>

      {confirm && (
        <ConfirmModal
          kind={confirm.kind}
          person={activePerson}
          page={isFWC ? 'FWC' : activeTeam?.name}
          swap={confirm.swap}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.action}
        />
      )}

      {swapModal && (
        <SwapRequestModal
          mode={swapModal.mode}
          initial={swapModal.mode === 'edit' ? swapRequests.find(s => s.id === swapModal.id) : null}
          activePerson={activePerson}
          tradeMatches={tradeMatches}
          onCancel={() => setSwapModal(null)}
          onSubmit={async (payload) => {
            if (swapModal.mode === 'create') await createSwap(payload)
            else await updateSwap(swapModal.id, payload)
            setSwapModal(null)
          }}
        />
      )}
    </div>
  )
}
