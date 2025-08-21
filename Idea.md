# TinkStudio - Sistema di Gestione per Studio di Tatuaggi e Piercing

## Panoramica del Progetto

TinkStudio è un sistema completo di gestione per studi di tatuaggi e piercing che include:
- Sistema di gestione gift card digitali
- Sistema di consenso online con generazione PDF
- Dashboard amministrativa completa
- Gestione clienti e statistiche

## Architettura Implementata

### Stack Tecnologico

**Frontend:**
- React 18 con Vite
- React Router per il routing
- CSS3 con Grid e Flexbox
- Componenti modulari riutilizzabili

**Backend:**
- Node.js con Express.js
- SQLite come database
- PDFKit per generazione PDF
- Multer per upload file
- CORS e sicurezza integrata

### Struttura del Progetto

```
TinkStudio2/
├── backend/
│   ├── index.js          # Server principale e API routes
│   ├── db.js             # Configurazione database SQLite
│   ├── package.json      # Dipendenze backend
│   ├── .env              # Variabili d'ambiente
│   └── README.md         # Documentazione backend
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Componente principale
│   │   ├── components/   # Componenti React
│   │   │   ├── Dashboard.jsx
│   │   │   ├── GiftCardList.jsx
│   │   │   ├── CustomerList.jsx
│   │   │   ├── CreateGiftCard.jsx
│   │   │   └── common/   # Componenti riutilizzabili
│   │   └── utils/        # Utility e helpers
│   ├── package.json      # Dipendenze frontend
│   └── README.md         # Documentazione frontend
└── README.md             # Documentazione generale
```

## Funzionalità Implementate

### 1. Sistema Gift Card

**Creazione Gift Card:**
- Form per creazione nuove gift card
- Generazione automatica codice univoco
- Inserimento dati cliente (nome, email, telefono, data nascita)
- Impostazione importo e note opzionali

**Gestione Gift Card:**
- Lista completa gift card con filtri
- Ricerca per codice, nome cliente o email
- Modifica informazioni gift card
- Cambio stato (attiva/utilizzata/scaduta)
- Eliminazione gift card

**Utilizzo Gift Card:**
- Sistema di verifica codice
- Marcatura come utilizzata
- Tracking data e ora utilizzo

### 2. Gestione Clienti

**Registrazione Clienti:**
- Form completo per nuovi clienti
- Campi: nome, cognome, email, telefono, data di nascita
- Validazione dati in tempo reale

**Gestione Database Clienti:**
- Lista completa clienti registrati
- Ricerca per nome o email
- Modifica informazioni cliente
- Eliminazione clienti
- Storico gift card per cliente

### 3. Sistema Consenso Online

**Form Consenso Pubblico:**
- Pagina pubblica accessibile senza autenticazione
- Form per dati cliente e consenso
- Campi personalizzabili per tipo di trattamento

**Generazione PDF:**
- Creazione automatica PDF consenso
- Template professionale con dati studio
- Download immediato del documento
- Archiviazione server-side

### 4. Dashboard Amministrativa

**Statistiche in Tempo Reale:**
- Totale gift card attive
- Valore totale gift card
- Numero clienti registrati
- Gift card utilizzate oggi
- Consensi generati oggi

**Layout Dashboard:**
- Griglia responsive con 5 statistiche per riga
- Cards con icone e colori distintivi
- Aggiornamento automatico dati

**Pannello di Controllo:**
- Accesso rapido a tutte le funzioni
- Navigazione intuitiva
- Interfaccia responsive

### 5. Sistema di Autenticazione

**Login Amministratore:**
- Autenticazione con password
- Sessioni persistenti con cookie
- Protezione rotte amministrative
- Logout sicuro

**Sicurezza:**
- Validazione input per prevenire SQL injection
- Sanitizzazione dati
- CORS configurato
- Rate limiting (implementabile)

## Database Schema

### Tabella gift_cards
```sql
- id (INTEGER PRIMARY KEY)
- code (TEXT UNIQUE)           # Codice univoco gift card
- amount (REAL)                # Valore in euro
- customer_name (TEXT)         # Nome cliente
- customer_email (TEXT)        # Email cliente
- customer_phone (TEXT)        # Telefono cliente
- customer_birth_date (TEXT)   # Data nascita cliente
- notes (TEXT)                 # Note aggiuntive
- is_used (BOOLEAN)            # Stato utilizzo
- created_at (DATETIME)        # Data creazione
- used_at (DATETIME)           # Data utilizzo
```

### Tabella customers
```sql
- id (INTEGER PRIMARY KEY)
- name (TEXT)                  # Nome completo
- email (TEXT UNIQUE)          # Email
- phone (TEXT)                 # Telefono
- birth_date (TEXT)            # Data nascita
- created_at (DATETIME)        # Data registrazione
```

### Tabella consents
```sql
- id (INTEGER PRIMARY KEY)
- customer_name (TEXT)         # Nome cliente
- customer_email (TEXT)        # Email cliente
- customer_phone (TEXT)        # Telefono cliente
- customer_birth_date (TEXT)   # Data nascita
- consent_type (TEXT)          # Tipo consenso
- treatment_details (TEXT)     # Dettagli trattamento
- pdf_filename (TEXT)          # Nome file PDF
- created_at (DATETIME)        # Data creazione
```

## API Endpoints Implementate

### Autenticazione
- `POST /api/login` - Login amministratore
- `POST /api/logout` - Logout
- `GET /api/check-auth` - Verifica autenticazione

### Gift Cards
- `GET /api/gift-cards` - Lista gift cards
- `POST /api/gift-cards` - Crea nuova gift card
- `PUT /api/gift-cards/:id` - Aggiorna gift card
- `DELETE /api/gift-cards/:id` - Elimina gift card
- `PUT /api/gift-cards/:id/use` - Utilizza gift card

### Clienti
- `GET /api/customers` - Lista clienti
- `POST /api/customers` - Aggiungi cliente
- `PUT /api/customers/:id` - Aggiorna cliente
- `DELETE /api/customers/:id` - Elimina cliente

### Consensi
- `POST /api/consent` - Crea consenso e genera PDF
- `GET /api/consent/:filename` - Scarica PDF consenso

### Statistiche
- `GET /api/stats` - Statistiche dashboard

## Componenti Frontend

### Componenti Principali
- **App.jsx** - Componente root con routing e stato globale
- **Dashboard.jsx** - Dashboard con statistiche e panoramica
- **GiftCardList.jsx** - Gestione completa gift cards
- **CustomerList.jsx** - Gestione clienti
- **CreateGiftCard.jsx** - Form creazione gift card

### Componenti Common (Riutilizzabili)
- **Alert.jsx** - Messaggi di feedback
- **Button.jsx** - Bottoni stilizzati
- **Input.jsx** - Campi input con validazione
- **Modal.jsx** - Finestre modali
- **Textarea.jsx** - Aree di testo

### Routing
- `/` - Dashboard principale
- `/gift-cards` - Gestione gift cards
- `/customers` - Gestione clienti
- `/consent` - Form consenso pubblico

## Caratteristiche UX/UI

### Design System
- Layout responsive con CSS Grid
- Palette colori coerente
- Tipografia leggibile
- Icone intuitive

### Responsive Design
- Ottimizzato per desktop, tablet e mobile
- Breakpoints: 768px (tablet), 1200px (desktop)
- Layout adattivo per tutte le schermate

### Accessibilità
- Contrasti colori adeguati
- Navigazione da tastiera
- Etichette descrittive
- Messaggi di errore chiari

## Configurazione e Deploy

### Variabili d'Ambiente

**Backend (.env):**
```
PORT=3001
ADMIN_PASSWORD=admin123
DB_PATH=./database.sqlite
```

**Frontend:**
- Proxy Vite configurato per API backend
- Build ottimizzato per produzione

### Installazione

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Accesso
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Login admin: password configurabile in .env

## Sicurezza Implementata

- Autenticazione basata su sessioni
- Validazione input rigorosa
- Sanitizzazione dati per PDF
- CORS configurato per domini specifici
- Protezione contro SQL injection
- Gestione errori sicura

## Funzionalità Avanzate

### Generazione PDF
- Template professionale
- Dati studio personalizzabili
- Firma digitale del consenso
- Archiviazione automatica

### Sistema di Ricerca
- Ricerca real-time gift cards
- Filtri per stato e data
- Ricerca clienti per nome/email
- Ordinamento risultati

### Gestione Errori
- Messaggi utente friendly
- Logging errori server
- Fallback per operazioni critiche
- Validazione client e server

## Metriche e Analytics

### Statistiche Disponibili
- Gift cards totali e per stato
- Valore economico totale
- Clienti registrati
- Consensi generati
- Utilizzi giornalieri

### Audit Trail
- Log creazione gift cards
- Log utilizzi
- Log accessi admin
- Storico modifiche

## Roadmap Futura

### Miglioramenti Pianificabili
- Sistema di notifiche email
- QR code per gift cards
- Export dati in Excel/CSV
- Backup automatico database
- Sistema di scadenza automatica
- Integrazione pagamenti online
- App mobile companion
- Sistema di prenotazioni

### Ottimizzazioni Tecniche
- Caching Redis
- Database PostgreSQL per produzione
- CDN per assets statici
- Monitoring e alerting
- CI/CD pipeline
- Containerizzazione Docker

## Note di Sviluppo

### Best Practices Implementate
- Componenti React funzionali
- Hooks per gestione stato
- Separazione concerns
- Codice modulare e riutilizzabile
- Documentazione completa
- Error boundaries

### Testing
- Validazione manuale completa
- Test cross-browser
- Test responsive design
- Verifica sicurezza base

### Manutenzione
- Codice ben commentato
- Struttura chiara e logica
- Dipendenze aggiornate
- README dettagliati

---

**Stato Progetto:** ✅ Completato e Funzionale
**Ultimo Aggiornamento:** Dicembre 2024
**Repository:** https://github.com/iRaxe/TattooStudioUtilities.git