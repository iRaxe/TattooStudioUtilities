import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Input } from '../../../components/ui/input'
import { Label } from '../../../components/ui/label'
import { Button } from '../../../components/ui/button'
import { setCookie, deleteCookie } from '../../../utils/cookies'
import { toast } from 'sonner'

export function AdminLogin({ onAuth }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Credenziali non valide')
      }

      const data = await response.json()
      setCookie('adminToken', data.token, 7)
      toast.success('Accesso effettuato')
      onAuth?.(data.token)
      navigate('/admin/dashboard')
    } catch (error) {
      console.error('Admin login error:', error)
      deleteCookie('adminToken')
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 px-6 py-10">
      <Card className="w-full max-w-md border border-white/10 bg-black/40">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold text-foreground">Tink Studio Admin</CardTitle>
          <CardDescription>Accedi al backend operativo per gestire gift card, clienti e appuntamenti.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Accesso in corso…' : 'Entra nel pannello'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
