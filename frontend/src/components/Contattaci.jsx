import React from 'react';
import Button from './common/Button';

// Container component
function Container({ children, className = '' }) {
  return (
    <div className={`main-container ${className}`}>
      {children}
    </div>
  )
}

function Contattaci() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:info@tinkstudio.it';
  };

  const handleDirectionsClick = () => {
    window.open('https://maps.google.com/?q=Via+Kennedy,+39,+80028+Grumo+Nevano+NA', '_blank');
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+390818354729';
  };

  return (
    <Container>
      <div className="glass-card">
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '1rem' }}>
             Contattaci per informazioni, prenotazioni o per qualsiasi domanda sui nostri servizi
           </p>
        </div>
        
        <div className="contattaci-grid">
          {/* Informazioni di Contatto e Orari Uniti */}
          <div className="contattaci-card">
            <h2 style={{ 
              color: '#fbbf24', 
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>Informazioni</h2>
            
            {/* Sezione Orari */}
            <div className="contattaci-info-box" style={{ textAlign: 'left' }}>
              <p style={{
                  color: '#f9fafb',
                  margin: '0 0 0.5rem 0',
                  fontSize: '1rem'
                }}>
                  <strong>Orari di Apertura:</strong>
                </p>
                <p style={{
                  color: '#fbbf24',
                  margin: '0',
                  fontSize: '1.1rem',
                  fontWeight: '500'
                }}>
                  Lunedì - Sabato: <span style={{ color: '#22c55e', fontWeight: '600' }}>08:30 - 21:00</span><br/>
                  Domenica: <span style={{ color: '#ef4444', fontWeight: '600' }}>Chiuso</span>
                </p>
            </div>

            {/* Sezione Email */}
            <div>
              <Button 
                onClick={handleEmailClick}
                style={{ 
                  background: 'rgba(251, 191, 36, 0.1)',
                  border: '1px solid #fbbf24',
                  color: '#fbbf24',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  width: '100%',
                  textAlign: 'left',
                  marginBottom: '1.5rem'
                }}
              >
                info@tinkstudio.it
              </Button>

              <div className="contattaci-tip">
                <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>                  <i className="fas fa-lightbulb"></i> <strong>Consiglio:</strong> Per prenotazioni e informazioni dettagliate, 
                  contattaci via email per una risposta più rapida e completa.
                </p>
              </div>
            </div>
          </div>

          {/* Dove Siamo e Mappa Uniti */}
          <div className="contattaci-card">
            <h2 style={{ 
              color: '#fbbf24', 
              marginBottom: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: '600',
              textAlign: 'center'
            }}>              <i className="fas fa-map-marker-alt"></i> Dove Siamo            </h2>
            
            <div style={{ marginBottom: '0rem' }}>
              <div className="contattaci-info-box">
                <p style={{ color: '#f9fafb', margin: '0 0 0.5rem 0', fontSize: '1rem' }}>                  <strong><i className="fas fa-map-marker-alt"></i> Indirizzo:</strong>                </p>
                <p style={{ color: '#fbbf24', margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>
                  Via Kennedy, 39<br/>
                  80028 Grumo Nevano (NA)
                </p>
              </div>

              <Button 
                onClick={handleDirectionsClick}
                style={{ 
                  background: '#fbbf24',
                  color: '#000',
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  width: '100%',
                  marginBottom: '1.5rem'
                }}
              >                <i className="fas fa-directions"></i> Ottieni Indicazioni              </Button>
            </div>

            {/* Mappa Integrata */}
            <div className="contattaci-map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3019.8234567890123!2d14.2345678!3d40.9123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zVmlhIEtlbm5lZHksIDM5LCA4MDAyOCBHcnVtbyBOZXZhbm8gTkE!5e0!3m2!1sit!2sit!4v1234567890123"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 0
                }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="T'ink Tattoo Studio Location"
              />
            </div>
            

          </div>
        </div>


      </div>
    </Container>
  );
}

export default Contattaci;