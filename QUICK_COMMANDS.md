# 🚀 TinkStudio - Comandi Rapidi

## 📋 Deployment Iniziale

```bash
# Deployment automatico completo (CONSIGLIATO)
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/cyberpanel-setup.sh
chmod +x cyberpanel-setup.sh
./cyberpanel-setup.sh tuodominio.com admin@tuodominio.com

# Deployment manuale
git clone https://github.com/iRaxe/TattooStudioUtilities.git
cd TattooStudioUtilities
cp .env.production .env
nano .env  # Modifica configurazione
DOMAIN=tuodominio.com EMAIL=admin@tuodominio.com ./deploy.sh
```

## 🐳 Gestione Docker

```bash
# Stato servizi
docker-compose ps

# Avvio servizi
docker-compose up -d

# Stop servizi
docker-compose down

# Riavvio servizi
docker-compose restart

# Ricostruzione completa
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Logs in tempo reale
docker-compose logs -f

# Logs specifico servizio
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Accesso shell container
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d tinkstudio

# Statistiche risorse
docker stats

# Pulizia sistema
docker system prune -f
docker volume prune -f
docker image prune -af
```

## 🔧 Gestione Sistema

```bash
# Stato servizio TinkStudio
sudo systemctl status tinkstudio
sudo systemctl start tinkstudio
sudo systemctl stop tinkstudio
sudo systemctl restart tinkstudio

# Abilitazione auto-start
sudo systemctl enable tinkstudio
sudo systemctl disable tinkstudio

# Logs sistema
sudo journalctl -u tinkstudio.service
sudo journalctl -u tinkstudio.service -f

# Riavvio web server
sudo systemctl restart lsws  # OpenLiteSpeed
sudo systemctl restart nginx # Nginx (se usato)

# Stato firewall
sudo firewall-cmd --list-all
sudo firewall-cmd --reload
```

## 🗄️ Gestione Database

```bash
# Connessione database
docker-compose exec postgres psql -U postgres -d tinkstudio

# Backup database
./backup.sh

# Backup manuale
docker-compose exec postgres pg_dump -U postgres tinkstudio > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T postgres psql -U postgres -d tinkstudio < backup_file.sql

# Verifica connessione
docker-compose exec postgres pg_isready -U postgres

# Statistiche database
docker-compose exec postgres psql -U postgres -d tinkstudio -c "SELECT * FROM pg_stat_activity;"

# Dimensione database
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('tinkstudio'));"
```

## 🔄 Aggiornamenti

```bash
# Aggiornamento automatico
./update.sh

# Aggiornamento manuale
git pull origin master
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Aggiornamento solo frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend

# Aggiornamento solo backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

## 🔍 Monitoraggio e Debug

```bash
# Verifica deployment completo
./verify-deployment.sh tuodominio.com

# Test connettività
curl http://localhost
curl http://localhost/api/health
curl https://tuodominio.com
curl https://tuodominio.com/api/health

# Test porte
telnet localhost 80
telnet localhost 443
telnet localhost 3001

# Verifica SSL
openssl s_client -connect tuodominio.com:443 -servername tuodominio.com

# Monitoraggio risorse
htop
df -h
free -h
iostat 1

# Verifica processi
ps aux | grep docker
ps aux | grep nginx
ps aux | grep postgres

# Network debugging
ss -tlnp | grep -E ':(80|443|3001|5432)'
netstat -tlnp | grep -E ':(80|443|3001|5432)'
```

## 🔒 Sicurezza

```bash
# Cambio password database
nano .env  # Modifica POSTGRES_PASSWORD
docker-compose restart postgres

# Cambio password admin
nano .env  # Modifica ADMIN_PASSWORD
docker-compose restart backend

# Rinnovo certificati SSL
sudo certbot renew
sudo systemctl restart lsws

# Verifica certificati
sudo certbot certificates

# Backup configurazione
sudo tar -czf config_backup_$(date +%Y%m%d).tar.gz .env docker-compose.yml

# Audit sicurezza
sudo lynis audit system
sudo chkrootkit
```

## 📊 Performance

```bash
# Test carico
ab -n 1000 -c 10 http://localhost/
wrk -t12 -c400 -d30s http://localhost/

# Analisi performance database
docker-compose exec postgres psql -U postgres -d tinkstudio -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Cache clearing
docker-compose exec backend npm run cache:clear  # Se implementato

# Ottimizzazione immagini Docker
docker image prune -af
docker builder prune -af

# Compressione logs
sudo journalctl --vacuum-time=7d
sudo journalctl --vacuum-size=100M
```

## 🚨 Troubleshooting

```bash
# Container non si avvia
docker-compose logs [service_name]
docker-compose down && docker-compose up -d

# Porta occupata
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3001

# Spazio disco pieno
df -h
docker system df
docker system prune -af --volumes
sudo du -sh /var/lib/docker

# Memoria insufficiente
free -h
sudo swapon --show
docker stats --no-stream

# Problemi rete
sudo systemctl restart docker
sudo systemctl restart firewalld
ip addr show

# Reset completo (ATTENZIONE: cancella tutto)
docker-compose down -v
docker system prune -af --volumes
docker-compose up -d
```

## 📁 File Importanti

```bash
# Configurazione
nano .env                    # Variabili ambiente
nano docker-compose.yml      # Orchestrazione Docker
nano frontend/nginx.conf     # Configurazione Nginx frontend

# Logs
tail -f /var/log/messages
tail -f /usr/local/lsws/logs/error.log
tail -f /usr/local/lsws/logs/access.log

# Backup
ls -la backups/
ls -la /home/tinkstudio/backups/

# Certificati SSL
sudo ls -la /etc/letsencrypt/live/tuodominio.com/
```

## 🔗 URL Utili

```bash
# Applicazione
echo "Frontend: https://tuodominio.com"
echo "API Health: https://tuodominio.com/api/health"
echo "Admin Panel: https://tuodominio.com/admin"

# Sistema
echo "CyberPanel: https://$(hostname -I | awk '{print $1}'):8090"
echo "Server IP: $(hostname -I | awk '{print $1}')"

# Monitoraggio
echo "Portainer (se installato): http://$(hostname -I | awk '{print $1}'):9000"
```

## 📞 Supporto Rapido

```bash
# Informazioni sistema
uname -a
cat /etc/os-release
docker --version
docker-compose --version

# Stato generale
./verify-deployment.sh tuodominio.com
sudo systemctl status tinkstudio
docker-compose ps
curl -I https://tuodominio.com/api/health

# Raccolta logs per supporto
mkdir -p /tmp/tinkstudio-debug
docker-compose logs > /tmp/tinkstudio-debug/docker-logs.txt
sudo journalctl -u tinkstudio.service > /tmp/tinkstudio-debug/systemd-logs.txt
cp .env /tmp/tinkstudio-debug/env-config.txt  # RIMUOVI PASSWORD PRIMA DI CONDIVIDERE!
sudo tar -czf tinkstudio-debug-$(date +%Y%m%d_%H%M%S).tar.gz /tmp/tinkstudio-debug/
```

---

**💡 Suggerimento**: Salva questo file come bookmark per accesso rapido ai comandi più utilizzati!

**⚠️ Attenzione**: Prima di condividere logs o configurazioni per supporto, rimuovi sempre password e informazioni sensibili!