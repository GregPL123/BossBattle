
import React, { useState, useEffect, useRef } from 'react';
import { Scenario, UserProfile, Language } from '../types';
import MicTester from './MicTester';
import { playSfx } from '../utils/sound';
import { translations } from '../translations';

interface LobbyProps {
  scenario: Scenario;
  userProfile?: UserProfile;
  inputDeviceId: string;
  micThreshold: number;
  onStart: (blindMode: boolean) => void;
  onBack: () => void;
  onSettings: () => void;
  onSetThreshold: (val: number) => void;
  lang: Language;
}

const Lobby: React.FC<LobbyProps> = ({ 
  scenario, 
  userProfile, 
  inputDeviceId, 
  micThreshold, 
  onStart, 
  onBack,
  onSettings,
  onSetThreshold,
  lang
}) => {
  const t = translations[lang];
  const [isBlindMode, setIsBlindMode] = useState(() => localStorage.getItem('boss_battle_blind_mode') === 'true');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibProgress, setCalibProgress] = useState(0);
  
  const calibRef = useRef<{max: number}>({max: 0});

  const handleCalibrate = async () => {
    if (isCalibrating) return;
    setIsCalibrating(true);
    setCalibProgress(0);
    calibRef.current.max = 0;
    playSfx('click');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true 
      });
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Float32Array(analyser.fftSize);
      const startTime = Date.now();
      const duration = 3000;

      const check = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        setCalibProgress((elapsed / duration) * 100);

        analyser.getFloatTimeDomainData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        if (rms > calibRef.current.max) calibRef.current.max = rms;

        if (elapsed < duration) {
          requestAnimationFrame(check);
        } else {
          // Calibration done
          const safetyMargin = 0.005;
          const finalThreshold = Math.min(0.1, calibRef.current.max + safetyMargin);
          onSetThreshold(finalThreshold);
          setIsCalibrating(false);
          playSfx('success');
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
        }
      };

      requestAnimationFrame(check);
    } catch (e) {
      console.error(e);
      setIsCalibrating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 animate-fade-in flex flex-col md:flex-row gap-8 items-start justify-center min-h-[60vh]">
      <div className="flex-1 w-full space-y-6">
        <button onClick={() => { playSfx('click'); onBack(); }} className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors">
          ← {t.abortMission}
        </button>
        <h1 className="text-4xl font-black text-white mb-2 tracking-tight uppercase italic transform -skew-x-6">{scenario.name}</h1>
        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
           <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">🎯 {t.missionObjectives}</h3>
           <ul className="space-y-4">
             {scenario.objectives.map((obj, i) => (
               <li key={i} className="flex gap-3 items-start group">
                 <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 text-gray-500 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                 <p className="text-gray-300 text-sm leading-relaxed">{obj}</p>
               </li>
             ))}
           </ul>
        </div>
      </div>

      <div className="w-full md:w-80 shrink-0 space-y-6">
         <div className="bg-gray-900 border border-gray-800 rounded-2xl p-1 overflow-hidden">
            <div className="bg-gray-950 p-6 rounded-xl text-center">
               <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=boss&backgroundColor=1f2937`} alt="Boss" className="w-24 h-24 mx-auto rounded-full mb-4 shadow-lg border-2 border-gray-700" />
               <div className="text-sm font-bold text-gray-400 uppercase mb-1">{t.opponent}</div>
               <div className="text-white font-bold text-lg">{scenario.voiceName}</div>
               <div className="flex items-center justify-center gap-2 mt-2">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${scenario.difficulty === 'Extreme' ? 'bg-red-900 text-red-400' : 'bg-blue-900 text-blue-400'}`}>{t[scenario.difficulty.toLowerCase() as keyof typeof t] as string}</span>
                 <span className="text-[10px] text-gray-500 px-2 py-0.5 border border-gray-800 rounded uppercase">{scenario.durationMinutes} MIN</span>
               </div>
            </div>
         </div>

         <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase">{t.micInput}</h3>
              <button 
                onClick={handleCalibrate} 
                disabled={isCalibrating}
                className={`text-[10px] font-black px-2 py-1 rounded transition-all ${isCalibrating ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
              >
                {isCalibrating ? `${Math.round(calibProgress)}%` : 'AUTOCALIBRATE'}
              </button>
            </div>
            <MicTester deviceId={inputDeviceId} threshold={micThreshold} />
         </div>

         <button 
           onClick={() => { playSfx('success'); onStart(isBlindMode); }} 
           className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xl rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] active:scale-95"
         >
           <span>{t.start}</span> →
         </button>
      </div>
    </div>
  );
};

export default Lobby;
