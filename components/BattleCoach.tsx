
import React, { useEffect, useState, useRef } from 'react';
import { TranscriptItem, Language } from '../types';
import { translations } from '../translations';

interface BattleCoachProps {
  transcript: TranscriptItem[];
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  inputMode: 'VAD' | 'PTT';
  lang: Language;
}

const BattleCoach: React.FC<BattleCoachProps> = ({ 
  transcript, 
  isAiSpeaking, 
  isUserSpeaking,
  inputMode,
  lang
}) => {
  const t = translations[lang].coach;
  const [hint, setHint] = useState<string | null>(null);
  const [hintType, setHintType] = useState<'neutral' | 'warning' | 'success'>('neutral');
  
  const lastAiTurnEndRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interruptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Talk Ratio Logic ---
  const [talkRatio, setTalkRatio] = useState<number>(0.5); // 0.5 = balanced

  useEffect(() => {
    if (transcript.length < 4) return; // Need some data

    // Simple word count estimation
    let userWords = 0;
    let aiWords = 0;

    transcript.forEach(t => {
      const words = t.text.trim().split(/\s+/).length;
      if (t.role === 'user') userWords += words;
      else aiWords += words;
    });

    const total = userWords + aiWords;
    if (total === 0) return;
    
    const ratio = userWords / total; // 0 = Only AI, 1 = Only User
    setTalkRatio(ratio);

    if (ratio > 0.75) {
      setHint(t.rambling);
      setHintType('warning');
    } else if (ratio < 0.2 && transcript.length > 6) {
      setHint(t.dominated);
      setHintType('warning');
    } else if (hintType === 'warning' && (hint === t.rambling || hint === t.dominated)) {
      setHint(null); // Clear warning if back in balance
    }
  }, [transcript.length, hintType, hint, t]);


  // --- Events Logic ---

  // Detect End of AI Turn
  useEffect(() => {
    if (!isAiSpeaking) {
      lastAiTurnEndRef.current = Date.now();
      
      // Check for silence after AI stops
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (!isUserSpeaking && transcript.length > 0) {
           setHint(t.silence);
           setHintType('neutral');
        }
      }, 6000); // 6 seconds of silence
    } else {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // If we were showing a silence hint, clear it immediately when AI speaks
      if (hint === t.silence) setHint(null);
    }
    
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isAiSpeaking, isUserSpeaking, transcript.length, hint, t]);

  // Detect Interruption
  useEffect(() => {
    if (isAiSpeaking && isUserSpeaking) {
       // Both speaking
       if (!interruptTimerRef.current) {
         interruptTimerRef.current = setTimeout(() => {
            setHint(t.interrupting);
            setHintType('warning');
         }, 1500); // 1.5s overlap
       }
    } else {
       if (interruptTimerRef.current) {
         clearTimeout(interruptTimerRef.current);
         interruptTimerRef.current = null;
         if (hint === t.interrupting) setHint(null);
       }
    }
    return () => {
       if (interruptTimerRef.current) clearTimeout(interruptTimerRef.current);
    };
  }, [isAiSpeaking, isUserSpeaking, hint, t]);

  // General Hints based on transcript length (Start of convo)
  useEffect(() => {
    if (transcript.length === 0 && !isAiSpeaking) {
       setHint(t.wait);
       setHintType('neutral');
    } else if (transcript.length === 1 && isAiSpeaking) {
       setHint(t.listenOpening);
       setHintType('neutral');
    }
  }, [transcript.length, isAiSpeaking, t]);

  if (!hint) return <div className="h-8" />; // Placeholder to prevent layout shift

  return (
    <div className={`
      max-w-md mx-auto px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-md transition-all duration-500 animate-slide-up flex items-center justify-center gap-3 border
      ${hintType === 'warning' ? 'bg-orange-900/80 text-orange-100 border-orange-500/50 shadow-orange-900/20' : 
        hintType === 'success' ? 'bg-green-900/80 text-green-100 border-green-500/50 shadow-green-900/20' : 
        'bg-gray-800/80 text-blue-100 border-blue-500/30 shadow-blue-900/10'}
    `}>
      <span className="text-base">
        {hintType === 'warning' ? '⚠️' : hintType === 'success' ? '💡' : 'ℹ️'}
      </span>
      <span>{hint}</span>
    </div>
  );
};

export default BattleCoach;
