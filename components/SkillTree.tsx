
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
    <div className="space-y-10 animate-fade-in font-sans">
      <div className="flex justify-between items-center glass-card border-os-accent/20 p-8 rounded-sm relative overflow-hidden bg-navy-900/40">
        <div className="absolute top-0 left-0 w-2 h-full bg-os-accent"></div>
        <div className="scan-overlay opacity-5"></div>
        <div>
          <h3 className="text-[11px] font-black text-os-accent uppercase tracking-[0.5em] mb-2 font-mono">Available_Neural_Points</h3>
          <p className="text-7xl font-black text-white italic transform -skew-x-12 tracking-tighter leading-none text-glow-os">{userProfile.skillPoints.toString().padStart(2, '0')}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest leading-relaxed font-mono">
            Accumulate SP via Clearance_Level advancement<br/>
            [1 SP per Decryption level]
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pr-2">
        {SKILL_TREE.map((skill) => {
          const unlocked = isUnlocked(skill.id);
          const affordable = canAfford(skill.cost);

          return (
            <div 
              key={skill.id}
              className={`
                relative p-10 rounded-sm border transition-all flex flex-col gap-6 group overflow-hidden
                ${unlocked ? 'glass-card border-os-accent shadow-[0_0_40px_rgba(99,102,241,0.1)] bg-os-accent/5' : 'bg-navy-950 border-white/5 opacity-40 hover:opacity-100'}
              `}
            >
              <div className="flex items-center gap-8">
                <div className={`
                  w-20 h-20 rounded-sm flex items-center justify-center text-4xl shrink-0 transform -skew-x-6 transition-all duration-500 relative
                  ${unlocked ? 'bg-os-accent text-white shadow-lg shadow-os-accent/50 scale-110' : 'bg-navy-900 text-gray-800 border border-white/5'}
                `}>
                  <span className="transform skew-x-6 z-10">{skill.icon}</span>
                  {unlocked && <div className="scan-overlay"></div>}
                  <div className={`absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${unlocked ? 'hidden' : ''}`}></div>
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                     <h4 className={`text-2xl font-black italic uppercase tracking-tighter transform -skew-x-12 leading-none ${unlocked ? 'text-white text-glow-os' : 'text-gray-600'}`}>
                       {skill.name}
                     </h4>
                     {!unlocked && <span className="text-[10px] font-black text-os-accent bg-os-accent/10 px-3 py-1 rounded-sm skew-btn italic border border-os-accent/20">{skill.cost} SP</span>}
                  </div>
                  <div className="flex items-center gap-2">
                     <div className={`w-1 h-1 rounded-full ${unlocked ? 'bg-os-accent animate-pulse' : 'bg-gray-800'}`}></div>
                     <span className={`text-[9px] font-black uppercase tracking-widest ${unlocked ? 'text-os-accent' : 'text-gray-700'}`}>NODE_ID: {skill.id}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <p className={`text-xs font-bold uppercase tracking-tight leading-relaxed min-h-[40px] ${unlocked ? 'text-gray-300' : 'text-gray-800'}`}>{skill.description}</p>
                
                {!unlocked ? (
                  <button 
                    onClick={() => { playSfx('success'); onUnlock(skill.id); }}
                    disabled={!affordable}
                    className={`
                      w-full py-5 rounded-sm text-[11px] font-black uppercase tracking-[0.5em] skew-btn transition-all relative overflow-hidden group/btn
                      ${affordable ? 'bg-white text-navy-950 hover:bg-os-accent hover:text-white shadow-xl' : 'bg-navy-900 text-gray-800 cursor-not-allowed border border-white/5'}
                    `}
                  >
                    <div className="absolute inset-0 bg-os-accent -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"></div>
                    <span className="relative z-10">{affordable ? 'Initialize_Neural_Link' : 'Insufficient_Access_Points'}</span>
                  </button>
                ) : (
                   <div className="bg-navy-900/60 p-4 rounded-sm border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-os-emerald animate-pulse shadow-[0_0_10px_#10b981]"></div>
                         <span className="text-[10px] text-os-emerald font-black uppercase tracking-[0.4em] italic font-mono">Neural_Synced</span>
                      </div>
                      <span className="text-[8px] font-mono text-gray-700">CORE_MOD_V.2</span>
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
