import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const services = [
  {
    title: 'Tatuaggi su misura',
    description: "Progetti esclusivi, dall'idea alla realizzazione, con artisti specializzati in stili differenti."
  },
  {
    title: 'Piercing professionali',
    description: 'Strumenti sterili, gioielli di alta gamma e un percorso di cura personalizzato.'
  },
  {
    title: 'Gift card digitali',
    description: 'Un\'esperienza da regalare con attivazione immediata, QR code e tracking in tempo reale.'
  }
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      <div className="relative px-6 pb-20 pt-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-16">
          <section className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Tink Studio · Tattoo & Piercing</p>
              <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">
                Creatività radicale, precisione assoluta, esperienza sartoriale.
              </h1>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Nel cuore di Grumo Nevano, un hub creativo dedicato a tatuaggi artistici, piercing professionali e progetti personalizzati. Prenota una consulenza, scopri le nostre gift card o contattaci per realizzare qualcosa di irripetibile.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/admin/login">Accedi all'area admin</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/verify">Verifica gift card</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-[0_20px_60px_-30px_rgba(248,113,113,0.6)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.3),transparent_50%)]" aria-hidden="true" />
                <div className="relative flex h-full flex-col justify-between bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Studio</p>
                    <p className="text-2xl font-semibold text-foreground">Via Kennedy, 39 · Grumo Nevano (NA)</p>
                  </div>
                  <Card className="border-none bg-white/10 text-foreground backdrop-blur">
                    <CardContent className="space-y-1 p-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Orari</p>
                      <p className="text-sm">Lunedì - Sabato · 08:30 - 21:00</p>
                      <p className="text-sm text-rose-200">Domenica · Chiuso</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.title} className="border border-white/10 bg-black/30">
                <CardContent className="space-y-2 p-6">
                  <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Regala un'esperienza</p>
                <h2 className="mt-4 text-3xl font-semibold text-foreground">Gift card digitali con QR code e tracking</h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  Gestisci emissioni, rinnovi e report dal pannello admin. Ogni card è protetta da codice univoco e QR code verificabile in studio.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to="/verify">Verifica gift card</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/contattaci">Parla con noi</Link>
                  </Button>
                </div>
              </div>
              <div className="hidden h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-black lg:block">
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(248,113,113,0.25),transparent_60%)]">
                  <div className="h-48 w-72 rotate-3 rounded-3xl border border-white/10 bg-black/50 p-6 text-center text-sm text-muted-foreground shadow-[0_20px_40px_-30px_rgba(248,113,113,0.7)]">
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Gift Card</p>
                    <p className="mt-4 text-lg font-semibold text-foreground">Esperienza Tink Studio</p>
                    <p className="mt-2 text-xs">QR code univoco, tracking in real time e gestione completa dal pannello admin.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
