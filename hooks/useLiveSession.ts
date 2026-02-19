
import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';
import { ConnectionState, TranscriptItem, InputMode, TacticalInsight, BossMood } from '../types';
import { base64ToUint8Array, float32ToInt16PCM, uint8ArrayToBase64, pcmToAudioBuffer } from '../utils/audioUtils';
import { AmbienceGenerator } from '../utils/ambience';

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE = 4096;

export const useLiveSession = (apiKey: string) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState({ input: 0, output: 0 });
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false); 
  const [markers, setMarkers] = useState<number[]>([]);
  const [tacticalInsights, setTacticalInsights] = useState<TacticalInsight[]>([]);
  const [bossMood, setBossMood] = useState<BossMood>('Neutral');
  
  const [availableInputs, setAvailableInputs] = useState<MediaDeviceInfo[]>([]);
  const [availableOutputs, setAvailableOutputs] = useState<MediaDeviceInfo[]>([]);

  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const ambienceRef = useRef<AmbienceGenerator>(new AmbienceGenerator());
  const inputThresholdRef = useRef<number>(0);
  const inputModeRef = useRef<InputMode>('VAD');
  const pttPressedRef = useRef<boolean>(false);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const analyserInRef = useRef<AnalyserNode | null>(null);
  const analyserOutRef = useRef<AnalyserNode | null>(null);
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAvailableInputs(devices.filter(d => d.kind === 'audioinput'));
        setAvailableOutputs(devices.filter(d => d.kind === 'audiooutput'));
      } catch (e) {
        console.warn("Could not list audio devices", e);
      }
    };
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, []);

  const ensureAudioContexts = useCallback(() => {
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      analyserInRef.current = inputContextRef.current.createAnalyser();
      analyserInRef.current.fftSize = 256;
    }
    if (!outputContextRef.current) {
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      analyserOutRef.current = outputContextRef.current.createAnalyser();
      analyserOutRef.current.fftSize = 512;
    }
    if (inputContextRef.current.state === 'suspended') inputContextRef.current.resume();
    if (outputContextRef.current.state === 'suspended') outputContextRef.current.resume();
  }, []);

  const setOutputDevice = useCallback(async (deviceId: string) => {
    if (!outputContextRef.current) return;
    if (typeof (outputContextRef.current as any).setSinkId === 'function') {
      try { (outputContextRef.current as any).setSinkId(deviceId); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const updateVolume = () => {
      let inputVol = 0;
      let outputVol = 0;
      if (analyserInRef.current) {
        const dataArray = new Uint8Array(analyserInRef.current.frequencyBinCount);
        analyserInRef.current.getByteFrequencyData(dataArray);
        inputVol = dataArray.reduce((a, b) => a + b) / dataArray.length;
      }
      if (analyserOutRef.current) {
        const dataArray = new Uint8Array(analyserOutRef.current.frequencyBinCount);
        analyserOutRef.current.getByteFrequencyData(dataArray);
        outputVol = dataArray.reduce((a, b) => a + b) / dataArray.length;
      }
      setVolume({ input: inputVol, output: outputVol });
      setIsAiSpeaking(scheduledSourcesRef.current.size > 0);
      animationFrame = requestAnimationFrame(updateVolume);
    };
    if (connectionState === ConnectionState.CONNECTED) updateVolume();
    return () => cancelAnimationFrame(animationFrame);
  }, [connectionState]);

  const updateTranscript = (role: 'user' | 'ai', text: string, isFinal: boolean) => {
    setTranscript(prev => {
      const now = Date.now();
      const lastItem = prev[prev.length - 1];
      if (lastItem && lastItem.role === role && lastItem.isPartial) {
        const newItems = [...prev];
        newItems[newItems.length - 1] = { ...lastItem, text, isPartial: !isFinal, timestamp: now };
        return newItems;
      } else if (text.trim().length > 0) {
        return [...prev, { id: `${role}-${now}-${Math.random()}`, role, text, isPartial: !isFinal, timestamp: now }];
      }
      return prev;
    });
  };

  const toggleMute = useCallback(() => setIsMuted(prev => !prev), []);
  const addMarker = useCallback(() => setMarkers(prev => [...prev, Date.now()]), []);
  const setInputThreshold = useCallback((val: number) => { inputThresholdRef.current = val; }, []);
  const setInputMode = useCallback((mode: InputMode) => { inputModeRef.current = mode; }, []);
  const setPttPressed = useCallback((pressed: boolean) => { pttPressedRef.current = pressed; }, []);

  const connect = useCallback(async (
    systemInstruction: string, 
    voiceName: string = 'Kore',
    inputDeviceId?: string,
    outputDeviceId?: string,
    ambienceType: 'quiet' | 'office' | 'intense' = 'office'
  ) => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setTranscript([]);
      setMarkers([]);
      setTacticalInsights([]);
      setBossMood('Neutral');
      
      ensureAudioContexts();
      if (outputContextRef.current) ambienceRef.current.init(outputContextRef.current);
      if (outputDeviceId) await setOutputDevice(outputDeviceId);

      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true });
      streamRef.current = stream;

      const inputCtx = inputContextRef.current!;
      const outputCtx = outputContextRef.current!;
      const micSource = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      
      sourceRef.current = micSource;
      processorRef.current = processor;
      micSource.connect(analyserInRef.current!);
      analyserInRef.current!.connect(processor);
      processor.connect(inputCtx.destination);

      const recordingDest = outputCtx.createMediaStreamDestination();
      recordingDestRef.current = recordingDest;
      const micSourceForRecord = outputCtx.createMediaStreamSource(stream);
      micSourceForRecord.connect(recordingDest);

      const recorder = new MediaRecorder(recordingDest.stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.start();
      setStartTime(Date.now());

      const logTacticalInsightTool = {
        name: 'logTacticalInsight',
        parameters: {
          type: Type.OBJECT,
          description: 'Log an internal boss thought or tactical feedback during conversation.',
          properties: {
            text: { type: Type.STRING, description: 'The boss thought (e.g., "They seem nervous").' },
            type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
            mood: { type: Type.STRING, enum: ['Analytical', 'Impatient', 'Impressed', 'Neutral'] }
          },
          required: ['text', 'type']
        }
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [logTacticalInsightTool] }],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
          systemInstruction: `${systemInstruction}\nUse 'logTacticalInsight' frequently. Update your mood based on user performance.`,
        },
        callbacks: {
          onopen: () => {
            setConnectionState(ConnectionState.CONNECTED);
            nextStartTimeRef.current = outputCtx.currentTime;
            ambienceRef.current.start(ambienceType);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'logTacticalInsight') {
                  const { text, type, mood } = fc.args as any;
                  if (mood) setBossMood(mood);
                  setTacticalInsights(prev => [...prev.slice(-3), { text, type, mood, timestamp: Date.now() }]);
                  sessionPromise.then(s => s.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result: 'mood_updated' } }
                  }));
                }
              }
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               const audioBuffer = pcmToAudioBuffer(base64ToUint8Array(base64Audio), outputCtx, OUTPUT_SAMPLE_RATE);
               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(analyserOutRef.current!);
               analyserOutRef.current!.connect(outputCtx.destination);
               if (recordingDestRef.current) source.connect(recordingDestRef.current);
               const currentTime = outputCtx.currentTime;
               if (nextStartTimeRef.current < currentTime) nextStartTimeRef.current = currentTime;
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               source.onended = () => scheduledSourcesRef.current.delete(source);
               scheduledSourcesRef.current.add(source);
            }

            const outputTrans = message.serverContent?.outputTranscription?.text;
            if (outputTrans) { currentOutputTransRef.current += outputTrans; updateTranscript('ai', currentOutputTransRef.current, false); }
            const inputTrans = message.serverContent?.inputTranscription?.text;
            if (inputTrans) { currentInputTransRef.current += inputTrans; updateTranscript('user', currentInputTransRef.current, false); }
            if (message.serverContent?.turnComplete) {
              if (currentOutputTransRef.current) { updateTranscript('ai', currentOutputTransRef.current, true); currentOutputTransRef.current = ''; }
              if (currentInputTransRef.current) { updateTranscript('user', currentInputTransRef.current, true); currentInputTransRef.current = ''; }
            }
          },
          onclose: () => setConnectionState(ConnectionState.DISCONNECTED),
          onerror: () => setConnectionState(ConnectionState.ERROR)
        }
      });
      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        if (inputModeRef.current === 'PTT' && !pttPressedRef.current) return;
        const inputData = e.inputBuffer.getChannelData(0);
        if (inputModeRef.current === 'VAD') {
          let sum = 0; for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
          if (Math.sqrt(sum / inputData.length) < inputThresholdRef.current) return;
        }
        const base64Data = uint8ArrayToBase64(new Uint8Array(float32ToInt16PCM(inputData).buffer));
        sessionPromise.then(s => s.sendRealtimeInput({ media: { mimeType: 'audio/pcm;rate=16000', data: base64Data } }));
      };
    } catch (err: any) { setConnectionState(ConnectionState.ERROR); }
  }, [apiKey, ensureAudioContexts, isMuted, setOutputDevice]);

  const disconnect = useCallback(() => {
    ambienceRef.current.stop();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(recordingChunksRef.current, { type: 'audio/webm' })));
        recordingChunksRef.current = [];
      };
    }
    streamRef.current?.getTracks().forEach(track => track.stop());
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    scheduledSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sessionRef.current?.then((s: any) => s.close());
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  return {
    connectionState, error, connect, disconnect, volume, isMuted, toggleMute,
    transcript, audioUrl, startTime, latency, markers, addMarker, isAiSpeaking,
    availableInputs, availableOutputs, setOutputDevice, setInputThreshold, setInputMode, setPttPressed,
    inputAnalyser: analyserInRef.current, outputAnalyser: analyserOutRef.current,
    tacticalInsights, bossMood
  };
};
