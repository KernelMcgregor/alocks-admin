import { Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api, currentActor } from '../lib/api'
import { useRun } from '../lib/useRun'
import RunDetail from './RunDetail'
import { Button, ErrorNote, Modal, StatusBadge } from './ui'

/**
 * Confirm → start → live progress for one admin action. Every start is confirmed: these
 * write to production, and the confirmation names exactly what will run and under whose
 * name it will be logged.
 */
export default function RunButton({
  endpoint, title, what, label = 'Run', variant = 'default', size = 'sm', onFinished, className,
}) {
  const [confirming, setConfirming] = useState(false)
  const [runId, setRunId] = useState(null)
  const [error, setError] = useState(null)
  const [starting, setStarting] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const run = useRun(runId)
  const notified = useRef(null)

  // Tell the page once per run, so it can reload whatever the run changed.
  useEffect(() => {
    if (run && run.status !== 'running' && notified.current !== run.id) {
      notified.current = run.id
      onFinished?.(run)
    }
  }, [run, onFinished])

  const start = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await api(endpoint, { method: 'POST' })
      setRunId(res.task_id)
      setShowDetail(true)
      setConfirming(false)
    } catch (e) {
      setError(e)
    } finally {
      setStarting(false)
    }
  }

  const running = run?.status === 'running'
  return (
    <>
      <div className="flex items-center gap-2">
        {run && (
          <button onClick={() => setShowDetail(true)} className="cursor-pointer" title="View progress">
            <StatusBadge status={run.status} />
          </button>
        )}
        <Button variant={variant} size={size} className={className} disabled={running || starting}
          onClick={() => { setError(null); setConfirming(true) }}>
          <Play className="h-3.5 w-3.5" />
          {running ? 'Running…' : label}
        </Button>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={title}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button size="sm" onClick={start} disabled={starting}>{starting ? 'Starting…' : 'Yes, run it'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>{what}</div>
          <p className="text-muted-foreground">
            This writes to the production database. It will be logged in the audit log as run by{' '}
            <span className="font-medium text-foreground">{currentActor()}</span>.
          </p>
          <ErrorNote error={error} />
        </div>
      </Modal>

      <Modal
        open={showDetail && !!run}
        onClose={() => setShowDetail(false)}
        title={<span className="flex items-center gap-2">{title} {run && <StatusBadge status={run.status} />}</span>}
        footer={<Button variant="outline" size="sm" onClick={() => setShowDetail(false)}>Close</Button>}
      >
        {running && <p className="mb-3 text-muted-foreground">You can close this — it keeps running, and the result will be in the audit log.</p>}
        <RunDetail run={run} />
      </Modal>
    </>
  )
}
