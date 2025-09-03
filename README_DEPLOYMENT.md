# 🚀 TinkStudio - Deployment Completo su AlmaLinux + CyberPanel

## 📖 Panoramica

Questa soluzione fornisce un deployment **completamente automatizzato** di TinkStudio su server AlmaLinux con CyberPanel, utilizzando Docker per la containerizzazione e configurazione zero-touch.

## 🎯 Caratteristiche Principali

✅ **Zero Configurazione**: Una volta deployato, tutto funziona immediatamente  
✅ **Docker Containerizzato**: Isolamento completo e gestione semplificata  
✅ **SSL Automatico**: Integrazione con Let's Encrypt via CyberPanel  
✅ **Backup Automatici**: Backup giornalieri del database  
✅ **Monitoraggio**: Health checks e logging completo  
✅ **Sicurezza**: Rate limiting, headers di sicurezza, firewall  
✅ **Performance**: Nginx ottimizzato, caching, compressione  

## 🏗️ Architettura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CyberPanel    │────│  Nginx Reverse   │────│   Docker Stack │
│   (SSL/DNS)     │    │     Proxy        │    │                 │
└─────────────────┘    └──────────────────┘    │  ┌───────────┐  │
                                                │  │ Frontend  │  │
┌─────────────────┐    ┌──────────────────┐    │  │ (React)   │  │
│   Let's Encrypt │────│    Port 443      │    │  └───────────┘  │
│      SSL        │    │   (HTTPS)        │    │                 │
└─────────────────┘    └──────────────────┘    │  ┌───────────┐  │
                                                │  │ Backend   │  │
┌─────────────────┐    ┌──────────────────┐    │  │ (Node.js) │  │
│   Firewall      │────│    Port 80       │    │  └───────────┘  │
│   (AlmaLinux)   │    │   (HTTP)         │    │                 │
└─────────────────┘    └──────────────────┘    │  ┌───────────┐  │
                                                │  │PostgreSQL │  │
                                                │  │ Database  │  │
                                                │  └───────────┘  │
                                                └─────────────────┘
```

## 🚀 Deployment Rapido (Metodo Consigliato)

### Opzione 1: Script Automatico Completo

```bash
# 1. Connettiti al server
ssh root@your-server-ip

# 2. Scarica e esegui lo script
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/cyberpanel-setup.sh
chmod +x cyberpanel-setup.sh
./cyberpanel-setup.sh tuodominio.com admin@tuodominio.com
```

**Fatto! L'applicazione sarà disponibile su `https://tuodominio.com` in 5-10 minuti.**

### Opzione 2: Deployment Manuale Guidato

```bash
# 1. Preparazione
git clone https://github.com/iRaxe/TattooStudioUtilities.git
cd TattooStudioUtilities

# 2. Configurazione
cp .env.production .env
nano .env  # Modifica dominio e password

# 3. Deployment
DOMAIN=tuodominio.com EMAIL=admin@tuodominio.com ./deploy.sh
```

## 📁 File di Deployment Inclusi

| File | Descrizione |
|------|-------------|
| `docker-compose.yml` | Orchestrazione completa dei servizi |
| `frontend/Dockerfile` | Container React + Nginx ottimizzato |
| `backend/Dockerfile` | Container Node.js production-ready |
| `deploy.sh` | Script deployment automatico |
| `cyberpanel-setup.sh` | Setup completo per CyberPanel |
| `cyberpanel-nginx.conf` | Configurazione Nginx ottimizzata |
| `init-db.sql` | Schema database PostgreSQL |
| `.env.production` | Template variabili ambiente |
| `DEPLOYMENT_GUIDE.md` | Guida completa passo-passo |

## 🔧 Configurazione CyberPanel

### Dopo il Deployment Automatico:

1. **Accedi a CyberPanel**: `https://server-ip:8090`
2. **Crea il sito web** per il tuo dominio
3. **Attiva SSL** Let's Encrypt
4. **Importa configurazione Nginx** (già preparata)

### Configurazione Manuale (se necessaria):

```bash
# Copia configurazione Nginx
sudo cp cyberpanel-nginx.conf /usr/local/lsws/conf/vhosts/tuodominio.com/

# Modifica con il tuo dominio
sudo sed -i 's/yourdomain.com/tuodominio.com/g' /usr/local/lsws/conf/vhosts/tuodominio.com/cyberpanel-nginx.conf

# Riavvia servizi
sudo systemctl restart lsws
```

## 🐳 Gestione Docker

### Comandi Essenziali

```bash
# Stato servizi
docker-compose ps

# Logs in tempo reale
docker-compose logs -f

# Riavvio completo
docker-compose restart

# Aggiornamento
./update.sh

# Backup database
./backup.sh

# Pulizia sistema
docker system prune -f
```

### Monitoraggio

```bash
# Health check
curl https://tuodominio.com/api/health

# Statistiche risorse
docker stats

# Spazio utilizzato
docker system df

# Logs sistema
journalctl -u tinkstudio.service
```

## 🔒 Sicurezza

### Configurazioni Automatiche

- ✅ **Rate Limiting**: API protette da abuso
- ✅ **Security Headers**: HSTS, XSS Protection, etc.
- ✅ **Firewall**: Porte necessarie aperte automaticamente
- ✅ **SSL/TLS**: Certificati Let's Encrypt
- ✅ **Database**: Password generate automaticamente
- ✅ **Backup**: Crittografati e automatici

### Hardening Aggiuntivo

```bash
# Disabilita accesso SSH password
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no

# Installa fail2ban
sudo dnf install -y fail2ban
sudo systemctl enable --now fail2ban

# Aggiorna sistema
sudo dnf update -y
```

## 📊 Performance

### Ottimizzazioni Incluse

- **Nginx**: Compressione Gzip, caching statico
- **React**: Build ottimizzato, code splitting
- **Database**: Connessioni pooled, indici ottimizzati
- **Docker**: Multi-stage builds, immagini minimali
- **SSL**: HTTP/2, session caching

### Requisiti Sistema

| Componente | Minimo | Consigliato |
|------------|--------|-------------|
| RAM | 2GB | 4GB+ |
| Storage | 20GB | 50GB+ |
| CPU | 1 core | 2+ cores |
| Bandwidth | 100Mbps | 1Gbps+ |

## 🔄 Aggiornamenti

### Automatico
```bash
./update.sh  # Aggiorna tutto automaticamente
```

### Manuale
```bash
git pull origin master
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🚨 Troubleshooting

### Problemi Comuni

**Container non si avvia:**
```bash
docker-compose logs [service]
docker-compose down && docker-compose up -d
```

**Database non raggiungibile:**
```bash
docker-compose exec postgres pg_isready -U postgres
```

**SSL non funziona:**
```bash
sudo certbot renew
sudo systemctl restart lsws
```

**Spazio disco pieno:**
```bash
docker system prune -af
docker volume prune -f
```

### Log Files

```bash
# Applicazione
docker-compose logs backend
docker-compose logs frontend

# Sistema
sudo journalctl -u tinkstudio.service
sudo tail -f /usr/local/lsws/logs/error.log
```

## 📞 Supporto

- **Repository**: https://github.com/iRaxe/TattooStudioUtilities
- **Issues**: Apri un ticket su GitHub
- **Documentazione**: Consulta `DEPLOYMENT_GUIDE.md`

## 🎉 Risultato Finale

**Dopo il deployment avrai:**

✅ **Applicazione completa** su `https://tuodominio.com`  
✅ **SSL automatico** con Let's Encrypt  
✅ **Backup giornalieri** del database  
✅ **Monitoraggio** e health checks  
✅ **Performance ottimizzate** con caching  
✅ **Sicurezza enterprise-grade**  
✅ **Zero manutenzione** richiesta  

---

**🚀 Pronto per il deployment? Esegui lo script e in 10 minuti avrai tutto funzionante!**

```bash
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/cyberpanel-setup.sh
chmod +x cyberpanel-setup.sh
./cyberpanel-setup.sh tuodominio.com admin@tuodominio.com
```