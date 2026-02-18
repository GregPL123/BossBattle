
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
  
  // Scenarios Sorting
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
    const data = await getCommunityScenarios(50); // Get more to allow local sorting
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
      loadCommunityScenarios(); // Refresh
    } catch (e) {
      setError("Failed to share. " + e);
      playSfx('failure');
    }
  };
  
  const handleImport = async (scenario: CommunityScenario) => {
     playSfx('success');
     saveCustomScenario(scenario);
     if (scenario.id && isFirebaseConfigured) {
        // Track download (fire and forget)
        incrementScenarioDownload(scenario.id);
     }
     onImportScenario(scenario);
  };

  const handleLike = async (scenario: CommunityScenario) => {
    if (!user) {
       setError(t.loginToLike);
       return;
    }
    
    // Optimistic UI Update
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in">
         <div className="bg-gray-900 border border-red-900/50 p-8 rounded-2xl max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">{t.offline}</h2>
            <p className="text-gray-400 mb-6">{t.offlineDesc}</p>
            <button onClick={onClose} className="px-6 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">{translations[lang].done}</button>
         </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-4xl bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center shrink-0">
           <div className="flex items-center gap-4">
              <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/20">
                 🌐
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white">{t.title}</h2>
                 <p className="text-xs text-gray-400">{t.subtitle}</p>
              </div>
           </div>
           
           <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
             <button 
               onClick={() => { playSfx('click'); setActiveTab('leaderboard'); }}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
             >
               {t.leaderboard}
             </button>
             <button 
               onClick={() => { playSfx('click'); setActiveTab('scenarios'); }}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'scenarios' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
             >
               {t.scenarios}
             </button>
             <button 
               onClick={() => { playSfx('click'); setActiveTab('share'); }}
               className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'share' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
             >
               {t.share}
             </button>
           </div>
           
           <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-950 to-gray-900 custom-scrollbar">
           
           {isLoading && (
              <div className="flex justify-center py-20">
                 <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
           )}

           {error && (
              <div className="bg-red-900/20 border border-red-500/30 text-red-200 p-4 rounded-xl mb-4 text-sm">
                 {error}
              </div>
           )}

           {/* LEADERBOARD TAB */}
           {!isLoading && activeTab === 'leaderboard' && (
              <div className="space-y-2">
                 {/* Header Row */}
                 <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1 text-center">{t.rank}</div>
                    <div className="col-span-5">{t.player}</div>
                    <div className="col-span-2 text-center">Level</div>
                    <div className="col-span-2 text-center">XP</div>
                    <div className="col-span-2 text-center">Wins</div>
                 </div>

                 {leaderboard.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">No data available yet. Be the first!</div>
                 ) : (
                    leaderboard.map((entry, i) => (
                       <div 
                         key={entry.uid}
                         className={`
                           grid grid-cols-12 gap-4 px-4 py-3 rounded-xl items-center border
                           ${entry.uid === user?.uid 
                             ? 'bg-blue-900/20 border-blue-500/30 shadow-lg shadow-blue-900/10' 
                             : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800'}
                         `}
                       >
                          <div className="col-span-1 text-center font-black text-lg text-gray-600">
                             {i + 1}
                          </div>
                          <div className="col-span-5 flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-gray-700">
                                {entry.photoURL ? (
                                   <img src={entry.photoURL} alt="" className="w-full h-full object-cover" />
                                ) : (
                                   <div className="w-full h-full flex items-center justify-center text-xs font-bold">{entry.displayName?.[0]}</div>
                                )}
                             </div>
                             <div>
                                <div className={`font-bold text-sm ${entry.uid === user?.uid ? 'text-blue-300' : 'text-gray-200'}`}>
                                   {entry.displayName || 'Anonymous'}
                                </div>
                                <div className="text-[10px] text-gray-500">{entry.title}</div>
                             </div>
                          </div>
                          <div className="col-span-2 text-center text-sm font-mono text-gray-300">
                             {entry.level}
                          </div>
                          <div className="col-span-2 text-center text-sm font-mono text-yellow-500">
                             {entry.xp.toLocaleString()}
                          </div>
                          <div className="col-span-2 text-center text-sm font-mono text-green-500">
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
                <div className="flex justify-end mb-4">
                   <div className="text-xs flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                      <button 
                         onClick={() => setSortBy('newest')}
                         className={`px-3 py-1 rounded transition-colors ${sortBy === 'newest' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                         {t.newest}
                      </button>
                      <button 
                         onClick={() => setSortBy('popular')}
                         className={`px-3 py-1 rounded transition-colors ${sortBy === 'popular' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                         {t.popular}
                      </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {sortedScenarios.length === 0 ? (
                      <div className="col-span-2 text-center py-20 text-gray-500">No shared scenarios yet. Share yours!</div>
                   ) : (
                      sortedScenarios.map((scenario) => {
                         const isLiked = user ? (scenario.likedBy?.includes(user.uid)) : false;
                         
                         return (
                           <div key={scenario.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all group relative">
                              <div className="flex justify-between items-start mb-3">
                                 <div>
                                   <h3 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">{scenario.name}</h3>
                                   <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded mt-1 inline-block">
                                      by {scenario.authorName || 'Unknown'}
                                   </span>
                                 </div>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); handleLike(scenario); }}
                                   className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors border ${isLiked ? 'text-pink-500 border-pink-500/30 bg-pink-500/10' : 'text-gray-500 border-gray-700 hover:bg-gray-800'}`}
                                 >
                                    <svg className={`w-4 h-4 ${isLiked ? 'fill-current' : 'none'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    {scenario.likes || 0}
                                 </button>
                              </div>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{scenario.description}</p>
                              <div className="flex items-center justify-between mt-auto">
                                 <div className="flex gap-2">
                                    <span className="text-xs border border-gray-700 px-2 py-1 rounded text-gray-500">{scenario.difficulty}</span>
                                    <span className="text-xs border border-gray-700 px-2 py-1 rounded text-gray-500">{scenario.durationMinutes}m</span>
                                    <span className="text-xs border border-gray-700 px-2 py-1 rounded text-gray-500 flex items-center gap-1">
                                       ⬇️ {scenario.downloads || 0}
                                    </span>
                                 </div>
                                 <button 
                                   onClick={() => handleImport(scenario)}
                                   className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-lg shadow-blue-900/20"
                                 >
                                   {t.importPlay}
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
              <div className="space-y-4">
                 <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl mb-6">
                    <p className="text-indigo-200 text-sm">
                       {t.shareDesc}
                    </p>
                 </div>
                 
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">{t.yourScenarios}</h3>
                 <div className="grid grid-cols-1 gap-3">
                    {localScenarios.length === 0 ? (
                       <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl text-gray-500">
                          {t.noScenarios}
                       </div>
                    ) : (
                       localScenarios.map(scenario => (
                          <div key={scenario.id} className="flex items-center justify-between bg-gray-900 p-4 rounded-xl border border-gray-800">
                             <div>
                                <h4 className="font-bold text-gray-200">{scenario.name}</h4>
                                <p className="text-xs text-gray-500">{scenario.description.substring(0, 60)}...</p>
                             </div>
                             <button 
                               onClick={() => handleShare(scenario)}
                               className="text-xs border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-lg transition-all"
                             >
                                {t.share}
                             </button>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default CommunityHub;
