import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { toast } from 'sonner'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-6 py-16">
      <Card className="w-full max-w-lg border border-white/10 bg-black/40">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">Verifica gift card</CardTitle>
          <CardDescription>Controlla in tempo reale stato, importo residuo e data di scadenza.</CardDescription>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Codice</p>
                  <p className="font-mono text-lg text-foreground">{code}</p>
                </div>
                <Badge className={result.error ? 'bg-rose-500/20 text-rose-200' : 'bg-emerald-500/20 text-emerald-200'}>
                  {result.error ? 'Non valida' : result.card?.status ?? 'Attiva'}
                </Badge>
              </div>

              {!result.error && (
                <div className="grid gap-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Valore</span>
                    <span className="text-foreground font-medium">
                      {result.card?.amount?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stato</span>
                    <span className="text-foreground font-medium">{result.card?.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Scadenza</span>
                    <span className="text-foreground font-medium">
                      {result.card?.expires_at ? new Date(result.card.expires_at).toLocaleDateString('it-IT') : '—'}
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
    </div>
  )
}
