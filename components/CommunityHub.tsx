
import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  getGlobalLeaderboard, 
  getCommunityScenarios, 
  LeaderboardEntry, 
  shareScenarioToCommunity,
  toggleScenarioLike,
  incrementScenarioDownload,
  CommunityScenario,
  isFirebaseConfigured
} from '../utils/firebase';
import { Scenario, UserProfile, Language } from '../types';
import { getCustomScenarios, saveCustomScenario } from '../utils/storage';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

interface CommunityHubProps {
  user: User | null;
  userProfile?: UserProfile;
  onClose: () => void;
  onImportScenario: (s: Scenario) => void;
  lang: Language;
}

const CommunityHub: React.FC<CommunityHubProps> = ({ user, userProfile, onClose, onImportScenario, lang }) => {
  const t = translations[lang].communityHub;
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'scenarios' | 'share'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityScenarios, setCommunityScenarios] = useState<CommunityScenario[]>([]);
  const [localScenarios, setLocalScenarios] = useState<Scenario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      loadLeaderboard();
    } else if (activeTab === 'scenarios') {
      loadCommunityScenarios();
    } else if (activeTab === 'share') {
      setLocalScenarios(getCustomScenarios());
    }
  }, [activeTab]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    const data = await getGlobalLeaderboard();
    setLeaderboard(data);
    setIsLoading(false);
  };

  const loadCommunityScenarios = async () => {
    setIsLoading(true);
    const data = await getCommunityScenarios(50);
    setCommunityScenarios(data);
    setIsLoading(false);
  };

  const handleShare = async (scenario: Scenario) => {
    if (!user) {
       setError(t.loginToShare);
       return;
    }
    playSfx('click');
    try {
      await shareScenarioToCommunity(user, scenario);
      playSfx('success');
      setActiveTab('scenarios');
      loadCommunityScenarios();
    } catch (e) {
      setError("Failed to share. " + e);
      playSfx('failure');
    }
  };
  
  const handleImport = async (scenario: CommunityScenario) => {
     playSfx('success');
     saveCustomScenario(scenario);
     if (scenario.id && isFirebaseConfigured) {
        incrementScenarioDownload(scenario.id);
     }
     onImportScenario(scenario);
  };

  const handleLike = async (scenario: CommunityScenario) => {
    if (!user) {
       setError(t.loginToLike);
       return;
    }
    
    const isLiked = scenario.likedBy?.includes(user.uid) || false;
    const updatedScenarios = communityScenarios.map(s => {
       if (s.id === scenario.id) {
          return {
             ...s,
             likes: s.likes + (isLiked ? -1 : 1),
             likedBy: isLiked ? s.likedBy?.filter(uid => uid !== user.uid) : [...(s.likedBy || []), user.uid]
          };
       }
       return s;
    });
    setCommunityScenarios(updatedScenarios);
    playSfx('click');

    try {
       await toggleScenarioLike(user, scenario.id, isLiked);
    } catch(e) {
       console.error("Like failed", e);
    }
  };

  const sortedScenarios = [...communityScenarios].sort((a, b) => {
     if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
     return 0; 
  });

  if (!isFirebaseConfigured) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl animate-fade-in p-6">
         <div className="glass-card border-os-red/30 p-12 rounded-sm max-w-md text-center relative overflow-hidden">
            <div className="scan-overlay opacity-5"></div>
            <div className="text-6xl mb-6">📡</div>
            <h2 className="text-3xl font-black text-os-red mb-4 uppercase italic tracking-tighter transform -skew-x-12">Offline_Mode</h2>
            <p className="text-gray-500 text-[11px] font-black uppercase tracking-widest leading-relaxed mb-10">Global Hub requires active cloud synchronization. Check your neural uplink.</p>
            <button onClick={onClose} className="w-full py-4 bg-navy-900 border border-white/10 rounded-sm skew-btn text-[10px] font-black uppercase tracking-[0.4em] hover:bg-os-accent hover:text-white transition-all">
               <span>Terminate</span>
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy-950/95 backdrop-blur-3xl animate-fade-in p-8 overflow-hidden">
      <div className="w-full max-w-6xl bg-navy-900 border border-white/5 rounded-sm shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-10 border-b border-white/5 bg-navy-900 flex justify-between items-center shrink-0 relative">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-os-accent via-transparent to-transparent"></div>
           <div className="flex items-center gap-10">
              <div className="bg-os-accent w-16 h-16 rounded-sm flex items-center justify-center text-3xl shadow-[0_0_25px_#6366f1] transform -skew-x-12">
                 <span className="transform skew-x-12">🌐</span>
              </div>
              <div>
                 <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter transform -skew-x-12 leading-none mb-2">{t.title}</h2>
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em] font-mono">Neural_Network_Intercepts_Active</p>
              </div>
           </div>
           
           <div className="flex bg-navy-950 rounded-sm p-1 border border-white/5">
             <button 
               onClick={() => { playSfx('click'); setActiveTab('leaderboard'); }}
               className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all skew-btn ${activeTab === 'leaderboard' ? 'bg-os-accent text-white shadow-lg shadow-os-accent/20' : 'text-gray-600 hover:text-gray-300'}`}
             >
               <span>{t.leaderboard}</span>
             </button>
             <button 
               onClick={() => { playSfx('click'); setActiveTab('scenarios'); }}
               className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all skew-btn ${activeTab === 'scenarios' ? 'bg-os-accent text-white shadow-lg shadow-os-accent/20' : 'text-gray-600 hover:text-gray-300'}`}
             >
               <span>{t.scenarios}</span>
             </button>
             <button 
               onClick={() => { playSfx('click'); setActiveTab('share'); }}
               className={`px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all skew-btn ${activeTab === 'share' ? 'bg-os-accent text-white shadow-lg shadow-os-accent/20' : 'text-gray-600 hover:text-gray-300'}`}
             >
               <span>{t.share}</span>
             </button>
           </div>
           
           <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors group">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] mr-4 opacity-0 group-hover:opacity-100 transition-opacity">Abort_Intercept</span>
              <span className="text-2xl">✕</span>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-12 bg-navy-900 custom-scrollbar relative">
           <div className="scan-overlay opacity-5"></div>
           
           {isLoading && (
              <div className="flex flex-col items-center justify-center py-40 gap-8">
                 <div className="w-16 h-16 border-4 border-os-accent border-t-transparent rounded-full animate-spin"></div>
                 <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.6em] animate-pulse">Syncing_Global_Data...</span>
              </div>
           )}

           {error && (
              <div className="bg-os-red/5 border border-os-red/20 text-os-red p-8 rounded-sm mb-10 text-[11px] font-black uppercase tracking-widest animate-flicker">
                 ⚠️ CRITICAL_ERROR: {error}
              </div>
           )}

           {/* LEADERBOARD TAB */}
           {!isLoading && activeTab === 'leaderboard' && (
              <div className="space-y-4">
                 <div className="grid grid-cols-12 gap-8 px-8 py-4 text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] border-b border-white/5 font-mono">
                    <div className="col-span-1 text-center">{t.rank}</div>
                    <div className="col-span-5">{t.player}</div>
                    <div className="col-span-2 text-center">LEVEL</div>
                    <div className="col-span-2 text-center">XP</div>
                    <div className="col-span-2 text-center">OPS_CLEAR</div>
                 </div>

                 {leaderboard.length === 0 ? (
                    <div className="text-center py-40 text-gray-700 italic font-black uppercase tracking-widest">Global database empty.</div>
                 ) : (
                    leaderboard.map((entry, i) => (
                       <div 
                         key={entry.uid}
                         className={`
                           grid grid-cols-12 gap-8 px-8 py-6 rounded-sm items-center border transition-all group
                           ${entry.uid === user?.uid 
                             ? 'bg-os-accent/5 border-os-accent/30 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                             : 'bg-navy-950/40 border-white/5 hover:border-white/10'}
                         `}
                       >
                          <div className="col-span-1 text-center font-black text-2xl text-gray-800 italic group-hover:text-os-accent transition-colors">
                             {i + 1}
                          </div>
                          <div className="col-span-5 flex items-center gap-6">
                             <div className="w-12 h-12 rounded-sm bg-navy-900 border border-white/10 overflow-hidden shrink-0 relative transform -skew-x-6">
                                {entry.photoURL ? (
                                   <img src={entry.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center text-xs font-black italic">{entry.displayName?.[0]}</div>
                                )}
                                <div className="scan-overlay opacity-10"></div>
                             </div>
                             <div>
                                <div className={`font-black text-lg italic uppercase tracking-tight transform -skew-x-6 ${entry.uid === user?.uid ? 'text-os-accent' : 'text-white'}`}>
                                   {entry.displayName || 'Anonymous_Node'}
                                </div>
                                <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">{entry.title}</div>
                             </div>
                          </div>
                          <div className="col-span-2 text-center text-lg font-black font-mono text-white italic transform -skew-x-6">
                             {entry.level}
                          </div>
                          <div className="col-span-2 text-center text-lg font-black font-mono text-os-orange italic transform -skew-x-6">
                             {entry.xp.toLocaleString()}
                          </div>
                          <div className="col-span-2 text-center text-lg font-black font-mono text-os-emerald italic transform -skew-x-6">
                             {entry.battlesWon}
                          </div>
                       </div>
                    ))
                 )}
              </div>
           )}

           {/* SCENARIOS TAB */}
           {!isLoading && activeTab === 'scenarios' && (
              <>
                <div className="flex justify-end mb-10">
                   <div className="text-[10px] flex bg-navy-950 rounded-sm p-1 border border-white/5 font-black uppercase tracking-widest">
                      <button 
                         onClick={() => setSortBy('newest')}
                         className={`px-6 py-2 rounded-sm transition-all skew-btn ${sortBy === 'newest' ? 'bg-os-accent text-white shadow-lg' : 'text-gray-600 hover:text-gray-300'}`}
                      >
                         <span>{t.newest}</span>
                      </button>
                      <button 
                         onClick={() => setSortBy('popular')}
                         className={`px-6 py-2 rounded-sm transition-all skew-btn ${sortBy === 'popular' ? 'bg-os-accent text-white shadow-lg' : 'text-gray-600 hover:text-gray-300'}`}
                      >
                         <span>{t.popular}</span>
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {sortedScenarios.length === 0 ? (
                      <div className="col-span-2 text-center py-40 text-gray-700 italic font-black uppercase tracking-widest">No shared nodes found.</div>
                   ) : (
                      sortedScenarios.map((scenario) => {
                         const isLiked = user ? (scenario.likedBy?.includes(user.uid)) : false;
                         
                         return (
                           <div key={scenario.id} className="glass-card border-white/5 rounded-sm p-10 hover:border-os-accent/30 transition-all group relative overflow-hidden flex flex-col min-h-[300px]">
                              <div className="absolute top-0 right-0 p-8 opacity-5 text-7xl font-black italic transform group-hover:scale-110 group-hover:rotate-6 transition-transform pointer-events-none">NODE</div>
                              <div className="scan-overlay opacity-5"></div>
                              
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <h3 className="font-black text-white text-3xl italic uppercase tracking-tighter transform -skew-x-12 group-hover:text-os-accent transition-colors leading-none">{scenario.name}</h3>
                                   <div className="flex items-center gap-3 mt-4">
                                      <div className="w-1.5 h-1.5 bg-os-accent rounded-full animate-pulse"></div>
                                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                         Origin: {scenario.authorName || 'Unknown_Node'}
                                      </span>
                                   </div>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleLike(scenario); }}
                                   className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-sm transition-all border transform -skew-x-6 ${isLiked ? 'text-white border-os-red bg-os-red/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'text-gray-500 border-white/10 hover:bg-white/5'}`}
                                 >
                                    <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : 'none'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    <span>{scenario.likes || 0}</span>
                                 </button>
                              </div>
                              
                              <p className="text-gray-400 text-xs font-bold italic uppercase leading-relaxed tracking-tight line-clamp-2 mb-8">{scenario.description}</p>
                              
                              <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                                 <div className="flex gap-3">
                                    <span className="text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-sm text-gray-600 font-black uppercase italic transform -skew-x-12">{scenario.difficulty}</span>
                                    <span className="text-[9px] bg-white/5 border border-white/10 px-3 py-1 rounded-sm text-gray-600 font-black uppercase italic transform -skew-x-12">{scenario.durationMinutes}M</span>
                                    <span className="text-[9px] font-mono text-os-accent font-black uppercase italic ml-2">⬇ {scenario.downloads || 0}</span>
                                 </div>
                                 <button 
                                   onClick={() => handleImport(scenario)}
                                   className="bg-os-accent text-white px-10 py-3 rounded-sm font-black uppercase italic tracking-[0.4em] transform -skew-x-12 hover:brightness-125 transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)] text-[11px]"
                                 >
                                   <span>Deploy</span>
                                 </button>
                              </div>
                           </div>
                         );
                      })
                   )}
                </div>
              </>
           )}

           {/* SHARE TAB */}
           {!isLoading && activeTab === 'share' && (
              <div className="space-y-12">
                 <div className="glass-card border-os-accent/30 p-10 rounded-sm bg-os-accent/5 relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-4">
                       <span className="text-3xl">📡</span>
                       <p className="text-os-accent text-[11px] font-black uppercase tracking-widest leading-relaxed italic">
                          {t.shareDesc}
                       </p>
                    </div>
                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-9xl font-black italic">SYNC</div>
                 </div>
                 
                 <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-gray-600 uppercase tracking-[0.5em] font-mono flex items-center gap-4">
                       <span className="w-2 h-2 bg-gray-700 rounded-full"></span> {t.yourScenarios}
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                       {localScenarios.length === 0 ? (
                          <div className="text-center py-20 bg-navy-950/40 border border-dashed border-white/10 rounded-sm italic text-gray-700 font-black uppercase tracking-widest">
                             {t.noScenarios}
                          </div>
                       ) : (
                          localScenarios.map(scenario => (
                             <div key={scenario.id} className="flex items-center justify-between glass-card p-10 rounded-sm border-white/5 hover:border-os-accent/30 transition-all group">
                                <div>
                                   <h4 className="font-black text-white text-2xl italic uppercase tracking-tighter transform -skew-x-6 group-hover:text-os-accent transition-colors">{scenario.name}</h4>
                                   <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-2 italic">{scenario.description.substring(0, 100)}...</p>
                                </div>
                                <button 
                                  onClick={() => handleShare(scenario)}
                                  className="text-[10px] font-black uppercase tracking-[0.4em] bg-os-accent/10 border border-os-accent/30 text-os-accent px-10 py-4 rounded-sm hover:bg-os-accent hover:text-white transition-all transform -skew-x-12 shadow-lg"
                                >
                                   <span>{t.share}</span>
                                </button>
                             </div>
                          ))
                       )}
                    </div>
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
