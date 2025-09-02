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
    if (!firstName.trim()) {
      setError('Inserisci il nome');
      return;
    }
    if (!lastName.trim()) {
      setError('Inserisci il cognome');
      return;
    }
    if (!phone.trim()) {
      setError('Inserisci il numero di telefono');
      return;
    }
    if (!/^\d+$/.test(phone.trim())) {
      setError('Il telefono deve contenere solo numeri');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getCookie('adminToken');
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
          code: data.code
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
    } catch (error) {
      console.error('Create draft error:', error);
      setError('Errore di connessione al server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!lastCreatedCard && (
        <>
          <h3 className="section-title"><i className="fas fa-plus"></i> Crea Gift Card</h3>
          <p className="section-description">
            Crea una gift card completa con landing page personalizzata e animata per il cliente
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
              disabled={loading || !firstName || !lastName || !phone || !amount}
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
          <h3 className="section-title"><i className="fas fa-check-circle"></i> Gift Card Creata con Successo!</h3>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '4px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
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
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f9fafb' }}>Landing Page Personalizzata:</div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#fbbf24'
              }}>
                {lastCreatedCard.redeemUrl}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem', fontStyle: 'italic' }}>
                🎁 Condividi questo link con il cliente per una esperienza gift card personalizzata e animata
              </div>
            </div>
            
            <div className="flex gap-md flex-wrap">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(lastCreatedCard.redeemUrl);
                  alert('Link copiato negli appunti!');
                }}
                variant="secondary"
              >
                📋 Copia Link
              </Button>
              
              {navigator.share && (
                <Button
                  onClick={() => {
                    navigator.share({
                      title: 'Gift Card Tink Studio',
                      text: `Hai ricevuto una gift card di €${lastCreatedCard.amount}!`,
                      url: lastCreatedCard.redeemUrl
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