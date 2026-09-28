import { CalendarClock, RefreshCw, Server, Workflow } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, ErrorNote, PageTitle } from '../components/ui'
import { api } from '../lib/api'
import { formatDateTime, relative } from '../lib/utils'
import { LastRun } from './Actions'

export function RunnerBadge({ runner }) {
  return runner === 'github'
    ? <Badge className="border-slate-300 bg-white text-slate-700 font-medium"><Workflow className="h-3 w-3" /> GitHub Actions</Badge>
    : <Badge className="border-violet-200 bg-white text-violet-700 font-medium"><Server className="h-3 w-3" /> Backend</Badge>
}

export default function Schedule() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const load = useCallback(() => { api('/admin/schedule').then(setData).catch(setError) }, [])
  useEffect(() => {
    load()
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  const backendJobs = data?.items.filter((i) => i.runner === 'backend').length ?? 0
  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={CalendarClock} title="Schedule" subtitle="what runs next, on its own">
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-3.5 w-3.5" /> Refresh</Button>
      </PageTitle>
      <ErrorNote error={error} />
      {data && backendJobs === 0 && (
        <ErrorNote error={new Error('The backend scheduler reports no jobs. Nightly results, odds and markets will not run from the backend until it restarts cleanly.')} />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming runs</CardTitle>
          <CardDescription>
            Two runners write to production: the backend's own scheduler (stops whenever the backend is down) and
            GitHub Actions workflows in the backend repo. Times are in your local timezone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data ? <Empty>Loading…</Empty> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-semibold">Next run</th>
                    <th className="py-2 pr-4 font-semibold">Job</th>
                    <th className="py-2 pr-4 font-semibold">Runs on</th>
                    <th className="py-2 pr-4 font-semibold">Last run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((i) => (
                    <tr key={i.id} className="align-top">
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <div className="font-medium">{formatDateTime(i.next_run)}</div>
                        <div className="text-xs text-primary">{relative(i.next_run)}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium">{i.name}</div>
                        <div className="text-xs text-muted-foreground">{i.description}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{i.trigger}</div>
                      </td>
                      <td className="py-3 pr-4"><RunnerBadge runner={i.runner} /></td>
                      <td className="py-3 pr-4"><LastRun run={i.last_run} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
