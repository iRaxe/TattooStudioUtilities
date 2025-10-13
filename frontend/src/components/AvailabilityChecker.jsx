import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils/cookies';
import Button from './common/Button';
import Input from './common/Input';

function AvailabilityChecker({ onSlotSelect, tatuatori, stanze }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tatuatoreId, setTatuatoreId] = useState('');
  const [stanzaId, setStanzaId] = useState('');
  const [durataMinuti, setDurataMinuti] = useState(60);

  const [disponibilita, setDisponibilita] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carica disponibilità quando cambiano i parametri
  useEffect(() => {
    if (tatuatoreId && stanzaId && selectedDate) {
      fetchDisponibilita();
    }
  }, [tatuatoreId, stanzaId, selectedDate, durataMinuti]);

  const fetchDisponibilita = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getCookie('adminToken');
      const response = await fetch(
        `/api/admin/disponibilita?tatuatore_id=${tatuatoreId}&stanza_id=${stanzaId}&data=${selectedDate}&durata_minuti=${durataMinuti}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Errore nel recupero disponibilità');
      }

      const data = await response.json();
      setDisponibilita(data);
    } catch (error) {
      console.error('Errore nel caricamento disponibilità:', error);
      setError('Errore nel caricamento della disponibilità');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotClick = (slot) => {
    if (slot.disponibile) {
      onSlotSelect?.(slot.orario_inizio, durataMinuti);
    }
  };

  const getSlotColor = (slot) => {
    if (!slot.disponibile) {
      return {
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid rgba(239, 68, 68, 0.5)',
        color: '#fca5a5'
      };
    }

    // Evidenzia slot attuali
    const now = new Date();
    const slotTime = new Date(slot.orario_inizio);
    const isCurrentSlot = now >= slotTime && now < new Date(slot.orario_fine);

    if (isCurrentSlot) {
      return {
        background: 'rgba(245, 158, 11, 0.3)',
        border: '2px solid rgba(245, 158, 11, 0.7)',
        color: '#fbbf24'
      };
    }

    return {
      background: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      color: '#4ade80',
      cursor: 'pointer'
    };
  };

  const formatSlotTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedTatuatore = tatuatori.find(t => t.id === tatuatoreId);
  const selectedStanza = stanze.find(s => s.id === stanzaId);

  return (
    <div>
      <h3 className="section-title">
        <i className="fas fa-clock"></i> Verifica Disponibilità
      </h3>
      <p className="section-description">
        Controlla la disponibilità in tempo reale e seleziona slot per creare appuntamenti
      </p>

      {/* Controlli */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        marginBottom: '2rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
      }}>
        <div>
          <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            Data *
          </label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            disabled={loading}
          />
        </div>

        <div>
          <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            Tatuatore *
          </label>
          <select
            value={tatuatoreId}
            onChange={(e) => setTatuatoreId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#f3f4f6',
              fontSize: '0.9rem'
            }}
            disabled={loading}
          >
            <option value="">Seleziona tatuatore...</option>
            {tatuatori.map(tatuatore => (
              <option key={tatuatore.id} value={tatuatore.id}>
                {tatuatore.nome} {tatuatore.attivo ? '' : '(Disattivo)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            Stanza *
          </label>
          <select
            value={stanzaId}
            onChange={(e) => setStanzaId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#f3f4f6',
              fontSize: '0.9rem'
            }}
            disabled={loading}
          >
            <option value="">Seleziona stanza...</option>
            {stanze.map(stanza => (
              <option key={stanza.id} value={stanza.id}>
                {stanza.nome} {stanza.no_overbooking ? '(No Overbooking)' : ''}
                {stanza.attivo ? '' : ' (Disattiva)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
            Durata Appuntamento
          </label>
          <select
            value={durataMinuti}
            onChange={(e) => setDurataMinuti(parseInt(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              color: '#f3f4f6',
              fontSize: '0.9rem'
            }}
            disabled={loading}
          >
            <option value={15}>15 minuti</option>
            <option value={30}>30 minuti</option>
            <option value={60}>1 ora</option>
            <option value={90}>1 ora 30 min</option>
            <option value={120}>2 ore</option>
            <option value={180}>3 ore</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            Verifica disponibilità in corso
          </div>
          Stiamo recuperando gli slot disponibili, attendi qualche istante.
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#ef4444',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 600 }}>
            Si è verificato un errore
          </div>
          {error}
        </div>
      )}

      {/* Risultati disponibilità */}
      {disponibilita && !loading && !error && (
        <div>
          {/* Riepilogo */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '0.5rem' }}>
                {disponibilita.slots_disponibili}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Slot Disponibili</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                {disponibilita.total_slots}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Slot Totali</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>
                {Math.round((disponibilita.slots_disponibili / disponibilita.total_slots) * 100)}%
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Disponibilità</div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
                {selectedTatuatore?.nome} - {selectedStanza?.nome}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                {new Date(selectedDate).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>

          {/* Griglia slot */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '0.5rem',
              padding: '1rem'
            }}>
              {disponibilita.slots.map((slot, index) => (
                <div
                  key={index}
                  onClick={() => handleSlotClick(slot)}
                  style={{
                    ...getSlotColor(slot),
                    borderRadius: '4px',
                    padding: '0.75rem',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (slot.disponibile) {
                      e.target.style.transform = 'scale(1.05)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    {formatSlotTime(slot.orario_inizio)}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {slot.disponibile ? 'Disponibile' : 'Occupato'}
                  </div>

                  {/* Indicatore conflitti */}
                  {slot.conflicts && slot.conflicts.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      width: '12px',
                      height: '12px',
                      background: '#f59e0b',
                      borderRadius: '50%',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                    title={`Conflitto: ${slot.conflicts.map(c => c.tatuatore_nome).join(', ')}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dettagli slot */}
          {disponibilita.slots.length > 0 && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h4 style={{ color: '#fbbf24', marginBottom: '0.5rem', fontSize: '1rem' }}>
                <i className="fas fa-info-circle"></i> Dettagli Slot
              </h4>
              <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
                Orario lavorativo: 09:00 - 21:00 •
                Slot: 15 minuti •
                Durata selezionata: {durataMinuti} minuti
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messaggio quando non ci sono parametri */}
      {!tatuatoreId || !stanzaId || !selectedDate ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h4 style={{ color: '#f3f4f6', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
            Seleziona parametri
          </h4>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Seleziona tatuatore, stanza e data per visualizzare la disponibilità
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default AvailabilityChecker;