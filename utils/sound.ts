// Simple synth for UI sounds to avoid external assets

const playTone = (ctx: AudioContext, freq: number, type: OscillatorType, startTime: number, duration: number, vol: number = 0.1) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playSfx = (type: 'connect' | 'disconnect' | 'success' | 'failure' | 'click') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        playTone(ctx, 800, 'sine', now, 0.1, 0.05);
        break;
        
      case 'connect':
        // Ascending futuristic chime
        playTone(ctx, 440, 'sine', now, 0.2);
        playTone(ctx, 880, 'sine', now + 0.1, 0.3);
        playTone(ctx, 1760, 'sine', now + 0.2, 0.5);
        break;

      case 'disconnect':
        // Power down sound
        playTone(ctx, 400, 'triangle', now, 0.3);
        playTone(ctx, 200, 'triangle', now + 0.1, 0.3);
        playTone(ctx, 100, 'triangle', now + 0.2, 0.4);
        break;

      case 'success':
        // Major chord victory
        playTone(ctx, 523.25, 'triangle', now, 0.5); // C5
        playTone(ctx, 659.25, 'triangle', now + 0.1, 0.5); // E5
        playTone(ctx, 783.99, 'triangle', now + 0.2, 0.8); // G5
        playTone(ctx, 1046.50, 'sine', now + 0.3, 1.0, 0.2); // C6
        break;

      case 'failure':
        // Dissonant thud
        playTone(ctx, 150, 'sawtooth', now, 0.5, 0.2);
        playTone(ctx, 140, 'sawtooth', now + 0.1, 0.5, 0.2);
        break;
    }
  } catch (e) {
    console.error("SFX Error", e);
  }
};
