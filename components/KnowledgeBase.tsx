
import React, { useState } from 'react';
import { playSfx } from '../utils/sound';
import { Language } from '../types';
import { translations } from '../translations';

interface KnowledgeBaseProps {
  onClose: () => void;
  lang: Language;
}

const TACTICS_CONTENT: Record<Language, any[]> = {
  en: [
    { id: 'batna', title: 'BATNA', subtitle: 'Best Alternative', icon: '🛡️', description: 'Your bottom line. Know what you will do if you walk away.', example: 'Your BATNA might be another job offer.' },
    { id: 'mirroring', title: 'Mirroring', subtitle: 'Building Rapport', icon: '🪞', description: 'Repeat the last 3 words your counterpart said with a question inflection.', example: '"The budget right now?"' },
    { id: 'labeling', title: 'Labeling', subtitle: 'Emotional Validation', icon: '🏷️', description: 'Explicitly naming the other person\'s emotion to diffuse tension.', example: '"It seems like you are concerned about the timeline."' },
    { id: 'no_oriented', title: 'No-Oriented Questions', subtitle: 'Removing Pressure', icon: '🚫', description: 'Questions that are easier for the other person to answer with "No".', example: '"Would it be a bad idea to push the meeting back?"' },
    { id: 'silence', title: 'Strategic Silence', subtitle: 'The Space Between', icon: '🔇', description: 'Remaining silent after a major point or a difficult question.', example: 'Wait at least 4 seconds after they stop speaking.' }
  ],
  pl: [
    { id: 'batna', title: 'BATNA', subtitle: 'Najlepsza Alternatywa', icon: '🛡️', description: 'Twój punkt odniesienia. Wiedza o tym, co zrobisz, jeśli rozmowa się nie uda.', example: 'Twoją alternatywą może być oferta od innej firmy.' },
    { id: 'mirroring', title: 'Lustrzenie', subtitle: 'Budowanie Relacji', icon: '🪞', description: 'Powtórz ostatnie 3 słowa rozmówcy z intonacją pytającą.', example: '"Budżet w tej chwili?"' },
    { id: 'labeling', title: 'Etykietowanie', subtitle: 'Walidacja Emocji', icon: '🏷️', description: 'Nazywanie emocji rozmówcy, aby rozładować napięcie.', example: '"Wydaje się, że martwi Cię harmonogram prac."' },
    { id: 'no_oriented', title: 'Pytania na "Nie"', subtitle: 'Zdejmowanie Presji', icon: '🚫', description: 'Pytania, na które rozmówcy łatwiej odpowiedzieć "Nie", co daje mu poczucie kontroli.', example: '"Czy byłoby złym pomysłem przesunięcie spotkania?"' },
    { id: 'silence', title: 'Strategiczna Cisza', subtitle: 'Przestrzeń', icon: '🔇', description: 'Zachowanie ciszy po ważnym punkcie lub trudnym pytaniu.', example: 'Odczekaj co najmniej 4 sekundy po tym, jak rozmówca skończy mówić.' }
  ]
};

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onClose, lang }) => {
  const t = translations[lang];
  const tactics = TACTICS_CONTENT[lang] || TACTICS_CONTENT['en'];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="w-full max-w-5xl bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-2xl">🎓</div>
            <div><h2 className="text-2xl font-bold text-white uppercase tracking-tight italic">{t.academyTitle}</h2><p className="text-sm text-gray-400">{t.academySubtitle}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-950 to-gray-900 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tactics.map((tactic) => (
              <div key={tactic.id} onClick={() => { playSfx('click'); setSelectedId(selectedId === tactic.id ? null : tactic.id); }} className={`p-6 rounded-2xl border transition-all cursor-pointer transform hover:scale-[1.02] ${selectedId === tactic.id ? 'bg-indigo-900/20 border-indigo-500 col-span-1 md:col-span-3' : 'bg-gray-900/40 border-gray-800 hover:bg-gray-800'}`}>
                <div className="flex items-center gap-3 mb-4"><span className="text-4xl">{tactic.icon}</span><div><h3 className="font-bold text-lg text-white">{tactic.title}</h3><p className="text-[10px] text-gray-500 uppercase font-black">{tactic.subtitle}</p></div></div>
                <p className="text-gray-400 text-sm leading-relaxed">{tactic.description}</p>
                {selectedId === tactic.id && <div className="mt-6 bg-gray-950/50 p-6 rounded-xl border border-gray-800 animate-fade-in"><p className="text-indigo-300 font-black text-[10px] uppercase mb-2">Example / Przykład</p><p className="text-gray-200 italic text-sm">"{tactic.example}"</p></div>}
              </div>
            ))}
          </div>
          <div className="mt-12 p-10 bg-gray-900/30 rounded-3xl border border-gray-800 text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
             <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight italic">{t.readyToTest}</h3>
             <p className="text-gray-400 mb-8 max-w-md mx-auto">{t.learnByDoing}</p>
             <button onClick={onClose} className="bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all shadow-xl">{t.startTraining}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
