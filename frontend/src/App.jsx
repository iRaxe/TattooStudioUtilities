import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster, toast } from 'sonner'

import { getCookie, deleteCookie } from './utils/cookies'
import { AdminLayout } from './components/layout/AdminLayout'
import { LandingPage } from './pages/LandingPage'
import { VerifyGiftCardPage } from './pages/VerifyGiftCardPage'
import { ContactPage } from './pages/ContactPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminLogin } from './features/admin/auth/AdminLogin'
import { DashboardOverview } from './features/admin/dashboard/DashboardOverview'
import { GiftCardTable } from './features/admin/gift-cards/GiftCardTable'
import { CreateGiftCardForm } from './features/admin/gift-cards/CreateGiftCardForm'
import { CustomerDirectory } from './features/admin/customers/CustomerDirectory'
import { AppointmentBoard } from './features/admin/appointments/AppointmentBoard'

function ProtectedRoute({ token, children }) {
  if (!token) {
    return <Navigate to="/admin/login" replace />
  }
  return children
}

function GiftCardWorkspace({ onRefresh }) {
  const markAsUsed = async (code) => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards/mark-used', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Impossibile aggiornare la gift card')
      }

      toast.success('Gift card marcata come utilizzata')
      onRefresh?.()
    } catch (error) {
      console.error('Mark used error:', error)
      toast.error(error.message)
    }
  }

  return (
    <div className="grid gap-6">
      <CreateGiftCardForm onCreated={onRefresh} />
      <GiftCardTable onStatsUpdate={onRefresh} onMarkAsUsed={markAsUsed} />
    </div>
  )
}

export default function App() {
  const [token, setToken] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const storedToken = getCookie('adminToken')
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  const fetchStats = async () => {
    try {
      if (!token) return
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Impossibile aggiornare le statistiche')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Stats error:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [token])

  const handleLogout = () => {
    deleteCookie('adminToken')
    setToken('')
  }

  return (
    <BrowserRouter>
      <Toaster theme="dark" richColors position="top-right" />
      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="/verify" element={<VerifyGiftCardPage />} />
        <Route path="/contattaci" element={<ContactPage />} />
        <Route path="/admin/login" element={<AdminLogin onAuth={setToken} />} />
        <Route
          path="/admin"
          element={(
            <ProtectedRoute token={token}>
              <AdminLayout onLogout={handleLogout} />
            </ProtectedRoute>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardOverview stats={stats} />} />
          <Route path="gift-cards" element={<GiftCardWorkspace onRefresh={fetchStats} />} />
          <Route path="customers" element={<CustomerDirectory />} />
          <Route path="appointments" element={<AppointmentBoard />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
