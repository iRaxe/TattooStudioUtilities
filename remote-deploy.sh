#!/bin/bash

# TinkStudio Remote Deployment Script
# Questo script può essere eseguito su qualsiasi server AlmaLinux per installare TinkStudio

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzioni di utilità
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Banner
echo "======================================"
echo "🚀 TINKSTUDIO REMOTE DEPLOYMENT"
echo "======================================"
echo "Questo script installerà automaticamente"
echo "TinkStudio su questo server AlmaLinux"
echo ""

echo ""

# Funzione per mostrare l'uso
show_usage() {
    echo "❌ Parametri o opzioni non valide!"
    echo ""
    echo "Uso: $0 <domain> <email> [github_repo] [--yes]"
    echo ""
    echo "Opzioni:"
    echo "  --yes, -y    Salta la richiesta di conferma e procede con l'installazione."
    echo ""
    echo "Esempi:"
    echo "  $0 miodominio.com admin@miodominio.com"
    echo "  $0 test.example.com info@example.com --yes"
    exit 1
}

# Parsing degli argomenti
PARAMS=()
AUTO_YES=false
while (( "$#" )); do
  case "$1" in
    -y|--yes)
      AUTO_YES=true
      shift
      ;;
    -*|--*=)
      show_usage
      ;;
    *)
      PARAMS+=("$1")
      shift
      ;;
  esac
done

# Ripristina parametri posizionali
set -- "${PARAMS[@]}"

# Verifica parametri posizionali
if [ ${#PARAMS[@]} -lt 2 ]; then
    show_usage
fi

DOMAIN=${PARAMS[0]}
EMAIL=${PARAMS[1]}
GITHUB_REPO=${PARAMS[2]:-"https://github.com/iRaxe/TattooStudioUtilities.git"}

log_info "Configurazione:"
echo "  🌐 Dominio: $DOMAIN"
echo "  📧 Email: $EMAIL"
echo "  📦 Repository: $GITHUB_REPO"
echo ""

# Conferma utente (se non viene passato --yes)
if [ "$AUTO_YES" = false ]; then
    read -p "Continuare con l'installazione? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "Installazione annullata dall'utente"
        exit 0
    fi
fi

log_info "Inizio installazione automatica..."

# Verifica se siamo root
if [ "$EUID" -ne 0 ]; then
    log_error "Questo script deve essere eseguito come root"
    log_info "Esegui: sudo $0 $@"
    exit 1
fi

# Verifica sistema operativo
if ! grep -q "AlmaLinux\|CentOS\|Rocky" /etc/os-release; then
    log_warning "Sistema operativo non testato. Continuando comunque..."
fi

# 1. Aggiornamento sistema
log_info "1/10 Aggiornamento sistema..."
dnf update -y > /dev/null 2>&1
log_success "Sistema aggiornato"

# 2. Installazione dipendenze base
log_info "2/10 Installazione dipendenze base..."
dnf install -y git curl wget htop nano firewalld bc > /dev/null 2>&1
log_success "Dipendenze base installate"

# 3. Installazione Docker
log_info "3/10 Installazione Docker..."
if ! command -v docker > /dev/null 2>&1; then
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo > /dev/null 2>&1
    dnf install -y docker-ce docker-ce-cli containerd.io > /dev/null 2>&1
    systemctl enable --now docker > /dev/null 2>&1
    log_success "Docker installato e avviato"
else
    log_success "Docker già installato"
fi

# 4. Installazione Docker Compose
log_info "4/10 Installazione Docker Compose..."
if docker compose version > /dev/null 2>&1; then
    log_success "Docker Compose (plugin) già installato"
elif command -v docker-compose > /dev/null 2>&1; then
    log_success "Docker Compose (standalone) già installato"
else
    log_info "Docker Compose non trovato. Tentativo di installazione..."
    # Metodo 1: Prova a installare il plugin DNF (preferito)
    dnf install -y docker-compose-plugin > /dev/null 2>&1
    if docker compose version > /dev/null 2>&1; then
        log_success "Docker Compose (plugin) installato con successo."
    else
        # Metodo 2: Fallback a download manuale (standalone)
        log_warning "Installazione del plugin fallita. Fallback al download manuale."
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
        if [ -z "$DOCKER_COMPOSE_VERSION" ]; then
            log_warning "Impossibile ottenere l'ultima versione, uso v2.24.6 come fallback."
            DOCKER_COMPOSE_VERSION="v2.24.6"
        fi
        curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose > /dev/null 2>&1
        chmod +x /usr/local/bin/docker-compose
        if command -v docker-compose > /dev/null 2>&1; then
            log_success "Docker Compose (standalone) installato (versione $DOCKER_COMPOSE_VERSION)"
        else
            log_error "Installazione di Docker Compose fallita."
            exit 1
        fi
    fi
fi

# 5. Creazione utente applicazione
log_info "5/10 Creazione utente applicazione..."
APP_USER="tinkstudio"
if ! id "$APP_USER" > /dev/null 2>&1; then
    useradd -m -s /bin/bash $APP_USER
    usermod -aG wheel $APP_USER
    usermod -aG docker $APP_USER
    log_success "Utente $APP_USER creato"
else
    usermod -aG docker $APP_USER > /dev/null 2>&1
    log_success "Utente $APP_USER già esistente (aggiornato)"
fi

# 6. Download codice sorgente
log_info "6/10 Download codice sorgente..."
APP_DIR="/home/$APP_USER/TinkStudio"
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

sudo -u $APP_USER bash -c "
    # Ridefinisco le funzioni di logging nel subshell
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
    
    log_info() {
        echo -e \"\${BLUE}[INFO]\${NC} \$1\"
    }
    
    log_success() {
        echo -e \"\${GREEN}[SUCCESS]\${NC} \$1\"
    }
    
    log_error() {
        echo -e \"\${RED}[ERROR]\${NC} \$1\"
    }
    
    cd $APP_DIR
    if [ -d '.git' ]; then
        log_info 'Aggiornamento repository esistente...'
        git pull origin master > /dev/null 2>&1
    else
        # Prova prima con HTTPS pubblico (senza autenticazione)
        log_info 'Download da repository pubblico...'
        GIT_TERMINAL_PROMPT=0 git clone $GITHUB_REPO . 2>/dev/null
        
        if [ \$? -ne 0 ]; then
            log_info 'Tentativo alternativo con wget...'
            wget -q https://github.com/iRaxe/TattooStudioUtilities/archive/refs/heads/master.zip -O tinkstudio.zip
            if [ \$? -eq 0 ]; then
                unzip -q tinkstudio.zip
                mv TattooStudioUtilities-master/* . 2>/dev/null || true
                mv TattooStudioUtilities-master/.[^.]* . 2>/dev/null || true
                rm -rf TattooStudioUtilities-master tinkstudio.zip
                log_success 'Codice sorgente scaricato via ZIP'
            else
                log_error 'Impossibile scaricare il codice sorgente'
                log_info 'Verifica che il repository sia pubblico: $GITHUB_REPO'
                exit 1
            fi
        else
            log_success 'Codice sorgente scaricato via Git'
        fi
    fi
    
    # Verifica che i file essenziali siano presenti
    log_info 'Verifica file essenziali...'
    REQUIRED_FILES=('docker-compose.yml' 'frontend/Dockerfile' 'backend/Dockerfile' 'init-db.sql')
    MISSING_FILES=()
    
    for file in \"\${REQUIRED_FILES[@]}\"; do
        if [ ! -f \"\$file\" ]; then
            MISSING_FILES+=(\"\$file\")
        fi
    done
    
    if [ \${#MISSING_FILES[@]} -gt 0 ]; then
        log_error 'File mancanti dopo il download:'
        for file in \"\${MISSING_FILES[@]}\"; do
            echo \"  - \$file\"
        done
        log_info 'Tentativo di download diretto dei file mancanti...'
        
        for file in \"\${MISSING_FILES[@]}\"; do
            mkdir -p \"\$(dirname \"\$file\")\"
            curl -s -o \"\$file\" \"https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/\$file\"
            if [ \$? -eq 0 ] && [ -s \"\$file\" ]; then
                log_success \"Scaricato: \$file\"
            else
                log_error \"Impossibile scaricare: \$file\"
            fi
        done
    else
        log_success 'Tutti i file essenziali sono presenti'
    fi
"
log_success "Codice sorgente scaricato"

# 7. Configurazione ambiente
log_info "7/10 Configurazione ambiente..."

# Eseguo la configurazione in un subshell come utente corretto
if sudo -u $APP_USER bash -c '
    APP_DIR="$1"
    DOMAIN="$2"

    cd "$APP_DIR" || { echo "ERRORE: Impossibile accedere a $APP_DIR" >&2; exit 1; }

    # Copia template .env se non esiste
    if [ ! -f ".env" ] && [ -f ".env.production" ]; then
        cp .env.production .env
    elif [ ! -f ".env" ]; then
        # Crea un .env di base se nessun template è disponibile
        cat > .env << "EOT"
# Database Configuration
POSTGRES_DB=tinkstudio
POSTGRES_USER=postgres
POSTGRES_PASSWORD=GENERATED_PASSWORD
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
# Application Configuration
NODE_ENV=production
PORT=3001
JWT_SECRET=GENERATED_JWT_SECRET
ADMIN_USERNAME=admin
ADMIN_PASSWORD=GENERATED_ADMIN_PASSWORD
GIFT_CARD_VALIDITY_MONTHS=12
# URLs
PUBLIC_BASE_URL=https://DOMAIN_PLACEHOLDER
FRONTEND_URL=https://DOMAIN_PLACEHOLDER
BACKEND_URL=https://DOMAIN_PLACEHOLDER
EOT
    fi

    # Genera credenziali sicure (solo alfanumeriche)
    POSTGRES_PASS=$(head /dev/urandom | tr -dc "A-Za-z0-9" | head -c 25)
    JWT_SECRET=$(head /dev/urandom | tr -dc "A-Za-z0-9" | head -c 50)
    ADMIN_PASS=$(head /dev/urandom | tr -dc "A-Za-z0-9" | head -c 12)

    # Sostituisce i placeholder nel file .env
    sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" .env
    sed -i "s|GENERATED_PASSWORD|$POSTGRES_PASS|g" .env
    sed -i "s|GENERATED_JWT_SECRET|$JWT_SECRET|g" .env
    sed -i "s|GENERATED_ADMIN_PASSWORD|$ADMIN_PASS|g" .env

    # Salva le credenziali in un file sicuro
    cat > .credentials << EOT
# TinkStudio - Credenziali Generate Automaticamente
# Data: $(date)
# Dominio: $DOMAIN

POSTGRES_PASSWORD=$POSTGRES_PASS
JWT_SECRET=$JWT_SECRET
ADMIN_PASSWORD=$ADMIN_PASS

# URL Accesso
FRONTEND_URL=https://$DOMAIN
ADMIN_LOGIN=https://$DOMAIN/admin
API_HEALTH=https://$DOMAIN/api/health
EOT
    chmod 600 .credentials

    # Mostra le credenziali generate
    echo "🔐 CREDENZIALI GENERATE:"
    echo "Database Password: $POSTGRES_PASS"
    echo "JWT Secret: $JWT_SECRET"
    echo "Admin Password: $ADMIN_PASS"
' -- "$APP_DIR" "$DOMAIN"; then
    log_success "Ambiente configurato con credenziali sicure"
else
    log_error "Configurazione dell'ambiente fallita. Controllare i log."
    exit 1
fi
# 8. Configurazione firewall
log_info "8/10 Configurazione firewall..."
systemctl enable --now firewalld > /dev/null 2>&1
firewall-cmd --permanent --add-port=80/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=443/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=3001/tcp > /dev/null 2>&1
firewall-cmd --permanent --add-port=8090/tcp > /dev/null 2>&1  # CyberPanel se presente
firewall-cmd --reload > /dev/null 2>&1
log_success "Firewall configurato"

# 9. Avvio applicazione Docker
log_info "9/10 Avvio applicazione Docker..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    
    # Determina comando docker compose con PATH esteso
    export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
    
    if command -v docker-compose > /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker-compose'
        echo "[DEBUG] Usando docker-compose: $(which docker-compose)"
    elif docker compose version > /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker compose'
        echo "[DEBUG] Usando docker compose (plugin)"
    else
        echo "[ERROR] Nessun comando docker-compose trovato!"
        echo "[DEBUG] PATH: $PATH"
        echo "[DEBUG] Comandi disponibili:"
        ls -la /usr/local/bin/docker* 2>/dev/null || echo "Nessun docker in /usr/local/bin"
        ls -la /usr/bin/docker* 2>/dev/null || echo "Nessun docker in /usr/bin"
        exit 1
    fi
    
    # Ferma eventuali container esistenti
    $DOCKER_COMPOSE_CMD down > /dev/null 2>&1 || true
    
    # Pulisci immagini vecchie
    docker system prune -f > /dev/null 2>&1 || true
    
    # Avvia servizi
    $DOCKER_COMPOSE_CMD pull > /dev/null 2>&1 || true
    $DOCKER_COMPOSE_CMD build --no-cache > /dev/null 2>&1
    $DOCKER_COMPOSE_CMD up -d
    
    if [ $? -ne 0 ]; then
        echo '[ERROR] Errore nell\'avvio dei container Docker'
        exit 1
    fi
"

# Attendi che i servizi si avviino
log_info "Attesa avvio servizi (30 secondi)..."
sleep 30

# Verifica stato servizi
STATUS_OK=true
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    # Determina comando docker compose con PATH esteso
    export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"
    
    if command -v docker-compose > /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker-compose'
    elif docker compose version > /dev/null 2>&1; then
        DOCKER_COMPOSE_CMD='docker compose'
    else
        echo "[ERROR] Nessun comando docker-compose trovato per verifica!"
        exit 1
    fi
    
    if ! $DOCKER_COMPOSE_CMD ps | grep -q 'Up'; then
        echo 'ERRORE: Container non avviati correttamente'
        $DOCKER_COMPOSE_CMD ps
        exit 1
    fi
" || STATUS_OK=false

if [ "$STATUS_OK" = true ]; then
    log_success "Servizi Docker avviati correttamente"
else
    log_error "Problemi nell'avvio dei servizi Docker"
    exit 1
fi

# 10. Configurazione servizio systemd
log_info "10/10 Configurazione servizio systemd..."
cat > /etc/systemd/system/tinkstudio.service << EOF
[Unit]
Description=TinkStudio Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/bin/bash -c 'cd $APP_DIR && (command -v docker-compose > /dev/null 2>&1 && docker-compose up -d || docker compose up -d)'
ExecStop=/bin/bash -c 'cd $APP_DIR && (command -v docker-compose > /dev/null 2>&1 && docker-compose down || docker compose down)'
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tinkstudio.service > /dev/null 2>&1
systemctl start tinkstudio.service > /dev/null 2>&1
log_success "Servizio systemd configurato e avviato"

# Configurazione backup automatico
log_info "Configurazione backup automatico..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    
    # Crea script backup se non esiste
    if [ ! -f 'backup.sh' ]; then
        cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"backups\"
mkdir -p \$BACKUP_DIR
BACKUP_FILE=\"\$BACKUP_DIR/backup_\$(date +%Y%m%d_%H%M%S).sql\"
docker-compose exec -T postgres pg_dump -U postgres tinkstudio > \$BACKUP_FILE
gzip \$BACKUP_FILE
echo \"Backup creato: \$BACKUP_FILE.gz\"
# Mantieni solo gli ultimi 7 backup
find \$BACKUP_DIR -name '*.sql.gz' -mtime +7 -delete
EOF
    fi
    
    chmod +x backup.sh
    
    # Aggiungi cron job per backup giornaliero alle 2:00
    (crontab -l 2>/dev/null | grep -v 'backup.sh'; echo '0 2 * * * cd $APP_DIR && ./backup.sh') | crontab -
"
log_success "Backup automatico configurato (giornaliero alle 2:00)"

# Test finale connettività
log_info "Test connettività finale..."
sleep 10

if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
    log_success "✅ Backend raggiungibile"
else
    log_warning "⚠️ Backend non ancora raggiungibile (potrebbe servire più tempo)"
fi

if curl -f -s http://localhost > /dev/null 2>&1; then
    log_success "✅ Frontend raggiungibile"
else
    log_warning "⚠️ Frontend non ancora raggiungibile (potrebbe servire più tempo)"
fi

# Mostra riepilogo finale
echo ""
echo "======================================"
echo "🎉 INSTALLAZIONE COMPLETATA! 🎉"
echo "======================================"
echo ""
echo "📋 INFORMAZIONI ACCESSO:"
echo "   🌐 Sito Web: http://$DOMAIN"
echo "   🔒 HTTPS: https://$DOMAIN (configura SSL)"
echo "   📊 API Health: http://$DOMAIN/api/health"
echo "   🖥️ Server IP: $(hostname -I | awk '{print $1}')"
echo ""
echo "🔑 CREDENZIALI (salvate in $APP_DIR/.credentials):"
sudo -u $APP_USER cat $APP_DIR/.credentials | grep -E '(ADMIN_PASSWORD|POSTGRES_PASSWORD)'
echo ""
echo "📝 PROSSIMI PASSI:"
echo "   1. Configura il DNS per puntare $DOMAIN a questo server"
echo "   2. Installa CyberPanel (opzionale) per gestione SSL automatica"
echo "   3. Configura SSL/HTTPS per il dominio"
echo "   4. Testa l'applicazione: http://$DOMAIN"
echo ""
echo "🛠️ COMANDI UTILI:"
echo "   📊 Stato: sudo systemctl status tinkstudio"
echo "   📋 Logs: sudo -u $APP_USER bash -c 'cd $APP_DIR && (command -v docker-compose > /dev/null 2>&1 && docker-compose logs -f || docker compose logs -f)'"
echo "   🔄 Riavvio: sudo systemctl restart tinkstudio"
echo "   💾 Backup: sudo -u $APP_USER $APP_DIR/backup.sh"
echo "   🔍 Verifica: $APP_DIR/verify-deployment.sh $DOMAIN"
echo ""
echo "📞 SUPPORTO:"
echo "   📁 Directory app: $APP_DIR"
echo "   📄 Configurazione: $APP_DIR/.env"
echo "   🔐 Credenziali: $APP_DIR/.credentials"
echo "   📊 Stato Docker: sudo -u $APP_USER bash -c 'cd $APP_DIR && (command -v docker-compose > /dev/null 2>&1 && docker-compose ps || docker compose ps)'"
echo ""
log_success "🚀 TinkStudio è ora installato e funzionante!"
echo "⚠️  IMPORTANTE: Configura SSL/HTTPS per la sicurezza in produzione!"

exit 0