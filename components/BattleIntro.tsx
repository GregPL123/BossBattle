
import React, { useEffect, useState } from 'react';
import { playSfx } from '../utils/sound';
import { Language } from '../types';
import { translations } from '../translations';

interface BattleIntroProps {
  bossName: string;
  onComplete: () => void;
  lang: Language;
}

const BattleIntro: React.FC<BattleIntroProps> = ({ bossName, onComplete, lang }) => {
  const t = translations[lang];
  const [stage, setStage] = useState(0);

  useEffect(() => {
    setTimeout(() => playSfx('connect'), 200);
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 2800);
    const t4 = setTimeout(onComplete, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-blue-900/20 animate-pulse"></div>
      {stage >= 1 && <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 italic animate-slide-up drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">VS</h1>}
      {stage >= 2 && (
        <div className="mt-8 text-center animate-fade-in relative z-10">
          <p className="text-gray-400 text-xl uppercase tracking-[0.5em] font-bold mb-4">{t.yourOpponent}</p>
          <div className="bg-black/50 border-y border-red-500/30 py-6 w-screen">
             <h2 className="text-5xl md:text-7xl font-black text-white uppercase">{bossName}</h2>
          </div>
        </div>
      )}
      {stage >= 3 && <div className="absolute inset-0 flex items-center justify-center bg-white/5 backdrop-blur-sm z-20 animate-fade-in"><h1 className="text-8xl font-black text-white tracking-widest">{t.begin}</h1></div>}
    </div>
  );
};

export default BattleIntro;
