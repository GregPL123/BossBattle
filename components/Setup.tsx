
import React, { useState, useMemo } from 'react';
import { SCENARIOS } from '../constants';
import { Scenario, UserProfile, Language } from '../types';
import { playSfx } from '../utils/sound';

interface SetupProps {
  onStart: (scenario: Scenario) => void;
  onShowHistory: () => void;
  onShowCustom: () => void;
  isLoading: boolean;
  userProfile?: UserProfile;
  lang: Language;
}

const Setup: React.FC<SetupProps> = ({ onStart, onShowHistory, onShowCustom, isLoading, userProfile, lang }) => {
  const [activeTrack, setActiveTrack] = useState('senior');

  const TRACKS = [
    { id: 'junior', label: 'Emerging Professional', icon: '📊', desc: 'Podstawowe relacje biurowe' },
    { id: 'senior', label: 'Strategic Leadership', icon: '📈', desc: 'Trudne negocjacje dyrektorskie' },
    { id: 'executive', label: 'Boardroom Advisory', icon: '🏛️', desc: 'Scenariusze na poziomie C-level' }
  ];

  const getScenarios = () => {
    if (activeTrack === 'junior') return SCENARIOS.filter(s => ['resignation', 'conflict-res'].includes(s.id));
    if (activeTrack === 'senior') return SCENARIOS.filter(s => ['salary-neg', 'promotion-pitch'].includes(s.id));
    return SCENARIOS.filter(s => ['project-fail', 'polish-boss'].includes(s.id));
  };

  return (
    <div className="min-h-screen bg-navy-950 p-16 flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <header className="flex justify-between items-center mb-24">
           <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-2 h-2 bg-os-primary rounded-full"></div>
                 <span className="text-[10px] font-mono font-bold text-os-slate uppercase tracking-widest">Performance Intelligence v7.5</span>
              </div>
              <h1 className="text-6xl font-extrabold text-white tracking-tight">
                Negotiator<span className="text-os-primary">.Pro</span>
              </h1>
              <p className="text-os-slate mt-2 text-sm font-medium">Advanced Leadership & Communication Simulation</p>
           </div>
           
           <div className="flex gap-4">
              <button onClick={onShowHistory} className="premium-glass px-8 py-3 rounded-md text-xs font-bold uppercase tracking-wider text-os-slate hover:text-white transition-all border border-white/10">
                Performance Archives
              </button>
           </div>
        </header>

        {/* Career Tracks */}
        <div className="flex gap-4 mb-20">
          {TRACKS.map(track => (
            <button 
              key={track.id}
              onClick={() => { playSfx('click'); setActiveTrack(track.id); }}
              className={`
                flex-1 premium-glass p-8 rounded-xl border-2 transition-all duration-300 text-left group
                ${activeTrack === track.id ? 'border-os-primary/50 bg-os-primary/5' : 'border-transparent hover:border-white/10 opacity-70'}
              `}
            >
              <div className="text-3xl mb-4">{track.icon}</div>
              <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{track.label}</h3>
              <p className="text-[10px] text-os-slate font-medium leading-relaxed">{track.desc}</p>
            </button>
          ))}
          <button 
            onClick={() => onShowCustom()}
            className="flex-1 border-2 border-dashed border-white/10 p-8 rounded-xl hover:border-os-primary/50 transition-all text-left"
          >
            <div className="text-3xl mb-4">✍️</div>
            <h3 className="text-sm font-bold text-os-primary mb-1 uppercase tracking-wider">Custom Case</h3>
            <p className="text-[10px] text-os-slate font-medium">Synthesize a specific business brief</p>
          </button>
        </div>

        {/* Case Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {getScenarios().map((scenario) => (
            <div 
              key={scenario.id}
              onClick={() => onStart(scenario)}
              className="premium-glass rounded-2xl p-10 cursor-pointer border border-white/5 hover:border-os-primary/40 hover:-translate-y-2 transition-all group flex flex-col h-[380px]"
            >
              <div className="flex justify-between items-start mb-8">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${scenario.difficulty === 'Extreme' ? 'border-os-danger text-os-danger' : 'border-os-primary text-os-primary'}`}>
                  {scenario.difficulty}
                </span>
                <span className="text-[9px] font-mono text-os-slate">CODE: {scenario.id}</span>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-os-primary transition-colors leading-tight">
                {scenario.name}
              </h3>
              <p className="text-sm text-os-slate font-medium leading-relaxed mb-8 flex-1">
                {scenario.description}
              </p>

              <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] text-os-slate font-bold uppercase">KPI Stability</span>
                    <span className="text-lg font-bold text-white">99.8%</span>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-os-primary/10 flex items-center justify-center text-os-primary font-bold">→</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Setup;
