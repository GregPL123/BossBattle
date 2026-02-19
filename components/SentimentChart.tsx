
import React, { useState } from 'react';
import { SentimentPoint } from '../types';

interface SentimentChartProps {
  data: SentimentPoint[];
  height?: number;
  onPointClick?: (timestamp: number) => void;
  startTime?: number;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data, height = 200, onPointClick, startTime = 0 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return (
     <div className="w-full flex items-center justify-center text-gray-800 font-black uppercase tracking-[0.4em] italic" style={{ height: `${height}px` }}>
        No_Sentiment_Data_Intercepted
     </div>
  );

  const minY = -5;
  const maxY = 5;
  const rangeY = maxY - minY;

  const getX = (index: number) => (index / Math.max(1, data.length - 1)) * 100;
  const getY = (score: number) => 100 - ((score - minY) / rangeY) * 100;

  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');

  return (
    <div className="w-full relative group animate-fade-in">
      <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-os-accent rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></div>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.5em] font-mono">Telemetry: Sentiment_Trend</span>
         </div>
         <div className="flex gap-6 text-[8px] font-mono font-black text-gray-700 tracking-widest uppercase">
            <span className="text-os-emerald/50">▲ Dominance</span>
            <span className="text-os-red/50">▼ Submission</span>
         </div>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="overflow-visible"
        >
          {/* Tactical Grid Lines */}
          {[25, 50, 75].map(y => (
             <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.2" />
          ))}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="2 2" />
          
          {/* Trend Area Gradient */}
          <defs>
            <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Main Trend Path */}
          <polyline 
             points={points} 
             fill="none" 
             stroke="#6366f1"
             strokeWidth="2"
             vectorEffect="non-scaling-stroke"
             className="drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          />

          {/* Interactive Data Nodes */}
          {data.map((d, i) => {
             const x = getX(i);
             const y = getY(d.score);
             return (
               <g 
                 key={i} 
                 onMouseEnter={() => setHoverIndex(i)}
                 onMouseLeave={() => setHoverIndex(null)}
                 className="cursor-pointer group/node"
               >
                 <circle cx={x} cy={y} r="0.8" fill={d.score > 0 ? '#10b981' : d.score < 0 ? '#ef4444' : '#6366f1'} vectorEffect="non-scaling-stroke" />
                 {hoverIndex === i && (
                    <line x1={x} y1="0" x2={x} y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 2" />
                 )}
               </g>
             );
          })}
        </svg>

        {/* HUD Hover Overlay */}
        {hoverIndex !== null && data[hoverIndex] && (
           <div 
             className="absolute z-30 bg-navy-900/95 backdrop-blur-2xl border border-os-accent/30 p-5 rounded-sm shadow-2xl w-64 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-6 animate-slide-up"
             style={{ left: `${getX(hoverIndex)}%`, top: `${getY(data[hoverIndex].score)}%` }}
           >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-navy-900 rotate-45 border-r border-b border-os-accent/30"></div>
              <div className="flex justify-between items-center mb-3 border-b border-white/5 pb-2">
                 <span className="text-[9px] font-black text-os-accent uppercase tracking-[0.2em] font-mono">Node_{hoverIndex.toString().padStart(2, '0')}</span>
                 <span className={`text-[11px] font-black italic tracking-tighter ${data[hoverIndex].score > 0 ? 'text-os-emerald' : 'text-os-red'}`}>
                    {data[hoverIndex].score > 0 ? 'NEURAL_ALPHA' : 'STRESS_SPIKE'}
                 </span>
              </div>
              <p className="text-[11px] text-white font-bold leading-relaxed italic uppercase tracking-tight">"{data[hoverIndex].reason}"</p>
              <div className="mt-4 flex items-center justify-between">
                 <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest">Psy_Index: {data[hoverIndex].score.toFixed(1)}</span>
                 <span className="text-[7px] font-black text-os-accent uppercase tracking-widest animate-pulse">Sync Active</span>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SentimentChart;
