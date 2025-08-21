# TinkStudio Frontend

Interfaccia utente React per il sistema di gestione dello studio di tatuaggi e piercing TinkStudio.

## Tecnologie Utilizzate

- **React 18** - Libreria UI
- **React Router** - Routing client-side
- **Vite** - Build tool e dev server
- **CSS3** - Styling con CSS Grid e Flexbox
- **JavaScript ES6+** - Linguaggio di programmazione

## Struttura del Progetto

```
frontend/
├── public/
│   └── vite.svg          # Favicon
├── src/
│   ├── components/
│   │   ├── common/       # Componenti riutilizzabili
│   │   │   ├── Alert.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Textarea.jsx
│   │   ├── CreateGiftCard.jsx
│   │   ├── CustomerList.jsx
│   │   ├── Dashboard.jsx
│   │   └── GiftCardList.jsx
│   ├── utils/
│   │   └── cookies.js    # Gestione cookie
│   ├── App.jsx          # Componente principale
│   ├── App.css          # Stili globali
│   ├── main.jsx         # Entry point
│   └── index.css        # Reset CSS
├── index.html           # Template HTML
├── package.json         # Dipendenze e script
└── vite.config.js       # Configurazione Vite
```

## Installazione

1. Naviga nella directory frontend:
```bash
cd frontend
```

2. Installa le dipendenze:
```bash
npm install
```

## Avvio dell'Applicazione

### Modalità Sviluppo
```bash
npm run dev
```
L'applicazione sarà disponibile su `http://localhost:5173`

### Build per Produzione
```bash
npm run build
```

### Anteprima Build
```bash
npm run preview
```

## Componenti Principali

### App.jsx
Componente principale che gestisce:
- Routing dell'applicazione
- Stato globale dell'autenticazione
- Layout principale
- Modali per creazione/modifica dati

### Dashboard.jsx
Dashboard amministrativa con:
- Statistiche in tempo reale
- Panoramica gift cards
- Panoramica clienti
- Accesso rapido alle funzioni

### GiftCardList.jsx
Gestione gift cards:
- Lista paginata gift cards
- Filtri e ricerca
- Azioni (modifica, elimina, utilizza)
- Indicatori stato

### CustomerList.jsx
Gestione clienti:
- Lista clienti registrati
- Ricerca per nome/email
- Modifica informazioni cliente
- Eliminazione clienti

### CreateGiftCard.jsx
Creazione nuove gift cards:
- Form validato
- Generazione codice automatica
- Invio email (se configurato)

## Componenti Common

### Alert.jsx
Componente per messaggi di feedback:
```jsx
<Alert type="success" message="Operazione completata" />
<Alert type="error" message="Errore durante l'operazione" />
```

### Button.jsx
Bottone riutilizzabile:
```jsx
<Button variant="primary" onClick={handleClick}>Salva</Button>
<Button variant="secondary" disabled>Annulla</Button>
```

### Input.jsx
Campo input con validazione:
```jsx
<Input
  type="email"
  placeholder="Email cliente"
  value={email}
  onChange={setEmail}
  required
/>
```

### Modal.jsx
Finestra modale:
```jsx
<Modal isOpen={isOpen} onClose={handleClose} title="Titolo">
  <p>Contenuto modale</p>
</Modal>
```

### Textarea.jsx
Area di testo:
```jsx
<Textarea
  placeholder="Note aggiuntive"
  value={notes}
  onChange={setNotes}
  rows={4}
/>
```

## Routing

L'applicazione utilizza React Router con le seguenti rotte:

- `/` - Dashboard principale
- `/gift-cards` - Gestione gift cards
- `/customers` - Gestione clienti
- `/consent` - Sistema consenso online

## Gestione Stato

L'applicazione utilizza:
- **useState** per stato locale dei componenti
- **useEffect** per side effects
- **Cookies** per persistenza autenticazione
- **Fetch API** per comunicazione con backend

## Styling

### CSS Grid e Flexbox
Layout responsive utilizzando:
- CSS Grid per layout principali
- Flexbox per allineamenti
- Media queries per responsività

### Variabili CSS
```css
:root {
  --primary-color: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
}
```

### Classi Utility
- `.btn-primary`, `.btn-secondary` - Stili bottoni
- `.alert-success`, `.alert-error` - Stili alert
- `.modal-overlay`, `.modal-content` - Stili modali

## API Integration

### Configurazione Base URL
```javascript
const API_BASE_URL = 'http://localhost:3001/api';
```

### Esempio Chiamata API
```javascript
const fetchGiftCards = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/gift-cards`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Errore:', error);
  }
};
```

## Funzionalità Principali

### Autenticazione
- Login amministratore
- Persistenza sessione con cookie
- Protezione rotte

### Gift Cards
- Creazione con codice univoco
- Gestione stato (attiva/utilizzata)
- Filtri e ricerca
- Modifica e eliminazione

### Clienti
- Registrazione nuovi clienti
- Modifica informazioni
- Ricerca e filtri
- Eliminazione

### Consenso Online
- Form consenso pubblico
- Generazione PDF automatica
- Download consenso

## Responsive Design

L'applicazione è ottimizzata per:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

### Breakpoints
```css
/* Tablet */
@media (max-width: 1199px) { ... }

/* Mobile */
@media (max-width: 767px) { ... }
```

## Sviluppo

### Aggiungere Nuovi Componenti

1. Crea il file componente in `src/components/`
2. Implementa la logica React
3. Aggiungi gli stili necessari
4. Importa e utilizza in App.jsx

### Modificare Stili

1. Modifica `App.css` per stili globali
2. Usa classi CSS esistenti quando possibile
3. Mantieni consistenza con design system

### Testing

```bash
# Lint del codice
npm run lint

# Build di test
npm run build
```

## Performance

### Ottimizzazioni Implementate
- Lazy loading componenti
- Debouncing per ricerche
- Memoization per calcoli costosi
- Ottimizzazione bundle con Vite

### Best Practices
- Componenti funzionali con hooks
- Prop validation
- Error boundaries
- Gestione errori API

## Troubleshooting

### Errori Comuni

**CORS errors**
- Verifica che il backend sia in esecuzione
- Controlla la configurazione CORS del backend

**Build errors**
- Pulisci node_modules: `rm -rf node_modules && npm install`
- Verifica versioni Node.js compatibili

**Styling issues**
- Controlla l'ordine di importazione CSS
- Verifica specificità selettori CSS

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contribuire

1. Fork del repository
2. Crea un branch per la feature
3. Implementa le modifiche
4. Testa su diversi browser
5. Crea una pull request

## Licenza

MIT License - vedi file LICENSE per dettagli.
