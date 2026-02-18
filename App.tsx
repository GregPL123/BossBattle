
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Setup from './components/Setup';
import Lobby from './components/Lobby';
import Visualizer from './components/Visualizer';
import ChatLog from './components/ChatLog';
import Report from './components/Report';
import Timer from './components/Timer';
import History from './components/History';
import Settings from './components/Settings';
import BattleCoach from './components/BattleCoach';
import ToastContainer, { ToastMessage, ToastType } from './components/Toast';
import BattleIntro from './components/BattleIntro';
import CommunityHub from './components/CommunityHub';
import AuthButton from './components/AuthButton';
import ProfileModal from './components/ProfileModal';
import KnowledgeBase from './components/KnowledgeBase';

import { useLiveSession } from './hooks/useLiveSession';
import { generateAnalysis } from './utils/analysis';
import { Scenario, ConnectionState, AnalysisResult, HistoryEntry, UserProfile, InputMode, Language } from './types';
import { saveHistory, getHistory, clearHistory, getUserProfile, updateUserProfile } from './utils/storage';
import { calculateXpGain, checkNewAchievements } from './utils/gamification';
import { playSfx } from './utils/sound';
import { subscribeToAuth, syncProfileToCloud, getProfileFromCloud } from './utils/firebase';
import { User } from 'firebase/auth';
import { translations } from './translations';

const API_KEY = process.env.API_KEY || '';

const LOADING_TIPS: Record<Language, string[]> = {
  en: [
    "Don't interrupt immediately; listen to the tone.",
    "Use silence to your advantage.",
    "Keep your answers concise to maintain control.",
    "If the boss gets angry, stay calm and stick to facts.",
    "Acknowledge their perspective before countering.",
    "Use 'I' statements to avoid sounding accusatory.",
    "Breathe. It's just a simulation."
  ],
  pl: [
    "Nie przerywaj od razu; słuchaj tonu głosu.",
    "Wykorzystaj ciszę na swoją korzyść.",
    "Udzielaj zwięzłych odpowiedzi, by zachować kontrolę.",
    "Jeśli szef się rozzłości, zachowaj spokój i trzymaj się faktów.",
    "Uznaj ich perspektywę przed kontratakiem.",
    "Używaj komunikatów typu 'Ja', by nie brzmieć oskarżycielsko.",
    "Oddychaj. To tylko symulacja."
  ]
};

const LevelUpOverlay: React.FC<{ profile: UserProfile; onClose: () => void; lang: Language }> = ({ profile, onClose, lang }) => {
  const t = translations[lang];
  useEffect(() => {
    playSfx('success');
  }, []);

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6 animate-fade-in text-center">
       <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
       <div className="relative animate-slide-up">
          <div className="text-blue-500 text-sm font-black tracking-[0.5em] mb-4 uppercase">{t.levelUp}</div>
          <h1 className="text-8xl font-black text-white italic transform -skew-x-12 mb-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">LEVEL {profile.level}</h1>
          <div className="text-gray-400 font-bold tracking-widest mb-12">{t.newTitle}</div>
          <div className="text-3xl font-black text-blue-400 uppercase italic mb-16">{profile.activeTitle || profile.title}</div>
          <button onClick={onClose} className="px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">
             CONTINUE
          </button>
       </div>
    </div>
  );
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('boss_battle_lang') as Language) || 'en';
  });
  const t = translations[lang];

  const [lobbyScenario, setLobbyScenario] = useState<Scenario | null>(null);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [viewingHistoryEntry, setViewingHistoryEntry] = useState<HistoryEntry | null>(null);
  
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(undefined);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [lastXpGain, setLastXpGain] = useState(0);
  const [justLeveledUp, setJustLeveledUp] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState<string>(() => {
    return localStorage.getItem('boss_battle_mic_id') || '';
  });
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState<string>(() => {
    return localStorage.getItem('boss_battle_speaker_id') || '';
  });
  const [micThreshold, setMicThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('boss_battle_mic_threshold');
    return saved ? parseFloat(saved) : 0.01;
  });
  const [inputMode, setInputMode] = useState<InputMode>(() => {
    return (localStorage.getItem('boss_battle_input_mode') as InputMode) || 'VAD';
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const { 
    connect, 
    disconnect, 
    connectionState, 
    error, 
    isMuted, 
    toggleMute,
    volume,
    transcript,
    audioUrl,
    startTime,
    latency,
    markers,
    addMarker,
    isAiSpeaking,
    availableInputs,
    availableOutputs,
    setOutputDevice,
    setInputThreshold,
    setInputMode: setSessionInputMode,
    setPttPressed,
    inputAnalyser,
    outputAnalyser
  } = useLiveSession(API_KEY);

  const isUserSpeaking = volume.input > (micThreshold * 255);

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    setHistoryEntries(getHistory());
    setUserProfile(getUserProfile());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (user) => {
      setFirebaseUser(user);
      if (user) {
        addToast(`${lang === 'en' ? 'Welcome back' : 'Witaj z powrotem'}, ${user.displayName?.split(' ')[0]}`, 'success');
        const cloudProfile = await getProfileFromCloud(user.uid);
        if (cloudProfile) {
          const localProfile = getUserProfile();
          if (cloudProfile.xp > localProfile.xp) {
             setUserProfile(cloudProfile);
             localStorage.setItem('boss_battle_profile', JSON.stringify(cloudProfile));
          } else if (localProfile.xp > cloudProfile.xp) {
             syncProfileToCloud(user, localProfile);
          }
        } else {
           const localProfile = getUserProfile();
           syncProfileToCloud(user, localProfile);
        }
      }
    });
    return () => unsubscribe();
  }, [lang]);

  useEffect(() => {
    setInputThreshold(micThreshold);
  }, [micThreshold, setInputThreshold]);

  useEffect(() => {
    setSessionInputMode(inputMode);
  }, [inputMode, setSessionInputMode]);

  const handleInputDeviceSelect = (id: string) => {
    setSelectedInputDeviceId(id);
    localStorage.setItem('boss_battle_mic_id', id);
  };

  const handleOutputDeviceSelect = (id: string) => {
    setSelectedOutputDeviceId(id);
    localStorage.setItem('boss_battle_speaker_id', id);
    if (connectionState === ConnectionState.CONNECTED) {
       setOutputDevice(id);
    }
  };

  const handleSetMicThreshold = (val: number) => {
    setMicThreshold(val);
    localStorage.setItem('boss_battle_mic_threshold', val.toString());
  };

  const handleSetInputMode = (mode: InputMode) => {
    setInputMode(mode);
    localStorage.setItem('boss_battle_input_mode', mode);
    addToast(`${t.vadMode} ${mode === 'VAD' ? t.vadMode : t.pttMode}`, 'info');
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('boss_battle_lang', newLang);
    playSfx('click');
    addToast(newLang === 'pl' ? "Zmieniono język na Polski" : "Language set to English", "success");
  };

  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTING) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => (prev + 1) % LOADING_TIPS[lang].length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [connectionState, lang]);

  useEffect(() => {
    if (connectionState === ConnectionState.CONNECTED) {
      if (!showIntro) {
         playSfx('connect');
         addToast(t.connected, "success");
      }
      setShowIntro(true);
      
    } else if (connectionState === ConnectionState.ERROR) {
      playSfx('failure');
      addToast(error || (lang === 'en' ? "Connection failed" : "Błąd połączenia"), "error");
      setShowIntro(false);
      const timer = setTimeout(() => {
        setActiveScenario(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [connectionState, error, isBlindMode, lang, t.connected]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (activeScenario && connectionState === ConnectionState.CONNECTED && !showIntro) {
        if (e.code === 'Space') {
          if (!e.repeat) {
            if (inputMode === 'PTT') {
               setPttPressed(true);
            } else {
               e.preventDefault();
               toggleMute();
            }
          }
        }
        if (e.code === 'KeyM') {
           if (!e.repeat) {
             addMarker();
             playSfx('click');
             addToast(lang === 'en' ? "Marker Added" : "Dodano znacznik", 'info');
           }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
       if (e.code === 'Space' && inputMode === 'PTT') {
          setPttPressed(false);
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
       window.removeEventListener('keydown', handleKeyDown);
       window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeScenario, connectionState, toggleMute, showIntro, inputMode, setPttPressed, addMarker, lang]);

  const handleScenarioSelect = (scenario: Scenario, blind: boolean) => {
    setIsBlindMode(blind);
    setLobbyScenario(scenario);
  };

  const handleLobbyStart = async (blindMode: boolean) => {
    if (!lobbyScenario) return;
    setAnalysis(null);
    setActiveScenario(lobbyScenario);
    setLobbyScenario(null);
    setIsBlindMode(blindMode);
    
    let finalInstruction = lobbyScenario.systemInstruction;
    finalInstruction += `\nCRITICAL: Respond exclusively in ${lang === 'pl' ? 'Polish' : 'English'}.`;
    finalInstruction += `\nYou MUST initiate the conversation by speaking first immediately when the session opens.`;
    
    if (userProfile && userProfile.level >= 5) {
       finalInstruction += `\n[SYSTEM UPDATE]: The user is a Level ${userProfile.level} Veteran. Be sharper.`;
    }

    await connect(
      finalInstruction, 
      lobbyScenario.voiceName, 
      selectedInputDeviceId,
      selectedOutputDeviceId,
      lobbyScenario.ambience
    );
  };

  const handleEndCall = async (timedOut: boolean = false) => {
    if (timedOut) playSfx('failure');
    else playSfx('disconnect');
    disconnect();
    setShowIntro(false);
    
    if (activeScenario && transcript.length > 1) { 
      setIsAnalyzing(true);
      const result = await generateAnalysis(API_KEY, transcript, activeScenario, lang);
      result.markers = markers;
      if (timedOut) result.timedOut = true;

      const xp = calculateXpGain(result.score, result.outcome, activeScenario.difficulty, activeScenario.isDaily);
      const unlockedAchievements = userProfile ? checkNewAchievements(userProfile, result, activeScenario) : [];
      
      unlockedAchievements.forEach(ach => {
         addToast(`${t.unlocked}: ${ach.name} ${ach.icon}`, 'success');
      });

      const newAchievementIds = unlockedAchievements.map(a => a.id);
      const { profile, leveledUp } = updateUserProfile(xp, result.outcome === 'Success', newAchievementIds);
      
      if (leveledUp) {
         setShowLevelUp(true);
      }

      setUserProfile(profile);
      setLastXpGain(xp);
      setJustLeveledUp(leveledUp);
      if (firebaseUser) syncProfileToCloud(firebaseUser, profile);
      saveHistory(activeScenario, result);
      setHistoryEntries(getHistory()); 
      
      setAnalysis(result);
      setIsAnalyzing(false);
    } else {
      setActiveScenario(null);
    }
  };

  const handleHome = () => {
    playSfx('click');
    setAnalysis(null);
    setActiveScenario(null);
    setLobbyScenario(null);
    setViewingHistoryEntry(null);
    setShowHistory(false);
    setShowIntro(false);
    setShowCommunity(false);
    setShowProfile(false);
    setShowAcademy(false);
    setShowLevelUp(false);
    disconnect(); 
  };

  const avatarUrl = activeScenario 
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=boss&backgroundColor=1f2937`
    : undefined;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-blue-500/30 flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showLevelUp && userProfile && (
        <LevelUpOverlay profile={userProfile} onClose={() => setShowLevelUp(false)} lang={lang} />
      )}

      {showIntro && activeScenario && (
        <BattleIntro 
          bossName={activeScenario.name.replace('Vs. ', '')} 
          onComplete={handleIntroComplete} 
          lang={lang}
        />
      )}

      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleHome}>
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-bold tracking-tight text-lg">{t.appTitle}</span>
          </div>
          
          <div className="flex items-center gap-4">
            {connectionState === ConnectionState.CONNECTED && !showIntro ? (
              <div className="flex items-center gap-3">
                 <Timer durationMinutes={activeScenario?.durationMinutes} isActive={true} onTimeExpire={() => handleEndCall(true)} />
                 <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-3 py-1 rounded-full text-xs font-bold animate-pulse">LIVE</div>
              </div>
            ) : (
               <div className="flex items-center gap-3">
                  <button onClick={() => setShowAcademy(true)} className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-full transition-all">
                     <span>🎓</span> {t.academy}
                  </button>
                  <button onClick={() => setShowCommunity(true)} className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-full transition-all">
                     <span>🌐</span> {t.community}
                  </button>
                  <button onClick={() => setShowProfile(true)} className="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-full transition-all">
                     <span>👤</span> {t.profile}
                  </button>
                  <AuthButton user={firebaseUser} onError={(msg) => addToast(msg, 'error')} />
               </div>
            )}
            
            <button onClick={() => setShowSettings(true)} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          {!lobbyScenario && !activeScenario && !isAnalyzing && !analysis && !viewingHistoryEntry && !showHistory && !showCommunity && !showProfile && !showAcademy && (
            <Setup onStart={handleScenarioSelect} onShowHistory={() => setShowHistory(true)} isLoading={connectionState === ConnectionState.CONNECTING} userProfile={userProfile} lang={lang} />
          )}

          {lobbyScenario && !activeScenario && (
             <Lobby scenario={lobbyScenario} userProfile={userProfile} inputDeviceId={selectedInputDeviceId} micThreshold={micThreshold} onStart={handleLobbyStart} onBack={() => setLobbyScenario(null)} onSettings={() => setShowSettings(true)} onSetThreshold={handleSetMicThreshold} lang={lang} />
          )}

          {!lobbyScenario && !activeScenario && !isAnalyzing && !analysis && !viewingHistoryEntry && showHistory && (
            <History entries={historyEntries} onClear={() => { clearHistory(); setHistoryEntries([]); }} onClose={handleHome} onSelectEntry={(e) => setViewingHistoryEntry(e)} userProfile={userProfile} lang={lang} />
          )}

          {viewingHistoryEntry && (
             <Report result={viewingHistoryEntry} transcript={[]} audioUrl={null} onRetry={handleHome} onHome={handleHome} userProfile={userProfile} readOnly={true} lang={lang} />
          )}

          {activeScenario && connectionState === ConnectionState.CONNECTING && !isAnalyzing && (
            <div className="flex flex-col items-center gap-8 animate-fade-in max-w-lg w-full">
              <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="text-center">
                <h2 className="text-3xl font-bold uppercase italic tracking-tighter">{t.connecting} {activeScenario.name}</h2>
                <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">{t.linkEstablishing}</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 w-full text-center shadow-2xl backdrop-blur-md">
                <p className="text-[10px] uppercase text-gray-500 font-black mb-3 tracking-widest">{t.negotiationTip}</p>
                <p className="text-gray-300 text-lg italic leading-relaxed">"{LOADING_TIPS[lang][currentTipIndex]}"</p>
              </div>
            </div>
          )}

          {activeScenario && connectionState === ConnectionState.CONNECTED && !showIntro && !isAnalyzing && (
            <div className="w-full max-w-5xl flex flex-col items-center gap-8 animate-fade-in py-8">
              <BattleCoach transcript={transcript} isAiSpeaking={isAiSpeaking} isUserSpeaking={isUserSpeaking} inputMode={inputMode} lang={lang} />
              <Visualizer 
                inputAnalyser={inputAnalyser} 
                outputAnalyser={outputAnalyser} 
                isActive={true} 
                isAiSpeaking={isAiSpeaking} 
                isUserSpeaking={isUserSpeaking} 
                ambience={activeScenario.ambience} 
                avatarUrl={avatarUrl} 
                isBlindMode={isBlindMode} 
                latency={latency} 
                lang={lang}
              />
              <div className="flex items-center justify-center gap-6">
                <button onClick={() => handleEndCall(false)} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border-b-4 border-red-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  {t.endSession}
                </button>
              </div>
              {!isBlindMode && <ChatLog transcript={transcript} userProfile={userProfile} lang={lang} />}
            </div>
          )}

          {isAnalyzing && (
            <div className="flex flex-col items-center gap-6 animate-fade-in">
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <h2 className="text-2xl font-black uppercase tracking-tight italic">{t.analyzingPerf}</h2>
              <p className="text-gray-500 font-bold text-sm uppercase">{t.analyzingDesc}</p>
            </div>
          )}

          {analysis && !isAnalyzing && (
            <Report result={analysis} transcript={transcript} startTime={startTime} onRetry={() => { setAnalysis(null); setLobbyScenario(activeScenario); setActiveScenario(null); }} onHome={handleHome} audioUrl={audioUrl} userProfile={userProfile} xpGained={lastXpGain} isLevelUp={justLeveledUp} activeScenario={activeScenario!} lang={lang} />
          )}

          {showSettings && (
            <Settings inputDevices={availableInputs} outputDevices={availableOutputs} selectedInputId={selectedInputDeviceId} selectedOutputId={selectedOutputDeviceId} micThreshold={micThreshold} inputMode={inputMode} language={lang} onSelectInput={handleInputDeviceSelect} onSelectOutput={handleOutputDeviceSelect} onSetMicThreshold={handleSetMicThreshold} onSetInputMode={handleSetInputMode} onLanguageChange={handleLanguageChange} onClose={() => setShowSettings(false)} />
          )}

          {showCommunity && (
            <CommunityHub user={firebaseUser} userProfile={userProfile} onClose={() => setShowCommunity(false)} onImportScenario={(s) => { setLobbyScenario(s); setShowCommunity(false); }} lang={lang} />
          )}

          {showProfile && (
            <ProfileModal user={firebaseUser} userProfile={userProfile} onClose={() => setShowProfile(false)} onUpdateProfile={setUserProfile} lang={lang} />
          )}

          {showAcademy && (
            <KnowledgeBase onClose={() => setShowAcademy(false)} lang={lang} />
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
