
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, Language } from '../types';
import { syncProfileToCloud, isFirebaseConfigured } from '../utils/firebase';
import { XP_PER_LEVEL, SKILL_TREE, TITLES } from '../utils/gamification';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';
import SkillTree from './SkillTree';

interface ProfileModalProps {
  user: User | null;
  userProfile: UserProfile | undefined;
  onClose: () => void;
  onUpdateProfile: (newProfile: UserProfile) => void;
  lang: Language;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, userProfile, onClose, onUpdateProfile, lang }) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'titles'>('stats');

  if (!userProfile) return null;
  const progressPercent = Math.min(100, ((userProfile.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const handleUnlockSkill = (skillId: string) => {
    const updatedProfile = { ...userProfile };
    const skill = updatedProfile.skills.find(s => s === skillId);
    const skillData = SKILL_TREE.find((s) => s.id === skillId);

    if (!skill && skillData && updatedProfile.skillPoints >= skillData.cost) {
      updatedProfile.skillPoints -= skillData.cost;
      updatedProfile.skills.push(skillId);
      onUpdateProfile(updatedProfile);
      localStorage.setItem('boss_battle_profile', JSON.stringify(updatedProfile));
      if (user) syncProfileToCloud(user, updatedProfile);
    }
  };

  const handleSetTitle = (title: string) => {
    const updatedProfile = { ...userProfile, activeTitle: title };
    onUpdateProfile(updatedProfile);
    localStorage.setItem('boss_battle_profile', JSON.stringify(updatedProfile));
    if (user) syncProfileToCloud(user, updatedProfile);
    playSfx('click');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="relative h-32 bg-gradient-to-r from-blue-900 to-indigo-900">
           <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-20">✕</button>
           <div className="absolute -bottom-12 left-8 flex items-end gap-4 z-10">
              <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${userProfile.avatarSeed || 'user'}&backgroundColor=1f2937`} className="w-24 h-24 rounded-[2rem] border-4 border-gray-900 bg-gray-800 shadow-xl" />
              <div className="pb-2">
                <h2 className="text-2xl font-black text-white italic transform -skew-x-6">{user?.displayName || 'User'}</h2>
                <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">{userProfile.activeTitle || userProfile.title}</p>
              </div>
           </div>
        </div>
        
        <div className="pt-16 p-8">
           <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 mb-8 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => { playSfx('click'); setActiveTab('stats'); }}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'stats' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Statistics
              </button>
              <button 
                onClick={() => { playSfx('click'); setActiveTab('skills'); }}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'skills' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Skill Tree
              </button>
              <button 
                onClick={() => { playSfx('click'); setActiveTab('titles'); }}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'titles' ? 'bg-gray-800 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Titles
              </button>
           </div>

           <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
             {activeTab === 'stats' && (
               <div className="animate-fade-in">
                  <div className="grid grid-cols-3 gap-4 mb-8">
                     <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><div className="text-3xl font-black text-white italic">{userProfile.level}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Level</div></div>
                     <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><div className="text-3xl font-black text-green-500 italic">{userProfile.battlesWon}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Wins</div></div>
                     <div className="bg-gray-950 p-4 rounded-2xl border border-gray-800 text-center"><div className="text-3xl font-black text-yellow-500 italic">{userProfile.xp}</div><div className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">Total XP</div></div>
                  </div>
                  <div className="mb-8">
                    <div className="flex justify-between text-[10px] font-black text-gray-500 mb-2 uppercase tracking-widest">
                      <span>{t.levelProgress}</span>
                      <span className="text-white">{userProfile.xp % XP_PER_LEVEL} / {XP_PER_LEVEL} XP</span>
                    </div>
                    <div className="h-3 bg-gray-950 rounded-full border border-gray-800 overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-gray-950/50 p-4 rounded-2xl border border-gray-800">
                     <div className="text-2xl">🔥</div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase tracking-widest">Conversation Streak</p>
                        <p className="text-[10px] text-gray-500 uppercase">You have practiced {userProfile.currentStreak} days in a row.</p>
                     </div>
                     <div className="text-xl font-black text-orange-500">{userProfile.currentStreak}x</div>
                  </div>
               </div>
             )}

             {activeTab === 'skills' && (
               <SkillTree userProfile={userProfile} onUnlock={handleUnlockSkill} lang={lang} />
             )}

             {activeTab === 'titles' && (
               <div className="grid grid-cols-2 gap-3 animate-fade-in">
                 {TITLES.map((title, i) => {
                   const unlocked = userProfile.level > i;
                   const active = userProfile.activeTitle === title || (!userProfile.activeTitle && userProfile.title === title);
                   return (
                     <button
                       key={title}
                       disabled={!unlocked}
                       onClick={() => handleSetTitle(title)}
                       className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${unlocked ? (active ? 'bg-blue-600 border-blue-400 shadow-lg scale-[1.02]' : 'bg-gray-950 border-gray-800 hover:border-blue-500') : 'opacity-30 grayscale cursor-not-allowed border-gray-900'}`}
                     >
                       <div className="flex flex-col">
                         <span className={`text-[10px] font-black uppercase ${active ? 'text-white' : 'text-gray-400'}`}>Rank {i+1}</span>
                         <span className={`text-xs font-bold ${active ? 'text-white' : 'text-gray-200'}`}>{title}</span>
                       </div>
                       {active && <span className="text-white">✓</span>}
                       {!unlocked && <span className="text-xs">🔒</span>}
                     </button>
                   );
                 })}
               </div>
             )}
           </div>

           <div className="flex justify-end pt-8 mt-8 border-t border-gray-800">
             <button 
               onClick={onClose} 
               className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
             >
               {t.done}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
