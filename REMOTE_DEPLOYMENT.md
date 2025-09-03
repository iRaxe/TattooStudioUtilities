## Procedura di Deployment Remoto su Server AlmaLinux con CyberPanel

Questa guida illustra i passaggi per eseguire il deployment dell'applicazione TinkStudio su un server AlmaLinux 9 con CyberPanel, utilizzando uno script di setup automatizzato.

### Prerequisiti

1.  **Server AlmaLinux 9** con accesso root.
2.  **CyberPanel** installato e funzionante.
3.  Un **dominio** puntato correttamente all'IP del server.

### Passaggi di Deployment

1.  **Connessione al Server**

    Connettiti al tuo server tramite SSH come utente `root`:
    ```bash
    ssh root@tuo_server_ip
    ```

2.  **Download ed Esecuzione dello Script di Setup**

    Esegui questo comando per scaricare ed eseguire l'ultima versione dello script di setup. Il comando include un parametro per evitare problemi di cache e assicura che venga sempre scaricata la versione più recente.

    ```bash
    DOMAIN="tinkstudio.it" # Sostituisci con il tuo dominio
    EMAIL="admin@tinkstudio.it" # Sostituisci con la tua email
    wget -O cyberpanel-setup.sh "https://raw.githubusercontent.com/iRaxe/TattooStudioUtilities/master/cyberpanel-setup.sh?$(date +%s)" && chmod +x cyberpanel-setup.sh && ./cyberpanel-setup.sh "$DOMAIN" "$EMAIL"
    ```

    Lo script eseguirà automaticamente le seguenti operazioni:
    *   Installerà le dipendenze necessarie (Docker, Git, etc.).
    *   Creerà un utente dedicato (`tinkstudio`) per l'applicazione.
    *   Scaricherà il codice sorgente da GitHub.
    *   Genererà le credenziali di sicurezza e configurerà il file `.env`.
    *   Avvierà l'applicazione con Docker Compose.
    *   Configurerà un servizio `systemd` per l'avvio automatico.
    *   Imposterà le regole del firewall.

3.  **Configurazione SSL in CyberPanel**

    Dopo che lo script ha terminato, accedi a CyberPanel e rilascia un certificato SSL Let's Encrypt per il tuo dominio. Questo garantirà che la connessione sia sicura.

4.  **Configurazione Reverse Proxy in CyberPanel**

    L'ultimo passo è esporre l'applicazione al pubblico tramite il tuo dominio. In CyberPanel, naviga nella gestione del tuo sito fino a trovare la sezione **Rewrite Rules** e inserisci le seguenti regole:

    ```
    REWRITERULE ^/api/(.*)$ http://127.0.0.1:3001/$1 [P,L]
    REWRITERULE ^(.*)$ http://127.0.0.1:8080/$1 [P,L]
    ```

    Salva le regole per rendere l'applicazione accessibile dal tuo dominio.

5.  **Riavvio del Server**

    Per assicurarti che tutte le configurazioni siano applicate correttamente, riavvia il server.

    ```bash
    reboot
    ```

### Verifica del Deployment

Una volta completati i passaggi, l'applicazione sarà disponibile al tuo dominio `https://tuo_dominio.com`.

Puoi verificare lo stato dei servizi Docker con il seguente comando:

```bash
sudo -u tinkstudio /usr/bin/docker compose -f /home/tinkstudio/TinkStudio/docker-compose.yml ps
```