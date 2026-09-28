import { useEffect, useState } from 'react'
import logoSrc from './logo.png'
import Sidebar, { NAV } from './components/Sidebar'
import { Button, Card, CardContent, ErrorNote, Input } from './components/ui'
import { api, clearConnection, loadConnection, saveConnection, setConnection } from './lib/api'
import Actions from './pages/Actions'
import AuditLog from './pages/AuditLog'
import DatabasePage from './pages/Database'
import EventResults from './pages/EventResults'
import Fighters from './pages/Fighters'
import Overview from './pages/Overview'
import Schedule from './pages/Schedule'

const PAGES = {
  overview: Overview, results: EventResults, actions: Actions, schedule: Schedule,
  audit: AuditLog, fighters: Fighters, database: DatabasePage,
}

const DEFAULT_URL = 'https://alphalocksbackend-production.up.railway.app'

function pageFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '')
  return NAV.some((n) => n.id === id) ? id : 'overview'
}

function Connect({ initial, onConnected }) {
  const [form, setForm] = useState({ url: initial.url || DEFAULT_URL, key: initial.key, actor: initial.actor })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    const c = { url: form.url.trim().replace(/\/+$/, ''), key: form.key.trim(), actor: form.actor.trim() }
    setBusy(true)
    setError(null)
    setConnection(c)
    try {
      await api('/admin/stats')
      saveConnection(c)
      onConnected(c)
    } catch (err) {
      setError(err.status === 403 ? new Error('That admin key was rejected.') : err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center gap-3 rounded-t-lg bg-gradient-to-b from-blue-600 to-blue-700 px-6 py-5">
          <img src={logoSrc} alt="" className="h-10 w-10 rounded-full" />
          <div>
            <div className="text-xl font-bold text-white tracking-tight">Alpha Locks Admin</div>
            <div className="text-xs text-blue-200">Connect to the production backend</div>
          </div>
        </div>
        <CardContent className="pt-5">
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium">Your name</span>
              <Input required value={form.actor} onChange={set('actor')} placeholder="e.g. Rafe" />
              <span className="block text-xs text-muted-foreground">Every action you take is recorded in the audit log under this name.</span>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Admin API key</span>
              <Input required type="password" value={form.key} onChange={set('key')} placeholder="ADMIN_API_KEY from Railway" />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Backend URL</span>
              <Input required type="url" value={form.url} onChange={set('url')} />
            </label>
            <ErrorNote error={error} />
            <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Connecting…' : 'Connect'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function App() {
  const saved = loadConnection()
  const [conn, setConn] = useState(saved.url && saved.key && saved.actor ? saved : null)
  const [page, setPage] = useState(pageFromHash)

  useEffect(() => {
    const onHash = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (conn) setConnection(conn)
  if (!conn) return <Connect initial={saved} onConnected={setConn} />

  const Page = PAGES[page]
  const navigate = (id) => { window.location.hash = `/${id}` }
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      <Sidebar
        page={page}
        onNavigate={navigate}
        actor={conn.actor}
        onDisconnect={() => { clearConnection(); setConn(null) }}
      />
      <main className="flex-1 min-w-0 px-3 py-4 md:px-4">
        <Page navigate={navigate} />
      </main>
    </div>
  )
}
