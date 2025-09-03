# 🚀 TinkStudio - Deployment Manuale (Repository Privato)

## 🎯 Situazione

Poiché il repository è privato, non puoi scaricare direttamente gli script. Ecco come fare il deployment manuale completo.

## 📋 Metodo 1: Upload Files e Deploy Automatico

### Passo 1: Preparazione Files Locali

Sul tuo computer Windows, crea un archivio con tutti i file necessari:

```powershell
# In PowerShell (nella cartella TinkStudio2)
Compress-Archive -Path .\* -DestinationPath TinkStudio-Deploy.zip
```

### Passo 2: Upload al Server

```bash
# Sul server (dove sei già connesso)
mkdir -p /tmp/tinkstudio-upload
cd /tmp/tinkstudio-upload

# Usa SCP per caricare il file (da un altro terminale sul tuo PC)
# scp TinkStudio-Deploy.zip tinks1720@s1:/tmp/tinkstudio-upload/
```

### Passo 3: Estrazione e Setup

```bash
# Sul server
cd /tmp/tinkstudio-upload
unzip TinkStudio-Deploy.zip
chmod +x *.sh

# Esegui deployment
./remote-deploy.sh tuodominio.com admin@tuodominio.com
```

## 📋 Metodo 2: Deployment Manuale Completo

### Passo 1: Installazione Dipendenze

```bash
# Aggiorna sistema
sudo dnf update -y

# Installa dipendenze base
sudo dnf install -y curl wget git unzip

# Installa Docker
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# Installa Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Passo 2: Creazione Utente e Directory

```bash
# Crea utente dedicato
sudo useradd -m -s /bin/bash tinkstudio
sudo usermod -aG docker tinkstudio

# Crea directory applicazione
sudo mkdir -p /home/tinkstudio/TinkStudio
sudo chown -R tinkstudio:tinkstudio /home/tinkstudio/TinkStudio
```

### Passo 3: Creazione Files Manuale

#### 3.1 Docker Compose

```bash
sudo -u tinkstudio tee /home/tinkstudio/TinkStudio/docker-compose.yml > /dev/null << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: tinkstudio-postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-tinkstudio}
      POSTGRES_USER: ${POSTGRES_USER:-tinkstudio}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
    ports:
      - "127.0.0.1:5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-tinkstudio}"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - tinkstudio-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: tinkstudio-backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB:-tinkstudio}
      DB_USER: ${POSTGRES_USER:-tinkstudio}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-changeme123}
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-this}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin123}
      PORT: 3001
    ports:
      - "127.0.0.1:3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - tinkstudio-network
    volumes:
      - uploads:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: tinkstudio-frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - tinkstudio-network

volumes:
  postgres_data:
  uploads:

networks:
  tinkstudio-network:
    driver: bridge
EOF
```

#### 3.2 Environment File

```bash
sudo -u tinkstudio tee /home/tinkstudio/TinkStudio/.env > /dev/null << EOF
# Database Configuration
POSTGRES_DB=tinkstudio
POSTGRES_USER=tinkstudio
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Application Configuration
JWT_SECRET=$(openssl rand -base64 64)
ADMIN_PASSWORD=$(openssl rand -base64 16)
NODE_ENV=production

# Domain Configuration
DOMAIN=tuodominio.com
API_URL=http://tuodominio.com/api
PUBLIC_URL=http://tuodominio.com

# Security
SESSION_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF
```

#### 3.3 Database Init

```bash
sudo -u tinkstudio tee /home/tinkstudio/TinkStudio/init-db.sql > /dev/null << 'EOF'
-- TinkStudio Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    birth_date DATE,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gift Cards table
CREATE TABLE IF NOT EXISTS gift_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    remaining_amount DECIMAL(10,2) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    issued_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consensi table
CREATE TABLE IF NOT EXISTS consensi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT false,
    granted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_customer ON gift_cards(customer_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_consensi_customer ON consensi(customer_id);
CREATE INDEX IF NOT EXISTS idx_consensi_type ON consensi(type);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_cards_updated_at BEFORE UPDATE ON gift_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consensi_updated_at BEFORE UPDATE ON consensi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
```

### Passo 4: Copia Codice Sorgente

#### 4.1 Crea Struttura Directory

```bash
sudo -u tinkstudio mkdir -p /home/tinkstudio/TinkStudio/frontend
sudo -u tinkstudio mkdir -p /home/tinkstudio/TinkStudio/backend
```

#### 4.2 Copia Files dal Tuo PC

**Opzione A: Usa SCP (da Windows)**
```powershell
# Da PowerShell sul tuo PC
scp -r .\frontend\* tinks1720@s1:/home/tinkstudio/TinkStudio/frontend/
scp -r .\backend\* tinks1720@s1:/home/tinkstudio/TinkStudio/backend/
```

**Opzione B: Crea Manualmente i Files Essenziali**

```bash
# Backend Dockerfile
sudo -u tinkstudio tee /home/tinkstudio/TinkStudio/backend/Dockerfile > /dev/null << 'EOF'
FROM node:18-alpine

RUN apk add --no-cache dumb-init curl

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . .
RUN mkdir -p uploads && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
EOF

# Frontend Dockerfile
sudo -u tinkstudio tee /home/tinkstudio/TinkStudio/frontend/Dockerfile > /dev/null << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY public/fonts/ /usr/share/nginx/html/fonts/
COPY public/*.ttf /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF
```

### Passo 5: Configurazione Firewall

```bash
# Configura firewall
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### Passo 6: Avvio Applicazione

```bash
# Vai nella directory
cd /home/tinkstudio/TinkStudio

# Avvia con Docker Compose
sudo -u tinkstudio docker-compose up -d --build

# Verifica stato
sudo -u tinkstudio docker-compose ps
sudo -u tinkstudio docker-compose logs -f
```

### Passo 7: Creazione Servizio Systemd

```bash
sudo tee /etc/systemd/system/tinkstudio.service > /dev/null << 'EOF'
[Unit]
Description=TinkStudio Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=tinkstudio
Group=tinkstudio
WorkingDirectory=/home/tinkstudio/TinkStudio
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tinkstudio
sudo systemctl start tinkstudio
```

## 🔍 Verifica Installazione

```bash
# Verifica servizi
sudo systemctl status tinkstudio
sudo -u tinkstudio docker-compose ps

# Test connettività
curl http://localhost
curl http://localhost/api/health

# Verifica logs
sudo -u tinkstudio docker-compose logs backend
sudo -u tinkstudio docker-compose logs frontend
sudo -u tinkstudio docker-compose logs postgres
```

## 📊 Credenziali Generate

```bash
# Visualizza credenziali
cat /home/tinkstudio/TinkStudio/.env | grep -E '(PASSWORD|SECRET)'
```

## 🚨 Troubleshooting

### Container Non Si Avviano

```bash
# Verifica logs dettagliati
sudo -u tinkstudio docker-compose logs --tail=50

# Riavvia servizi
sudo -u tinkstudio docker-compose down
sudo -u tinkstudio docker-compose up -d --build
```

### Problemi di Permessi

```bash
# Correggi ownership
sudo chown -R tinkstudio:tinkstudio /home/tinkstudio/TinkStudio
sudo chmod +x /home/tinkstudio/TinkStudio/*.sh
```

### Porte Occupate

```bash
# Verifica porte in uso
sudo netstat -tlnp | grep -E ':(80|443|3001|5432)'

# Ferma servizi conflittuali
sudo systemctl stop httpd nginx apache2
```

## 🎉 Risultato Finale

Dopo aver completato tutti i passi avrai:

✅ **Applicazione TinkStudio** funzionante su `http://server-ip`  
✅ **Database PostgreSQL** configurato  
✅ **Servizio systemd** per auto-start  
✅ **Firewall** configurato  
✅ **Container Docker** in esecuzione  

**🔗 Accesso**: `http://IP_DEL_SERVER` o `http://tuodominio.com` (se DNS configurato)

## 📞 Prossimi Passi

1. **Configura DNS** per puntare il dominio al server
2. **Installa SSL** con Let's Encrypt o CyberPanel
3. **Configura backup** automatici
4. **Monitora** l'applicazione

---

**💡 Suggerimento**: Salva le credenziali generate in un posto sicuro e testa l'applicazione prima di configurare SSL!