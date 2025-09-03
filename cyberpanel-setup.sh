#!/bin/bash

# TinkStudio CyberPanel Auto-Setup Script
# Questo script configura automaticamente TinkStudio su CyberPanel

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

# Verifica parametri
if [ $# -lt 2 ]; then
    echo "Uso: $0 <domain> <email> [cyberpanel_user] [cyberpanel_pass]"
    echo "Esempio: $0 miodominio.com admin@miodominio.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
CYBERPANEL_USER=${3:-admin}
CYBERPANEL_PASS=${4:-""}

# Configurazioni
APP_USER="tinkstudio"
APP_DIR="/home/$APP_USER/TinkStudio"
NGINX_CONF_DIR="/usr/local/lsws/conf/vhosts/$DOMAIN"
SSL_DIR="/etc/letsencrypt/live/$DOMAIN"

log_info "Inizializzazione setup TinkStudio per $DOMAIN"

# Verifica se siamo root
if [ "$EUID" -ne 0 ]; then
    log_error "Questo script deve essere eseguito come root"
    exit 1
fi

# Verifica se CyberPanel è installato
if ! command -v cyberpanel > /dev/null 2>&1; then
    log_error "CyberPanel non trovato. Installalo prima di continuare."
    exit 1
fi

log_success "CyberPanel trovato"

# Installa dipendenze
log_info "Installazione dipendenze..."
dnf update -y
dnf install -y git curl wget htop nano firewalld

# Installa Docker se non presente
if ! command -v docker > /dev/null 2>&1; then
    log_info "Installazione Docker..."
    dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    dnf install -y docker-ce docker-ce-cli containerd.io
    systemctl enable --now docker
    log_success "Docker installato"
else
    log_success "Docker già installato"
fi

# Installa Docker Compose se non presente
if ! command -v docker-compose > /dev/null 2>&1; then
    log_info "Installazione Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    log_success "Docker Compose installato"
else
    log_success "Docker Compose già installato"
fi

# Crea utente applicazione
if ! id "$APP_USER" > /dev/null 2>&1; then
    log_info "Creazione utente $APP_USER..."
    useradd -m -s /bin/bash $APP_USER
    usermod -aG wheel $APP_USER
    usermod -aG docker $APP_USER
    log_success "Utente $APP_USER creato"
else
    log_success "Utente $APP_USER già esistente"
fi

# Crea directory applicazione
log_info "Preparazione directory applicazione..."
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# Clona repository come utente applicazione
log_info "Download codice sorgente..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    if [ -d '.git' ]; then
        git pull origin master
    else
        git clone https://github.com/iRaxe/TattooStudioUtilities.git .
    fi
"

log_success "Codice sorgente scaricato"

# Configura ambiente
log_info "Configurazione ambiente..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    cp .env.production .env
    
    # Genera password sicure
    POSTGRES_PASS=\$(openssl rand -base64 32)
    JWT_SECRET=\$(openssl rand -base64 64)
    ADMIN_PASS=\$(openssl rand -base64 16)
    
    # Aggiorna configurazione
    sed -i 's/yourdomain.com/$DOMAIN/g' .env
    sed -i 's/admin@yourdomain.com/$EMAIL/g' .env
    sed -i \"s/password_molto_sicura_qui/\$POSTGRES_PASS/g\" .env
    sed -i \"s/jwt_secret_molto_lungo_e_casuale_qui/\$JWT_SECRET/g\" .env
    sed -i \"s/password_admin_sicura_qui/\$ADMIN_PASS/g\" .env
    
    echo '=== CREDENZIALI GENERATE ==='
    echo \"Database Password: \$POSTGRES_PASS\"
    echo \"JWT Secret: \$JWT_SECRET\"
    echo \"Admin Password: \$ADMIN_PASS\"
    echo '============================'
    
    # Salva credenziali in file sicuro
    echo \"POSTGRES_PASSWORD=\$POSTGRES_PASS\" > .credentials
    echo \"JWT_SECRET=\$JWT_SECRET\" >> .credentials
    echo \"ADMIN_PASSWORD=\$ADMIN_PASS\" >> .credentials
    chmod 600 .credentials
"

log_success "Ambiente configurato"

# Configura firewall
log_info "Configurazione firewall..."
systemctl enable --now firewalld
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --permanent --add-port=8090/tcp  # CyberPanel
firewall-cmd --reload

log_success "Firewall configurato"

# Crea sito web in CyberPanel (se possibile via CLI)
log_info "Configurazione sito web in CyberPanel..."

# Crea directory vhost se non esiste
mkdir -p $NGINX_CONF_DIR

# Copia configurazione Nginx
log_info "Configurazione Nginx..."
cp $APP_DIR/cyberpanel-nginx.conf $NGINX_CONF_DIR/
sed -i "s/yourdomain.com/$DOMAIN/g" $NGINX_CONF_DIR/cyberpanel-nginx.conf

log_success "Configurazione Nginx copiata"

# Avvia applicazione Docker
log_info "Avvio applicazione Docker..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    docker-compose down 2>/dev/null || true
    docker-compose pull
    docker-compose build --no-cache
    docker-compose up -d
"

# Attendi che i servizi si avviino
log_info "Attesa avvio servizi..."
sleep 30

# Verifica stato servizi
log_info "Verifica stato servizi..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    docker-compose ps
"

# Test connettività
log_info "Test connettività..."
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    log_success "Backend raggiungibile"
else
    log_warning "Backend non raggiungibile, controlla i logs"
fi

if curl -f -s http://localhost:80 > /dev/null; then
    log_success "Frontend raggiungibile"
else
    log_warning "Frontend non raggiungibile, controlla i logs"
fi

# Configura servizio systemd
log_info "Configurazione servizio systemd..."
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
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable tinkstudio.service
systemctl start tinkstudio.service

log_success "Servizio systemd configurato"

# Configura backup automatico
log_info "Configurazione backup automatico..."
sudo -u $APP_USER bash -c "
    cd $APP_DIR
    chmod +x backup.sh
    
    # Aggiungi cron job per backup giornaliero
    (crontab -l 2>/dev/null; echo '0 2 * * * cd $APP_DIR && ./backup.sh') | crontab -
"

log_success "Backup automatico configurato"

# Genera certificato SSL self-signed temporaneo
log_info "Generazione certificato SSL temporaneo..."
mkdir -p /etc/ssl/tinkstudio
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/tinkstudio/$DOMAIN.key \
    -out /etc/ssl/tinkstudio/$DOMAIN.crt \
    -subj "/C=IT/ST=Italy/L=City/O=TinkStudio/CN=$DOMAIN"

log_success "Certificato SSL temporaneo generato"

# Riavvia OpenLiteSpeed
log_info "Riavvio OpenLiteSpeed..."
systemctl restart lsws

log_success "OpenLiteSpeed riavviato"

# Mostra riepilogo
echo ""
echo "======================================"
echo "🎉 INSTALLAZIONE COMPLETATA! 🎉"
echo "======================================"
echo ""
echo "📋 INFORMAZIONI ACCESSO:"
echo "   🌐 Sito Web: http://$DOMAIN"
echo "   🔒 HTTPS: https://$DOMAIN (certificato temporaneo)"
echo "   🔧 CyberPanel: https://$(hostname -I | awk '{print $1}'):8090"
echo "   📊 API Health: http://$DOMAIN/api/health"
echo ""
echo "🔑 CREDENZIALI:"
echo "   📁 File credenziali: $APP_DIR/.credentials"
echo "   👤 Utente applicazione: $APP_USER"
echo ""
echo "📝 PROSSIMI PASSI:"
echo "   1. Accedi a CyberPanel e crea il sito web '$DOMAIN'"
echo "   2. Configura SSL Let's Encrypt per '$DOMAIN'"
echo "   3. Importa la configurazione Nginx da: $NGINX_CONF_DIR/cyberpanel-nginx.conf"
echo "   4. Testa l'applicazione su: http://$DOMAIN"
echo ""
echo "🛠️ COMANDI UTILI:"
echo "   📊 Stato servizi: sudo -u $APP_USER docker-compose -f $APP_DIR/docker-compose.yml ps"
echo "   📋 Logs: sudo -u $APP_USER docker-compose -f $APP_DIR/docker-compose.yml logs -f"
echo "   🔄 Riavvio: sudo systemctl restart tinkstudio"
echo "   💾 Backup: sudo -u $APP_USER $APP_DIR/backup.sh"
echo ""
echo "⚠️  IMPORTANTE: Cambia le password di default per sicurezza!"
echo "   File configurazione: $APP_DIR/.env"
echo "   Credenziali generate: $APP_DIR/.credentials"
echo ""

log_success "Setup completato con successo!"

# Mostra credenziali generate
if [ -f "$APP_DIR/.credentials" ]; then
    echo "🔐 CREDENZIALI GENERATE:"
    sudo -u $APP_USER cat $APP_DIR/.credentials
    echo ""
fi

exit 0