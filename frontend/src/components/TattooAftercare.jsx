import React from 'react';

const aftercareSteps = [
  {
    title: 'Pulizia delicata, tre volte al giorno',
    description:
      'Lava il tatuaggio mattina, pomeriggio e sera con acqua tiepida e sapone neutro. Evita getti diretti troppo caldi o troppo freddi: una temperatura moderata aiuta a non stressare la pelle.'
  },
  {
    title: 'Asciugatura senza sfregare',
    description:
      'Tampona l\'area con salviette morbide o carta monouso, esercitando una leggera pressione. Lo sfregamento puo\' irritare la pelle fresca e compromettere le linee del tatuaggio.'
  },
  {
    title: 'Idratazione mirata',
    description:
      'Applica una piccola quantita\' di crema specifica per la cura del tatuaggio subito dopo ogni lavaggio. Stendila con movimenti leggeri, senza eccedere: la pelle deve rimanere nutrita ma non occlusa.'
  },
  {
    title: 'Lasciare respirare la pelle',
    description:
      'Mantieni il tatuaggio scoperto il piu\' possibile nei primi giorni, cosi\' da favorire ossigenazione e cicatrizzazione naturale.'
  },
  {
    title: 'Protezione solo quando serve',
    description:
      'Copri l\'area tatuata esclusivamente per dormire o quando indossi indumenti che potrebbero strofinare. Utilizza materiale traspirante e cambialo spesso.'
  },
  {
    title: 'Continuita\' del protocollo',
    description:
      'Ripeti l\'intera routine per almeno 7 giorni consecutivi. Una cura costante previene infezioni, eccesso di crosticine e perdita di pigmento.'
  }
];

const donts = [
  'Non grattare e non strofinare: anche in presenza di prurito, resisti alla tentazione di toccare o tirare le crosticine.',
  'Non utilizzare spugne abrasive, asciugamani ruvidi o movimenti aggressivi durante il lavaggio.',
  'Evita tessuti sporchi o stretti, attivita\' che causano attrito e ambienti insalubri finche\' la pelle non e\' sigillata.',
  'Sospendi saune, piscine, mare e esposizione diretta al sole fino al completamento della guarigione.'
];

function TattooAftercare() {
  return (
    <div className="main-container">
      <div className="glass-card aftercare-card">
        <header className="aftercare-header">
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginTop: '1rem' }}>
            Un tatuaggio perfettamente guarito nasce da una cura quotidiana attenta.           </p>
        </header>

        <section className="aftercare-section">
          <h2>Routine quotidiana (primi 7 giorni)</h2>
          <div className="aftercare-grid">
            {aftercareSteps.map((step, index) => (
              <div className="aftercare-step-card" key={step.title}>
                <span className="aftercare-step-number">{index + 1}</span>
                <h3 className="aftercare-step-title">{step.title}</h3>
                <p className="aftercare-step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="aftercare-section">
          <h2>Cosa aspettarsi durante la guarigione</h2>
          <p>
            La procedura di cura dura una settimana, ma la pelle completa il proprio ciclo di rigenerazione in circa 30 giorni. In questa fase sono normali un aspetto leggermente opaco, piccole pellicine o una sensazione di secchezza: sono segnali fisiologici del processo di guarigione.
          </p>
          <p>
            Continua a idratare con moderazione e proteggi il tatuaggio dai raggi UV con una protezione specifica non appena la pelle e\' chiusa. Evita di immergerti in acqua stagnante o di esporre l\'area a sudore eccessivo finche\' non scompare ogni segno di irritazione.
          </p>
        </section>

        <section className="aftercare-section">
          <h2>Comportamenti da evitare</h2>
          <ul className="aftercare-list">
            {donts.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="aftercare-section">
          <h2>Quando contattarci</h2>
          <p>
            Se noti rossori intensi, secrezioni anomale o allergie al prodotto applicato, sospendi il trattamento topico ed entra subito in contatto con noi. Siamo disponibili per guidarti passo dopo passo e valutare eventuali controlli in studio.
          </p>
          <p className="aftercare-footer">
            Seguire scrupolosamente queste indicazioni ti aiuterà a preservare la qualità del tatuaggio nel tempo. Rimani in ascolto del tuo corpo, trattalo con delicatezza e goditi il risultato finale.
          </p>
        </section>
      </div>
    </div>
  );
}

export default TattooAftercare;
