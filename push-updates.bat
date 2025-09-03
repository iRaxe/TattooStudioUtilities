@echo off
echo [1/3] Aggiungo tutti i file modificati...
git add .

echo.
echo [2/3] Creazione del commit...
set /p commit_message="Inserisci un messaggio per il commit (es. 'Aggiornamento backend'): "
git commit -m "%commit_message%"

echo.
echo [3/3] Invio delle modifiche al repository GitHub...
git push origin master

echo.
echo Fatto! Le modifiche sono state caricate su GitHub.
pause