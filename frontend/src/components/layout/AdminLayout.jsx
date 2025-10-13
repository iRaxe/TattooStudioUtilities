import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Gift, Users2, CalendarClock, LogOut } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/gift-cards', label: 'Gift card', icon: Gift },
  { to: '/admin/customers', label: 'Clienti', icon: Users2 },
  { to: '/admin/appointments', label: 'Agenda', icon: CalendarClock }
]

export function AdminLayout({ onLogout, children }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      <aside className="hidden w-72 flex-col border-r border-white/5 bg-black/20 p-6 md:flex">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Tink Studio</p>
          <h1 className="text-2xl font-semibold text-foreground">Control Room</h1>
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/20 text-primary-foreground shadow-[0_15px_50px_-20px_rgba(248,113,113,0.6)]'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" className="justify-start text-muted-foreground" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Esci
        </Button>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/5 bg-black/30 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Area riservata</p>
              <h2 className="text-lg font-semibold text-foreground">Pannello amministrazione</h2>
            </div>
            <Button variant="outline" size="sm" className="md:hidden" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Esci
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  )
}
