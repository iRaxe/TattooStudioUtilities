import { useState } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import { Label } from '../../../components/ui/label'
import { Textarea } from '../../../components/ui/textarea'
import { getCookie } from '../../../utils/cookies'
import { toast } from 'sonner'

const defaultForm = {
  amount: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  notes: ''
}

export function CreateGiftCardForm({ onCreated }) {
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [generatedCard, setGeneratedCard] = useState(null)

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const resetForm = () => {
    setForm(defaultForm)
    setGeneratedCard(null)
  }

  const downloadCardPdf = async () => {
    if (!generatedCard) return

    const preview = document.getElementById('gift-card-preview')
    if (!preview) return

    const canvas = await html2canvas(preview, { backgroundColor: '#030712' })
    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] })
    pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`gift-card-${generatedCard.code}.pdf`)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Inserisci un importo valido')
      return
    }

    try {
      setLoading(true)
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          customer_name: form.customerName,
          customer_email: form.customerEmail,
          customer_phone: form.customerPhone,
          notes: form.notes
        })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Impossibile creare la gift card')
      }

      const qrData = await QRCode.toDataURL(data.card.code, { width: 512, margin: 1 })
      setGeneratedCard({ ...data.card, qrData })
      toast.success('Gift card creata correttamente')
      onCreated?.()
    } catch (error) {
      console.error('Gift card creation failed:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuova gift card</CardTitle>
        <CardDescription>
          Configura i dettagli della card digitale. Verrà generato automaticamente un QR code e un PDF pronto da consegnare.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="amount">Importo (EUR)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="5"
                value={form.amount}
                onChange={(event) => updateField('amount', event.target.value)}
                placeholder="Es. 120"
                required
              />
            </div>

            <div className="grid gap-3">
              <Label>Cliente</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="Nome e cognome"
                  value={form.customerName}
                  onChange={(event) => updateField('customerName', event.target.value)}
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={form.customerEmail}
                  onChange={(event) => updateField('customerEmail', event.target.value)}
                />
              </div>
              <Input
                placeholder="Numero di telefono"
                value={form.customerPhone}
                onChange={(event) => updateField('customerPhone', event.target.value)}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="notes">Note interne</Label>
              <Textarea
                id="notes"
                rows={4}
                placeholder="Indicazioni per l'artista, dettagli sul trattamento o richieste specifiche"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading}>{loading ? 'Creazione…' : 'Genera gift card'}</Button>
              <Button type="button" variant="secondary" onClick={resetForm} disabled={loading}>
                Ripristina
              </Button>
              {generatedCard && (
                <Button type="button" variant="outline" onClick={downloadCardPdf}>
                  Esporta PDF
                </Button>
              )}
            </div>
          </div>

          <div>
            <div
              id="gift-card-preview"
              className="relative flex h-full min-h-[380px] flex-col justify-between overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-slate-50 shadow-2xl"
            >
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 45%)' }} />

              <header className="relative z-10 flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.4em] text-slate-200/70">Tink Studio Tattoo</span>
                <span className="rounded-full border border-slate-100/10 px-3 py-1 text-xs uppercase tracking-widest text-slate-200/70">
                  Gift Card
                </span>
              </header>

              <main className="relative z-10 space-y-6">
                <p className="text-sm text-slate-200/80">Valido per servizi di tatuaggio, piercing o prodotti esclusivi.</p>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500">Valore</p>
                  <p className="text-4xl font-semibold text-slate-50">
                    {form.amount ? Number(form.amount).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-6 text-xs text-slate-300/70">
                  <div>
                    <p className="font-semibold text-slate-300">Per</p>
                    <p>{form.customerName || 'Cliente'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">Contatto</p>
                    <p>{form.customerEmail || 'email@cliente.com'}</p>
                  </div>
                </div>
              </main>

              <footer className="relative z-10 flex items-end justify-between">
                <div className="space-y-2 text-xs text-slate-400/80">
                  <p>Codice: <span className="font-semibold text-slate-100">{generatedCard?.code || '—'}</span></p>
                  <p>Scadenza: {generatedCard?.expires_at ? new Date(generatedCard.expires_at).toLocaleDateString('it-IT') : '—'}</p>
                </div>
                {generatedCard?.qrData ? (
                  <img src={generatedCard.qrData} alt={`QR code gift card ${generatedCard.code}`} className="h-24 w-24 rounded-md border border-white/10 bg-white/10 p-2" />
                ) : (
                  <div className="h-24 w-24 rounded-md border border-dashed border-white/20 bg-white/5" />
                )}
              </footer>
            </div>
          </div>
        </form>
      </CardContent>
      {generatedCard && (
        <CardFooter className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
          <p>La gift card viene salvata automaticamente nel gestionale e può essere inviata via email o stampata in studio.</p>
          <p>Valore QR code: <span className="font-semibold text-foreground">{generatedCard.code}</span></p>
        </CardFooter>
      )}
    </Card>
  )
}
