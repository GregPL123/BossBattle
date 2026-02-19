
import React, { useEffect, useState } from 'react';

const LOGS = [
  "NEURAL_LATENCY: 12ms",
  "UPLINK_STRENGTH: 98%",
  "BPM_INTERCEPT: ACTIVE",
  "STRESS_SIG: STABLE",
  "COGNITIVE_LOAD: 42%",
  "VOICE_ENCRYPTION: AES-256",
  "PSY_THRESHOLD: NOMINAL",
  "SYNC_LOCK: ENABLED",
  "BUFFER_HEALTH: 100%",
  "TARGET_SENTIMENT: ANALYZING"
];

const LiveTelemetryHUD: React.FC = () => {
  const [activeLogs, setActiveLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogs(prev => {
        const nextLog = LOGS[Math.floor(Math.random() * LOGS.length)];
        const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newLog = `[${time}] ${nextLog}`;
        return [newLog, ...prev].slice(0, 8);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-44 left-12 z-30 w-64 pointer-events-none">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1.5 h-1.5 bg-os-accent rounded-full animate-pulse shadow-[0_0_8px_#6366f1]"></div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.5em] font-mono">Realtime_Telemetry</span>
      </div>
      <div className="space-y-1">
        {activeLogs.map((log, i) => (
          <div 
            key={i} 
            className="text-[7px] font-mono font-black uppercase text-os-accent opacity-40 animate-fade-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTelemetryHUD;
