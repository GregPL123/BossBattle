
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
  const [logs, setLogs] = useState<string[]>([]);

  const SYSTEM_LOGS = [
    "INITIALIZING NEURAL_LINK_v4.2...",
    "ESTABLISHING SECURE HANDSHAKE [AES-256]...",
    "LOADING TACTICAL_DOD_MODULES...",
    "SYNCING BIOMETRIC_INTERCEPTORS...",
    "HANDLING TARGET_ENCRYPT_KEYS...",
    "NEURAL_LINK STABLE [99.8% SYNC]...",
    "READY FOR DEPLOYMENT."
  ];

  useEffect(() => {
    setTimeout(() => playSfx('connect'), 200);
    
    // Log sequence
    SYSTEM_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
        playSfx('click');
      }, i * 400);
    });

    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 1500);
    const t3 = setTimeout(() => setStage(3), 3200);
    const t4 = setTimeout(onComplete, 4500);
    
    return () => { 
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); 
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-navy-950 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Matrix Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-os-red/10 via-transparent to-os-accent/10"></div>
      
      <div className="relative z-10 w-full max-w-2xl px-10">
        {/* Progress Terminal */}
        <div className="mb-20 font-mono text-[10px] space-y-2 opacity-40">
           {logs.map((log, i) => (
             <div key={i} className="flex gap-4">
               <span className="text-os-accent">>></span>
               <span className="text-white uppercase tracking-widest">{log}</span>
             </div>
           ))}
        </div>

        <div className="flex flex-col items-center text-center">
          {stage >= 1 && (
            <h1 className="text-[120px] md:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-b from-os-accent to-os-purple italic animate-glitch tracking-tighter leading-none transform -skew-x-12">
              VS
            </h1>
          )}
          
          {stage >= 2 && (
            <div className="mt-10 animate-fade-in">
              <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.6em] mb-6 block font-mono">NEURAL_TARGET_ID</span>
              <div className="bg-white/5 border-y border-white/10 py-10 w-screen relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-os-red/20 via-transparent to-os-red/20 opacity-30"></div>
                 <h2 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter transform -skew-x-8 text-glow">
                   {bossName}
                 </h2>
              </div>
            </div>
          )}
        </div>
      </div>

      {stage >= 3 && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-950/80 backdrop-blur-3xl z-20 animate-fade-in">
          <div className="flex flex-col items-center gap-10">
             <div className="w-24 h-24 border-4 border-os-accent border-t-transparent rounded-full animate-spin"></div>
             <h1 className="text-6xl font-black text-white italic tracking-[0.5em] transform -skew-x-12 animate-pulse">INITIATE</h1>
          </div>
        </div>
      )}

      {/* Aesthetic Border Overlays */}
      <div className="absolute top-10 left-10 w-20 h-[1px] bg-os-accent/40"></div>
      <div className="absolute top-10 left-10 w-[1px] h-20 bg-os-accent/40"></div>
      <div className="absolute bottom-10 right-10 w-20 h-[1px] bg-os-accent/40"></div>
      <div className="absolute bottom-10 right-10 w-[1px] h-20 bg-os-accent/40"></div>
    </div>
  );
};

export default BattleIntro;
