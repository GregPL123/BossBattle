
import React, { useEffect, useState } from 'react';
import { TacticalInsight } from '../types';

interface TacticalInsightsHUDProps {
  insights: TacticalInsight[];
}

const TacticalInsightsHUD: React.FC<TacticalInsightsHUDProps> = ({ insights }) => {
  const [activeInsight, setActiveInsight] = useState<TacticalInsight | null>(null);

  useEffect(() => {
    if (insights.length > 0) {
      const latest = insights[insights.length - 1];
      setActiveInsight(latest);
      const timer = setTimeout(() => setActiveInsight(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [insights]);

  if (!activeInsight) return null;

  return (
    <div className="fixed top-28 right-12 z-50 w-72 pointer-events-none animate-fade-in">
      <div className={`
        premium-glass p-6 rounded-2xl border-l-4 shadow-2xl relative overflow-hidden
        ${activeInsight.type === 'positive' ? 'border-l-os-success' : activeInsight.type === 'negative' ? 'border-l-os-danger' : 'border-l-os-accent'}
      `}>
        <div className="flex items-center gap-2 mb-3">
           <div className={`w-1.5 h-1.5 rounded-full ${activeInsight.type === 'positive' ? 'bg-os-success' : activeInsight.type === 'negative' ? 'bg-os-danger' : 'bg-os-accent'}`}></div>
           <span className="text-[9px] font-bold text-os-slate uppercase tracking-widest">Strategic Insight</span>
        </div>
        
        <p className="text-white text-xs font-semibold leading-relaxed">
          {activeInsight.text}
        </p>

        <div className="mt-4 flex justify-between items-center border-t border-white/5 pt-3">
           <span className="text-[8px] font-bold text-os-slate uppercase tracking-widest">Real-time Analysis</span>
        </div>
      </div>
    </div>
  );
};

export default TacticalInsightsHUD;
