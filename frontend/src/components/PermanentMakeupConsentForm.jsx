import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from './common/Button';
import './TattooConsentForm.css';

const healthQuestions = [
  { key: 'hemophilia', label: 'Emofilia' },
  { key: 'diabetes', label: 'Diabete mellito' },
  { key: 'hepatitis', label: 'Epatite (A, B, C, D, E, F)' },
  { key: 'hiv', label: 'HIV' },
  { key: 'skinDiseases', label: 'Malattie della pelle' },
  { key: 'eczema', label: 'Eczema' },
  { key: 'allergies', label: 'Allergie (specificare)' },
  { key: 'autoimmune', label: 'Malattie autoimmuni' },
  { key: 'herpes', label: "E' o e' stato predisposto all'herpes" },
  { key: 'infectiousDiseases', label: 'Malattie infettive o febbre alta (al momento del trattamento)' },
  { key: 'epilepsy', label: 'Epilessia' },
  { key: 'cardiovascular', label: 'Problemi cardiovascolari' },
  { key: 'anticoagulants', label: 'Assume o ha assunto anticoagulanti' },
  { key: 'pregnancy', label: "E' in stato di gravidanza" },
  { key: 'regularMedication', label: 'Assume regolarmente medicine' },
  { key: 'pacemaker', label: 'Ha un pacemaker' },
  { key: 'woundHealingIssues', label: 'Problemi di cicatrizzazione delle ferite' },
  { key: 'alcoholOrDrugs24h', label: 'Ha assunto alcol o droghe nelle ultime 24 ore' },
  { key: 'medicalProcedures24h', label: 'Ha subito interventi medici nelle ultime 24 ore' },
  { key: 'other', label: 'Altro' },
];

const createEmptySession = () => ({
  date: '',
  effect: '',
});

const MAX_TREATMENT_SESSIONS = 6;

const createInitialFormState = () => ({
  subscriberTitle: 'Il sottoscritto',
  fullName: '',
  birthCity: '',
  birthProvince: '',
  birthDate: '',
  residenceCity: '',
  residenceProvince: '',
  postalCode: '',
  residenceStreet: '',
  residenceNumber: '',
  phoneNumber: '',
  email: '',
  documentType: '',
  documentNumber: '',
  documentIssuer: '',
  fiscalCode: '',
  instagramAccount: '',
  consentDate: '',
  colorTestArea: '',
  colorTestDate: '',
  colorTestChoice: 'authorize_without_test',
  treatmentSessions: [createEmptySession()],
  healthSurvey: {
    hemophilia: '',
    diabetes: '',
    hepatitis: '',
    hiv: '',
    skinDiseases: '',
    eczema: '',
    allergies: '',
    allergyNotes: '',
    autoimmune: '',
    herpes: '',
    infectiousDiseases: '',
    epilepsy: '',
    cardiovascular: '',
    anticoagulants: '',
    pregnancy: '',
    regularMedication: '',
    pacemaker: '',
    woundHealingIssues: '',
    alcoholOrDrugs24h: '',
    medicalProcedures24h: '',
    other: '',
    otherNotes: '',
  },
  otherHealthNotes: '',
  hasCoverUp: false,
  coverUpAcknowledgement: false,
  coverUpNotes: '',
  isMinorClient: false,
  guardianFirstName: '',
  guardianLastName: '',
  guardianDocumentType: '',
  guardianDocumentNumber: '',
  guardianRelationship: '',
  guardianAcknowledgement: false,
  consentInformation: false,
  consentRisks: false,
  consentAftercare: false,
  consentMultipleSessions: false,
  consentColorChanges: false,
  consentTimeGap: false,
  consentLiability: false,
  privacyConsent: false,
  photoConsent: false,
});

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
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
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
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
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
          Disegna la tua firma nell'area sottostante utilizzando mouse, touch o penna. Quando sei soddisfatto premi
          &quot;Salva firma&quot;.
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

function PermanentMakeupConsentForm() {
  const [formData, setFormData] = useState(() => createInitialFormState());
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [signature, setSignature] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!formData.isMinorClient) {
      setFormData((prev) => ({
        ...prev,
        guardianFirstName: '',
        guardianLastName: '',
        guardianDocumentType: '',
        guardianDocumentNumber: '',
        guardianRelationship: '',
        guardianAcknowledgement: false,
      }));
    }
  }, [formData.isMinorClient]);

  const fieldIsValid = useMemo(() => {
    const trimmed = (value) => (value || '').trim();
    const sanitizedPhone = (formData.phoneNumber || '').replace(/\D/g, '').trim();

    const hasRequiredAnagraphic =
      trimmed(formData.subscriberTitle) &&
      trimmed(formData.fullName) &&
      trimmed(formData.birthCity) &&
      trimmed(formData.birthProvince) &&
      formData.birthDate &&
      trimmed(formData.documentType) &&
      trimmed(formData.documentIssuer) &&
      trimmed(formData.documentNumber) &&
      trimmed(formData.residenceCity) &&
      trimmed(formData.residenceProvince) &&
      trimmed(formData.residenceStreet) &&
      trimmed(formData.residenceNumber) &&
      sanitizedPhone;

    const hasConsents =
      formData.consentInformation &&
      formData.consentRisks &&
      formData.consentAftercare &&
      formData.consentMultipleSessions &&
      formData.consentColorChanges &&
      formData.consentTimeGap &&
      formData.consentLiability &&
      formData.privacyConsent;

    const hasSignature = Boolean(signature);

    if (!hasRequiredAnagraphic || !hasConsents || !hasSignature) {
      return false;
    }

    if (!formData.isMinorClient) {
      return true;
    }

    return (
      trimmed(formData.guardianFirstName) &&
      trimmed(formData.guardianLastName) &&
      trimmed(formData.guardianDocumentType) &&
      trimmed(formData.guardianDocumentNumber) &&
      trimmed(formData.guardianRelationship) &&
      formData.guardianAcknowledgement
    );
  }, [formData, signature]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleHealthSurveyChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      healthSurvey: {
        ...prev.healthSurvey,
        [key]: value,
      },
    }));
  };

  const handleTreatmentSessionChange = (index, field, value) => {
    setFormData((prev) => {
      const sessions = prev.treatmentSessions.map((session, idx) => {
        if (idx !== index) {
          return session;
        }
        return {
          ...session,
          [field]: value,
        };
      });
      return {
        ...prev,
        treatmentSessions: sessions,
      };
    });
  };

  const addTreatmentSession = () => {
    setFormData((prev) => {
      if (prev.treatmentSessions.length >= MAX_TREATMENT_SESSIONS) {
        return prev;
      }
      return {
        ...prev,
        treatmentSessions: [...prev.treatmentSessions, createEmptySession()],
      };
    });
  };

  const removeTreatmentSession = (index) => {
    setFormData((prev) => {
      if (prev.treatmentSessions.length <= 1) {
        return prev;
      }
      const updated = prev.treatmentSessions.filter((_, idx) => idx !== index);
      return {
        ...prev,
        treatmentSessions: updated.length > 0 ? updated : [createEmptySession()],
      };
    });
  };

  const handleSignatureSave = (value) => {
    setSignature(value);
    setIsSignatureDialogOpen(false);
  };

  const resetForm = () => {
    setFormData(createInitialFormState());
    setSignature(null);
  };

  const buildPayload = () => {
    const sanitizedPhone = (formData.phoneNumber || '').replace(/\D/g, '').trim();
    const addressLine = [formData.residenceStreet, formData.residenceNumber]
      .map((item) => (item || '').trim())
      .filter(Boolean)
      .join(' ');
    const normalizedFullName = (formData.fullName || '').trim();
    const [firstName = '', ...remainingNameParts] = normalizedFullName.split(/\s+/).filter(Boolean);
    const lastName = remainingNameParts.join(' ').trim() || firstName;

    const normalizedHealthSurvey = Object.entries(formData.healthSurvey).reduce((acc, [key, value]) => {
      if (key === 'allergyNotes' || key === 'otherNotes') {
        acc[key] = value || null;
        return acc;
      }
      if (value === '') {
        acc[key] = null;
        return acc;
      }
      acc[key] = value === 'yes';
      return acc;
    }, {});

    const treatmentSessions = formData.treatmentSessions
      .map((session) => ({
        date: session.date || null,
        effect: session.effect || null,
      }))
      .filter((session) => session.date || session.effect);

    const payload = {
      type: 'trucco_permanente',
      formType: 'trucco_permanente',
      subscriberTitle: formData.subscriberTitle,
      firstName: firstName,
      lastName: lastName,
      fullName: normalizedFullName,
      birthDate: formData.birthDate,
      birthCity: formData.birthCity.trim(),
      birthProvince: formData.birthProvince.trim(),
      birthPlace: formData.birthProvince ? `${formData.birthCity} (${formData.birthProvince})` : formData.birthCity,
      fiscalCode: formData.fiscalCode.trim(),
      instagramAccount: formData.instagramAccount.trim(),
      phone: sanitizedPhone,
      phoneNumber: formData.phoneNumber.trim(),
      email: formData.email.trim(),
      documentType: formData.documentType.trim(),
      documentNumber: formData.documentNumber.trim(),
      documentIssuer: formData.documentIssuer.trim(),
      consentDate: formData.consentDate || null,
      address: addressLine || null,
      residenceStreet: formData.residenceStreet.trim(),
      residenceNumber: formData.residenceNumber.trim(),
      residenceCity: formData.residenceCity.trim(),
      residenceProvince: formData.residenceProvince.trim(),
      postalCode: formData.postalCode.trim(),
      colorTestArea: formData.colorTestArea.trim(),
      colorTestDate: formData.colorTestDate || null,
      colorTestChoice: formData.colorTestChoice,
      treatmentSessions,
      healthSurvey: normalizedHealthSurvey,
      otherHealthNotes: formData.otherHealthNotes.trim(),
      hasCoverUp: formData.hasCoverUp,
      coverUpAcknowledgement: formData.coverUpAcknowledgement,
      coverUpNotes: formData.coverUpNotes.trim(),
      isMinorClient: formData.isMinorClient,
      statements: {
        consentInformation: formData.consentInformation,
        consentRisks: formData.consentRisks,
        consentAftercare: formData.consentAftercare,
        consentMultipleSessions: formData.consentMultipleSessions,
        consentColorChanges: formData.consentColorChanges,
        consentTimeGap: formData.consentTimeGap,
        consentLiability: formData.consentLiability,
      },
      privacyConsent: formData.privacyConsent,
      photoConsent: formData.photoConsent,
      acceptPrivacy: formData.privacyConsent,
      consentDataProcessing: formData.privacyConsent,
      consentPublication: formData.photoConsent,
      submittedAt: new Date().toISOString(),
      signature,
    };

    if (formData.isMinorClient) {
      payload.guardian = {
        firstName: formData.guardianFirstName.trim(),
        lastName: formData.guardianLastName.trim(),
        documentType: formData.guardianDocumentType.trim(),
        documentNumber: formData.guardianDocumentNumber.trim(),
        relationship: formData.guardianRelationship.trim(),
        acknowledgement: formData.guardianAcknowledgement,
      };
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!fieldIsValid) {
      window.alert('Completa tutti i campi obbligatori e assicurati di aver firmato il modulo.');
      return;
    }

    const payload = buildPayload();

    if (!payload.firstName || !payload.lastName) {
      window.alert('Inserisci nome e cognome validi.');
      return;
    }

    if (!payload.phone) {
      window.alert('Inserisci un numero di telefono valido (solo cifre).');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/consenso/trucco-permanente', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          data?.error || data?.message || 'Si e verificato un errore durante il salvataggio del consenso.';
        throw new Error(errorMessage);
      }

      window.alert('Consenso registrato correttamente. Grazie per la collaborazione!');
      resetForm();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Errore durante il salvataggio del consenso trucco permanente:', error);
      window.alert(error.message || 'Errore durante il salvataggio del consenso. Riprova piu tardi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="main-container">
      <div className="glass-card tattoo-consent-card">
        <header className="tattoo-consent-header">
          <p className="tattoo-consent-subtitle">
            Compila ogni sezione con attenzione. Le informazioni raccolte ci permettono di garantire un trattamento
            sicuro e personalizzato nel rispetto della normativa vigente.
          </p>
        </header>

        <form className="tattoo-consent-form" onSubmit={handleSubmit}>
          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">01</span>
              <h2 className="tattoo-consent-section__title">Dati del dichiarante</h2>
            </div>
            <div className="tattoo-consent-grid tattoo-consent-grid--responsive-four">
              <label className="tattoo-consent-field">
                <span>Il/La sottoscritto/a *</span>
                <select
                  name="subscriberTitle"
                  value={formData.subscriberTitle}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Il sottoscritto">Il sottoscritto</option>
                  <option value="La sottoscritta">La sottoscritta</option>
                  <option value="Il/La sottoscritto/a">Il/La sottoscritto/a</option>
                </select>
              </label>
              <label className="tattoo-consent-field">
                <span>Nome e cognome *</span>
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
                  placeholder="Citta di nascita"
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
                  title="gg/mm/aaaa"
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
                <span>Numero di cellulare *</span>
                <input
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+39 ..."
                  inputMode="tel"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Indirizzo email (facoltativo)"
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Tipo di documento *</span>
                <input
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  placeholder="Carta di identita / Passaporto ..."
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
                  placeholder="Numero documento"
                  required
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Codice fiscale</span>
                <input
                  name="fiscalCode"
                  value={formData.fiscalCode}
                  onChange={handleInputChange}
                  placeholder="Codice fiscale"
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Account Instagram</span>
                <input
                  name="instagramAccount"
                  value={formData.instagramAccount}
                  onChange={handleInputChange}
                  placeholder="@nomeutente"
                />
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">02</span>
              <h2 className="tattoo-consent-section__title">Cliente minorenne</h2>
            </div>
            <div className="tattoo-consent-checklist">
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="isMinorClient"
                  checked={formData.isMinorClient}
                  onChange={handleInputChange}
                />
                <span>Il cliente che si sottopone al trattamento è minorenne</span>
              </label>
            </div>
            {formData.isMinorClient && (
              <div className="tattoo-consent-grid tattoo-consent-grid--two tattoo-consent-grid--minor">
                <label className="tattoo-consent-field">
                  <span>Nome del tutore *</span>
                  <input
                    name="guardianFirstName"
                    value={formData.guardianFirstName}
                    onChange={handleInputChange}
                    placeholder="Nome del genitore o tutore"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Cognome del tutore *</span>
                  <input
                    name="guardianLastName"
                    value={formData.guardianLastName}
                    onChange={handleInputChange}
                    placeholder="Cognome del genitore o tutore"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Documento di riconoscimento *</span>
                  <input
                    name="guardianDocumentType"
                    value={formData.guardianDocumentType}
                    onChange={handleInputChange}
                    placeholder="Tipo documento"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Numero documento *</span>
                  <input
                    name="guardianDocumentNumber"
                    value={formData.guardianDocumentNumber}
                    onChange={handleInputChange}
                    placeholder="Numero documento"
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-field">
                  <span>Relazione con il minore *</span>
                  <input
                    name="guardianRelationship"
                    value={formData.guardianRelationship}
                    onChange={handleInputChange}
                    placeholder="Padre, madre, tutore legale..."
                    required={formData.isMinorClient}
                  />
                </label>
                <label className="tattoo-consent-checkbox tattoo-consent-checkbox--inline">
                  <input
                    type="checkbox"
                    name="guardianAcknowledgement"
                    checked={formData.guardianAcknowledgement}
                    onChange={handleInputChange}
                  />
                  <span>
                    Confermo di essere stato informato sui rischi e autorizzo il trattamento sul minore indicato *
                  </span>
                </label>
              </div>
            )}
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">03</span>
              <h2 className="tattoo-consent-section__title">Informazioni sul trattamento</h2>
            </div>
            <div className="tattoo-consent-text">
              <p>
                Il trucco permanente prevede l'inserimento sottocutaneo di pigmenti. Confermando le caselle seguenti
                dichiari di aver compreso rischi, modalita operative, necessita delle sedute di ritocco e istruzioni per
                la corretta guarigione.
              </p>
            </div>
            <div className="tattoo-consent-checklist">
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentInformation"
                  checked={formData.consentInformation}
                  onChange={handleInputChange}
                />
                <span>
                  Dichiaro di aver letto e compreso l'informativa riguardante natura, implicazioni e possibili rischi del
                  trucco permanente *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentRisks"
                  checked={formData.consentRisks}
                  onChange={handleInputChange}
                />
                <span>
                  Sono consapevole di possibili reazioni allergiche, cicatrizzazioni anomale, migrazione o variazione dei
                  pigmenti nel tempo *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentAftercare"
                  checked={formData.consentAftercare}
                  onChange={handleInputChange}
                />
                <span>
                  Mi impegno a seguire scrupolosamente le istruzioni post trattamento per favorire una corretta
                  cicatrizzazione *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentMultipleSessions"
                  checked={formData.consentMultipleSessions}
                  onChange={handleInputChange}
                />
                <span>
                  Accetto che per ottenere un risultato ottimale sono necessarie almeno due sedute e che eventuali ritocchi
                  aggiuntivi potranno essere a pagamento *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentColorChanges"
                  checked={formData.consentColorChanges}
                  onChange={handleInputChange}
                />
                <span>
                  Sono consapevole che tonalita e forma possono modificarsi nel tempo in base a fattori personali e
                  ambientali *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentTimeGap"
                  checked={formData.consentTimeGap}
                  onChange={handleInputChange}
                />
                <span>
                  Accetto che tra una seduta e la successiva debbano trascorrere almeno 40 giorni e che non e possibile
                  anticipare questo intervallo *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="consentLiability"
                  checked={formData.consentLiability}
                  onChange={handleInputChange}
                />
                <span>
                  Sollevo l'operatore da responsabilita per risultati non ottimali derivanti dal mancato rispetto delle
                  indicazioni ricevute o dal rifiuto di sedute di ritocco necessarie *
                </span>
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">04</span>
              <h2 className="tattoo-consent-section__title">Sessioni di trattamento</h2>
            </div>
            <div className="tattoo-consent-grid tattoo-consent-grid--one">
              {formData.treatmentSessions.map((session, index) => (
                <div key={`session-${index}`} className="tattoo-consent-session">
                  <div className="tattoo-consent-session__header">
                    <h3>Sessione {index + 1}</h3>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="tattoo-consent-btn tattoo-consent-session__remove"
                        onClick={() => removeTreatmentSession(index)}
                      >
                        Rimuovi
                      </Button>
                    )}
                  </div>
                  <div className="tattoo-consent-grid tattoo-consent-grid--two">
                    <label className="tattoo-consent-field">
                      <span>Data</span>
                      <input
                        type="date"
                        value={session.date}
                        onChange={(event) => handleTreatmentSessionChange(index, 'date', event.target.value)}
                      />
                    </label>
                    <label className="tattoo-consent-field">
                      <span>Effetto</span>
                      <input
                        value={session.effect}
                        onChange={(event) => handleTreatmentSessionChange(index, 'effect', event.target.value)}
                        placeholder="Es. sopracciglia pelo a pelo"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="tattoo-consent-session-actions">
              <Button
                type="button"
                variant="secondary"
                className="tattoo-consent-btn"
                onClick={addTreatmentSession}
                disabled={formData.treatmentSessions.length >= MAX_TREATMENT_SESSIONS}
              >
                Aggiungi sessione
              </Button>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">05</span>
              <h2 className="tattoo-consent-section__title">Prova colore</h2>
            </div>
            <div className="tattoo-consent-text">
              <p>
                La prova colore e consigliata per valutare eventuali reazioni ai pigmenti. Seleziona l'opzione desiderata
                e inserisci i dettagli relativi al test o ai prodotti utilizzati.
              </p>
            </div>
            <div className="tattoo-consent-health">
              <label className="tattoo-consent-radio">
                <input
                  type="radio"
                  name="colorTestChoice"
                  value="authorize_without_test"
                  checked={formData.colorTestChoice === 'authorize_without_test'}
                  onChange={handleInputChange}
                />
                <span>Autorizzo l'operatore a procedere senza eseguire la prova colore</span>
              </label>
              <label className="tattoo-consent-radio">
                <input
                  type="radio"
                  name="colorTestChoice"
                  value="request_test"
                  checked={formData.colorTestChoice === 'request_test'}
                  onChange={handleInputChange}
                />
                <span>Richiedo l'esecuzione della prova colore</span>
              </label>
            </div>
            <div className="tattoo-consent-grid tattoo-consent-grid--two">
              <label className="tattoo-consent-field">
                <span>Zona</span>
                <input
                  name="colorTestArea"
                  value={formData.colorTestArea}
                  onChange={handleInputChange}
                  placeholder="Zona trattata"
                />
              </label>
              <label className="tattoo-consent-field">
                <span>Data</span>
                <input
                  type="date"
                  name="colorTestDate"
                  value={formData.colorTestDate}
                  onChange={handleInputChange}
                />
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">06</span>
              <h2 className="tattoo-consent-section__title">Questionario sullo stato di salute</h2>
            </div>
            <div className="tattoo-consent-text">
              <p>
                Rispondi sinceramente a ogni domanda. Le informazioni sono fondamentali per pianificare il trattamento in
                sicurezza. In caso di risposte affermative, specifica i dettagli dove richiesto.
              </p>
            </div>
            <div className="tattoo-consent-health tattoo-consent-health--questionnaire">
              {healthQuestions.map((question) => (
                <div key={question.key} className="tattoo-consent-health-question">
                  <span>{question.label}</span>
                  <div className="tattoo-consent-health-options">
                    <label>
                      <input
                        type="radio"
                        name={`health-${question.key}`}
                        value="yes"
                        checked={formData.healthSurvey[question.key] === 'yes'}
                        onChange={() => handleHealthSurveyChange(question.key, 'yes')}
                      />
                      Si
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`health-${question.key}`}
                        value="no"
                        checked={formData.healthSurvey[question.key] === 'no'}
                        onChange={() => handleHealthSurveyChange(question.key, 'no')}
                      />
                      No
                    </label>
                  </div>
                  {question.key === 'allergies' && (
                    <div className="tattoo-consent-field tattoo-consent-health-notes">
                      <span>Se si, specificare</span>
                      <input
                        value={formData.healthSurvey.allergyNotes}
                        onChange={(event) => handleHealthSurveyChange('allergyNotes', event.target.value)}
                        placeholder="Allergie note"
                      />
                    </div>
                  )}
                  {question.key === 'other' && (
                    <div className="tattoo-consent-field tattoo-consent-health-notes">
                      <span>Dettagli aggiuntivi</span>
                      <input
                        value={formData.healthSurvey.otherNotes}
                        onChange={(event) => handleHealthSurveyChange('otherNotes', event.target.value)}
                        placeholder="Descrivi altre condizioni rilevanti"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <label className="tattoo-consent-field tattoo-consent-health-notes">
              <span>Note aggiuntive per l'operatore</span>
              <textarea
                name="otherHealthNotes"
                value={formData.otherHealthNotes}
                onChange={handleInputChange}
                placeholder="Inserisci eventuali informazioni sanitarie aggiuntive"
                rows={4}
              />
            </label>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">07</span>
              <h2 className="tattoo-consent-section__title">Cover-up di lavori eseguiti da terzi</h2>
            </div>
            <div className="tattoo-consent-checklist">
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="hasCoverUp"
                  checked={formData.hasCoverUp}
                  onChange={handleInputChange}
                />
                <span>il lavoro richiesto è un cover-up di un trucco permanente gia eseguito da terzi</span>
              </label>
              {formData.hasCoverUp && (
                <label className="tattoo-consent-checkbox">
                  <input
                    type="checkbox"
                    name="coverUpAcknowledgement"
                    checked={formData.coverUpAcknowledgement}
                    onChange={handleInputChange}
                  />
                  <span>
                    Comprendo che potrebbero essere necessarie piu sedute distanziate di almeno 30 giorni e sollevo
                    l'operatore per esiti non garantiti *
                  </span>
                </label>
              )}
            </div>
            {formData.hasCoverUp && (
              <label className="tattoo-consent-field tattoo-consent-health-notes">
                <span>Dettagli sul lavoro da coprire</span>
                <textarea
                  name="coverUpNotes"
                  value={formData.coverUpNotes}
                  onChange={handleInputChange}
                  placeholder="Descrivi il lavoro precedente, colori residui, eventuali rimozioni gia effettuate"
                  rows={3}
                />
              </label>
            )}
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">08</span>
              <h2 className="tattoo-consent-section__title">Consensi finali</h2>
            </div>
            <div className="tattoo-consent-checklist">
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="privacyConsent"
                  checked={formData.privacyConsent}
                  onChange={handleInputChange}
                />
                <span>
                  Acconsento al trattamento dei miei dati personali ai sensi della normativa vigente sulla privacy *
                </span>
              </label>
              <label className="tattoo-consent-checkbox">
                <input
                  type="checkbox"
                  name="photoConsent"
                  checked={formData.photoConsent}
                  onChange={handleInputChange}
                />
                <span>
                  Autorizzo l'utilizzo di materiale fotografico realizzato durante il trattamento per finalita promozionali
                  (facoltativo)
                </span>
              </label>
            </div>
          </section>

          <section className="tattoo-consent-section">
            <div className="tattoo-consent-section__header">
              <span className="tattoo-consent-section__badge">09</span>
              <h2 className="tattoo-consent-section__title">Firma digitale</h2>
            </div>
            <div className="tattoo-consent-signature">
              {signature ? (
                <div className="tattoo-consent-signature-preview">
                  <p>Firma salvata. Puoi ridisegnarla se necessario.</p>
                  <img src={signature} alt="Firma digitale" />
                </div>
              ) : (
                <p className="tattoo-consent-text">
                  Per completare il consenso e richiesta la tua firma digitale. Clicca sul pulsante per disegnarla.
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

export default PermanentMakeupConsentForm;
