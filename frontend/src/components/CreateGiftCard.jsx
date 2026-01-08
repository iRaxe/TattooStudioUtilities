import React, { useState } from 'react';
import { CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/solid';

import { getCookie } from '../utils/cookies';
import { copyToClipboard, shareLink } from '../utils/clipboard';
import Input from './common/Input';
import Button from './common/Button';
import Alert from './common/Alert';

function CreateGiftCard({ onGiftCardCreated, onStatsUpdate }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [amount, setAmount] = useState('');
  const [hideAmount, setHideAmount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastCreatedCard, setLastCreatedCard] = useState(null);
  const hiddenDepositMessage = 'Acconto tatuaggio registrato.';

  const resolveCardKind = (kind) => (kind === 'deposit' ? 'deposit' : 'gift');

  const buildCardLabels = (kind) => {
    const isDeposit = resolveCardKind(kind) === 'deposit';
    return {
      cardName: isDeposit ? 'Acconto' : 'Gift Card',
      draftTitle: isDeposit ? 'Link Acconto Generato!' : 'Link Gift Card Generato!',
      completeTitle: isDeposit ? 'Acconto Creato con Successo!' : 'Gift Card Creata con Successo!',
      draftLinkLabel: isDeposit ? "Link per completare l'acconto:" : 'Link per chi regala:',
      completeLinkLabel: isDeposit ? 'Riepilogo Acconto:' : 'Landing Page Personalizzata:',
      draftSuggestion: isDeposit
        ? "Suggerimento: condividi questo link con il cliente per completare i dati dell'acconto"
        : 'Suggerimento: condividi questo link con chi regala la gift card. Dovra compilare i dati del festeggiato',
      completeSuggestion: isDeposit
        ? "Suggerimento: condividi questo link con il cliente come ricevuta dell'acconto"
        : 'Suggerimento: condividi questo link con il cliente per una esperienza gift card personalizzata e animata',
      shareTitle: isDeposit ? 'Acconto Tink Studio' : 'Gift Card Tink Studio',
      draftIdLabel: isDeposit ? 'ID Bozza Acconto' : 'ID Bozza',
      completeIdLabel: isDeposit ? 'ID Acconto' : 'ID Gift Card'
    };
  };
  const hiddenGiftMessage = 'Ti è stata regalata una seduta tattoo';

  const handleCreateGiftCard = async (kind = 'gift') => {
    // Validazione importo (sempre obbligatorio)
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }

    const cardKind = resolveCardKind(kind);
    const cardLabelMessage = cardKind === 'deposit' ? 'un acconto completo' : 'una gift card completa';
    const notes = cardKind === 'deposit' ? 'acconto' : null;
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();
    const trimmedSenderName = senderName.trim();

    // Determina se creare una bozza o una gift card completa
    const hasRequiredFields = trimmedFirstName && trimmedLastName;
    const hasOnlyAmount = !trimmedFirstName && !trimmedLastName && !trimmedPhone && !trimmedSenderName;

    // Se ci sono alcuni campi ma non tutti, mostra errore
    if (!hasRequiredFields && !hasOnlyAmount) {
      setError(`Compila nome e cognome (telefono e mittente opzionali) per creare ${cardLabelMessage}, oppure lascia vuoti tutti i campi per generare solo un link`);
      return;
    }

    // Validazione telefono se presente
    if (trimmedPhone && !/^\d+$/.test(trimmedPhone)) {
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
          body: JSON.stringify({ amount: parseFloat(amount), hideAmount, notes })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Draft creation successful:', data);
          const newCard = {
            amount: parseFloat(amount),
            claimUrl: data.claim_url,
            draftId: data.draft_id,
            claimToken: data.claim_token,
            hideAmount,
            isDraft: true,
            kind: cardKind
          };

          console.log('Setting lastCreatedCard:', newCard);
          setLastCreatedCard(newCard);
          setAmount('');
          setHideAmount(false);

          // Notify parent components
          if (onGiftCardCreated) onGiftCardCreated();
          if (onStatsUpdate) onStatsUpdate();

          // Copy link to clipboard automatically
          if (data.claim_url) {
            const copied = await copyToClipboard(data.claim_url);
            console.log('Link copied to clipboard:', data.claim_url, copied ? 'success' : 'failed');
          }
        } else {
          console.error('Draft creation failed:', data);
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
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            phone: trimmedPhone || null,
            senderName: cardKind === 'gift' ? (trimmedSenderName || null) : null,
            amount: parseFloat(amount),
            hideAmount,
            notes
          })
        });

        const data = await response.json();

        if (response.ok) {
          console.log('Complete gift card creation successful:', data);
          const newCard = {
            firstName: trimmedFirstName,
            lastName: trimmedLastName,
            phone: trimmedPhone || null,
            senderName: cardKind === 'gift' ? (trimmedSenderName || null) : null,
            amount: parseFloat(amount),
            redeemUrl: data.redeem_url,
            giftCardId: data.gift_card_id,
            code: data.code,
            hideAmount,
            isDraft: false,
            kind: cardKind
          };

          console.log('Setting lastCreatedCard for complete card:', newCard);
          setLastCreatedCard(newCard);
          setFirstName('');
          setLastName('');
          setPhone('');
          setSenderName('');
          setAmount('');
          setHideAmount(false);

          // Notify parent components
          if (onGiftCardCreated) onGiftCardCreated();
          if (onStatsUpdate) onStatsUpdate();

          // Copy link to clipboard automatically
          if (data.redeem_url) {
            const copied = await copyToClipboard(data.redeem_url);
            console.log('Redeem URL copied to clipboard:', data.redeem_url, copied ? 'success' : 'failed');
          }
        } else {
          console.error('Complete gift card creation failed:', data);
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

  const activeCardLabels = buildCardLabels(lastCreatedCard?.kind);
  const isDepositCard = resolveCardKind(lastCreatedCard?.kind) === 'deposit';

  return (
    <div style={{ marginBottom: '2rem' }}>
      {!lastCreatedCard && (
        <>
          <h3 className="section-title"><PlusCircleIcon className="section-title-icon" aria-hidden="true" /> Crea Gift Card</h3>
          <p className="section-description">
            <strong>Solo importo:</strong> Genera un link per chi regala la gift card<br/>
            <strong>Nome e cognome:</strong> Crea una gift card completa con landing page personalizzata (telefono e mittente opzionali)<br/>
            <strong>Acconto:</strong> Registra un pagamento anticipato del tatuaggio (non e un regalo)
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
               placeholder="Inserisci il numero di telefono (opzionale)"
               disabled={loading}
             />
             <Input
               type="text"
               value={senderName}
               onChange={(e) => setSenderName(e.target.value)}
               placeholder="Inserisci il mittente (opzionale)"
               disabled={loading}
             />
             <div className="gift-card-amount-row">
               <Input
                 type="number"
                 step="0.01"
                 min="0"
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0.00"
                 disabled={loading}
                 className="gift-card-amount-input"
               />
               <label className="gift-card-hide-toggle">
                 <input
                   type="checkbox"
                   checked={hideAmount}
                   onChange={(e) => setHideAmount(e.target.checked)}
                   disabled={loading}
                 />
                 <span>Nascondi valore</span>
               </label>
             </div>
            <div className="flex gap-md flex-wrap">
              <Button
                onClick={() => handleCreateGiftCard('gift')}
                disabled={loading || !amount}
                className="flex-1 w-full"
              >
                {loading ? 'Creazione in corso...' : 'Crea Gift Card'}
              </Button>
              <Button
                onClick={() => handleCreateGiftCard('deposit')}
                disabled={loading || !amount}
                className="flex-1 w-full"
                variant="secondary"
              >
                {loading ? 'Creazione in corso...' : 'Crea Acconto'}
              </Button>
            </div>
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
            <CheckCircleIcon className="section-title-icon" aria-hidden="true" />
            {' '}
            {lastCreatedCard.isDraft ? activeCardLabels.draftTitle : activeCardLabels.completeTitle}
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
                    {activeCardLabels.draftIdLabel}: {lastCreatedCard.draftId}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Cliente: {lastCreatedCard.firstName} {lastCreatedCard.lastName}
                  </div>
                  {lastCreatedCard.phone && (
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                      Telefono: {lastCreatedCard.phone}
                    </div>
                  )}
                  <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#86efac', marginBottom: '0.5rem' }}>
                    Importo: €{lastCreatedCard.amount}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    {activeCardLabels.completeIdLabel}: {lastCreatedCard.giftCardId}
                  </div>
                </>
              )}
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#f9fafb' }}>
                {lastCreatedCard.isDraft ? activeCardLabels.draftLinkLabel : activeCardLabels.completeLinkLabel}
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
                {lastCreatedCard.isDraft
                  ? activeCardLabels.draftSuggestion
                  : activeCardLabels.completeSuggestion}
              </div>
            </div>

            <div className="flex gap-md flex-wrap">
              <Button
                onClick={async () => {
                  const linkToCopy = lastCreatedCard.isDraft ? lastCreatedCard.claimUrl : lastCreatedCard.redeemUrl;
                  const copied = await copyToClipboard(linkToCopy);
                  if (copied) {
                    alert('Link copiato negli appunti!');
                  } else {
                    alert(`Impossibile copiare automaticamente il link.\nCopialo manualmente:\n\n${linkToCopy}`);
                  }
                }}
                variant="secondary"
              >
                Copia link
              </Button>

              <Button
                onClick={async () => {
                  const linkToShare = lastCreatedCard.isDraft ? lastCreatedCard.claimUrl : lastCreatedCard.redeemUrl;
                  const shareText = isDepositCard
                    ? (lastCreatedCard.hideAmount
                      ? (lastCreatedCard.isDraft ? 'Compila i dati per l\'acconto.' : hiddenDepositMessage)
                      : (lastCreatedCard.isDraft
                        ? `Compila i dati per l'acconto di €${lastCreatedCard.amount}!`
                        : `Acconto tatuaggio di €${lastCreatedCard.amount} registrato.`))
                    : (lastCreatedCard.hideAmount
                      ? (lastCreatedCard.isDraft ? 'Compila i dati per la gift card.' : hiddenGiftMessage)
                      : (lastCreatedCard.isDraft
                        ? `Compila i dati per la gift card di €${lastCreatedCard.amount}!`
                        : `Hai ricevuto una gift card di €${lastCreatedCard.amount}!`));
                  const result = await shareLink({
                    title: activeCardLabels.shareTitle,
                    text: shareText,
                    url: linkToShare
                  });
                  if (result === 'copied') {
                    alert('Condivisione non disponibile su questo dispositivo.\nLink copiato negli appunti!');
                  } else if (result === 'failed') {
                    alert(`Impossibile condividere automaticamente il link.\nCopialo manualmente:\n\n${linkToShare}`);
                  }
                }}
                variant="secondary"
              >
                Condividi
              </Button>

              <Button
                onClick={() => setLastCreatedCard(null)}
                variant="secondary"
              >
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateGiftCard;
