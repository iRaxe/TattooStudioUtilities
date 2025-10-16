import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from './common/Button';
import './TattooConsentForm.css';

const initialFormState = {
  fullName: '',
  birthCity: '',
  birthProvince: '',
  birthDate: '',
  residenceCity: '',
  residenceStreet: '',
  residenceNumber: '',
  residenceProvince: '',
  phoneNumber: '',
  documentType: '',
  documentIssuer: '',
  documentNumber: '',
  isMinorClient: false,
  minorName: '',
  minorBirthCity: '',
  minorBirthProvince: '',
  minorBirthDate: '',
  minorResidenceCity: '',
  minorResidenceStreet: '',
  minorResidenceNumber: '',
  minorResidenceProvince: '',
  requestedWork: '',
  artistName: '',
  appointmentDate: '',
  acknowledgeInformed: false,
  confirmHealth: false,
  releaseLiability: false,
  consentPublication: false,
  acceptPrivacy: false
};

function SignatureDialog({ onClose, onSave, existingSignature }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2;
    context.strokeStyle = '#000000';
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (existingSignature) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = existingSignature;
    }

    contextRef.current = context;
  }, [existingSignature]);

  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches[0]) {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    event.preventDefault();
    const context = contextRef.current;
    if (!context) {
      return;
    }
    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
    isDrawing.current = true;
  };

  const draw = (event) => {
    if (!isDrawing.current) {
      return;
    }
    event.preventDefault();
    const context = contextRef.current;
    if (!context) {
      return;
    }
    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = (event) => {
    if (!isDrawing.current) {
      return;
    }
    event.preventDefault();
    const context = contextRef.current;
    if (!context) {
      return;
    }
    context.closePath();
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) {
      return;
    }
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onSave(null);
      return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="tattoo-consent-signature-backdrop">
      <div className="tattoo-consent-signature-modal">
        <h2 className="tattoo-consent-signature-title">Firma digitale</h2>
        <p className="tattoo-consent-signature-instructions">
          Disegna la tua firma nell&apos;area sottostante utilizzando mouse, touch o penna. Quando sei soddisfatto premi &quot;Salva firma&quot;.
        </p>
        <div className="tattoo-consent-signature-canvas">
          <canvas
            ref={canvasRef}
            width={640}
            height={220}
            className="tattoo-consent-signature-canvas__inner"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        <div className="tattoo-consent-signature-actions">
          <Button type="button" variant="ghost" onClick={clearCanvas} className="tattoo-consent-btn">
            Cancella
          </Button>
          <Button type="button" onClick={handleSave} className="tattoo-consent-btn tattoo-consent-btn--accent">
            Salva firma
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="tattoo-consent-btn tattoo-consent-btn--ghost tattoo-consent-btn--align-end"
          >
            Annulla
          </Button>
        </div>
      </div>
    </div>
  );
}

function TattooConsentForm() {
  const [formData, setFormData] = useState({ ...initialFormState });
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMinorToggle = (event) => {
    const { checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      isMinorClient: checked
    }));
  };

  const handleSignatureSave = (dataUrl) => {
    setSignature(dataUrl);
    setIsSignatureDialogOpen(false);
  };

  const fieldIsValid = useMemo(() => {
    const baseFieldsFilled = Boolean(
      formData.fullName &&
      formData.birthCity &&
      formData.birthProvince &&
      formData.birthDate &&
      formData.residenceCity &&
      formData.residenceStreet &&
      formData.residenceNumber &&
      formData.residenceProvince &&
      formData.phoneNumber &&
      formData.documentType &&
      formData.documentIssuer &&
      formData.documentNumber &&
      formData.requestedWork &&
      formData.artistName &&
      formData.appointmentDate &&
      formData.acknowledgeInformed &&
      formData.confirmHealth &&
      formData.releaseLiability &&
      formData.consentPublication &&
      formData.acceptPrivacy &&
      signature
    );

    if (!baseFieldsFilled) {
      return false;
    }

    if (!formData.isMinorClient) {
      return true;
    }

    return Boolean(
      formData.minorName &&
      formData.minorBirthCity &&
      formData.minorBirthProvince &&
      formData.minorBirthDate &&
      formData.minorResidenceCity &&
      formData.minorResidenceStreet &&
      formData.minorResidenceNumber &&
      formData.minorResidenceProvince
    );
  }, [formData, signature]);

  const buildPayload = () => {
    const nameParts = (formData.fullName || '').trim().split(/\s+/).filter(Boolean);
    const [firstName = '', ...otherNameParts] = nameParts;
    const lastName = otherNameParts.length > 0 ? otherNameParts.join(' ') : firstName;
    const sanitizedPhone = (formData.phoneNumber || '').replace(/\D/g, '').trim();
    const primaryAddress = [formData.residenceStreet, formData.residenceNumber]
      .map((value) => (value || '').trim())
      .filter(Boolean)
      .join(' ');

    const payload = {
      type: 'tatuaggio',
      formType: 'tatuaggio',
      firstName,
      lastName,
      fullName: formData.fullName,
      phone: sanitizedPhone,
      phoneNumber: formData.phoneNumber,
      birthDate: formData.birthDate,
      birthCity: formData.birthCity,
      birthProvince: formData.birthProvince,
      birthPlace: formData.birthProvince ? `${formData.birthCity} (${formData.birthProvince})` : formData.birthCity,
      address: primaryAddress,
      residenceStreet: formData.residenceStreet,
      residenceNumber: formData.residenceNumber,
      residenceCity: formData.residenceCity,
      residenceProvince: formData.residenceProvince,
      documentType: formData.documentType,
      documentIssuer: formData.documentIssuer,
      documentNumber: formData.documentNumber,
      requestedWork: formData.requestedWork,
      artistName: formData.artistName,
      appointmentDate: formData.appointmentDate,
      acknowledgeInformed: formData.acknowledgeInformed,
      confirmHealth: formData.confirmHealth,
      releaseLiability: formData.releaseLiability,
      consentPublication: formData.consentPublication,
      acceptPrivacy: formData.acceptPrivacy,
      isMinorClient: formData.isMinorClient,
      signature,
      submittedAt: new Date().toISOString()
    };

    if (formData.isMinorClient) {
      payload.minor = {
        name: formData.minorName,
        birthCity: formData.minorBirthCity,
        birthProvince: formData.minorBirthProvince,
        birthDate: formData.minorBirthDate,
        residenceCity: formData.minorResidenceCity,
        residenceStreet: formData.minorResidenceStreet,
        residenceNumber: formData.minorResidenceNumber,
        residenceProvince: formData.minorResidenceProvince
      };
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fieldIsValid) {
      window.alert('Per favore completa tutti i campi obbligatori, firma inclusa.');
      return;
    }

    const payload = buildPayload();

    if (!payload.firstName || !payload.lastName) {
      window.alert('Inserisci nome e cognome completi per proseguire.');
      return;
    }

    if (!payload.phone) {
      window.alert('Inserisci un numero di telefono valido (solo numeri).');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/consenso/tatuaggio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || 'Si è verificato un errore durante il salvataggio del consenso.';
        throw new Error(errorMessage);
      }

      console.info('Consenso tatuaggio salvato', { payload, response: data });
      window.alert('Consenso registrato correttamente. Riceverai conferma al momento della seduta.');
      setFormData({ ...initialFormState });
      setSignature(null);
    } catch (error) {
      console.error('Errore durante il salvataggio del consenso tatuaggio:', error);
      window.alert(error.message || 'Si è verificato un errore inatteso durante la registrazione del consenso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container">
      <div className="glass-card tattoo-consent-card">
        <header className="tattoo-consent-header">
          <p className="tattoo-consent-subtitle">
            Compila ogni sezione con attenzione. Tutte le informazioni sono necessarie per procedere alla prestazione richiesta presso T&apos;ink Tattoo Studio.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="tattoo-consent-form">
          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">01</span>
              <h2 className="tattoo-consent-section__title">Dati del dichiarante</h2>
            </div>
            <div className="tattoo-consent-grid tattoo-consent-grid--two">
              <label className="tattoo-consent-field">
                <span>Il/La sottoscritto/a *</span>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Nome e cognome"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Nato/a a *</span>
                <input
                  name="birthCity"
                  value={formData.birthCity}
                  onChange={handleInputChange}
                  placeholder="Citta' di nascita"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Provincia (sigla) *</span>
                <input
                  name="birthProvince"
                  value={formData.birthProvince}
                  onChange={handleInputChange}
                  placeholder="Es. NA"
                  maxLength={2}
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Data di nascita *</span>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Residente a *</span>
                <input
                  name="residenceCity"
                  value={formData.residenceCity}
                  onChange={handleInputChange}
                  placeholder="Comune di residenza"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Via *</span>
                <input
                  name="residenceStreet"
                  value={formData.residenceStreet}
                  onChange={handleInputChange}
                  placeholder="Via/Piazza"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Nr. civico *</span>
                <input
                  name="residenceNumber"
                  value={formData.residenceNumber}
                  onChange={handleInputChange}
                  placeholder="Numero"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Provincia di residenza *</span>
                <input
                  name="residenceProvince"
                  value={formData.residenceProvince}
                  onChange={handleInputChange}
                  placeholder="Es. NA"
                  maxLength={2}
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Numero di cellulare *</span>
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+39 ..."
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Tipo di documento *</span>
                <input
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  placeholder="Carta di identita' / Passaporto ..."
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Rilasciato da *</span>
                <input
                  name="documentIssuer"
                  value={formData.documentIssuer}
                  onChange={handleInputChange}
                  placeholder="Comune / Questura ..."
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Numero documento *</span>
                <input
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleInputChange}
                  placeholder="Inserisci numero documento"
                  required
                />
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">02</span>
              <h2 className="tattoo-consent-section__title">Cliente minorenne</h2>
            </div>
            <label className="tattoo-consent-checkbox tattoo-consent-checkbox--toggle">
              <input type="checkbox" checked={formData.isMinorClient} onChange={handleMinorToggle} />
              <span>Il cliente che riceve il tatuaggio e&apos; minorenne</span>
            </label>

            {formData.isMinorClient ? (
              <div className="tattoo-consent-grid tattoo-consent-grid--two tattoo-consent-grid--minor">
                <label className="tattoo-consent-field">
                  <span>Genitore/Tutore di *</span>
                  <input
                    name="minorName"
                    value={formData.minorName}
                    onChange={handleInputChange}
                    placeholder="Nome e cognome del minore"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Nato/a a *</span>
                  <input
                    name="minorBirthCity"
                    value={formData.minorBirthCity}
                    onChange={handleInputChange}
                    placeholder="Citta' di nascita del minore"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Provincia (sigla) *</span>
                  <input
                    name="minorBirthProvince"
                    value={formData.minorBirthProvince}
                    onChange={handleInputChange}
                    placeholder="Es. NA"
                    maxLength={2}
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Data di nascita *</span>
                  <input
                    type="date"
                    name="minorBirthDate"
                    value={formData.minorBirthDate}
                    onChange={handleInputChange}
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Residente a *</span>
                  <input
                    name="minorResidenceCity"
                    value={formData.minorResidenceCity}
                    onChange={handleInputChange}
                    placeholder="Comune di residenza del minore"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Via *</span>
                  <input
                    name="minorResidenceStreet"
                    value={formData.minorResidenceStreet}
                    onChange={handleInputChange}
                    placeholder="Via/Piazza"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Nr. civico *</span>
                  <input
                    name="minorResidenceNumber"
                    value={formData.minorResidenceNumber}
                    onChange={handleInputChange}
                    placeholder="Numero"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Provincia *</span>
                  <input
                    name="minorResidenceProvince"
                    value={formData.minorResidenceProvince}
                    onChange={handleInputChange}
                    placeholder="Es. NA"
                    maxLength={2}
                    required={formData.isMinorClient}
                  />
                </label>
              </div>
            ) : (
              <p className="tattoo-consent-note">Dichiaro sotto la mia responsabilita&apos; di essere maggiorenne.</p>
            )}
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">03</span>
              <h2 className="tattoo-consent-section__title">Informativa sul trattamento</h2>
            </div>
            <p className="tattoo-consent-text">
              Di essere stato/a informato/a dell&apos;attivita&apos; di tatuaggio e piercing e che:
            </p>
            <ol className="tattoo-consent-list">
              <li>Il tatuaggio consiste nell&apos;introduzione nella cute di pigmenti di varia natura.</li>
              <li>L&apos;esecuzione del tatuaggio avverra&apos; esclusivamente tramite strumenti sterili e monouso.</li>
              <li>La cura del tatuaggio deve essere eseguita minuziosamente per garantire la corretta guarigione.</li>
              <li>L&apos;artista tatuatore potra&apos; interpretare liberamente il soggetto proposto.</li>
              <li>Per rimuovere il tatuaggio e&apos; necessario ricorrere a interventi chirurgici di piccola o media entita&apos;.</li>
              <li>Con tatuaggi e piercing possono essere trasmesse malattie infettive gravi (es. AIDS, epatiti B e C).</li>
              <li>Si puo&apos; essere o diventare allergici ai pigmenti o ai metalli.</li>
              <li>E&apos; vietato praticare tatuaggi o piercing su cute con infiammazione in atto.</li>
            </ol>
            <label className="tattoo-consent-checkbox">
              <input
                type="checkbox"
                name="acknowledgeInformed"
                checked={formData.acknowledgeInformed}
                onChange={handleInputChange}
              />
              <span>Confermo di aver compreso l&apos;intera informativa di cui sopra *</span>
            </label>

            <div className="tattoo-consent-info">
              <p>
                Dichiaro inoltre di non presentare, al momento della pratica, patologie o situazioni quali malattie del sangue, cardiopatie, diabete non trattato, malattie della pelle, malattie neurologiche, disturbi della cicatrizzazione, gravidanza o allattamento e di non fare uso di farmaci quali anticoagulanti, antiaggreganti, cortisone, immunodepressori o sostanze che favoriscono infezioni.
              </p>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="confirmHealth"
                  checked={formData.confirmHealth}
                  onChange={handleInputChange}
                />
                <span>Confermo quanto sopra dichiarato in merito al mio stato di salute *</span>
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">04</span>
              <h2 className="tattoo-consent-section__title">Richiesta e responsabilita&apos;</h2>
            </div>
            <div className="tattoo-consent-grid tattoo-consent-grid--two">
              <label className="tattoo-consent-field">
                <span>Con la presente richiedo la realizzazione di *</span>
                <input
                  name="requestedWork"
                  value={formData.requestedWork}
                  onChange={handleInputChange}
                  placeholder="Descrizione del tatuaggio/piercing richiesto"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Ed esonero il sig./la sig.ra *</span>
                <input
                  name="artistName"
                  value={formData.artistName}
                  onChange={handleInputChange}
                  placeholder="Nome dell'artista"
                  required
                />
              </label>
            </div>
            <label className="tattoo-consent-checkbox">
              <input
                type="checkbox"
                name="releaseLiability"
                checked={formData.releaseLiability}
                onChange={handleInputChange}
              />
              <span>Esonero l&apos;artista da responsabilita&apos; o richieste di risarcimento legate alla prestazione richiesta *</span>
            </label>
            <label className="tattoo-consent-checkbox">
              <input
                type="checkbox"
                name="consentPublication"
                checked={formData.consentPublication}
                onChange={handleInputChange}
              />
              <span>Autorizzo la pubblicazione e l&apos;esposizione di foto o video del lavoro eseguito *</span>
            </label>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">05</span>
              <h2 className="tattoo-consent-section__title">Informativa privacy (D.lgs. 196/2003)</h2>
            </div>
            <div className="tattoo-consent-privacy">
              <p>
                I dati forniti saranno trattati per finalita&apos; di legge con modalita&apos; manuali e/o fotocopia. Il conferimento dei dati e&apos; obbligatorio e il rifiuto comporta l&apos;impossibilita&apos; di procedere con la prestazione. I dati non saranno comunicati o diffusi. Per la progettazione e lo sviluppo del tattoo e&apos; previsto un acconto non rimborsabile in caso di disdetta, rinuncia o mancata presentazione.
              </p>
            </div>
            <label className="tattoo-consent-checkbox">
              <input
                type="checkbox"
                name="acceptPrivacy"
                checked={formData.acceptPrivacy}
                onChange={handleInputChange}
              />
              <span>Ho letto e accetto l&apos;informativa privacy ai sensi del D.lgs. 196/2003 *</span>
            </label>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">06</span>
              <h2 className="tattoo-consent-section__title">Firma digitale</h2>
            </div>
            <div className="tattoo-consent-signature">
              {signature ? (
                <div className="tattoo-consent-signature-preview">
                  <p>Firma salvata. Puoi sostituirla in qualsiasi momento.</p>
                  <img src={signature} alt="Firma digitale" />
                </div>
              ) : (
                <p className="tattoo-consent-text">
                  Per completare il consenso e&apos; richiesta la tua firma digitale. Verra&apos; aperto un pannello in cui potrai disegnarla manualmente.
                </p>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsSignatureDialogOpen(true)}
                className="tattoo-consent-btn"
              >
                Disegna firma
              </Button>
            </div>

            <div className="tattoo-consent-signature-meta">
              <label className="tattoo-consent-field tattoo-consent-signature-date">
                <span>Data prevista per la prestazione *</span>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>
          </section>

          <div className="tattoo-consent-submit">
            <Button
              type="submit"
              disabled={!fieldIsValid || isSubmitting}
              className="tattoo-consent-btn tattoo-consent-submit__button"
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia consenso'}
            </Button>
          </div>
        </form>
      </div>

      {isSignatureDialogOpen && (
        <SignatureDialog
          onClose={() => setIsSignatureDialogOpen(false)}
          onSave={handleSignatureSave}
          existingSignature={signature}
        />
      )}
    </div>
  );
}

export default TattooConsentForm;
