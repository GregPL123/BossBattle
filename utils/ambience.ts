// procedural audio generator for background ambience

export class AmbienceGenerator {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private masterGain: GainNode | null = null;

  constructor() {}

  // Create White Noise Buffer
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = 2 * ctx.sampleRate; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Helper to connect and store nodes for cleanup
  private playSource(node: AudioScheduledSourceNode, destination: AudioNode) {
     node.connect(destination);
     node.start();
     this.nodes.push(node);
  }

  public init(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.connect(ctx.destination);
    this.nodes.push(this.masterGain);
  }

  public start(type: 'quiet' | 'office' | 'intense' = 'office') {
    if (!this.ctx || !this.masterGain) return;

    // Stop existing sounds first
    this.stopSoundsOnly();

    const noiseBuffer = this.createNoiseBuffer(this.ctx);

    if (type === 'quiet') {
      // Gentle Room Tone (Filtered Pink Noise)
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      // Lowpass filter to make it "room tone"
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400; 

      const gain = this.ctx.createGain();
      gain.gain.value = 0.02; // Very quiet

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      src.start();
      this.nodes.push(src, filter, gain);
    } 
    
    else if (type === 'office') {
      // Office Hum: Pink Noise + Slight high freq hiss (HVAC)
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.04; 

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      src.start();
      this.nodes.push(src, filter, gain);
    }

    else if (type === 'intense') {
      // Deep Rumble (Brown-ish noise approximation)
      const src = this.ctx.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150; // Deep bass

      const gain = this.ctx.createGain();
      gain.gain.value = 0.08; 

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      // Add a subtle high pitch "ringing" tension
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 100; // Low drone
      
      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 0.02;

      osc.connect(oscGain);
      oscGain.connect(this.masterGain);
      osc.start();

      src.start();
      this.nodes.push(src, filter, gain, osc, oscGain);
    }
  }

  private stopSoundsOnly() {
    this.nodes.forEach(node => {
      // If it's a source node, stop it
      if ('stop' in node) {
         try { (node as AudioScheduledSourceNode).stop(); } catch(e) {}
      }
      // Don't disconnect master gain here
      if (node !== this.masterGain) {
         node.disconnect();
      }
    });
    // Keep master gain in nodes array but remove others
    if (this.masterGain) {
       this.nodes = [this.masterGain];
    } else {
       this.nodes = [];
    }
  }

  public stop() {
    this.stopSoundsOnly();
    if (this.masterGain) {
       this.masterGain.disconnect();
       this.masterGain = null;
    }
    this.ctx = null;
  }
}