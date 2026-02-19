
import React, { useState } from 'react';
import { UserProfile, Language, BossRelation } from '../types';
import { translations } from '../translations';
import { getArchetype } from '../utils/gamification';
import SkillTree from './SkillTree';
import { unlockSkill } from '../utils/storage';
import { playSfx } from '../utils/sound';

const ProfileModal: React.FC<{ userProfile: UserProfile, onClose: () => void, lang: Language }> = ({ userProfile: initialProfile, onClose, lang }) => {
  const t = translations[lang];
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  const [tab, setTab] = useState('dossier');
  const archetype = getArchetype(userProfile.globalTraits);

  const handleUnlockSkill = (id: string) => {
    const updated = unlockSkill(id);
    setUserProfile({ ...updated });
    playSfx('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/95 p-6 backdrop-blur-xl">
      <div className="w-full max-w-5xl bg-navy-900 border border-white/5 rounded-sm overflow-hidden flex flex-col h-[90vh] shadow-[0_0_60px_rgba(0,0,0,0.8)]">
        
        {/* Dossier Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-navy-900 relative">
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-os-accent to-transparent"></div>
           <div>
              <div className="flex items-center gap-4 mb-3">
                 <div className="w-3 h-3 bg-os-accent rounded-sm animate-pulse"></div>
                 <span className="text-[10px] font-mono font-black text-gray-500 uppercase tracking-[0.6em]">Personnel_Record_v6.0</span>
              </div>
              <h2 className="text-5xl font-black text-white italic transform -skew-x-12 tracking-tighter uppercase leading-none">
                 Service <span className="text-os-accent">Record</span>: {userProfile.title}
              </h2>
           </div>
           <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors group">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] mr-4 opacity-50 group-hover:opacity-100 transition-opacity">Abort_Dossier_View</span>
              <span className="text-2xl">✕</span>
           </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-navy-950 p-2 mx-10 mt-10 rounded-sm gap-2 border border-white/5 shrink-0">
           <button onClick={() => setTab('dossier')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm skew-btn transition-all ${tab === 'dossier' ? 'bg-os-accent text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}>
              <span>Personnel Dossier</span>
           </button>
           <button onClick={() => setTab('skills')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm skew-btn transition-all ${tab === 'skills' ? 'bg-os-accent text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}>
              <span>Neural Upgrade Matrix</span>
           </button>
           <button onClick={() => setTab('history')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.4em] rounded-sm skew-btn transition-all ${tab === 'history' ? 'bg-os-accent text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}>
              <span>Target Node Intel</span>
           </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar pr-12">
          {tab === 'dossier' && (
             <div className="animate-fade-in space-y-16">
                <div className="flex flex-col lg:flex-row gap-12 items-center glass-card p-10 rounded-sm border-white/5 border-l-4 border-l-os-accent relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[200px] pointer-events-none transform rotate-12">{archetype.icon}</div>
                   
                   <div className="relative">
                      <div className="w-40 h-40 bg-navy-950 border-2 border-white/10 p-2 rounded-sm transform -skew-x-6 relative z-10">
                         <div className="text-8xl w-full h-full flex items-center justify-center filter drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            {archetype.icon}
                         </div>
                         <div className="scan-overlay"></div>
                      </div>
                      <div className="absolute -bottom-4 -right-4 bg-os-accent text-white px-4 py-1 rounded-sm text-[10px] font-black uppercase skew-btn italic shadow-lg z-20">Verified</div>
                   </div>

                   <div className="flex-1 text-center lg:text-left space-y-4">
                      <span className="text-[10px] font-black text-os-accent uppercase tracking-[0.6em] font-mono block">Analyzed_Tactical_Archetype</span>
                      <h3 className="text-7xl font-black text-white italic transform -skew-x-12 mb-4 tracking-tighter leading-none">{archetype.name}</h3>
                      <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                         {userProfile.globalTraits.map(t => (
                            <span key={t} className="px-5 py-2 bg-white/5 border border-white/10 text-gray-400 text-[9px] font-black rounded-sm uppercase tracking-widest italic transform -skew-x-12">#{t}</span>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="glass-card p-8 rounded-sm border-white/5 border-b-4 border-b-os-accent relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-os-accent opacity-20"></div>
                      <div className="text-6xl font-black text-white italic tracking-tighter transform -skew-x-12 mb-2">{userProfile.level.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">Clearance_Level</div>
                   </div>
                   <div className="glass-card p-8 rounded-sm border-white/5 border-b-4 border-b-os-emerald relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-os-emerald opacity-20"></div>
                      <div className="text-6xl font-black text-os-emerald italic tracking-tighter transform -skew-x-12 mb-2">{userProfile.battlesWon.toString().padStart(2, '0')}</div>
                      <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">Operations_Cleared</div>
                   </div>
                   <div className="glass-card p-8 rounded-sm border-white/5 border-b-4 border-b-os-blue relative group overflow-hidden">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-os-blue opacity-20"></div>
                      <div className="text-6xl font-black text-os-blue italic tracking-tighter transform -skew-x-12 mb-2">{userProfile.currentStreak}d</div>
                      <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">Neural_Sync_Streak</div>
                   </div>
                </div>

                {/* Training Focus Section */}
                <div className="space-y-8">
                   <div className="flex items-center gap-6">
                      <span className="text-[11px] font-black text-os-red uppercase tracking-[0.6em] font-mono whitespace-nowrap">Detected_Neural_Frictions</span>
                      <div className="h-[1px] w-full bg-white/5"></div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfile.userPatterns?.length ? userProfile.userPatterns.map((pattern, i) => (
                        <div key={i} className="glass-card bg-os-red/5 border border-os-red/20 p-8 rounded-sm group relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10 transform scale-150 rotate-12 group-hover:rotate-45 transition-transform">⚠️</div>
                           <div className="flex justify-between items-start mb-6">
                              <span className="text-2xl">📉</span>
                              <span className="text-os-red text-[8px] font-black uppercase border border-os-red/30 px-3 py-1 rounded-sm italic">Pattern_Alert</span>
                           </div>
                           <p className="text-white text-sm font-black italic leading-relaxed uppercase tracking-tight">{pattern}</p>
                        </div>
                      )) : (
                        <div className="col-span-2 text-center py-20 bg-navy-950/50 rounded-sm border border-dashed border-white/5 italic text-gray-700 font-black uppercase tracking-widest">
                           Signal integration stable. No recurring frictions detected.
                        </div>
                      )}
                   </div>
                </div>
             </div>
          )}

          {tab === 'skills' && (
             <SkillTree userProfile={userProfile} onUnlock={handleUnlockSkill} lang={lang} />
          )}

          {tab === 'history' && (
             <div className="animate-fade-in space-y-8">
                {Object.entries(userProfile.bossMemories).length === 0 ? (
                   <p className="text-center py-40 text-gray-700 italic font-black uppercase tracking-[0.5em]">No target dossiers initialized.</p>
                ) : (
                   Object.entries(userProfile.bossMemories).map(([id, rel]) => {
                      const relation = rel as BossRelation;
                      return (
                         <div key={id} className="glass-card p-10 rounded-sm border border-white/5 flex flex-col md:flex-row gap-12 relative overflow-hidden group hover:border-os-accent/30 transition-all shadow-2xl">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-[150px] transform group-hover:scale-110 group-hover:rotate-12 transition-transform pointer-events-none italic font-black">NODE</div>
                            
                            <div className="flex-1 space-y-6 relative z-10">
                               <div className="flex flex-wrap items-center gap-6">
                                  <h4 className="font-black text-white italic uppercase text-3xl tracking-tighter transform -skew-x-12">{id.replace('-', ' ')}</h4>
                                  <div className="px-4 py-1.5 bg-os-accent/10 text-os-accent border border-os-accent/30 text-[9px] font-black uppercase rounded-sm skew-btn italic">Intel Gain: {relation.discoveredWeaknesses?.length || 0}</div>
                               </div>
                               
                               <div className="bg-navy-950/80 p-8 rounded-sm border border-white/5 border-l-4 border-l-os-accent shadow-inner">
                                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-3 block font-mono">NEURAL_DEBRIEF_SUMMARY</span>
                                  <p className="text-gray-400 text-xs italic font-bold uppercase tracking-tight leading-relaxed">"{relation.memory}"</p>
                               </div>
                               
                               {relation.discoveredWeaknesses && relation.discoveredWeaknesses.length > 0 && (
                                 <div className="flex flex-wrap gap-3">
                                    {relation.discoveredWeaknesses.map((weak, i) => (
                                       <span key={i} className="text-[9px] font-black uppercase tracking-widest text-os-red bg-os-red/10 border border-os-red/20 px-4 py-2 rounded-sm flex items-center gap-3 italic transform -skew-x-12">
                                          <span className="w-1.5 h-1.5 bg-os-red rounded-full animate-pulse"></span> {weak}
                                       </span>
                                    ))}
                                 </div>
                               )}
                            </div>
                            
                            <div className="w-full md:w-56 flex flex-col items-center justify-center gap-4 border-l border-white/5 pl-10 shrink-0 relative z-10">
                               <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em] font-mono">Psych_Impact</span>
                               <div className="text-6xl font-black text-white italic transform -skew-x-12 tracking-tighter">{relation.reputation}</div>
                               <div className="w-full h-1.5 bg-navy-950 border border-white/5 rounded-full overflow-hidden p-[1px]">
                                  <div className={`h-full transition-all duration-1000 shadow-[0_0_10px_currentColor] ${relation.reputation > 0 ? 'bg-os-emerald text-os-emerald' : 'bg-os-red text-os-red'}`} style={{ width: `${(relation.reputation + 100) / 2}%` }}></div>
                               </div>
                               <div className="text-[9px] text-gray-700 font-black uppercase tracking-widest mt-2 italic">Max Stage: {relation.highestStage}</div>
                            </div>
                         </div>
                      );
                   })
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
