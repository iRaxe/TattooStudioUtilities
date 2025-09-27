import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { slide as Menu } from 'react-burger-menu'
import './App.css'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { FaPaintBrush, FaGem, FaTachometerAlt, FaPlus, FaGift, FaUsers, FaSignOutAlt, FaSearch, FaPen, FaPhone } from 'react-icons/fa'


// Import new components
import Dashboard from './components/Dashboard'
import CreateGiftCard from './components/CreateGiftCard'
import GiftCardList from './components/GiftCardList'
import CustomerList from './components/CustomerList'
import GiftCardLanding from './components/GiftCardLanding'
import Contattaci from './components/Contattaci'
import AppointmentList from './components/AppointmentList'
import AppointmentForm from './components/AppointmentForm'
import AppointmentCalendar from './components/AppointmentCalendar'
import AvailabilityChecker from './components/AvailabilityChecker'
import Input from './components/common/Input'
import Textarea from './components/common/Textarea'
import Modal from './components/common/Modal'
import { getCookie, setCookie, deleteCookie } from './utils/cookies'
import Button from './components/common/Button'
import Alert from './components/common/Alert'



// Delete Consent Function
const deleteConsent = async (consentId) => {
  try {
    const token = getCookie('adminToken');
    const response = await fetch(`/api/admin/consensi/${consentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Errore nell'eliminazione del consenso: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Errore eliminazione consenso:', error);
    throw error;
  }
};

// PDF Generation Function
const generateConsentPDF = async (consentId, customerName) => {
  try {
    const token = getCookie('adminToken');
    const response = await fetch(`/api/admin/consensi/${consentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Errore nel recupero del consenso: ${response.status}`);
    }
    
    const data = await response.json();
    
    // I dati del consenso arrivano direttamente nell'oggetto data
    const consenso = data;
    
    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const maxY = pageHeight - margin;
    
    // Funzione per controllare se serve una nuova pagina
    const checkNewPage = (currentY, lineHeight = 8) => {
      if (currentY + lineHeight > maxY) {
        pdf.addPage();
        return margin;
      }
      return currentY;
    };
    
    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONSENSO INFORMATO', 105, 20, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text(`${consenso.type.toUpperCase()}`, 105, 30, { align: 'center' });
    
    // Dati anagrafici
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    let yPos = 50;
    yPos = checkNewPage(yPos, 10);
    pdf.text('DATI ANAGRAFICI', 20, yPos);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 10;
    
    yPos = checkNewPage(yPos);
    pdf.text(`Nome: ${consenso.firstName}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Cognome: ${consenso.lastName}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Data di nascita: ${consenso.birthDate}`, 20, yPos);
    yPos += 8;
    if (consenso.birthPlace) {
      yPos = checkNewPage(yPos);
      pdf.text(`Luogo di nascita: ${consenso.birthPlace}`, 20, yPos);
      yPos += 8;
    }
    if (consenso.fiscalCode) {
      yPos = checkNewPage(yPos);
      pdf.text(`Codice fiscale: ${consenso.fiscalCode}`, 20, yPos);
      yPos += 8;
    }
    if (consenso.address) {
      yPos = checkNewPage(yPos);
      pdf.text(`Indirizzo: ${consenso.address}`, 20, yPos);
      yPos += 8;
    }
    if (consenso.city) {
      yPos = checkNewPage(yPos);
      pdf.text(`Città: ${consenso.city}`, 20, yPos);
      yPos += 8;
    }
    yPos = checkNewPage(yPos);
    pdf.text(`Telefono: ${consenso.phone}`, 20, yPos);
    yPos += 8;
    if (consenso.email) {
      yPos = checkNewPage(yPos);
      pdf.text(`Email: ${consenso.email}`, 20, yPos);
      yPos += 8;
    }
    
    yPos += 10;
    
    // Dati del trattamento
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = checkNewPage(yPos, 15);
    pdf.text('DATI DEL TRATTAMENTO', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (consenso.type === 'tatuaggio') {
      yPos = checkNewPage(yPos);
      pdf.text(`Descrizione tatuaggio: ${consenso.tattooDescription || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Posizione: ${consenso.tattooPosition || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Dimensioni: ${consenso.tattooSize || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Colori: ${consenso.tattooColors || 'N/A'}`, 20, yPos);
      yPos += 8;
    } else if (consenso.type === 'piercing') {
      yPos = checkNewPage(yPos);
      pdf.text(`Tipo piercing: ${consenso.piercingType || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Posizione: ${consenso.piercingPosition || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Tipo gioiello: ${consenso.jewelryType || 'N/A'}`, 20, yPos);
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Materiale: ${consenso.jewelryMaterial || 'N/A'}`, 20, yPos);
      yPos += 8;
    }
    
    if (consenso.appointmentDate) {
      yPos = checkNewPage(yPos);
      pdf.text(`Data appuntamento: ${new Date(consenso.appointmentDate).toLocaleDateString('it-IT')}`, 20, yPos);
      yPos += 8;
    }
    
    yPos += 10;
    
    // Stato di salute
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = checkNewPage(yPos, 15);
    pdf.text('STATO DI SALUTE', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    yPos = checkNewPage(yPos);
    pdf.text(`Maggiorenne: ${consenso.isAdult ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Allergie: ${consenso.hasAllergies ? 'Sì' : 'No'}`, 20, yPos);
    if (consenso.hasAllergies && consenso.allergiesDescription) {
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Descrizione allergie: ${consenso.allergiesDescription}`, 20, yPos);
    }
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Epatite: ${consenso.hasHepatitis ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`HIV: ${consenso.hasHiv ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Diabete: ${consenso.hasDiabetes ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Problemi cardiaci: ${consenso.hasHeartProblems ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Disturbi del sangue: ${consenso.hasBloodDisorders ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Gravidanza: ${consenso.isPregnant ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Anticoagulanti: ${consenso.takesAnticoagulants ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Tendenza cheloidi: ${consenso.hasKeloidTendency ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Altre condizioni: ${consenso.hasOtherConditions ? 'Sì' : 'No'}`, 20, yPos);
    if (consenso.hasOtherConditions && consenso.otherConditionsDescription) {
      yPos += 8;
      yPos = checkNewPage(yPos);
      pdf.text(`Descrizione: ${consenso.otherConditionsDescription}`, 20, yPos);
    }
    
    yPos += 15;
    
    // Consensi
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = checkNewPage(yPos, 15);
    pdf.text('CONSENSI', 20, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    yPos = checkNewPage(yPos);
    pdf.text(`Consenso al trattamento: ${consenso.consentInformedTreatment ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Consenso trattamento dati: ${consenso.consentDataProcessing ? 'Sì' : 'No'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`Consenso foto: ${consenso.consentPhotos ? 'Sì' : 'No'}`, 20, yPos);
    
    yPos += 15;
    
    // Firma digitale
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    yPos = checkNewPage(yPos, 15);
    pdf.text('FIRMA DIGITALE', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos = checkNewPage(yPos);
    pdf.text(`Data e ora: ${new Date(consenso.submittedAt).toLocaleString('it-IT')}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos);
    pdf.text(`IP Address: ${consenso.ipAddress || 'N/A'}`, 20, yPos);
    yPos += 8;
    yPos = checkNewPage(yPos, 16); // User Agent può essere lungo
    pdf.text(`User Agent: ${consenso.userAgent || 'N/A'}`, 20, yPos, { maxWidth: 170 });
    
    // Salva il PDF
    const fileName = `consenso_${consenso.type}_${consenso.firstName}_${consenso.lastName}_${new Date(consenso.submittedAt).toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    alert('Errore nella generazione del PDF');
  }
};

// Reusable Components
function Header({ children, pageTitle, isAdminPanel = false, onAdminTabChange, activeAdminTab, onLogout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Menu 
        right
        isOpen={isMobileMenuOpen}
        onStateChange={(state) => setIsMobileMenuOpen(state.isOpen)}
        customBurgerIcon={false}
        customCrossIcon={false}
        disableAutoFocus
      >
        {isAdminPanel ? (
          <div>
            <button 
              className={`bm-item menu-item ${activeAdminTab === 'dashboard' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('dashboard')
                setIsMobileMenuOpen(false)
              }}
            >
              <FaTachometerAlt style={{ marginRight: '0.5rem' }} /> Dashboard
            </button>
            <button 
              className={`bm-item menu-item ${activeAdminTab === 'create' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('create')
                setIsMobileMenuOpen(false)
              }}
            >
              <FaPlus style={{ marginRight: '0.5rem' }} /> Crea Gift Card
            </button>
            <button 
              className={`bm-item menu-item ${activeAdminTab === 'giftcards' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('giftcards')
                setIsMobileMenuOpen(false)
              }}
            >
              <FaGift style={{ marginRight: '0.5rem' }} /> Elenco Gift Card
            </button>
            <button
              className={`bm-item menu-item ${activeAdminTab === 'customers' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('customers')
                setIsMobileMenuOpen(false)
              }}
            >
              <FaUsers style={{ marginRight: '0.5rem' }} /> Elenco Clienti
            </button>
            <button
              className={`bm-item menu-item ${activeAdminTab === 'appointments' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('appointments')
                setIsMobileMenuOpen(false)
              }}
            >
              <FaPaintBrush style={{ marginRight: '0.5rem' }} /> Appuntamenti
            </button>
            <button
              className="bm-item menu-item menu-item-admin"
              onClick={() => {
                onLogout?.()
                setIsMobileMenuOpen(false)
              }}
            >
              <FaSignOutAlt style={{ marginRight: '0.5rem' }} /> Logout
            </button>
          </div>
        ) : (
          <div>
            <Link to="/verify" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <FaSearch style={{ marginRight: '0.5rem' }} /> Verifica Gift Card
            </Link>
            <Link to="/consenso" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <FaPen style={{ marginRight: '0.5rem' }} /> Consenso Online
            </Link>
            <Link to="/contattaci" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <FaPhone style={{ marginRight: '0.5rem' }} /> Contattaci
            </Link>
            <Link to="/admin" className="bm-item menu-item menu-item-admin" onClick={() => setIsMobileMenuOpen(false)}>
              <FaTachometerAlt style={{ marginRight: '0.5rem' }} /> Admin Panel
            </Link>
          </div>
        )}
      </Menu>
      
      <nav className="header-container">
        <div className="header-card">
          <div className="flex-col flex-start gap-sm">
            <div className="flex-between w-full">
              <div className="header-mobile-layout">
                {children}
                <div className="header-mobile-right">
                  <button 
                    className="burger-menu"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>
                </div>
              </div>
            </div>
            {pageTitle && (
              <div className="breadcrumb" style={{
                fontSize: '0.9rem',
                color: '#9ca3af',
                fontWeight: '500',
                marginLeft: '0.25rem'
              }}>
                {pageTitle}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}

function Container({ children, className = '' }) {
  return (
    <div className={`main-container ${className}`}>
      {children}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`glass-card ${className}`}>
      {children}
    </div>
  )
}




function Title({ children, level = 1, className = '' }) {
  const levelClass = level === 1 ? 'title-main' : ''
  
  return (
    <h1 className={`title ${levelClass} ${className}`.trim()}>
      {children}
    </h1>
  )
}


// Removed inline styles - now using reusable components with CSS classes

function Home() {
  return (
    <Container>
      <Card>
        <p className="description">
          Benvenuti nella suite digitale di T'ink.<br/>
          La nostra piattaforma completa per gift card, consensi online e tutti i servizi dello studio.
        </p>
        <div className="button-container">
          <Link to="/verify" style={{ textDecoration: 'none' }}>
            <Button>
              Verifica Gift Card
            </Button>
          </Link>
        </div>
      </Card>
    </Container>
  )
}

function Verify() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultMsg, setResultMsg] = useState(null)

  const handleVerify = async () => {
    if (!code.trim()) return
    
    setLoading(true)
    setResultMsg(null)
    
    try {
      const response = await fetch(`/api/gift-cards/verify/${code.trim()}`)
      const data = await response.json()
      
      if (response.ok) {
        if (data.isValid) {
          setResultMsg({
            type: 'success',
            message: `Gift Card valida! Valore: €${data.amount} - Stato: ${data.status === 'active' ? 'Attiva' : data.status === 'claimed' ? 'Utilizzata' : 'Scaduta'}`
          })
        } else {
          setResultMsg({
            type: 'error', 
            message: 'Gift Card non valida o scaduta'
          })
        }
      } else {
        setResultMsg({
          type: 'error',
          message: data.message || 'Errore durante la verifica'
        })
      }
    } catch (error) {
      console.error('Verify error:', error)
      setResultMsg({
        type: 'error',
        message: 'Errore di connessione al server'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container>
      <Card>
        <p className="description">
          Inserisci il codice della gift card per verificarne la validità
        </p>
        
        <div className="form-container">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="code-input"
            placeholder="Inserisci codice gift card"
            aria-label="Codice gift card"
            disabled={loading}
          />
          <Button
            onClick={() => handleVerify()}
            disabled={!code.trim() || loading}
            className="full-width-button"
          >
            {loading ? 'Verifica in corso...' : 'Verifica Gift Card'}
          </Button>
        </div>

        {resultMsg && (
          <div className="form-container">
            <Alert 
              type={resultMsg.type}
              style={{
                margin: '1.5rem 0 0',
                textAlign: 'center'
              }}
            >
              {resultMsg.message}
            </Alert>
          </div>
        )}
      </Card>
    </Container>
  )
}

function AdminLogin({ onLoggedIn, onAuthChange }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Inserisci username e password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      let data
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const text = await response.text()
        console.error('Non-JSON response:', text)
        throw new Error('Risposta del server non valida')
      }

      if (response.ok) {
        setCookie('adminToken', data.token, 7)
        onLoggedIn()
        onAuthChange?.(true)
      } else {
        setError(data.message || 'Credenziali non valide')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Errore di connessione al server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-form">
      <Title level={3}>Accesso Amministratore</Title>
      <p className="login-description">
        Effettua il login per accedere al pannello di controllo
      </p>
      
      <Input
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Username"
        disabled={loading}
        onKeyPress={handleKeyPress}
      />
      
      <Input
        value={password}
        type="password"
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        disabled={loading}
        onKeyPress={handleKeyPress}
      />
      
      <Button
        onClick={handleLogin}
        disabled={loading}
        className="full-width-button"
      >
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </Button>

      {error && (
        <Alert type="error" className="login-alert">
          {error}
        </Alert>
      )}
    </div>
  )
}

function AdminPanel({ onAuthChange, activeTab: externalActiveTab, onTabChange: externalOnTabChange, onLogout: externalOnLogout }) {
  const [isAuth, setIsAuth] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draftCards, setDraftCards] = useState([])
  const [allGiftCards, setAllGiftCards] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [visibleColumns, setVisibleColumns] = useState({
    amount: true,
    status: true,
    code: true,
    customer: true,
    created: true,
    expires: true,
    actions: true
  })
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [lastCreatedCard, setLastCreatedCard] = useState(null)
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [tatuatori, setTatuatori] = useState([])
  const [stanze, setStanze] = useState([])

  const [editingCustomer, setEditingCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [customerModalData, setCustomerModalData] = useState(null)
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    birth_date: '',
    birth_place: '',
    fiscal_code: '',
    address: '',
    city: ''
  })


  // Sincronizza il tab attivo con le props esterne
  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab)
    }
  }, [externalActiveTab])

  useEffect(() => {
    const token = getCookie('adminToken')
    if (token) {
      setIsAuth(true)
      onAuthChange?.(true)
      fetchDraftCards()
      fetchAllGiftCards()
      fetchStats()
      fetchCustomers()
      fetchTatuatori()
      fetchStanze()
    }
  }, [onAuthChange])

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnDropdown && !event.target.closest('[data-dropdown="column-selector"]')) {
        setShowColumnDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnDropdown])

  const fetchDraftCards = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards/drafts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDraftCards(data.drafts || [])
      }
    } catch (error) {
      console.error('Error fetching drafts:', error)
    }
  }

  const fetchAllGiftCards = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAllGiftCards(data.giftCards || [])
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchTatuatori = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/tatuatori', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTatuatori(data.tatuatori || [])
      }
    } catch (error) {
      console.error('Error fetching tatuatori:', error)
    }
  }

  const fetchStanze = async () => {
    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/stanze', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStanze(data.stanze || [])
      }
    } catch (error) {
      console.error('Error fetching stanze:', error)
    }
  }



  const handleCreateDraft = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: parseFloat(amount) })
      })

      const data = await response.json()

      if (response.ok) {
        setLastCreatedCard({
          amount: parseFloat(amount),
          claimUrl: data.claim_url,
          draftId: data.draft_id,
          claimToken: data.claim_token
        })
        
        setAmount('')
        fetchDraftCards()
        fetchAllGiftCards()
        fetchStats()
        
        // Copia automaticamente il link negli appunti
        navigator.clipboard.writeText(data.claim_url)
      } else {
        setError(data.message || 'Errore durante la creazione')
      }
    } catch (error) {
      console.error('Create draft error:', error)
      setError('Errore di connessione al server')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsUsedByCode = async (code) => {
    if (!code) return

    const confirmed = window.confirm(`Sei sicuro di voler marcare la gift card ${code} come utilizzata?`)
    if (!confirmed) return

    try {
      const token = getCookie('adminToken')
      const response = await fetch('/api/admin/gift-cards/mark-used', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Gift Card €${data.giftCard.amount} di ${data.giftCard.holder.first_name} ${data.giftCard.holder.last_name} marcata come utilizzata`)
        fetchAllGiftCards() // Refresh the list
        fetchStats() // Refresh stats
      } else {
        alert(data.error || 'Errore durante l\'operazione')
      }
    } catch (error) {
      console.error('Mark used error:', error)
      alert('Errore di connessione al server')
    }
  }

  const handleDeleteGiftCard = async (id) => {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa gift card? Questa azione non può essere annullata.')
    if (!confirmed) return

    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Gift card eliminata con successo')
        fetchAllGiftCards() // Refresh the list
        fetchStats() // Refresh stats
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'eliminazione')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Errore di connessione al server')
    }
  }

  const handleRenewGiftCard = async (id) => {
    const confirmed = window.confirm('Sei sicuro di voler rinnovare la scadenza di questa gift card?')
    if (!confirmed) return

    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/gift-cards/${id}/renew`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        alert('Scadenza gift card rinnovata con successo')
        fetchAllGiftCards() // Refresh the list
        fetchStats() // Refresh stats
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante il rinnovo')
      }
    } catch (error) {
      console.error('Renew error:', error)
      alert('Errore di connessione al server')
    }
  }

  const handleEditCustomer = (customer) => {
    setEditForm({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      birth_date: customer.birth_date || '',
      birth_place: customer.birth_place || '',
      fiscal_code: customer.fiscal_code || '',
      address: customer.address || '',
      city: customer.city || ''
    })
    setEditingCustomer(customer)
  }

  const handleSaveCustomer = async () => {
    if (!editingCustomer || !editForm.first_name || !editForm.last_name) {
      alert('Nome e cognome sono obbligatori')
      return
    }

    try {
      const token = getCookie('adminToken')
      const response = await fetch(`/api/admin/customers/${editingCustomer.phone}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Dati cliente aggiornati con successo. ${data.updatedGiftCards} gift card sincronizzate.`)
        setEditingCustomer(null)
        fetchCustomers() // Refresh customers list
        fetchAllGiftCards() // Refresh gift cards list
      } else {
        const data = await response.json()
        alert(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch (error) {
      console.error('Update customer error:', error)
      alert('Errore di connessione al server')
    }
  }

  const handleShowCustomerModal = (customer) => {
    setCustomerModalData(customer)
    setShowCustomerModal(true)
  }

  const handleLogout = () => {
    if (externalOnLogout) {
      externalOnLogout()
    } else {
      deleteCookie('adminToken')
      setIsAuth(false)
      onAuthChange?.(false)
    }
  }

  // Funzione per cambiare tab che notifica anche il componente esterno
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    externalOnTabChange?.(tab)
  }

  if (!isAuth) {
    return (
      <Container>
        <Card>
          <AdminLogin onLoggedIn={() => {
            setIsAuth(true)
            // Carica i dati dopo il login
            setTimeout(() => {
              fetchDraftCards()
              fetchAllGiftCards()
              fetchStats()
              fetchCustomers()
              fetchTatuatori()
              fetchStanze()
            }, 100)
          }} onAuthChange={onAuthChange} />
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <div style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'flex-start',
        width: '100%'
      }}>
        {/* Sidebar Navigation */}
        <div className="admin-sidebar" style={{
          width: '250px',
          flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <Button
              variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('dashboard')}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              <FaTachometerAlt style={{ marginRight: '0.5rem' }} /> Dashboard
            </Button>
            <Button
              variant={activeTab === 'create' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('create')}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              <FaPlus style={{ marginRight: '0.5rem' }} /> Crea Gift Card
            </Button>
            <Button
              variant={activeTab === 'giftcards' ? 'primary' : 'ghost'}
              onClick={() => {
                handleTabChange('giftcards')
                fetchAllGiftCards()
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              <FaGift style={{ marginRight: '0.5rem' }} /> Elenco Gift Card
            </Button>
            <Button
              variant={activeTab === 'customers' ? 'primary' : 'ghost'}
              onClick={() => {
                handleTabChange('customers')
                fetchCustomers()
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              <FaUsers style={{ marginRight: '0.5rem' }} /> Elenco Clienti
            </Button>
            <Button
              variant={activeTab === 'appointments' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('appointments')}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: '0.9rem',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '4px'
              }}
            >
              <FaPaintBrush style={{ marginRight: '0.5rem' }} /> Appuntamenti
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div style={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
        
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} />
        )}
        
        {/* Create Tab */}
        {activeTab === 'create' && (
          <CreateGiftCard
            amount={amount}
            setAmount={setAmount}
            loading={loading}
            error={error}
            lastCreatedCard={lastCreatedCard}
            setLastCreatedCard={setLastCreatedCard}
            onCreateDraft={handleCreateDraft}
          />
        )}
        


        {/* Gift Cards List Tab */}
        {activeTab === 'giftcards' && (
          <GiftCardList
            allGiftCards={allGiftCards}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
            showColumnDropdown={showColumnDropdown}
            setShowColumnDropdown={setShowColumnDropdown}
            customers={customers}
            onMarkAsUsed={handleMarkAsUsedByCode}
            onDeleteGiftCard={handleDeleteGiftCard}
            onRenewGiftCard={handleRenewGiftCard}
            onShowCustomerModal={handleShowCustomerModal}
          />
        )}
        
        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <CustomerList
            customers={customers}
            onShowCustomerModal={handleShowCustomerModal}
            onEditCustomer={handleEditCustomer}
            generateConsentPDF={generateConsentPDF}
            deleteConsent={deleteConsent}
          />

        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            <AppointmentList
              tatuatori={tatuatori}
              stanze={stanze}
            />
          </div>
        )}
        
        </div>
      </div>

      {/* Modal per visualizzare dettagli cliente */}
      <Modal
        isOpen={showCustomerModal && customerModalData}
        onClose={() => setShowCustomerModal(false)}
        title="Dettagli Cliente"
      >
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Nome e Cognome</label>
            <div style={{ color: '#f9fafb', fontWeight: '500' }}>
              {customerModalData?.first_name} {customerModalData?.last_name}
            </div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Email</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.email || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Telefono</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.phone || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Data di Nascita</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.birth_date || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Luogo di Nascita</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.birth_place || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Codice Fiscale</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.fiscal_code || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Indirizzo</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.address || 'N/A'}</div>
          </div>
          <div>
            <label style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Città</label>
            <div style={{ color: '#f9fafb' }}>{customerModalData?.city || 'N/A'}</div>
          </div>
        </div>
      </Modal>

      {/* Modal per modificare cliente */}
      <Modal
        isOpen={editingCustomer}
        onClose={() => setEditingCustomer(null)}
        title="Modifica Cliente"
      >
            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Nome *</label>
                  <Input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      color: '#f9fafb',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Cognome *</label>
                  <Input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#374151',
                      border: '1px solid #4b5563',
                      borderRadius: '4px',
                      color: '#f9fafb',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Data di Nascita</label>
                <Input
                  type="date"
                  value={editForm.birth_date}
                  onChange={(e) => setEditForm({...editForm, birth_date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Luogo di Nascita</label>
                <Input
                  type="text"
                  value={editForm.birth_place}
                  onChange={(e) => setEditForm({...editForm, birth_place: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Codice Fiscale</label>
                <Input
                  type="text"
                  value={editForm.fiscal_code}
                  onChange={(e) => setEditForm({...editForm, fiscal_code: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Indirizzo</label>
                <Input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
              <div>
                <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Città</label>
                <Input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#374151',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    color: '#f9fafb',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.5rem',
              justifyContent: 'flex-end'
            }}>
              <Button
                variant="secondary"
                onClick={() => setEditingCustomer(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Annulla
              </Button>
              <Button
                onClick={handleSaveCustomer}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#059669',
                  border: '1px solid #10b981',
                  borderRadius: '4px',
                  color: '#f9fafb',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}
              >
                Salva
              </Button>
            </div>
      </Modal>
    </Container>
  )
}

function ClaimPage() {
  const [claimData, setClaimData] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dedication: ''
  })
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    const token = window.location.pathname.split('/').pop()
    fetchClaimData(token)
  }, [])

  const fetchClaimData = async (token) => {
    try {
      const response = await fetch(`/api/gift-cards/claim/${token}`)
      const data = await response.json()
      
      if (response.ok) {
        setClaimData(data)
      } else {
        setError(data.message || 'Token non valido')
      }
    } catch (error) {
      console.error('Claim fetch error:', error)
      setError('Errore di connessione al server')
    }
  }

  const handleFinalize = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.phone.trim()) {
      setError('Nome, cognome e telefono sono obbligatori')
      return
    }

    setLoading(true)
    setError('')

    try {
      const token = window.location.pathname.split('/').pop()
      const response = await fetch(`/api/gift-cards/claim/${token}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      })

      const data = await response.json()

      if (response.ok) {
        console.log('Gift card finalized successfully:', data);
        // Mostra il link condivisibile invece di generare PDF
        setClaimData({
          ...claimData,
          status: 'active',
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          email: form.email,
          dedication: form.dedication,
          landing_url: data.qr_code_data || data.landing_url
        })
        console.log('Updated claimData with landing_url:', data.qr_code_data || data.landing_url);
      } else {
        console.error('Gift card finalization failed:', data);
        setError(data.message || 'Errore durante l\'attivazione')
      }
    } catch (error) {
      console.error('Finalize error:', error)
      setError('Errore di connessione al server')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!cardRef.current) return

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      })
      
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98)
      pdf.save(`gift-card-${claimData.code}.pdf`)
    } catch (error) {
      console.error('PDF generation error:', error)
    }
  }

  if (error) {
    return (
      <Container>
        <Card>
          <Title level={2} style={{ color: '#ef4444', marginBottom: '1rem' }}><i className="fas fa-exclamation-triangle"></i> Errore</Title>
          <div style={{ color: '#f9fafb', marginBottom: '2rem', fontSize: '1.1rem' }}>
            {error}
          </div>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              <i className="fas fa-home"></i> Torna alla Home
            </Button>
          </Link>
        </Card>
      </Container>
    )
  }

  if (!claimData) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fbbf24' }}><i className="fas fa-spinner fa-spin"></i></div>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Caricamento della tua Gift Card...</p>
          </div>
        </Card>
      </Container>
    )
  }

  if (claimData.status === 'active') {
    return (
      <Container>
        <Card>
          <div ref={cardRef} style={{ textAlign: 'center' }}>
            <div className="claim-success-header">
              <h1 className="claim-success-title"><i className="fas fa-trophy"></i> Congratulazioni!</h1>
              <h2 className="claim-success-subtitle">Gift Card personalizzata con successo!</h2>
            </div>
            
            <div className="claim-success-amount">
              €{claimData.amount}
            </div>
            
            <div className="claim-success-details">
              <div className="claim-success-label">Intestata a:</div>
              <div className="claim-success-value">{claimData.first_name} {claimData.last_name}</div>
            </div>
            
            {claimData.dedication && (
              <div className="claim-success-dedication">
                "{claimData.dedication}"
              </div>
            )}
            
            <div className="claim-success-details">
              <div className="claim-success-label">Link da condividere:</div>
              <div className="claim-success-code" style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                {claimData.landing_url}
              </div>
            </div>
            
            <div className="claim-success-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(claimData.landing_url)
                  alert('Link copiato negli appunti!')
                }}
                className="claim-pdf-button"
                aria-label="Copia link negli appunti"
              >
                <i className="fas fa-copy"></i> Copia Link
              </button>
              
              {navigator.share && (
                <button 
                  onClick={() => {
                    navigator.share({
                      title: 'Gift Card Tink Studio',
                      text: `Hai ricevuto una gift card di €${claimData.amount}!`,
                      url: claimData.landing_url
                    })
                  }}
                  className="claim-pdf-button"
                  aria-label="Condividi gift card"
                >
                  <i className="fas fa-share-alt"></i> Condividi
                </button>
              )}
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="claim-success-disclaimer">
            <div className="claim-disclaimer-header">
              <span className="claim-disclaimer-icon"><i className="fas fa-clipboard-list"></i></span>
              <h3 className="claim-disclaimer-title">Condizioni di utilizzo</h3>
            </div>
            <ul className="claim-disclaimer-list">
              <li>In caso di spostamento dell'appuntamento, la gift card mantiene la sua validità sino a 4 mesi dalla creazione</li>
              <li>In caso di mancata presentazione o rinuncia al servizio, la gift card non sarà rimborsabile</li>
              <li>La gift card è personale e non trasferibile</li>
            </ul>
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <Container>
      <Card>
        <div className="claim-card-layout">
          <div className="claim-gift-card-preview">
            <h3 className="claim-gift-card-title">Gift Card</h3>
            <div className="claim-gift-card-amount">
              €{claimData.amount}
            </div>
            <div className="claim-gift-card-brand">
              Tink Studio
            </div>
          </div>
          
          <div className="claim-form-section">
          <Title level={2} style={{ marginBottom: '0.5rem' }}>Attiva la Gift Card</Title>
          <p style={{ color: '#d1d5db', marginBottom: '2rem' }}>Completa i dati di chi riceverà la gift card</p>
          
          <div className="claim-form">
            <input
              className="claim-form-input"
              required
              value={form.first_name}
              onChange={(e) => setForm({...form, first_name: e.target.value})}
              placeholder="Nome *"
            />
            <input
              className="claim-form-input"
              required
              value={form.last_name}
              onChange={(e) => setForm({...form, last_name: e.target.value})}
              placeholder="Cognome *"
            />
            <input
              className="claim-form-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="Email (opzionale)"
            />
            <input
              className="claim-form-input"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                setForm({...form, phone: value});
              }}
              placeholder="Telefono *"
              pattern="[0-9]{9,10}"
              minLength={9}
              maxLength={10}
            />
            <textarea
              className="claim-form-textarea"
              value={form.dedication}
              onChange={(e) => setForm({...form, dedication: e.target.value})}
              placeholder={`Dedica personalizzata (opzionale)
Aggiungi un messaggio speciale alla tua gift card...`}
            />
          </div>

          <button
            className="claim-submit-button"
            onClick={handleFinalize}
            disabled={!form.first_name.trim() || !form.last_name.trim() || !form.phone.trim() || loading}
            aria-label={loading ? 'Attivazione gift card in corso' : 'Attiva gift card'}
          >
            {loading ? 'Attivazione in corso...' : 'Attiva Gift Card'}
          </button>

          {error && (
            <div className="claim-error-message" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}
          </div>
        </div>
      </Card>
    </Container>
  )
}

// Componente per la selezione del tipo di consenso
function ConsensoOnline() {
  return (
    <Container>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '1rem' }}>
            Seleziona il tipo di trattamento per cui desideri compilare il modulo di consenso
          </p>
        </div>
        
        <div className="consenso-cards-grid">
          <Link 
            to="/consenso/tatuaggio"
            style={{
              textDecoration: 'none',
              display: 'block'
            }}
          >
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '4px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                borderColor: 'rgba(251, 191, 36, 0.6)',
                background: 'rgba(251, 191, 36, 0.1)'
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fbbf24' }}>
                <FaPaintBrush />
              </div>
              <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                Consenso per Tatuaggio
              </h3>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>
                Compila il modulo di consenso informato per il trattamento di tatuaggio
              </p>
            </div>
          </Link>
          
          <Link 
            to="/consenso/piercing"
            style={{
              textDecoration: 'none',
              display: 'block'
            }}
          >
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
                    border: '2px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '4px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.6)';
              e.currentTarget.style.background = 'rgba(251, 191, 36, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#fbbf24' }}>
                <FaGem />
              </div>
              <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                Consenso per Piercing
              </h3>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>
                Compila il modulo di consenso informato per il trattamento di piercing
              </p>
            </div>
          </Link>
        </div>
        

      </Card>
    </Container>
  )
}

// Componente per il consenso tatuaggio
function ConsensoTatuaggio() {
  const [form, setForm] = useState({
    // Dati anagrafici
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    fiscalCode: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    
    // Dati del trattamento
    tattooDescription: '',
    tattooPosition: '',
    tattooSize: '',
    appointmentDate: '',
    
    // Consensi e dichiarazioni
    isAdult: false,
    hasAllergies: false,
    allergiesDescription: '',
    hasHepatitis: false,
    hasHiv: false,
    hasDiabetes: false,
    hasHeartProblems: false,
    hasBloodDisorders: false,
    isPregnant: false,
    takesAnticoagulants: false,
    hasOtherConditions: false,
    otherConditionsDescription: '',
    
    // Consensi finali
    consentInformedTreatment: false,
    consentDataProcessing: false,
    consentPhotos: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validazione campi obbligatori
    if (!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || 
        !form.fiscalCode.trim() || !form.phone.trim() || !form.tattooDescription.trim() ||
        !form.consentInformedTreatment || !form.consentDataProcessing) {
      setError('Compila tutti i campi obbligatori e accetta i consensi necessari')
      return
    }
    
    if (!form.isAdult) {
      setError('Il consenso può essere prestato solo da persone maggiorenni')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/consenso/tatuaggio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          type: 'tatuaggio',
          submittedAt: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error('Errore durante l\'invio del consenso')
      }
      
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <Title level={1}>Consenso Inviato con Successo!</Title>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '1rem' }}>
              Il tuo modulo di consenso per il tatuaggio è stato ricevuto correttamente.
              Ti contatteremo presto per confermare l'appuntamento.
            </p>

          </div>
        </Card>
      </Container>
    )
  }
  
  return (
    <Container>
      <Card>
        <div style={{ marginBottom: '2rem' }}>
          <Title level={1}>Consenso per Tatuaggio</Title>
          <p style={{ color: '#9ca3af', fontSize: '1rem', marginTop: '1rem' }}>
            Compila tutti i campi richiesti per prestare il consenso informato al trattamento di tatuaggio
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Dati Anagrafici */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Dati Anagrafici</h3>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                placeholder="Nome *"
              />
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                placeholder="Cognome *"
              />
              <Input
                required
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({...form, birthDate: e.target.value})}
                placeholder="Data di nascita *"
              />
              <Input
                required
                value={form.birthPlace}
                onChange={(e) => setForm({...form, birthPlace: e.target.value})}
                placeholder="Luogo di nascita *"
              />
              <Input
                required
                value={form.fiscalCode}
                onChange={(e) => setForm({...form, fiscalCode: e.target.value.toUpperCase()})}
                placeholder="Codice Fiscale *"
                maxLength={16}
              />
              <Input
                required
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="Indirizzo *"
              />
              <Input
                required
                value={form.city}
                onChange={(e) => setForm({...form, city: e.target.value})}
                placeholder="Città *"
              />
              <Input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setForm({...form, phone: value});
                }}
                placeholder="Telefono *"
                pattern="[0-9]{9,10}"
                minLength={9}
                maxLength={10}
              />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="Email (opzionale)"
              />
            </div>
          </div>
          
          {/* Dati del Trattamento */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Dettagli del Tatuaggio</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <Textarea
                required
                value={form.tattooDescription}
                onChange={(e) => setForm({...form, tattooDescription: e.target.value})}
                placeholder="Descrizione del tatuaggio *"
                style={{ minHeight: '100px', resize: 'vertical' }}
              />
              <Input
                required
                value={form.tattooPosition}
                onChange={(e) => setForm({...form, tattooPosition: e.target.value})}
                placeholder="Posizione sul corpo *"
              />
              <Input
                required
                value={form.tattooSize}
                onChange={(e) => setForm({...form, tattooSize: e.target.value})}
                placeholder="Dimensioni approssimative *"
              />
              <Input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) => setForm({...form, appointmentDate: e.target.value})}
                placeholder="Data e ora appuntamento (se già fissato)"
              />
            </div>
          </div>
          
          {/* Stato di Salute */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Stato di Salute</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <label className="form-label">
                <input
                  type="checkbox"
                  checked={form.isAdult}
                  onChange={(e) => setForm({...form, isAdult: e.target.checked})}
                  style={{ accentColor: '#fbbf24' }}
                />
                Dichiaro di essere maggiorenne *
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.hasAllergies}
                  onChange={(e) => setForm({...form, hasAllergies: e.target.checked})}
                  style={{ accentColor: '#fbbf24' }}
                />
                Ho allergie note
              </label>
              
              {form.hasAllergies && (
                <Input
                  value={form.allergiesDescription}
                  onChange={(e) => setForm({...form, allergiesDescription: e.target.value})}
                  placeholder="Descrivi le allergie"
                />
              )}
              
              <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHepatitis}
                    onChange={(e) => setForm({...form, hasHepatitis: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Epatite B/C
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHiv}
                    onChange={(e) => setForm({...form, hasHiv: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  HIV
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasDiabetes}
                    onChange={(e) => setForm({...form, hasDiabetes: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Diabete
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHeartProblems}
                    onChange={(e) => setForm({...form, hasHeartProblems: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Problemi cardiaci
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasBloodDisorders}
                    onChange={(e) => setForm({...form, hasBloodDisorders: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Disturbi della coagulazione
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.isPregnant}
                    onChange={(e) => setForm({...form, isPregnant: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Gravidanza
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.takesAnticoagulants}
                    onChange={(e) => setForm({...form, takesAnticoagulants: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Assumo anticoagulanti
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasOtherConditions}
                    onChange={(e) => setForm({...form, hasOtherConditions: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Altre condizioni mediche
                </label>
              </div>
              
              {form.hasOtherConditions && (
                <Textarea
                  value={form.otherConditionsDescription}
                  onChange={(e) => setForm({...form, otherConditionsDescription: e.target.value})}
                  placeholder="Descrivi altre condizioni mediche"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              )}
            </div>
          </div>
          
          {/* Consensi */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Consensi</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <label className="form-label-start">
                <input
                  type="checkbox"
                  checked={form.consentInformedTreatment}
                  onChange={(e) => setForm({...form, consentInformedTreatment: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Presto il mio consenso informato al trattamento di tatuaggio, dopo aver ricevuto tutte le informazioni sui rischi e le procedure. *
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.consentDataProcessing}
                  onChange={(e) => setForm({...form, consentDataProcessing: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Acconsento al trattamento dei miei dati personali secondo la normativa GDPR. *
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.consentPhotos}
                  onChange={(e) => setForm({...form, consentPhotos: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Acconsento alla realizzazione di fotografie del tatuaggio per scopi documentali e promozionali.
                </span>
              </label>
            </div>
          </div>
          
          {error && (
            <Alert type="error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}
          
          <div className="flex gap-lg justify-center">
            <Link to="/consenso">
              <Button variant="secondary">
                ← Indietro
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !form.consentInformedTreatment || !form.consentDataProcessing || !form.isAdult}
            >
              {loading ? '🔄 Invio in corso...' : '📝 Invia Consenso'}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  )
}

// Componente per il consenso piercing
function ConsensoPiercing() {
  const [form, setForm] = useState({
    // Dati anagrafici
    firstName: '',
    lastName: '',
    birthDate: '',
    birthPlace: '',
    fiscalCode: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    
    // Dati del trattamento
    piercingType: '',
    piercingPosition: '',
    jewelryType: '',
    jewelryMaterial: '',
    appointmentDate: '',
    
    // Consensi e dichiarazioni
    isAdult: false,
    hasAllergies: false,
    allergiesDescription: '',
    hasHepatitis: false,
    hasHiv: false,
    hasDiabetes: false,
    hasHeartProblems: false,
    hasBloodDisorders: false,
    isPregnant: false,
    takesAnticoagulants: false,
    hasKeloidTendency: false,
    hasOtherConditions: false,
    otherConditionsDescription: '',
    
    // Consensi finali
    consentInformedTreatment: false,
    consentDataProcessing: false,
    consentPhotos: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validazione campi obbligatori
    if (!form.firstName.trim() || !form.lastName.trim() || !form.birthDate || 
        !form.fiscalCode.trim() || !form.phone.trim() || !form.piercingType.trim() ||
        !form.piercingPosition.trim() || !form.consentInformedTreatment || !form.consentDataProcessing) {
      setError('Compila tutti i campi obbligatori e accetta i consensi necessari')
      return
    }
    
    if (!form.isAdult) {
      setError('Il consenso può essere prestato solo da persone maggiorenni')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/consenso/piercing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          type: 'piercing',
          submittedAt: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        throw new Error('Errore durante l\'invio del consenso')
      }
      
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  if (success) {
    return (
      <Container>
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <Title level={1}>Consenso Inviato con Successo!</Title>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '1rem' }}>
              Il tuo modulo di consenso per il piercing è stato ricevuto correttamente.
              Ti contatteremo presto per confermare l'appuntamento.
            </p>

          </div>
        </Card>
      </Container>
    )
  }
  
  return (
    <Container>
      <Card>
        <div style={{ marginBottom: '2rem' }}>
          <Title level={1}>Consenso per Piercing</Title>
          <p style={{ color: '#9ca3af', fontSize: '1rem', marginTop: '1rem' }}>
            Compila tutti i campi richiesti per prestare il consenso informato al trattamento di piercing
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Dati Anagrafici */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Dati Anagrafici</h3>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <Input
                required
                value={form.firstName}
                onChange={(e) => setForm({...form, firstName: e.target.value})}
                placeholder="Nome *"
              />
              <Input
                required
                value={form.lastName}
                onChange={(e) => setForm({...form, lastName: e.target.value})}
                placeholder="Cognome *"
              />
              <Input
                required
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({...form, birthDate: e.target.value})}
                placeholder="Data di nascita *"
              />
              <Input
                required
                value={form.birthPlace}
                onChange={(e) => setForm({...form, birthPlace: e.target.value})}
                placeholder="Luogo di nascita *"
              />
              <Input
                required
                value={form.fiscalCode}
                onChange={(e) => setForm({...form, fiscalCode: e.target.value.toUpperCase()})}
                placeholder="Codice Fiscale *"
                maxLength={16}
              />
              <Input
                required
                value={form.address}
                onChange={(e) => setForm({...form, address: e.target.value})}
                placeholder="Indirizzo *"
              />
              <Input
                required
                value={form.city}
                onChange={(e) => setForm({...form, city: e.target.value})}
                placeholder="Città *"
              />
              <Input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setForm({...form, phone: value});
                }}
                placeholder="Telefono *"
                pattern="[0-9]{9,10}"
                minLength={9}
                maxLength={10}
              />
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                placeholder="Email (opzionale)"
              />
            </div>
          </div>
          
          {/* Dati del Trattamento */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Dettagli del Piercing</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <Input
                required
                value={form.piercingType}
                onChange={(e) => setForm({...form, piercingType: e.target.value})}
                placeholder="Tipo di piercing *"
              />
              <Input
                required
                value={form.piercingPosition}
                onChange={(e) => setForm({...form, piercingPosition: e.target.value})}
                placeholder="Posizione del piercing *"
              />
              <Input
                value={form.jewelryType}
                onChange={(e) => setForm({...form, jewelryType: e.target.value})}
                placeholder="Tipo di gioiello (es. anello, barretta, etc.)"
              />
              <Input
                value={form.jewelryMaterial}
                onChange={(e) => setForm({...form, jewelryMaterial: e.target.value})}
                placeholder="Materiale del gioiello (es. titanio, acciaio chirurgico)"
              />
              <Input
                type="datetime-local"
                value={form.appointmentDate}
                onChange={(e) => setForm({...form, appointmentDate: e.target.value})}
                placeholder="Data e ora appuntamento (se già fissato)"
              />
            </div>
          </div>
          
          {/* Stato di Salute */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Stato di Salute</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.isAdult}
                  onChange={(e) => setForm({...form, isAdult: e.target.checked})}
                  style={{ accentColor: '#fbbf24' }}
                />
                Dichiaro di essere maggiorenne *
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.hasAllergies}
                  onChange={(e) => setForm({...form, hasAllergies: e.target.checked})}
                  style={{ accentColor: '#fbbf24' }}
                />
                Ho allergie note (specialmente a metalli)
              </label>
              
              {form.hasAllergies && (
                <Input
                  value={form.allergiesDescription}
                  onChange={(e) => setForm({...form, allergiesDescription: e.target.value})}
                  placeholder="Descrivi le allergie (es. nichel, cobalto, etc.)"
                />
              )}
              
              <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHepatitis}
                    onChange={(e) => setForm({...form, hasHepatitis: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Epatite B/C
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHiv}
                    onChange={(e) => setForm({...form, hasHiv: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  HIV
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasDiabetes}
                    onChange={(e) => setForm({...form, hasDiabetes: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Diabete
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasHeartProblems}
                    onChange={(e) => setForm({...form, hasHeartProblems: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Problemi cardiaci
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasBloodDisorders}
                    onChange={(e) => setForm({...form, hasBloodDisorders: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Disturbi della coagulazione
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.isPregnant}
                    onChange={(e) => setForm({...form, isPregnant: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Gravidanza
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.takesAnticoagulants}
                    onChange={(e) => setForm({...form, takesAnticoagulants: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Assumo anticoagulanti
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasKeloidTendency}
                    onChange={(e) => setForm({...form, hasKeloidTendency: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Tendenza a cheloidi
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6' }}>
                  <input
                    type="checkbox"
                    checked={form.hasOtherConditions}
                    onChange={(e) => setForm({...form, hasOtherConditions: e.target.checked})}
                    style={{ accentColor: '#fbbf24' }}
                  />
                  Altre condizioni mediche
                </label>
              </div>
              
              {form.hasOtherConditions && (
                <Textarea
                  value={form.otherConditionsDescription}
                  onChange={(e) => setForm({...form, otherConditionsDescription: e.target.value})}
                  placeholder="Descrivi altre condizioni mediche"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              )}
            </div>
          </div>
          
          {/* Consensi */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>Consensi</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.consentInformedTreatment}
                  onChange={(e) => setForm({...form, consentInformedTreatment: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Presto il mio consenso informato al trattamento di piercing, dopo aver ricevuto tutte le informazioni sui rischi e le procedure. *
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.consentDataProcessing}
                  onChange={(e) => setForm({...form, consentDataProcessing: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Acconsento al trattamento dei miei dati personali secondo la normativa GDPR. *
                </span>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#f3f4f6' }}>
                <input
                  type="checkbox"
                  checked={form.consentPhotos}
                  onChange={(e) => setForm({...form, consentPhotos: e.target.checked})}
                  style={{ accentColor: '#fbbf24', marginTop: '0.2rem' }}
                />
                <span>
                  Acconsento alla realizzazione di fotografie del piercing per scopi documentali e promozionali.
                </span>
              </label>
            </div>
          </div>
          
          {error && (
            <Alert type="error" style={{ marginBottom: '1rem' }}>
              {error}
            </Alert>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/consenso">
              <Button variant="secondary">
                ← Indietro
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !form.consentInformedTreatment || !form.consentDataProcessing || !form.isAdult}
            >
              {loading ? '🔄 Invio in corso...' : '📝 Invia Consenso'}
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  )
}

function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer-container">
      <div className="footer-card">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-copyright">
              Tutti i diritti riservati © {currentYear}
            </span>
          </div>
          <div className="footer-right">
            <span className="footer-developer">
              Sviluppato da{' '}
              <a 
                href="https://vguarino.it" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
              >
                vGuarino
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard')
  const location = useLocation()

  useEffect(() => {
    const token = getCookie('adminToken')
    setIsAdminLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    deleteCookie('adminToken')
    setIsAdminLoggedIn(false)
  }

  const handleAdminTabChange = (tab) => {
    setAdminActiveTab(tab)
  }

  const isAdminPanel = location.pathname === '/admin' && isAdminLoggedIn

  // Determina il titolo della pagina basato sulla route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Gift Card Tink Studio'
      case '/verify':
        return 'Verifica Gift Card'
      case '/consenso':
        return 'Consenso Online per Tatuaggi e Piercing'
      case '/contattaci':
        return 'Contattaci - T\'ink Tattoo Studio'
      case '/admin':
        return 'Pannello Amministratore'
      default:
        if (location.pathname.startsWith('/gift/claim/')) {
          return 'Personalizza la tua Gift Card'
        }
        if (location.pathname.startsWith('/consenso/')) {
          return 'Modulo di Consenso'
        }
        return null
    }
  }

  // Hide header on gift card landing page
  const showHeader = !location.pathname.startsWith('/gift/landing/');

  return (
    <div className="app-container">
      {showHeader && (
        <Header 
          pageTitle={getPageTitle()}
          isAdminPanel={isAdminPanel}
          activeAdminTab={adminActiveTab}
          onAdminTabChange={handleAdminTabChange}
          onLogout={handleLogout}
        >
          <Link to="/" className="header-logo">
            <img src="/LogoScritta.svg" alt="Tink Studio" style={{ height: '2rem', width: 'auto' }} />
          </Link>
          <div className="header-nav-links">
            <Link to="/verify" className="nav-link">
              Verifica Gift Card
            </Link>
            <Link to="/consenso" className="nav-link">
              Consenso Online
            </Link>
            <Link to="/contattaci" className="nav-link">
              Contattaci
            </Link>
            {location.pathname === '/admin' && isAdminLoggedIn ? (
              <Button 
                onClick={handleLogout}
                className="nav-link nav-link-admin"
              >
                Logout
              </Button>
            ) : (
              <Link to="/admin" className="nav-link nav-link-admin">
                Admin Panel
              </Link>
            )}
          </div>
        </Header>
      )}
      <Routes>
<Route path="/" element={<Home />} />
<Route path="/verify" element={<Verify />} />
<Route path="/contattaci" element={<Contattaci />} />
<Route path="/consenso" element={<ConsensoOnline />} />
<Route path="/consenso/tatuaggio" element={<ConsensoTatuaggio />} />
<Route path="/consenso/piercing" element={<ConsensoPiercing />} />
<Route path="/admin" element={<AdminPanel onAuthChange={setIsAdminLoggedIn} activeTab={adminActiveTab} onTabChange={handleAdminTabChange} onLogout={handleLogout} />} />
<Route path="/gift/claim/:token" element={<ClaimPage />} />
<Route path="/gift/landing/:token" element={<GiftCardLanding />} />
      </Routes>
      {showHeader && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
