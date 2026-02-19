
import React, { useEffect, useRef, useState } from 'react';
import { BossMood } from '../types';

interface VisualizerProps {
  isActive: boolean;
  isAiSpeaking: boolean;
  bossName?: string;
  bossMood?: BossMood;
  inputAnalyser?: AnalyserNode | null;
  outputAnalyser?: AnalyserNode | null;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  isActive, isAiSpeaking, bossName = "Executive", bossMood = 'Neutral',
  inputAnalyser, outputAnalyser
}) => {
  const [pulse, setPulse] = useState(72);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => {
        const target = isAiSpeaking ? (bossMood === 'Impatient' ? 95 : 82) : 72;
        return prev + (target > prev ? 1 : -1) + (Math.random() > 0.5 ? 1 : -1);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAiSpeaking, bossMood]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const themeColor = bossMood === 'Impatient' ? '#ef4444' : bossMood === 'Impressed' ? '#10b981' : '#3b82f6';

      if (outputAnalyser) {
        outputAnalyser.getByteFrequencyData(dataArray);
        ctx.beginPath();
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const sliceWidth = canvas.width / (bufferLength / 2);
        let x = 0;
        for (let i = 0; i < bufferLength / 2; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 4;
          if (i === 0) ctx.moveTo(x, canvas.height / 2 - y);
          else ctx.lineTo(x, canvas.height / 2 - y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [outputAnalyser, bossMood]);

  return (
    <div className="premium-glass rounded-2xl p-10 space-y-8 executive-border shadow-xl">
      <div className="flex gap-8 items-center">
        <div className="relative">
          <div className="w-28 h-28 rounded-2xl bg-navy-900 border border-white/10 overflow-hidden shadow-2xl relative">
            <img 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${bossName}`} 
              alt="Executive" 
              className="w-full h-full object-cover opacity-80" 
            />
            {isAiSpeaking && <div className="absolute inset-0 bg-os-primary/10 animate-pulse"></div>}
          </div>
          <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-navy-900 ${isAiSpeaking ? 'bg-os-success animate-pulse' : 'bg-os-slate'}`}></div>
        </div>

        <div className="flex-1">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-os-slate uppercase tracking-widest">Stakeholder Analysis</span>
              <div className="text-right">
                 <span className="text-[9px] text-os-slate uppercase font-bold">Confidence</span>
                 <div className="text-lg font-bold text-white font-mono">{pulse}%</div>
              </div>
           </div>
           <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight">{bossName}</h2>
           <p className="text-xs text-os-slate font-medium">Disposition: {bossMood}</p>
        </div>
      </div>

      <div className="relative h-16 bg-black/20 rounded-xl overflow-hidden border border-white/5">
        <canvas ref={canvasRef} width={400} height={64} className="w-full h-full block" />
        <div className="absolute top-2 left-3 text-[8px] font-bold text-os-primary opacity-50 font-mono uppercase tracking-widest">Real-time Audio Feed</div>
      </div>

      <div className="grid grid-cols-2 gap-6 pt-2">
         <div className="space-y-2">
            <span className="text-[9px] font-bold text-os-slate uppercase tracking-widest">Engagement Ratio</span>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-os-primary transition-all duration-1000" style={{ width: '65%' }}></div>
            </div>
         </div>
         <div className="space-y-2">
            <span className="text-[9px] font-bold text-os-slate uppercase tracking-widest">Outcome Probability</span>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-os-success transition-all duration-1000" style={{ width: '82%' }}></div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Visualizer;
