
import React, { useEffect, useRef, useState } from 'react';

interface MicTesterProps {
  deviceId: string;
  threshold: number;
}

const MicTester: React.FC<MicTesterProps> = ({ deviceId, threshold }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let stream: MediaStream | null = null;
    let animationId: number;

    const startTest = async () => {
      try {
        setError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: deviceId ? { deviceId: { exact: deviceId } } : true
        });
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const timeDomainArray = new Float32Array(analyser.fftSize);

        const draw = () => {
          if (!analyser || !ctx) return;
          animationId = requestAnimationFrame(draw);
          analyser.getFloatTimeDomainData(timeDomainArray);
          let sum = 0;
          for(let i=0; i<timeDomainArray.length; i++){ sum += timeDomainArray[i] * timeDomainArray[i]; }
          const rms = Math.sqrt(sum / timeDomainArray.length);
          const rmsDisplay = Math.min(1, rms * 15); 

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(11, 13, 16, 0.8)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Tactical Grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 0.5;
          for(let i=0; i<canvas.width; i+=20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }

          const thresholdX = (threshold * 20) * canvas.width;
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(0, 0, thresholdX, canvas.height);
          
          ctx.beginPath();
          ctx.moveTo(thresholdX, 0);
          ctx.lineTo(thresholdX, canvas.height);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Volume Bar
          const barWidth = rmsDisplay * canvas.width;
          const isPassing = rms >= threshold;
          const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#a855f7');
          
          ctx.fillStyle = isPassing ? gradient : '#333';
          ctx.fillRect(0, canvas.height - 4, barWidth, 4);
          
          if (isPassing) {
             ctx.shadowBlur = 10;
             ctx.shadowColor = '#6366f1';
             ctx.fillRect(0, canvas.height - 4, barWidth, 4);
             ctx.shadowBlur = 0;
          }

          ctx.fillStyle = isPassing ? '#6366f1' : '#333';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(isPassing ? 'SIGNAL_ACTIVE' : 'GATED', canvas.width - 10, 15);
        };
        draw();
      } catch (err: any) { setError("NODE_LINK_FAILURE"); }
    };
    startTest();
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (audioContext) audioContext.close();
    };
  }, [deviceId, threshold]);

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] font-mono">Neural_Input_Calibration</label>
        {error && <span className="text-[9px] text-os-red font-black animate-pulse">{error}</span>}
      </div>
      <div className="bg-navy-950 border border-white/5 rounded-sm h-12 relative overflow-hidden">
        <canvas ref={canvasRef} width={400} height={48} className="w-full h-full block" />
      </div>
    </div>
  );
};

export default MicTester;
