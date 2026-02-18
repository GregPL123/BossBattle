import React, { useState } from 'react';
import { SentimentPoint } from '../types';

interface SentimentChartProps {
  data: SentimentPoint[];
  height?: number;
}

const SentimentChart: React.FC<SentimentChartProps> = ({ data, height = 200 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const width = 100; // Percentage based
  const minY = -5;
  const maxY = 5;
  const rangeY = maxY - minY;

  // Helper to get coordinates (0-100 scale)
  const getX = (index: number) => (index / (data.length - 1)) * 100;
  const getY = (score: number) => 100 - ((score - minY) / rangeY) * 100;

  // Points string for polyline
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');

  return (
    <div className="w-full relative select-none">
      <div className="flex justify-between text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-wider">
         <span>Opening</span>
         <span>Mid-Game</span>
         <span>Conclusion</span>
      </div>

      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="overflow-visible"
        >
          {/* Gradients */}
          <defs>
             <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#ef4444" />
             </linearGradient>
          </defs>

          {/* Grid Lines */}
          <line x1="0" y1="0" x2="100" y2="0" stroke="#16a34a" strokeWidth="0.5" strokeDasharray="2" opacity="0.3" /> {/* +5 */}
          <line x1="0" y1="50" x2="100" y2="50" stroke="#6b7280" strokeWidth="0.5" strokeDasharray="2" opacity="0.5" /> {/* 0 */}
          <line x1="0" y1="100" x2="100" y2="100" stroke="#dc2626" strokeWidth="0.5" strokeDasharray="2" opacity="0.3" /> {/* -5 */}

          {/* Line */}
          <polyline 
             points={points} 
             fill="none" 
             stroke="url(#lineGradient)"
             strokeWidth="2"
             vectorEffect="non-scaling-stroke"
             className="drop-shadow-lg"
          />

          {/* Interaction Points */}
          {data.map((d, i) => {
             const x = getX(i);
             const y = getY(d.score);
             const isHovered = hoverIndex === i;

             return (
               <g 
                 key={i} 
                 onMouseEnter={() => setHoverIndex(i)}
                 onMouseLeave={() => setHoverIndex(null)}
                 style={{ cursor: 'pointer' }}
               >
                 {/* Invisible larger target for easier hover */}
                 <circle cx={x} cy={y} r="3" fill="transparent" vectorEffect="non-scaling-stroke" stroke="transparent" strokeWidth="10" />
                 
                 {/* Visible Dot */}
                 <circle 
                   cx={x} 
                   cy={y} 
                   r={isHovered ? 2 : 1} 
                   fill="#fff" 
                   stroke={d.score > 0 ? '#16a34a' : d.score < 0 ? '#dc2626' : '#9ca3af'}
                   strokeWidth={isHovered ? 1 : 0.5}
                   vectorEffect="non-scaling-stroke"
                   className="transition-all duration-200"
                 />
               </g>
             );
          })}
        </svg>

        {/* Tooltip Overlay */}
        {hoverIndex !== null && data[hoverIndex] && (
           <div 
             className="absolute z-10 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl w-48 pointer-events-none transform -translate-x-1/2 transition-all duration-200"
             style={{ 
                left: `${getX(hoverIndex)}%`, 
                top: `${getY(data[hoverIndex].score) - 10}%`,
                marginTop: '-12px'
             }}
           >
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] uppercase font-bold text-gray-400">{data[hoverIndex].segment}</span>
                 <span className={`text-xs font-bold ${data[hoverIndex].score > 0 ? 'text-green-400' : data[hoverIndex].score < 0 ? 'text-red-400' : 'text-gray-200'}`}>
                    {data[hoverIndex].score > 0 ? '+' : ''}{data[hoverIndex].score}
                 </span>
              </div>
              <p className="text-xs text-gray-300 leading-tight">
                 {data[hoverIndex].reason}
              </p>
           </div>
        )}
      </div>
      
      {/* Y-Axis Labels */}
      <div className="absolute top-0 right-0 h-full flex flex-col justify-between text-[8px] text-gray-600 font-mono pointer-events-none translate-x-4">
         <span>+5</span>
         <span>0</span>
         <span>-5</span>
      </div>
    </div>
  );
};

export default SentimentChart;