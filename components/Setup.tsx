
import React, { useState, useEffect } from 'react';
import { SCENARIOS } from '../constants';
import { Scenario, UserProfile, Language } from '../types';
import { playSfx } from '../utils/sound';
import { saveCustomScenario, getCustomScenarios, deleteCustomScenario } from '../utils/storage';
import { translations } from '../translations';
import CustomScenario from './CustomScenario';

interface SetupProps {
  onStart: (scenario: Scenario, isBlindMode: boolean) => void;
  onShowHistory: () => void;
  isLoading: boolean;
  userProfile?: UserProfile;
  lang: Language;
}

type Tab = 'presets' | 'saved' | 'custom';

const Setup: React.FC<SetupProps> = ({ onStart, onShowHistory, isLoading, userProfile, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem('boss_battle_setup_tab') as Tab) || 'presets';
  });
  const [isBlindMode, setIsBlindMode] = useState(() => localStorage.getItem('boss_battle_blind_mode') === 'true');
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);

  // Daily Challenge Logic: Select a scenario based on the day of year
  const getDailyScenario = (): Scenario => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const scenario = SCENARIOS[dayOfYear % SCENARIOS.length];
    return { ...scenario, isDaily: true };
  };

  const dailyScenario = getDailyScenario();

  useEffect(() => {
    if (activeTab === 'saved') {
      setSavedScenarios(getCustomScenarios());
    }
    localStorage.setItem('boss_battle_setup_tab', activeTab);
  }, [activeTab]);

  const handleRandom = () => {
    playSfx('click');
    const randomScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    onStart(randomScenario, isBlindMode);
  };

  const isScenarioLocked = (scenario: Scenario): { locked: boolean; reqLevel: number } => {
    if (!userProfile) return { locked: false, reqLevel: 0 };
    if (scenario.difficulty === 'Hard' && userProfile.level < 3) return { locked: true, reqLevel: 3 };
    if (scenario.difficulty === 'Extreme' && userProfile.level < 5) return { locked: true, reqLevel: 5 };
    return { locked: false, reqLevel: 0 };
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    playSfx('click');
    deleteCustomScenario(id);
    setSavedScenarios(getCustomScenarios());
  };

  const handleGenerated = (scenario: Scenario) => {
    saveCustomScenario(scenario);
    setSavedScenarios(getCustomScenarios());
    onStart(scenario, isBlindMode);
  };

  return (
    <div className="max-w-6xl mx-auto w-full p-6 animate-fade-in">
      <div className="text-center mb-12 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-600 blur-[100px] opacity-20 pointer-events-none"></div>
        <h1 className="text-6xl md:text-7xl font-black text-white italic transform -skew-x-6 tracking-tighter mb-4">
          {t.appTitle}
        </h1>
        <p className="text-gray-500 text-lg uppercase tracking-[0.3em] font-bold mb-8">
           {t.tagline}
        </p>

        <div className="flex gap-4 justify-center mb-12">
          <button onClick={() => { playSfx('click'); onShowHistory(); }} className="group inline-flex items-center gap-3 px-8 py-3 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white transition-all text-sm font-black uppercase tracking-widest shadow-xl">
            <span className="text-blue-500 group-hover:scale-125 transition-transform">📜</span> {t.history}
          </button>
          <button onClick={handleRandom} className="group inline-flex items-center gap-3 px-8 py-3 rounded-full bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white transition-all text-sm font-black uppercase tracking-widest shadow-xl">
            <span className="text-yellow-500 group-hover:rotate-180 transition-transform duration-500">🎲</span> {t.randomBoss}
          </button>
        </div>

        {/* Daily Challenge Highlight */}
        {activeTab === 'presets' && (
          <div 
            onClick={() => onStart(dailyScenario, isBlindMode)}
            className="max-w-2xl mx-auto mb-16 p-1 rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 animate-pulse-fast cursor-pointer hover:scale-[1.02] transition-transform shadow-2xl relative group"
          >
             <div className="absolute -top-4 left-6 bg-white text-black px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                {t.dailyChallenge}
             </div>
             <div className="bg-gray-950 rounded-[22px] p-8 text-left flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:scale-150 transition-transform"></div>
                <div className="w-24 h-24 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-4xl shrink-0">
                  🔥
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <h2 className="text-3xl font-black text-white italic transform -skew-x-6 uppercase tracking-tight">{dailyScenario.name}</h2>
                     <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{t.bonusXp}</span>
                   </div>
                   <p className="text-gray-400 text-sm leading-relaxed">{dailyScenario.description}</p>
                </div>
                <div className="shrink-0 flex flex-col items-center">
                   <div className="text-[10px] text-gray-500 font-black uppercase mb-1">{t.difficulty}</div>
                   <span className="text-lg font-black text-blue-400 uppercase italic transform -skew-x-6">{dailyScenario.difficulty}</span>
                </div>
             </div>
          </div>
        )}

        <div className="flex justify-center border-b border-gray-800 mb-12">
          {(['presets', 'saved', 'custom'] as const).map((tab) => (
            <button 
              key={tab} 
              onClick={() => { playSfx('click'); setActiveTab(tab); }} 
              className={`px-10 py-4 text-xs font-black uppercase tracking-[0.2em] border-b-2 transition-all ${activeTab === tab ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {t[tab as keyof typeof t] as string}
            </button>
          ))}
        </div>
      </div>
      
      <div className="max-w-md mx-auto mb-12">
        <div 
          onClick={() => { playSfx('click'); setIsBlindMode(!isBlindMode); localStorage.setItem('boss_battle_blind_mode', String(!isBlindMode)); }} 
          className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${isBlindMode ? 'bg-red-900/10 border-red-500/50 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.15)]' : 'bg-gray-900 border-gray-800 text-gray-500 hover:border-gray-700'}`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${isBlindMode ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' : 'bg-gray-800'}`}>
              {isBlindMode ? '👁️‍🗨️' : '👁️'}
            </div>
            <div>
              <span className="font-black block text-xs uppercase tracking-widest mb-1">{t.blindMode}</span>
              <span className="text-[10px] opacity-60 font-bold uppercase">{t.blindModeDesc}</span>
            </div>
          </div>
          <div className={`w-14 h-7 rounded-full p-1 transition-colors ${isBlindMode ? 'bg-red-600' : 'bg-gray-700'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isBlindMode ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'presets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SCENARIOS.map((scenario) => {
              const { locked, reqLevel } = isScenarioLocked(scenario);
              return (
                <div 
                  key={scenario.id} 
                  onClick={() => !locked && !isLoading && onStart(scenario, isBlindMode)} 
                  className={`group relative rounded-3xl border bg-gray-900/40 p-8 text-left transition-all duration-500 ${locked ? 'border-gray-800 opacity-40 cursor-not-allowed grayscale' : 'border-gray-800 hover:border-blue-500/50 hover:bg-gray-800/80 cursor-pointer hover:shadow-2xl hover:-translate-y-2'}`}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-gray-950/60 z-20 flex items-center justify-center backdrop-blur-[2px] flex-col gap-3 rounded-3xl">
                       <span className="text-4xl">🔒</span>
                       <span className="text-[10px] font-black text-white bg-blue-600 px-4 py-2 rounded-full uppercase tracking-widest shadow-xl">{t.requiresLvl} {reqLevel}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors uppercase italic transform -skew-x-6 leading-tight">{scenario.name}</h3>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${scenario.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400' : scenario.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-500'}`}>
                      {t[scenario.difficulty.toLowerCase() as keyof typeof t] as string}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed mb-8 h-10 line-clamp-2 uppercase group-hover:text-gray-400 transition-colors">{scenario.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-blue-500 transition-colors">{scenario.durationMinutes} Minutes</span>
                     <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all text-blue-500">→</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {savedScenarios.length === 0 ? (
              <div className="col-span-full text-center py-32 border-4 border-dashed border-gray-900 rounded-[40px] text-gray-800 flex flex-col items-center gap-6">
                <div className="text-6xl">📥</div>
                <div className="space-y-2">
                  <p className="text-2xl font-black uppercase italic tracking-tighter">Inventory Empty</p>
                  <p className="text-sm font-bold uppercase opacity-50 tracking-widest">Construct a scenario in the custom engine</p>
                </div>
              </div>
            ) : (
              savedScenarios.map((scenario) => (
                <div key={scenario.id} onClick={() => onStart(scenario, isBlindMode)} className="group relative rounded-3xl border border-gray-800 bg-gray-900/40 p-8 text-left transition-all duration-500 hover:border-purple-500/50 hover:bg-gray-800/80 cursor-pointer hover:-translate-y-2">
                  <button 
                    onClick={(e) => handleDeleteSaved(e, scenario.id)}
                    className="absolute top-6 right-6 text-gray-700 hover:text-red-500 transition-all p-2 z-10 hover:scale-125"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                  <div className="flex justify-between items-start mb-6 pr-8">
                    <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors uppercase italic transform -skew-x-6">{scenario.name}</h3>
                  </div>
                  <p className="text-gray-500 text-xs font-bold leading-relaxed mb-8 h-10 line-clamp-2 uppercase group-hover:text-gray-400 transition-colors">{scenario.description}</p>
                  <div className="mt-auto flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{scenario.difficulty}</span>
                     <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-purple-500">→</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'custom' && (
          <CustomScenario onGenerated={handleGenerated} lang={lang} />
        )}
      </div>
    </div>
  );
};

export default Setup;
