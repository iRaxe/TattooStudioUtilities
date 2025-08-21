# TinkStudio - Sistema di Gestione per Studio di Tatuaggi e Piercing

## 📋 Descrizione

TinkStudio è un sistema completo di gestione per studi di tatuaggi e piercing che include:
- Gestione gift card digitali
- Sistema di consensi online per tatuaggi e piercing
- Dashboard amministrativa per la gestione clienti
- Generazione automatica di PDF per consensi
- Sistema di verifica e riscatto gift card

## 🚀 Funzionalità Principali

### 🎁 Sistema Gift Card
- **Creazione gift card**: Genera gift card personalizzate con QR code
- **Verifica validità**: Sistema di verifica tramite codice o QR code
- **Riscatto**: Processo guidato per il riscatto delle gift card
- **Gestione scadenze**: Controllo automatico delle date di scadenza
- **Tracking utilizzo**: Monitoraggio dello stato delle gift card (attive, utilizzate, scadute)

### 📝 Sistema Consensi Online
- **Consenso Tatuaggio**: Modulo completo per consensi tatuaggi
- **Consenso Piercing**: Modulo specifico per piercing
- **Validazione dati**: Controlli automatici su campi obbligatori
- **Generazione PDF**: Creazione automatica di documenti PDF firmabili
- **Archiviazione sicura**: Salvataggio sicuro dei consensi nel database

### 👥 Gestione Clienti
- **Database clienti**: Anagrafica completa dei clienti
- **Storico consensi**: Visualizzazione di tutti i consensi per cliente
- **Modifica dati**: Aggiornamento informazioni cliente
- **Ricerca avanzata**: Filtri per nome, email, telefono
- **Esportazione dati**: Download dei consensi in formato PDF

### 📊 Dashboard Amministrativa
- **Statistiche in tempo reale**: 
  - Totale gift card create
  - Gift card utilizzate
  - Ricavi totali e utilizzati
  - Numero consensi registrati
  - Numero clienti totali
- **Gestione gift card**: Visualizzazione, modifica, eliminazione
- **Gestione clienti**: CRUD completo per anagrafica clienti
- **Sistema di autenticazione**: Login sicuro per amministratori

### 🔄 Integrazione Automatica
- **Aggiornamento automatico gift card**: Quando viene creato un consenso con numero di telefono corrispondente a una gift card esistente, i dati della gift card vengono automaticamente aggiornati
- **Sincronizzazione dati**: Mantenimento della coerenza tra gift card e clienti

## 🛠️ Tecnologie Utilizzate

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Database (con fallback in-memory)
- **Multer** - Gestione upload file
- **CORS** - Gestione cross-origin requests

### Frontend
- **React** - Libreria UI
- **React Router** - Routing client-side
- **Vite** - Build tool e dev server
- **HTML2Canvas** - Generazione immagini da HTML
- **jsPDF** - Generazione documenti PDF
- **QRCode** - Generazione codici QR

## 📁 Struttura del Progetto

```
TinkStudio2/
├── backend/
│   ├── index.js          # Server principale
│   ├── db.js             # Configurazione database
│   ├── package.json      # Dipendenze backend
│   └── .env             # Variabili ambiente
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # Componente principale
│   │   ├── App.css       # Stili principali
│   │   ├── components/   # Componenti React
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateGiftCard.jsx
│   │   │   ├── GiftCardList.jsx
│   │   │   ├── CustomerList.jsx
│   │   │   └── common/   # Componenti riutilizzabili
│   │   └── utils/        # Utilità (cookies, etc.)
│   ├── package.json      # Dipendenze frontend
│   └── vite.config.js    # Configurazione Vite
└── README.md            # Questo file
```

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js (versione 16 o superiore)
- npm o yarn

### Installazione

1. **Clona il repository**
   ```bash
   git clone <url-repository>
   cd TinkStudio2
   ```

2. **Installa dipendenze backend**
   ```bash
   cd backend
   npm install
   ```

3. **Installa dipendenze frontend**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configura variabili ambiente** (opzionale)
   ```bash
   cd ../backend
   cp .env.example .env
   # Modifica .env con le tue configurazioni
   ```

### Avvio dell'applicazione

1. **Avvia il backend**
   ```bash
   cd backend
   npm start
   ```
   Il server sarà disponibile su `http://localhost:3001`

2. **Avvia il frontend** (in un nuovo terminale)
   ```bash
   cd frontend
   npm run dev
   ```
   L'applicazione sarà disponibile su `http://localhost:5173`

## 🔐 Accesso Amministratore

**Credenziali di default:**
- Username: `admin`
- Password: `password123`

⚠️ **Importante**: Cambia le credenziali di default in produzione!

## 📱 Utilizzo

### Per i Clienti
1. **Verifica Gift Card**: Vai su `/verify` e inserisci il codice
2. **Riscatto Gift Card**: Compila il modulo con i tuoi dati
3. **Consenso Online**: Accedi a `/consenso` per compilare i moduli

### Per gli Amministratori
1. **Login**: Accedi con le credenziali admin
2. **Dashboard**: Visualizza statistiche e gestisci il sistema
3. **Crea Gift Card**: Genera nuove gift card personalizzate
4. **Gestione Clienti**: Visualizza e modifica dati clienti
5. **Gestione Consensi**: Scarica e gestisci i consensi

## 🔧 API Endpoints

### Gift Cards
- `GET /api/gift-cards` - Lista gift cards
- `POST /api/gift-cards` - Crea gift card
- `GET /api/gift-cards/verify/:code` - Verifica gift card
- `POST /api/gift-cards/claim` - Riscatta gift card
- `PUT /api/gift-cards/:id` - Aggiorna gift card
- `DELETE /api/gift-cards/:id` - Elimina gift card

### Clienti
- `GET /api/customers` - Lista clienti
- `POST /api/customers` - Crea cliente
- `PUT /api/customers/:id` - Aggiorna cliente
- `DELETE /api/customers/:id` - Elimina cliente

### Consensi
- `POST /api/consenso/tatuaggio` - Crea consenso tatuaggio
- `POST /api/consenso/piercing` - Crea consenso piercing
- `GET /api/consensi` - Lista consensi
- `GET /api/consensi/:id` - Dettagli consenso
- `DELETE /api/consensi/:id` - Elimina consenso

### Statistiche
- `GET /api/stats` - Statistiche dashboard

## 🎨 Personalizzazione

### Stili
- Modifica `frontend/src/App.css` per personalizzare l'aspetto
- Il tema utilizza una palette scura con accenti colorati
- Responsive design per dispositivi mobili

### Configurazione
- Database: Modifica `backend/db.js` per configurazioni avanzate
- CORS: Configura domini autorizzati in `backend/index.js`
- Upload: Personalizza limiti file in `backend/index.js`

## 🔒 Sicurezza

- Validazione input lato server e client
- Sanitizzazione dati per prevenire SQL injection
- Gestione sicura dei file upload
- Autenticazione basata su sessioni
- CORS configurato per domini specifici

## 📝 Note di Sviluppo

### Database
- Utilizza SQLite in produzione
- Fallback automatico a database in-memory se SQLite non disponibile
- Schema auto-creato al primo avvio

### Logging
- Log dettagliati per debugging
- Tracciamento operazioni gift card
- Monitoraggio errori e performance

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 📞 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta il team di sviluppo

---

**TinkStudio** - Gestione professionale per il tuo studio di tatuaggi e piercing 🎨