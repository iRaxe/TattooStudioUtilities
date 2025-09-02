import React, { useState, useEffect } from 'react';

import { getCookie } from '../utils/cookies';
import Input from './common/Input';
import Button from './common/Button';

function GiftCardList({ onStatsUpdate, customers, onShowCustomerModal, onMarkAsUsed }) {
  const [allGiftCards, setAllGiftCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    amount: true,
    status: true,
    code: true,
    customer: true,
    created: true,
    expires: true,
    actions: true
  });

  const fetchAllGiftCards = async () => {
    try {
      const token = getCookie('adminToken');
      const response = await fetch('/api/admin/gift-cards', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAllGiftCards(data.giftCards || []);
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
    }
  };

  const handleDeleteGiftCard = async (id) => {
    const confirmed = window.confirm('Sei sicuro di voler eliminare questa gift card? Questa azione non può essere annullata.');
    if (!confirmed) return;

    try {
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/gift-cards/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Gift card eliminata con successo');
        fetchAllGiftCards(); // Refresh the list
        if (onStatsUpdate) onStatsUpdate(); // Refresh stats
      } else {
        const data = await response.json();
        alert(data.error || 'Errore durante l\'eliminazione');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Errore di connessione al server');
    }
  };

  const handleRenewGiftCard = async (id) => {
    const confirmed = window.confirm('Sei sicuro di voler rinnovare la scadenza di questa gift card?');
    if (!confirmed) return;

    try {
      const token = getCookie('adminToken');
      const response = await fetch(`/api/admin/gift-cards/${id}/renew`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert('Scadenza gift card rinnovata con successo');
        fetchAllGiftCards(); // Refresh the list
        if (onStatsUpdate) onStatsUpdate(); // Refresh stats
      } else {
        const data = await response.json();
        alert(data.error || 'Errore durante il rinnovo');
      }
    } catch (error) {
      console.error('Renew error:', error);
      alert('Errore di connessione al server');
    }
  };

  const handleMarkAsUsedByCode = async (code) => {
    if (onMarkAsUsed) {
      await onMarkAsUsed(code);
      fetchAllGiftCards(); // Refresh the list
    }
  };

  const handleShowCustomerModal = (customerData) => {
    if (onShowCustomerModal) {
      onShowCustomerModal(customerData);
    }
  };

  useEffect(() => {
    fetchAllGiftCards();
  }, []);

  const filteredCards = allGiftCards.filter(card => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (card.code && card.code.toLowerCase().includes(searchLower)) ||
      (card.customer_name && card.customer_name.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => {
    // Ordinamento: Attiva -> Bozza -> Utilizzata
    const statusOrder = { 'active': 1, 'draft': 2, 'used': 3 };
    return (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
  });

  return (
    <div>
      <h3 className="section-title"><i className="fas fa-list"></i> Elenco Gift Card</h3>
      <p className="section-description">
        Visualizza tutte le gift card create e il loro stato attuale
      </p>
      
      {/* Search and Column Filter */}
      <div className="gift-card-search-controls">
        <div className="gift-card-search-input">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per codice o nome cliente..."
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              padding: '0.75rem',
              color: '#ffffff',
              fontSize: '0.9rem',
              width: '100%'
            }}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <div 
            data-dropdown="column-selector"
            style={{
              position: 'relative',
              display: 'inline-block'
            }}>
            <Button
              variant="secondary"
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
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
                {showColumnDropdown ? '▲' : '▼'}
              </span>
            </Button>
            
            {showColumnDropdown && (
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
                  { key: 'amount', label: 'Importo' },
                  { key: 'status', label: 'Stato' },
                  { key: 'code', label: 'Codice' },
                  { key: 'customer', label: 'Cliente' },
                  { key: 'created', label: 'Data Creazione' },
                  { key: 'expires', label: 'Scadenza' },
                  { key: 'actions', label: 'Azioni' }
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
      </div>
      
      {filteredCards.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {searchTerm.trim() ? (
            <>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Nessuna gift card trovata
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Prova a modificare i termini di ricerca
              </p>
            </>
          ) : (
            <>
              <h4 style={{ color: '#f3f4f6', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                Nessuna gift card trovata
              </h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Le gift card appariranno qui dopo la creazione
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="gift-card-list-container" style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <table className="gift-card-table">
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {visibleColumns.amount && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Importo</th>
                )}
                {visibleColumns.status && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Stato</th>
                )}
                {visibleColumns.code && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Codice</th>
                )}
                {visibleColumns.customer && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Cliente</th>
                )}
                {visibleColumns.created && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Creata</th>
                )}
                {visibleColumns.expires && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Scadenza</th>
                )}
                {visibleColumns.actions && (
                  <th style={{
                    padding: '1rem',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#fbbf24',
                    fontSize: '0.9rem'
                  }}>Azioni</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredCards.map((card, index) => (
                <tr key={card.id} style={{
                  borderBottom: index < filteredCards.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}>
                  {visibleColumns.amount && (
                    <td style={{
                      padding: '1rem',
                      fontWeight: '600',
                      color: '#fbbf24'
                    }}>€{card.amount}</td>
                  )}
                  {visibleColumns.status && (
                    <td style={{
                      padding: '1rem'
                    }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '500',
                        background: 
                          card.status === 'active' ? 'rgba(34, 197, 94, 0.2)' :
                          card.status === 'used' ? 'rgba(239, 68, 68, 0.2)' :
                          card.status === 'draft' ? 'rgba(251, 191, 36, 0.2)' :
                          'rgba(156, 163, 175, 0.2)',
                        color:
                          card.status === 'active' ? '#22c55e' :
                          card.status === 'used' ? '#ef4444' :
                          card.status === 'draft' ? '#fbbf24' :
                          '#9ca3af'
                      }}>
                        {card.status === 'draft' ? 'Bozza' :
                         card.status === 'active' ? 'Attiva' :
                         card.status === 'used' ? 'Utilizzata' :
                         card.status === 'expired' ? 'Scaduta' :
                         card.status}
                      </span>
                    </td>
                  )}
                  {visibleColumns.code && (
                    <td style={{
                      padding: '1rem',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                      color: card.code ? '#e5e7eb' : '#6b7280'
                    }}>
                      {card.code || 'N/A'}
                    </td>
                  )}
                  {visibleColumns.customer && (
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.9rem',
                      color: '#e5e7eb'
                    }}>
                      {card.customer_name && card.customer_name !== 'N/A' ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // Trova il cliente corrispondente nella lista clienti
                            const customer = customers.find(c => 
                              `${c.first_name} ${c.last_name}` === card.customer_name ||
                              c.phone === card.phone
                            );
                            if (customer) {
                              handleShowCustomerModal(customer);
                            } else {
                              // Se non troviamo il cliente nella lista, creiamo un oggetto con i dati disponibili
                              const customerData = {
                                first_name: card.first_name || '',
                                last_name: card.last_name || '',
                                email: card.email || '',
                                phone: card.phone || '',
                                birth_date: card.birth_date || '',
                                birth_place: '',
                                fiscal_code: '',
                                address: '',
                                city: ''
                              };
                              handleShowCustomerModal(customerData);
                            }
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '0.9rem',
                            padding: 0
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.color = '#93c5fd';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.color = '#60a5fa';
                          }}
                        >
                          {card.customer_name}
                        </Button>
                      ) : (
                        <span style={{ color: '#6b7280' }}>N/A</span>
                      )}
                    </td>
                  )}
                  {visibleColumns.created && (
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.9rem',
                      color: '#e5e7eb'
                    }}>
                      {card.created_at ? new Date(card.created_at).toLocaleDateString('it-IT') : 'N/A'}
                    </td>
                  )}
                  {visibleColumns.expires && (
                    <td style={{
                      padding: '1rem',
                      fontSize: '0.9rem',
                      color: card.expires_at && new Date(card.expires_at) < new Date() ? '#ef4444' : '#e5e7eb'
                    }}>
                      {card.expires_at ? new Date(card.expires_at).toLocaleDateString('it-IT') : 'N/A'}
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td style={{
                      padding: '1rem'
                    }}>
                      <div className="flex gap-sm flex-wrap">
                        {card.status === 'draft' && card.claim_token && (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const claimUrl = `${window.location.origin}/gift/claim/${card.claim_token}`;
                              navigator.clipboard.writeText(claimUrl);
                              alert(`Link copiato negli appunti!\n\n${claimUrl}`);
                            }}
                            aria-label="Copia link gift card"
                            style={{
                              background: 'rgba(251, 191, 36, 0.2)',
                              border: '1px solid rgba(251, 191, 36, 0.5)',
                              color: '#fbbf24',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            📋 Copia Link
                          </Button>
                        )}
                        {card.status === 'active' && card.code && (
                          <Button
                            variant="secondary"
                            onClick={() => handleMarkAsUsedByCode(card.code)}
                            aria-label="Marca gift card come usata"
                            style={{
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.5)',
                              color: '#ef4444',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            ✓ Marca Usata
                          </Button>
                        )}
                        {(() => {
                          const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
                          return isExpired && (
                            <Button
                              variant="secondary"
                              onClick={() => handleRenewGiftCard(card.id)}
                              aria-label="Rinnova scadenza gift card"
                              style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.5)',
                                color: '#22c55e',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                marginRight: '0.5rem'
                              }}
                            >
                              🔄 Rinnova
                            </Button>
                          );
                        })()}
                        {(card.status === 'draft' || card.status === 'active' || card.status === 'used') && (
                          <Button
                            variant="danger"
                            onClick={() => handleDeleteGiftCard(card.id)}
                            aria-label="Elimina gift card"
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.8rem'
                            }}
                          >
                            🗑️ Elimina
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GiftCardList;