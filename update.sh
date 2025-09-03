#!/bin/bash

# Colori per l'output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Inizio procedura di aggiornamento di TinkStudio ===${NC}"

# 1. Assicurati di essere nella directory corretta
cd "$(dirname "$0")" || exit

# 2. Scarica le ultime modifiche dal repository Git
echo -e "\n${GREEN}[1/4] Scarico le ultime modifiche da GitHub...${NC}"
if git pull; then
    echo -e "Download completato."
else
    echo -e "${RED}ERRORE: Impossibile scaricare le modifiche da Git. Aggiornamento interrotto.${NC}"
    exit 1
fi

# 3. Ricostruisce e riavvia i container Docker in background
echo -e "\n${GREEN}[2/4] Ricostruisco le immagini e riavvio i servizi necessari...${NC}"
if /usr/bin/docker compose up -d --build; then
    echo -e "Servizi aggiornati e riavviati."
else
    echo -e "${RED}ERRORE: Docker Compose ha fallito. Controllare l'output sopra per i dettagli.${NC}"
    exit 1
fi

# 4. Pulisce le immagini Docker non più utilizzate
echo -e "\n${GREEN}[3/4] Pulisco le vecchie immagini Docker...${NC}"
docker image prune -f

# 5. Mostra lo stato finale dei container
echo -e "\n${GREEN}[4/4] Stato finale dei container:${NC}"
/usr/bin/docker compose ps

echo -e "\n${YELLOW}===================================================${NC}"
echo -e "${GREEN} Aggiornamento completato con successo! ${NC}"
echo -e "${YELLOW}===================================================${NC}"