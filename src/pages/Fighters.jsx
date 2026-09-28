import { Lock, Search, Unlock, UserPen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RunsTable } from './AuditLog'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, ErrorNote, Input, Modal, PageTitle } from '../components/ui'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

const FIELDS = [
  { key: 'nickname', label: 'Nickname' },
  { key: 'country_code', label: 'Nationality (flag)', hint: '2-letter code: US, BR, IE… UK nations: GB-ENG, GB-SCT, GB-WLS, GB-NIR', placeholder: 'US' },
  { key: 'birthplace', label: 'Birthplace' },
  { key: 'birth_country', label: 'Birth country' },
  { key: 'fighting_style', label: 'Fighting style' },
  { key: 'trains_at', label: 'Trains at' },
  { key: 'dob', label: 'Date of birth', type: 'date' },
  { key: 'status', label: 'Status', hint: 'Active, Retired, Not Fighting…' },
]

function Flag({ code }) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return null
  // Regional-indicator letters render as the flag emoji on most systems.
  const emoji = String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)))
  return <span className="text-lg leading-none">{emoji}</span>
}

function Editor({ fighterId }) {
  const [fighter, setFighter] = useState(null)
  const [form, setForm] = useState({})
  const [unlock, setUnlock] = useState([])
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const load = () => api(`/admin/fighters/${fighterId}`).then((f) => {
    setFighter(f)
    setForm(Object.fromEntries(FIELDS.map(({ key }) => [key, f.fields[key] ?? ''])))
    setUnlock([])
    setFieldErrors({})
  }).catch(setError)
  useEffect(() => { setFighter(null); setSaved(false); load() }, [fighterId])

  if (error && !fighter) return <ErrorNote error={error} />
  if (!fighter) return <Empty>Loading…</Empty>

  const changes = FIELDS.filter(({ key }) => (fighter.fields[key] ?? '') !== (form[key] ?? '').trim())
  const dirty = changes.length > 0 || unlock.length > 0

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await api(`/admin/fighters/${fighterId}`, {
        method: 'PATCH',
        body: { fields: Object.fromEntries(changes.map(({ key }) => [key, form[key]])), unlock },
      })
      setConfirming(false)
      setSaved(true)
      await load()
    } catch (e) {
      setFieldErrors(e.detail?.fields || {})
      setError(e)
      setConfirming(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag code={fighter.fields.country_code} />
            {fighter.first_name} {fighter.last_name}
            <span className="text-sm font-normal text-muted-foreground">{fighter.record}</span>
          </CardTitle>
          <CardDescription>
            Fields you edit get locked (<Lock className="inline h-3 w-3" />), so the ufcstats and ufc.com scrapers stop
            overwriting them. Unlock a field to hand it back to the scrapers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(({ key, label, hint, placeholder, type }) => {
              const locked = fighter.locked_fields.includes(key) && !unlock.includes(key)
              const changed = (fighter.fields[key] ?? '') !== (form[key] ?? '').trim()
              return (
                <label key={key} className="block space-y-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    {label}
                    {fighter.locked_fields.includes(key) && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setUnlock(locked ? [...unlock, key] : unlock.filter((k) => k !== key)) }}
                        className={cn('inline-flex items-center gap-0.5 rounded px-1 text-xs font-normal cursor-pointer',
                          locked ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-100')}
                        title={locked ? 'Locked — scrapers skip this field. Click to unlock.' : 'Will be unlocked on save. Click to keep locked.'}
                      >
                        {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {locked ? 'locked' : 'unlocking'}
                      </button>
                    )}
                  </span>
                  <Input
                    type={type || 'text'}
                    value={form[key] ?? ''}
                    placeholder={placeholder}
                    onChange={(e) => { setSaved(false); setForm({ ...form, [key]: e.target.value }) }}
                    className={cn(changed && 'border-blue-400 bg-blue-50/40', fieldErrors[key] && 'border-red-400')}
                  />
                  {fieldErrors[key] ? <span className="block text-xs text-red-600">{fieldErrors[key]}</span>
                    : hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
                </label>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button disabled={!dirty} onClick={() => setConfirming(true)}>Review & save</Button>
            {dirty && <Button variant="outline" onClick={load}>Discard</Button>}
            {saved && !dirty && <span className="text-sm text-emerald-700">Saved and logged.</span>}
          </div>
          {error && <div className="mt-3"><ErrorNote error={error} /></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit history</CardTitle>
          <CardDescription>Every manual change to this fighter, from the audit log.</CardDescription>
        </CardHeader>
        <CardContent>
          {fighter.history.length ? <RunsTable runs={fighter.history} compact /> : <Empty>No manual edits yet.</Empty>}
        </CardContent>
      </Card>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Save changes to ${fighter.first_name} ${fighter.last_name}`}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-2">
          {changes.map(({ key, label }) => (
            <div key={key}>
              <span className="text-muted-foreground">{label}: </span>
              <span className="text-red-600 line-through">{fighter.fields[key] || 'empty'}</span>
              {' → '}
              <span className="font-medium text-emerald-700">{form[key].trim() || 'empty'}</span>
            </div>
          ))}
          {unlock.length > 0 && <div className="text-muted-foreground">Unlock for scrapers: {unlock.join(', ')}</div>}
          <p className="pt-2 text-muted-foreground">Changes show on the live site within a minute and are recorded in the audit log.</p>
        </div>
      </Modal>
    </div>
  )
}

export default function Fighters() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      api(`/admin/fighters?q=${encodeURIComponent(q.trim())}`).then(setResults).catch(setError)
    }, 250)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={UserPen} title="Fighters" subtitle="edit nationality and bio" />
      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="md:w-80 shrink-0 self-start">
          <CardHeader>
            <CardTitle>Find a fighter</CardTitle>
            <div className="relative pt-1">
              <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" autoFocus placeholder="Name or nickname" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            <ErrorNote error={error} />
            {q.trim().length < 2 ? <Empty>Type at least 2 letters.</Empty> : !results.length ? <Empty>No matches.</Empty> : (
              <div className="-mx-2 space-y-0.5">
                {results.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelected(f.id)}
                    className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent cursor-pointer',
                      selected === f.id && 'bg-blue-50 font-semibold text-blue-700')}
                  >
                    <Flag code={f.country_code} />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{f.record}</span>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <div className="min-w-0 flex-1">
          {selected ? <Editor fighterId={selected} /> : (
            <Card><CardContent className="pt-5"><Empty icon={UserPen}>Select a fighter to edit.</Empty></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  )
}
