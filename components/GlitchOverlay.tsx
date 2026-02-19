
import React, { useEffect, useState } from 'react';

interface GlitchOverlayProps {
  active: boolean;
  intensity?: 'low' | 'high';
}

const GlitchOverlay: React.FC<GlitchOverlayProps> = ({ active, intensity = 'low' }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      const interval = setInterval(() => {
        setVisible(true);
        setTimeout(() => setVisible(false), Math.random() * 100 + 50);
      }, Math.random() * (intensity === 'high' ? 1000 : 3000) + 500);
      return () => clearInterval(interval);
    }
  }, [active, intensity]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none mix-blend-screen opacity-30 overflow-hidden">
      <div className="absolute inset-0 bg-os-accent/10 animate-glitch"></div>
      <div className="absolute inset-0 flex flex-col justify-around">
        {[...Array(10)].map((_, i) => (
          <div 
            key={i} 
            className="w-full h-1 bg-os-red/40 animate-pulse" 
            style={{ 
              transform: `translateX(${Math.random() * 40 - 20}px)`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      <div className="absolute top-1/2 left-0 w-full h-24 bg-white/5 -translate-y-1/2 animate-glitch blur-sm"></div>
    </div>
  );
};

export default GlitchOverlay;
