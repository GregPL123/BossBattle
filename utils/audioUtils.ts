// Decodes base64 string to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encodes Uint8Array to base64 string
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Converts Float32Array (Web Audio API) to Int16Array (PCM)
export function float32ToInt16PCM(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

// Converts raw PCM Int16 bytes to AudioBuffer
export function pcmToAudioBuffer(
  pcmData: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number = 24000,
  channels: number = 1
): AudioBuffer {
  const int16Array = new Int16Array(pcmData.buffer);
  const frameCount = int16Array.length / channels;
  const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);

  for (let channel = 0; channel < channels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = int16Array[i * channels + channel] / 32768.0;
    }
  }
  
  return audioBuffer;
}
