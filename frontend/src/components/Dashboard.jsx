import React from 'react';

function Dashboard({ stats }) {
  return (
    <div>
      <h3 className="section-title"><i className="fas fa-chart-bar"></i> Dashboard e Statistiche</h3>
      <p className="section-description">
        Visualizza le statistiche aggregate delle gift card e i KPI principali
      </p>
      {stats && (
        <>
          {/* KPI Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1rem',
            marginBottom: '2rem'
          }} className="dashboard-stats-grid">
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '4px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                {stats.total}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Gift Card Totali</div>
            </div>
            
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '4px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fbbf24', marginBottom: '0.5rem' }}>
                {stats.draft}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Bozze</div>
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '4px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', marginBottom: '0.5rem' }}>
                {stats.active}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Attive</div>
            </div>
            
            <div style={{
              background: 'rgba(139, 69, 19, 0.1)',
              border: '1px solid rgba(139, 69, 19, 0.3)',
              borderRadius: '4px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b4513', marginBottom: '0.5rem' }}>
                {stats.used}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Utilizzate</div>
            </div>
            
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '4px',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>
                {stats.expiredByDate || 0}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Scadute</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#f3f4f6', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: '600' }}>
              <i className="fas fa-chart-pie"></i> Analisi Fatturato
            </h4>
            <div className="dashboard-revenue-chart">
              {/* Pie Chart */}
              <div className="dashboard-pie-chart" style={{ position: 'relative', width: '250px', height: '250px' }}>
                <svg width="250" height="250" viewBox="0 0 250 250" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx="125"
                    cy="125"
                    r="100"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="20"
                  />
                  {/* Used revenue arc */}
                  {stats.totalRevenue > 0 && (
                    <circle
                      cx="125"
                      cy="125"
                      r="100"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.usedRevenue / stats.totalRevenue) * 628.32} 628.32`}
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.5))',
                        transition: 'all 0.5s ease'
                      }}
                    />
                  )}
                  {/* Remaining revenue arc */}
                  {stats.totalRevenue > 0 && stats.usedRevenue < stats.totalRevenue && (
                    <circle
                      cx="125"
                      cy="125"
                      r="100"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray={`${((stats.totalRevenue - stats.usedRevenue) / stats.totalRevenue) * 628.32} 628.32`}
                      strokeDashoffset={`-${(stats.usedRevenue / stats.totalRevenue) * 628.32}`}
                      strokeLinecap="round"
                      style={{
                        filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.5))',
                        transition: 'all 0.5s ease'
                      }}
                    />
                  )}
                </svg>
                {/* Center text */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 'bold',
                    color: '#fbbf24',
                    marginBottom: '0.25rem'
                  }}>
                    {stats.totalRevenue > 0 ? Math.round((stats.usedRevenue / stats.totalRevenue) * 100) : 0}%
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                    Utilizzato
                  </div>
                </div>
              </div>

              {/* Legend and Stats */}
              <div className="dashboard-legend">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)'
                  }}></div>
                  <div>
                    <div style={{ color: '#22c55e', fontWeight: '600', fontSize: '1.1rem' }}>
                      €{stats.totalRevenue - stats.usedRevenue}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Fatturato Disponibile
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ef4444',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                  }}></div>
                  <div>
                    <div style={{ color: '#ef4444', fontWeight: '600', fontSize: '1.1rem' }}>
                      €{stats.usedRevenue}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Fatturato Utilizzato
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(251, 191, 36, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(251, 191, 36, 0.3)'
                }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#fbbf24',
                    boxShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                  }}></div>
                  <div>
                    <div style={{ color: '#fbbf24', fontWeight: '600', fontSize: '1.1rem' }}>
                      €{stats.totalRevenue}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                      Fatturato Totale
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;