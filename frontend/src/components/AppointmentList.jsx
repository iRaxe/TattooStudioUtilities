import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';
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
      const token = getCookie('adminToken');
      const response = await fetch('/api/admin/tatuatori', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTatuatori(data.tatuatori || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento tatuatori:', error);
    }
  };

  const fetchStanze = async () => {
    try {
      const token = getCookie('adminToken');
      const response = await fetch('/api/admin/stanze', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStanze(data.stanze || []);
      }
    } catch (error) {
      console.error('Errore nel caricamento stanze:', error);
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

  // Stato per la vista corrente
  const [currentView, setCurrentView] = useState('list'); // 'list', 'calendar', 'availability'

  // Stati per modali
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);

  return (
    <div>
      {/* Header con azioni principali */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 className="section-title">
            <i className="fas fa-calendar-alt"></i> Gestione Appuntamenti
          </h3>
          <p className="section-description">
            Gestisci tutti gli appuntamenti con filtri avanzati e viste multiple
          </p>
        </div>

        {/* Azioni principali */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <Button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '600',
              padding: '0.75rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fas fa-plus"></i>
            ➕ Crea Appuntamento
          </Button>

          <Button
            variant={currentView === 'calendar' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('calendar')}
            style={{
              fontSize: '0.9rem',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fas fa-calendar-alt"></i>
            📅 Calendario
          </Button>

          <Button
            variant={currentView === 'availability' ? 'primary' : 'secondary'}
            onClick={() => setCurrentView('availability')}
            style={{
              fontSize: '0.9rem',
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <i className="fas fa-clock"></i>
            ⏰ Disponibilità
          </Button>
        </div>
      </div>

      {/* Filtri */}
      <div style={{
        display: 'grid',
        gap: '1rem',
        marginBottom: '1.5rem',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
      }}>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cerca per cliente, tatuatore, stanza..."
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        />

        <select
          value={tatuatoreFilter}
          onChange={(e) => setTatuatoreFilter(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        >
          <option value="">Tutti i tatuatori</option>
          {tatuatori.map(tatuatore => (
            <option key={tatuatore.id} value={tatuatore.id}>
              {tatuatore.nome} {tatuatore.attivo ? '' : '(Disattivo)'}
            </option>
          ))}
        </select>

        <select
          value={stanzaFilter}
          onChange={(e) => setStanzaFilter(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        >
          <option value="">Tutte le stanze</option>
          {stanze.map(stanza => (
            <option key={stanza.id} value={stanza.id}>
              {stanza.nome} {stanza.attivo ? '' : '(Disattiva)'}
            </option>
          ))}
        </select>

        <select
          value={statoFilter}
          onChange={(e) => setStatoFilter(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        >
          <option value="">Tutti gli stati</option>
          <option value="confermato">Confermato</option>
          <option value="in_corso">In Corso</option>
          <option value="completato">Completato</option>
          <option value="cancellato">Cancellato</option>
        </select>

        <Input
          type="date"
          value={dataInizioFilter}
          onChange={(e) => setDataInizioFilter(e.target.value)}
          placeholder="Data inizio"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        />

        <Input
          type="date"
          value={dataFineFilter}
          onChange={(e) => setDataFineFilter(e.target.value)}
          placeholder="Data fine"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '0.75rem',
            color: '#f3f4f6',
            fontSize: '0.9rem'
          }}
        />
      </div>

      {/* Pulsanti azioni filtri */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <Button onClick={fetchAppointments} disabled={loading}>
          {loading ? 'Caricamento...' : '🔍 Applica Filtri'}
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
          🧹 Cancella Filtri
        </Button>

        <div style={{ position: 'relative' }}>
          <Button
            variant="secondary"
            onClick={() => setShowColumnFilter(!showColumnFilter)}
          >
            📊 Colonne {showColumnFilter ? '▲' : '▼'}
          </Button>

          {showColumnFilter && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              marginTop: '0.25rem',
              zIndex: 1000,
              backdropFilter: 'blur(10px)',
              minWidth: '200px'
            }}>
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
                <label
                  key={column.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#ffffff',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[column.key]}
                    onChange={(e) => {
                      setVisibleColumns(prev => ({
                        ...prev,
                        [column.key]: e.target.checked
                      }));
                    }}
                    style={{
                      marginRight: '0.5rem',
                      accentColor: '#fbbf24'
                    }}
                  />
                  {column.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading e Error states */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          Caricamento appuntamenti...
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#ef4444',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '4px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
          {error}
        </div>
      )}

      {/* Tabella appuntamenti */}
      {!loading && !error && (
        <>
          {filteredAppointments.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              color: '#9ca3af',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {searchTerm?.trim() || tatuatoreFilter || stanzaFilter || statoFilter ?
                  'Nessun appuntamento trovato' :
                  'Nessun appuntamento presente'
                }
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                {searchTerm?.trim() || tatuatoreFilter || stanzaFilter || statoFilter ?
                  'Prova a modificare i filtri di ricerca' :
                  'Gli appuntamenti appariranno qui dopo averne creati di nuovi'
                }
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {visibleColumns.tatuatore && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Tatuatore</th>
                    )}
                    {visibleColumns.stanza && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Stanza</th>
                    )}
                    {visibleColumns.cliente && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Cliente</th>
                    )}
                    {visibleColumns.dataOra && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Data e Ora</th>
                    )}
                    {visibleColumns.durata && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Durata</th>
                    )}
                    {visibleColumns.stato && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Stato</th>
                    )}
                    {visibleColumns.note && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'left',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Note</th>
                    )}
                    {visibleColumns.azioni && (
                      <th style={{
                        padding: '1rem',
                        textAlign: 'center',
                        fontWeight: '600',
                        color: '#fbbf24',
                        fontSize: '0.9rem'
                      }}>Azioni</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment, index) => (
                    <tr key={appointment.id} style={{
                      borderBottom: index < filteredAppointments.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                    }}>
                      {visibleColumns.tatuatore && (
                        <td style={{
                          padding: '1rem',
                          color: '#f3f4f6'
                        }}>
                          <div style={{ fontWeight: '500' }}>
                            {appointment.tatuatore_nome || 'Sconosciuto'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.stanza && (
                        <td style={{
                          padding: '1rem',
                          color: '#f3f4f6'
                        }}>
                          <div style={{ fontWeight: '500' }}>
                            {appointment.stanza_nome || 'Sconosciuta'}
                          </div>
                        </td>
                      )}
                      {visibleColumns.cliente && (
                        <td style={{
                          padding: '1rem',
                          color: '#f3f4f6'
                        }}>
                          <div>
                            {appointment.cliente_nome && (
                              <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                {appointment.cliente_nome}
                              </div>
                            )}
                            {appointment.cliente_telefono && (
                              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                                📞 {appointment.cliente_telefono}
                              </div>
                            )}
                            {!appointment.cliente_nome && !appointment.cliente_telefono && (
                              <span style={{ color: '#6b7280' }}>Senza cliente</span>
                            )}
                          </div>
                        </td>
                      )}
                      {visibleColumns.dataOra && (
                        <td style={{
                          padding: '1rem',
                          color: '#f3f4f6'
                        }}>
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {new Date(appointment.orario_inizio).toLocaleDateString('it-IT')}
                            </div>
                            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                              {new Date(appointment.orario_inizio).toLocaleTimeString('it-IT', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.durata && (
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#f3f4f6'
                        }}>
                          {appointment.durata_minuti} min
                        </td>
                      )}
                      {visibleColumns.stato && (
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            background: getStatoColor(appointment.stato),
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            {getStatoLabel(appointment.stato)}
                          </span>
                        </td>
                      )}
                      {visibleColumns.note && (
                        <td style={{
                          padding: '1rem',
                          color: '#9ca3af',
                          fontSize: '0.9rem',
                          maxWidth: '200px'
                        }}>
                          {appointment.note ? (
                            <div style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {appointment.note}
                            </div>
                          ) : (
                            <span style={{ color: '#6b7280' }}>Nessuna nota</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.azioni && (
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            justifyContent: 'center'
                          }}>
                            <button
                              onClick={() => {
                                setEditingAppointment(appointment);
                                setShowEditModal(true);
                              }}
                              title="Visualizza dettagli"
                              style={{
                                background: 'rgba(59, 130, 246, 0.2)',
                                border: '1px solid rgba(59, 130, 246, 0.5)',
                                borderRadius: '4px',
                                color: '#60a5fa',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(59, 130, 246, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(59, 130, 246, 0.2)';
                              }}
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => {
                                setEditingAppointment(appointment);
                                setShowEditModal(true);
                              }}
                              title="Modifica appuntamento"
                              style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.5)',
                                borderRadius: '4px',
                                color: '#4ade80',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(34, 197, 94, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(34, 197, 94, 0.2)';
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              title="Elimina appuntamento"
                              style={{
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: '1px solid rgba(239, 68, 68, 0.5)',
                                borderRadius: '4px',
                                color: '#f87171',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modale Creazione Appuntamento */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="➕ Crea Nuovo Appuntamento"
        maxWidth="800px"
      >
        <AppointmentForm
          tatuatori={tatuatori}
          stanze={stanze}
          onSave={() => {
            setShowCreateModal(false);
            fetchAppointments(); // Refresh lista
          }}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modale Modifica Appuntamento */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="✏️ Modifica Appuntamento"
        maxWidth="800px"
      >
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
      </Modal>

      {/* Vista Calendario */}
      {currentView === 'calendar' && (
        <div style={{ marginTop: '2rem' }}>
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

      {/* Vista Disponibilità */}
      {currentView === 'availability' && (
        <div style={{ marginTop: '2rem' }}>
          <AvailabilityChecker
            tatuatori={tatuatori}
            stanze={stanze}
            onSlotSelect={(orario_inizio, durata_minuti) => {
              // Pre-compila form con slot selezionato
              const newAppointment = {
                orario_inizio,
                durata_minuti,
                tatuatore_id: '', // Da selezionare
                stanza_id: '', // Da selezionare
                cliente_telefono: '',
                cliente_nome: '',
                note: '',
                stato: 'confermato'
              };
              setEditingAppointment(newAppointment);
              setShowCreateModal(true);
              setCurrentView('list'); // Torna alla lista dopo selezione
            }}
          />
        </div>
      )}
    </div>
  );
}

export default AppointmentList;