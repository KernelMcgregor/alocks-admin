import { Play, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import RunButton from '../components/RunButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, ErrorNote, PageTitle, StatusBadge } from '../components/ui'
import { api } from '../lib/api'
import { ACTION_GROUPS } from '../lib/actions'
import { relative } from '../lib/utils'

export function LastRun({ run }) {
  if (!run) return <span className="text-xs text-muted-foreground">Never run</span>
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" title={run.error || ''}>
      <StatusBadge status={run.status} />
      {relative(run.started_at)} · {run.actor}
    </span>
  )
}

export default function Actions() {
  const [last, setLast] = useState({})
  const [error, setError] = useState(null)
  const load = useCallback(() => { api('/admin/last-runs').then(setLast).catch(setError) }, [])
  useEffect(load, [load])

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon={Play} title="Actions" subtitle="run a job by hand" />
      <ErrorNote error={error} />
      {ACTION_GROUPS.map((g) => (
        <Card key={g.title}>
          <CardHeader>
            <CardTitle>{g.title}</CardTitle>
            {g.description && <CardDescription>{g.description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-md border border-border">
              {g.actions.map((a) => (
                <div key={a.endpoint} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-56 flex-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      {a.label}
                      {a.danger && <span title="Slow or hard to undo"><TriangleAlert className="h-3.5 w-3.5 text-amber-600" /></span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{a.what}</div>
                  </div>
                  <LastRun run={last[a.runLabel]} />
                  <RunButton endpoint={a.endpoint} title={a.label} what={a.what}
                    variant={a.danger ? 'outline' : 'default'} onFinished={load} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
