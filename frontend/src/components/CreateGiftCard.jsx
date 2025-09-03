import React, { useState } from 'react';

import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Alert from './common/Alert';

function CreateGiftCard({ onGiftCardCreated, onStatsUpdate }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreatedCard, setLastCreatedCard] = useState(null);

  const handleCreateGiftCard = async () => {
    // Validazione importo (sempre obbligatorio)
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }

    // Determina se creare una bozza o una gift card completa
    const hasAllFields = firstName.trim() && lastName.trim() && phone.trim();
    const hasOnlyAmount = !firstName.trim() && !lastName.trim() && !phone.trim();

    // Se ci sono alcuni campi ma non tutti, mostra errore
    if (!hasAllFields && !hasOnlyAmount) {
      setError('Compila tutti i campi per creare una gift card completa, oppure lascia vuoti nome, cognome e telefono per generare solo un link');
      return;
    }

    // Validazione telefono se presente
    if (phone.trim() && !/^\d+$/.test(phone.trim())) {
      setError('Il telefono deve contenere solo numeri');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getCookie('adminToken');
      
      if (hasOnlyAmount) {
        // Crea solo bozza con link
        const response = await fetch('/api/admin/gift-cards/drafts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ amount: parseFloat(amount) })
        });

        const data = await response.json();

        if (response.ok) {
          const newCard = {
            amount: parseFloat(amount),
            claimUrl: data.claim_url,
            draftId: data.draft_id,
            claimToken: data.claim_token,
            isDraft: true
          };
          
          setLastCreatedCard(newCard);
          setAmount('');
          
          // Notify parent components
          if (onGiftCardCreated) onGiftCardCreated();
          if (onStatsUpdate) onStatsUpdate();
          
          // Copy link to clipboard automatically
          navigator.clipboard.writeText(data.claim_url);
        } else {
          setError(data.message || 'Errore durante la creazione');
        }
      } else {
        // Crea gift card completa
        const response = await fetch('/api/admin/gift-cards/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            amount: parseFloat(amount) 
          })
        });

        const data = await response.json();

        if (response.ok) {
          const newCard = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            amount: parseFloat(amount),
            redeemUrl: data.redeem_url,
            giftCardId: data.gift_card_id,
            code: data.code,
            isDraft: false
          };
          
          setLastCreatedCard(newCard);
          setFirstName('');
          setLastName('');
          setPhone('');
          setAmount('');
          
          // Notify parent components
          if (onGiftCardCreated) onGiftCardCreated();
          if (onStatsUpdate) onStatsUpdate();
          
          // Copy link to clipboard automatically
          navigator.clipboard.writeText(data.redeem_url);
        } else {
          setError(data.message || 'Errore durante la creazione');
        }
      }
    } catch (error) {
      console.error('Create gift card error:', error);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      {!lastCreatedCard && (
        <>
          <h3 className="section-title"><i className="fas fa-plus"></i> Crea Gift Card</h3>
          <p className="section-description">
            <strong>Solo importo:</strong> Genera un link per chi regala la gift card<br/>
            <strong>Tutti i campi:</strong> Crea una gift card completa con landing page personalizzata
          </p>
        
          <div className="input-section">
            <Input
               type="text"
               value={firstName}
               onChange={(e) => setFirstName(e.target.value)}
               placeholder="Inserisci il nome"
               disabled={loading}
             />
             <Input
               type="text"
               value={lastName}
               onChange={(e) => setLastName(e.target.value)}
               placeholder="Inserisci il cognome"
               disabled={loading}
             />
             <Input
               type="tel"
               value={phone}
               onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
               placeholder="Inserisci il numero di telefono"
               disabled={loading}
             />
             <Input
               type="number"
               step="0.01"
               min="0"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0.00"
               disabled={loading}
             />
            <Button
              onClick={handleCreateGiftCard}
              disabled={loading || !amount}
              className="full-width-button"
            >
              {loading ? 'Creazione in corso...' : 'Crea Gift Card'}
            </Button>
          </div>

          {error && (
            <Alert type="error">
              {error}
            </Alert>
          )}
        </>
      )}
    
      {lastCreatedCard && (
        <div className="created-card-section">
          <h3 className="section-title">
            <i className="fas fa-check-circle"></i> 
            {lastCreatedCard.isDraft ? 'Link Gift Card Generato!' : 'Gift Card Creata con Successo!'}
          </h3>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '4px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              {lastCreatedCard.isDraft ? (
                <>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Importo: €{lastCreatedCard.amount}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    ID Bozza: {lastCreatedCard.draftId}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Cliente: {lastCreatedCard.firstName} {lastCreatedCard.lastName}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Telefono: {lastCreatedCard.phone}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Importo: €{lastCreatedCard.amount}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    ID Gift Card: {lastCreatedCard.giftCardId}
                  </div>
                </>
              )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f9fafb' }}>
                {lastCreatedCard.isDraft ? 'Link per chi regala:' : 'Landing Page Personalizzata:'}
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#fbbf24'
              }}>
                {lastCreatedCard.isDraft ? lastCreatedCard.claimUrl : lastCreatedCard.redeemUrl}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem', fontStyle: 'italic' }}>
                {lastCreatedCard.isDraft ? 
                  '🎁 Condividi questo link con chi regala la gift card. Dovrà compilare i dati del festeggiato' :
                  '🎁 Condividi questo link con il cliente per una esperienza gift card personalizzata e animata'
                }
              </div>
            </div>
            
            <div className="flex gap-md flex-wrap">
              <Button
                onClick={() => {
                  const linkToCopy = lastCreatedCard.isDraft ? lastCreatedCard.claimUrl : lastCreatedCard.redeemUrl;
                  navigator.clipboard.writeText(linkToCopy);
                  alert('Link copiato negli appunti!');
                }}
                variant="secondary"
              >
                📋 Copia Link
              </Button>
              
              {navigator.share && (
                <Button
                  onClick={() => {
                    const linkToShare = lastCreatedCard.isDraft ? lastCreatedCard.claimUrl : lastCreatedCard.redeemUrl;
                    const shareText = lastCreatedCard.isDraft ? 
                      `Compila i dati per la gift card di €${lastCreatedCard.amount}!` :
                      `Hai ricevuto una gift card di €${lastCreatedCard.amount}!`;
                    navigator.share({
                      title: 'Gift Card Tink Studio',
                      text: shareText,
                      url: linkToShare
                    });
                  }}
                  variant="secondary"
                >
                  📤 Condividi
              </Button>
              )}
              
              <Button
                onClick={() => setLastCreatedCard(null)}
                variant="secondary"
              >
                ✖️ Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateGiftCard;