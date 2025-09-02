import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import FontLoader from './FontLoader';
import './GiftCardLanding.css';

const GiftCardLanding = () => {
  const { token } = useParams();
  const [stage, setStage] = useState('logo');
  const [showLogos, setShowLogos] = useState(true);
  const [giftCard, setGiftCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animationStage, setAnimationStage] = useState('logo'); // logo, golden-border, message

  useEffect(() => {
    const fetchGiftCard = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/gift-cards/landing/${token}`);
        if (!response.ok) {
          throw new Error('Gift card not found');
        }
        const data = await response.json();
        setGiftCard(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchGiftCard();
    }
  }, [token]);

  useEffect(() => {
    if (!loading && !error) {
      // Fade out logos after gift card text appears (at 4s)
      const fadeOutTimer = setTimeout(() => {
        setShowLogos(false);
      }, 4000);
      
      // Transition to message stage after fade out completes
      const stageTimer = setTimeout(() => {
        setStage('message');
        setAnimationStage('message');
      }, 4800);
      
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(stageTimer);
      };
    }
  }, [loading, error]);

  if (loading) {
    return (
      <div className="gift-card-landing">
        <div className="loading">Caricamento...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gift-card-landing">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <FontLoader fontFamily="OldLondon">
      <div className="gift-card-landing golden-border">
      <div className="container">
        {/* Logo Stage */}
        <div className={`logo-stage ${animationStage === 'logo' ? 'active' : 'hidden'}`}>
          <div className="shop-logo">
            <div className="logo-svg-container">
              <AnimatePresence>
                {showLogos && (
                  <>
                    <motion.div 
                      className="logo-svg-1"
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 0.5, 
                        ease: "easeOut" 
                      }}
                    >
                      <img src="/Logo.svg" alt="Logo" />
                    </motion.div>
                    <motion.div 
                      className="logo-svg-2"
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 1.0, 
                        ease: "easeOut" 
                      }}
                    >
                      <img src="/LogoScritta.svg" alt="Logo Scritta" />
                    </motion.div>
                    <motion.div 
                      className="gift-card-text"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ 
                        duration: 0.8, 
                        delay: 1.5, 
                        ease: "easeOut" 
                      }}
                    >
                      <h2>Gift Card</h2>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Message Stage */}
        <div className={`message-stage ${animationStage === 'message' ? 'active' : 'hidden'}`}>
          <div className="gift-card-message">
            <h2 className="congratulations">
              per
            </h2>
            <div className="client-name">
              <span className="first-name">{giftCard?.first_name}</span>
              <span className="last-name">{giftCard?.last_name}</span>
            </div>
            <div className="amount-section">
              <span className="from-text">da </span>
              <span className="amount">{giftCard?.amount}€</span>
            </div>
            <div className="separator"></div>
            <div className="terms">
              <ol>
                <li>L'appuntamento può essere spostato 1 volta senza perdere la caparra se avvisati entro 48 ore lavorative</li>
                <li>Se non vi presentaste all'appuntamento o decideste di non tatuarvi più, lo studio tratterrà la caparra</li>
                <li>La caparra verrà defalcata dal costo totale del lavoro (Al termine dell'ultima seduta)</li>
                <li>Questo coupon scade il {giftCard?.created_at ? new Date(new Date(giftCard.created_at).getTime() + 4 * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT') : 'N/A'}</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
    </FontLoader>
  );
};

export default GiftCardLanding;