import { Database, Play } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorNote, PageTitle } from '../components/ui'
import { api } from '../lib/api'

const PRESETS = {
  'Missing results': `SELECT e.name AS event, e.date, f.id AS fight_id, r.first_name || ' ' || r.last_name AS red,
  b.first_name || ' ' || b.last_name AS blue, f.weight_class
FROM ufc.ufc_fights f
JOIN ufc.ufc_events e ON f.event_id = e.id
JOIN ufc.ufc_fighters r ON f.red_fighter_id = r.id
JOIN ufc.ufc_fighters b ON f.blue_fighter_id = b.id
WHERE f.method IS NULL AND e.date < CURRENT_DATE
ORDER BY e.date DESC LIMIT 50`,
  'Upcoming fights': `SELECT e.name AS event, e.date, f.id AS fight_id, r.first_name || ' ' || r.last_name AS red,
  b.first_name || ' ' || b.last_name AS blue, f.weight_class
FROM ufc.ufc_fights f
JOIN ufc.ufc_events e ON f.event_id = e.id
JOIN ufc.ufc_fighters r ON f.red_fighter_id = r.id
JOIN ufc.ufc_fighters b ON f.blue_fighter_id = b.id
WHERE e.date >= CURRENT_DATE
ORDER BY e.date, f.card_position`,
  'Audit log': `SELECT id, parent_id, action, source, actor, status, started_at, finished_at, error
FROM admin_action_runs ORDER BY id DESC LIMIT 100`,
  'Locked fighter fields': `SELECT id, first_name, last_name, country_code, locked_fields
FROM ufc.ufc_fighters WHERE locked_fields IS NOT NULL`,
  'List tables': `SELECT table_schema, table_name FROM information_schema.tables
WHERE table_schema IN ('public', 'ufc') ORDER BY 1, 2`,
}

export default function DatabasePage() {
  const [sql, setSql] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!sql.trim()) return
    setBusy(true)
    setError(null)
    try {
      setResult(await api('/admin/query', { method: 'POST', body: { sql } }))
    } catch (e) {
      setError(e)
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={Database} title="Database" subtitle="read-only SQL against production" />
      <Card>
        <CardHeader>
          <CardTitle>Query</CardTitle>
          <CardDescription>SELECT only — writes are rejected by the server. Up to 200 rows. ⌘/Ctrl + Enter to run.</CardDescription>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(PRESETS).map(([name, q]) => (
              <Button key={name} variant="outline" size="sm" onClick={() => setSql(q)}>{name}</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run() } }}
            spellCheck={false}
            rows={7}
            placeholder="SELECT * FROM ufc.ufc_events ORDER BY date DESC LIMIT 10"
            className="w-full rounded-md border border-border bg-background p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button onClick={run} disabled={busy}><Play className="h-3.5 w-3.5" /> {busy ? 'Running…' : 'Run query'}</Button>
          <ErrorNote error={error} />
          {result && (
            result.rows.length === 0 ? <p className="text-sm text-muted-foreground">No rows returned.</p> : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full font-mono text-xs">
                  <thead className="bg-slate-50">
                    <tr>{result.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        {result.columns.map((c) => (
                          <td key={c} title={String(row[c])} className="max-w-xs truncate whitespace-nowrap px-3 py-1.5">
                            {row[c] === null ? <span className="text-muted-foreground">NULL</span> : String(row[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">{result.count} rows</div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
