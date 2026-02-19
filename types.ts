
export type Language = 'en' | 'pl';

export type BossMood = 'Analytical' | 'Impatient' | 'Impressed' | 'Neutral';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  bonusType: string;
  bonusValue: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  systemInstruction: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  voiceName?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede';
  objectives: string[];
  durationMinutes: number;
  ambience?: 'quiet' | 'office' | 'intense';
  isDaily?: boolean;
  stage?: number; 
  totalStages?: number;
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
}

export type InputMode = 'VAD' | 'PTT';

export interface TacticalInsight {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
  timestamp: number;
  mood?: BossMood;
}

export interface TranscriptItem {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isPartial: boolean;
  timestamp: number;
}

export interface SentimentPoint {
  score: number;
  segment: string;
  reason: string;
  timestamp: number; 
}

export interface TimestampedAdvice {
  timestamp: number;
  title: string;
  advice: string;
  type: 'tactical' | 'emotional' | 'linguistic';
}

export interface ObjectiveResult {
  objective: string;
  completed: boolean;
  feedback: string;
}

export interface TacticalSuggestion {
  userSaid: string;
  betterResponse: string;
  reasoning: string;
  audioData?: string; 
}

export interface AnalysisResult {
  score: number;
  metrics: {
    clarity: number;
    persuasion: number;
    empathy: number;
    resilience: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  bossMemory: string;
  reputationChange: number;
  discoveredTraits: string[];
  discoveredWeaknesses?: string[];
  userNeuralPatterns?: string[]; 
  outcome: 'Success' | 'Failure' | 'Neutral';
  objectiveResult: ObjectiveResult[];
  suggestions: TacticalSuggestion[];
  sentimentTrend: SentimentPoint[];
  timestampedAdvice: TimestampedAdvice[];
  medals?: { id: string; label: string; icon: string; description: string }[];
  markers?: number[];
  timedOut?: boolean;
  nextStageUnlocked?: boolean;
}

export interface HistoryEntry extends AnalysisResult {
  id: string;
  timestamp: number;
  scenarioId: string;
  scenarioName: string;
  feedbackShort: string;
}

export interface BossRelation {
  memory: string;
  reputation: number;
  lastEncounter: number;
  highestStage: number;
  highestScore: number;
  discoveredWeaknesses?: string[];
}

export interface UserProfile {
  xp: number;
  level: number;
  title: string;
  activeTitle?: string;
  battlesWon: number;
  battlesLost: number;
  achievements: string[];
  skills: string[];
  skillPoints: number;
  currentStreak: number;
  lastPlayedDate: string;
  bossMemories: Record<string, BossRelation>;
  globalTraits: string[];
  userPatterns?: string[]; 
  avatarSeed?: string;
}
