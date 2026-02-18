import React, { useEffect, useRef, useState } from 'react';

interface MicTesterProps {
  deviceId: string;
  threshold: number; // 0.0 to 0.1 usually
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
        analyser.smoothingTimeConstant = 0.3;

        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);

        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const timeDomainArray = new Float32Array(analyser.fftSize);

        const draw = () => {
          if (!analyser || !ctx) return;
          
          animationId = requestAnimationFrame(draw);
          
          // Get Time Domain Data for RMS
          analyser.getFloatTimeDomainData(timeDomainArray);
          let sum = 0;
          for(let i=0; i<timeDomainArray.length; i++){
             sum += timeDomainArray[i] * timeDomainArray[i];
          }
          const rms = Math.sqrt(sum / timeDomainArray.length);
          
          // Amplified for visualization (RMS is usually small, e.g. 0.01 - 0.2)
          // We map 0 - 0.1 to 0 - 100% of the bar mostly
          const rmsDisplay = Math.min(1, rms * 10); 

          // Clear
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw Background Track
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw Threshold Line
          // threshold prop is roughly matched to RMS. If threshold is 0.01, displayed at 10%
          const thresholdX = (threshold * 10) * canvas.width;
          
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'; // Red zone (muted)
          ctx.fillRect(0, 0, thresholdX, canvas.height);
          
          ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // Green zone (active)
          ctx.fillRect(thresholdX, 0, canvas.width - thresholdX, canvas.height);

          ctx.beginPath();
          ctx.moveTo(thresholdX, 0);
          ctx.lineTo(thresholdX, canvas.height);
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw Volume Bar
          const barWidth = rmsDisplay * canvas.width;
          
          // Color based on Gate
          const isPassing = rms >= threshold;
          ctx.fillStyle = isPassing ? '#10b981' : '#6b7280'; // Green if passing, Gray if gated
          
          ctx.fillRect(0, 10, barWidth, canvas.height - 20); // Center bar vertically

          // Draw Label
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(isPassing ? 'ACTIVE' : 'MUTED (GATE)', canvas.width - 5, 12);
        };

        draw();

      } catch (err: any) {
        console.error("Mic test failed:", err);
        setError("Could not access microphone.");
      }
    };

    startTest();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [deviceId, threshold]);

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Test & Threshold</label>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 h-16 relative overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={360} 
          height={48} 
          className="w-full h-full block rounded"
        />
      </div>
      <p className="text-[10px] text-gray-500 mt-1">
        Adjust the threshold slider below until background noise stays in the red zone.
      </p>
    </div>
  );
};

export default MicTester;
