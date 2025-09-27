import React, { useState, useEffect } from 'react';
import { getCookie } from '../utils/cookies';
import Button from './common/Button';

function AppointmentCalendar({ onSlotClick, onAppointmentClick, tatuatori, stanze }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'day' or 'week'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtri
  const [tatuatoreFilter, setTatuatoreFilter] = useState('');
  const [stanzaFilter, setStanzaFilter] = useState('');

  // Carica appuntamenti
  useEffect(() => {
    fetchAppointments();
  }, [currentDate, tatuatoreFilter, stanzaFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getCookie('adminToken');
      const startDate = getStartOfWeek(currentDate);
      const endDate = getEndOfWeek(currentDate);

      const queryParams = new URLSearchParams({
        data_inizio: startDate.toISOString(),
        data_fine: endDate.toISOString()
      });

      if (tatuatoreFilter) queryParams.append('tatuatore_id', tatuatoreFilter);
      if (stanzaFilter) queryParams.append('stanza_id', stanzaFilter);

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

  // Navigazione calendario
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Utility functions
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
  };

  const getDaysInView = () => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate);
      const days = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      return [currentDate];
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 21; hour++) {
      for (let minute = 0; minute < 60; minute += 60) { // Slot ogni ora per semplicità
        slots.push({
          hour,
          minute,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return slots;
  };

  const getAppointmentsForSlot = (day, hour, minute) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    return appointments.filter(appointment => {
      const appointmentStart = new Date(appointment.orario_inizio);
      const appointmentEnd = new Date(appointmentStart.getTime() + appointment.durata_minuti * 60000);

      return (
        appointmentStart < slotEnd &&
        appointmentEnd > slotStart &&
        appointmentStart.getDate() === day.getDate() &&
        appointmentStart.getMonth() === day.getMonth() &&
        appointmentStart.getFullYear() === day.getFullYear()
      );
    });
  };

  const getStatoColor = (stato) => {
    switch (stato) {
      case 'confermato': return 'rgba(34, 197, 94, 0.8)';
      case 'completato': return 'rgba(34, 197, 94, 0.6)';
      case 'cancellato': return 'rgba(239, 68, 68, 0.8)';
      case 'in_corso': return 'rgba(245, 158, 11, 0.8)';
      default: return 'rgba(107, 114, 128, 0.8)';
    }
  };

  const formatDateRange = () => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = getEndOfWeek(currentDate);
      return `${startOfWeek.toLocaleDateString('it-IT')} - ${endOfWeek.toLocaleDateString('it-IT')}`;
    } else {
      return currentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const days = getDaysInView();
  const timeSlots = getTimeSlots();

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 className="section-title">
            <i className="fas fa-calendar-alt"></i> Calendario Appuntamenti
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
            {formatDateRange()}
          </p>
        </div>

        {/* Controlli calendario */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Navigazione */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => navigateDate(-1)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            <Button onClick={goToToday} variant="secondary">
              Oggi
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigateDate(1)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>

          {/* View Mode */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={viewMode === 'day' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('day')}
              style={{ fontSize: '0.9rem' }}
            >
              Giorno
            </Button>
            <Button
              variant={viewMode === 'week' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('week')}
              style={{ fontSize: '0.9rem' }}
            >
              Settimana
            </Button>
          </div>

          {/* Filtri */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={tatuatoreFilter}
              onChange={(e) => setTatuatoreFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#f3f4f6',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Tutti i tatuatori</option>
              {tatuatori.map(tatuatore => (
                <option key={tatuatore.id} value={tatuatore.id}>
                  {tatuatore.nome}
                </option>
              ))}
            </select>

            <select
              value={stanzaFilter}
              onChange={(e) => setStanzaFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#f3f4f6',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Tutte le stanze</option>
              {stanze.map(stanza => (
                <option key={stanza.id} value={stanza.id}>
                  {stanza.nome}
                </option>
              ))}
            </select>
          </div>
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
          Caricamento calendario...
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

      {/* Calendario */}
      {!loading && !error && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `120px repeat(${days.length}, 1fr)`,
            minHeight: '600px'
          }}>
            {/* Header - Orari */}
            <div></div> {/* Empty corner */}
            {days.map((day, index) => (
              <div
                key={index}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRight: index < days.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}
              >
                <div style={{ fontWeight: '600', color: '#fbbf24' }}>
                  {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f3f4f6' }}>
                  {day.getDate()}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {day.toLocaleDateString('it-IT', { month: 'short' })}
                </div>
              </div>
            ))}

            {/* Body - Slot orari */}
            {timeSlots.map((slot, slotIndex) => (
              <React.Fragment key={slotIndex}>
                {/* Orario */}
                <div style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {slot.time}
                </div>

                {/* Giorni */}
                {days.map((day, dayIndex) => {
                  const slotAppointments = getAppointmentsForSlot(day, slot.hour, slot.minute);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dayIndex}
                      onClick={() => onSlotClick?.(day, slot.hour, slot.minute)}
                      style={{
                        padding: '0.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRight: dayIndex < days.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        background: isToday ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                        cursor: 'pointer',
                        position: 'relative',
                        minHeight: '60px'
                      }}
                      onMouseEnter={(e) => {
                        if (!slotAppointments.length) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!slotAppointments.length) {
                          e.target.style.background = isToday ? 'rgba(251, 191, 36, 0.05)' : 'transparent';
                        }
                      }}
                    >
                      {/* Appuntamenti */}
                      {slotAppointments.map((appointment, appIndex) => (
                        <div
                          key={appointment.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick?.(appointment);
                          }}
                          style={{
                            background: getStatoColor(appointment.stato),
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            marginBottom: '0.25rem',
                            fontSize: '0.8rem',
                            color: 'white',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                          title={`${appointment.tatuatore_nome} - ${appointment.cliente_nome || 'Senza nome'} (${appointment.durata_minuti}min)`}
                        >
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                            {appointment.tatuatore_nome}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                            {appointment.cliente_nome || appointment.cliente_telefono || 'Senza nome'}
                          </div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            {appointment.stanza_nome} • {appointment.durata_minuti}min
                          </div>
                        </div>
                      ))}

                      {/* Indicatore slot vuoto */}
                      {!slotAppointments.length && (
                        <div style={{
                          position: 'absolute',
                          bottom: '0.25rem',
                          left: '0.25rem',
                          right: '0.25rem',
                          height: '2px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '1px'
                        }}></div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h4 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1rem' }}>
          <i className="fas fa-info-circle"></i> Legenda
        </h4>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: 'rgba(34, 197, 94, 0.8)',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>Confermato</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: 'rgba(245, 158, 11, 0.8)',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>In Corso</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: 'rgba(34, 197, 94, 0.6)',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>Completato</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '16px',
              height: '16px',
              background: 'rgba(239, 68, 68, 0.8)',
              borderRadius: '2px'
            }}></div>
            <span style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>Cancellato</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppointmentCalendar;