import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import './LandingPage.css';

export function LandingPage() {
  const [isRising, setIsRising] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const navigate = useNavigate();

  const handleSunClick = () => {
    if (isRising) return;
    setIsRising(true);
    
    // Epic sunrise transition
    setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        navigate('/chatbot');
      }, 1000);
    }, 1500);
  };

  return (
    <div className={`landing-page ${isFading ? 'fade-out' : ''}`}>
      
      {/* Full Page Very Low Opacity Floating Clouds */}
      <div className={`full-page-clouds ${isRising ? 'scatter' : ''}`}>
        <Cloud size={800} className="fp-cloud fp-cloud-1" color="transparent" fill="#ffffff" />
        <Cloud size={1000} className="fp-cloud fp-cloud-2" color="transparent" fill="#ffffff" />
        <Cloud size={600} className="fp-cloud fp-cloud-3" color="transparent" fill="#ffffff" />
        <Cloud size={900} className="fp-cloud fp-cloud-4" color="transparent" fill="#ffffff" />
      </div>

      <div className="landing-content">
        <h1 className="landing-title">Weather GPT</h1>
        <p className="landing-subtitle">Next-Generation Meteorological Intelligence</p>
        
        <div className="centerpiece-container" onClick={handleSunClick}>
          {/* The Glowing Sun Orb */}
          <div className={`sun-orb-wrapper ${isRising ? 'rising' : ''}`}>
            <div className="sun-orb"></div>
          </div>
          
          {/* Realistic CSS Volumetric Cloud */}
          <div className={`volumetric-cloud ${isRising ? 'fade-away' : ''}`}>
            <div className="cloud-blob blob-1"></div>
            <div className="cloud-blob blob-2"></div>
            <div className="cloud-blob blob-3"></div>
            <div className="cloud-blob blob-4"></div>
          </div>
        </div>
      </div>
      
      {/* Sun glow overlay that expands on rise */}
      <div className={`sun-glow-overlay ${isRising ? 'active' : ''}`}></div>
    </div>
  );
}

export default LandingPage;
