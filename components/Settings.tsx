
import React, { useState } from 'react';
import MicTester from './MicTester';
import { playSfx } from '../utils/sound';
import { InputMode, Language } from '../types';
import { translations } from '../translations';

interface SettingsProps {
  inputDevices: MediaDeviceInfo[];
  outputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  selectedOutputId: string;
  micThreshold: number;
  inputMode: InputMode;
  language: Language;
  onSelectInput: (deviceId: string) => void;
  onSelectOutput: (deviceId: string) => void;
  onSetMicThreshold: (val: number) => void;
  onSetInputMode: (mode: InputMode) => void;
  onLanguageChange: (lang: Language) => void;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  inputDevices, 
  outputDevices, 
  selectedInputId, 
  selectedOutputId,
  micThreshold,
  inputMode,
  language,
  onSelectInput, 
  onSelectOutput, 
  onSetMicThreshold,
  onSetInputMode,
  onLanguageChange,
  onClose 
}) => {
  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden transform animate-slide-up">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t.settings}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t.language}
            </label>
            <div className="bg-gray-950 p-1 rounded-lg flex border border-gray-800">
               <button 
                 onClick={() => onLanguageChange('en')}
                 className={`flex-1 py-2 rounded text-sm font-bold transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 English
               </button>
               <button 
                 onClick={() => onLanguageChange('pl')}
                 className={`flex-1 py-2 rounded text-sm font-bold transition-all ${language === 'pl' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 Polski
               </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t.inputMode}
            </label>
            <div className="bg-gray-950 p-1 rounded-lg flex border border-gray-800">
               <button 
                 onClick={() => onSetInputMode('VAD')}
                 className={`flex-1 py-2 rounded text-sm font-bold transition-all ${inputMode === 'VAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 {t.vadMode}
               </button>
               <button 
                 onClick={() => onSetInputMode('PTT')}
                 className={`flex-1 py-2 rounded text-sm font-bold transition-all ${inputMode === 'PTT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
               >
                 {t.pttMode}
               </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              {inputMode === 'VAD' ? t.vadDesc : t.pttDesc}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t.micInput}
            </label>
            <select
              value={selectedInputId}
              onChange={(e) => onSelectInput(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 px-4 text-white appearance-none focus:outline-none focus:border-blue-500 transition-colors"
            >
              {inputDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              ))}
            </select>
            <MicTester deviceId={selectedInputId} threshold={micThreshold} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              {t.speakerOutput}
            </label>
            <select
              value={selectedOutputId}
              onChange={(e) => onSelectOutput(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg py-3 px-4 text-white transition-colors"
            >
              {outputDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>{device.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-950/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg transition-all"
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
