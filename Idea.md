Obiettivo e flusso

- Solo gli amministratori possono creare una Gift Card in stato “bozza” inserendo esclusivamente l’importo (e opzionalmente scadenza/valuta/note).
- Alla creazione bozza, il sistema genera un link univoco (claim link) a una landing pubblica.
- L’amministratore condivide il link (es. via WhatsApp).
- Il cliente apre il link pubblico, vede importo e scadenza non modificabili, e personalizza la card inserendo:
  - Nome e Cognome obbligatori
  - Gli altri campi già previsti (email, telefono, data di nascita, eventuale dedica/messaggio, consensi se presenti)
- Alla conferma, il sistema finalizza la Gift Card:
  - Crea/aggiorna il record cliente
  - Genera il codice univoco e il QR code
  - Imposta stato “active” (da “draft”) e invalida il token del link (monouso)
  - Mostra al cliente la card finale con opzioni di download (PNG/PDF) e dettagli
- La verifica/uso della card continua dal pannello “Verifica” come già previsto (anti-frode + audit logging).
Stack

- Frontend: React + Vite + Tailwind v4 (plugin ufficiale). react-router-dom. qrcode, html2canvas, jspdf. Font Cinzel. Design glassmorphism con layout boxed 1200px (max-w-6xl mx-auto, px-6 lg:px-8, py-12/16).
- Backend: Node.js + Express + PostgreSQL. Sicurezza: helmet, cors, compression, rate limiting, morgan. Autenticazione admin con JWT (bcrypt). API REST su /api.
- Dev: Proxy Vite per /api→ http://localhost:3001 , .env per API e base URL pubblico, Docker opzionale.
Frontend – Pagine/Componenti

- Shell App:
  - Navbar glass; voci admin visibili solo ad admin (niente generazione card nel menu pubblico).
- AdminPanel:
  - Tab “Genera Card” (solo admin/operator): form minimale con importo (e opz. scadenza/valuta/note). Submit → crea bozza e mostra claim link.
  - Dopo la creazione:
    - Visualizza il link univoco (claim URL) con pulsanti “Copia link” e “Invia via WhatsApp” (wa.me con testo URL-encoded).
    - Mostra lo stato del token (valido/usato/scaduto).
  - Resto del pannello: dashboard KPI, lista gift card, utenti admin, audit, report (come già previsto).
- Pagina pubblica di Claim/Personalizzazione (nuova):
  - Route: /gift/claim/:token
  - Mostra importo/scadenza in sola lettura.
  - Form: Nome, Cognome (obbligatori) + campi già previsti (email, telefono, Data di nascita, dedica, consensi).
  - Validazioni client-side coerenti con l’app attuale.
  - Submit → finalize claim (monouso): se token scaduto/invalidato → messaggio di errore con contatti studio.
  - Success: mostra Gift Card finale (stesso layout gotico), pulsanti “Scarica PNG”/“Scarica PDF”, link “Vai alla verifica”.
- GiftCardVerification:
  - Invariata: input codice → verifica stato (valida/usata/scaduta/non trovata), dettagli e pulsante “Usa”.
- GiftCardGenerator:
  - Riuso per l’anteprima finale e i download della card; rimane disaccoppiato dalla creazione bozza.
Backend – API e DB

- Database
  - Estendere enum gift_card_status con ‘draft’ (oltre a active/used/expired/cancelled).
  - Aggiungere a gift_cards:
    - claim_token UUID UNIQUE
    - claim_token_expires_at TIMESTAMP
    - claimed_at TIMESTAMP
    - claimed_by_customer_id UUID (FK customers, opzionale)
  - Indice su claim_token.
  - Opzionale: tabella gift_card_claims per audit tentativi di claim.
  - Audit logs estesi per creazione bozza, claim riusciti, tentativi falliti/scaduti.
- Endpoints
  - Admin (protetti, JWT + ruolo operator/admin):
    - POST /api/admin/gift-cards/drafts
      - Body: { amount, currency?, expires_at?, notes? }
      - Crea gift card in stato “draft”, genera claim_token e claim_url (usa PUBLIC_BASE_URL), imposta TTL.
      - Response: { draft_id, amount, expires_at, claim_url, claim_token_expires_at }
    - GET /api/admin/gift-cards/drafts/:id
      - Dettaglio bozza e stato token.
  - Pubblici (token-based, rate-limited):
    - GET /api/gift-cards/claim/:token
      - Ritorna dati minimi della bozza (amount, currency, expires_at) se token valido e non usato/scaduto.
    - POST /api/gift-cards/claim/:token/finalize
      - Body: { first_name, last_name, email?, phone?, birth_date?, dedication?, consents? }
      - Transazione atomica:
        - Crea/aggiorna customer
        - Finalizza gift card: genera code univoco, QR payload (link alla verifica), stato “active”
        - Marca token come usato (claimed_at, claimed_by_customer_id)
        - Inserisce audit logs e transazione ‘issue’
      - Response: gift card finale (code, qr_code_data, metadata)
  - Verifica/Uso (come già esistenti)
    - POST /api/gift-cards/verify
    - POST /api/gift-cards/use
- Sicurezza
  - Token monouso con TTL configurabile, rate limit su rotte pubbliche di claim.
  - Il QR della card finale punta agli endpoint di verifica/uso, non alla pagina di claim.
  - Validazioni input rigorose; CORS sicuro; JWT robusto per admin; audit dettagliato.
Variabili ambiente

- Frontend
  - VITE_API_URL (base API)
  - VITE_PUBLIC_BASE_URL (es. https://app.tuodominio.it ) per costruire i claim link
  - Branding studio: nome, indirizzo, telefono, email, link Maps
- Backend
  - DB_* per Postgres
  - JWT_SECRET, BCRYPT_ROUNDS
  - CLAIM_TOKEN_TTL_MINUTES (es. 10080 per 7 giorni)
  - Rate limiting e logging
- Dev
  - Proxy Vite /api→3001, SSL opzionale, Docker Compose per stack end-to-end
UX di condivisione link

- Dopo la creazione bozza nell’AdminPanel:
  - Mostra claim URL
  - Pulsante “Invia via WhatsApp” che apre wa.me con testo precompilato (messaggio+URL encoded)
  - Template messaggio personalizzabile (env o UI) con nome studio e istruzioni brevi
Export e QR

- La card finale ha QR che punta alla pagina/endpoint di verifica (non al claim).
- Download PNG/PDF con html2canvas + jsPDF; opzionale pipeline server-side per PDF di alta qualità (miglioria).
Criteri di accettazione

- Un admin crea una bozza con solo importo e ottiene un link pubblico.
- Il cliente, aprendo il link, può inserire Nome e Cognome e gli altri campi già previsti; non può modificare importo/scadenza.
- Il token di claim è monouso e scade secondo TTL; tentativi invalidi ricevono messaggi chiari.
- La card finale è verificabile/usabile tramite i flussi esistenti; tutti gli eventi sono auditati.
- UI coerente con stile glass e layout boxed 1200px; responsive e accessibile.
Migliorie opzionali

- Firma del cliente anche in fase claim (se serve consenso).
- Captcha/Turnstile sul finalize per ridurre abuso.
- Email di conferma emissione con allegato card e pulsante “Aggiungi al Wallet”.
- PWA, i18n, RBAC avanzato, 2FA admin, job queue per email/report, osservabilità.