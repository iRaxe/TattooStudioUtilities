import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { cn } from '../../../lib/utils'

const kpiPalette = {
  total: 'from-orange-500/90 to-orange-500/50 text-orange-50 shadow-[0_10px_40px_-15px_rgba(249,115,22,0.6)]',
  draft: 'from-slate-500/90 to-slate-500/50 text-slate-50 shadow-[0_10px_40px_-15px_rgba(100,116,139,0.6)]',
  active: 'from-emerald-500/90 to-emerald-500/50 text-emerald-50 shadow-[0_10px_40px_-15px_rgba(16,185,129,0.6)]',
  used: 'from-rose-500/90 to-rose-500/50 text-rose-50 shadow-[0_10px_40px_-15px_rgba(244,63,94,0.6)]',
  expired: 'from-purple-500/90 to-purple-500/50 text-purple-50 shadow-[0_10px_40px_-15px_rgba(168,85,247,0.6)]'
}

const kpiLabels = {
  total: 'Gift Card Totali',
  draft: 'Bozze',
  active: 'Attive',
  used: 'Utilizzate',
  expired: 'Scadute'
}

const kpiOrder = ['total', 'draft', 'active', 'used', 'expired']

export function DashboardOverview({ stats }) {
  const totalRevenue = stats?.totalRevenue ?? 0
  const usedRevenue = stats?.usedRevenue ?? 0
  const remainingRevenue = Math.max(totalRevenue - usedRevenue, 0)
  const usagePercentage = totalRevenue > 0 ? Math.round((usedRevenue / totalRevenue) * 100) : 0

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Andamento generale</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Un colpo d'occhio su performance, fatturato e andamento operativo del programma gift card.
            </p>
          </div>
          <Badge variant="secondary" className="border border-border bg-transparent text-xs uppercase tracking-widest">
            Aggiornato {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
          </Badge>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {kpiOrder.map((key) => (
            <Card key={key} className="relative overflow-hidden border-none bg-gradient-to-br">
              <div className={cn('absolute inset-0 opacity-90', kpiPalette[key])} aria-hidden="true" />
              <CardHeader className="relative z-10 pb-2">
                <CardDescription className="text-slate-100/80">
                  {kpiLabels[key]}
                </CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {stats?.[key] ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Fatturato gift card</CardTitle>
              <CardDescription>
                Panorama complessivo del fatturato generato e utilizzato negli ultimi 12 mesi.
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border border-primary/40">
              {usagePercentage}% utilizzato
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
              <div className="relative mx-auto h-[240px] w-[240px]">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="fill-none stroke-muted/40"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    className="fill-none stroke-primary"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.max((usedRevenue / (totalRevenue || 1)) * 100, 0)} 100`}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center text-center">
                  <div>
                    <p className="text-sm uppercase tracking-wider text-muted-foreground">Utilizzo</p>
                    <p className="text-4xl font-semibold text-foreground">{usagePercentage}%</p>
                    <p className="text-xs text-muted-foreground">{usedRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>
              </div>
              <dl className="grid gap-4 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                  <dt className="text-muted-foreground">Fatturato generato</dt>
                  <dd className="font-medium text-foreground">
                    {totalRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                  <dt className="text-muted-foreground">Utilizzato</dt>
                  <dd className="font-medium text-primary">
                    {usedRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                  <dt className="text-muted-foreground">Residuo disponibile</dt>
                  <dd className="font-medium text-emerald-300">
                    {remainingRevenue.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultime attività</CardTitle>
            <CardDescription>
              Stato aggiornato al {new Date().toLocaleDateString('it-IT')}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/30 p-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Gift card generate</p>
                <p className="text-xs text-muted-foreground">{stats?.issuedToday ?? 0} emesse nelle ultime 24 ore</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/30 p-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Nuovi clienti</p>
                <p className="text-xs text-muted-foreground">{stats?.newCustomersThisWeek ?? 0} iscritti negli ultimi 7 giorni</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-border/40 bg-muted/30 p-3">
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Appuntamenti programmati</p>
                <p className="text-xs text-muted-foreground">{stats?.upcomingAppointments ?? 0} nei prossimi 14 giorni</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
