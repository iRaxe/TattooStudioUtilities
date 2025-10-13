import { useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { PublicLayout } from '../components/layout/PublicLayout'
import { ShieldCheck, Timer, Wallet } from 'lucide-react'
import { toast } from 'sonner'

const infoPoints = [
  {
    icon: ShieldCheck,
    title: 'Codici unici',
    description: 'Ogni gift card è firmata digitalmente: nessuna possibilità di duplicazione.',
  },
  {
    icon: Timer,
    title: 'Scadenze sotto controllo',
    description: 'Ricorda la data limite al cliente e monitora le card in scadenza dalla dashboard.',
  },
  {
    icon: Wallet,
    title: 'Saldo aggiornato',
    description: 'Ogni riscatto aggiorna immediatamente il credito residuo in archivio.',
  },
]

export function VerifyGiftCardPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!code.trim()) return
    try {
      setLoading(true)
      setResult(null)
      const response = await fetch(`/api/gift-card/verify/${code.trim()}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Gift card non trovata')
      }
      setResult(data)
      toast.success('Gift card valida')
    } catch (error) {
      console.error('Verification error:', error)
      toast.error(error.message)
      setResult({ error: true, message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    verify()
  }

  return (
    <PublicLayout className="gap-14 py-20">
      <header className="mx-auto max-w-2xl text-center space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Verifica Gift Card</p>
        <h1 className="text-4xl font-semibold text-foreground">Conferma autenticità e saldo in pochi secondi</h1>
        <p className="text-sm text-muted-foreground">
          Inserisci il codice della gift card o scansiona il QR code stampato sul voucher. Il sistema restituisce stato, scadenza e importo disponibile.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[0.65fr_0.35fr] lg:items-start">
        <Card className="border border-white/10 bg-black/40">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-semibold text-foreground">Verifica immediata</CardTitle>
            <CardDescription>
              Controlla in tempo reale stato, importo residuo e cronologia di utilizzo della gift card.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="Inserisci codice gift card"
                autoComplete="off"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Verifica in corso…' : 'Verifica codice'}
              </Button>
            </form>

            {result && (
              <div className="mt-6 space-y-4 rounded-lg border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-2 rounded-md border border-white/10 bg-black/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Codice</p>
                    <p className="font-mono text-lg text-foreground">{code}</p>
                  </div>
                  <Badge className={result.error ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}>
                    {result.error ? 'Non valida' : result.card?.status ?? 'Attiva'}
                  </Badge>
                </div>

                {!result.error && (
                  <div className="grid gap-3 rounded-md border border-white/5 bg-black/20 p-4 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Valore</span>
                      <span className="text-foreground font-medium">
                        {result.card?.amount?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scadenza</span>
                      <span className="text-foreground font-medium">
                        {result.card?.expires_at ? new Date(result.card.expires_at).toLocaleDateString('it-IT') : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ultimo utilizzo</span>
                      <span className="text-foreground font-medium">
                        {result.card?.last_used_at ? new Date(result.card.last_used_at).toLocaleDateString('it-IT') : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {result.message && (
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {infoPoints.map((item) => {
            const IconComponent = item.icon
            return (
              <Card key={item.title} className="border border-white/10 bg-black/30">
                <CardContent className="flex items-start gap-4 px-6 py-6">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
                    <IconComponent className="h-5 w-5 text-amber-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </PublicLayout>
  )
}
