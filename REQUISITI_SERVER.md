# 🖥️ TinkStudio - Requisiti Server e Risorse

## 📊 Requisiti Hardware Minimi

### 🔧 **Configurazione Base (Piccolo Studio)**
- **CPU**: 2 vCPU / 2 Core
- **RAM**: 4 GB
- **Storage**: 20 GB SSD
- **Bandwidth**: 100 Mbps
- **Utenti simultanei**: 10-20

### 🚀 **Configurazione Consigliata (Studio Medio)**
- **CPU**: 4 vCPU / 4 Core
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **Bandwidth**: 500 Mbps
- **Utenti simultanei**: 50-100

### 💪 **Configurazione Ottimale (Studio Grande)**
- **CPU**: 8 vCPU / 8 Core
- **RAM**: 16 GB
- **Storage**: 100 GB SSD
- **Bandwidth**: 1 Gbps
- **Utenti simultanei**: 200+

## 🐧 Requisiti Sistema Operativo

### ✅ **Sistemi Supportati**
- **AlmaLinux 8/9** (Consigliato)
- **Rocky Linux 8/9**
- **CentOS 8/9**
- **RHEL 8/9**
- **Ubuntu 20.04/22.04 LTS**
- **Debian 11/12**

### 🔒 **Accessi Richiesti**
- **Root access** (per installazione)
- **SSH access** (porta 22)
- **Sudo privileges**

## 🌐 Requisiti di Rete

### 🔌 **Porte da Aprire**
```bash
# Porte essenziali
22    # SSH
80    # HTTP
443   # HTTPS
3001  # API Backend (interno)
5432  # PostgreSQL (interno)

# Porte opzionali (CyberPanel)
8090  # CyberPanel Admin
7080  # OpenLiteSpeed Admin
53    # DNS (se usato)
21    # FTP (se usato)
25    # SMTP (se usato)
```

### 🌍 **Configurazione DNS**
```
# Record DNS necessari
A     tuodominio.com        → IP_SERVER
A     www.tuodominio.com   → IP_SERVER
CNAME api.tuodominio.com   → tuodominio.com
```

## 💾 Utilizzo Risorse per Componente

### 🐳 **Container Docker**
```yaml
# Frontend (React + Nginx)
CPU: 0.5 core
RAM: 512 MB
Storage: 100 MB

# Backend (Node.js)
CPU: 1 core
RAM: 1 GB
Storage: 200 MB

# Database (PostgreSQL)
CPU: 1 core
RAM: 2 GB
Storage: 5-50 GB (crescita)

# Redis (opzionale)
CPU: 0.25 core
RAM: 256 MB
Storage: 100 MB
```

### 📈 **Crescita nel Tempo**
```
# Database (per 1000 clienti)
Clienti: ~50 MB
Gift Cards: ~20 MB
Consensi: ~30 MB
Logs: ~100 MB/mese

# Upload Files
Immagini: ~10 MB per cliente
Documenti: ~5 MB per cliente
```

## 🏢 Fornitori VPS Consigliati

### 💰 **Budget (€5-15/mese)**
- **Hetzner Cloud**: CX21 (2 vCPU, 4GB RAM, 40GB SSD) - €4.90/mese
- **DigitalOcean**: Basic Droplet (2 vCPU, 4GB RAM, 80GB SSD) - $24/mese
- **Vultr**: Regular Performance (2 vCPU, 4GB RAM, 80GB SSD) - $24/mese
- **Linode**: Nanode (2 vCPU, 4GB RAM, 80GB SSD) - $24/mese

### 🚀 **Performance (€15-50/mese)**
- **Hetzner Cloud**: CX31 (4 vCPU, 8GB RAM, 80GB SSD) - €9.90/mese
- **DigitalOcean**: General Purpose (4 vCPU, 8GB RAM, 160GB SSD) - $48/mese
- **AWS EC2**: t3.large (2 vCPU, 8GB RAM) - ~$60/mese
- **Google Cloud**: e2-standard-4 (4 vCPU, 16GB RAM) - ~$120/mese

### 🏆 **Enterprise (€50+/mese)**
- **Hetzner Dedicated**: EX42 (8 Core, 64GB RAM, 2x512GB NVMe) - €39/mese
- **OVH**: VPS SSD 3 (8 vCPU, 32GB RAM, 400GB SSD) - €40/mese
- **AWS EC2**: c5.2xlarge (8 vCPU, 16GB RAM) - ~$250/mese

## 🎯 Raccomandazioni per Tipo di Studio

### 🏠 **Studio Piccolo (1-2 Tatuatori)**
```yaml
Server: Hetzner CX21 (€4.90/mese)
CPU: 2 vCPU
RAM: 4 GB
Storage: 40 GB SSD
Bandwidth: 20 TB
Clienti: fino a 500
Utenti simultanei: 10-20
```

### 🏢 **Studio Medio (3-5 Tatuatori)**
```yaml
Server: Hetzner CX31 (€9.90/mese)
CPU: 4 vCPU
RAM: 8 GB
Storage: 80 GB SSD
Bandwidth: 20 TB
Clienti: fino a 2000
Utenti simultanei: 50-100
```

### 🏭 **Studio Grande (6+ Tatuatori)**
```yaml
Server: Hetzner CX41 (€16.90/mese)
CPU: 8 vCPU
RAM: 16 GB
Storage: 160 GB SSD
Bandwidth: 20 TB
Clienti: illimitati
Utenti simultanei: 200+
```

## 🔧 Software Preinstallato Necessario

### ✅ **Installato Automaticamente dallo Script**
- Docker Engine
- Docker Compose
- Git
- Curl/Wget
- Firewall (firewalld)
- Systemd

### 🔄 **Opzionale (Installazione Manuale)**
- CyberPanel (per gestione SSL automatica)
- Fail2ban (protezione brute force)
- Monitoring tools (htop, iotop, etc.)

## 📋 Checklist Pre-Installazione

### ✅ **Server Setup**
- [ ] Server con AlmaLinux/Rocky Linux installato
- [ ] Accesso root via SSH
- [ ] Porte 22, 80, 443 aperte
- [ ] Almeno 4GB RAM e 20GB storage
- [ ] Connessione internet stabile

### ✅ **DNS e Dominio**
- [ ] Dominio registrato
- [ ] DNS configurato per puntare al server
- [ ] Record A per dominio principale
- [ ] Record A per www (opzionale)

### ✅ **Credenziali**
- [ ] Indirizzo email per SSL
- [ ] Nome dominio completo
- [ ] Accesso SSH al server

## 🚀 Comando di Installazione

```bash
# Connessione SSH
ssh root@IP_DEL_TUO_SERVER

# Download e installazione automatica
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/remote-deploy.sh
chmod +x remote-deploy.sh
./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

## 📊 Monitoraggio Risorse Post-Installazione

### 🔍 **Comandi di Verifica**
```bash
# Utilizzo CPU e RAM
htop

# Spazio disco
df -h

# Stato container Docker
sudo -u tinkstudio docker stats

# Logs applicazione
sudo -u tinkstudio docker-compose -f /home/tinkstudio/TinkStudio/docker-compose.yml logs -f

# Test performance
/home/tinkstudio/TinkStudio/verify-deployment.sh tuodominio.com
```

### 📈 **Metriche da Monitorare**
- **CPU Usage**: < 70% in media
- **RAM Usage**: < 80% in media
- **Disk Usage**: < 85%
- **Response Time**: < 500ms
- **Uptime**: > 99.5%

## 🔧 Ottimizzazioni Performance

### ⚡ **Per Server con Poche Risorse**
```bash
# Riduzione memoria PostgreSQL
echo "shared_buffers = 128MB" >> /home/tinkstudio/TinkStudio/postgres.conf
echo "effective_cache_size = 512MB" >> /home/tinkstudio/TinkStudio/postgres.conf

# Disabilitazione Redis se non necessario
# Commenta sezione redis in docker-compose.yml
```

### 🚀 **Per Server con Molte Risorse**
```bash
# Aumento memoria PostgreSQL
echo "shared_buffers = 2GB" >> /home/tinkstudio/TinkStudio/postgres.conf
echo "effective_cache_size = 4GB" >> /home/tinkstudio/TinkStudio/postgres.conf

# Abilitazione Redis per caching
# Decommenta sezione redis in docker-compose.yml
```

## 💡 Consigli per Risparmiare

### 💰 **Ottimizzazione Costi**
1. **Inizia piccolo**: Hetzner CX21 (€4.90/mese) è sufficiente per iniziare
2. **Scala gradualmente**: Aumenta risorse solo quando necessario
3. **Backup esterni**: Usa storage economico per backup (AWS S3, Backblaze)
4. **CDN gratuito**: Cloudflare per accelerare il sito
5. **Monitoring gratuito**: UptimeRobot per monitoraggio uptime

### 📊 **Quando Fare Upgrade**
- **CPU > 80%** per più di 1 ora
- **RAM > 85%** costantemente
- **Disk > 85%** di utilizzo
- **Response time > 1 secondo**
- **Più di 50 utenti simultanei**

## 🆘 Supporto e Assistenza

### 📞 **In Caso di Problemi**
1. Controlla i logs: `sudo -u tinkstudio docker-compose logs`
2. Verifica risorse: `htop` e `df -h`
3. Testa connettività: `curl http://localhost/api/health`
4. Esegui verifica completa: `./verify-deployment.sh`

### 📧 **Contatti**
- **Repository**: https://github.com/iRaxe/TattooStudioUtilities
- **Issues**: Apri ticket su GitHub con dettagli server
- **Documentazione**: Consulta README e guide nel repository

---

## 🎉 Riepilogo Veloce

**Per iniziare subito:**
- **Server**: Hetzner CX21 (2 vCPU, 4GB RAM, 40GB SSD) - €4.90/mese
- **OS**: AlmaLinux 9
- **Dominio**: Qualsiasi provider (Namecheap, GoDaddy, etc.)
- **Tempo setup**: 5-10 minuti con script automatico
- **Costo totale mensile**: ~€15 (server + dominio)

**🚀 Comando magico:**
```bash
wget https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/remote-deploy.sh && chmod +x remote-deploy.sh && ./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

**✅ Risultato: Applicazione completa funzionante in 10 minuti!**