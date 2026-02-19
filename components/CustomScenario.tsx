
import React, { useState } from 'react';
import { generateScenarioFromPrompt } from '../utils/scenarioGenerator';
import { Scenario, Language } from '../types';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

const API_KEY = process.env.API_KEY || '';

interface CustomScenarioProps {
  onGenerated: (scenario: Scenario) => void;
  lang: Language;
}

const CustomScenario: React.FC<CustomScenarioProps> = ({ onGenerated, lang }) => {
  const t = translations[lang].customScenario;
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    playSfx('click');
    try {
      const scenario = await generateScenarioFromPrompt(API_KEY, prompt, lang);
      playSfx('success');
      onGenerated(scenario);
    } catch (err: any) {
      setError("PERSONA_INIT_FAILED: SIGNAL COLLAPSE");
      playSfx('failure');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-12 glass-card border-white/5 rounded-sm relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-os-accent to-transparent"></div>
      
      <div className="flex items-center gap-6 mb-10">
        <div className="w-16 h-16 rounded-sm bg-os-accent flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(99,102,241,0.5)] transform -skew-x-12">
          <span className="transform skew-x-12">✨</span>
        </div>
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic transform -skew-x-12 leading-none mb-1">
             Neural <span className="text-os-accent">Persona</span> Engine
          </h2>
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em] font-mono">
            Direct_Neural_Print_Synthesis_v6.0
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="relative group">
           <textarea
             value={prompt}
             onChange={(e) => setPrompt(e.target.value)}
             placeholder="ENTER NEURAL SPECIFICATIONS..."
             className="w-full h-40 bg-navy-950/80 border border-white/5 rounded-sm p-6 text-white placeholder:text-gray-800 focus:outline-none focus:border-os-accent transition-all resize-none shadow-inner font-mono text-xs uppercase tracking-widest leading-relaxed"
             disabled={isGenerating}
           />
           <div className="absolute bottom-4 right-4 text-[8px] font-mono text-gray-800 uppercase tracking-[0.5em]">Input_Encrypted: AES-256</div>
        </div>
        
        {error && (
          <p className="text-os-red text-[10px] font-black uppercase animate-flicker tracking-widest">
            ⚠️ ERROR: {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`
            w-full py-6 rounded-sm skew-btn font-black text-xl uppercase italic tracking-[0.5em] transition-all flex items-center justify-center gap-6 overflow-hidden relative group
            ${isGenerating 
              ? 'bg-navy-900 text-gray-700 cursor-wait border border-white/5' 
              : 'execute-gradient text-white shadow-[0_15px_40px_rgba(99,102,241,0.3)] hover:brightness-110 active:scale-95'}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-6 h-6 border-2 border-gray-700 border-t-os-accent rounded-full animate-spin"></div>
              <span className="animate-pulse">Synthesizing...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Initialize_Print</span>
              <span className="text-2xl relative z-10 group-hover:translate-x-2 transition-transform">⚡</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-12 pt-10 border-t border-white/5 grid grid-cols-2 gap-6">
         <div 
           className="p-5 rounded-sm bg-navy-950/40 border border-white/5 hover:border-os-accent/30 transition-all cursor-pointer group"
           onClick={() => setPrompt("Salary raise for 20% after high performance year.")}
         >
            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest font-mono group-hover:text-os-accent transition-colors">Neural_Preset_01</span>
            <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tight italic">Negotiate 20% Equity Bump</p>
         </div>
         <div 
           className="p-5 rounded-sm bg-navy-950/40 border border-white/5 hover:border-os-accent/30 transition-all cursor-pointer group"
           onClick={() => setPrompt("Explaining a major technical bug that delayed the launch.")}
         >
            <span className="text-[8px] text-gray-700 font-black uppercase tracking-widest font-mono group-hover:text-os-accent transition-colors">Neural_Preset_02</span>
            <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-tight italic">Major System Breach Debrief</p>
         </div>
      </div>
    </div>
  );
};

export default CustomScenario;
