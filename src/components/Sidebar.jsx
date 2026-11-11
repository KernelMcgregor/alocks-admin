import { CalendarClock, Database, FileText, History, LayoutDashboard, LogOut, Play, Trophy, UserPen } from 'lucide-react'
import logoSrc from '../logo.png'
import { cn } from '../lib/utils'

export const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'results', label: 'Event Results', icon: Trophy },
  { id: 'actions', label: 'Actions', icon: Play },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'audit', label: 'Audit Log', icon: History },
  { id: 'fighters', label: 'Fighters', icon: UserPen },
  { id: 'articles', label: 'Articles', icon: FileText },
  { id: 'database', label: 'Database', icon: Database },
]

export default function Sidebar({ page, onNavigate, actor, onDisconnect }) {
  return (
    <aside className="w-full md:w-64 shrink-0 p-3 md:h-screen md:sticky md:top-0">
      <div className="flex h-full flex-col rounded-xl bg-ink shadow-lg">
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <img src={logoSrc} alt="Chinlytics" className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <div className="font-display text-[26px] font-extrabold italic uppercase leading-none tracking-tight">
              <span className="text-white">Chin</span><span className="text-primary">lytics</span>
            </div>
            <div className="mt-1 text-[8.5px] font-semibold uppercase tracking-[0.22em] text-slate-400">Admin Console</div>
          </div>
        </div>
        <div className="mx-4 border-t border-white/10" />
        <nav className="flex-1 p-3 space-y-0.5 flex flex-row flex-wrap md:flex-col md:flex-nowrap">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer md:w-full',
                page === id
                  ? 'bg-white/10 text-white font-semibold before:absolute before:inset-y-1 before:left-0 before:w-[3px] before:rounded-full before:bg-primary'
                  : 'text-neutral-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mx-4 border-t border-white/10" />
        <div className="flex items-center gap-2 px-5 py-3 text-xs text-neutral-300">
          <span className="truncate">Signed in as <span className="font-semibold text-white">{actor}</span></span>
          <button onClick={onDisconnect} className="ml-auto rounded p-1 hover:bg-white/10 cursor-pointer" title="Disconnect">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
