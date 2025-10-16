import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { getCookie } from '../utils/cookies';
import Button from './common/Button';

const SERVICE_START_HOUR = 9;
const SERVICE_END_HOUR = 21; // escluso
const SLOT_INTERVAL_MINUTES = 30;

function AppointmentCalendar({ onSlotClick, onAppointmentClick, tatuatori, stanze }) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  });
  const [viewMode, setViewMode] = useState('week'); // 'day' or 'week'
  const [groupMode, setGroupMode] = useState('tatuatore'); // 'tatuatore' | 'stanza' | 'stato'
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtri
  const [tatuatoreFilter, setTatuatoreFilter] = useState('');
  const [stanzaFilter, setStanzaFilter] = useState('');

  // Carica appuntamenti
  useEffect(() => {
    fetchAppointments();
  }, [currentDate, tatuatoreFilter, stanzaFilter, viewMode]);

  const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    return getStartOfDay(d);
  };

  const getEndOfWeek = (date) => {
    const startOfWeek = getStartOfWeek(date);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return getEndOfDay(endOfWeek);
  };

  const getViewRange = (date, mode) => {
    if (mode === 'day') {
      return {
        start: getStartOfDay(date),
        end: getEndOfDay(date)
      };
    }

    return {
      start: getStartOfWeek(date),
      end: getEndOfWeek(date)
    };
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getCookie('adminToken');
      const { start: startDate, end: endDate } = getViewRange(currentDate, viewMode);

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
    newDate.setHours(0, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
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
    for (let hour = SERVICE_START_HOUR; hour < SERVICE_END_HOUR; hour++) {
      for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
        const slotTime = new Date();
        slotTime.setHours(hour, minute, 0, 0);
        slots.push({
          hour,
          minute,
          time: slotTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
        });
      }
    }
    return slots;
  };

  const getAppointmentsForSlot = (day, hour, minute) => {
    const slotStart = new Date(day);
    slotStart.setHours(hour, minute, 0, 0);

    const slotEnd = new Date(slotStart.getTime() + SLOT_INTERVAL_MINUTES * 60000);

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

  const getGroupMeta = (appointment) => {
    switch (groupMode) {
      case 'stanza':
        return {
          key: appointment.stanza_id || 'no_room',
          label: appointment.stanza_nome || 'Stanza non assegnata',
          accent: 'rgba(24, 24, 27, 0.85)'
        };
      case 'stato':
        return {
          key: appointment.stato || 'sconosciuto',
          label: (appointment.stato || 'Sconosciuto').replace('_', ' '),
          accent: getStatoColor(appointment.stato)
        };
      case 'tatuatore':
      default:
        return {
          key: appointment.tatuatore_id || 'no_artist',
          label: appointment.tatuatore_nome || 'Tatuatore non assegnato',
          accent: 'rgba(249, 115, 22, 0.6)'
        };
    }
  };

  const groupSlotAppointments = (slotAppointments) => {
    if (!slotAppointments.length) return [];

    const groups = new Map();
    slotAppointments.forEach((appointment) => {
      const meta = getGroupMeta(appointment);
      if (!groups.has(meta.key)) {
        groups.set(meta.key, { meta, appointments: [] });
      }
      groups.get(meta.key).appointments.push(appointment);
    });

    const statusOrder = { confermato: 1, in_corso: 2, completato: 3, cancellato: 4 };
    const resourceOrder = groupMode === 'tatuatore'
      ? filteredTatuatori.map(t => t.id)
      : groupMode === 'stanza'
        ? filteredStanze.map(s => s.id)
        : [];

    const entries = Array.from(groups.values());

    entries.forEach(entry => {
      entry.appointments.sort((a, b) => new Date(a.orario_inizio) - new Date(b.orario_inizio));
    });

    return entries.sort((a, b) => {
      if (groupMode === 'stato') {
        return (statusOrder[a.meta.key] || 99) - (statusOrder[b.meta.key] || 99);
      }
      if (resourceOrder.length) {
        const indexA = resourceOrder.indexOf(a.meta.key);
        const indexB = resourceOrder.indexOf(b.meta.key);
        if (indexA !== -1 || indexB !== -1) {
          return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
        }
      }
      return a.meta.label.localeCompare(b.meta.label, 'it');
    });
  };

  const formatTimeRange = (appointment) => {
    const start = new Date(appointment.orario_inizio);
    const end = new Date(start.getTime() + appointment.durata_minuti * 60000);
    return `${start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const { start: viewStart, end: viewEnd } = useMemo(() => getViewRange(currentDate, viewMode), [currentDate, viewMode]);

  const appointmentsInView = useMemo(() => (
    appointments.filter(appointment => {
      const start = new Date(appointment.orario_inizio);
      return start >= viewStart && start <= viewEnd;
    })
  ), [appointments, viewStart, viewEnd]);

  const statusSummary = useMemo(() => {
    const base = { confermato: 0, in_corso: 0, completato: 0, cancellato: 0 };
    appointmentsInView.forEach(app => {
      base[app.stato] = (base[app.stato] || 0) + 1;
    });
    return base;
  }, [appointmentsInView]);

  const uniqueTatuatori = useMemo(() => new Set(appointmentsInView.map(app => app.tatuatore_id)).size, [appointmentsInView]);
  const uniqueStanze = useMemo(() => new Set(appointmentsInView.map(app => app.stanza_id)).size, [appointmentsInView]);
  const totalHours = useMemo(() => {
    const minutes = appointmentsInView.reduce((acc, app) => acc + (app.durata_minuti || 0), 0);
    return (minutes / 60).toFixed(1);
  }, [appointmentsInView]);

  const filteredTatuatori = useMemo(() => {
    if (!Array.isArray(tatuatori)) return [];
    if (!tatuatoreFilter) return tatuatori;
    return tatuatori.filter(t => t.id === tatuatoreFilter);
  }, [tatuatori, tatuatoreFilter]);

  const filteredStanze = useMemo(() => {
    if (!Array.isArray(stanze)) return [];
    if (!stanzaFilter) return stanze;
    return stanze.filter(s => s.id === stanzaFilter);
  }, [stanze, stanzaFilter]);

  const days = getDaysInView();
  const timeSlots = getTimeSlots();
  const hasAppointments = appointmentsInView.length > 0;

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '1rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Totale appuntamenti</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fbbf24' }}>{appointmentsInView.length}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Nel periodo selezionato</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '1rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tatuatori coinvolti</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fbbf24' }}>{uniqueTatuatori}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Risorse umane in agenda</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '1rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stanze occupate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#fbbf24' }}>{uniqueStanze}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Spazi prenotati</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '1rem'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ore pianificate</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#34d399' }}>{totalHours}</div>
          <div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Totale durata appuntamenti</div>
        </div>
      </div>

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
            <CalendarDaysIcon className="section-title-icon" aria-hidden="true" /> Calendario Appuntamenti
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', margin: 0 }}>
            {formatDateRange()}
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
            Orario servizio: {SERVICE_START_HOUR.toString().padStart(2, '0')}:00 - {(SERVICE_END_HOUR - 1).toString().padStart(2, '0')}:59 • Slot di {SLOT_INTERVAL_MINUTES} minuti
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
              aria-label="Giorno precedente"
            >
              <ChevronLeftIcon className="icon-inline icon-no-margin" aria-hidden="true" />
            </Button>
            <Button onClick={goToToday} variant="secondary">
              Oggi
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigateDate(1)}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              aria-label="Giorno successivo"
            >
              <ChevronRightIcon className="icon-inline icon-no-margin" aria-hidden="true" />
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

          {/* Raggruppamento */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <label style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Raggruppa per</label>
            <select
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                color: '#f3f4f6',
                fontSize: '0.9rem'
              }}
            >
              <option value="tatuatore">Tatuatore</option>
              <option value="stanza">Stanza</option>
              <option value="stato">Stato</option>
            </select>
          </div>

          {/* Filtri */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <select
              value={tatuatoreFilter}
              onChange={(e) => setTatuatoreFilter(e.target.value)}
              style={{
                padding: '0.5rem',
                backgroundColor: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
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
                backgroundColor: '#000000',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
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

      {/* Stato appuntamenti */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.5rem'
      }}>
        {[
          { label: 'Confermati', value: statusSummary.confermato, color: 'rgba(34, 197, 94, 0.25)' },
          { label: 'In corso', value: statusSummary.in_corso, color: 'rgba(245, 158, 11, 0.25)' },
          { label: 'Completati', value: statusSummary.completato, color: 'rgba(34, 197, 94, 0.15)' },
          { label: 'Cancellati', value: statusSummary.cancellato, color: 'rgba(239, 68, 68, 0.2)' }
        ].map((status) => (
          <div
            key={status.label}
            style={{
              flex: '1 1 160px',
              minWidth: '150px',
              padding: '0.75rem',
              borderRadius: '6px',
              background: status.color,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5e7eb' }}>{status.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{status.value}</div>
          </div>
        ))}
      </div>

      {/* Loading e Error states */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af'
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Caricamento calendario
          </div>
          Attendi qualche istante mentre recuperiamo gli appuntamenti.
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
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Si è verificato un errore
          </div>
          {error}
        </div>
      )}

      {!loading && !error && !hasAppointments && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '6px',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '0.5rem',
            fontWeight: 600
          }}>
            Nessun appuntamento disponibile
          </div>
          Nessun appuntamento nel periodo selezionato. Utilizza i pulsanti sopra per aggiungere una nuova prenotazione.
        </div>
      )}

      {/* Calendario */}
      {!loading && !error && hasAppointments && (
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
                  const groupedAppointments = groupSlotAppointments(slotAppointments);

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
                      {groupedAppointments.map(group => (
                        <div
                          key={group.meta.key}
                          style={{
                            background: 'rgba(0, 0, 0, 0.65)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderLeft: `4px solid ${group.meta.accent}`,
                            borderRadius: '4px',
                            padding: '0.4rem 0.5rem',
                            marginBottom: '0.4rem',
                            color: '#f9fafb',
                            fontSize: '0.8rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: '#fbbf24'
                          }}>
                            <span>{group.meta.label}</span>
                            <span style={{ fontSize: '0.7rem', color: '#d1d5db' }}>{group.appointments.length} appuntamento{group.appointments.length > 1 ? 'i' : ''}</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {group.appointments.map((appointment) => (
                              <div
                                key={appointment.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentClick?.(appointment);
                                }}
                                style={{
                                  background: getStatoColor(appointment.stato),
                                  borderRadius: '4px',
                                  padding: '0.35rem 0.45rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.2rem',
                                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)'
                                }}
                                title={`${appointment.tatuatore_nome} - ${appointment.cliente_nome || 'Senza nome'} (${appointment.durata_minuti}min)`}
                              >
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                  {appointment.cliente_nome || appointment.cliente_telefono || 'Cliente da definire'}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                  <span>{appointment.tatuatore_nome}</span>
                                  <span>{formatTimeRange(appointment)}</span>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#f3f4f6', opacity: 0.85 }}>
                                  {appointment.stanza_nome}
                                  {appointment.durata_minuti ? ` • ${appointment.durata_minuti} min` : ''}
                                </div>
                              </div>
                            ))}
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
        <h4 style={{ color: '#fbbf24', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <InformationCircleIcon aria-hidden="true" className="icon-inline icon-no-margin" />
          Legenda
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
