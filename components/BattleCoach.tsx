
import React, { useEffect, useState, useRef } from 'react';
import { TranscriptItem, Language } from '../types';

interface BattleCoachProps {
  transcript: TranscriptItem[];
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  lang: Language;
}

const BattleCoach: React.FC<BattleCoachProps> = ({ 
  transcript, isAiSpeaking, isUserSpeaking
}) => {
  const [hint, setHint] = useState<string | null>(null);
  const [hintType, setHintType] = useState<'neutral' | 'warning' | 'success'>('neutral');
  const [combo, setCombo] = useState<string | null>(null);
  
  const silenceStartRef = useRef<number | null>(null);

  useEffect(() => {
    const lastUserMsg = [...transcript].reverse().find(t => t.role === 'user' && !t.isPartial);
    if (!lastUserMsg) return;

    const text = lastUserMsg.text.toLowerCase();
    let detected = null;

    // Tactical Mirroring Detection
    if (text.endsWith('?') && transcript.length > 1) {
       const lastAiMsg = transcript[transcript.length - 2];
       if (lastAiMsg.role === 'ai') {
          const aiWords = lastAiMsg.text.toLowerCase().split(' ');
          const userWords = text.replace('?', '').split(' ');
          const overlap = userWords.filter(w => aiWords.includes(w) && w.length > 3);
          if (overlap.length >= 2) detected = "PERFECT_MIRRORING";
       }
    }

    // Labeling Detection
    if (text.includes('it seems like') || text.includes('it sounds like') || text.includes('wydaje się, że') || text.includes('brzmi to jak')) {
       detected = "TACTICAL_LABELING";
    }

    if (detected) {
       setCombo(detected);
       setHint("Neural Sync Boost: +15 XP");
       setHintType('success');
       setTimeout(() => { setCombo(null); setHint(null); }, 4000);
    }
  }, [transcript]);

  // Silence/Panic Detection
  useEffect(() => {
    if (!isAiSpeaking && !isUserSpeaking) {
       if (silenceStartRef.current === null) silenceStartRef.current = Date.now();
       const duration = (Date.now() - silenceStartRef.current) / 1000;
       
       if (duration > 5 && transcript[transcript.length - 1]?.role === 'ai') {
          setHint("SIGNAL_LOSS: RESPOND IMMEDIATELY");
          setHintType('warning');
       }
    } else {
       silenceStartRef.current = null;
       setHint(null);
    }
  }, [isAiSpeaking, isUserSpeaking, transcript]);

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl pointer-events-none">
      {/* Combo Banner */}
      <div className={`transition-all duration-700 transform flex flex-col items-center mb-6 ${combo ? 'opacity-100 scale-110 translate-y-0' : 'opacity-0 scale-50 translate-y-4'}`}>
         <div className="bg-os-accent text-white font-black italic px-10 py-3 rounded-sm shadow-[0_0_40px_rgba(99,102,241,0.5)] transform -skew-x-12 tracking-[0.4em] uppercase text-xs border border-white/20">
            {combo}_DETECTED
         </div>
      </div>

      {/* Hint HUD */}
      <div className={`
        mx-auto px-10 py-4 rounded-sm text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl backdrop-blur-3xl transition-all duration-700 flex items-center justify-center gap-8 border transform -skew-x-6 font-mono
        ${!hint ? 'opacity-0 translate-y-10 scale-90' : 'opacity-100 translate-y-0 scale-100'}
        ${hintType === 'warning' ? 'bg-os-red/20 text-os-red border-os-red/40 animate-pulse' : 
          hintType === 'success' ? 'bg-os-emerald/20 text-os-emerald border-os-emerald/40' : 
          'bg-navy-900/80 text-os-accent border-os-accent/40'}
      `}>
        <div className="flex items-center gap-4">
           <span className="text-xl">{hintType === 'warning' ? '⚠️' : hintType === 'success' ? '⚡' : '📡'}</span>
           <span className="italic">{hint}</span>
        </div>
      </div>
    </div>
  );
};

export default BattleCoach;
