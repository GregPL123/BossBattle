
import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
  durationMinutes?: number;
  onTimeExpire?: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ durationMinutes, onTimeExpire, isActive }) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes ? durationMinutes * 60 : 0);
  const expiryTriggered = useRef(false);

  useEffect(() => {
    if (!isActive || !durationMinutes) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!expiryTriggered.current) {
            expiryTriggered.current = true;
            onTimeExpire?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, durationMinutes, onTimeExpire]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCritical = secondsLeft < 30;

  return (
    <div className="flex flex-col items-center group">
       <div className="flex items-center gap-3 mb-2">
          <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-os-accent animate-pulse' : 'bg-gray-800'}`}></div>
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.5em] font-mono">OP_TIME_REMAINING</span>
       </div>
       <div className="relative">
         {/* Minimalist hex-style clock border */}
         <div className={`
            absolute -inset-4 border transition-all duration-500 rounded-sm
            ${isCritical ? 'border-os-red/40 animate-pulse' : 'border-white/5 group-hover:border-os-accent/20'}
         `}></div>
         
         <div className={`
           font-mono text-3xl font-black italic transform -skew-x-8 tracking-tighter transition-all duration-500 relative z-10
           ${isCritical ? 'text-os-red scale-110 drop-shadow-[0_0_15px_#ef4444]' : 'text-white'}
         `}>
           {formatTime(secondsLeft)}
           <span className="text-[10px] opacity-20 ml-2 not-italic tracking-widest">SEC</span>
         </div>
       </div>
    </div>
  );
};

export default Timer;
