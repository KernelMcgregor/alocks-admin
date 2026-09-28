import { ArrowRight, LayoutDashboard, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import RunButton from '../components/RunButton'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, ErrorNote, PageTitle } from '../components/ui'
import { api } from '../lib/api'
import { formatDate, formatDateTime, relative } from '../lib/utils'
import { RunsTable } from './AuditLog'
import { fetchWhat, ResultsBadge } from './EventResults'
import { RunnerBadge } from './Schedule'

export default function Overview({ navigate }) {
  const [events, setEvents] = useState(null)
  const [schedule, setSchedule] = useState(null)
  const [runs, setRuns] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api('/admin/events/recent?limit=6').then(setEvents).catch(setError)
    api('/admin/schedule').then((d) => setSchedule(d.items)).catch(setError)
    api('/admin/runs?limit=10').then((d) => setRuns(d.runs)).catch(setError)
  }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [load])

  const missing = events?.filter((e) => e.missing_results && e.fights) ?? []
  const running = runs?.filter((r) => r.status === 'running') ?? []
  const failed = runs?.filter((r) => r.status === 'error' || r.status === 'partial') ?? []

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={LayoutDashboard} title="Overview" />
      <ErrorNote error={error} />

      {missing.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <TriangleAlert className="h-5 w-5 text-amber-600" />
          <div className="flex-1 min-w-48">
            <div className="font-semibold text-amber-900">{e.name} is missing results</div>
            <div className="text-sm text-amber-800">{formatDate(e.date)} · {e.with_result} of {e.fights} fights have a result</div>
          </div>
          <RunButton endpoint={`/admin/events/${e.id}/fetch-results`} title="Get results & stats"
            what={fetchWhat(e)} label="Get results & stats" onFinished={load} />
        </div>
      ))}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Up next</CardTitle>
            <CardDescription>Scheduled jobs, soonest first.</CardDescription>
          </CardHeader>
          <CardContent>
            {!schedule ? <Empty>Loading…</Empty> : (
              <div className="divide-y divide-border">
                {schedule.slice(0, 5).map((i) => (
                  <div key={i.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="w-32 shrink-0">
                      <div className="text-sm font-medium">{relative(i.next_run)}</div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(i.next_run)}</div>
                    </div>
                    <div className="flex-1 min-w-32 text-sm font-medium">{i.name}</div>
                    <RunnerBadge runner={i.runner} />
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('schedule')}>Full schedule <ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent events</CardTitle>
            <CardDescription>Results coverage for the last few cards.</CardDescription>
          </CardHeader>
          <CardContent>
            {!events ? <Empty>Loading…</Empty> : (
              <div className="divide-y divide-border">
                {events.map((e) => (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="w-24 shrink-0 text-xs text-muted-foreground">{formatDate(e.date)}</div>
                    <div className="flex-1 min-w-32 truncate text-sm font-medium">{e.name}</div>
                    <ResultsBadge event={e} />
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('results')}>Event results <ArrowRight className="h-3.5 w-3.5" /></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>
            {running.length ? `${running.length} running now. ` : ''}
            {failed.length ? `${failed.length} of the last ${runs.length} runs failed or partly failed.` : 'Latest runs from the audit log.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!runs ? <Empty>Loading…</Empty> : !runs.length ? <Empty>No runs recorded yet.</Empty> : <RunsTable runs={runs} />}
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => navigate('audit')}>Audit log <ArrowRight className="h-3.5 w-3.5" /></Button>
        </CardContent>
      </Card>
    </div>
  )
}
