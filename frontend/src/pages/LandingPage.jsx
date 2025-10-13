import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const navigation = [
  { label: 'Verifica Gift Card', to: '/verify' },
  { label: 'Consenso Online', to: '/contattaci#consenso' },
  { label: 'Contattaci', to: '/contattaci' }
]

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute left-1/2 top-[-120px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-160px] left-1/2 h-[460px] w-[480px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.08),_transparent_60%)]"
          aria-hidden="true"
        />
      </div>

      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-end gap-2 text-amber-100">
            <span className="text-3xl font-black tracking-[0.4em] text-amber-300">T</span>
            <span className="text-2xl font-semibold leading-none text-foreground">ink</span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.55em] text-muted-foreground sm:block">
              Gift Card Tink Studio
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            {navigation.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
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

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-24">
        <section className="relative w-full max-w-3xl text-center">
          <div
            className="absolute inset-x-6 top-1/2 -z-10 h-64 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"
            aria-hidden="true"
          />
          <Card className="border border-white/10 bg-black/60 text-foreground shadow-[0_35px_120px_-45px_rgba(251,191,36,0.65)]">
            <CardContent className="space-y-8 px-8 py-14 sm:px-16">
              <p className="text-xs uppercase tracking-[0.55em] text-amber-200/80">Gift Card Tink Studio</p>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Benvenuti nella suite digitale di Tink.
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                La nostra piattaforma completa per gift card, consensi online e tutti i servizi dello studio.
              </p>
              <div className="flex items-center justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-base font-semibold uppercase tracking-[0.2em] text-black shadow-[0_20px_45px_-20px_rgba(251,191,36,0.85)] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500"
                >
                  <Link to="/verify">Verifica gift card</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>Tutti i diritti riservati © 2025</span>
          <span>Sviluppato da vGuarino</span>
        </div>
      </footer>
    </div>
  )
}
