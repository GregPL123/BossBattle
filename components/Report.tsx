
import React, { useRef, useState } from 'react';
import { AnalysisResult, Language, Scenario, TranscriptItem } from '../types';
import RadarChart from './RadarChart';
import SentimentChart from './SentimentChart';
import CoachChat from './CoachChat';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

interface ReportProps {
  result: AnalysisResult;
  scenario: Scenario;
  transcript: TranscriptItem[];
  onRetry?: () => void;
  onHome: () => void;
  audioUrl?: string | null;
  startTime?: number;
  lang: Language;
  xpGained?: number;
}

const Report: React.FC<ReportProps> = ({ 
  result, scenario, transcript, onRetry, onHome, lang, audioUrl, startTime = 0, xpGained = 145
}) => {
  const t = translations[lang];
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
    playSfx('click');
  };

  const API_KEY = process.env.API_KEY || '';

  return (
    <div className="min-h-screen bg-navy-950 p-12 text-white overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Executive Header */}
        <header className="flex justify-between items-end border-b border-white/10 pb-12 relative">
           <div className="absolute top-0 right-0 px-6 py-2 rounded-full border border-os-primary/30 bg-os-primary/5 text-[10px] font-bold uppercase tracking-widest text-os-primary">
              Executive Confidential
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className={`w-2 h-2 rounded-full ${result.outcome === 'Success' ? 'bg-os-success' : 'bg-os-danger'}`}></div>
                 <span className="text-[10px] font-mono font-bold text-os-slate uppercase tracking-widest">Performance Analysis Ref: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
              </div>
              <h1 className="text-5xl font-extrabold text-white tracking-tight">
                Review <span className={result.outcome === 'Success' ? 'text-os-success' : 'text-os-danger'}>{result.outcome === 'Success' ? 'Successful' : 'Incomplete'}</span>
              </h1>
              <p className="text-os-slate font-semibold uppercase tracking-widest text-xs border-l-2 border-os-accent pl-6">Strategic Communication Performance Review</p>
           </div>

           <div className="flex flex-col items-end gap-1 bg-white/5 p-6 rounded-2xl border border-white/5">
              <span className="text-[10px] font-bold text-os-slate uppercase tracking-wider">Experience Gained</span>
              <div className="text-4xl font-extrabold tracking-tight">+{xpGained} <span className="text-os-accent text-sm">EXP</span></div>
           </div>
        </header>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-12 gap-8">
           
           {/* Competency Chart */}
           <div className="col-span-12 lg:col-span-4 space-y-8">
              <div className="premium-glass rounded-2xl p-8 flex flex-col items-center border border-white/5 shadow-2xl">
                 <span className="text-[10px] font-bold text-os-slate uppercase tracking-widest mb-8">Leadership Competencies</span>
                 <RadarChart metrics={result.metrics} size={300} />
                 <div className="mt-8 text-center">
                    <div className="text-6xl font-extrabold tracking-tighter text-white">
                       {result.score}<span className="text-os-slate text-xl ml-1">/100</span>
                    </div>
                    <p className="text-[10px] font-bold text-os-primary uppercase mt-2 tracking-widest">Aggregate Performance Score</p>
                 </div>
              </div>

              <div className="premium-glass rounded-2xl p-8 space-y-6 border border-white/5">
                 <span className="text-[10px] font-bold text-os-slate uppercase tracking-widest block">Communication Nuances</span>
                 <div className="space-y-3">
                    {result.userNeuralPatterns?.map((p, i) => (
                       <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                          <p className="text-white text-xs font-bold uppercase tracking-tight italic">{p}</p>
                       </div>
                    )) || (
                      <p className="text-os-slate font-bold uppercase text-[10px] italic">No significant patterns identified.</p>
                    )}
                 </div>
              </div>
           </div>

           {/* Tactical Playback Column */}
           <div className="col-span-12 lg:col-span-8 space-y-8">
              <div className="premium-glass rounded-2xl p-10 space-y-8 relative overflow-hidden">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sentiment Flow Analytics</span>
                    </div>
                    {audioUrl && (
                      <button onClick={toggleAudio} className="bg-os-primary text-white px-8 py-3 font-bold uppercase tracking-wider text-xs rounded-xl hover:brightness-110 transition-all shadow-lg">
                        {isPlaying ? 'Pause Review' : 'Play Audio Session'}
                      </button>
                    )}
                 </div>
                 
                 <SentimentChart data={result.sentimentTrend} startTime={startTime} height={200} />
                 <audio ref={audioRef} src={audioUrl || ''} onEnded={() => setIsPlaying(false)} className="hidden" />
              </div>

              {/* Strategic Recalibration */}
              <div className="premium-glass rounded-2xl p-10 space-y-10 shadow-2xl">
                 <span className="text-[10px] font-bold text-os-success uppercase tracking-widest block border-b border-white/5 pb-4">Strategic Recalibration</span>
                 <div className="space-y-8">
                    {result.suggestions?.map((sug, i) => (
                       <div key={i} className="flex flex-col gap-6 pl-8 border-l border-white/10 relative">
                          <div className="absolute left-[-4.5px] top-0 w-2 h-2 rounded-full bg-os-accent"></div>
                          
                          <div className="bg-os-danger/5 border border-os-danger/10 p-6 rounded-xl">
                             <span className="text-[9px] font-bold text-os-danger uppercase mb-2 block tracking-widest">Original Phrasing</span>
                             <p className="text-os-slate text-xs italic">"{sug.userSaid}"</p>
                          </div>

                          <div className="bg-os-primary/5 border border-os-primary/20 p-8 rounded-xl relative group">
                             <span className="text-[9px] font-bold text-os-primary uppercase mb-3 block tracking-widest">Executive Alternative</span>
                             <p className="text-white text-lg font-bold leading-relaxed tracking-tight">"{sug.betterResponse}"</p>
                             <p className="mt-4 text-[10px] text-os-slate font-medium uppercase tracking-wider">Reasoning: {sug.reasoning}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Coach Debrief */}
              <div className="mt-8">
                 <CoachChat apiKey={API_KEY} result={result} transcript={transcript} scenario={scenario} />
              </div>
           </div>
        </div>

        {/* Global Footer Controls */}
        <footer className="flex justify-center gap-8 pt-12 border-t border-white/5">
           <button onClick={onHome} className="premium-glass px-12 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-os-slate hover:text-white transition-all">
              Dashboard
           </button>
           {onRetry && (
              <button onClick={onRetry} className="bg-os-primary text-white px-12 py-4 rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl hover:brightness-110 transition-all">
                 Re-engage Scenario
              </button>
           )}
        </footer>
      </div>
    </div>
  );
};

export default Report;
