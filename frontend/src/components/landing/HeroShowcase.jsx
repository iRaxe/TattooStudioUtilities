import { Sparkles, ShieldCheck, CreditCard, Users, BadgeCheck } from 'lucide-react'
import { Card, CardContent } from '../ui/card'

const operators = [
  { name: 'Sofia', status: 'In sessione', color: 'text-emerald-300' },
  { name: 'Luca', status: 'In attesa', color: 'text-amber-300' },
  { name: 'Marta', status: 'In pausa', color: 'text-sky-300' },
]

export function HeroShowcase() {
  return (
    <div className="relative isolate mx-auto w-full max-w-3xl">
      <div
        aria-hidden
        className="absolute inset-0 -z-20 rounded-[3rem] bg-gradient-to-br from-amber-500/25 via-transparent to-emerald-500/20 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/50 shadow-[0_45px_120px_-35px_rgba(250,204,21,0.55)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-8 py-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Studio Dashboard</p>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">Sessioni odierne</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
            <Sparkles className="h-4 w-4" />
            Tempo reale
          </div>
        </div>

        <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Gift card attive</p>
                <p className="text-3xl font-semibold text-foreground">128</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-200">
                <BadgeCheck className="h-4 w-4" />
                Ultimo aggiornamento 1 min fa
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/30 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Saldo residuo</p>
                  <p className="mt-1 text-3xl font-semibold text-foreground">€ 12.430</p>
                </div>
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                  +8% questa settimana
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {[
                  'Verifica automatica QR',
                  'Report condiviso con il desk',
                  'Storico operazioni illimitato',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="border border-white/5 bg-black/40">
            <CardContent className="space-y-4 px-5 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-200">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Gift card da approvare</p>
                  <p className="text-xs text-muted-foreground">Workflow guidato per ogni operatore</p>
                </div>
              </div>

              <div className="space-y-3">
                {operators.map((operator) => (
                  <div key={operator.name} className="flex items-center justify-between rounded-xl border border-white/5 bg-black/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{operator.name}</p>
                      <p className="text-xs text-muted-foreground">{operator.status}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className={`h-4 w-4 ${operator.color}`} />
                      Operatore
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-12 -z-10 w-40 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-xs text-emerald-200 shadow-[0_25px_55px_-35px_rgba(16,185,129,0.55)]"
      >
        <p className="font-semibold">Consenso digitale</p>
        <p className="text-[0.65rem] text-emerald-100/70">Firmato e archiviato in cloud sicuro</p>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 right-0 -z-10 w-48 rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-xs text-amber-200 shadow-[0_25px_55px_-35px_rgba(250,204,21,0.55)]"
      >
        <p className="font-semibold">Verifica QR immediata</p>
        <p className="text-[0.65rem] text-amber-100/70">Accesso multi-dispositivo per lo staff</p>
      </div>
    </div>
  )
}
