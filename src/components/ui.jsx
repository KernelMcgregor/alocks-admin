import { CheckCircle2, CircleDashed, Loader2, TriangleAlert, XCircle } from 'lucide-react'
import { cn } from '../lib/utils'

export function Card({ className, ...props }) {
  return <div className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 p-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn('text-base font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
}
const buttonSizes = { default: 'h-10 px-4 py-2', sm: 'h-8 rounded-md px-3 text-xs', icon: 'h-8 w-8' }

export function Button({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        buttonVariants[variant], buttonSizes[size], className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, ...props }) {
  return (
    <select
      className={cn('h-9 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
      {...props}
    />
  )
}

export function Badge({ className, ...props }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold', className)} {...props} />
}

export const STATUS = {
  running: { label: 'Running', icon: Loader2, cls: 'border-blue-200 bg-blue-50 text-blue-700', spin: true },
  done: { label: 'Succeeded', icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  partial: { label: 'Partly failed', icon: TriangleAlert, cls: 'border-amber-200 bg-amber-50 text-amber-800' },
  error: { label: 'Failed', icon: XCircle, cls: 'border-red-200 bg-red-50 text-red-700' },
  interrupted: { label: 'Interrupted', icon: CircleDashed, cls: 'border-slate-200 bg-slate-50 text-slate-600' },
}

export function StatusBadge({ status, className }) {
  const s = STATUS[status] || { label: status, icon: CircleDashed, cls: 'border-slate-200 bg-slate-50 text-slate-600' }
  const Icon = s.icon
  return (
    <Badge className={cn(s.cls, className)}>
      <Icon className={cn('h-3 w-3', s.spin && 'animate-spin')} />
      {s.label}
    </Badge>
  )
}

const SOURCES = {
  manual: { label: 'Dashboard', cls: 'border-blue-200 text-blue-700' },
  scheduled: { label: 'Scheduled', cls: 'border-violet-200 text-violet-700' },
  github: { label: 'GitHub Actions', cls: 'border-slate-300 text-slate-700' },
  cli: { label: 'CLI', cls: 'border-slate-300 text-slate-700' },
}

export function SourceBadge({ source }) {
  const s = SOURCES[source] || { label: source, cls: 'border-slate-300 text-slate-700' }
  return <Badge className={cn('bg-white font-medium', s.cls)}>{s.label}</Badge>
}

export function PageTitle({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 shrink-0">
      <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Icon className="h-5 w-5 text-white" />
        </span>
        {title}
        {subtitle && <span className="text-sm font-medium text-muted-foreground">— {subtitle}</span>}
      </h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  )
}

export function Empty({ icon: Icon, children }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
      {Icon && <Icon className="h-8 w-8 text-slate-300" />}
      {children}
    </div>
  )
}

export function ErrorNote({ error }) {
  if (!error) return null
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error.message || String(error)}
    </div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-border px-5 py-4 text-base font-semibold">{title}</div>
        <div className="px-5 py-4 text-sm">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
