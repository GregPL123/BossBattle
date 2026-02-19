
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
    const trendData = [...entries].slice(0, 10).reverse();
    const height = 120;
    const width = 800;
    const padding = 30;
    const getX = (i: number) => padding + (i * (width - 2 * padding) / (trendData.length - 1));
    const getY = (score: number) => height - padding - (score * (height - 2 * padding) / 100);
    const points = trendData.map((e, i) => `${getX(i)},${getY(e.score)}`).join(' ');

    return (
      <div className="mb-10 p-8 glass-card border-white/5 rounded-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <span className="text-[40px] font-black italic">TELEMETRY</span>
        </div>
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-os-accent rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></div>
              <h3 className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] font-mono">Operator_Performance_Trend</h3>
           </div>
           <span className="text-[8px] font-mono text-os-accent/40">NODE_SYNC_HISTOGRAM</span>
        </div>
        <div className="w-full">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40 overflow-visible">
            <defs>
              <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </linearGradient>
            </defs>
            {/* Grid */}
            {[25, 50, 75].map(y => (
               <line key={y} x1={padding} y1={getY(y)} x2={width-padding} y2={getY(y)} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            ))}
            <line x1={padding} y1={getY(50)} x2={width-padding} y2={getY(50)} stroke="rgba(99,102,241,0.1)" strokeWidth="1" strokeDasharray="4 4" />
            
            <path d={`M ${getX(0)} ${height-padding} L ${points} L ${getX(trendData.length-1)} ${height-padding} Z`} fill="url(#trendGradient)" />
            <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
            
            {trendData.map((e, i) => (
              <g key={i} className="group/dot cursor-pointer">
                 <circle cx={getX(i)} cy={getY(e.score)} r="4" fill="#6366f1" className="shadow-[0_0_15px_#6366f1]" />
                 <text x={getX(i)} y={getY(e.score) - 15} textAnchor="middle" fill="white" fontSize="9" fontWeight="900" className="opacity-0 group-hover/dot:opacity-100 transition-opacity font-mono">{e.score}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fade-in text-white font-sans h-full flex flex-col">
       <div className="flex justify-between items-center mb-10 shrink-0">
        <button onClick={onClose} className="text-[10px] font-black text-os-accent uppercase tracking-[0.5em] hover:text-white flex items-center gap-3 transition-colors group">
          <span className="transform group-hover:-translate-x-2 transition-transform">←</span> TERMINATE_ARCHIVE_VIEW
        </button>
          <div className="flex bg-navy-900 rounded-sm p-1 border border-white/5">
             <button onClick={() => { playSfx('click'); setActiveTab('log'); }} className={`px-10 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all skew-btn ${activeTab === 'log' ? 'bg-os-accent text-white shadow-lg shadow-os-accent/20' : 'text-gray-600 hover:text-gray-300'}`}>
                <span>Mission_Log</span>
             </button>
             <button onClick={() => { playSfx('click'); setActiveTab('achievements'); }} className={`px-10 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all skew-btn ${activeTab === 'achievements' ? 'bg-os-accent text-white shadow-lg shadow-os-accent/20' : 'text-gray-600 hover:text-gray-300'}`}>
                <span>Commendations</span>
             </button>
          </div>
       </div>

      <div className="glass-card flex-1 min-h-0 rounded-sm p-12 flex flex-col border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-os-accent to-transparent"></div>
        <div className="scan-overlay opacity-5"></div>
        
        {activeTab === 'log' ? (
          <>
            <div className="flex justify-between items-end mb-12 border-b border-white/5 pb-10 shrink-0 relative z-20">
              <div>
                <h2 className="text-6xl font-black text-white italic transform -skew-x-12 uppercase tracking-tighter leading-none mb-3">
                   Mission <span className="text-os-accent">Archives</span>
                </h2>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.5em] font-mono">Neural_Record_Database_v6.0</p>
              </div>
              {entries.length > 0 && (
                <button 
                  onClick={onClear} 
                  className="text-[9px] font-black text-os-red hover:text-white uppercase tracking-widest bg-os-red/5 px-6 py-2 rounded-sm border border-os-red/20 transition-all hover:bg-os-red/20"
                >
                  Purge_Archive
                </button>
              )}
            </div>
            
            {renderTrendChart()}

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 space-y-6 relative z-20">
              {entries.length === 0 ? (
                <div className="text-center py-24 text-gray-700 flex flex-col items-center gap-8">
                  <div className="text-8xl opacity-10 animate-pulse">⚔️</div>
                  <p className="text-[12px] font-black uppercase tracking-[0.6em] italic">No Mission Data Intercepted</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    onClick={() => { playSfx('click'); onSelectEntry(entry); }} 
                    className="group glass-card border-white/5 rounded-sm p-8 flex items-center gap-10 hover:border-os-accent/40 transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-os-accent transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    <div className="w-20 h-20 bg-navy-950 border border-white/5 flex flex-col items-center justify-center font-black rounded-sm group-hover:border-os-accent/50 transition-colors transform -skew-x-6 relative">
                       <div className="scan-overlay opacity-10"></div>
                       <span className="text-3xl text-white italic drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{entry.score}</span>
                       <span className="text-[8px] text-gray-600 tracking-tighter uppercase font-mono mt-1">FIDELITY</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-6 mb-3">
                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter group-hover:text-os-accent transition-colors transform -skew-x-12">{entry.scenarioName}</h3>
                        <span className={`text-[9px] px-4 py-1 rounded-sm font-black uppercase transform -skew-x-12 ${entry.outcome === 'Success' ? 'bg-os-emerald/10 text-os-emerald border border-os-emerald/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : entry.outcome === 'Failure' ? 'bg-os-red/10 text-os-red border border-os-red/20' : 'bg-white/5 text-gray-500 border border-white/10'}`}>
                           {entry.outcome}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1 italic uppercase font-bold tracking-tight">"{entry.feedbackShort}"</p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 font-mono">
                      <span className="text-[10px] text-os-accent font-black uppercase tracking-[0.2em]">{new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span className="text-[10px] text-gray-700 font-black mt-1 uppercase">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
           <div className="flex flex-col h-full relative z-20">
             <div className="mb-12 border-b border-white/5 pb-10 shrink-0">
                <h2 className="text-6xl font-black text-white italic transform -skew-x-12 uppercase tracking-tighter leading-none mb-3">
                   Neural <span className="text-os-accent">Commendations</span>
                </h2>
                <p className="text-[11px] text-gray-600 font-black uppercase tracking-[0.5em] font-mono">Achievement_Matrix_Active</p>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {ACHIEVEMENTS_LIST.map((ach) => {
                 const isUnlocked = userProfile?.achievements.includes(ach.id);
                 return (
                   <div 
                     key={ach.id} 
                     className={`group glass-card p-10 rounded-sm border transition-all relative overflow-hidden flex flex-col items-center text-center gap-8 ${isUnlocked ? 'border-os-accent/30 shadow-2xl shadow-os-accent/5' : 'opacity-20 grayscale border-white/5'}`}
                   >
                      <div className="absolute top-0 right-0 p-4">
                        <div className={`w-3 h-3 rounded-full ${isUnlocked ? 'bg-os-accent animate-pulse shadow-[0_0_10px_#6366f1]' : 'bg-gray-800'}`}></div>
                      </div>
                      <div className={`text-7xl transition-transform group-hover:scale-110 duration-500 ${isUnlocked ? 'drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]' : ''}`}>{ach.icon}</div>
                      <div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-widest mb-4 transform -skew-x-12">{ach.name}</h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed tracking-widest px-4">{ach.description}</p>
                      </div>
                      {isUnlocked && <div className="absolute bottom-0 left-0 w-full h-1 bg-os-accent animate-pulse"></div>}
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
