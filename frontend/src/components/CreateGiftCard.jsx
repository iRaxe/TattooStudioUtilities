import React, { useState } from 'react';

import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Alert from './common/Alert';

function CreateGiftCard({ onGiftCardCreated, onStatsUpdate }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreatedCard, setLastCreatedCard] = useState(null);

  const handleCreateDraft = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = getCookie('adminToken');
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
          claimToken: data.claim_token
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
          <h3 className="section-title">➕ Crea Gift Card</h3>
          <p className="section-description">
            Crea una bozza di gift card che potrà essere personalizzata dal destinatario
          </p>
        
          <div className="input-section">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Importo in Euro (es. 50.00)"
              disabled={loading}
            />
            <Button
              onClick={handleCreateDraft}
              disabled={loading || !amount}
              className="full-width-button"
            >
              {loading ? 'Creazione in corso...' : 'Crea Bozza Gift Card'}
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
          <h3 className="section-title">✅ Gift Card Creata con Successo!</h3>
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                Importo: €{lastCreatedCard.amount}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                ID Bozza: {lastCreatedCard.draftId}
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f9fafb' }}>Link di condivisione:</div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '0.75rem',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                color: '#fbbf24'
              }}>
                {lastCreatedCard.claimUrl}
              </div>
            </div>
            
            <div className="flex gap-md flex-wrap">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(lastCreatedCard.claimUrl);
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
                      url: lastCreatedCard.claimUrl
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