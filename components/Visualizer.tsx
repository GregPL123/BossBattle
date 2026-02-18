
import React, { useEffect, useRef, useState } from 'react';
import { Language } from '../types';
import { translations } from '../translations';

interface VisualizerProps {
  inputAnalyser: AnalyserNode | null;
  outputAnalyser: AnalyserNode | null;
  isActive: boolean;
  isAiSpeaking: boolean;
  isUserSpeaking: boolean;
  ambience?: 'quiet' | 'office' | 'intense';
  avatarUrl?: string;
  isBlindMode?: boolean;
  latency?: number;
  lang: Language;
}

const Visualizer: React.FC<VisualizerProps> = ({ 
  inputAnalyser, 
  outputAnalyser, 
  isActive,
  isAiSpeaking,
  isUserSpeaking,
  ambience = 'office',
  avatarUrl,
  isBlindMode = false,
  latency = 0,
  lang
}) => {
  const t = translations[lang].tacticalHud;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarImgRef = useRef<HTMLImageElement | null>(null);
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  // HUD Metrics
  const [tension, setTension] = useState(30);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [talkStats, setTalkStats] = useState({ user: 1, ai: 1 });

  const stateRef = useRef({ isAiSpeaking, isUserSpeaking, ambience, isBlindMode, latency });

  useEffect(() => {
    stateRef.current = { isAiSpeaking, isUserSpeaking, ambience, isBlindMode, latency };
  }, [isAiSpeaking, isUserSpeaking, ambience, isBlindMode, latency]);

  // Real-time Talk Stats Accumulator
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
       setTalkStats(prev => ({
         user: prev.user + (stateRef.current.isUserSpeaking ? 1 : 0),
         ai: prev.ai + (stateRef.current.isAiSpeaking ? 1 : 0)
       }));
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  const dominanceRatio = talkStats.user / (talkStats.user + talkStats.ai);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
       setTension(prev => {
         const target = stateRef.current.isAiSpeaking ? 70 : (stateRef.current.isUserSpeaking ? 50 : 30);
         return prev + (target - prev) * 0.1;
       });
    }, 100);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (avatarUrl) {
      const img = new Image();
      img.src = avatarUrl;
      img.onload = () => {
        avatarImgRef.current = img;
        setIsAvatarLoaded(true);
      };
    }
  }, [avatarUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    let animationId: number;
    let resizeObserver: ResizeObserver;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    const blips: { x: number, y: number, life: number, size: number }[] = [];
    let pulsePhase = 0;
    let radarAngle = 0;

    const initParticles = (width: number, height: number) => {
      particles.length = 0;
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          alpha: Math.random() * 0.5 + 0.1
        });
      }
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    const inputData = inputAnalyser ? new Uint8Array(inputAnalyser.frequencyBinCount) : new Uint8Array(0);
    const outputData = outputAnalyser ? new Uint8Array(outputAnalyser.frequencyBinCount) : new Uint8Array(0);

    const draw = () => {
      const { isAiSpeaking, isUserSpeaking, ambience, isBlindMode, latency } = stateRef.current;
      const isInterrupting = isAiSpeaking && isUserSpeaking;

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.fillStyle = isBlindMode ? 'rgba(0, 10, 0, 0.25)' : 'rgba(3, 7, 18, 0.25)';
      ctx.fillRect(0, 0, width, height);
      
      if (inputAnalyser) inputAnalyser.getByteFrequencyData(inputData);
      if (outputAnalyser) outputAnalyser.getByteFrequencyData(outputData);

      const inputVol = inputData.reduce((a, b) => a + b, 0) / (inputData.length || 1);
      const outputVol = outputData.reduce((a, b) => a + b, 0) / (outputData.length || 1);
      
      if (Math.random() > 0.8) {
         setCurrentSignal(isAiSpeaking ? outputVol : (isUserSpeaking ? inputVol : 0));
      }

      const centerX = width / 2;
      const centerY = height / 2;

      let themeR = 59, themeG = 130, themeB = 246; 
      if (isBlindMode) {
         themeR = 0; themeG = 255; themeB = 0; 
      } else if (ambience === 'intense') {
         themeR = 220; themeG = 38; themeB = 38; 
      } else if (ambience === 'quiet') {
         themeR = 147; themeG = 51; themeB = 234; 
      }
      if (isInterrupting) themeR = 255; themeG = 165; themeB = 0; 

      if (isBlindMode) {
         ctx.strokeStyle = `rgba(${themeR}, ${themeG}, ${themeB}, 0.15)`;
         ctx.lineWidth = 1;
         for(let i=1; i<=4; i++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, i * (Math.min(width, height)/10), 0, Math.PI * 2);
            ctx.stroke();
         }
         ctx.beginPath();
         ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
         ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
         ctx.stroke();
         radarAngle += 0.04;
         ctx.save();
         ctx.translate(centerX, centerY);
         ctx.rotate(radarAngle);
         const sweepGrad = ctx.createLinearGradient(0, 0, width/2, 0);
         sweepGrad.addColorStop(0, `rgba(${themeR}, ${themeG}, ${themeB}, 0)`);
         sweepGrad.addColorStop(1, `rgba(${themeR}, ${themeG}, ${themeB}, 0.4)`);
         ctx.beginPath();
         ctx.moveTo(0, 0);
         ctx.arc(0, 0, Math.max(width, height), 0, 0.4); 
         ctx.lineTo(0,0);
         ctx.fillStyle = sweepGrad;
         ctx.fill();
         ctx.restore();

         if (outputVol > 15 && Math.random() > 0.85) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * (Math.min(width,height)/2 - 40);
            blips.push({ x: centerX + Math.cos(angle) * dist, y: centerY + Math.sin(angle) * dist, life: 1.0, size: (outputVol / 255) * 8 + 2 });
         }

         blips.forEach((blip, i) => {
            blip.life -= 0.015;
            if (blip.life <= 0) { blips.splice(i, 1); return; }
            ctx.beginPath(); ctx.arc(blip.x, blip.y, blip.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${themeR}, ${themeG}, ${themeB}, ${blip.life})`; ctx.fill();
            ctx.beginPath(); ctx.arc(blip.x, blip.y, blip.size + (1-blip.life)*20, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${themeR}, ${themeG}, ${themeB}, ${blip.life * 0.5})`; ctx.stroke();
         });
      } 
      else {
         ctx.fillStyle = '#ffffff';
         particles.forEach(p => {
            if (isInterrupting) { p.x += (Math.random() - 0.5) * 8; p.y += (Math.random() - 0.5) * 8; } 
            else { p.x += p.vx * (1 + outputVol / 40); p.y += p.vy * (1 + outputVol / 40); }
            if (p.x < 0) p.x = width; else if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height; else if (p.y > height) p.y = 0;
            const alpha = p.alpha * (0.3 + outputVol / 150);
            ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
         });
         ctx.globalAlpha = 1.0;
         const baseRadius = 70;
         pulsePhase += 0.08;
         const pulse = isAiSpeaking ? Math.sin(pulsePhase) * 4 : 0;
         const activeVol = isAiSpeaking ? outputVol : (isUserSpeaking ? inputVol * 0.6 : 0);
         const radius = baseRadius + (activeVol / 255) * 15 + pulse;
         const bars = 48;
         const step = (Math.PI * 2) / bars;
         const data = isAiSpeaking ? outputData : (isUserSpeaking ? inputData : outputData);
         for (let i = 0; i < bars; i++) {
            const dataIndex = Math.floor((i / bars) * (data.length * 0.7)); 
            const value = data[dataIndex] || 0;
            const barHeight = (value / 255) * 50 * (isAiSpeaking ? 1.0 : 0.6);
            const angle = i * step - (Math.PI / 2); 
            const x1 = centerX + Math.cos(angle) * (radius + 4);
            const y1 = centerY + Math.sin(angle) * (radius + 4);
            const x2 = centerX + Math.cos(angle) * (radius + 4 + barHeight);
            const y2 = centerY + Math.sin(angle) * (radius + 4 + barHeight);
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
            ctx.strokeStyle = isUserSpeaking && !isAiSpeaking ? `rgba(255, 255, 255, ${0.4 + (value/510)})` : isInterrupting ? `rgba(255, 165, 0, ${0.6 + (value/510)})` : `rgba(${themeR}, ${themeG}, ${themeB}, ${0.4 + (value/510)})`;
            ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
         }
         ctx.save(); ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.clip();
         ctx.fillStyle = '#111827'; ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
         if (avatarImgRef.current && isAvatarLoaded) { ctx.drawImage(avatarImgRef.current, centerX - radius, centerY - radius, radius * 2, radius * 2); }
         else { ctx.fillStyle = '#374151'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '30px sans-serif'; ctx.fillText('AI', centerX, centerY); }
         ctx.fillStyle = `rgba(${themeR}, ${themeG}, ${themeB}, 0.15)`;
         const scanOffset = (Date.now() / 20) % 20;
         for(let y = centerY - radius; y < centerY + radius; y+=4) { if ((y + scanOffset) % 8 < 4) { ctx.fillRect(centerX - radius, y, radius*2, 1); } }
         if (isUserSpeaking && !isAiSpeaking) { ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2); }
         ctx.restore();
         ctx.beginPath(); ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = isInterrupting ? '#f97316' : `rgba(${themeR}, ${themeG}, ${themeB}, 0.5)`; ctx.stroke();
      }
      animationId = requestAnimationFrame(draw);
    };

    if (isActive) draw();
    else { const width = canvas.width / (window.devicePixelRatio || 1); const height = canvas.height / (window.devicePixelRatio || 1); ctx.clearRect(0, 0, width, height); }
    return () => { cancelAnimationFrame(animationId); resizeObserver.disconnect(); };
  }, [inputAnalyser, outputAnalyser, isActive]);

  const { isAiSpeaking: aiActive, isUserSpeaking: userActive } = stateRef.current;
  const showInterrupt = aiActive && userActive;

  return (
    <div 
      ref={containerRef}
      className={`
        w-full h-64 md:h-[400px] rounded-3xl overflow-hidden relative shadow-2xl border backdrop-blur-sm transition-all duration-500
        ${isBlindMode ? 'bg-black border-green-900 shadow-[inset_0_0_50px_rgba(0,50,0,0.5)]' : 'bg-gray-950/80 border-gray-800'}
      `}
    >
       <canvas ref={canvasRef} className="w-full h-full block" />
       
       {/* Tactical HUD Left */}
       <div className="absolute top-6 left-6 space-y-4 font-mono pointer-events-none z-20 hidden md:block">
          <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-xl min-w-[160px]">
             <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t.tension}</div>
             <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${tension}%` }}></div>
                </div>
                <div className="text-xs text-red-400 font-bold">{Math.round(tension)}%</div>
             </div>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-xl min-w-[160px]">
             <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t.signal}</div>
             <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-400 transition-all duration-100" style={{ width: `${(currentSignal / 255) * 100}%` }}></div>
                </div>
                <div className="text-xs text-blue-300 font-bold">{Math.round((currentSignal / 255) * 100)}%</div>
             </div>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-xl min-w-[160px]">
             <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t.talkRatio}</div>
             <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-blue-900/40 rounded-full overflow-hidden flex">
                   <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${dominanceRatio * 100}%` }}></div>
                   <div className="h-full bg-red-900/40 transition-all duration-500" style={{ width: `${(1 - dominanceRatio) * 100}%` }}></div>
                </div>
                <div className="text-[10px] text-gray-400 font-black">{(dominanceRatio * 10).toFixed(1)}/10</div>
             </div>
          </div>
       </div>

       {/* Tactical HUD Right */}
       <div className="absolute top-6 right-6 space-y-4 font-mono pointer-events-none z-20 text-right hidden md:block">
          <div className="bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-xl min-w-[140px]">
             <div className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-widest">{t.latency}</div>
             <div className="text-sm text-green-400 font-black">{latency}ms</div>
          </div>
       </div>
       
       <div className={`
         absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md border text-xs font-bold pointer-events-none transition-all duration-300 z-30
         ${isBlindMode ? 'bg-black/80 border-green-500/30 text-green-400 font-mono tracking-widest' : 'bg-black/60 border-white/10 text-gray-300'}
       `}>
          <div className={`w-2 h-2 rounded-full transition-colors ${showInterrupt ? 'bg-orange-500 animate-ping' : aiActive ? (isBlindMode ? 'bg-green-500 animate-pulse' : 'bg-blue-500 animate-pulse') : userActive ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></div>
          {showInterrupt ? <span className="text-orange-400 uppercase">INTERRUPTION</span> : aiActive ? <span>{isBlindMode ? 'SIGNAL DETECTED' : 'BOSS SPEAKING'}</span> : userActive ? <span>{isBlindMode ? 'TRANSMITTING...' : 'LISTENING...'}</span> : <span>CONNECTED</span>}
       </div>
    </div>
  );
};

export default Visualizer;
