#!/bin/bash

# TinkStudio Deployment Verification Script
# Verifica che tutti i componenti siano funzionanti

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contatori
PASSED=0
FAILED=0
WARNINGS=0

# Funzioni di utilità
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((PASSED++))
}

log_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
    ((WARNINGS++))
}

log_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((FAILED++))
}

test_command() {
    local cmd="$1"
    local description="$2"
    local expected="$3"
    
    if eval "$cmd" > /dev/null 2>&1; then
        if [ -n "$expected" ]; then
            local result=$(eval "$cmd" 2>/dev/null)
            if [[ "$result" == *"$expected"* ]]; then
                log_success "$description"
            else
                log_warning "$description (risultato inaspettato: $result)"
            fi
        else
            log_success "$description"
        fi
    else
        log_error "$description"
    fi
}

test_http() {
    local url="$1"
    local description="$2"
    local expected_code="${3:-200}"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response_code" = "$expected_code" ]; then
        log_success "$description (HTTP $response_code)"
    elif [ "$response_code" = "000" ]; then
        log_error "$description (Connessione fallita)"
    else
        log_warning "$description (HTTP $response_code, atteso $expected_code)"
    fi
}

test_port() {
    local host="$1"
    local port="$2"
    local description="$3"
    
    if timeout 5 bash -c "</dev/tcp/$host/$port" 2>/dev/null; then
        log_success "$description (porta $port aperta)"
    else
        log_error "$description (porta $port chiusa o non raggiungibile)"
    fi
}

# Parametri
DOMAIN=${1:-"localhost"}
APP_DIR=${2:-"/home/tinkstudio/TinkStudio"}

echo "======================================"
echo "🔍 VERIFICA DEPLOYMENT TINKSTUDIO"
echo "======================================"
echo "Dominio: $DOMAIN"
echo "Directory: $APP_DIR"
echo ""

# Test 1: Verifica sistema base
log_info "1. Verifica sistema base..."
test_command "which docker" "Docker installato"
test_command "which docker-compose" "Docker Compose installato"
test_command "systemctl is-active docker" "Servizio Docker attivo" "active"
test_command "docker --version" "Docker funzionante"
test_command "docker-compose --version" "Docker Compose funzionante"

echo ""

# Test 2: Verifica file di configurazione
log_info "2. Verifica file di configurazione..."
test_command "[ -f '$APP_DIR/docker-compose.yml' ]" "File docker-compose.yml presente"
test_command "[ -f '$APP_DIR/.env' ]" "File .env presente"
test_command "[ -f '$APP_DIR/frontend/Dockerfile' ]" "Dockerfile frontend presente"
test_command "[ -f '$APP_DIR/backend/Dockerfile' ]" "Dockerfile backend presente"
test_command "[ -f '$APP_DIR/init-db.sql' ]" "Script inizializzazione DB presente"

echo ""

# Test 3: Verifica container Docker
log_info "3. Verifica container Docker..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    
    # Verifica che i container siano in esecuzione
    test_command "docker-compose ps | grep -q 'Up'" "Container in esecuzione"
    
    # Verifica container specifici
    test_command "docker-compose ps postgres | grep -q 'Up'" "Container PostgreSQL attivo"
    test_command "docker-compose ps backend | grep -q 'Up'" "Container Backend attivo"
    test_command "docker-compose ps frontend | grep -q 'Up'" "Container Frontend attivo"
    
    # Verifica health checks
    test_command "docker-compose ps | grep -q 'healthy'" "Health checks positivi"
else
    log_error "Directory applicazione non trovata: $APP_DIR"
fi

echo ""

# Test 4: Verifica porte di rete
log_info "4. Verifica porte di rete..."
test_port "localhost" "80" "Porta HTTP (80)"
test_port "localhost" "443" "Porta HTTPS (443)"
test_port "localhost" "3001" "Porta Backend (3001)"
test_port "localhost" "5432" "Porta PostgreSQL (5432)" || log_warning "PostgreSQL potrebbe essere accessibile solo internamente (normale)"

echo ""

# Test 5: Verifica connettività HTTP
log_info "5. Verifica connettività HTTP..."
test_http "http://localhost" "Frontend HTTP locale"
test_http "http://localhost/api/health" "Backend Health Check"

if [ "$DOMAIN" != "localhost" ]; then
    test_http "http://$DOMAIN" "Frontend HTTP dominio"
    test_http "https://$DOMAIN" "Frontend HTTPS dominio"
    test_http "https://$DOMAIN/api/health" "Backend Health Check dominio"
fi

echo ""

# Test 6: Verifica database
log_info "6. Verifica database..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    
    # Test connessione database
    test_command "docker-compose exec -T postgres pg_isready -U postgres" "Connessione PostgreSQL"
    
    # Test tabelle database
    test_command "docker-compose exec -T postgres psql -U postgres -d tinkstudio -c '\\dt' | grep -q 'customers'" "Tabella customers presente"
    test_command "docker-compose exec -T postgres psql -U postgres -d tinkstudio -c '\\dt' | grep -q 'gift_cards'" "Tabella gift_cards presente"
fi

echo ""

# Test 7: Verifica servizi sistema
log_info "7. Verifica servizi sistema..."
test_command "systemctl is-active tinkstudio" "Servizio TinkStudio" "active"
test_command "systemctl is-enabled tinkstudio" "Servizio TinkStudio abilitato" "enabled"
test_command "which nginx || which lsws" "Web server installato"
test_command "systemctl is-active firewalld" "Firewall attivo" "active"

echo ""

# Test 8: Verifica SSL (se dominio specificato)
if [ "$DOMAIN" != "localhost" ] && [[ "$DOMAIN" != *"192.168."* ]] && [[ "$DOMAIN" != *"10."* ]]; then
    log_info "8. Verifica SSL..."
    
    # Test certificato SSL
    if command -v openssl > /dev/null 2>&1; then
        test_command "echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -q 'Verify return code: 0'" "Certificato SSL valido"
    fi
    
    # Test redirect HTTP -> HTTPS
    local redirect_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" 2>/dev/null || echo "000")
    if [ "$redirect_code" = "301" ] || [ "$redirect_code" = "302" ]; then
        log_success "Redirect HTTP -> HTTPS configurato"
    else
        log_warning "Redirect HTTP -> HTTPS non configurato (HTTP $redirect_code)"
    fi
fi

echo ""

# Test 9: Verifica backup
log_info "9. Verifica sistema backup..."
test_command "[ -f '$APP_DIR/backup.sh' ]" "Script backup presente"
test_command "[ -x '$APP_DIR/backup.sh' ]" "Script backup eseguibile"
test_command "crontab -l | grep -q backup" "Cron job backup configurato"
test_command "[ -d '$APP_DIR/backups' ]" "Directory backup presente"

echo ""

# Test 10: Verifica logs
log_info "10. Verifica logs..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    
    # Verifica che non ci siano errori critici nei logs
    local backend_errors=$(docker-compose logs backend 2>/dev/null | grep -i "error" | wc -l)
    local frontend_errors=$(docker-compose logs frontend 2>/dev/null | grep -i "error" | wc -l)
    
    if [ "$backend_errors" -eq 0 ]; then
        log_success "Nessun errore nei logs backend"
    else
        log_warning "$backend_errors errori trovati nei logs backend"
    fi
    
    if [ "$frontend_errors" -eq 0 ]; then
        log_success "Nessun errore nei logs frontend"
    else
        log_warning "$frontend_errors errori trovati nei logs frontend"
    fi
fi

echo ""

# Test 11: Verifica performance
log_info "11. Verifica performance..."

# Test tempo di risposta
if command -v curl > /dev/null 2>&1; then
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "http://localhost/api/health" 2>/dev/null || echo "999")
    local response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < 1" | bc -l 2>/dev/null || echo 0) )); then
        log_success "Tempo di risposta API: ${response_time_ms}ms"
    elif (( $(echo "$response_time < 3" | bc -l 2>/dev/null || echo 0) )); then
        log_warning "Tempo di risposta API lento: ${response_time_ms}ms"
    else
        log_error "Tempo di risposta API troppo lento: ${response_time_ms}ms"
    fi
fi

# Test utilizzo risorse
if command -v docker > /dev/null 2>&1; then
    local memory_usage=$(docker stats --no-stream --format "table {{.MemPerc}}" 2>/dev/null | tail -n +2 | head -1 | sed 's/%//' || echo "0")
    if [ "$memory_usage" != "0" ] && (( $(echo "$memory_usage < 80" | bc -l 2>/dev/null || echo 1) )); then
        log_success "Utilizzo memoria Docker: ${memory_usage}%"
    elif [ "$memory_usage" != "0" ]; then
        log_warning "Utilizzo memoria Docker alto: ${memory_usage}%"
    fi
fi

echo ""

# Riepilogo finale
echo "======================================"
echo "📊 RIEPILOGO VERIFICA"
echo "======================================"
echo -e "${GREEN}✓ Test superati: $PASSED${NC}"
echo -e "${YELLOW}⚠ Avvisi: $WARNINGS${NC}"
echo -e "${RED}✗ Test falliti: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 DEPLOYMENT PERFETTO! Tutti i test superati.${NC}"
        exit 0
    else
        echo -e "${YELLOW}✅ DEPLOYMENT OK con alcuni avvisi. Controlla i warning sopra.${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ DEPLOYMENT CON PROBLEMI. Risolvi gli errori sopra.${NC}"
    echo ""
    echo "🔧 AZIONI SUGGERITE:"
    echo "   1. Controlla i logs: docker-compose logs"
    echo "   2. Riavvia i servizi: docker-compose restart"
    echo "   3. Verifica la configurazione: cat .env"
    echo "   4. Controlla lo spazio disco: df -h"
    echo "   5. Verifica le porte: netstat -tlnp"
    exit 1
fi