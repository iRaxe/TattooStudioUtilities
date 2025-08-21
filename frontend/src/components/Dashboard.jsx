import React from 'react';

function Dashboard({ stats }) {
  return (
    <div>
      <h3 className="section-title">📊 Dashboard e Statistiche</h3>
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
          }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '12px',
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
              borderRadius: '12px',
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
              borderRadius: '12px',
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
              borderRadius: '12px',
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
              borderRadius: '12px',
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
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h4 style={{ color: '#f3f4f6', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: '600' }}>
              📈 Analisi Fatturato
            </h4>
            <div className="flex flex-end gap-2xl" style={{ height: '200px' }}>
              {/* Fatturato Totale Bar */}
              <div className="flex-1 flex-center-col h-full">
                <div style={{
                  width: '100%',
                  maxWidth: '120px',
                  height: `${Math.max(20, (stats.totalRevenue / Math.max(stats.totalRevenue, stats.usedRevenue)) * 160)}px`,
                  background: 'linear-gradient(180deg, #22c55e 0%, #16a34a 100%)',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
                }}>
                  €{stats.totalRevenue}
                </div>
                <div style={{ color: '#22c55e', fontWeight: '600', textAlign: 'center' }}>
                  Fatturato Totale
                </div>
              </div>

              {/* Fatturato Utilizzato Bar */}
              <div className="flex-1 flex-center-col h-full">
                <div style={{
                  width: '100%',
                  maxWidth: '120px',
                  height: `${Math.max(20, (stats.usedRevenue / Math.max(stats.totalRevenue, stats.usedRevenue)) * 160)}px`,
                  background: 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}>
                  €{stats.usedRevenue}
                </div>
                <div style={{ color: '#ef4444', fontWeight: '600', textAlign: 'center' }}>
                  Fatturato Utilizzato
                </div>
              </div>

              {/* Percentuale di utilizzo */}
              <div className="flex-1 flex-center-full">
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: '#fbbf24',
                  marginBottom: '0.5rem'
                }}>
                  {stats.totalRevenue > 0 ? Math.round((stats.usedRevenue / stats.totalRevenue) * 100) : 0}%
                </div>
                <div style={{ color: '#9ca3af', textAlign: 'center', fontSize: '0.9rem' }}>
                  Tasso di Utilizzo
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