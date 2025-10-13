import { useEffect, useMemo, useState } from 'react'
import { getCookie } from '../../../utils/cookies'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { Button } from '../../../components/ui/button'
import { toast } from 'sonner'

const statusColors = {
  pending: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
  completed: 'bg-slate-500/20 text-slate-200 border border-slate-500/30',
  cancelled: 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return `${date.toLocaleDateString('it-IT')} · ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`
}

export function AppointmentBoard() {
  const [appointments, setAppointments] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchAppointments = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Impossibile recuperare gli appuntamenti')
      }

      const data = await response.json()
      setAppointments(Array.isArray(data.appointments) ? data.appointments : [])
    } catch (error) {
      console.error('Appointments error:', error)
      toast.error('Errore nel caricamento agenda')
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return appointments
    return appointments.filter((item) => item.status === statusFilter)
  }, [appointments, statusFilter])

  const updateStatus = async (id, status) => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Aggiornamento non riuscito')
      }

      toast.success('Stato appuntamento aggiornato')
      fetchAppointments()
    } catch (error) {
      console.error('Status update error:', error)
      toast.error(error.message)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Agenda appuntamenti</CardTitle>
          <CardDescription>
            Pianificazione completa dei trattamenti con filtri per stato e intervento.
          </CardDescription>
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full lg:w-auto">
          <TabsList className="w-full justify-start bg-muted/40">
            <TabsTrigger value="all">Tutti</TabsTrigger>
            <TabsTrigger value="pending">Da confermare</TabsTrigger>
            <TabsTrigger value="confirmed">Confermati</TabsTrigger>
            <TabsTrigger value="completed">Completati</TabsTrigger>
            <TabsTrigger value="cancelled">Annullati</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/60 bg-muted/20">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Trattamento</TableHead>
                <TableHead>Artista</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nessun appuntamento in questa vista
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.customerName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{item.customerEmail || item.customerPhone || '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{item.serviceType || '—'}</p>
                      <p className="text-xs text-muted-foreground">Durata: {item.duration || 0} min</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.artist || '—'}</TableCell>
                  <TableCell>{formatDateTime(item.date)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[item.status] ?? 'bg-muted/30 text-muted-foreground border border-border/50'}>
                      {item.status || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(item.id, 'confirmed')}>
                      Conferma
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateStatus(item.id, 'completed')}>
                      Concludi
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(item.id, 'cancelled')}>
                      Annulla
                    </Button>
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
