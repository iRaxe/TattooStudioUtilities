import { Link, NavLink, useLocation } from 'react-router-dom'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const links = [
  { label: 'Gift Card', to: '/verify' },
  { label: 'Consenso Online', to: '/contattaci#consenso' },
  { label: 'Contattaci', to: '/contattaci' },
]

export function PublicLayout({ children, className }) {
  const location = useLocation()

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-black text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[-20%] h-[580px] w-[580px] -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute right-[-20%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_60%)]"
        />
      </div>

      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-end gap-2 text-amber-100 transition hover:opacity-90">
            <span className="text-3xl font-black tracking-[0.4em] text-amber-300">T</span>
            <span className="text-2xl font-semibold leading-none text-foreground">ink</span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.55em] text-muted-foreground sm:block">
              Gift Card Tink Studio
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            {links.map((link) => {
              const targetHash = link.to.includes('#') ? `#${link.to.split('#')[1]}` : ''
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      'rounded-md px-3 py-2 transition-colors',
                      isActive || (targetHash && location.hash === targetHash)
                        ? 'text-foreground'
                        : 'hover:text-foreground'
                    )
                  }
                >
                  {link.label}
                </NavLink>
              )
            })}
            <Button
              asChild
              size="sm"
              className="border border-amber-500/40 bg-amber-500/10 text-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.18)] transition hover:border-amber-400/60 hover:bg-amber-500/20 hover:text-amber-100"
              variant="secondary"
            >
              <Link to="/admin/login">Admin Panel</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className={cn('mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16', className)}>{children}</main>

      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>Tutti i diritti riservati © 2025</span>
          <span>Sviluppato da vGuarino</span>
        </div>
      </footer>
    </div>
  )
}
