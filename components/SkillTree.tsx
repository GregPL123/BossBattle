
import React from 'react';
import { SKILL_TREE } from '../utils/gamification';
import { UserProfile, Language } from '../types';
import { playSfx } from '../utils/sound';

interface SkillTreeProps {
  userProfile: UserProfile;
  onUnlock: (skillId: string) => void;
  lang: Language;
}

const SkillTree: React.FC<SkillTreeProps> = ({ userProfile, onUnlock, lang }) => {
  const isUnlocked = (id: string) => userProfile.skills.includes(id);
  const canAfford = (cost: number) => userProfile.skillPoints >= cost;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6 bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl">
        <div>
          <h3 className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">Available Skill Points</h3>
          <p className="text-2xl font-black text-white">{userProfile.skillPoints}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Earn 1 SP every level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SKILL_TREE.map((skill) => {
          const unlocked = isUnlocked(skill.id);
          const affordable = canAfford(skill.cost);

          return (
            <div 
              key={skill.id}
              className={`
                relative p-5 rounded-[1.5rem] border transition-all flex items-center gap-5
                ${unlocked ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-gray-950/50 border-gray-800'}
              `}
            >
              <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0
                ${unlocked ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-800 text-gray-500'}
              `}>
                {skill.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                   <h4 className={`font-black uppercase text-sm italic transform -skew-x-6 ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                     {skill.name}
                   </h4>
                   {!unlocked && <span className="text-[10px] font-black text-gray-600 bg-gray-900 px-2 py-0.5 rounded uppercase">{skill.cost} SP</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-tight">{skill.description}</p>
                
                {!unlocked && (
                  <button 
                    onClick={() => { playSfx('success'); onUnlock(skill.id); }}
                    disabled={!affordable}
                    className={`
                      mt-3 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
                      ${affordable ? 'bg-white text-black hover:bg-blue-500 hover:text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
                    `}
                  >
                    {affordable ? 'Unlock Skill' : 'Insufficient SP'}
                  </button>
                )}

                {unlocked && (
                   <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Specialization</span>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTree;
