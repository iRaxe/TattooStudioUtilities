import React, { useState, useEffect, useMemo } from 'react';
import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';
import Alert from './common/Alert';
import AppointmentForm from './AppointmentForm';
import AppointmentCalendar from './AppointmentCalendar';
import AvailabilityChecker from './AvailabilityChecker';

function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Stati per filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [tatuatoreFilter, setTatuatoreFilter] = useState('');
  const [stanzaFilter, setStanzaFilter] = useState('');
  const [statoFilter, setStatoFilter] = useState('');
  const [dataInizioFilter, setDataInizioFilter] = useState('');
  const [dataFineFilter, setDataFineFilter] = useState('');

  // Stati per dati di supporto
  const [tatuatori, setTatuatori] = useState([]);
  const [stanze, setStanze] = useState([]);

  // Stato per colonne visibili
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    tatuatore: true,
    stanza: true,
    cliente: true,
    dataOra: true,
    durata: true,
    stato: true,
    note: true,
    azioni: true
  });

  // Carica dati iniziali
  useEffect(() => {
    fetchAppointments();
    fetchTatuatori();
    fetchStanze();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getCookie('adminToken');
      const queryParams = new URLSearchParams();

      if (tatuatoreFilter) queryParams.append('tatuatore_id', tatuatoreFilter);
      if (stanzaFilter) queryParams.append('stanza_id', stanzaFilter);
      if (statoFilter) queryParams.append('stato', statoFilter);
      if (dataInizioFilter) queryParams.append('data_inizio', dataInizioFilter);
      if (dataFineFilter) queryParams.append('data_fine', dataFineFilter);

      const response = await fetch(`/api/admin/appuntamenti?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nel recupero appuntamenti');
      }

      const data = await response.json();
      setAppointments(data.appuntamenti || []);
    } catch (error) {
      console.error('Errore nel caricamento appuntamenti:', error);
      setError('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

  const fetchTatuatori = async () => {
    try {
      console.log('[DEBUG] Caricamento tatuatori...');
      const token = getCookie('adminToken');
      const apiUrl = '/api/admin/tatuatori';
      console.log('[DEBUG] API URL tatuatori:', apiUrl);
      console.log('[DEBUG] Token presente:', !!token);
      console.log('[DEBUG] Headers:', {
        'Authorization': `Bearer ${token ? '***PRESENT***' : 'MISSING'}`
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[DEBUG] Response status tatuatori:', response.status);
      console.log('[DEBUG] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Dati tatuatori ricevuti:', data);
        console.log('[DEBUG] Numero tatuatori:', data.tatuatori?.length || 0);
        console.log('[DEBUG] Lista tatuatori:', data.tatuatori || []);
        setTatuatori(data.tatuatori || []);
        console.log('[DEBUG] Tatuatori impostati nello stato');
      } else {
        console.log('[DEBUG] Errore response tatuatori:', response.statusText);
        console.log('[DEBUG] Response headers tatuatori:', Object.fromEntries(response.headers.entries()));
        const errorText = await response.text();
        console.log('[DEBUG] Errore dettagliato tatuatori:', errorText);

        // Controlla errori CORS e permessi
        if (response.status === 0) {
          console.error('[DEBUG] ERRORE CORS: La richiesta Ã¨ stata bloccata dal browser');
        } else if (response.status === 401) {
          console.error('[DEBUG] ERRORE AUTENTICAZIONE: Token non valido o mancante');
        } else if (response.status === 403) {
          console.error('[DEBUG] ERRORE PERMESSI: Accesso negato all\'endpoint');
        } else if (response.status >= 500) {
          console.error('[DEBUG] ERRORE SERVER: Problema interno del server');
        }
      }
    } catch (error) {
      console.error('[DEBUG] Errore nel caricamento tatuatori:', error);
      console.error('[DEBUG] Errore stack:', error.stack);

      // Controlla errori di rete specifici
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('[DEBUG] ERRORE DI RETE: Impossibile raggiungere il server');
        console.error('[DEBUG] Verifica che il backend sia in esecuzione');
      }
    }
  };

  const fetchStanze = async () => {
    try {
      console.log('[DEBUG] Caricamento stanze...');
      const token = getCookie('adminToken');
      const apiUrl = '/api/admin/stanze';
      console.log('[DEBUG] API URL stanze:', apiUrl);
      console.log('[DEBUG] Token presente:', !!token);
      console.log('[DEBUG] Headers:', {
        'Authorization': `Bearer ${token ? '***PRESENT***' : 'MISSING'}`
      });

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[DEBUG] Response status stanze:', response.status);
      console.log('[DEBUG] Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Dati stanze ricevuti:', data);
        console.log('[DEBUG] Numero stanze:', data.stanze?.length || 0);
        console.log('[DEBUG] Lista stanze:', data.stanze || []);
        setStanze(data.stanze || []);
        console.log('[DEBUG] Stanze impostate nello stato');
      } else {
        console.log('[DEBUG] Errore response stanze:', response.statusText);
        console.log('[DEBUG] Response headers stanze:', Object.fromEntries(response.headers.entries()));
        const errorText = await response.text();
        console.log('[DEBUG] Errore dettagliato stanze:', errorText);

        // Controlla errori CORS e permessi
        if (response.status === 0) {
          console.error('[DEBUG] ERRORE CORS: La richiesta Ã¨ stata bloccata dal browser');
        } else if (response.status === 401) {
          console.error('[DEBUG] ERRORE AUTENTICAZIONE: Token non valido o mancante');
        } else if (response.status === 403) {
          console.error('[DEBUG] ERRORE PERMESSI: Accesso negato all\'endpoint');
        } else if (response.status >= 500) {
          console.error('[DEBUG] ERRORE SERVER: Problema interno del server');
        }
      }
    } catch (error) {
      console.error('[DEBUG] Errore nel caricamento stanze:', error);
      console.error('[DEBUG] Errore stack:', error.stack);

      // Controlla errori di rete specifici
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('[DEBUG] ERRORE DI RETE: Impossibile raggiungere il server');
        console.error('[DEBUG] Verifica che il backend sia in esecuzione');
      }
    }
  };

  const handleOpenSettings = () => {
    setSettingsTab('tatuatori');
    setTatuatoriFeedback(null);
    setStanzeFeedback(null);
    fetchTatuatori();
    fetchStanze();
    setShowSettingsModal(true);
  };

  const handleCloseSettings = () => {
    setShowSettingsModal(false);
    setSettingsTab('tatuatori');
  };

  const handleCreateTatuatore = async () => {
    const nome = newTatuatoreNome.trim();

    if (!nome) {
      setTatuatoriFeedback({ type: 'danger', message: 'Inserisci il nome del tatuatore.' });
      return;
    }

    try {
      setIsCreatingTatuatore(true);
      setTatuatoriFeedback(null);
      const token = getCookie('adminToken');
      const response = await fetch('/api/admin/tatuatori', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nome })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nella creazione del tatuatore');
      }

      await fetchTatuatori();
      setNewTatuatoreNome('');
      setTatuatoriFeedback({ type: 'success', message: 'Tatuatore aggiunto con successo.' });
    } catch (error) {
      console.error('Errore creazione tatuatore:', error);
      setTatuatoriFeedback({ type: 'danger', message: error.message || 'Errore nella creazione del tatuatore.' });
    } finally {
      setIsCreatingTatuatore(false);
    }
  };

  const handleToggleTatuatore = async (id, attivoAttuale) => {
    try {
      setUpdatingTatuatoreId(id);
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/tatuatori/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attivo: !attivoAttuale })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nell\'aggiornamento del tatuatore');
      }

      const updated = await response.json();
      setTatuatori(prev => prev.map(t => (t.id === id ? { ...t, attivo: updated.attivo } : t)));
      setTatuatoriFeedback({
        type: 'success',
        message: `Tatuatore ${!attivoAttuale ? 'attivato' : 'disattivato'} con successo.`
      });
    } catch (error) {
      console.error('Errore aggiornamento tatuatore:', error);
      setTatuatoriFeedback({ type: 'danger', message: error.message || 'Errore nell\'aggiornamento del tatuatore.' });
    } finally {
      setUpdatingTatuatoreId(null);
    }
  };

  const handleCreateStanza = async () => {
    const nome = newStanzaNome.trim();

    if (!nome) {
      setStanzeFeedback({ type: 'danger', message: 'Inserisci il nome della stanza.' });
      return;
    }

    try {
      setIsCreatingStanza(true);
      setStanzeFeedback(null);
      const token = getCookie('adminToken');
      const response = await fetch('/api/admin/stanze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome,
          no_overbooking: newStanzaNoOverbooking
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nella creazione della stanza');
      }

      await fetchStanze();
      setNewStanzaNome('');
      setNewStanzaNoOverbooking(false);
      setStanzeFeedback({ type: 'success', message: 'Stanza aggiunta con successo.' });
    } catch (error) {
      console.error('Errore creazione stanza:', error);
      setStanzeFeedback({ type: 'danger', message: error.message || 'Errore nella creazione della stanza.' });
    } finally {
      setIsCreatingStanza(false);
    }
  };

  const handleToggleStanzaAttiva = async (id, attivoAttuale) => {
    try {
      setUpdatingStanzaId(id);
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/stanze/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ attivo: !attivoAttuale })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nell\'aggiornamento della stanza');
      }

      const updated = await response.json();
      setStanze(prev => prev.map(stanza => (
        stanza.id === id ? { ...stanza, attivo: updated.attivo } : stanza
      )));
      setStanzeFeedback({
        type: 'success',
        message: `Stanza ${!attivoAttuale ? 'attivata' : 'disattivata'} con successo.`
      });
    } catch (error) {
      console.error('Errore aggiornamento stanza:', error);
      setStanzeFeedback({ type: 'danger', message: error.message || 'Errore nell\'aggiornamento della stanza.' });
    } finally {
      setUpdatingStanzaId(null);
    }
  };

  const handleToggleStanzaNoOverbooking = async (id, statoAttuale) => {
    try {
      setUpdatingStanzaNoOverbookingId(id);
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/stanze/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ no_overbooking: !statoAttuale })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Errore nell\'aggiornamento della stanza');
      }

      const updated = await response.json();
      setStanze(prev => prev.map(stanza => (
        stanza.id === id ? { ...stanza, no_overbooking: updated.no_overbooking } : stanza
      )));
      setStanzeFeedback({
        type: 'success',
        message: `Impostazione overbooking ${!statoAttuale ? 'abilitata' : 'disabilitata'} con successo.`
      });
    } catch (error) {
      console.error('Errore aggiornamento stanza (overbooking):', error);
      setStanzeFeedback({ type: 'danger', message: error.message || 'Errore nell\'aggiornamento della stanza.' });
    } finally {
      setUpdatingStanzaNoOverbookingId(null);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!appointmentId) return;

    const confirmed = window.confirm('Sei sicuro di voler eliminare questo appuntamento?');
    if (!confirmed) return;

    try {
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/appuntamenti/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione appuntamento');
      }

      alert('Appuntamento eliminato con successo');
      fetchAppointments(); // Ricarica la lista
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert('Errore nell\'eliminazione dell\'appuntamento');
    }
  };

  // Filtro per ricerca testuale
  const filteredAppointments = appointments.filter(appointment => {
    if (!searchTerm?.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (appointment.cliente_nome && appointment.cliente_nome.toLowerCase().includes(searchLower)) ||
      (appointment.cliente_telefono && appointment.cliente_telefono.toLowerCase().includes(searchLower)) ||
      (appointment.tatuatore_nome && appointment.tatuatore_nome.toLowerCase().includes(searchLower)) ||
      (appointment.stanza_nome && appointment.stanza_nome.toLowerCase().includes(searchLower)) ||
      (appointment.note && appointment.note.toLowerCase().includes(searchLower))
    );
  });

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'confermato': return '#10b981';
      case 'completato': return '#059669';
      case 'cancellato': return '#ef4444';
      case 'in_corso': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatoLabel = (stato) => {
    switch (stato) {
      case 'confermato': return 'Confermato';
      case 'completato': return 'Completato';
      case 'cancellato': return 'Cancellato';
      case 'in_corso': return 'In Corso';
      default: return stato || 'Sconosciuto';
    }
  };

  const viewTabs = [
    { id: 'list', label: 'Lista', icon: 'fa-list' },
    { id: 'calendar', label: 'Calendario', icon: 'fa-calendar-alt' },
    { id: 'availability', label: 'Disponibilità', icon: 'fa-clock' }
  ];

  const summaryStats = useMemo(() => {
    const now = new Date();
    const total = appointments.length;
    const upcoming = appointments.filter((appointment) => {
      if (!appointment.orario_inizio) return false;
      return new Date(appointment.orario_inizio) >= now;
    }).length;

    const byStatus = appointments.reduce((acc, appointment) => {
      const key = appointment.stato || 'sconosciuto';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      upcoming,
      confirmed: byStatus.confermato || 0,
      cancelled: byStatus.cancellato || 0
    };
  }, [appointments]);

  const [currentView, setCurrentView] = useState('list'); // 'list', 'calendar', 'availability'
  const [filtersOpen, setFiltersOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFiltersOpen(window.innerWidth >= 992);
    }
  }, []);

  // Stati per modali
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('tatuatori');
  const [newTatuatoreNome, setNewTatuatoreNome] = useState('');
  const [newStanzaNome, setNewStanzaNome] = useState('');
  const [newStanzaNoOverbooking, setNewStanzaNoOverbooking] = useState(false);
  const [tatuatoriFeedback, setTatuatoriFeedback] = useState(null);
  const [stanzeFeedback, setStanzeFeedback] = useState(null);
  const [isCreatingTatuatore, setIsCreatingTatuatore] = useState(false);
  const [isCreatingStanza, setIsCreatingStanza] = useState(false);
  const [updatingTatuatoreId, setUpdatingTatuatoreId] = useState(null);
  const [updatingStanzaId, setUpdatingStanzaId] = useState(null);
  const [updatingStanzaNoOverbookingId, setUpdatingStanzaNoOverbookingId] = useState(null);

  return (
    <div className="appointments-page">
      <header className="appointments-header">
        <div className="appointments-header__text">
          <h3 className="section-title">
            <i className="fas fa-calendar-alt"></i> Gestione Appuntamenti
          </h3>
          <p className="section-description">
            Gestisci tutti gli appuntamenti con filtri avanzati e viste multiple
          </p>
        </div>
        <div className="appointments-header__actions">
          <Button
            variant="secondary"
            onClick={handleOpenSettings}
            className="appointments-action-btn"
          >
            <i className="fas fa-cogs"></i>
            Impostazioni
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="appointments-action-btn appointments-action-btn--primary"
          >
            <i className="fas fa-plus"></i>
            Crea appuntamento
          </Button>
        </div>
      </header>

      <section className="appointments-metrics" aria-label="Statistiche appuntamenti">
        <div className="appointments-metric-card">
          <span className="appointments-metric-label">Totale</span>
          <span className="appointments-metric-value">{summaryStats.total}</span>
        </div>
        <div className="appointments-metric-card">
          <span className="appointments-metric-label">In arrivo</span>
          <span className="appointments-metric-value">{summaryStats.upcoming}</span>
        </div>
        <div className="appointments-metric-card">
          <span className="appointments-metric-label">Confermati</span>
          <span className="appointments-metric-value">{summaryStats.confirmed}</span>
        </div>
        <div className="appointments-metric-card">
          <span className="appointments-metric-label">Cancellati</span>
          <span className="appointments-metric-value">{summaryStats.cancelled}</span>
        </div>
      </section>

      <div className="appointments-toolbar">
        <div className="appointments-view-tabs" role="tablist">
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`appointments-view-tab ${currentView === tab.id ? 'is-active' : ''}`}
              onClick={() => setCurrentView(tab.id)}
              role="tab"
              aria-selected={currentView === tab.id}
            >
              <i className={`fas ${tab.icon}`} aria-hidden="true"></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="appointments-toolbar__actions">
          <Button
            variant="secondary"
            onClick={fetchAppointments}
            className="appointments-toolbar__action hide-desktop"
            disabled={loading}
          >
            <i className="fas fa-sync-alt"></i>
            Aggiorna
          </Button>
          <Button
            variant="secondary"
            onClick={handleOpenSettings}
            className="appointments-toolbar__action hide-mobile"
          >
            <i className="fas fa-cogs"></i>
            Impostazioni
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="appointments-toolbar__action hide-mobile appointments-action-btn--primary"
          >
            <i className="fas fa-plus"></i>
            Nuovo
          </Button>
        </div>
      </div>

      <div className="appointments-content">
        {currentView === 'list' && (
          <>
            <section className="appointments-filter-card">
              <button
                type="button"
                className="appointments-filter-toggle"
                onClick={() => setFiltersOpen(prev => !prev)}
                aria-expanded={filtersOpen}
              >
                <div>
                  <i className="fas fa-sliders-h" aria-hidden="true"></i>
                  <span>Filtri</span>
                </div>
                <i className={`fas ${filtersOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true"></i>
              </button>

              {filtersOpen && (
                <div className="appointments-filters-grid">
                  <div className="filter-field">
                    <label>Ricerca libera</label>
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cliente, tatuatore, note..."
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-field">
                    <label>Tatuatore</label>
                    <select
                      value={tatuatoreFilter}
                      onChange={(e) => setTatuatoreFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tutti i tatuatori</option>
                      {tatuatori.map(tatuatore => (
                        <option key={tatuatore.id} value={tatuatore.id}>
                          {tatuatore.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Stanza</label>
                    <select
                      value={stanzaFilter}
                      onChange={(e) => setStanzaFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tutte le stanze</option>
                      {stanze.map(stanza => (
                        <option key={stanza.id} value={stanza.id}>
                          {stanza.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Stato</label>
                    <select
                      value={statoFilter}
                      onChange={(e) => setStatoFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Tutti gli stati</option>
                      <option value="confermato">Confermato</option>
                      <option value="in_corso">In Corso</option>
                      <option value="completato">Completato</option>
                      <option value="cancellato">Cancellato</option>
                    </select>
                  </div>
                  <div className="filter-field">
                    <label>Dal</label>
                    <Input
                      type="date"
                      value={dataInizioFilter}
                      onChange={(e) => setDataInizioFilter(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-field">
                    <label>Al</label>
                    <Input
                      type="date"
                      value={dataFineFilter}
                      onChange={(e) => setDataFineFilter(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                </div>
              )}

              <div className="appointments-filter-actions">
                <Button onClick={fetchAppointments} disabled={loading}>
                  {loading ? 'Caricamento...' : 'Applica filtri'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearchTerm('');
                    setTatuatoreFilter('');
                    setStanzaFilter('');
                    setStatoFilter('');
                    setDataInizioFilter('');
                    setDataFineFilter('');
                  }}
                >
                  Cancella filtri
                </Button>
                <div className="appointments-column-picker">
                  <Button
                    variant="secondary"
                    onClick={() => setShowColumnFilter(!showColumnFilter)}
                  >
                    Colonne <i className={`fas ${showColumnFilter ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true"></i>
                  </Button>
                  {showColumnFilter && (
                    <div className="appointments-column-picker__menu">
                      {[
                        { key: 'tatuatore', label: 'Tatuatore' },
                        { key: 'stanza', label: 'Stanza' },
                        { key: 'cliente', label: 'Cliente' },
                        { key: 'dataOra', label: 'Data e Ora' },
                        { key: 'durata', label: 'Durata' },
                        { key: 'stato', label: 'Stato' },
                        { key: 'note', label: 'Note' },
                        { key: 'azioni', label: 'Azioni' }
                      ].map(column => (
                        <label key={column.key}>
                          <input
                            type="checkbox"
                            checked={visibleColumns[column.key]}
                            onChange={(e) => {
                              setVisibleColumns(prev => ({
                                ...prev,
                                [column.key]: e.target.checked
                              }));
                            }}
                          />
                          <span>{column.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {loading && (
              <div className="appointments-state appointments-state--loading">
                <h4>Caricamento appuntamenti</h4>
                <p>Attendi qualche istante mentre recuperiamo i dati.</p>
              </div>
            )}

            {!loading && error && (
              <div className="appointments-state appointments-state--error">
                <h4>Si è verificato un errore</h4>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="appointments-table-wrapper">
                {filteredAppointments.length === 0 ? (
                  <div className="appointments-empty-state">
                    <h4>
                      {searchTerm?.trim() || tatuatoreFilter || stanzaFilter || statoFilter
                        ? 'Nessun appuntamento trovato'
                        : 'Nessun appuntamento presente'}
                    </h4>
                    <p>
                      {searchTerm?.trim() || tatuatoreFilter || stanzaFilter || statoFilter
                        ? 'Prova a modificare i filtri di ricerca'
                        : 'Gli appuntamenti appariranno qui dopo averne creati di nuovi'}
                    </p>
                  </div>
                ) : (
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        {visibleColumns.tatuatore && <th scope="col">Tatuatore</th>}
                        {visibleColumns.stanza && <th scope="col">Stanza</th>}
                        {visibleColumns.cliente && <th scope="col">Cliente</th>}
                        {visibleColumns.dataOra && <th scope="col">Data e Ora</th>}
                        {visibleColumns.durata && <th scope="col">Durata</th>}
                        {visibleColumns.stato && <th scope="col">Stato</th>}
                        {visibleColumns.note && <th scope="col">Note</th>}
                        {visibleColumns.azioni && <th scope="col" className="text-center">Azioni</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((appointment) => (
                        <tr key={appointment.id}>
                          {visibleColumns.tatuatore && (
                            <td data-title="Tatuatore">
                              <span className="cell-strong">{appointment.tatuatore_nome || 'Sconosciuto'}</span>
                            </td>
                          )}
                          {visibleColumns.stanza && (
                            <td data-title="Stanza">
                              <span className="cell-strong">{appointment.stanza_nome || 'Sconosciuta'}</span>
                            </td>
                          )}
                          {visibleColumns.cliente && (
                            <td data-title="Cliente">
                              <div className="cell-stack">
                                {appointment.cliente_nome ? (
                                  <span className="cell-strong">{appointment.cliente_nome}</span>
                                ) : (
                                  <span className="cell-muted">Senza cliente</span>
                                )}
                                {appointment.cliente_telefono && (
                                  <span className="cell-subtitle">Telefono: {appointment.cliente_telefono}</span>
                                )}
                              </div>
                            </td>
                          )}
                          {visibleColumns.dataOra && (
                            <td data-title="Data e Ora">
                              <div className="cell-stack">
                                <span className="cell-strong">
                                  {new Date(appointment.orario_inizio).toLocaleDateString('it-IT')}
                                </span>
                                <span className="cell-subtitle">
                                  {new Date(appointment.orario_inizio).toLocaleTimeString('it-IT', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.durata && (
                            <td data-title="Durata">
                              {appointment.durata_minuti} min
                            </td>
                          )}
                          {visibleColumns.stato && (
                            <td data-title="Stato">
                              <span
                                className="status-badge"
                                style={{ backgroundColor: getStatoColor(appointment.stato) }}
                              >
                                {getStatoLabel(appointment.stato)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.note && (
                            <td data-title="Note">
                              {appointment.note ? (
                                <span className="cell-note" title={appointment.note}>
                                  {appointment.note}
                                </span>
                              ) : (
                                <span className="cell-muted">Nessuna nota</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.azioni && (
                            <td data-title="Azioni">
                              <div className="appointments-row-actions">
                                <button
                                  type="button"
                                  className="row-action row-action--view"
                                  onClick={() => {
                                    setEditingAppointment(appointment);
                                    setShowEditModal(true);
                                  }}
                                >
                                  Dettagli
                                </button>
                                <button
                                  type="button"
                                  className="row-action row-action--edit"
                                  onClick={() => {
                                    setEditingAppointment(appointment);
                                    setShowEditModal(true);
                                  }}
                                >
                                  Modifica
                                </button>
                                <button
                                  type="button"
                                  className="row-action row-action--delete"
                                  onClick={() => handleDeleteAppointment(appointment.id)}
                                >
                                  Elimina
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}

        {currentView === 'calendar' && (
          <div className="appointments-calendar-wrapper">
            <AppointmentCalendar
              tatuatori={tatuatori}
              stanze={stanze}
              onAppointmentClick={(appointment) => {
                setEditingAppointment(appointment);
                setShowEditModal(true);
              }}
            />
          </div>
        )}

        {currentView === 'availability' && (
          <div className="appointments-availability-wrapper">
            <AvailabilityChecker
              tatuatori={tatuatori}
              stanze={stanze}
              onSlotSelect={(orario_inizio, durata_minuti) => {
                const newAppointment = {
                  orario_inizio,
                  durata_minuti,
                  tatuatore_id: '',
                  stanza_id: '',
                  cliente_telefono: '',
                  cliente_nome: '',
                  note: '',
                  stato: 'confermato'
                };
                setEditingAppointment(newAppointment);
                setShowCreateModal(true);
                setCurrentView('list');
              }}
            />
          </div>
        )}
      </div>

      {/* Modale Creazione Appuntamento */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crea nuovo appuntamento"
        maxWidth="800px"
      >
        {(() => {
          console.log('[DEBUG] Props per AppointmentForm (creazione):');
          console.log('[DEBUG] Numero tatuatori passati:', tatuatori?.length || 0);
          console.log('[DEBUG] Lista tatuatori:', tatuatori || []);
          console.log('[DEBUG] Numero stanze passate:', stanze?.length || 0);
          console.log('[DEBUG] Lista stanze:', stanze || []);
          return (
            <AppointmentForm
              tatuatori={tatuatori}
              stanze={stanze}
              onSave={() => {
                setShowCreateModal(false);
                fetchAppointments(); // Refresh lista
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          );
        })()}
      </Modal>

      {/* Modale Modifica Appuntamento */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Modifica appuntamento"
        maxWidth="800px"
      >
        {(() => {
          console.log('[DEBUG] Props per AppointmentForm (modifica):');
          console.log('[DEBUG] Numero tatuatori passati:', tatuatori?.length || 0);
          console.log('[DEBUG] Lista tatuatori:', tatuatori || []);
          console.log('[DEBUG] Numero stanze passate:', stanze?.length || 0);
          console.log('[DEBUG] Lista stanze:', stanze || []);
          console.log('[DEBUG] Appointment da modificare:', editingAppointment);
          return (
            <AppointmentForm
              appointment={editingAppointment}
              tatuatori={tatuatori}
              stanze={stanze}
              onSave={() => {
                setShowEditModal(false);
                setEditingAppointment(null);
                fetchAppointments(); // Refresh lista
              }}
              onCancel={() => {
                setShowEditModal(false);
                setEditingAppointment(null);
              }}
            />
          );
        })()}
      </Modal>

      {/* Modale Impostazioni Risorse */}
      <Modal
        isOpen={showSettingsModal}
        onClose={handleCloseSettings}
        title="Impostazioni risorse"
        maxWidth="720px"
      >
        <div style={{
          marginBottom: '1.5rem',
          color: '#d1d5db',
          lineHeight: 1.5,
          fontSize: '0.95rem'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            Aggiungi e gestisci tatuatori e stanze per poter assegnare correttamente gli appuntamenti.
          </p>
          <p style={{ margin: 0 }}>
            Ricorda che per creare un nuovo appuntamento Ã¨ necessario avere almeno un tatuatore e una stanza attivi.
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <Button
            variant={settingsTab === 'tatuatori' ? 'primary' : 'ghost'}
            onClick={() => {
              setSettingsTab('tatuatori');
              setTatuatoriFeedback(null);
            }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem'
            }}
          >
            Tatuatori
          </Button>
          <Button
            variant={settingsTab === 'stanze' ? 'primary' : 'ghost'}
            onClick={() => {
              setSettingsTab('stanze');
              setStanzeFeedback(null);
            }}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem'
            }}
          >
            Stanze
          </Button>
        </div>

        {settingsTab === 'tatuatori' ? (
          <div>
            {tatuatoriFeedback && (
              <Alert type={tatuatoriFeedback.type} style={{ marginBottom: '1rem' }}>
                {tatuatoriFeedback.message}
              </Alert>
            )}

            <div style={{
              display: 'flex',
              gap: '0.75rem',
              flexWrap: 'wrap',
              marginBottom: '1.5rem'
            }}>
              <Input
                value={newTatuatoreNome}
                onChange={(e) => setNewTatuatoreNome(e.target.value)}
                placeholder="Nome tatuatore"
                style={{ flex: '1 1 240px', minWidth: '200px' }}
              />
              <Button
                onClick={handleCreateTatuatore}
                disabled={isCreatingTatuatore}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isCreatingTatuatore ? 'Salvataggio...' : 'Aggiungi tatuatore'}
              </Button>
            </div>

            <div>
              {tatuatori.length === 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  Nessun tatuatore presente. Aggiungine uno per iniziare a pianificare gli appuntamenti.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {tatuatori.map(tatuatore => (
                    <div
                      key={tatuatore.id}
                      style={{
                        background: 'rgba(17, 24, 39, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: '1 1 auto' }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '0.25rem'
                          }}>
                            {tatuatore.nome}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              background: tatuatore.attivo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: tatuatore.attivo ? '#34d399' : '#f87171',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {tatuatore.attivo ? 'Attivo' : 'Disattivato'}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          <Button
                            variant="secondary"
                            onClick={() => handleToggleTatuatore(tatuatore.id, tatuatore.attivo)}
                            disabled={updatingTatuatoreId === tatuatore.id}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            {updatingTatuatoreId === tatuatore.id ? 'Aggiornamento...' : tatuatore.attivo ? 'Disattiva' : 'Attiva'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {stanzeFeedback && (
              <Alert type={stanzeFeedback.type} style={{ marginBottom: '1rem' }}>
                {stanzeFeedback.message}
              </Alert>
            )}

            <div style={{
              display: 'grid',
              gap: '0.75rem',
              marginBottom: '1.5rem',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              alignItems: 'center'
            }}>
              <Input
                value={newStanzaNome}
                onChange={(e) => setNewStanzaNome(e.target.value)}
                placeholder="Nome stanza"
              />
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#d1d5db',
                fontSize: '0.9rem'
              }}>
                <input
                  type="checkbox"
                  checked={newStanzaNoOverbooking}
                  onChange={(e) => setNewStanzaNoOverbooking(e.target.checked)}
                />
                Evita overbooking
              </label>
              <Button
                onClick={handleCreateStanza}
                disabled={isCreatingStanza}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isCreatingStanza ? 'Salvataggio...' : 'Aggiungi stanza'}
              </Button>
            </div>

            <div>
              {stanze.length === 0 ? (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  Nessuna stanza disponibile. Aggiungi una stanza per pianificare gli appuntamenti.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {stanze.map(stanza => (
                    <div
                      key={stanza.id}
                      style={{
                        background: 'rgba(17, 24, 39, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '1rem'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ flex: '1 1 auto' }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#f9fafb',
                            marginBottom: '0.25rem'
                          }}>
                            {stanza.nome}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              background: stanza.attivo ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: stanza.attivo ? '#34d399' : '#f87171',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {stanza.attivo ? 'Attiva' : 'Disattivata'}
                            </span>
                            <span style={{
                              background: stanza.no_overbooking ? 'rgba(24, 24, 27, 0.85)' : 'rgba(55, 65, 81, 0.45)',
                              color: stanza.no_overbooking ? '#f3f4f6' : '#d1d5db',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '9999px',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}>
                              {stanza.no_overbooking ? 'No overbooking' : 'Overbooking consentito'}
                            </span>
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          flexWrap: 'wrap'
                        }}>
                          <Button
                            variant="secondary"
                            onClick={() => handleToggleStanzaAttiva(stanza.id, stanza.attivo)}
                            disabled={updatingStanzaId === stanza.id}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            {updatingStanzaId === stanza.id ? 'Aggiornamento...' : stanza.attivo ? 'Disattiva' : 'Attiva'}
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleToggleStanzaNoOverbooking(stanza.id, stanza.no_overbooking)}
                            disabled={updatingStanzaNoOverbookingId === stanza.id}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem'
                            }}
                          >
                            {updatingStanzaNoOverbookingId === stanza.id ? 'Aggiornamento...' : stanza.no_overbooking ? 'Permetti overbooking' : 'Blocca overbooking'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AppointmentList;

