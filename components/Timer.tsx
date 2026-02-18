import React, { useState, useEffect, useRef } from 'react';
import { playSfx } from '../utils/sound';

interface TimerProps {
  durationMinutes?: number;
  onTimeExpire?: () => void;
  isActive: boolean;
}

const Timer: React.FC<TimerProps> = ({ durationMinutes, onTimeExpire, isActive }) => {
  const [secondsLeft, setSecondsLeft] = useState(durationMinutes ? durationMinutes * 60 : 0);
  const [isWarning, setIsWarning] = useState(false);
  
  // Use a ref to track if we've triggered expiry to prevent double calls
  const expiryTriggered = useRef(false);

  useEffect(() => {
    if (!durationMinutes) return;
    setSecondsLeft(durationMinutes * 60);
    expiryTriggered.current = false;
    setIsWarning(false);
  }, [durationMinutes]);

  useEffect(() => {
    if (!isActive || !durationMinutes) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        
        // Warning at 30 seconds
        if (next <= 30 && next > 0) {
           setIsWarning(true);
           if (next % 10 === 0) playSfx('click'); // Subtle tick sound
        }

        if (next <= 0) {
          clearInterval(interval);
          if (!expiryTriggered.current) {
            expiryTriggered.current = true;
            if (onTimeExpire) onTimeExpire();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, durationMinutes, onTimeExpire]);

  // If no duration, standard count up timer (stopwatch)
  const [secondsUp, setSecondsUp] = useState(0);
  useEffect(() => {
    if (durationMinutes || !isActive) return;
    const interval = setInterval(() => setSecondsUp(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [durationMinutes, isActive]);


  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTime = durationMinutes ? secondsLeft : secondsUp;
  
  return (
    <div className={`
      flex items-center gap-2 px-3 py-1 rounded border font-mono text-sm transition-colors duration-300
      ${isWarning 
        ? 'bg-red-900/50 border-red-500 text-red-200 animate-pulse' 
        : 'bg-gray-900 border-gray-800 text-gray-400'}
    `}>
      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
      {formatTime(displayTime)}
    </div>
  );
};

export default Timer;