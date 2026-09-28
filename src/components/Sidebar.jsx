import { CalendarClock, Database, History, LayoutDashboard, LogOut, Play, Trophy, UserPen } from 'lucide-react'
import logoSrc from '../logo.png'
import { cn } from '../lib/utils'

export const NAV = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'results', label: 'Event Results', icon: Trophy },
  { id: 'actions', label: 'Actions', icon: Play },
  { id: 'schedule', label: 'Schedule', icon: CalendarClock },
  { id: 'audit', label: 'Audit Log', icon: History },
  { id: 'fighters', label: 'Fighters', icon: UserPen },
  { id: 'database', label: 'Database', icon: Database },
]

export default function Sidebar({ page, onNavigate, actor, onDisconnect }) {
  return (
    <aside className="w-full md:w-64 shrink-0 p-3 md:h-screen md:sticky md:top-0">
      <div className="flex h-full flex-col rounded-xl bg-gradient-to-b from-blue-600 to-blue-700 shadow-lg">
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <img src={logoSrc} alt="Alpha Locks" className="h-10 w-10 rounded-full" />
          <div>
            <div className="text-xl font-bold text-white tracking-tight leading-tight">Alpha Locks</div>
            <div className="text-[10px] text-blue-200 tracking-wide">Admin Console</div>
          </div>
        </div>
        <div className="mx-4 border-t border-blue-400/30" />
        <nav className="flex-1 p-3 space-y-0.5 flex flex-row flex-wrap md:flex-col md:flex-nowrap">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-white/10 cursor-pointer md:w-full',
                page === id ? 'bg-white/15 text-white font-semibold' : 'text-blue-100',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="mx-4 border-t border-blue-400/30" />
        <div className="flex items-center gap-2 px-5 py-3 text-xs text-blue-100">
          <span className="truncate">Signed in as <span className="font-semibold text-white">{actor}</span></span>
          <button onClick={onDisconnect} className="ml-auto rounded p-1 hover:bg-white/10 cursor-pointer" title="Disconnect">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
