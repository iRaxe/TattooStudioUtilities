import { useEffect, useMemo, useState } from 'react'
import { getCookie } from '../../../utils/cookies'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Badge } from '../../../components/ui/badge'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { cn } from '../../../lib/utils'
import { toast } from 'sonner'

const statusTokens = {
  draft: {
    label: 'Bozza',
    tone: 'border border-muted-foreground/30 bg-muted/30 text-muted-foreground'
  },
  active: {
    label: 'Attiva',
    tone: 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
  },
  used: {
    label: 'Utilizzata',
    tone: 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
  },
  expired: {
    label: 'Scaduta',
    tone: 'border border-purple-500/30 bg-purple-500/10 text-purple-200'
  }
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('it-IT')
}

function resolveStatus(status) {
  if (!status) return statusTokens.draft
  return statusTokens[status] ?? { label: status, tone: 'border bg-muted/20 text-foreground' }
}

const visibleColumnDefaults = {
  amount: true,
  status: true,
  code: true,
  customer: true,
  created: true,
  expires: true,
  actions: true
}

export function GiftCardTable({ onStatsUpdate, onShowCustomerModal, onMarkAsUsed }) {
  const [allGiftCards, setAllGiftCards] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleColumns, setVisibleColumns] = useState(visibleColumnDefaults)
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  const fetchAllGiftCards = async () => {
    try {
      setLoading(true)
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Errore durante il recupero delle gift card')
      }

      const data = await response.json()
      setAllGiftCards(Array.isArray(data.giftCards) ? data.giftCards : [])
    } catch (error) {
      console.error('Error fetching gift cards:', error)
      toast.error('Impossibile caricare le gift card')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGiftCard = async (id) => {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa gift card?')
    if (!confirmed) return

    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Operazione non riuscita')
      }

      toast.success('Gift card eliminata con successo')
      fetchAllGiftCards()
      onStatsUpdate?.()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message)
    }
  }

  const handleRenewGiftCard = async (id) => {
    const confirmed = window.confirm('Rinnovare la scadenza della gift card?')
    if (!confirmed) return

    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/gift-cards/${id}/renew`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Impossibile rinnovare la gift card')
      }

      toast.success('Scadenza rinnovata')
      fetchAllGiftCards()
      onStatsUpdate?.()
    } catch (error) {
      console.error('Renew error:', error)
      toast.error(error.message)
    }
  }

  const handleMarkAsUsedByCode = async (code) => {
    if (!onMarkAsUsed) return
    await onMarkAsUsed(code)
    fetchAllGiftCards()
  }

  useEffect(() => {
    fetchAllGiftCards()
  }, [])

  const filteredCards = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase()
    return allGiftCards
      .filter((card) => {
        if (statusFilter !== 'all' && card.status !== statusFilter) return false
        if (!searchLower) return true
        return (
          card.code?.toLowerCase().includes(searchLower) ||
          card.customer_name?.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        const statusOrder = { active: 0, draft: 1, used: 2 }
        return (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
      })
  }, [allGiftCards, searchTerm, statusFilter])

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Gift card</CardTitle>
            <CardDescription>
              Gestisci emissione, stato e scadenze di tutte le gift card attive e storiche.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cerca codice o cliente"
              className="w-full sm:w-64"
            />
            <div className="flex h-10 items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3">
              {Object.entries(visibleColumns).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleColumn(key)}
                  className={cn(
                    'text-xs uppercase tracking-widest transition-colors',
                    value ? 'text-primary' : 'text-muted-foreground line-through'
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
          <TabsList className="w-full justify-start bg-muted/40">
            <TabsTrigger value="all">Tutte</TabsTrigger>
            <TabsTrigger value="active">Attive</TabsTrigger>
            <TabsTrigger value="draft">Bozze</TabsTrigger>
            <TabsTrigger value="used">Utilizzate</TabsTrigger>
            <TabsTrigger value="expired">Scadute</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/20">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                {visibleColumns.code && <TableHead>Codice</TableHead>}
                {visibleColumns.amount && <TableHead>Importo</TableHead>}
                {visibleColumns.status && <TableHead>Stato</TableHead>}
                {visibleColumns.customer && <TableHead>Cliente</TableHead>}
                {visibleColumns.created && <TableHead>Creata</TableHead>}
                {visibleColumns.expires && <TableHead>Scadenza</TableHead>}
                {visibleColumns.actions && <TableHead className="text-right">Azioni</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {loading ? 'Caricamento in corso…' : 'Nessuna gift card trovata'}
                  </TableCell>
                </TableRow>
              )}

              {filteredCards.map((card) => {
                const status = resolveStatus(card.status)
                return (
                  <TableRow key={card.id} className="bg-background/40">
                    {visibleColumns.code && (
                      <TableCell className="font-mono text-sm text-foreground">{card.code}</TableCell>
                    )}
                    {visibleColumns.amount && (
                      <TableCell>
                        {card.amount?.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell>
                        <Badge className={cn('capitalize', status.tone)}>{status.label}</Badge>
                      </TableCell>
                    )}
                    {visibleColumns.customer && (
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-foreground">{card.customer_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{card.customer_email || '—'}</p>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.created && <TableCell>{formatDate(card.created_at)}</TableCell>}
                    {visibleColumns.expires && <TableCell>{formatDate(card.expires_at)}</TableCell>}
                    {visibleColumns.actions && (
                      <TableCell className="space-x-2 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRenewGiftCard(card.id)}
                        >
                          Rinnova
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsUsedByCode(card.code)}
                        >
                          Segna usata
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onShowCustomerModal?.({
                            name: card.customer_name,
                            email: card.customer_email,
                            phone: card.customer_phone
                          })}
                        >
                          Cliente
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteGiftCard(card.id)}
                        >
                          Elimina
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <TableCaption>
            Totale gift card: <span className="font-semibold text-foreground">{filteredCards.length}</span>
          </TableCaption>
        </div>
      </CardContent>
    </Card>
  )
}
