import { useEffect, useState } from 'react'
import { api } from './api'

/** Poll a run until it leaves "running". Returns the latest snapshot (with steps). */
export function useRun(runId) {
  const [run, setRun] = useState(null)
  useEffect(() => {
    if (!runId) { setRun(null); return }
    let cancelled = false
    let timer
    const tick = async () => {
      try {
        const r = await api(`/admin/runs/${runId}`)
        if (cancelled) return
        setRun(r)
        if (r.status === 'running') timer = setTimeout(tick, 3000)
      } catch {
        if (!cancelled) timer = setTimeout(tick, 5000)
      }
    }
    tick()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [runId])
  return run
}
