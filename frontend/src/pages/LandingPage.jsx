import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CreditCard,
  FileSignature,
  Gauge,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { PublicLayout } from '../components/layout/PublicLayout'
import { HeroShowcase } from '../components/landing/HeroShowcase'

const metrics = [
  {
    label: 'Gift card vendute',
    value: '12K+',
    helper: 'Negli ultimi 12 mesi',
  },
  {
    label: 'Ticket medio',
    value: '€185',
    helper: 'Incremento del 38%',
  },
  {
    label: 'Tempo risparmiato',
    value: '6h/sett',
    helper: 'Automazioni operative',
  },
]

const featureTiles = [
  {
    title: 'Emissione immediata',
    description: 'Crea e invia gift card digitali personalizzate in meno di 60 secondi con QR code e tracking.',
    icon: Sparkles,
  },
  {
    title: 'Pagamenti garantiti',
    description: 'Dashboard finanziaria con riconciliazione automatica e alert su utilizzi sospetti.',
    icon: CreditCard,
  },
  {
    title: 'Compliance integrata',
    description: 'Consenso digitale, privacy policy e documentazione sempre aggiornata e firmata.',
    icon: ShieldCheck,
  },
  {
    title: 'Agenda coordinata',
    description: 'Pianifica sessioni, follow-up e richiami post trattamento con notifiche smart.',
    icon: CalendarCheck2,
  },
]

const flow = [
  {
    title: 'Progetta la tua esperienza',
    description:
      'Configura importi, validità, regole di utilizzo e comunicazioni automatiche in base al tuo brand.',
  },
  {
    title: 'Coinvolgi i clienti',
    description:
      'Invia gift card via email, stampa in studio o integra il widget sul tuo sito e sui social.',
  },
  {
    title: 'Riscatta con un tap',
    description: 'Lo staff verifica saldo e storico con QR code o numero carta da qualsiasi dispositivo.',
  },
  {
    title: 'Analizza e scala',
    description: 'Insight in tempo reale su vendite, clienti ricorrenti e performance del team.',
  },
]

const suite = [
  {
    title: 'CRM dedicato allo studio',
    description: 'Schede cliente con storico trattamenti, allegati, note interne e tag personalizzati.',
    icon: Users,
  },
  {
    title: 'Consenso digitale certificato',
    description: 'Firma elettronica avanzata, tracciamento versioni e archivio legale sempre accessibile.',
    icon: FileSignature,
  },
  {
    title: 'Performance monitorate',
    description: 'Goal, trend di vendita e forecast automatici per prendere decisioni in pochi click.',
    icon: Gauge,
  },
  {
    title: 'Workflow coordinati',
    description: 'Ruoli e permessi granulari per desk, artisti e amministrazione con audit completo.',
    icon: Workflow,
  },
]

const testimonials = [
  {
    quote:
      '«Abbiamo digitalizzato l’intero flusso: niente più fogli volanti e ogni gift card è tracciata. Il team è più rapido e i clienti hanno un’esperienza premium.»',
    name: 'Giulia R. — Founder BlackInk Studio',
  },
  {
    quote:
      '«Tink ci ha permesso di lanciare promozioni flash e monitorare i risultati in tempo reale. Le automazioni ci fanno risparmiare ore ogni settimana.»',
    name: 'Davide M. — Manager UrbanPiercing Lab',
  },
]

export function LandingPage() {
  return (
    <PublicLayout className="gap-24 py-24">
      <section className="relative grid items-center gap-16 text-center lg:grid-cols-[1.05fr_0.95fr] lg:text-left">
        <div
          aria-hidden="true"
          className="absolute inset-x-8 top-1/2 -z-10 h-80 -translate-y-1/2 rounded-[5rem] bg-amber-500/15 blur-3xl"
        />
        <div className="flex flex-col items-center gap-10 lg:items-start">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-5 py-2 text-[0.65rem] uppercase tracking-[0.55em] text-amber-200/80">
              <span>Suite digitale per studi tattoo & piercing</span>
              <span className="hidden h-1 w-1 rounded-full bg-amber-200 sm:block" />
              <span className="hidden text-amber-100/70 sm:block">Made in Italy</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
              La landing page che racconta la tua esperienza premium, non solo un gestionale.
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              Trasforma le gift card in un motore di crescita: workflow fluidi, firma digitale, insight in tempo reale e un design che fa innamorare i tuoi clienti dal primo click.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-300 via-amber-500 to-amber-400 text-base font-semibold uppercase tracking-[0.22em] text-black shadow-[0_25px_55px_-25px_rgba(251,191,36,0.9)] transition hover:from-amber-200 hover:via-amber-400 hover:to-amber-300"
            >
              <Link to="/verify" className="flex items-center gap-2">
                Verifica una gift card
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="border border-white/10 bg-black/40 text-base text-foreground transition hover:border-white/20 hover:bg-black/50"
            >
              <Link to="/contattaci" className="flex items-center gap-2">
                Parla con un consulente
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid w-full gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 sm:grid-cols-3">
            {metrics.map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-black/30 p-4 text-center lg:items-start lg:text-left"
              >
                <span className="text-3xl font-semibold text-foreground">{item.value}</span>
                <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">{item.label}</span>
                <span className="text-[0.7rem] text-muted-foreground/80">{item.helper}</span>
              </div>
            ))}
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/5 bg-black/30 px-6 py-4 text-xs uppercase tracking-[0.5em] text-muted-foreground/70 sm:justify-between">
            {['Ink District', 'Vortex Lab', 'Linea Skin', 'Muse Studio', 'Black Needle'].map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </div>
        <HeroShowcase />
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-white/10 bg-black/55 shadow-[0_45px_130px_-55px_rgba(251,191,36,0.75)]">
          <CardContent className="space-y-6 px-10 py-12">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80">Perché Tink</p>
            <h2 className="text-3xl font-semibold text-foreground">Una landing page con le palle, per vendere prima ancora di tatuare</h2>
            <p className="text-base text-muted-foreground">
              Mostra ai clienti quanto è semplice regalare la tua arte. Dalla scelta della card al riscatto in studio: storytelling, automazioni e design parlano di professionalità.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {featureTiles.map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.title} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/35 p-5 text-left">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                      <IconComponent className="h-5 w-5 text-amber-300" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border border-white/10 bg-black/45">
            <CardContent className="space-y-5 px-8 py-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Accessi dedicati per tutto il team</h3>
                  <p className="text-sm text-muted-foreground">
                    Ruoli differenziati per artisti, front desk e amministrazione. Ogni operazione è tracciata e sicura.
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
                    Pianifica sessioni, blocchi di lavoro e richiami post tattoo con notifiche automatiche e reminder smart.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/20">
            <CardContent className="space-y-5 px-8 py-10">
              <h3 className="text-lg font-semibold text-foreground">Pronto a lanciare la tua campagna?</h3>
              <p className="text-sm text-muted-foreground">
                Centralizza tutto il flusso, dal primo contatto alla consegna della gift card. Offri promo stagionali, traccia risultati e ottimizza in tempo reale.
              </p>
              <Button asChild variant="secondary" className="w-fit border border-amber-400/40 bg-amber-500/10 text-amber-200">
                <Link to="/contattaci">Richiedi una demo</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-12">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Come funziona</p>
          <h2 className="text-3xl font-semibold text-foreground">Un percorso guidato, dalla card al consenso firmato</h2>
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
            Dal front desk al tatuatore, ogni fase è automatizzata. Mostra i vantaggi ai clienti con una narrazione chiara e CTA potenti.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {flow.map((step, index) => (
            <div key={step.title} className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-6 text-left">
              <span className="text-xs font-semibold uppercase tracking-[0.5em] text-amber-200/80">Step {index + 1}</span>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-white/10 bg-black/45">
          <CardContent className="space-y-6 px-10 py-12">
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Suite completa</p>
            <h2 className="text-3xl font-semibold text-foreground">Tutto ciò che serve per un customer journey memorabile</h2>
            <p className="text-base text-muted-foreground">
              Non solo una vetrina: Tink coordina vendite, relazioni e normative. Mostra la tua affidabilità a colpo d’occhio e regala un’esperienza all’altezza del tuo studio.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {suite.map((item) => {
                const IconComponent = item.icon
                return (
                  <div key={item.title} className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/35 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-amber-200">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 rounded-[2.5rem] border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-transparent to-emerald-500/10 p-10">
          <div className="flex flex-col gap-4 text-left">
            <span className="text-xs uppercase tracking-[0.5em] text-amber-200/70">Casi di successo</span>
            <h3 className="text-2xl font-semibold text-foreground">I tuoi clienti vogliono sentirsi parte di qualcosa di esclusivo</h3>
            <p className="text-sm text-muted-foreground">
              Utilizza testimonianze reali e CTA mirate per convertire i visitatori in acquirenti. La landing di Tink mette in primo piano risultati, fiducia e sicurezza.
            </p>
          </div>
          <div className="grid gap-4">
            {testimonials.map((item) => (
              <div key={item.name} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-6">
                <p className="text-sm text-foreground">{item.quote}</p>
                <span className="text-xs uppercase tracking-[0.35em] text-amber-200/80">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/45 px-10 py-16 text-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_65%)]"
        />
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <span className="text-xs uppercase tracking-[0.45em] text-amber-200/80">Pronto al salto di qualità?</span>
          <h2 className="text-3xl font-semibold text-foreground">
            Costruiamo insieme una landing page che fa brillare il tuo studio e converte gli appassionati in clienti fidelizzati.
          </h2>
          <p className="text-sm text-muted-foreground">
            Ti guidiamo nella strategia, nella creazione dei contenuti e nella configurazione della suite digitale. Dal primo contatto alla gift card riscattata.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-base font-semibold uppercase tracking-[0.2em] text-black shadow-[0_25px_55px_-25px_rgba(251,191,36,0.9)] hover:from-amber-300 hover:via-amber-400 hover:to-amber-500"
            >
              <Link to="/contattaci">Prenota una call</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="border border-white/10 bg-black/40 text-base">
              <Link to="/verify">Prova la verifica live</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
