# 🚀 TinkStudio - Guida Completa al Deployment su AlmaLinux con CyberPanel

## 📋 Prerequisiti

- Server AlmaLinux 8/9
- CyberPanel installato e configurato
- Dominio configurato in CyberPanel
- Accesso SSH al server
- Almeno 2GB RAM e 20GB spazio disco

## 🛠️ Installazione Automatica

### Passo 1: Preparazione del Server

```bash
# Connettiti al server via SSH
ssh root@your-server-ip

# Aggiorna il sistema
sudo dnf update -y

# Installa git se non presente
sudo dnf install -y git curl wget
```

### Passo 2: Creazione Utente e Directory

```bash
# Crea utente dedicato per l'applicazione
sudo useradd -m -s /bin/bash tinkstudio
sudo usermod -aG wheel tinkstudio

# Passa all'utente tinkstudio
sudo su - tinkstudio

# Clona il repository
git clone https://github.com/iRaxe/TattooStudioUtilities.git
cd TattooStudioUtilities
```

### Passo 3: Configurazione Ambiente

```bash
# Copia e modifica il file di configurazione
cp .env.production .env
nano .env
```

**Modifica le seguenti variabili in `.env`:**

```env
# Cambia il dominio
PUBLIC_BASE_URL=https://tuodominio.com
FRONTEND_URL=https://tuodominio.com

# Genera password sicure
POSTGRES_PASSWORD=password_molto_sicura_qui
JWT_SECRET=jwt_secret_molto_lungo_e_casuale_qui
ADMIN_PASSWORD=password_admin_sicura_qui

# Configura email (opzionale)
SMTP_HOST=smtp.gmail.com
SMTP_USER=tua-email@gmail.com
SMTP_PASS=password-app-gmail
```

### Passo 4: Esecuzione Script di Deployment

```bash
# Rendi eseguibile lo script
chmod +x deploy.sh

# Esegui il deployment
DOMAIN=tuodominio.com EMAIL=admin@tuodominio.com ./deploy.sh
```

## 🔧 Configurazione CyberPanel

### Passo 1: Configurazione del Sito Web

1. **Accedi a CyberPanel** (https://server-ip:8090)
2. **Websites → Create Website**
   - Domain: `tuodominio.com`
   - Email: `admin@tuodominio.com`
   - Package: Seleziona un package appropriato
3. **Crea il sito web**

### Passo 2: Configurazione SSL

1. **SSL → Manage SSL**
2. Seleziona il tuo dominio
3. **Issue SSL** (Let's Encrypt)
4. Attendi il completamento

### Passo 3: Configurazione Nginx

```bash
# Copia la configurazione Nginx
sudo cp /home/tinkstudio/TattooStudioUtilities/cyberpanel-nginx.conf /usr/local/lsws/conf/vhosts/tuodominio.com/

# Modifica il file con il tuo dominio
sudo sed -i 's/yourdomain.com/tuodominio.com/g' /usr/local/lsws/conf/vhosts/tuodominio.com/cyberpanel-nginx.conf

# Riavvia OpenLiteSpeed
sudo systemctl restart lsws
```

### Passo 4: Configurazione Firewall

```bash
# Apri le porte necessarie
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

## 🐳 Gestione Docker

### Comandi Utili

```bash
# Visualizza stato dei container
docker-compose ps

# Visualizza logs
docker-compose logs -f

# Riavvia tutti i servizi
docker-compose restart

# Aggiorna l'applicazione
./update.sh

# Backup del database
./backup.sh
```

### Monitoraggio

```bash
# Controlla salute dei servizi
curl https://tuodominio.com/api/health

# Statistiche Docker
docker stats

# Spazio disco utilizzato
docker system df
```

## 🔒 Sicurezza

### Configurazioni Obbligatorie

1. **Cambia le password di default**
   ```bash
   nano .env
   # Modifica ADMIN_PASSWORD, POSTGRES_PASSWORD, JWT_SECRET
   docker-compose restart
   ```

2. **Configura backup automatici**
   ```bash
   # I backup sono già configurati via cron
   crontab -l  # Verifica
   ```

3. **Aggiorna regolarmente**
   ```bash
   # Esegui settimanalmente
   ./update.sh
   ```

### Hardening Aggiuntivo

```bash
# Disabilita accesso SSH con password (usa solo chiavi)
sudo nano /etc/ssh/sshd_config
# PasswordAuthentication no
sudo systemctl restart sshd

# Configura fail2ban
sudo dnf install -y fail2ban
sudo systemctl enable --now fail2ban
```

## 📊 Monitoraggio e Manutenzione

### Log Files

```bash
# Logs applicazione
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Logs sistema
sudo journalctl -u tinkstudio.service
```

### Performance Monitoring

```bash
# Utilizzo risorse
htop
df -h
free -h

# Connessioni database
docker-compose exec postgres psql -U postgres -d tinkstudio -c "SELECT * FROM pg_stat_activity;"
```

### Backup e Restore

```bash
# Backup manuale
./backup.sh

# Restore da backup
docker-compose exec postgres psql -U postgres -d tinkstudio < backups/backup_YYYYMMDD_HHMMSS.sql

# Backup completo (inclusi volumi)
docker-compose down
sudo tar -czf tinkstudio_full_backup_$(date +%Y%m%d).tar.gz /home/tinkstudio
docker-compose up -d
```

## 🚨 Troubleshooting

### Problemi Comuni

**1. Container non si avvia**
```bash
docker-compose logs [service_name]
docker-compose down && docker-compose up -d
```

**2. Database non raggiungibile**
```bash
docker-compose exec postgres pg_isready -U postgres
docker-compose restart postgres
```

**3. Frontend non carica**
```bash
# Verifica proxy Nginx
sudo nginx -t
sudo systemctl restart nginx
```

**4. SSL non funziona**
```bash
# Rinnova certificato
sudo certbot renew
sudo systemctl restart lsws
```

### Comandi di Diagnostica

```bash
# Test connettività
curl -I https://tuodominio.com
curl https://tuodominio.com/api/health

# Verifica porte
sudo netstat -tlnp | grep -E ':(80|443|3001)'

# Spazio disco
df -h
docker system prune -f
```

## 📞 Supporto

- **Repository**: https://github.com/iRaxe/TattooStudioUtilities
- **Issues**: Apri un issue su GitHub per problemi
- **Documentazione**: Consulta il README.md del progetto

## 🔄 Aggiornamenti

### Aggiornamento Automatico

```bash
# Lo script update.sh gestisce tutto automaticamente
./update.sh
```

### Aggiornamento Manuale

```bash
git pull origin master
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

**🎉 Congratulazioni! TinkStudio è ora installato e funzionante!**

**URL Accesso**: https://tuodominio.com  
**Admin Panel**: https://tuodominio.com (login con credenziali configurate)  
**API Health**: https://tuodominio.com/api/health

**⚠️ IMPORTANTE**: Cambia immediatamente le password di default per sicurezza!