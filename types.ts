
export type Language = 'en' | 'pl';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  objectives: string[]; // Specific goals for the user
  durationMinutes: number; // Time limit for the negotiation
  ambience?: 'quiet' | 'office' | 'intense'; // Background noise type
  isDaily?: boolean; // Bonus XP flag
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export type InputMode = 'VAD' | 'PTT';

export interface AudioVolumeState {
  inputVolume: number;
  outputVolume: number;
}

export interface TranscriptItem {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isPartial: boolean;
  timestamp: number;
}

export interface AnalysisMetrics {
  clarity: number;
  persuasion: number;
  empathy: number;
  resilience: number;
}

export interface CriticalMoment {
  quote: string;
  feedback: string;
  type: 'Positive' | 'Negative';
}

export interface ObjectiveResult {
  objective: string;
  completed: boolean;
  feedback: string;
}

export interface ImprovementSuggestion {
  context: string;
  userSaid: string;
  betterResponse: string;
  reason: string;
}

export interface SentimentPoint {
  segment: string;
  score: number; // -5 to +5
  reason: string;
}

export interface AnalysisResult {
  score: number;
  metrics: AnalysisMetrics;
  feedback: string;
  strengths: string[];
  improvements: string[];
  criticalMoments: CriticalMoment[];
  objectiveResults: ObjectiveResult[];
  suggestions: ImprovementSuggestion[];
  sentimentTrend: SentimentPoint[];
  markers?: number[]; 
  outcome: 'Success' | 'Failure' | 'Neutral';
  timedOut?: boolean;
}

export interface HistoryEntry extends AnalysisResult {
  id: string;
  scenarioName: string;
  timestamp: number;
  feedbackShort: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  bonusType: 'xp' | 'clarity' | 'persuasion' | 'empathy' | 'resilience';
  bonusValue: number;
}

export interface UserProfile {
  xp: number;
  level: number;
  title: string;
  activeTitle?: string; // Newly added: allow user to select active title
  battlesWon: number;
  battlesLost: number;
  achievements: string[]; 
  skills: string[]; 
  skillPoints: number;
  avatarSeed?: string;
  currentStreak: number;
  lastPlayedDate: string;
}
