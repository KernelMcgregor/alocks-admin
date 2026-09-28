import { ChevronRight, History, RefreshCw } from 'lucide-react'
import { Fragment, useCallback, useEffect, useState } from 'react'
import RunDetail from '../components/RunDetail'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, ErrorNote, Input, PageTitle, Select, SourceBadge, StatusBadge } from '../components/ui'
import { api } from '../lib/api'
import { cn, duration, formatDateTime, relative } from '../lib/utils'

function targetLabel(run) {
  if (run.params?.fighter) return run.params.fighter
  if (run.summary?.event) return run.summary.event
  return run.target || ''
}

export function RunsTable({ runs, compact = false }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-6" />
            <th className="py-2 pr-4 font-semibold">When</th>
            <th className="py-2 pr-4 font-semibold">Action</th>
            <th className="py-2 pr-4 font-semibold">Status</th>
            {!compact && <th className="py-2 pr-4 font-semibold">Source</th>}
            <th className="py-2 pr-4 font-semibold">By</th>
            {!compact && <th className="py-2 pr-4 font-semibold">Took</th>}
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const isOpen = open === r.id
            return (
              <Fragment key={r.id}>
                <tr
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className={cn('cursor-pointer border-b border-border hover:bg-slate-50', isOpen && 'bg-slate-50')}
                >
                  <td className="pl-1"><ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} /></td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">
                    <div>{formatDateTime(r.started_at)}</div>
                    <div className="text-xs text-muted-foreground">{relative(r.started_at)}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="font-medium">{r.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {targetLabel(r)}
                      {r.steps?.length > 0 && <>{targetLabel(r) && ' · '}{r.steps.length} steps{r.steps.some((s) => s.status === 'error') && <span className="text-red-600"> ({r.steps.filter((s) => s.status === 'error').length} failed)</span>}</>}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4"><StatusBadge status={r.status} /></td>
                  {!compact && <td className="py-2.5 pr-4"><SourceBadge source={r.source} /></td>}
                  <td className="py-2.5 pr-4 whitespace-nowrap">{r.actor || '—'}</td>
                  {!compact && <td className="py-2.5 pr-4 whitespace-nowrap text-muted-foreground">{duration(r)}</td>}
                </tr>
                {isOpen && (
                  <tr className="border-b border-border bg-slate-50/60">
                    <td />
                    <td colSpan={compact ? 4 : 6} className="py-3 pr-4"><RunDetail run={r} /></td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function AuditLog() {
  const [filters, setFilters] = useState({ status: '', source: '', action: '' })
  const [runs, setRuns] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState(null)

  const query = useCallback((extra = {}) => {
    const p = new URLSearchParams({ limit: '50', ...extra })
    for (const [k, v] of Object.entries(filters)) if (v) p.set(k, v)
    return api(`/admin/runs?${p}`)
  }, [filters])

  const load = useCallback(() => {
    setError(null)
    query().then((d) => { setRuns(d.runs); setHasMore(d.has_more) }).catch(setError)
  }, [query])

  useEffect(() => { load() }, [load])

  // Keep live while anything is running; otherwise stay put so an open row does not jump.
  const anyRunning = runs?.some((r) => r.status === 'running')
  useEffect(() => {
    if (!anyRunning) return
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [anyRunning, load])

  const more = () => query({ before_id: String(runs[runs.length - 1].id) })
    .then((d) => { setRuns([...runs, ...d.runs]); setHasMore(d.has_more) })
    .catch(setError)

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value })
  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={History} title="Audit Log" subtitle="every action that touched production">
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
      </PageTitle>
      <Card>
        <CardHeader>
          <CardTitle>Runs</CardTitle>
          <CardDescription>
            Dashboard actions, scheduled jobs, GitHub Actions workflows and fighter edits. Click a row for its steps,
            parameters, result and any error. Nothing here can be edited or deleted.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Input className="w-56" placeholder="Filter by action…" value={filters.action} onChange={set('action')} />
            <Select value={filters.status} onChange={set('status')}>
              <option value="">Any status</option>
              <option value="running">Running</option>
              <option value="done">Succeeded</option>
              <option value="partial">Partly failed</option>
              <option value="error">Failed</option>
              <option value="interrupted">Interrupted</option>
            </Select>
            <Select value={filters.source} onChange={set('source')}>
              <option value="">Any source</option>
              <option value="manual">Dashboard</option>
              <option value="scheduled">Scheduled</option>
              <option value="github">GitHub Actions</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ErrorNote error={error} />
          {!runs ? <Empty>Loading…</Empty> : !runs.length ? <Empty icon={History}>No runs match.</Empty> : (
            <>
              <RunsTable runs={runs} />
              {hasMore && <div className="pt-3 text-center"><Button variant="outline" size="sm" onClick={more}>Load older</Button></div>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
