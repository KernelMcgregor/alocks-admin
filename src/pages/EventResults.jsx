import { CheckCircle2, RefreshCw, Trophy } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import RunButton from '../components/RunButton'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, ErrorNote, PageTitle, StatusBadge } from '../components/ui'
import { api } from '../lib/api'
import { cn, formatDate, formatDateTime } from '../lib/utils'

export const FETCH_STEPS = [
  'Scrape results and fight stats from ufcstats.com',
  'Derived fight stats and career stats',
  'Rankings, then rank history',
  'Fighter similarity',
  'Winner and method predictions for upcoming fights',
]

export function fetchWhat(event) {
  return (
    <>
      Fetch results and stats for <span className="font-semibold">{event.name}</span> ({formatDate(event.date)}), then rebuild:
      <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-muted-foreground">
        {FETCH_STEPS.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <span className="mt-2 block text-muted-foreground">Takes a few minutes. Existing results for this card are overwritten with what ufcstats has now.</span>
    </>
  )
}

export function ResultsBadge({ event }) {
  if (!event.fights) return <Badge className="border-slate-200 bg-slate-50 text-slate-600">No fights stored</Badge>
  const complete = !event.missing_results
  return (
    <Badge className={cn(complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800')}>
      {complete && <CheckCircle2 className="h-3 w-3" />}
      {event.with_result}/{event.fights} results
    </Badge>
  )
}

export default function EventResults() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    api('/admin/events/recent?limit=12').then(setEvents).catch(setError)
  }, [])
  useEffect(load, [load])

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={Trophy} title="Event Results" subtitle="fetch results & stats for a card by hand">
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
      </PageTitle>

      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
          <CardDescription>
            Results normally arrive with the nightly job. If a card shows missing results the morning after
            (the backend was down, or ufcstats posted late), fetch them here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorNote error={error} />
          {!events ? <Empty>Loading…</Empty> : !events.length ? <Empty icon={Trophy}>No past events.</Empty> : (
            <div className="divide-y divide-border rounded-md border border-border">
              {events.map((e) => (
                <div key={e.id} className={cn('flex flex-wrap items-center gap-3 px-4 py-3', e.missing_results && 'bg-amber-50/40')}>
                  <div className="w-28 shrink-0 text-sm text-muted-foreground">{formatDate(e.date)}</div>
                  <div className="min-w-48 flex-1">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.last_fetch
                        ? <>Last fetched {formatDateTime(e.last_fetch.started_at)} by {e.last_fetch.actor} · <StatusBadge status={e.last_fetch.status} className="align-middle" /></>
                        : e.location}
                    </div>
                  </div>
                  <ResultsBadge event={e} />
                  <RunButton
                    endpoint={`/admin/events/${e.id}/fetch-results`}
                    title="Get results & stats"
                    what={fetchWhat(e)}
                    label={e.missing_results ? 'Get results & stats' : 'Re-fetch'}
                    variant={e.missing_results ? 'default' : 'outline'}
                    onFinished={load}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
