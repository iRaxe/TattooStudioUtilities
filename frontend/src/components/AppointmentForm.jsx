import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Alert from './common/Alert';
import Textarea from './common/Textarea';

function AppointmentForm({ appointment, onSave, onCancel, tatuatori, stanze }) {
  // Stato del form
  const [formData, setFormData] = useState({
    tatuatore_id: '',
    stanza_id: '',
    cliente_telefono: '',
    cliente_nome: '',
    orario_inizio: '',
    durata_minuti: 60,
    note: '',
    stato: 'confermato'
  });

  // Stato per ricerca cliente
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [clienteSuggestions, setClienteSuggestions] = useState([]);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);

  // Stato per verifica disponibilità
  const [disponibilita, setDisponibilita] = useState(null);
  const [loadingDisponibilita, setLoadingDisponibilita] = useState(false);

  // Stati UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Popola form se è modifica
  useEffect(() => {
    if (appointment) {
      setFormData({
        tatuatore_id: appointment.tatuatore_id || '',
        stanza_id: appointment.stanza_id || '',
        cliente_telefono: appointment.cliente_telefono || '',
        cliente_nome: appointment.cliente_nome || '',
        orario_inizio: appointment.orario_inizio ?
          new Date(appointment.orario_inizio).toISOString().slice(0, 16) : '',
        durata_minuti: appointment.durata_minuti || 60,
        note: appointment.note || '',
        stato: appointment.stato || 'confermato'
      });
    }
  }, [appointment]);

  // Verifica disponibilità quando cambiano i parametri
  useEffect(() => {
    if (formData.tatuatore_id && formData.stanza_id && formData.orario_inizio) {
      checkDisponibilita();
    }
  }, [formData.tatuatore_id, formData.stanza_id, formData.orario_inizio, formData.durata_minuti]);

  // Ricerca clienti per telefono
  const searchClienti = async (telefono) => {
    if (!telefono || telefono.length < 3) {
      setClienteSuggestions([]);
      return;
    }

    try {
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/customers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const filtered = data.customers.filter(cliente =>
          cliente.phone && cliente.phone.includes(telefono)
        ).slice(0, 5); // Limita a 5 risultati

        setClienteSuggestions(filtered);
        setShowClienteSuggestions(true);
      }
    } catch (error) {
      console.error('Errore ricerca clienti:', error);
    }
  };

  // Verifica disponibilità
  const checkDisponibilita = async () => {
    if (!formData.tatuatore_id || !formData.stanza_id || !formData.orario_inizio) {
      return;
    }

    setLoadingDisponibilita(true);
    try {
      const token = getCookie('adminToken');
      const dataFormatted = formData.orario_inizio.split('T')[0]; // Solo data YYYY-MM-DD

      const response = await fetch(
        `/api/admin/disponibilita?tatuatore_id=${formData.tatuatore_id}&stanza_id=${formData.stanza_id}&data=${dataFormatted}&durata_minuti=${formData.durata_minuti}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDisponibilita(data);
      }
    } catch (error) {
      console.error('Errore verifica disponibilità:', error);
    } finally {
      setLoadingDisponibilita(false);
    }
  };

  // Gestione ricerca clienti
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (clienteSearchTerm) {
        searchClienti(clienteSearchTerm);
      } else {
        setShowClienteSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [clienteSearchTerm]);

  // Gestione selezione cliente
  const handleClienteSelect = (cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente_telefono: cliente.phone,
      cliente_nome: `${cliente.first_name} ${cliente.last_name}`
    }));
    setClienteSearchTerm(cliente.phone);
    setShowClienteSuggestions(false);
  };

  // Gestione submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validazione
    const errors = [];
    if (!formData.tatuatore_id) errors.push('Seleziona un tatuatore');
    if (!formData.stanza_id) errors.push('Seleziona una stanza');
    if (!formData.orario_inizio) errors.push('Seleziona data e ora');
    if (!formData.durata_minuti || formData.durata_minuti < 15) errors.push('Durata minima 15 minuti');

    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getCookie('adminToken');
      const url = appointment ?
        `/api/admin/appuntamenti/${appointment.id}` :
        '/api/admin/appuntamenti';

      const method = appointment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.conflicts && data.conflicts.length > 0) {
          // Mostra conflitti ma permetti di procedere
          const conflictMsg = data.conflicts.map(c =>
            `${c.tatuatore_nome} in ${c.stanza_nome} dalle ${new Date(c.orario_inizio).toLocaleTimeString('it-IT')} per ${c.durata_minuti} min`
          ).join(', ');
          setError(`Conflitto rilevato: ${conflictMsg}. Procedere comunque?`);
          return; // Non chiudere il form, permettere di riprovare
        }
        throw new Error(data.error || 'Errore nel salvataggio appuntamento');
      }

      setSuccess(appointment ? 'Appuntamento aggiornato con successo!' : 'Appuntamento creato con successo!');

      // Chiudi form dopo breve delay
      setTimeout(() => {
        onSave?.();
      }, 1500);

    } catch (error) {
      console.error('Errore salvataggio:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Gestione cambiamenti input
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Pulisci messaggi quando utente modifica
    if (error) setError('');
    if (success) setSuccess('');
  };

  const selectedTatuatore = tatuatori.find(t => t.id === formData.tatuatore_id);
  const selectedStanza = stanze.find(s => s.id === formData.stanza_id);

  return (
    <div>
      <h3 className="section-title">
        <i className="fas fa-calendar-plus"></i>
        {appointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))'
        }}>
          {/* Selezione Tatuatore */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Tatuatore *
            </label>
            <select
              value={formData.tatuatore_id}
              onChange={(e) => handleInputChange('tatuatore_id', e.target.value)}
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

          {/* Selezione Stanza */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Stanza *
            </label>
            <select
              value={formData.stanza_id}
              onChange={(e) => handleInputChange('stanza_id', e.target.value)}
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

          {/* Ricerca Cliente */}
          <div style={{ position: 'relative' }}>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Telefono Cliente
            </label>
            <Input
              type="tel"
              value={clienteSearchTerm}
              onChange={(e) => setClienteSearchTerm(e.target.value.replace(/\D/g, ''))}
              placeholder="Cerca per telefono..."
              disabled={loading}
            />

            {/* Suggerimenti clienti */}
            {showClienteSuggestions && clienteSuggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                marginTop: '0.25rem',
                zIndex: 1000,
                backdropFilter: 'blur(10px)',
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {clienteSuggestions.map(cliente => (
                  <div
                    key={cliente.phone}
                    onClick={() => handleClienteSelect(cliente)}
                    style={{
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>
                      {cliente.first_name} {cliente.last_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      📞 {cliente.phone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nome Cliente */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Nome Cliente
            </label>
            <Input
              type="text"
              value={formData.cliente_nome}
              onChange={(e) => handleInputChange('cliente_nome', e.target.value)}
              placeholder="Nome del cliente"
              disabled={loading}
            />
          </div>

          {/* Data e Ora */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Data e Ora Inizio *
            </label>
            <Input
              type="datetime-local"
              value={formData.orario_inizio}
              onChange={(e) => handleInputChange('orario_inizio', e.target.value)}
              disabled={loading}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          {/* Durata */}
          <div>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Durata (minuti) *
            </label>
            <select
              value={formData.durata_minuti}
              onChange={(e) => handleInputChange('durata_minuti', parseInt(e.target.value))}
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
              <option value={240}>4 ore</option>
            </select>
          </div>

          {/* Stato (solo per modifica) */}
          {appointment && (
            <div>
              <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
                Stato
              </label>
              <select
                value={formData.stato}
                onChange={(e) => handleInputChange('stato', e.target.value)}
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
                <option value="confermato">Confermato</option>
                <option value="in_corso">In Corso</option>
                <option value="completato">Completato</option>
                <option value="cancellato">Cancellato</option>
              </select>
            </div>
          )}

          {/* Note */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>
              Note
            </label>
            <Textarea
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Note aggiuntive sull'appuntamento..."
              style={{
                minHeight: '100px',
                resize: 'vertical'
              }}
              disabled={loading}
            />
          </div>
        </div>

        {/* Verifica Disponibilità */}
        {loadingDisponibilita && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'rgba(251, 191, 36, 0.1)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ color: '#fbbf24' }}>Verifica disponibilità in corso...</div>
          </div>
        )}

        {disponibilita && !loadingDisponibilita && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: disponibilita.slots_disponibili > 0 ?
              'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${disponibilita.slots_disponibili > 0 ?
              'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '4px'
          }}>
            <div style={{
              color: disponibilita.slots_disponibili > 0 ? '#22c55e' : '#ef4444',
              fontWeight: '600'
            }}>
              {disponibilita.slots_disponibili > 0 ?
                `✅ Disponibile (${disponibilita.slots_disponibili} slot liberi)` :
                '❌ Non disponibile'
              }
            </div>

            {disponibilita.conflicts && disponibilita.conflicts.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ color: '#f59e0b', fontWeight: '600' }}>⚠️ Conflitti rilevati:</div>
                {disponibilita.conflicts.map((conflict, index) => (
                  <div key={index} style={{ color: '#f3f4f6', marginTop: '0.25rem' }}>
                    {conflict.tatuatore_nome} in {conflict.stanza_nome} dalle{' '}
                    {new Date(conflict.orario_inizio).toLocaleTimeString('it-IT')}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messaggi di errore e successo */}
        {error && (
          <Alert type="error" style={{ marginTop: '1rem' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" style={{ marginTop: '1rem' }}>
            {success}
          </Alert>
        )}

        {/* Pulsanti */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem',
          justifyContent: 'flex-end'
        }}>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.tatuatore_id || !formData.stanza_id || !formData.orario_inizio}
          >
            {loading ? '💾 Salvataggio...' : appointment ? '💾 Aggiorna' : '💾 Salva'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default AppointmentForm;