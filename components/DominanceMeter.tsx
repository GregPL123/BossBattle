
import React, { useEffect, useState } from 'react';
import { BossMood } from '../types';

interface DominanceMeterProps {
  bossMood: BossMood;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
}

const DominanceMeter: React.FC<DominanceMeterProps> = ({ bossMood, isAiSpeaking, isUserSpeaking }) => {
  const [balance, setBalance] = useState(50); // 0 = User, 100 = AI

  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(prev => {
        let shift = 0;
        if (isAiSpeaking) shift += 0.3;
        if (isUserSpeaking) shift -= 0.3;
        if (bossMood === 'Impatient') shift += 0.5;
        if (bossMood === 'Impressed') shift -= 0.5;
        const next = Math.max(10, Math.min(90, prev + shift + (Math.random() * 0.4 - 0.2)));
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [bossMood, isAiSpeaking, isUserSpeaking]);

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-os-slate">
        <span>Speaker Influence</span>
        <span>Balance Index</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full relative overflow-hidden flex items-center">
        <div className="absolute inset-0 flex">
            <div className="h-full bg-os-primary/20 transition-all duration-300" style={{ width: `${100 - balance}%` }}></div>
            <div className="h-full bg-os-accent/20 transition-all duration-300" style={{ width: `${balance}%` }}></div>
        </div>
        <div 
            className="absolute h-full w-1 bg-white shadow-lg z-10 transition-all duration-300" 
            style={{ left: `${100 - balance}%`, transform: 'translateX(-50%)' }}
        ></div>
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10 z-0"></div>
      </div>
      <div className="flex justify-between font-sans text-[8px] text-os-slate font-bold uppercase tracking-widest">
        <span className={balance < 40 ? 'text-os-primary' : ''}>Executive (You)</span>
        <span className={balance > 60 ? 'text-os-accent' : ''}>Stakeholder</span>
      </div>
    </div>
  );
};

export default DominanceMeter;
