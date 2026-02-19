
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
import GlitchOverlay from './components/GlitchOverlay';
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

  const addToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleStartMission = (scenario: Scenario) => {
    playSfx('click');
    const profile = getUserProfile();
    const bossRel = profile.bossMemories[scenario.id];
    const startingStage = bossRel ? (bossRel.highestStage || 1) : 1;
    
    setActiveScenario(scenario);
    setCurrentStage(startingStage);
    setShowLobby(true);
    setShowCustom(false);
  };

  const handleProceedFromLobby = () => {
    setShowLobby(false);
    setShowIntro(true);
  };

  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED && transcript.length === 0) {
      addToast("NEURAL_LINK_STABLE: AWAITING_TARGET_SIGNAL", "info");
    }
  }, [connectionState, transcript.length]);

  const startConnection = async () => {
    if (!activeScenario) return;
    setShowIntro(false);
    const stageInstruction = `${activeScenario.systemInstruction}\nCURRENT_STAGE: ${currentStage}. Objectives for this stage: ${activeScenario.objectives.slice(0, currentStage).join(', ')}`;
    try {
      await connect(stageInstruction, activeScenario.voiceName, '', '', activeScenario.ambience);
    } catch (e) {
      addToast("Błąd połączenia z serwerem neuralnym", "error");
      setActiveScenario(null);
    }
  };

  const handleEndCall = async () => {
    playSfx('disconnect');
    disconnect();
    
    if (activeScenario && transcript.length > 1) { 
      setIsAnalyzing(true);
      try {
        const result = await generateAnalysis(API_KEY, transcript, activeScenario, lang);
        const { profile, leveledUp } = updateUserProfile(145, result.outcome === 'Success', [], result, activeScenario.id, currentStage);
        
        if (leveledUp) addToast("AWANS DOSTĘPU: NOWA RANGA PRZYPISANA", "success");
        
        if (result.outcome === 'Success' && currentStage < (activeScenario.totalStages || 3)) {
          result.nextStageUnlocked = true;
        }

        setUserProfile(profile);
        saveHistory(activeScenario, result);
        setHistory(getHistory());
        setAnalysis(result);
        playSfx('success');
      } catch (e) {
        addToast("Błąd ekstrakcji danych", "error");
        setActiveScenario(null);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
      setActiveScenario(null);
      setAnalysis(null);
    }
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white font-mono">
        <div className="w-24 h-24 border-4 border-os-accent border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_80px_rgba(99,102,241,0.6)]"></div>
        <h2 className="text-3xl font-black italic tracking-[0.5em] uppercase animate-pulse chromatic" data-text="NEURAL_LOG_EXTRACTION">NEURAL_LOG_EXTRACTION</h2>
        <p className="mt-4 text-[10px] text-gray-600 font-black tracking-[0.8em] uppercase">Processing high-fidelity metrics...</p>
      </div>
    );
  }

  if (showIntro && activeScenario) {
    return <BattleIntro bossName={activeScenario.name} onComplete={startConnection} lang={lang} />;
  }

  if (analysis && activeScenario) {
    return (
      <Report 
        result={analysis} 
        scenario={activeScenario}
        transcript={transcript}
        audioUrl={audioUrl}
        startTime={startTime}
        onHome={() => { setAnalysis(null); setActiveScenario(null); }} 
        onRetry={() => {
            if (analysis.nextStageUnlocked) {
                setCurrentStage(prev => prev + 1);
            }
            setAnalysis(null);
            setShowLobby(true);
        }}
        lang={lang} 
      />
    );
  }

  if (showLobby && activeScenario) {
    return (
      <Lobby 
        scenario={{...activeScenario, stage: currentStage}} 
        userProfile={userProfile}
        inputDeviceId="" 
        micThreshold={0.01} 
        onStart={handleProceedFromLobby} 
        onBack={() => setShowLobby(false)} 
        onSettings={() => {}} 
        onSetThreshold={setInputThreshold} 
        lang={lang} 
      />
    );
  }

  if (!activeScenario) {
    return (
      <>
        <Setup 
          onStart={handleStartMission} 
          onShowHistory={() => setShowHistory(true)} 
          onShowCustom={() => setShowCustom(true)}
          isLoading={false} 
          lang={lang}
          userProfile={userProfile}
        />
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex gap-12 z-50">
           <button onClick={() => setShowCommunity(true)} className="glass-card px-16 py-6 rounded-sm skew-btn border border-white/10 hover:border-os-accent transition-all text-gray-500 hover:text-white uppercase font-black text-[12px] tracking-[0.6em] shadow-[0_24px_64px_rgba(0,0,0,0.8)] group active:scale-95">
              <span className="relative z-10">NEURAL_HUB</span>
              <div className="absolute inset-0 bg-os-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </button>
           <button onClick={() => setShowProfile(true)} className="glass-card px-16 py-6 rounded-sm skew-btn border border-white/10 hover:border-os-accent transition-all text-gray-500 hover:text-white uppercase font-black text-[12px] tracking-[0.6em] shadow-[0_24px_64px_rgba(0,0,0,0.8)] group active:scale-95">
              <span className="relative z-10">PERSONNEL_RECORD</span>
              <div className="absolute inset-0 bg-os-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
           </button>
        </div>
        {showHistory && (
          <div className="fixed inset-0 z-[120] bg-navy-950/98 flex items-center justify-center p-10 backdrop-blur-3xl animate-fade-in">
            <History entries={history} onClose={() => setShowHistory(false)} onClear={() => { clearHistory(); setHistory([]); }} onSelectEntry={(e) => {}} lang={lang} userProfile={userProfile} />
          </div>
        )}
        {showCustom && (
          <div className="fixed inset-0 z-[120] bg-navy-950/95 flex items-center justify-center p-10 backdrop-blur-3xl animate-fade-in">
            <div className="relative w-full max-w-2xl">
              <button onClick={() => setShowCustom(false)} className="absolute -top-16 right-0 text-gray-600 hover:text-white uppercase font-black text-[11px] tracking-[0.5em] transition-colors">Abort_Synthesis</button>
              <CustomScenario onGenerated={handleStartMission} lang={lang} />
            </div>
          </div>
        )}
        {showProfile && <ProfileModal userProfile={userProfile} onClose={() => setShowProfile(false)} lang={lang} />}
        {showCommunity && <CommunityHub user={null} userProfile={userProfile} onClose={() => setShowCommunity(false)} onImportScenario={(s) => { handleStartMission(s); setShowCommunity(false); }} lang={lang} />}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  return (
    <div className="h-screen bg-navy-950 text-white font-sans flex flex-col selection:bg-os-accent/30 overflow-hidden relative">
      <div className="scanline-effect opacity-20 pointer-events-none"></div>
      
      {/* Glitch Overlay for high intensity moments */}
      <GlitchOverlay active={bossMood === 'Impatient'} intensity="high" />
      
      {/* HUD Overlays */}
      <BattleCoach transcript={transcript} isAiSpeaking={isAiSpeaking} isUserSpeaking={isUserSpeaking} lang={lang} />
      <TacticalInsightsHUD insights={tacticalInsights} />
      <LiveTelemetryHUD />

      {/* Elite Tactical Header */}
      <header className="h-32 bg-navy-900/90 border-b border-white/10 flex items-center justify-between px-20 shrink-0 relative z-30 backdrop-blur-2xl">
        <div className="flex items-center gap-20">
           <div className="flex items-center gap-8 group cursor-pointer">
              <div className="w-16 h-16 bg-os-accent rounded-sm flex items-center justify-center font-black italic shadow-[0_0_40px_rgba(99,102,241,0.6)] group-hover:scale-110 transition-transform"><span className="text-3xl">N</span></div>
              <div className="flex flex-col">
                 <span className="font-black text-xl tracking-[0.4em] uppercase text-white drop-shadow-lg">NEGOTIATOR<span className="text-os-accent">.OS</span></span>
                 <span className="text-[9px] text-gray-600 font-mono font-black tracking-[0.6em]">ELITE_TERMINAL_v7.2</span>
              </div>
           </div>
           
           <div className="h-16 w-px bg-white/10"></div>
           
           <div className="flex flex-col">
             <div className="flex items-center gap-4 mb-2">
                <div className="flex gap-1.5">
                   {[1, 2, 3].map(s => <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= currentStage ? 'bg-os-emerald' : 'bg-navy-950 border border-white/20'}`}></div>)}
                </div>
                <span className="text-[10px] font-black text-os-accent uppercase tracking-[0.6em] font-mono">Uplink: Stage_0{currentStage}</span>
             </div>
             <div className="flex items-center gap-4"><span className="text-5xl font-black uppercase italic tracking-tighter text-glow-os leading-none">{activeScenario.name}</span></div>
           </div>
        </div>

        <div className="flex items-center gap-24">
           <div className="flex flex-col items-end">
              <div className="flex justify-between w-full mb-3 px-1">
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em] font-mono">Operator_Node: 0{userProfile.level}</span>
                 <span className="text-[10px] font-black text-os-accent uppercase tracking-[0.4em] font-mono ml-12">{userProfile.title}</span>
              </div>
              <div className="w-96 h-2.5 bg-navy-950 rounded-full overflow-hidden border border-white/10 p-[1.5px] relative shadow-inner">
                 <div className="h-full bg-gradient-to-r from-os-accent via-os-purple to-os-blue shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all duration-1000" style={{ width: `${(userProfile.xp % 500) / 5}%` }}></div>
              </div>
           </div>
           
           <div className={`threat-badge px-12 py-5 rounded-sm flex items-center gap-8 transition-all duration-700 border-2 ${bossMood === 'Impatient' ? 'bg-os-red/10 border-os-red/60 shadow-[0_0_40px_rgba(244,63,94,0.4)]' : 'bg-navy-950 border-white/10 shadow-2xl'}`}>
              <div className={`w-4 h-4 bg-os-red rounded-full animate-pulse shadow-[0_0_20px_#f43f5e]`}></div>
              <div className="flex flex-col">
                 <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest">Psy_Threat_Level</span>
                 <span className={`text-sm uppercase font-black tracking-[0.4em] ${bossMood === 'Impatient' ? 'text-white' : 'text-os-red'}`}>
                   {bossMood === 'Impatient' ? 'CRITICAL_MAX' : 'ELEVATED'}
                 </span>
              </div>
           </div>
           
           <button onClick={handleEndCall} className="text-gray-700 hover:text-white transition-all hover:scale-125 group active:scale-95">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
           </button>
        </div>
      </header>

      {/* Main Multi-Column Layout */}
      <main className="flex-1 grid grid-cols-12 gap-12 p-16 overflow-hidden relative z-20 bg-navy-950/40">
        
        {/* Left Focus: Communication & Objectives */}
        <div className="col-span-8 flex flex-col gap-12 overflow-hidden">
          
          {/* Objectives & HUD Info Card */}
          <div className="glass-card rounded-sm p-14 relative overflow-hidden shrink-0 border-r-[12px] border-r-os-accent/40 shadow-[0_32px_96px_rgba(0,0,0,0.9)]">
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-os-accent via-transparent to-transparent"></div>
             <div className="scan-overlay opacity-10"></div>
             
             <div className="flex justify-between items-center mb-12">
                <div className="flex flex-col gap-3">
                   <h3 className="text-3xl font-black uppercase italic tracking-[0.5em] flex items-center gap-8">
                       <span className="w-3 h-3 bg-os-accent rounded-full animate-ping"></span>
                       Mission Objectives
                   </h3>
                   <span className="text-[10px] text-gray-600 font-mono font-black uppercase tracking-[0.6em]">TACTICAL_MATRIX_00{currentStage}</span>
                </div>
                <div className="flex gap-6">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`w-6 h-6 rounded-sm border-2 transition-all duration-700 flex items-center justify-center font-mono text-[8px] font-black ${s < currentStage ? 'bg-os-emerald border-os-emerald shadow-[0_0_20px_#10b981]' : s === currentStage ? 'bg-os-accent border-os-accent shadow-[0_0_20px_#6366f1] animate-pulse text-white' : 'bg-navy-950 border-white/10 text-gray-800'}`}>
                           {s}
                        </div>
                    ))}
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-10">
                {activeScenario.objectives.slice(0, currentStage).map((obj, i) => (
                   <div key={i} className="bg-navy-950/80 border border-white/5 p-10 rounded-sm flex items-center gap-10 group hover:border-os-accent/50 transition-all duration-300 shadow-2xl">
                      <span className="text-os-accent font-mono text-xl font-black group-hover:scale-125 transition-transform drop-shadow-[0_0_10px_#6366f1]">0{i+1}</span>
                      <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors leading-relaxed">{obj}</span>
                   </div>
                ))}
             </div>
          </div>
          
          {/* Main Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-12 mask-fade-bottom">
             <ChatLog transcript={transcript} lang={lang} isAiSpeaking={isAiSpeaking} />
          </div>
        </div>

        {/* Right HUD: Visuals, Telemetry, Meter */}
        <div className="col-span-4 flex flex-col gap-12 overflow-y-auto custom-scrollbar pr-6">
           
           {/* Elite Visualizer Card */}
           <Visualizer isActive={connectionState === ConnectionState.CONNECTED} isAiSpeaking={isAiSpeaking} bossName={activeScenario.name} bossMood={bossMood} inputAnalyser={inputAnalyser} outputAnalyser={outputAnalyser} />
           
           {/* Dominance High-Tech Meter */}
           <div className="glass-card rounded-sm p-12 bg-navy-900/60 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="scan-overlay opacity-10"></div>
              <DominanceMeter bossMood={bossMood} isAiSpeaking={isAiSpeaking} isUserSpeaking={isUserSpeaking} />
           </div>

           {/* Neural Escalation Display */}
           <div className="glass-card rounded-sm p-14 space-y-10 border-l-[12px] border-l-os-red/40 shadow-[0_32px_96px_rgba(0,0,0,0.9)] relative overflow-hidden bg-navy-900/40">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-6xl font-black italic pointer-events-none">PSYCHO_ANALYSIS</div>
              <div className="flex justify-between items-center">
                 <div className="flex flex-col gap-2">
                    <span className="text-[12px] font-black text-gray-500 uppercase tracking-[0.6em] font-mono">Neural_Escalation</span>
                    <span className="text-[9px] text-gray-700 font-black uppercase tracking-widest">Link_Synchrony_Fidelity</span>
                 </div>
                 <div className="flex items-center gap-4 bg-os-red/10 border border-os-red/30 px-5 py-2 rounded-sm">
                    <span className="w-2 h-2 bg-os-red rounded-full animate-ping"></span>
                    <span className="text-[11px] font-black text-os-red tracking-[0.5em] font-mono uppercase">Danger_Zone</span>
                 </div>
              </div>
              <div className="grid grid-cols-10 gap-3.5 h-5">
                 {[...Array(10)].map((_, i) => (
                   <div key={i} className={`rounded-sm transition-all duration-700 ${i < (bossMood === 'Impatient' ? 9 : 5) ? 'bg-os-red/40 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : i === (bossMood === 'Impatient' ? 9 : 5) ? 'bg-os-red animate-flicker shadow-[0_0_30px_#f43f5e]' : 'bg-navy-950'}`}></div>
                 ))}
              </div>
              <p className="text-[12px] text-gray-500 font-bold leading-relaxed uppercase italic tracking-tight border-t border-white/5 pt-10">
                 {bossMood === 'Impatient' ? "CRITICAL_THREAT: Target patience threshold breached. Bridge failure imminent. Tactical shift required NOW." : "Signal resonance within safe parameters. Maintain current trajectory."}
              </p>
           </div>
        </div>
      </main>

      {/* Modern Control Console Footer */}
      <footer className="h-56 bg-navy-900 border-t border-white/10 p-14 flex items-center justify-between shrink-0 relative z-30 shadow-[0_-32px_128px_rgba(0,0,0,1)]">
         <div className="scanline-effect opacity-10"></div>
         <div className="flex items-center gap-16 flex-1 max-w-7xl">
            <div className={`w-32 h-32 rounded-sm border-2 flex items-center justify-center text-5xl transition-all duration-700 shadow-2xl transform -skew-x-12 ${isUserSpeaking ? 'border-os-accent bg-os-accent/20 shadow-[0_0_60px_rgba(99,102,241,0.6)] scale-110' : 'border-white/10 opacity-30 grayscale'}`}>🎙️</div>
            <div className="flex-1 bg-navy-950/90 border border-white/10 rounded-sm p-12 relative overflow-hidden shadow-inner transform -skew-x-6">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                     <div className="w-2 h-2 bg-os-accent rounded-full animate-pulse"></div>
                     <span className="text-[12px] font-black font-mono text-gray-600 tracking-[1em] uppercase">Uplink_Bandwidth_Stable</span>
                  </div>
                  <div className="flex gap-3">
                     {[...Array(8)].map((_, i) => <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < 7 ? 'bg-os-accent shadow-[0_0_10px_#6366f1]' : 'bg-gray-800'}`}></div>)}
                  </div>
               </div>
               <div className="h-4 bg-white/5 w-full relative rounded-full overflow-hidden shadow-inner border border-white/5">
                  <div className="h-full bg-gradient-to-r from-os-accent via-os-purple to-os-blue shadow-[0_0_30px_#6366f1] transition-all duration-150" style={{ width: `${Math.min(100, volume.input * 1.5)}%` }}></div>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-16 ml-24">
            <button onClick={handleEndCall} className="execute-gradient text-white px-40 py-10 rounded-sm skew-btn flex flex-col items-center gap-4 group relative overflow-hidden transition-all duration-500 active:scale-95 shadow-[0_24px_80px_rgba(99,102,241,0.5)]">
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <span className="text-[11px] font-black text-white/50 uppercase tracking-[1.2em] mb-2 animate-pulse">Terminate_Uplink</span>
               <span className="text-5xl font-black uppercase italic tracking-[0.8em] leading-none text-glow-os">Execute</span>
            </button>
         </div>
      </footer>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
