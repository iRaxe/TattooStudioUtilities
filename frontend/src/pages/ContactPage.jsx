import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

const contacts = [
  {
    label: 'Email',
    value: 'info@tinkstudio.it',
    action: () => window.location.href = 'mailto:info@tinkstudio.it'
  },
  {
    label: 'Telefono',
    value: '+39 081 835 4729',
    action: () => window.location.href = 'tel:+390818354729'
  },
  {
    label: 'Indirizzo',
    value: 'Via Kennedy, 39 · 80028 Grumo Nevano (NA)',
    action: () => window.open('https://maps.google.com/?q=Via+Kennedy,+39,+80028+Grumo+Nevano+NA', '_blank')
  }
]

export function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-6 py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Tink Studio</p>
          <h1 className="text-4xl font-semibold text-foreground">Parliamo del tuo progetto</h1>
          <p className="text-sm text-muted-foreground">
            Scrivici per consulenze, prenotazioni o collaborazioni. Rispondiamo entro 24 ore lavorative.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Contatti diretti</CardTitle>
              <CardDescription>Preferisci una chiamata, un messaggio o passare in studio? Scegli il canale migliore per te.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{contact.label}</p>
                    <p className="text-sm font-medium text-foreground">{contact.value}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={contact.action}>
                    Apri
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-black/40">
            <CardHeader>
              <CardTitle>Vieni a trovarci</CardTitle>
              <CardDescription>Studio accogliente, sala sterilizzazione certificata, lounge per consulenze e disegno bozzetti.</CardDescription>
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
        </div>
      </div>
    </div>
  )
}
