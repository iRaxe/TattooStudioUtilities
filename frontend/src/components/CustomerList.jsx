import React, { useState } from 'react';
import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';
import Modal from './common/Modal';

function CustomerList({ customers, onShowCustomerModal, onEditCustomer, generateConsentPDF, deleteConsent }) {
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showCustomerColumnFilter, setShowCustomerColumnFilter] = useState(false);
  const [visibleCustomerColumns, setVisibleCustomerColumns] = useState({
    name: true,
    contacts: true,
    total: true,
    active: true,
    used: true,
    expired: true,
    amount: true,
    lastPurchase: true,
    consents: true
  });

  // Stato per modale consensi
  const [consentsModalOpen, setConsentsModalOpen] = useState(false);
  const [consentsLoading, setConsentsLoading] = useState(false);
  const [consentsError, setConsentsError] = useState('');
  const [consents, setConsents] = useState([]);
  const [consentsCustomer, setConsentsCustomer] = useState(null);

  const handleShowCustomerModal = (customerData) => {
    if (onShowCustomerModal) {
      onShowCustomerModal(customerData);
    }
  };

  const handleEditCustomer = (customer) => {
    if (onEditCustomer) {
      onEditCustomer(customer);
    }
  };

  // Nuovo flusso: recupera consensi e mostra modale React
  const openConsentsModalForCustomer = async (customer) => {
    setConsentsLoading(true);
    setConsentsError('');
    setConsents([]);
    setConsentsCustomer(customer);
    try {
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/customers/${customer.phone}/consensi`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Errore nel recupero dei consensi.');
      const data = await response.json();
      const list = data.consents || [];
      if (list.length === 0) {
        alert('Nessun consenso trovato per questo cliente.');
        setConsentsCustomer(null);
        setConsentsModalOpen(false);
      } else {
        setConsents(list);
        setConsentsModalOpen(true);
      }
    } catch (error) {
      console.error('Errore consensi:', error);
      setConsentsError('Errore nel recupero dei consensi.');
      setConsentsModalOpen(true);
    } finally {
      setConsentsLoading(false);
    }
  };

  const handleGeneratePDF = async (consentId) => {
    try {
      if (!consentsCustomer) return;
      await generateConsentPDF(consentId, `${consentsCustomer.first_name} ${consentsCustomer.last_name}`);
    } catch (error) {
      console.error('Errore PDF:', error);
      alert('Errore nella generazione del PDF');
    }
  };

  const handleDeleteConsent = async (consentId) => {
    try {
      const confirmed = window.confirm('Sei sicuro di voler eliminare questo consenso? Questa azione non può essere annullata.');
      if (!confirmed) return;
      await deleteConsent(consentId);
      setConsents(prev => prev.filter(c => c.id !== consentId));
      alert('Consenso eliminato con successo');
    } catch (error) {
      console.error('Errore eliminazione:', error);
      alert("Errore nell'eliminazione del consenso");
    }
  };
  const filteredCustomers = customers.filter(customer => {
    if (!customerSearchTerm?.trim()) return true;
    const searchLower = customerSearchTerm.toLowerCase();
    return (
      (customer.first_name && customer.first_name.toLowerCase().includes(searchLower)) ||
      (customer.last_name && customer.last_name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.toLowerCase().includes(searchLower)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    // Ordinamento per importo totale decrescente
    return b.total_amount - a.total_amount;
  });

  return (
    <div>
      <h3 className="section-title"><i className="fas fa-users"></i> Elenco Clienti</h3>
      <p className="section-description">
        Visualizza tutti i clienti con le statistiche delle loro gift card
      </p>
      
      {/* Search and Column Filter */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <Input
            value={customerSearchTerm || ''}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
            placeholder="Cerca per nome, telefono o email..."
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '0.75rem',
              color: '#f3f4f6',
              fontSize: '0.9rem',
              width: '100%'
            }}
          />
        </div>
        
        <div
          data-customer-dropdown="column-selector"
          style={{
            position: 'relative',
            display: 'inline-block'
          }}>
          <Button
            variant="secondary"
            onClick={() => setShowCustomerColumnFilter(!showCustomerColumnFilter)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '0.75rem 2rem 0.75rem 0.75rem',
              color: '#ffffff',
              fontSize: '0.9rem',
              minWidth: '200px',
              cursor: 'pointer',
              textAlign: 'left',
              position: 'relative'
            }}
          >
            Colonne visibili
            <span style={{
              position: 'absolute',
              right: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '0.8rem'
            }}>
              {showCustomerColumnFilter ? '^' : 'v'}
            </span>
          </Button>
          
          {showCustomerColumnFilter && (
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
              backdropFilter: 'blur(10px)'
            }}>
              {[
                { key: 'name', label: 'Nome Cliente' },
                { key: 'contacts', label: 'Contatti' },
                { key: 'total', label: 'Totale Card' },
                { key: 'active', label: 'Attive' },
                { key: 'used', label: 'Usate' },
                { key: 'expired', label: 'Scadute' },
                { key: 'amount', label: 'Importo Totale' },
                { key: 'lastPurchase', label: 'Ultimo Acquisto' },
                { key: 'consents', label: 'Azioni' }
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
                    checked={visibleCustomerColumns[column.key]}
                    onChange={(e) => {
                      setVisibleCustomerColumns(prev => ({
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
      
      {filteredCustomers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {customerSearchTerm?.trim() ? (
            <>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Nessun cliente trovato
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Prova a modificare i termini di ricerca
              </p>
            </>
          ) : (
            <>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Nessun cliente trovato
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                I clienti appariranno qui dopo aver finalizzato le prime gift card
              </p>
            </>
          )}
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
                {visibleCustomerColumns.name && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Cliente</th>
                )}
                {visibleCustomerColumns.contacts && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Contatti</th>
                )}
                {visibleCustomerColumns.total && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Totale</th>
                )}
                {visibleCustomerColumns.active && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Attive</th>
                )}
                {visibleCustomerColumns.used && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Usate</th>
                )}
                {visibleCustomerColumns.expired && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Scadute</th>
                )}
                {visibleCustomerColumns.amount && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Importo Totale</th>
                )}
                {visibleCustomerColumns.lastPurchase && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Ultimo Acquisto</th>
                )}
                {visibleCustomerColumns.consents && (
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
              {filteredCustomers.map((customer, index) => (
                <tr key={index} style={{
                  borderBottom: index < filteredCustomers.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}>
                  {visibleCustomerColumns.name && (
                    <td style={{
                      padding: '1rem',
                      color: '#f3f4f6'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {customer.first_name} {customer.last_name}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleCustomerColumns.contacts && (
                    <td style={{
                      padding: '1rem',
                      color: '#9ca3af',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        {customer.email && (
                          <div style={{ marginBottom: '0.25rem' }}>
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div>
                            <a 
                              href={`https://wa.me/39${customer.phone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: '#25d366',
                                textDecoration: 'none',
                                fontWeight: '500'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.textDecoration = 'underline';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.textDecoration = 'none';
                              }}
                            >
                              {customer.phone}
                            </a>
                          </div>
                        )}
                        {!customer.email && !customer.phone && (
                          <span style={{ color: '#6b7280' }}>N/A</span>
                        )}
                      </div>
                    </td>
                  )}
                  {visibleCustomerColumns.total && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#f3f4f6',
                      fontWeight: '500'
                    }}>
                      {customer.total_cards}
                    </td>
                  )}
                  {visibleCustomerColumns.active && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#10b981'
                    }}>
                      {customer.active_cards}
                    </td>
                  )}
                  {visibleCustomerColumns.used && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#6b7280'
                    }}>
                      {customer.used_cards}
                    </td>
                  )}
                  {visibleCustomerColumns.expired && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#ef4444'
                    }}>
                      {customer.expired_cards}
                    </td>
                  )}
                  {visibleCustomerColumns.amount && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#fbbf24',
                      fontWeight: '600'
                    }}>
                      €{customer.total_amount.toFixed(2)}
                    </td>
                  )}
                  {visibleCustomerColumns.lastPurchase && (
                    <td style={{
                      padding: '1rem',
                      color: '#9ca3af',
                      fontSize: '0.9rem'
                    }}>
                      {customer.last_purchase ? 
                        new Date(customer.last_purchase).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        }) : 'N/A'
                      }
                    </td>
                  )}
                  {visibleCustomerColumns.consents && (
                    <td style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: '0.9rem'
                    }}>
                      {customer.phone ? (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          alignItems: 'center'
                        }}>
                          <button
                            onClick={() => handleShowCustomerModal(customer)}
                            title="Dettagli cliente"
                            style={{
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(34, 197, 94, 0.5)',
                              borderRadius: '4px',
                              color: '#4ade80',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
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
                            Vedi
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            title="Modifica cliente"
                            style={{
                              background: 'rgba(24, 24, 27, 0.85)',
                              border: '1px solid rgba(75, 85, 99, 0.5)',
                              borderRadius: '4px',
                              color: '#f3f4f6',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(17, 17, 17, 0.9)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(24, 24, 27, 0.85)';
                            }}
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => openConsentsModalForCustomer(customer)}
                            title="Visualizza consensi"
                            style={{
                              background: 'rgba(168, 85, 247, 0.2)',
                              border: '1px solid rgba(168, 85, 247, 0.5)',
                              borderRadius: '4px',
                              color: '#a855f7',
                              padding: '0.5rem 0.75rem',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(168, 85, 247, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(168, 85, 247, 0.2)';
                            }}
                          >
                            Consensi
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#6b7280' }}>N/A</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal
        isOpen={consentsModalOpen}
        onClose={() => {
          setConsentsModalOpen(false);
          setConsents([]);
          setConsentsCustomer(null);
          setConsentsError('');
        }}
        title={`Consensi${consentsCustomer ? ` per ${consentsCustomer.first_name} ${consentsCustomer.last_name}` : ''}`}
      >

            {consentsLoading && (
              <div style={{ color: '#9ca3af' }}>Caricamento consensi...</div>
            )}

            {!consentsLoading && consentsError && (
              <div style={{ color: '#f87171' }}>{consentsError}</div>
            )}

            {!consentsLoading && !consentsError && (
              <div className="flex-col gap-lg">
                {consents.map(c => (
                  <div key={c.id} className="consenso-item" style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid #4b5563',
                    borderRadius: '4px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ color: '#f9fafb', fontWeight: '600', marginBottom: '0.25rem' }}>
                        {String(c.type || '').toUpperCase()}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                        {new Date(c.submittedAt).toLocaleDateString('it-IT')} alle {new Date(c.submittedAt).toLocaleTimeString('it-IT')}
                      </div>
                    </div>
                    <div className="flex gap-sm">
                      <Button
                        variant="secondary"
                        onClick={() => generateConsentPDF(c.id)}
                        aria-label="Genera PDF del consenso"
                        style={{
                          background: 'rgba(34, 197, 94, 0.2)',
                          border: '1px solid rgba(34, 197, 94, 0.5)',
                          borderRadius: '4px',
                          color: '#22c55e',
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'; }}
                      >
                        Apri PDF
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteConsent(c.id)}
                        aria-label="Elimina consenso"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        Elimina
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
      </Modal>
    </div>
  );
}

export default CustomerList;
