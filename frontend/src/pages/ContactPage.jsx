import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { PublicLayout } from '../components/layout/PublicLayout'
import { Mail, MapPin, Phone, FileSignature, Shield, Clock } from 'lucide-react'

const contacts = [
  {
    label: 'Email',
    value: 'info@tinkstudio.it',
    icon: Mail,
    action: () => (window.location.href = 'mailto:info@tinkstudio.it'),
  },
  {
    label: 'Telefono',
    value: '+39 081 835 4729',
    icon: Phone,
    action: () => (window.location.href = 'tel:+390818354729'),
  },
  {
    label: 'Indirizzo',
    value: 'Via Kennedy, 39 · 80028 Grumo Nevano (NA)',
    icon: MapPin,
    action: () => window.open('https://maps.google.com/?q=Via+Kennedy,+39,+80028+Grumo+Nevano+NA', '_blank'),
  },
]

const supportHighlights = [
  {
    title: 'Onboarding dedicato',
    description: 'Sessioni guidate per attivare gift card, consensi e dashboard in meno di un’ora.',
  },
  {
    title: 'Aggiornamenti costanti',
    description: 'Nuove funzionalità rilasciate ogni mese con formazione per il tuo staff.',
  },
  {
    title: 'Assistenza prioritaria',
    description: 'Canale diretto con il nostro team tecnico via chat, email e telefono.',
  },
]

const consentSteps = [
  {
    icon: FileSignature,
    title: 'Modelli personalizzati',
    description: 'Crea modelli di consenso specifici per tatuaggi, piercing e trattamenti speciali.',
  },
  {
    icon: Shield,
    title: 'Firma digitale sicura',
    description: 'Il cliente firma da tablet o smartphone: documento archiviato automaticamente.',
  },
  {
    icon: Clock,
    title: 'Storico sempre accessibile',
    description: 'Consulta ogni consenso firmato in studio anche dopo anni, con ricerca per cliente.',
  },
]

export function ContactPage() {
  return (
    <PublicLayout className="gap-16 py-20">
      <header className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Tink Studio</p>
        <h1 className="text-4xl font-semibold text-foreground">Parliamo del tuo progetto</h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
          Scrivici per consulenze, prenotazioni o collaborazioni. Rispondiamo entro 24 ore lavorative e ti guidiamo nell’attivazione della piattaforma digitale.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle>Contatti diretti</CardTitle>
            <CardDescription>
              Preferisci una chiamata, un messaggio o passare in studio? Scegli il canale migliore per te.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map((item) => {
              const IconComponent = item.icon
              return (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/15">
                      <IconComponent className="h-4 w-4 text-amber-300" />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={item.action}>
                    Apri
                  </Button>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-black/40">
          <CardHeader>
            <CardTitle>Vieni a trovarci</CardTitle>
            <CardDescription>
              Studio accogliente, sala sterilizzazione certificata, lounge per consulenze e disegno bozzetti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8234567890123!2d14.2345678!3d40.9123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zVmlhIEtlbm5lZHksIDM5LCA4MDAyOCBHcnVtbyBOZXZhbm8gTkE!5e0!3m2!1sit!2sit!4v1234567890123"
                className="h-80 w-full"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tink Studio mappa"
              />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Parcheggio disponibile, studio aperto dal lunedì al sabato dalle 08:30 alle 21:00.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="consenso" className="space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Consenso informato</p>
          <h2 className="text-3xl font-semibold text-foreground">Digitalizza il consenso dei tuoi clienti</h2>
          <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
            Un flusso digitale che rispetta le normative sanitarie e tutela studio e cliente. Ogni documento è firmato, salvato e collegato al profilo del cliente in archivio.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {consentSteps.map((item) => {
            const IconComponent = item.icon
            return (
              <Card key={item.title} className="border border-white/10 bg-black/35">
                <CardContent className="space-y-3 px-6 py-8 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
                    <IconComponent className="h-5 w-5 text-amber-300" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            Vuoi importare i moduli cartacei che utilizzi già? Li digitalizziamo noi e li rendiamo pronti alla firma.
          </p>
          <Button asChild variant="secondary" className="border border-amber-400/40 bg-amber-500/10 text-amber-200">
            <a href="mailto:info@tinkstudio.it?subject=Consenso%20digitale">Prenota una consulenza</a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-8 sm:grid-cols-3">
        {supportHighlights.map(({ title, description }) => (
          <div key={title} className="flex flex-col gap-2 rounded-2xl border border-white/5 bg-black/30 p-4 text-left">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>
    </PublicLayout>
  )
}
