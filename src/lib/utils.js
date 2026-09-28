import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

export function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** "3m ago" / "in 5h 12m" relative to now. */
export function relative(iso) {
  if (!iso) return ''
  const diff = new Date(iso) - new Date()
  const abs = Math.abs(diff)
  const m = Math.round(abs / 60000)
  let s
  if (m < 1) s = 'under a minute'
  else if (m < 60) s = `${m}m`
  else if (m < 60 * 24) s = `${Math.floor(m / 60)}h ${m % 60}m`
  else s = `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`
  return diff >= 0 ? `in ${s}` : `${s} ago`
}

export function duration(run) {
  if (!run?.started_at) return '—'
  const end = run.finished_at ? new Date(run.finished_at) : new Date()
  const sec = Math.max(0, Math.round((end - new Date(run.started_at)) / 1000))
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}
