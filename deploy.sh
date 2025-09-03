#!/bin/bash

# TinkStudio Deployment Script for AlmaLinux with CyberPanel
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="tinkstudio"
APP_DIR="/home/tinkstudio"
DOMAIN="${DOMAIN:-yourdomain.com}"
EMAIL="${EMAIL:-admin@yourdomain.com}"
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 64)}"

echo -e "${BLUE}🚀 TinkStudio Deployment Script${NC}"
echo -e "${BLUE}=================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons."
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    sudo dnf update -y
    sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    print_warning "Please log out and log back in for Docker group changes to take effect."
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git pull origin master
else
    print_status "Cloning repository..."
    git clone https://github.com/iRaxe/TattooStudioUtilities.git .
fi

# Create environment file
print_status "Creating environment configuration..."
cp .env.production .env

# Update environment variables
sed -i "s/tinkstudio_secure_password_change_this/$DB_PASSWORD/g" .env
sed -i "s/your-super-secret-jwt-key-change-this-in-production-make-it-very-long-and-random/$JWT_SECRET/g" .env
sed -i "s/yourdomain.com/$DOMAIN/g" .env

# Create SSL directory
print_status "Creating SSL directory..."
mkdir -p ssl

# Generate self-signed SSL certificate if not exists
if [ ! -f "ssl/cert.pem" ]; then
    print_status "Generating self-signed SSL certificate..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/key.pem \
        -out ssl/cert.pem \
        -subj "/C=IT/ST=Italy/L=City/O=TinkStudio/CN=$DOMAIN"
fi

# Create backup directory
print_status "Creating backup directory..."
mkdir -p backups

# Set proper permissions
print_status "Setting permissions..."
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
chmod 600 .env

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose pull

# Build and start services
print_status "Building and starting services..."
docker-compose up -d --build

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
for service in postgres backend frontend; do
    if docker-compose ps $service | grep -q "Up (healthy)"; then
        print_status "✅ $service is healthy"
    else
        print_warning "⚠️  $service might not be ready yet"
    fi
done

# Setup firewall rules
print_status "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/tinkstudio.service > /dev/null <<EOF
[Unit]
Description=TinkStudio Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable tinkstudio.service

# Create update script
print_status "Creating update script..."
tee update.sh > /dev/null <<'EOF'
#!/bin/bash
set -e
cd /home/tinkstudio
git pull origin master
docker-compose down
docker-compose pull
docker-compose up -d --build
echo "Update completed!"
EOF
chmod +x update.sh

# Create backup script
print_status "Creating backup script..."
tee backup.sh > /dev/null <<'EOF'
#!/bin/bash
set -e
BACKUP_DIR="/home/tinkstudio/backups"
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U postgres tinkstudio > "$BACKUP_DIR/backup_$DATE.sql"
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
echo "Backup completed: backup_$DATE.sql"
EOF
chmod +x backup.sh

# Add backup to crontab
print_status "Setting up automated backups..."
(crontab -l 2>/dev/null; echo "0 2 * * * /home/tinkstudio/backup.sh") | crontab -

print_status "🎉 Deployment completed successfully!"
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Application URL: https://$DOMAIN${NC}"
echo -e "${GREEN}Admin Panel: https://$DOMAIN/admin${NC}"
echo -e "${GREEN}API Health: https://$DOMAIN/api/health${NC}"
echo -e "${YELLOW}Default Admin Credentials:${NC}"
echo -e "${YELLOW}Username: admin${NC}"
echo -e "${YELLOW}Password: admin123_change_this${NC}"
echo -e "${RED}⚠️  IMPORTANT: Change default passwords!${NC}"
echo -e "${BLUE}Logs: docker-compose logs -f${NC}"
echo -e "${BLUE}Update: ./update.sh${NC}"
echo -e "${BLUE}Backup: ./backup.sh${NC}"
echo -e "${GREEN}=================================${NC}"