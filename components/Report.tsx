
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, TranscriptItem, UserProfile, Scenario, Language } from '../types';
import RadarChart from './RadarChart';
import SentimentChart from './SentimentChart';
import CoachChat from './CoachChat';
import { getNextLevelXp, XP_PER_LEVEL } from '../utils/gamification';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

const API_KEY = process.env.API_KEY || '';

interface ReportProps {
  result: AnalysisResult;
  onRetry: () => void;
  onHome: () => void;
  audioUrl?: string | null;
  transcript?: TranscriptItem[];
  startTime?: number;
  userProfile?: UserProfile;
  xpGained?: number;
  isLevelUp?: boolean;
  activeScenario?: Scenario;
  readOnly?: boolean;
  lang: Language;
}

const Report: React.FC<ReportProps> = ({ 
  result, onRetry, onHome, audioUrl, transcript = [], startTime = 0, userProfile, xpGained = 0, isLevelUp = false, activeScenario, readOnly = false, lang 
}) => {
  const t = translations[lang];
  const audioRef = useRef<HTMLAudioElement>(null);

  const getOutcomeText = (outcome: string) => {
    if (outcome === 'Success') return t.victory;
    if (outcome === 'Failure') return t.defeat;
    return t.neutral;
  };

  const progressPercent = userProfile ? Math.min(100, ((userProfile.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-6xl animate-fade-in p-4 flex flex-col gap-8 mb-12 printable-area">
      <style>{`
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .bg-gray-900, .bg-gray-950 { background: #f9fafb !important; border: 1px solid #e5e7eb !important; }
          .text-white { color: #111827 !important; }
          .text-gray-400, .text-gray-500 { color: #4b5563 !important; }
          .border-gray-800 { border-color: #d1d5db !important; }
        }
      `}</style>

      {/* Level & XP Progress Header */}
      {userProfile && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
           <div className="flex items-center gap-6 relative z-10">
             <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-black text-3xl italic transform -skew-x-12 border-2 border-white/20 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                  {userProfile.level}
                </div>
                {isLevelUp && (
                  <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full animate-bounce shadow-xl z-20 uppercase tracking-widest no-print">
                    LVL UP
                  </div>
                )}
             </div>
             <div>
                <div className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">{t.currentTitle}</div>
                <div className="text-white font-black text-2xl italic uppercase tracking-tighter transform -skew-x-6">{userProfile.activeTitle || userProfile.title}</div>
             </div>
           </div>
           
           {!readOnly && (
             <div className="flex-1 w-full max-w-lg relative z-10 no-print">
                <div className="flex justify-between text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">
                   <span className="flex items-center gap-2">XP <span className="text-white font-mono">{userProfile.xp}</span></span>
                   <span className="text-green-400 font-black animate-pulse">+{xpGained} {t.xpGained}</span>
                   <span className="opacity-40">NEXT: {getNextLevelXp(userProfile.level)}</span>
                </div>
                <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-gray-800 shadow-inner">
                   <div 
                     className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-[1500ms] ease-out relative" 
                     style={{ width: `${progressPercent}%` }}
                   >
                      <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                   </div>
                </div>
             </div>
           )}
        </div>
      )}
      
      {/* Primary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Score & Radar Chart */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl backdrop-blur-md">
           <div className="w-full flex justify-between items-center mb-12">
             <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase border tracking-[0.2em] shadow-lg transition-all ${
               result.outcome === 'Success' ? 'bg-green-900/20 border-green-500/50 text-green-400 shadow-green-900/20' : 
               result.outcome === 'Failure' ? 'bg-red-900/20 border-red-500/50 text-red-400 shadow-red-900/20' : 
               'bg-gray-800 border-gray-700 text-gray-400'
             }`}>
               {getOutcomeText(result.outcome)}
             </span>
             <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-50">{t.score}</span>
           </div>
           
           <div className="relative mb-12 group scale-110">
              <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-1000"></div>
              <div className="w-48 h-48 rounded-[3rem] border-2 flex flex-col items-center justify-center bg-gray-950 shadow-inner relative z-10 border-blue-500/20 transform rotate-3 transition-transform group-hover:rotate-0 duration-500">
                 <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-200 to-blue-500 italic -skew-x-6">{result.score}</div>
                 <div className="text-[10px] text-blue-500/50 font-black tracking-[0.3em] uppercase mt-2">Final Index</div>
              </div>
           </div>
           
           <div className="w-full pt-6 border-t border-gray-800/50">
             <RadarChart metrics={result.metrics} size={320} />
           </div>
        </div>

        {/* Right: Feedback & Objectives */}
        <div className="flex flex-col gap-8">
           <div className="bg-gray-900/60 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md flex-1 flex flex-col">
             <div className="p-10 border-b border-gray-800/50 bg-gray-950/40 relative">
                <div className="absolute top-4 right-4 text-4xl opacity-10 grayscale pointer-events-none">💬</div>
                <div className="text-[10px] text-blue-500 font-black uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                   Direct Debrief
                </div>
                <p className="text-xl text-white leading-relaxed italic font-serif opacity-90">"{result.feedback}"</p>
             </div>
             
             <div className="p-10 border-b border-gray-800/50 bg-gray-900/20">
                <h3 className="text-white font-black mb-8 text-[10px] uppercase tracking-[0.3em] flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-xs">🎯</div>
                   {t.missionObjectives}
                </h3>
                <div className="space-y-6">
                   {result.objectiveResults.map((obj, i) => (
                      <div key={i} className="flex gap-5 items-start group">
                         <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs shadow-lg transition-all group-hover:scale-110 ${
                           obj.completed ? 'bg-green-600 text-white border-white/20 shadow-green-900/30' : 'bg-gray-800 text-gray-600 border-gray-700'
                         }`}>
                           {obj.completed ? '✓' : '✕'}
                         </div>
                         <div className="flex-1">
                            <p className={`text-sm font-black uppercase tracking-tight ${obj.completed ? 'text-gray-100' : 'text-gray-600'}`}>{obj.objective}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{obj.feedback}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                   <h3 className="text-green-500 font-black mb-6 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="text-xs">💪</span> {t.strengths}
                   </h3>
                   <ul className="space-y-3">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-3 group">
                          <span className="text-green-500/50 mt-1 group-hover:text-green-500 transition-colors">▶</span> {s}
                        </li>
                      ))}
                   </ul>
                </div>
                <div>
                   <h3 className="text-orange-500 font-black mb-6 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="text-xs">⚡</span> {t.improvements}
                   </h3>
                   <ul className="space-y-3">
                      {result.improvements.map((im, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-3 group">
                          <span className="text-orange-500/50 mt-1 group-hover:text-orange-500 transition-colors">!</span> {im}
                        </li>
                      ))}
                   </ul>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Tension Arc / Sentiment Chart */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md relative">
         <div className="flex justify-between items-start mb-12">
            <div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic transform -skew-x-6 flex items-center gap-3">
                  <span className="text-3xl not-italic">📈</span> {t.tensionArc}
               </h3>
               <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-2 ml-12">Psychological Pressure Over Time</p>
            </div>
         </div>
         <div className="h-64 mt-4">
           <SentimentChart data={result.sentimentTrend} height={200} />
         </div>
      </div>

      {/* Tactical Rewrites Section */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl backdrop-blur-md">
           <h3 className="text-2xl font-black text-white mb-10 flex items-center gap-3 uppercase tracking-tighter italic transform -skew-x-6">
              <span className="text-3xl not-italic">💡</span> {t.tacticalRewrites}
           </h3>
           <div className="grid grid-cols-1 gap-8">
              {result.suggestions.map((s, i) => (
                 <div key={i} className="bg-gray-950/40 p-8 rounded-[2rem] border border-gray-800 flex flex-col md:flex-row gap-10 hover:border-blue-500/30 transition-all group">
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          <p className="text-red-400 text-[10px] font-black uppercase tracking-[0.3em]">Employee Response</p>
                       </div>
                       <div className="bg-red-950/10 border border-red-500/10 p-6 rounded-2xl text-gray-300 text-sm italic leading-relaxed group-hover:bg-red-950/20 transition-colors">
                         "{s.userSaid}"
                       </div>
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.3em]">Neural Recommendation</p>
                       </div>
                       <div className="bg-green-950/10 border border-green-500/10 p-6 rounded-2xl text-white text-base font-bold shadow-lg group-hover:bg-green-950/20 transition-colors border-b-4 border-b-green-900/50">
                         "{s.betterResponse}"
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* AI Coach Debrief Section - Hidden in Print */}
      {!readOnly && (
        <div className="mt-4 no-print">
           <CoachChat 
             apiKey={API_KEY} 
             result={result} 
             transcript={transcript} 
             scenario={activeScenario!} 
           />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col md:flex-row gap-6 mt-8 pb-20 no-print">
        <button 
          onClick={onHome} 
          className="flex-1 py-6 rounded-[2rem] bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white font-black uppercase tracking-[0.3em] border border-gray-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
        >
          {t.backToMenu}
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 py-6 rounded-[2rem] bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-[0.3em] border border-gray-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl"
        >
          Download Report
        </button>
        {!readOnly && (
          <button 
            onClick={onRetry} 
            className="flex-1 py-6 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-[0.3em] shadow-[0_0_50px_rgba(37,99,235,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] border-b-4 border-indigo-800"
          >
            {t.retry}
          </button>
        )}
      </div>
    </div>
  );
};

export default Report;
