import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, CreditCard, ShieldCheck, Sparkles, Users } from 'lucide-react'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { PublicLayout } from '../components/layout/PublicLayout'

const highlights = [
  {
    title: 'Emissione in tempo reale',
    description: 'Crea gift card digitali in pochi secondi e inviale immediatamente ai tuoi clienti.',
    icon: Sparkles,
  },
  {
    title: 'Controllo completo',
    description: 'Dashboard amministrativa con statistiche su vendite, saldo residuo e utilizzo.',
    icon: CreditCard,
  },
  {
    title: 'Studio protetto',
    description: 'Gestione consenso informato e archivio clienti con protocolli di sicurezza avanzati.',
    icon: ShieldCheck,
  },
]

const steps = [
  {
    title: 'Crea la gift card',
    description: 'Imposta importo, validità e invia un QR code personalizzato pronto all’uso.',
  },
  {
    title: 'Condividi con il cliente',
    description: 'Email automatica, stampa in studio o integrazione con i tuoi canali social.',
  },
  {
    title: 'Verifica e riscatta',
    description: 'Ogni operatore può verificare autenticità e saldo da qualsiasi dispositivo.',
  },
]

const stats = [
  { label: 'Gift card attive', value: '480+' },
  { label: 'Clienti in archivio', value: '1.9K' },
  { label: 'Operatori connessi', value: '12' },
]

export function LandingPage() {
  return (
    <PublicLayout className="gap-20 py-24">
      <section className="relative flex flex-col items-center gap-10 text-center">
        <div
          aria-hidden="true"
          className="absolute inset-x-6 top-1/2 -z-10 h-64 -translate-y-1/2 rounded-full bg-amber-500/10 blur-3xl"
        />
        <span className="rounded-full border border-white/10 bg-black/40 px-4 py-1 text-[0.7rem] uppercase tracking-[0.55em] text-amber-200/80">
          Gift Card • Suite Digitale Tink
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
          L’esperienza premium per gestire gift card, clienti e consensi in studio.
        </h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          Una piattaforma dedicata a tatuatori e piercing artist: emissione gift card, verifica in tempo reale, archivio clienti e firma digitale dei consensi. Tutto in un unico spazio sicuro.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-base font-semibold uppercase tracking-[0.2em] text-black shadow-[0_20px_45px_-20px_rgba(251,191,36,0.85)] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500"
          >
            <Link to="/verify" className="flex items-center gap-2">
              Verifica gift card
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="border border-white/10 bg-black/40 text-base">
            <Link to="/contattaci">Parla con il team</Link>
          </Button>
        </div>
        <div className="grid w-full gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 rounded-2xl border border-white/5 bg-black/30 p-4">
              <span className="text-3xl font-semibold text-foreground">{item.value}</span>
              <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-white/10 bg-black/50 shadow-[0_35px_120px_-45px_rgba(251,191,36,0.65)]">
          <CardContent className="space-y-6 px-8 py-10">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80">Perché Tink</p>
            <h2 className="text-3xl font-semibold text-foreground">Pensato per i ritmi di uno studio moderno</h2>
            <p className="text-base text-muted-foreground">
              Riduci al minimo il lavoro manuale: crea gift card, gestisci il calendario delle sessioni e tieni traccia dei consensi firmati. Tutto sincronizzato con lo staff amministrativo.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {highlights.map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.title} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-left">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                      <IconComponent className="h-5 w-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-white/10 bg-black/40">
            <CardContent className="space-y-5 px-6 py-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Accessi dedicati per lo staff</h3>
                  <p className="text-sm text-muted-foreground">
                    Ruoli differenziati per artisti, desk e amministrazione. Ogni attività è tracciata.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-200">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Agenda integrata</h3>
                  <p className="text-sm text-muted-foreground">
                    Pianifica sessioni, blocchi di lavoro e richiami post tattoo con notifiche automatiche.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/20">
            <CardContent className="space-y-4 px-6 py-8">
              <h3 className="text-lg font-semibold text-foreground">Digitalizza il tuo studio</h3>
              <p className="text-sm text-muted-foreground">
                Centralizza tutto il flusso, dal primo contatto alla consegna della gift card, con un archivio sicuro e consultabile ovunque.
              </p>
              <Button asChild variant="secondary" className="w-fit border border-amber-400/40 bg-amber-500/10 text-amber-200">
                <Link to="/contattaci">Richiedi una demo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Come funziona</p>
          <h2 className="text-3xl font-semibold text-foreground">Tre passaggi per un’esperienza impeccabile</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Dal front-desk al tatuatore: ogni step è guidato con promemoria automatici, firma digitale e storicizzazione dei trattamenti.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-6 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-200/80">
                Step {index + 1}
              </span>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  )
}
