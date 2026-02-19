
import React, { useState, useEffect } from 'react';
import { Scenario, UserProfile, Language } from '../types';
import MicTester from './MicTester';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

interface LobbyProps {
  scenario: Scenario;
  userProfile?: UserProfile;
  inputDeviceId: string;
  micThreshold: number;
  onStart: (blindMode: boolean) => void;
  onBack: () => void;
  onSettings: () => void;
  onSetThreshold: (val: number) => void;
  lang: Language;
}

const Lobby: React.FC<LobbyProps> = ({ 
  scenario, userProfile, inputDeviceId, micThreshold, onStart, onBack, onSettings, lang
}) => {
  const t = translations[lang];
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const startCalibration = () => {
    setIsCalibrating(true);
    setProgress(0);
    playSfx('connect');
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsCalibrating(false);
          playSfx('success');
          return 100;
        }
        return prev + 5;
      });
    }, 60);
  };

  return (
    <div className="min-h-screen bg-navy-950 p-12 flex flex-col items-center justify-center relative">
      <div className="max-w-5xl w-full grid grid-cols-12 gap-8 relative z-10">
        
        {/* LEFT: MISSION BRIEFING */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           <div className="premium-glass rounded-3xl p-12 border border-white/5 relative overflow-hidden shadow-2xl">
              <button onClick={onBack} className="text-[10px] font-bold text-os-slate uppercase tracking-widest mb-10 hover:text-white transition-all flex items-center gap-2 group">
                <span className="transform group-hover:-translate-x-1 transition-transform">←</span> Exit Briefing
              </button>
              
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-os-primary"></div>
                  <span className="text-[10px] font-bold text-os-slate uppercase tracking-widest">Case Study Prepared</span>
                </div>
                <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
                  {scenario.name}
                </h1>
                <div className="flex gap-4 items-center">
                   <span className="text-[10px] bg-os-primary/10 text-os-primary border border-os-primary/20 px-4 py-1.5 rounded-full font-bold uppercase tracking-widest">{scenario.difficulty} Level</span>
                   <span className="text-[10px] text-os-slate font-medium">Session Time: {scenario.durationMinutes}m</span>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <p className="text-os-slate text-sm font-medium leading-relaxed">
                      {scenario.description}
                    </p>
                 </div>
                 
                 <div className="space-y-4">
                    <span className="text-[10px] font-bold text-os-slate uppercase tracking-widest block">Key Performance Deliverables</span>
                    <div className="grid grid-cols-1 gap-3">
                       {scenario.objectives.map((obj, i) => (
                          <div key={i} className="flex gap-4 items-center bg-navy-900/40 p-4 rounded-xl border border-white/5">
                             <span className="text-os-primary font-bold text-sm">0{i+1}</span>
                             <span className="text-[11px] text-os-slate font-semibold uppercase tracking-wide">{obj}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* RIGHT: SYSTEM VERIFICATION */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
           <div className="premium-glass rounded-3xl p-8 space-y-8 border border-white/5">
              <div className="flex items-center justify-between">
                 <span className="text-[11px] font-bold text-white uppercase tracking-widest">Pre-session Verification</span>
                 <button onClick={startCalibration} className="text-[9px] font-bold text-os-primary uppercase border border-os-primary/20 px-4 py-1.5 rounded-full hover:bg-os-primary/5">
                   {isCalibrating ? 'Syncing...' : 'Quick Sync'}
                 </button>
              </div>

              <div className="space-y-6">
                 <MicTester deviceId={inputDeviceId} threshold={micThreshold} />
                 
                 {isCalibrating && (
                   <div className="space-y-2">
                      <div className="h-1 bg-white/5 w-full rounded-full overflow-hidden">
                         <div className="h-full bg-os-primary transition-all" style={{ width: `${progress}%` }}></div>
                      </div>
                   </div>
                 )}

                 <div className="flex items-center justify-between p-6 bg-navy-900 rounded-2xl border border-white/5">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-bold text-white uppercase tracking-widest">Focus Mode</span>
                       <span className="text-[9px] text-os-slate font-medium uppercase mt-1">Hide Live Transcription</span>
                    </div>
                    <button 
                      onClick={() => setIsBlindMode(!isBlindMode)}
                      className={`w-12 h-6 rounded-full relative transition-all ${isBlindMode ? 'bg-os-primary' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isBlindMode ? 'right-1' : 'left-1'}`}></div>
                    </button>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col justify-end">
              <button 
                 onClick={() => onStart(isBlindMode)}
                 className="btn-primary text-white py-10 rounded-2xl flex flex-col items-center justify-center gap-1"
              >
                 <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Initiate Briefing</span>
                 <span className="text-3xl font-extrabold uppercase tracking-widest">Begin</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Lobby;
