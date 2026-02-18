import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, TranscriptItem, InputMode, Scenario } from '../types';
import { base64ToUint8Array, float32ToInt16PCM, uint8ArrayToBase64, pcmToAudioBuffer } from '../utils/audioUtils';
import { AmbienceGenerator } from '../utils/ambience';

// Audio constants
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
  
  const [availableInputs, setAvailableInputs] = useState<MediaDeviceInfo[]>([]);
  const [availableOutputs, setAvailableOutputs] = useState<MediaDeviceInfo[]>([]);

  // Refs for audio context and session
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Ambience Generator
  const ambienceRef = useRef<AmbienceGenerator>(new AmbienceGenerator());
  
  // Input Control Refs
  const inputThresholdRef = useRef<number>(0);
  const inputModeRef = useRef<InputMode>('VAD');
  const pttPressedRef = useRef<boolean>(false);
  const lastSendTimeRef = useRef<number>(0);

  // Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  
  // Analysers exposed for visualization
  const analyserInRef = useRef<AnalyserNode | null>(null);
  const analyserOutRef = useRef<AnalyserNode | null>(null);

  // Transcription accumulation refs
  const currentInputTransRef = useRef<string>('');
  const currentOutputTransRef = useRef<string>('');

  // Load available audio devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Request permission temporarily to list labels if not already granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAvailableInputs(inputs);
        setAvailableOutputs(outputs);
      } catch (e) {
        console.warn("Could not list audio devices", e);
      }
    };
    
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, []);

  // Initialize Audio Contexts
  const ensureAudioContexts = useCallback(() => {
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      analyserInRef.current = inputContextRef.current.createAnalyser();
      analyserInRef.current.fftSize = 256;
      analyserInRef.current.smoothingTimeConstant = 0.5;
    }
    if (!outputContextRef.current) {
      outputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      analyserOutRef.current = outputContextRef.current.createAnalyser();
      analyserOutRef.current.fftSize = 512;
      analyserOutRef.current.smoothingTimeConstant = 0.5;
    }
    if (inputContextRef.current.state === 'suspended') inputContextRef.current.resume();
    if (outputContextRef.current.state === 'suspended') outputContextRef.current.resume();
  }, []);

  const setOutputDevice = useCallback(async (deviceId: string) => {
    if (!outputContextRef.current) return;
    
    // Check for setSinkId support (experimental in some browsers)
    // @ts-ignore
    if (typeof outputContextRef.current.setSinkId === 'function') {
      try {
        // @ts-ignore
        await outputContextRef.current.setSinkId(deviceId);
      } catch (e) {
        console.error("Failed to set output device:", e);
      }
    } else {
      console.warn("AudioContext.setSinkId is not supported in this browser.");
    }
  }, []);

  const setInputThreshold = useCallback((threshold: number) => {
    inputThresholdRef.current = threshold;
  }, []);

  const setInputMode = useCallback((mode: InputMode) => {
    inputModeRef.current = mode;
  }, []);

  const setPttPressed = useCallback((pressed: boolean) => {
    pttPressedRef.current = pressed;
  }, []);

  const addMarker = useCallback(() => {
    setMarkers(prev => [...prev, Date.now()]);
  }, []);

  // Calculate volume levels
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
      
      // Update Speaking State based on active sources
      setIsAiSpeaking(scheduledSourcesRef.current.size > 0);

      animationFrame = requestAnimationFrame(updateVolume);
    };
    
    if (connectionState === ConnectionState.CONNECTED) {
      updateVolume();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [connectionState]);

  const updateTranscript = (role: 'user' | 'ai', text: string, isFinal: boolean) => {
    setTranscript(prev => {
      const now = Date.now();
      const lastItem = prev[prev.length - 1];
      
      if (lastItem && lastItem.role === role && lastItem.isPartial) {
        const newItems = [...prev];
        newItems[newItems.length - 1] = {
          ...lastItem,
          text: text,
          isPartial: !isFinal,
          timestamp: now
        };
        return newItems;
      } 
      else if (text.trim().length > 0) {
        return [...prev, {
          id: `${role}-${now}-${Math.random()}`,
          role,
          text,
          isPartial: !isFinal,
          timestamp: now
        }];
      }
      return prev;
    });
  };

  const connect = useCallback(async (
    systemInstruction: string, 
    voiceName: string = 'Kore',
    inputDeviceId?: string,
    outputDeviceId?: string,
    ambienceType: 'quiet' | 'office' | 'intense' = 'office'
  ) => {
    try {
      setConnectionState(ConnectionState.CONNECTING);
      setError(null);
      setTranscript([]);
      setMarkers([]);
      setAudioUrl(null);
      setStartTime(0);
      setLatency(0);
      setIsAiSpeaking(false);
      currentInputTransRef.current = '';
      currentOutputTransRef.current = '';
      recordingChunksRef.current = [];
      
      ensureAudioContexts();
      
      // Initialize Ambience
      if (outputContextRef.current) {
         ambienceRef.current.init(outputContextRef.current);
      }
      
      // Set Output Device
      if (outputDeviceId) {
        await setOutputDevice(outputDeviceId);
      }

      const ai = new GoogleGenAI({ apiKey });
      
      // Select Microphone
      const constraints = { 
        audio: inputDeviceId ? { deviceId: { exact: inputDeviceId } } : true 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        throw new Error("Microphone access denied or device not found.");
      }
      streamRef.current = stream;

      const inputCtx = inputContextRef.current!;
      const outputCtx = outputContextRef.current!;

      // --- Audio Pipeline Setup ---
      
      // 1. Microphone Input (for AI)
      const micSource = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      
      sourceRef.current = micSource;
      processorRef.current = processor;

      micSource.connect(analyserInRef.current!);
      analyserInRef.current!.connect(processor);
      processor.connect(inputCtx.destination); // ScriptProcessor needs connection to destination to work

      // 2. Recording Setup (Mixing Mic + AI)
      // We use the Output Context for recording to simplify mixing (AI audio is already there).
      // We need to bring Mic Audio into Output Context.
      const recordingDest = outputCtx.createMediaStreamDestination();
      recordingDestRef.current = recordingDest;

      // Bring Mic stream into Output Context for recording purposes only
      // Note: We don't connect this to destination to avoid self-hearing/feedback loop
      const micSourceForRecord = outputCtx.createMediaStreamSource(stream);
      micSourceForRecord.connect(recordingDest);

      // Initialize MediaRecorder
      const recorder = new MediaRecorder(recordingDest.stream);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordingChunksRef.current.push(e.data);
        }
      };
      
      recorder.start();
      setStartTime(Date.now()); // Record start time


      // --- Gemini Session ---

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName } },
          },
          systemInstruction: `
            ${systemInstruction}
            CRITICAL INSTRUCTION: You are simulating a real-time voice conversation. 
            You MUST speak FIRST immediately when the connection opens. 
            Start the scenario immediately with a relevant opening line based on the context.
            Keep your responses concise (under 30 words where possible).
          `,
        },
        callbacks: {
          onopen: async () => {
            setConnectionState(ConnectionState.CONNECTED);
            nextStartTimeRef.current = outputCtx.currentTime;
            
            // Start Ambience
            ambienceRef.current.start(ambienceType);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Update Latency
            if (lastSendTimeRef.current > 0) {
               const diff = Date.now() - lastSendTimeRef.current;
               setLatency(prev => Math.round((prev * 0.7) + (diff * 0.3))); // Rolling average
               lastSendTimeRef.current = 0; // Reset
            }

            // Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               const audioBuffer = pcmToAudioBuffer(
                 base64ToUint8Array(base64Audio),
                 outputCtx,
                 OUTPUT_SAMPLE_RATE
               );
               
               const source = outputCtx.createBufferSource();
               source.buffer = audioBuffer;
               
               // Connect to Speaker Output (Analyser -> Destination)
               source.connect(analyserOutRef.current!);
               analyserOutRef.current!.connect(outputCtx.destination);

               // Connect to Recorder
               if (recordingDestRef.current) {
                 source.connect(recordingDestRef.current);
               }
               
               const currentTime = outputCtx.currentTime;
               if (nextStartTimeRef.current < currentTime) {
                 nextStartTimeRef.current = currentTime;
               }
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               source.onended = () => {
                 scheduledSourcesRef.current.delete(source);
               };
               scheduledSourcesRef.current.add(source);
            }

            // Transcription logic...
            const outputTrans = message.serverContent?.outputTranscription?.text;
            if (outputTrans) {
              currentOutputTransRef.current += outputTrans;
              updateTranscript('ai', currentOutputTransRef.current, false);
            }

            const inputTrans = message.serverContent?.inputTranscription?.text;
            if (inputTrans) {
              currentInputTransRef.current += inputTrans;
              updateTranscript('user', currentInputTransRef.current, false);
            }

            if (message.serverContent?.turnComplete) {
              if (currentOutputTransRef.current) {
                updateTranscript('ai', currentOutputTransRef.current, true);
                currentOutputTransRef.current = '';
              }
              if (currentInputTransRef.current) {
                updateTranscript('user', currentInputTransRef.current, true);
                currentInputTransRef.current = '';
              }
            }

            if (message.serverContent?.interrupted) {
               scheduledSourcesRef.current.forEach(s => {
                 try { s.stop(); } catch(e) {}
               });
               scheduledSourcesRef.current.clear();
               nextStartTimeRef.current = outputCtx.currentTime;
               setIsAiSpeaking(false);
               
               if (currentOutputTransRef.current) {
                 updateTranscript('ai', currentOutputTransRef.current + " [Interrupted]", true);
                 currentOutputTransRef.current = '';
               }
            }
          },
          onclose: () => {
            setConnectionState(ConnectionState.DISCONNECTED);
            ambienceRef.current.stop();
          },
          onerror: (e) => {
            console.error(e);
            setError("Connection error.");
            setConnectionState(ConnectionState.ERROR);
            disconnect();
          }
        }
      });

      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        
        // PTT Check
        if (inputModeRef.current === 'PTT' && !pttPressedRef.current) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // --- Noise Gate (RMS Calculation) ---
        // Only apply Gate in VAD mode. PTT bypasses gate because user intends to speak.
        if (inputModeRef.current === 'VAD') {
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          
          if (rms < inputThresholdRef.current) {
             return; 
          }
        }

        const pcmInt16 = float32ToInt16PCM(inputData);
        const pcmUint8 = new Uint8Array(pcmInt16.buffer);
        const base64Data = uint8ArrayToBase64(pcmUint8);
        
        // Track send time for latency
        lastSendTimeRef.current = Date.now();

        sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Data
            }
          });
        });
      };

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to initialize session");
      setConnectionState(ConnectionState.ERROR);
    }
  }, [apiKey, ensureAudioContexts, isMuted, setOutputDevice]);

  const disconnect = useCallback(() => {
    ambienceRef.current.stop();

    // Stop Recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Process recording
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    scheduledSourcesRef.current.forEach(s => {
       try { s.stop(); } catch(e) {}
    });
    scheduledSourcesRef.current.clear();

    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
      sessionRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setVolume({ input: 0, output: 0 });
    setLatency(0);
    setIsAiSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return {
    connectionState,
    error,
    connect,
    disconnect,
    volume,
    isMuted,
    toggleMute,
    transcript,
    audioUrl,
    startTime,
    latency,
    markers, // Exposed markers
    addMarker, // Exposed add function
    isAiSpeaking, 
    availableInputs,
    availableOutputs,
    setOutputDevice,
    setInputThreshold,
    setInputMode,
    setPttPressed,
    inputAnalyser: analyserInRef.current,
    outputAnalyser: analyserOutRef.current,
  };
};
