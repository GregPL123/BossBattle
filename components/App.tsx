
import React, { useState, useEffect } from 'react';
import Setup from './components/Setup';
import Visualizer from './components/Visualizer';
import ChatLog from './components/ChatLog';
import Report from './components/Report';
import Lobby from './components/Lobby';
import History from './components/History';
import ProfileModal from './components/ProfileModal';
import CommunityHub from './components/CommunityHub';
import BattleIntro from './components/BattleIntro';
import BattleCoach from './components/BattleCoach';
import CustomScenario from './components/CustomScenario';
import TacticalInsightsHUD from './components/TacticalInsightsHUD';
import LiveTelemetryHUD from './components/LiveTelemetryHUD';
import DominanceMeter from './components/DominanceMeter';
import ToastContainer, { ToastMessage } from './components/Toast';
import { useLiveSession } from './hooks/useLiveSession';
import { generateAnalysis } from './utils/analysis';
import { getHistory, getUserProfile, clearHistory, saveHistory, updateUserProfile } from './utils/storage';
import { Scenario, ConnectionState, AnalysisResult, Language, HistoryEntry } from './types';
import { playSfx } from './utils/sound';

const API_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [lang] = useState<Language>('pl');
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [showLobby, setShowLobby] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  const [userProfile, setUserProfile] = useState(getUserProfile());
  const [history, setHistory] = useState<HistoryEntry[]>(getHistory());

  const { 
    connect, 
    disconnect, 
    connectionState, 
    transcript,
    isAiSpeaking,
    bossMood,
    tacticalInsights,
    inputAnalyser,
    outputAnalyser,
    volume,
    audioUrl,
    startTime,
    setInputThreshold,
  } = useLiveSession(API_KEY);

  const isUserSpeaking = volume.input > 5;

  const handleEndCall = async () => {
    playSfx('disconnect');
    disconnect();
    
    if (activeScenario && transcript.length > 1) { 
      setIsAnalyzing(true);
      try {
        const result = await generateAnalysis(API_KEY, transcript, activeScenario, lang);
        updateUserProfile(145, result.outcome === 'Success', [], result, activeScenario.id, currentStage);
        setUserProfile(getUserProfile());
        saveHistory(activeScenario, result);
        setHistory(getHistory());
        setAnalysis(result);
        playSfx('success');
      } catch (e) {
        setActiveScenario(null);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setActiveScenario(null);
      setAnalysis(null);
    }
  };

  if (!activeScenario) {
    return (
      <div className="bg-navy-950 min-h-screen">
        <Setup 
          onStart={(s) => { setActiveScenario(s); setShowLobby(true); }} 
          onShowHistory={() => setShowHistory(true)} 
          onShowCustom={() => setShowCustom(true)}
          isLoading={false} 
          lang={lang}
          userProfile={userProfile}
        />
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex gap-8">
           <button onClick={() => setShowCommunity(true)} className="premium-glass px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-os-slate hover:text-white transition-all border border-white/5">Network Hub</button>
           <button onClick={() => setShowProfile(true)} className="premium-glass px-10 py-4 rounded-xl text-xs font-bold uppercase tracking-wider text-os-slate hover:text-white transition-all border border-white/5">Profile Dashboard</button>
        </div>
        {showHistory && <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-12 backdrop-blur-3xl"><History entries={history} onClose={() => setShowHistory(false)} onClear={() => { clearHistory(); setHistory([]); }} onSelectEntry={(e) => {}} lang={lang} userProfile={userProfile} /></div>}
        {showCustom && <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-12 backdrop-blur-3xl"><CustomScenario onGenerated={(s) => { setActiveScenario(s); setShowLobby(true); setShowCustom(false); }} lang={lang} /></div>}
        {showProfile && <ProfileModal userProfile={userProfile} onClose={() => setShowProfile(false)} lang={lang} />}
        {showCommunity && <CommunityHub user={null} userProfile={userProfile} onClose={() => setShowCommunity(false)} onImportScenario={(s) => { setActiveScenario(s); setShowLobby(true); setShowCommunity(false); }} lang={lang} />}
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white p-12">
        <div className="w-16 h-16 border-4 border-os-primary border-t-transparent rounded-full animate-spin mb-8"></div>
        <h2 className="text-2xl font-bold tracking-tight uppercase animate-pulse">Synthesizing Performance Data</h2>
      </div>
    );
  }

  if (analysis) {
    return <Report result={analysis} scenario={activeScenario} transcript={transcript} onHome={() => { setAnalysis(null); setActiveScenario(null); }} lang={lang} audioUrl={audioUrl} startTime={startTime} />;
  }

  if (showLobby) {
    return (
      <Lobby 
        scenario={activeScenario} 
        onStart={() => { 
          setShowLobby(false); 
          setShowIntro(true); 
        }} 
        onBack={() => setActiveScenario(null)} 
        lang={lang} 
        inputDeviceId="" 
        micThreshold={0.01} 
        onSettings={() => {}} 
        onSetThreshold={setInputThreshold} 
      />
    );
  }

  if (showIntro) {
    return <BattleIntro bossName={activeScenario.name} onComplete={() => { setShowIntro(false); connect(activeScenario.systemInstruction, activeScenario.voiceName); }} lang={lang} />;
  }

  return (
    <div className="h-screen bg-navy-950 text-white flex flex-col overflow-hidden relative">
      <BattleCoach transcript={transcript} isAiSpeaking={isAiSpeaking} isUserSpeaking={isUserSpeaking} lang={lang} />
      <TacticalInsightsHUD insights={tacticalInsights} />
      <LiveTelemetryHUD />

      <header className="h-24 bg-navy-900/50 border-b border-white/5 flex items-center justify-between px-16 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-12">
           <h2 className="text-2xl font-bold tracking-tight">Negotiator<span className="text-os-primary">.Pro</span></h2>
           <div className="h-8 w-px bg-white/10"></div>
           <div>
              <span className="text-[10px] font-bold text-os-primary uppercase tracking-[0.4em] block mb-1">Executive Session</span>
              <h1 className="text-3xl font-extrabold tracking-tight italic">{activeScenario.name}</h1>
           </div>
        </div>

        <div className="flex items-center gap-12">
           <div className="px-8 py-3 rounded-xl border border-white/10 bg-navy-950 flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full animate-pulse ${bossMood === 'Impatient' ? 'bg-os-danger' : 'bg-os-success'}`}></div>
              <span className="text-xs font-bold uppercase tracking-widest text-os-slate">Counterpart: {bossMood}</span>
           </div>
           <button onClick={handleEndCall} className="text-os-slate hover:text-white transition-all transform hover:scale-110">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-10 p-12 overflow-hidden bg-navy-950/40 relative z-20">
        <div className="col-span-8 flex flex-col gap-10 overflow-hidden">
          <div className="premium-glass rounded-3xl p-10 shrink-0 shadow-2xl border border-white/5">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold uppercase tracking-widest text-white italic">Case Objectives</h3>
                <div className="flex gap-2">
                    {[1, 2, 3].map(s => <div key={s} className={`w-3 h-3 rounded-full ${s <= currentStage ? 'bg-os-primary shadow-lg shadow-os-primary/40' : 'bg-white/10'}`}></div>)}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-6">
                {activeScenario.objectives.map((obj, i) => (
                   <div key={i} className="bg-navy-900/40 border border-white/5 p-6 rounded-2xl flex items-center gap-6">
                      <span className="text-os-primary font-bold text-lg">0{i+1}</span>
                      <span className="text-xs font-semibold text-os-slate uppercase tracking-wide leading-relaxed">{obj}</span>
                   </div>
                ))}
             </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-8 custom-scrollbar">
             <ChatLog transcript={transcript} lang={lang} isAiSpeaking={isAiSpeaking} />
          </div>
        </div>

        <div className="col-span-4 flex flex-col gap-10 overflow-y-auto pr-4 custom-scrollbar">
           <Visualizer isActive={connectionState === ConnectionState.CONNECTED} isAiSpeaking={isAiSpeaking} bossName={activeScenario.name} bossMood={bossMood} inputAnalyser={inputAnalyser} outputAnalyser={outputAnalyser} />
           <div className="premium-glass rounded-3xl p-8 bg-navy-900/40 border border-white/5 shadow-xl">
              <DominanceMeter bossMood={bossMood} isAiSpeaking={isAiSpeaking} isUserSpeaking={isUserSpeaking} />
           </div>
           <div className="premium-glass rounded-2xl p-6 space-y-3 border border-white/5 font-mono text-[9px] text-os-slate uppercase tracking-widest">
              <div className="flex justify-between"><span>Negotiation Resonance</span><span className="text-os-primary">82%</span></div>
              <div className="flex justify-between"><span>Strategic Stability</span><span className="text-os-success">NOMINAL</span></div>
           </div>
        </div>
      </main>

      <footer className="h-44 bg-navy-900/80 border-t border-white/5 p-12 flex items-center justify-between shrink-0 backdrop-blur-xl z-30">
         <div className="flex items-center gap-10 flex-1 max-w-5xl">
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center text-4xl transition-all duration-500 shadow-2xl ${isUserSpeaking ? 'border-os-primary bg-os-primary/10 scale-105' : 'border-white/5 opacity-40'}`}>🎙️</div>
            <div className="flex-1 bg-navy-950/80 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-os-slate tracking-widest uppercase">Microphone Activity</span>
               </div>
               <div className="h-1.5 bg-white/5 w-full relative rounded-full overflow-hidden">
                  <div className="h-full bg-os-primary transition-all duration-150" style={{ width: `${Math.min(100, volume.input * 1.5)}%` }}></div>
               </div>
            </div>
         </div>
         <div className="ml-16">
            <button onClick={handleEndCall} className="btn-primary text-white px-24 py-8 rounded-2xl flex flex-col items-center gap-1">
               <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Conclude Session</span>
               <span className="text-2xl font-extrabold uppercase tracking-widest">Finish</span>
            </button>
         </div>
      </footer>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default App;
