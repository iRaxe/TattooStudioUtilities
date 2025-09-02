import { useEffect, useState } from 'react';
import FontFaceObserver from 'fontfaceobserver';

const FontLoader = ({ children, fontFamily = 'OldLondon', fallbackClass = 'font-loading' }) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontError, setFontError] = useState(false);

  useEffect(() => {
    const font = new FontFaceObserver(fontFamily, {
      weight: 'normal',
      style: 'normal'
    });

    // Timeout di 5 secondi per il caricamento del font
    font.load(null, 5000)
      .then(() => {
        console.log(`Font ${fontFamily} caricato con successo`);
        setFontLoaded(true);
        setFontError(false);
        // Aggiungi classe CSS per indicare che il font è caricato
        document.documentElement.classList.add('font-loaded');
        document.documentElement.classList.add(`${fontFamily.toLowerCase()}-loaded`);
      })
      .catch((error) => {
        console.warn(`Errore nel caricamento del font ${fontFamily}:`, error);
        setFontError(true);
        setFontLoaded(false);
        // Aggiungi classe CSS per indicare errore nel caricamento
        document.documentElement.classList.add('font-error');
      });
  }, [fontFamily]);

  return (
    <div className={`font-loader ${fontLoaded ? 'font-ready' : fallbackClass} ${fontError ? 'font-failed' : ''}`}>
      {children}
    </div>
  );
};

export default FontLoader;