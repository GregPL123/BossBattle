
import React, { useState } from 'react';
import { HistoryEntry, UserProfile, Language } from '../types';
import { ACHIEVEMENTS_LIST } from '../utils/gamification';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

interface HistoryProps {
  entries: HistoryEntry[];
  userProfile?: UserProfile;
  onClear: () => void;
  onClose: () => void;
  onSelectEntry: (entry: HistoryEntry) => void;
  lang: Language;
}

const History: React.FC<HistoryProps> = ({ entries, userProfile, onClear, onClose, onSelectEntry, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'log' | 'achievements'>('log');

  const renderTrendChart = () => {
    if (entries.length < 2) return null;
    
    // Take last 10 entries and reverse to chronological order
    const trendData = [...entries].slice(0, 10).reverse();
    const height = 100;
    const width = 400;
    const padding = 20;
    
    const getX = (i: number) => padding + (i * (width - 2 * padding) / (trendData.length - 1));
    const getY = (score: number) => height - padding - (score * (height - 2 * padding) / 100);

    const points = trendData.map((e, i) => `${getX(i)},${getY(e.score)}`).join(' ');

    return (
      <div className="mb-8 p-6 bg-gray-950/50 border border-gray-800 rounded-2xl">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">{t.performanceTrend}</h3>
        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
            <defs>
              <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <line x1={padding} y1={getY(0)} x2={width-padding} y2={getY(0)} stroke="#1f2937" strokeWidth="1" />
            <line x1={padding} y1={getY(50)} x2={width-padding} y2={getY(50)} stroke="#1f2937" strokeWidth="1" strokeDasharray="4" />
            <line x1={padding} y1={getY(100)} x2={width-padding} y2={getY(100)} stroke="#1f2937" strokeWidth="1" />
            
            {/* Area */}
            <path 
              d={`M ${getX(0)} ${getY(0)} L ${points} L ${getX(trendData.length-1)} ${getY(0)} Z`} 
              fill="url(#trendGradient)" 
            />
            
            {/* Line */}
            <polyline 
              points={points} 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            
            {/* Dots */}
            {trendData.map((e, i) => (
              <circle 
                key={i} 
                cx={getX(i)} 
                cy={getY(e.score)} 
                r="4" 
                fill="#3b82f6" 
                className="hover:r-6 transition-all cursor-pointer"
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto w-full p-6 animate-fade-in">
       <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="text-sm text-gray-400 hover:text-white flex items-center gap-2 font-bold group">
          <span className="transform group-hover:-translate-x-1 transition-transform">←</span> {t.backToMenu}
        </button>
          <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
             <button onClick={() => { playSfx('click'); setActiveTab('log'); }} className={`px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'log' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{t.battleLog}</button>
             <button onClick={() => { playSfx('click'); setActiveTab('achievements'); }} className={`px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'achievements' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>{t.achievements}</button>
          </div>
       </div>

      <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md min-h-[60vh] relative overflow-hidden">
        {activeTab === 'log' ? (
          <>
            <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-6">
              <div>
                <h2 className="text-3xl font-black text-white italic transform -skew-x-6 uppercase tracking-tighter">{t.history}</h2>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Review your combat records</p>
              </div>
              {entries.length > 0 && <button onClick={onClear} className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest bg-red-950/20 px-3 py-1.5 rounded-full border border-red-900/30 transition-all">{t.clearHistory}</button>}
            </div>
            
            {renderTrendChart()}

            {entries.length === 0 ? (
              <div className="text-center py-20 text-gray-600 flex flex-col items-center gap-4">
                <div className="text-6xl opacity-20">⚔️</div>
                <div><p className="text-xl font-bold uppercase">{t.noHistory}</p><p className="text-sm italic">{t.noHistoryDesc}</p></div>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    onClick={() => { playSfx('click'); onSelectEntry(entry); }} 
                    className="group bg-gray-950/50 border border-gray-800 rounded-2xl p-5 flex items-center gap-6 hover:bg-gray-800 hover:border-blue-500/50 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    <div className={`w-14 h-14 rounded-2xl bg-gray-900 border border-gray-700 flex flex-col items-center justify-center font-black transition-colors group-hover:border-blue-400`}>
                      <span className="text-xl text-white">{entry.score}</span>
                      <span className="text-[8px] text-gray-500 tracking-tighter uppercase">Score</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-white uppercase group-hover:text-blue-400 transition-colors">{entry.scenarioName}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase ${entry.outcome === 'Success' ? 'bg-green-900/30 text-green-400' : entry.outcome === 'Failure' ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                           {entry.outcome}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">"{entry.feedbackShort}"</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] text-gray-600 font-mono uppercase">{new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="text-[10px] text-gray-700 font-mono mt-1">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
           <div>
             <div className="mb-8 border-b border-gray-800 pb-6">
                <h2 className="text-3xl font-black text-white italic transform -skew-x-6 uppercase tracking-tighter">{t.achievements}</h2>
                <p className="text-xs text-gray-500 font-bold uppercase mt-1">Badges of Honor & Resilience</p>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
               {ACHIEVEMENTS_LIST.map((ach) => {
                 const isUnlocked = userProfile?.achievements.includes(ach.id);
                 return (
                   <div 
                     key={ach.id} 
                     className={`group p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col items-center text-center gap-4 ${isUnlocked ? 'bg-gradient-to-br from-gray-900 to-gray-800 border-yellow-500/30 shadow-xl' : 'opacity-40 grayscale border-gray-800'}`}
                   >
                      {isUnlocked && <div className="absolute top-2 right-2 text-[10px] font-black text-yellow-500 animate-pulse uppercase">Unlocked</div>}
                      <div className={`text-5xl transition-transform group-hover:scale-110 duration-300 ${isUnlocked ? 'drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]' : ''}`}>{ach.icon}</div>
                      <div>
                        <h3 className="font-black text-white uppercase tracking-tight text-sm">{ach.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">{ach.description}</p>
                      </div>
                   </div>
                 )
               })}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default History;
