import { ExternalLink } from 'lucide-react'
import { duration, formatDateTime } from '../lib/utils'
import { SourceBadge, StatusBadge } from './ui'

function KeyValues({ data }) {
  if (!data || typeof data !== 'object') {
    return data ? <pre className="whitespace-pre-wrap text-xs">{String(data)}</pre> : null
  }
  const entries = Object.entries(data).filter(([, v]) => v !== null && v !== undefined && v !== '')
  if (!entries.length) return null
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k.replaceAll('_', ' ')}</dt>
          <dd className="font-mono break-all">
            {k === 'url' && typeof v === 'string' ? (
              <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                Open on GitHub <ExternalLink className="h-3 w-3" />
              </a>
            ) : typeof v === 'object' ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A fighter edit's summary as a readable before → after list. */
function Changes({ summary }) {
  const changes = summary?.changes || {}
  return (
    <div className="space-y-1 text-xs">
      {Object.entries(changes).map(([field, { from, to }]) => (
        <div key={field}>
          <span className="text-muted-foreground">{field.replaceAll('_', ' ')}: </span>
          <span className="line-through text-red-600">{from ?? 'empty'}</span>
          {' → '}
          <span className="font-medium text-emerald-700">{to ?? 'empty'}</span>
        </div>
      ))}
      {summary?.unlocked?.length > 0 && (
        <div className="text-muted-foreground">Handed back to scrapers: {summary.unlocked.join(', ')}</div>
      )}
    </div>
  )
}

export default function RunDetail({ run }) {
  if (!run) return null
  const isEdit = run.summary && typeof run.summary === 'object' && 'changes' in run.summary
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Run #{run.id}</span>
        <SourceBadge source={run.source} />
        <span>by <span className="font-medium text-foreground">{run.actor || 'unknown'}</span></span>
        <span>started {formatDateTime(run.started_at)}</span>
        {run.finished_at && <span>finished {formatDateTime(run.finished_at)}</span>}
        <span>took {duration(run)}</span>
      </div>

      {run.error && (
        <pre className="whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{run.error}</pre>
      )}

      {run.steps?.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Steps</div>
          <ol className="divide-y divide-border rounded-md border border-border">
            {run.steps.map((s, i) => (
              <li key={s.id} className="px-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-xs text-muted-foreground">{i + 1}.</span>
                  <span className="flex-1 font-medium">{s.action}</span>
                  <span className="text-xs text-muted-foreground">{duration(s)}</span>
                  <StatusBadge status={s.status} />
                </div>
                {s.error && <pre className="mt-1 ml-8 whitespace-pre-wrap text-xs text-red-700">{s.error}</pre>}
              </li>
            ))}
          </ol>
        </div>
      )}

      {isEdit ? (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Changes</div>
          <Changes summary={run.summary} />
        </div>
      ) : run.summary && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result</div>
          <KeyValues data={Object.fromEntries(Object.entries(run.summary).filter(([k]) => k !== 'steps'))} />
        </div>
      )}

      {run.params && Object.keys(run.params).length > 0 && (
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parameters</div>
          <KeyValues data={run.params} />
        </div>
      )}
    </div>
  )
}
