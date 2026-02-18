
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
      setError(t.error);
      playSfx('failure');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-gray-900/50 border border-gray-800 rounded-3xl backdrop-blur-md animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
          ✨
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
            {translations[lang].createNew}
          </h2>
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
            AI-Powered Persona Engine
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t.placeholder}
          className="w-full h-32 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-all resize-none shadow-inner"
          disabled={isGenerating}
        />
        
        {error && (
          <p className="text-red-400 text-sm font-medium animate-pulse">
            ⚠️ {error}
          </p>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className={`
            w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3
            ${isGenerating 
              ? 'bg-gray-800 text-gray-500 cursor-wait' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl hover:shadow-purple-500/20 active:scale-95'}
          `}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin"></div>
              <span>{t.generating}</span>
            </>
          ) : (
            <>
              <span>{t.generate}</span>
              <span className="text-2xl">⚡</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-8 pt-8 border-t border-gray-800 grid grid-cols-2 gap-4">
         <div className="p-3 rounded-xl bg-gray-950/50 border border-gray-800">
            <span className="text-[10px] text-gray-500 font-black uppercase">Example 1</span>
            <p className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-white" onClick={() => setPrompt("Salary raise for 20% after high performance year.")}>Asking for a 20% raise.</p>
         </div>
         <div className="p-3 rounded-xl bg-gray-950/50 border border-gray-800">
            <span className="text-[10px] text-gray-500 font-black uppercase">Example 2</span>
            <p className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-white" onClick={() => setPrompt("Explaining a major technical bug that delayed the launch.")}>Explaining a critical bug.</p>
         </div>
      </div>
    </div>
  );
};

export default CustomScenario;
