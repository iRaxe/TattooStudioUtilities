# 🌐 TinkStudio - Deployment Remoto Automatico

## 🎯 Panoramica

Purtroppo non posso collegarmi direttamente via SSH al tuo server, ma ho creato una soluzione ancora migliore: **script completamente automatici** che puoi eseguire sul server e che faranno tutto il lavoro per te, senza bisogno di configurazioni manuali.

## 🚀 Metodi di Deployment Disponibili

### 🥇 **Metodo 1: Script Remoto Completo (CONSIGLIATO)**

Ho creato `remote-deploy.sh` che puoi eseguire direttamente sul server:

```bash
# Sul tuo server AlmaLinux (via SSH)
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/remote-deploy.sh
chmod +x remote-deploy.sh
./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

**✅ Cosa fa automaticamente:**
- Installa Docker e Docker Compose
- Scarica il codice da GitHub
- Genera password sicure automaticamente
- Configura firewall
- Avvia tutti i servizi
- Configura backup automatici
- Crea servizio systemd per auto-start

### 🥈 **Metodo 2: Script CyberPanel (Se hai CyberPanel)**

```bash
# Sul server con CyberPanel già installato
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/cyberpanel-setup.sh
chmod +x cyberpanel-setup.sh
./cyberpanel-setup.sh tuodominio.com admin@tuodominio.com
```

### 🥉 **Metodo 3: Deployment Manuale Guidato**

```bash
# Clona repository
git clone https://github.com/iRaxe/TattooStudioUtilities.git
cd TattooStudioUtilities

# Configura
cp .env.production .env
nano .env  # Modifica dominio e password

# Deploy
DOMAIN=tuodominio.com EMAIL=admin@tuodominio.com ./deploy.sh
```

## 📋 Guida Passo-Passo per SSH

### Passo 1: Connessione SSH

```bash
# Da Windows (PowerShell/CMD)
ssh root@IP_DEL_TUO_SERVER

# Da Linux/Mac
ssh root@IP_DEL_TUO_SERVER

# Con chiave SSH
ssh -i /path/to/your/key.pem root@IP_DEL_TUO_SERVER
```

### Passo 2: Download ed Esecuzione Script

```bash
# Una volta connesso al server
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/remote-deploy.sh
chmod +x remote-deploy.sh

# Esegui con i tuoi parametri
./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

### Passo 3: Attendi Completamento

Lo script farà tutto automaticamente:
- ⏱️ Tempo stimato: **5-10 minuti**
- 📊 Mostra progresso in tempo reale
- 🔐 Genera credenziali sicure
- ✅ Verifica che tutto funzioni

## 🔧 Opzioni Avanzate

### Con Repository Personalizzato

```bash
./remote-deploy.sh tuodominio.com admin@tuodominio.com https://github.com/tuo-username/tuo-repo.git
```

### Con Configurazione Personalizzata

```bash
# Scarica script
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/remote-deploy.sh

# Modifica configurazioni nel script se necessario
nano remote-deploy.sh

# Esegui
./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

## 🎛️ Cosa Succede Durante l'Installazione

```
🚀 TINKSTUDIO REMOTE DEPLOYMENT
======================================

1/10 Aggiornamento sistema...          ✅
2/10 Installazione dipendenze base...  ✅
3/10 Installazione Docker...           ✅
4/10 Installazione Docker Compose...   ✅
5/10 Creazione utente applicazione...  ✅
6/10 Download codice sorgente...       ✅
7/10 Configurazione ambiente...        ✅
8/10 Configurazione firewall...        ✅
9/10 Avvio applicazione Docker...      ✅
10/10 Configurazione servizio systemd... ✅

🎉 INSTALLAZIONE COMPLETATA!
```

## 📊 Output Finale

Alla fine dell'installazione riceverai:

```
======================================
🎉 INSTALLAZIONE COMPLETATA! 🎉
======================================

📋 INFORMAZIONI ACCESSO:
   🌐 Sito Web: http://tuodominio.com
   🔒 HTTPS: https://tuodominio.com (configura SSL)
   📊 API Health: http://tuodominio.com/api/health
   🖥️ Server IP: 192.168.1.100

🔑 CREDENZIALI:
   ADMIN_PASSWORD=Abc123Xyz789
   POSTGRES_PASSWORD=Def456Uvw012

📝 PROSSIMI PASSI:
   1. Configura il DNS per puntare tuodominio.com a questo server
   2. Installa CyberPanel (opzionale) per gestione SSL automatica
   3. Configura SSL/HTTPS per il dominio
   4. Testa l'applicazione: http://tuodominio.com
```

## 🔍 Verifica Installazione

```bash
# Verifica stato servizi
sudo systemctl status tinkstudio

# Verifica container Docker
sudo -u tinkstudio docker-compose -f /home/tinkstudio/TinkStudio/docker-compose.yml ps

# Test connettività
curl http://localhost/api/health

# Verifica completa automatica
/home/tinkstudio/TinkStudio/verify-deployment.sh tuodominio.com
```

## 🛠️ Gestione Post-Installazione

### Comandi Essenziali

```bash
# Riavvio applicazione
sudo systemctl restart tinkstudio

# Visualizza logs
sudo -u tinkstudio docker-compose -f /home/tinkstudio/TinkStudio/docker-compose.yml logs -f

# Backup database
sudo -u tinkstudio /home/tinkstudio/TinkStudio/backup.sh

# Aggiornamento
sudo -u tinkstudio /home/tinkstudio/TinkStudio/update.sh
```

### File Importanti

```bash
# Configurazione
/home/tinkstudio/TinkStudio/.env

# Credenziali generate
/home/tinkstudio/TinkStudio/.credentials

# Logs applicazione
/home/tinkstudio/TinkStudio/logs/

# Backup database
/home/tinkstudio/TinkStudio/backups/
```

## 🔒 Configurazione SSL (Dopo l'Installazione)

### Con CyberPanel

1. Installa CyberPanel: `sh <(curl https://cyberpanel.net/install.sh || wget -O - https://cyberpanel.net/install.sh)`
2. Accedi a CyberPanel: `https://server-ip:8090`
3. Crea sito web per il tuo dominio
4. Attiva SSL Let's Encrypt

### Con Certbot (Manuale)

```bash
# Installa certbot
sudo dnf install -y certbot

# Ottieni certificato
sudo certbot certonly --standalone -d tuodominio.com

# Configura nginx per SSL
# (Usa la configurazione in cyberpanel-nginx.conf)
```

## 🚨 Troubleshooting

### Script Non Si Avvia

```bash
# Verifica permessi
ls -la remote-deploy.sh
chmod +x remote-deploy.sh

# Esegui come root
sudo ./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

### Container Non Si Avviano

```bash
# Verifica logs
sudo -u tinkstudio docker-compose -f /home/tinkstudio/TinkStudio/docker-compose.yml logs

# Riavvia servizi
sudo systemctl restart docker
sudo systemctl restart tinkstudio
```

### Sito Non Raggiungibile

```bash
# Verifica firewall
sudo firewall-cmd --list-all

# Verifica porte
sudo netstat -tlnp | grep -E ':(80|443|3001)'

# Test locale
curl http://localhost
curl http://localhost/api/health
```

## 📞 Supporto

### Raccolta Informazioni per Supporto

```bash
# Crea pacchetto debug
mkdir -p /tmp/tinkstudio-debug
sudo -u tinkstudio docker-compose -f /home/tinkstudio/TinkStudio/docker-compose.yml logs > /tmp/tinkstudio-debug/docker-logs.txt
sudo journalctl -u tinkstudio.service > /tmp/tinkstudio-debug/systemd-logs.txt
cp /home/tinkstudio/TinkStudio/.env /tmp/tinkstudio-debug/config.txt  # RIMUOVI PASSWORD!
sudo tar -czf tinkstudio-debug-$(date +%Y%m%d_%H%M%S).tar.gz /tmp/tinkstudio-debug/
```

### Contatti

- **Repository**: https://github.com/iRaxe/TattooStudioUtilities
- **Issues**: Apri un ticket su GitHub
- **Documentazione**: Consulta i file README nel repository

---

## 🎉 Risultato Finale

**Dopo aver eseguito lo script avrai:**

✅ **Applicazione completa** funzionante su `http://tuodominio.com`  
✅ **Database PostgreSQL** configurato e funzionante  
✅ **Backup automatici** attivi (giornalieri alle 2:00)  
✅ **Servizio systemd** per auto-start al riavvio  
✅ **Firewall** configurato correttamente  
✅ **Credenziali sicure** generate automaticamente  
✅ **Monitoraggio** e health checks attivi  
✅ **Zero configurazione manuale** richiesta  

**🚀 Tempo totale: 5-10 minuti per un deployment completo!**

---

**💡 Suggerimento**: Salva le credenziali generate in un posto sicuro e configura SSL/HTTPS per la sicurezza in produzione!