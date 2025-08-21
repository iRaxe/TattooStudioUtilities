# TinkStudio Backend

Backend API per il sistema di gestione dello studio di tatuaggi e piercing TinkStudio.

## Tecnologie Utilizzate

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **SQLite** - Database locale
- **Multer** - Gestione upload file
- **PDFKit** - Generazione PDF
- **CORS** - Cross-Origin Resource Sharing

## Struttura del Progetto

```
backend/
├── index.js          # Server principale e routes API
├── db.js             # Configurazione database SQLite
├── package.json      # Dipendenze e script
├── .env              # Variabili d'ambiente
└── uploads/          # Directory per file caricati
```

## Installazione

1. Naviga nella directory backend:
```bash
cd backend
```

2. Installa le dipendenze:
```bash
npm install
```

3. Configura le variabili d'ambiente:
Crea un file `.env` nella directory backend:
```env
PORT=3001
ADMIN_PASSWORD=admin123
DB_PATH=./database.sqlite
```

## Avvio del Server

### Modalità Sviluppo
```bash
npm run dev
```

### Modalità Produzione
```bash
npm start
```

Il server sarà disponibile su `http://localhost:3001`

## API Endpoints

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

## Database

Il sistema utilizza SQLite con le seguenti tabelle:

### gift_cards
- `id` - ID univoco
- `code` - Codice gift card
- `amount` - Valore in euro
- `customer_name` - Nome cliente
- `customer_email` - Email cliente
- `is_used` - Stato utilizzo
- `created_at` - Data creazione
- `used_at` - Data utilizzo

### customers
- `id` - ID univoco
- `name` - Nome completo
- `email` - Email
- `phone` - Telefono
- `birth_date` - Data di nascita
- `created_at` - Data registrazione

### consents
- `id` - ID univoco
- `customer_name` - Nome cliente
- `customer_email` - Email cliente
- `consent_type` - Tipo consenso
- `pdf_filename` - Nome file PDF
- `created_at` - Data creazione

## Configurazione

### Variabili d'Ambiente

- `PORT` - Porta del server (default: 3001)
- `ADMIN_PASSWORD` - Password amministratore
- `DB_PATH` - Percorso database SQLite

### CORS

Il server è configurato per accettare richieste da:
- `http://localhost:5173` (frontend sviluppo)
- `http://localhost:3000` (frontend produzione)

## Sicurezza

- Autenticazione basata su sessioni
- Validazione input per prevenire SQL injection
- Sanitizzazione dati per generazione PDF
- CORS configurato per domini specifici

## Sviluppo

### Aggiungere Nuovi Endpoint

1. Definisci la route in `index.js`
2. Implementa la logica di business
3. Aggiungi validazione input
4. Testa l'endpoint

### Modificare il Database

1. Modifica lo schema in `db.js`
2. Aggiorna le query esistenti
3. Considera la migrazione dati

## Troubleshooting

### Errori Comuni

**Database locked**
- Assicurati che non ci siano altre istanze in esecuzione
- Verifica i permessi della directory

**CORS errors**
- Controlla la configurazione CORS in `index.js`
- Verifica l'URL del frontend

**File upload errors**
- Verifica che la directory `uploads/` esista
- Controlla i permessi di scrittura

## Contribuire

1. Fork del repository
2. Crea un branch per la feature
3. Implementa le modifiche
4. Testa le modifiche
5. Crea una pull request

## Licenza

MIT License - vedi file LICENSE per dettagli.