import { useEffect, useMemo, useState } from 'react'
import { getCookie } from '../../../utils/cookies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { toast } from 'sonner'

export function CustomerDirectory() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        const token = getCookie('adminToken')
        const response = await fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
          throw new Error('Impossibile recuperare i clienti')
        }

        const data = await response.json()
        setCustomers(Array.isArray(data.customers) ? data.customers : [])
      } catch (error) {
        console.error('Customer fetch error:', error)
        toast.error('Errore nel caricamento dei clienti')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers
    return customers.filter((customer) => (
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term)
    ))
  }, [customers, search])

  const exportCsv = () => {
    const rows = [
      ['Nome', 'Email', 'Telefono', 'Gift card attive', 'Ultima attività'],
      ...filtered.map((customer) => [
        customer.name || '',
        customer.email || '',
        customer.phone || '',
        String(customer.activeGiftCards ?? 0),
        customer.lastGiftCardCreated ? new Date(customer.lastGiftCardCreated).toLocaleDateString('it-IT') : ''
      ])
    ]

    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `clienti_tinkstudio_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Anagrafica clienti</CardTitle>
          <CardDescription>
            Storico completo delle persone che hanno acquistato o ricevuto una gift card.
          </CardDescription>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Cerca per nome, email o telefono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:w-80"
          />
          <Button variant="outline" onClick={exportCsv}>
            Esporta CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/60 bg-muted/20">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Gift card attive</TableHead>
                <TableHead>Ultima attività</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {loading ? 'Caricamento clienti…' : 'Nessun cliente trovato'}
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{customer.name || '—'}</p>
                      {customer.isVip && <Badge variant="secondary">VIP</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.email || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{customer.phone || '—'}</TableCell>
                  <TableCell>{customer.activeGiftCards ?? 0}</TableCell>
                  <TableCell>
                    {customer.lastGiftCardCreated
                      ? new Date(customer.lastGiftCardCreated).toLocaleDateString('it-IT')
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
