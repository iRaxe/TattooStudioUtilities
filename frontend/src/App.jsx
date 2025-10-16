import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import { slide as Menu } from 'react-burger-menu'
import './App.css'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  ArrowRightOnRectangleIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  PhoneIcon,
  PlusIcon,
  SparklesIcon,
  Squares2X2Icon,
  UsersIcon
} from '@heroicons/react/24/solid'


// Import new components
import Dashboard from './components/Dashboard'
import CreateGiftCard from './components/CreateGiftCard'
import GiftCardList from './components/GiftCardList'
import CustomerList from './components/CustomerList'
import GiftCardLanding from './components/GiftCardLanding'
import Contattaci from './components/Contattaci'
import TattooAftercare from './components/TattooAftercare'
import TattooConsentForm from './components/TattooConsentForm'
import PermanentMakeupConsentForm from './components/PermanentMakeupConsentForm'
import ConsensoPiercing from './components/ConsensoPiercing'
import AppointmentList from './components/AppointmentList'
import AppointmentForm from './components/AppointmentForm'
import AppointmentCalendar from './components/AppointmentCalendar'
import AvailabilityChecker from './components/AvailabilityChecker'
import Input from './components/common/Input'
import Textarea from './components/common/Textarea'
import Modal from './components/common/Modal'
import { getCookie, setCookie, deleteCookie } from './utils/cookies'
import { copyToClipboard, shareLink } from './utils/clipboard'
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
    const payload = data?.payload || {};

    const normalizeString = (value) => {
      if (typeof value !== 'string') {
        return '';
      }
      return value.trim();
    };

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    const formatDate = (value, fallback = 'N/A') => {
      const parsed = value instanceof Date ? value : parseDate(value);
      if (!parsed) {
        return fallback;
      }
      return parsed.toLocaleDateString('it-IT');
    };

    const formatDateTime = (value, fallback = 'N/A') => {
      const parsed = value instanceof Date ? value : parseDate(value);
      if (!parsed) {
        return fallback;
      }
      return parsed.toLocaleString('it-IT');
    };

    const statementsSource =
      payload && typeof payload.statements === 'object' && payload.statements !== null
        ? payload.statements
        : null;
    const booleanSources = [payload];
    if (statementsSource) {
      booleanSources.push(statementsSource);
    }
    const boolFromPayload = (...keys) => {
      for (const source of booleanSources) {
        if (!source || typeof source !== 'object') {
          continue;
        }
        for (const key of keys) {
          if (Object.prototype.hasOwnProperty.call(source, key) && typeof source[key] === 'boolean') {
            return source[key];
          }
        }
      }
      return null;
    };

    const boolLabel = (value) => {
      if (value === null || typeof value === 'undefined') {
        return 'Non indicato';
      }
      return value ? 'Sì' : 'No';
    };

    const buildNameFallback = () => {
      const candidate =
        normalizeString(payload.fullName) ||
        normalizeString(payload.full_name) ||
        normalizeString(customerName);
      if (!candidate) {
        return { first: '', last: '' };
      }
      const parts = candidate.split(/\s+/).filter(Boolean);
      const [first = '', ...rest] = parts;
      return { first, last: rest.join(' ') };
    };

    const { first: fallbackFirstName, last: fallbackLastName } = buildNameFallback();
    const firstName =
      normalizeString(payload.firstName) ||
      normalizeString(payload.first_name) ||
      fallbackFirstName;
    const lastName =
      normalizeString(payload.lastName) ||
      normalizeString(payload.last_name) ||
      fallbackLastName;
    const fullName =
      normalizeString(payload.fullName) ||
      normalizeString(payload.full_name) ||
      [firstName, lastName].filter(Boolean).join(' ') ||
      normalizeString(customerName) ||
      'N/A';

    const birthDateRaw = normalizeString(payload.birthDate) || normalizeString(payload.birth_date);
    const birthCity = normalizeString(payload.birthCity) || normalizeString(payload.birth_city);
    const birthProvince = normalizeString(payload.birthProvince) || normalizeString(payload.birth_province);
    const birthPlace =
      normalizeString(payload.birthPlace) ||
      normalizeString(payload.birth_place) ||
      [birthCity, birthProvince ? `(${birthProvince})` : ''].filter(Boolean).join(' ');

    const phone =
      normalizeString(payload.phoneNumber) ||
      normalizeString(payload.phone) ||
      normalizeString(data.phone);

    const street =
      normalizeString(payload.residenceStreet) ||
      normalizeString(payload.address) ||
      normalizeString(payload.residence_address);
    const streetNumber = normalizeString(payload.residenceNumber);
    const city = normalizeString(payload.residenceCity) || normalizeString(payload.city);
    const province = normalizeString(payload.residenceProvince) || normalizeString(payload.province);
    const streetLine = [street, streetNumber].filter(Boolean).join(' ').trim();
    const cityLine = [city, province ? `(${province})` : ''].filter(Boolean).join(' ').trim();
    let addressLine =
      [streetLine, cityLine].filter(Boolean).join(', ') ||
      normalizeString(payload.residence) ||
      normalizeString(payload.address);
    if (!addressLine) {
      addressLine = 'N/A';
    }

    const documentType = normalizeString(payload.documentType) || normalizeString(payload.document_type);
    const documentIssuer =
      normalizeString(payload.documentIssuer) ||
      normalizeString(payload.document_issuer) ||
      normalizeString(payload.documentIssuedBy) ||
      normalizeString(payload.document_issue_authority);
    const documentNumber = normalizeString(payload.documentNumber) || normalizeString(payload.document_number);

    const requestedWork =
      normalizeString(payload.requestedWork) ||
      normalizeString(payload.tattooDescription) ||
      normalizeString(payload.treatmentDescription) ||
      'N/A';
    const artistName =
      normalizeString(payload.artistName) ||
      normalizeString(payload.artist_name) ||
      'N/A';
    const appointmentDateRaw =
      normalizeString(payload.appointmentDate) ||
      normalizeString(payload.appointment_date);
    const appointmentDate = parseDate(appointmentDateRaw);

    const acknowledgeInformed = boolFromPayload(
      'acknowledgeInformed',
      'consentInformedTreatment',
      'consentInformation'
    );
    const consentRisks = boolFromPayload('consentRisks');
    const consentAftercare = boolFromPayload('consentAftercare');
    const consentMultipleSessions = boolFromPayload('consentMultipleSessions');
    const consentColorChanges = boolFromPayload('consentColorChanges');
    const consentTimeGap = boolFromPayload('consentTimeGap');
    const releaseLiability = boolFromPayload('releaseLiability', 'consentLiability');
    const consentPublication = boolFromPayload('consentPublication', 'consentPhotos', 'photoConsent');
    const acceptPrivacy = boolFromPayload('acceptPrivacy', 'consentDataProcessing', 'privacyConsent');

    const isMinorClient =
      typeof payload.isMinorClient === 'boolean'
        ? payload.isMinorClient
        : typeof payload.is_minor_client === 'boolean'
          ? payload.is_minor_client
          : null;

    const minorSource = payload.minor || {};
    const minor = {
      name: normalizeString(minorSource.name) || normalizeString(payload.minorName),
      birthDate: parseDate(normalizeString(minorSource.birthDate) || normalizeString(payload.minorBirthDate)),
      birthCity: normalizeString(minorSource.birthCity) || normalizeString(payload.minorBirthCity),
      birthProvince: normalizeString(minorSource.birthProvince) || normalizeString(payload.minorBirthProvince),
      residenceStreet:
        normalizeString(minorSource.residenceStreet) ||
        normalizeString(payload.minorResidenceStreet),
      residenceNumber:
        normalizeString(minorSource.residenceNumber) ||
        normalizeString(payload.minorResidenceNumber),
      residenceCity:
        normalizeString(minorSource.residenceCity) ||
        normalizeString(payload.minorResidenceCity),
      residenceProvince:
        normalizeString(minorSource.residenceProvince) ||
        normalizeString(payload.minorResidenceProvince)
    };
    const minorStreet = [minor.residenceStreet, minor.residenceNumber].filter(Boolean).join(' ').trim();
    const minorCityLine = [minor.residenceCity, minor.residenceProvince ? `(${minor.residenceProvince})` : ''].filter(Boolean).join(' ').trim();
    const hasMinorDetails =
      isMinorClient === true &&
      [
        minor.name,
        minor.birthDate,
        minor.birthCity,
        minor.birthProvince,
        minorStreet,
        minorCityLine
      ].some((value) => {
        if (value instanceof Date) return true;
        return typeof value === 'string' && value.length > 0;
      });

    const signature =
      normalizeString(payload.signature) ||
      normalizeString(payload.signatureImage);
    const ipAddress = normalizeString(payload.ipAddress) || normalizeString(data.ipAddress);
    const userAgent = normalizeString(payload.userAgent) || normalizeString(data.userAgent);

    const submittedAt = parseDate(data?.submittedAt || payload.submittedAt) || new Date();

    const type = (data?.type || payload.type || 'consenso').toLowerCase();
    const typeLabel = type.toUpperCase();

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 20;
    const maxY = pageHeight - margin;

    const checkNewPage = (currentY, lineHeight = 8) => {
      if (currentY + lineHeight > maxY) {
        pdf.addPage();
        return margin;
      }
      return currentY;
    };

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONSENSO INFORMATO', 105, 20, { align: 'center' });

    pdf.setFontSize(16);
    pdf.text(typeLabel, 105, 30, { align: 'center' });

    let yPos = 50;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    yPos = checkNewPage(yPos, 10);
    pdf.text('DATI ANAGRAFICI', 20, yPos);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    yPos += 10;

    const writeLine = (text, lineHeight = 8) => {
      yPos = checkNewPage(yPos, lineHeight);
      pdf.text(text, 20, yPos);
      yPos += lineHeight;
    };

    writeLine(`Nome: ${firstName || 'N/A'}`);
    writeLine(`Cognome: ${lastName || 'N/A'}`);
    writeLine(`Nome completo: ${fullName}`);
    writeLine(`Data di nascita: ${formatDate(birthDateRaw)}`);
    writeLine(`Luogo di nascita: ${birthPlace || 'N/A'}`);
    writeLine(`Telefono: ${phone || 'N/A'}`);
    writeLine(`Residenza: ${addressLine}`);
    writeLine(`Cliente minorenne: ${boolLabel(isMinorClient)}`);

    yPos += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    writeLine("DOCUMENTO D'IDENTITÀ", 10);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    writeLine(`Tipo: ${documentType || 'N/A'}`);
    writeLine(`Numero: ${documentNumber || 'N/A'}`);
    writeLine(`Rilasciato da: ${documentIssuer || 'N/A'}`);

    if (hasMinorDetails) {
      yPos += 5;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      writeLine('CLIENTE MINORENNE', 10);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      writeLine(`Nome: ${minor.name || 'N/A'}`);
      writeLine(`Data di nascita: ${formatDate(minor.birthDate)}`);
      writeLine(
        `Luogo di nascita: ${
          [minor.birthCity, minor.birthProvince ? `(${minor.birthProvince})` : ''].filter(Boolean).join(' ') || 'N/A'
        }`
      );
      writeLine(
        `Residenza: ${[minorStreet, minorCityLine].filter(Boolean).join(', ') || 'N/A'}`
      );
    }

    yPos += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    writeLine('DATI DEL TRATTAMENTO', 10);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    writeLine(`Descrizione: ${requestedWork}`);
    writeLine(`Artista: ${artistName}`);
    writeLine(`Data appuntamento: ${appointmentDate ? formatDate(appointmentDate) : 'N/A'}`);

    yPos += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    writeLine('DICHIARAZIONI', 10);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const declarationEntries = [];
    if (type === 'trucco_permanente') {
      declarationEntries.push({ label: "Ha letto l'informativa", value: acknowledgeInformed });
      declarationEntries.push({
        label: 'Consapevole dei rischi del trattamento',
        value: consentRisks,
      });
      declarationEntries.push({
        label: 'Si impegna a seguire la cura post trattamento',
        value: consentAftercare,
      });
      declarationEntries.push({
        label: 'Accetta il ciclo di sedute previsto',
        value: consentMultipleSessions,
      });
      declarationEntries.push({
        label: 'Consapevole di possibili variazioni di colore o forma',
        value: consentColorChanges,
      });
      declarationEntries.push({
        label: "Rispettera l'intervallo minimo tra le sedute",
        value: consentTimeGap,
      });
      declarationEntries.push({
        label: 'Liberatoria responsabilita operatore',
        value: releaseLiability,
      });
    } else {
      const confirmHealth = boolFromPayload('confirmHealth');
      declarationEntries.push({ label: "Ha letto l'informativa", value: acknowledgeInformed });
      declarationEntries.push({
        label: 'Dichiara di essere in buono stato di salute',
        value: confirmHealth,
      });
      declarationEntries.push({
        label: 'Liberatoria responsabilita artista',
        value: releaseLiability,
      });
    }
    declarationEntries.push({
      label: 'Autorizza uso di foto/video',
      value: consentPublication,
    });
    declarationEntries.push({
      label: 'Accetta trattamento dati personali',
      value: acceptPrivacy,
    });
    declarationEntries.forEach((entry) => {
      if (entry && entry.label) {
        writeLine(`${entry.label}: ${boolLabel(entry.value)}`);
      }
    });

    yPos += 5;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    writeLine('FIRMA DIGITALE', 10);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    writeLine(`Data e ora invio: ${formatDateTime(submittedAt)}`);
    writeLine(`IP Address: ${ipAddress || 'N/A'}`);

    const userAgentLines = pdf.splitTextToSize(`User Agent: ${userAgent || 'N/A'}`, 170);
    userAgentLines.forEach((line) => {
      writeLine(line);
    });

    if (signature) {
      const signatureData = signature.startsWith('data:image') ? signature : `data:image/png;base64,${signature}`;
      const signatureHeight = 30;
      const signatureWidth = 70;
      yPos = checkNewPage(yPos, signatureHeight + 10);
      pdf.addImage(signatureData, 'PNG', 20, yPos, signatureWidth, signatureHeight);
      yPos += signatureHeight + 6;
      writeLine('Firma del dichiarante', 6);
    } else {
      writeLine('Firma: N/A');
    }

    const sanitizeForFileName = (value) => {
      const normalized = normalizeString(value).toLowerCase().replace(/\s+/g, '_');
      return normalized.replace(/[^a-z0-9_-]/g, '');
    };

    const submissionDateForName = sanitizeForFileName(formatDate(submittedAt, '').replace(/\//g, '-'));
    const fileNameParts = [
      'consenso',
      type,
      sanitizeForFileName(firstName),
      sanitizeForFileName(lastName),
      submissionDateForName
    ].filter(Boolean);

    const fileName = `${fileNameParts.join('_') || `consenso_${type}`}.pdf`;

    pdf.save(fileName);
  } catch (error) {
    console.error('Errore generazione PDF consenso:', error);
    alert('Errore nella generazione del PDF del consenso.');
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
              <Squares2X2Icon style={{ marginRight: '0.5rem' }} /> Dashboard
            </button>
            <button 
              className={`bm-item menu-item ${activeAdminTab === 'create' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('create')
                setIsMobileMenuOpen(false)
              }}
            >
              <PlusIcon style={{ marginRight: '0.5rem' }} /> Crea Gift Card
            </button>
            <button 
              className={`bm-item menu-item ${activeAdminTab === 'giftcards' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('giftcards')
                setIsMobileMenuOpen(false)
              }}
            >
              <GiftIcon style={{ marginRight: '0.5rem' }} /> Elenco Gift Card
            </button>
            <button
              className={`bm-item menu-item ${activeAdminTab === 'customers' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('customers')
                setIsMobileMenuOpen(false)
              }}
            >
              <UsersIcon style={{ marginRight: '0.5rem' }} /> Elenco Clienti
            </button>
            <button
              className={`bm-item menu-item ${activeAdminTab === 'appointments' ? 'menu-item-admin' : ''}`}
              onClick={() => {
                onAdminTabChange?.('appointments')
                setIsMobileMenuOpen(false)
              }}
            >
              <PaintBrushIcon style={{ marginRight: '0.5rem' }} /> Appuntamenti
            </button>
            <button
              className="bm-item menu-item menu-item-admin"
              onClick={() => {
                onLogout?.()
                setIsMobileMenuOpen(false)
              }}
            >
              <ArrowRightOnRectangleIcon style={{ marginRight: '0.5rem' }} /> Logout
            </button>
          </div>
        ) : (
          <div>
            <Link to="/verify" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <MagnifyingGlassIcon style={{ marginRight: '0.5rem' }} /> Verifica Gift Card
            </Link>
            <Link to="/consenso" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <PencilSquareIcon style={{ marginRight: '0.5rem' }} /> Consenso Online
            </Link>
            <Link to="/cura-del-tatuaggio" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <SparklesIcon style={{ marginRight: '0.5rem' }} /> Cura del Tatuaggio
            </Link>
            <Link to="/contattaci" className="bm-item menu-item" onClick={() => setIsMobileMenuOpen(false)}>
              <PhoneIcon style={{ marginRight: '0.5rem' }} /> Contattaci
            </Link>
            <Link to="/admin" className="bm-item menu-item menu-item-admin" onClick={() => setIsMobileMenuOpen(false)}>
              <Squares2X2Icon style={{ marginRight: '0.5rem' }} /> Admin Panel
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
        if (!data?.token) {
          setError('Risposta del server senza token. Riprova.')
          return
        }
        setCookie('adminToken', data.token, 7)
        onLoggedIn?.(data.token)
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
  const [authToken, setAuthToken] = useState(() => getCookie('adminToken'))
  const [isAuth, setIsAuth] = useState(() => !!getCookie('adminToken'))
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
    const cookieToken = getCookie('adminToken')

    if (cookieToken && cookieToken !== authToken) {
      setAuthToken(cookieToken)
      setIsAuth(true)
      onAuthChange?.(true)
    }

    if (!cookieToken && authToken) {
      setAuthToken(null)
      setIsAuth(false)
      onAuthChange?.(false)
    }
  }, [authToken, onAuthChange])

  useEffect(() => {
    if (!authToken) {
      return
    }

    fetchDraftCards()
    fetchAllGiftCards()
    fetchStats()
    fetchCustomers()
    fetchTatuatori()
    fetchStanze()
  }, [authToken])

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

  const resolveToken = () => authToken || getCookie('adminToken')

  const fetchDraftCards = async () => {
    try {
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching drafts')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching gift cards')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching stats')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching customers')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching tatuatori')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        console.warn('Missing admin token while fetching stanze')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        setError('Token amministratore mancante. Effettua di nuovo il login.')
        return
      }
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
        const copied = await copyToClipboard(data.claim_url)
        if (!copied) {
          console.warn('Automatic clipboard copy failed for draft link.')
        }
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
      const token = resolveToken()
      if (!token) {
        alert('Sessione amministratore scaduta. Effettua nuovamente il login.')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        alert('Sessione amministratore scaduta. Effettua nuovamente il login.')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        alert('Sessione amministratore scaduta. Effettua nuovamente il login.')
        return
      }
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
      const token = resolveToken()
      if (!token) {
        alert('Sessione amministratore scaduta. Effettua nuovamente il login.')
        return
      }
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
    }
    setAuthToken(null)
    setIsAuth(false)
    onAuthChange?.(false)
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
          <AdminLogin
            onLoggedIn={(token) => {
              setAuthToken(token)
              setIsAuth(true)
              onAuthChange?.(true)
            }}
            onAuthChange={onAuthChange}
          />
        </Card>
      </Container>
    )
  }

  return (
    <Container className="admin-panel">
      <div className="admin-layout">
        {/* Sidebar Navigation */}
        <aside className="admin-sidebar">
          <div className="admin-nav">
            <Button
              variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('dashboard')}
              type="button"
              className="admin-nav-btn"
            >
              <Squares2X2Icon className="admin-nav-icon" aria-hidden="true" />
              <span className="admin-nav-label">Dashboard</span>
            </Button>
            <Button
              variant={activeTab === 'create' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('create')}
              type="button"
              className="admin-nav-btn"
            >
              <PlusIcon className="admin-nav-icon" aria-hidden="true" />
              <span className="admin-nav-label">Crea Gift Card</span>
            </Button>
            <Button
              variant={activeTab === 'giftcards' ? 'primary' : 'ghost'}
              onClick={() => {
                handleTabChange('giftcards')
                fetchAllGiftCards()
              }}
              type="button"
              className="admin-nav-btn"
            >
              <GiftIcon className="admin-nav-icon" aria-hidden="true" />
              <span className="admin-nav-label">Elenco Gift Card</span>
            </Button>
            <Button
              variant={activeTab === 'customers' ? 'primary' : 'ghost'}
              onClick={() => {
                handleTabChange('customers')
                fetchCustomers()
              }}
              type="button"
              className="admin-nav-btn"
            >
              <UsersIcon className="admin-nav-icon" aria-hidden="true" />
              <span className="admin-nav-label">Elenco Clienti</span>
            </Button>
            <Button
              variant={activeTab === 'appointments' ? 'primary' : 'ghost'}
              onClick={() => handleTabChange('appointments')}
              type="button"
              className="admin-nav-btn"
            >
              <PaintBrushIcon className="admin-nav-icon" aria-hidden="true" />
              <span className="admin-nav-label">Appuntamenti</span>
            </Button>
          </div>
        </aside>
        
        {/* Main Content */}
        <section className="admin-content">
        
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
        
        </section>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ color: '#9ca3af', fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Nome *</label>
                  <Input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      backgroundColor: '#000000',
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
                      backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                    backgroundColor: '#000000',
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
                  backgroundColor: '#000000',
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
        setClaimData((previous) => {
          const next = {
            ...previous,
            status: 'active',
            first_name: form.first_name,
            last_name: form.last_name,
            phone: form.phone,
            email: form.email,
            dedication: form.dedication,
            landing_url: data.qr_code_data || data.landing_url
          };

          const returnedCode = data?.code || data?.gift_card?.code;
          if (returnedCode) {
            next.code = returnedCode;
          }

          if (!next.code && previous?.code) {
            next.code = previous.code;
          }

          return next;
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
            
            {claimData.code && (
              <div className="claim-success-details">
                <div className="claim-success-label">Codice gift card:</div>
                <div className="claim-success-code">{claimData.code}</div>
              </div>
            )}
            
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
            
            <div className="claim-success-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
              {claimData.code && (
                <button 
                  onClick={async () => {
                    const copied = await copyToClipboard(claimData.code)
                    if (copied) {
                      alert('Codice copiato negli appunti!')
                    } else {
                      alert(`Impossibile copiare automaticamente il codice.\nCodice: ${claimData.code}`)
                    }
                  }}
                  className="claim-pdf-button"
                  aria-label="Copia codice gift card"
                >
                  <i className="fas fa-hashtag"></i> Copia Codice
                </button>
              )}
              
              <button 
                onClick={async () => {
                  const copied = await copyToClipboard(claimData.landing_url)
                  if (copied) {
                    alert('Link copiato negli appunti!')
                  } else {
                    alert(`Impossibile copiare automaticamente il link.\nCopialo manualmente:\n\n${claimData.landing_url}`)
                  }
                }}
                className="claim-pdf-button"
                aria-label="Copia link negli appunti"
              >
                <i className="fas fa-copy"></i> Copia Link
              </button>
              
              <button 
                onClick={async () => {
                  const result = await shareLink({
                    title: 'Gift Card Tink Studio',
                    text: `Hai ricevuto una gift card di €${claimData.amount}!`,
                    url: claimData.landing_url
                  })
                  if (result === 'copied') {
                    alert('Condivisione non disponibile su questo dispositivo.\nLink copiato negli appunti!')
                  } else if (result === 'failed') {
                    alert(`Impossibile condividere automaticamente il link.\nCopialo manualmente:\n\n${claimData.landing_url}`)
                  }
                }}
                className="claim-pdf-button"
                aria-label="Condividi gift card"
              >
                <i className="fas fa-share-alt"></i> Condividi
              </button>
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
                <PaintBrushIcon />
              </div>
              <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                Consenso per Tatuaggio & Piercing
              </h3>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>
                Compila il modulo di consenso informato per tatuaggi e piercing
              </p>
            </div>
          </Link>
          
          <Link 
            to="/consenso/trucco-permanente"
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
                <PencilSquareIcon />
              </div>
              <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
                Consenso Trucco Permanente
              </h3>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: '1rem' }}>
                Compila il modulo di consenso informato dedicato al trucco permanente
              </p>
            </div>
          </Link>
        </div>
        

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
        return 'Consenso Online - Trucco Permanente, Tatuaggi e Piercing'
      case '/consenso/trucco-permanente':
        return 'Consenso Trucco Permanente'
      case '/cura-del-tatuaggio':
        return 'Cura del Tatuaggio'
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
            <Link to="/cura-del-tatuaggio" className="nav-link">
              Cura del Tatuaggio
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
<Route path="/cura-del-tatuaggio" element={<TattooAftercare />} />
<Route path="/contattaci" element={<Contattaci />} />
<Route path="/consenso" element={<ConsensoOnline />} />
<Route path="/consenso/tatuaggio" element={<TattooConsentForm />} />
<Route path="/consenso/trucco-permanente" element={<PermanentMakeupConsentForm />} />
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
