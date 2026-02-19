
import { UserProfile, Achievement, AnalysisResult, Scenario, Skill } from '../types';

export const TITLES = [
  "Intern", "Probationary", "Associate", "Senior Associate", "Team Lead",
  "Manager", "Director", "VP", "C-Suite", "CEO", "Chairman",
  "Master Negotiator", "Wolf of AI Street"
];

export const ARCHETYPES = {
  'The Tactician': { icon: '♟️', traits: ['Analytical', 'Concise'] },
  'The Steamroller': { icon: '🚜', traits: ['Aggressive', 'Assertive'] },
  'The Empath': { icon: '🌊', traits: ['Empathetic', 'Soft'] },
  'The Stone Wall': { icon: '🧱', traits: ['Defensive', 'Resilient'] },
  'The Silver Tongue': { icon: '🎙️', traits: ['Persuasive', 'Eloquent'] },
  'The Rambler': { icon: '🌀', traits: ['Rambling', 'Verbose'] }
};

export const XP_PER_LEVEL = 500;

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Complete your first session.', icon: '🩸' },
  { id: 'negotiator', name: 'The Negotiator', description: 'Win your first negotiation.', icon: '🤝' },
  { id: 'silver_tongue', name: 'Silver Tongue', description: 'Achieve a score of 90 or higher.', icon: '🥈' },
  { id: 'iron_will', name: 'Iron Will', description: 'Win a Hard difficulty scenario.', icon: '🛡️' },
  { id: 'godslayer', name: 'Godslayer', description: 'Win an Extreme difficulty scenario.', icon: '⚔️' },
  { id: 'resilient', name: 'Resilient', description: 'Finish a session despite a "Failure" outcome.', icon: '❤️‍🩹' },
  { id: 'veteran', name: 'Veteran', description: 'Reach Level 5.', icon: '⭐' },
  { id: 'streaker', name: 'Consistent', description: 'Reach a 3-day streak.', icon: '🔥' }
];

export const SKILL_TREE: Skill[] = [
  { id: 'mirroring_pro', name: 'Mirroring Expert', description: '+10% Clarity bonus in all sessions.', icon: '🪞', cost: 1, bonusType: 'clarity', bonusValue: 10 },
  { id: 'empathy_shield', name: 'Empathy Shield', description: '+10% Empathy bonus in intense scenarios.', icon: '🛡️', cost: 1, bonusType: 'empathy', bonusValue: 10 },
  { id: 'closer', name: 'The Closer', description: '+15% Persuasion bonus when closing.', icon: '🔨', cost: 2, bonusType: 'persuasion', bonusValue: 15 },
  { id: 'zen_master', name: 'Zen Master', description: '+10% Resilience during interruptions.', icon: '🧘', cost: 2, bonusType: 'resilience', bonusValue: 10 },
  { id: 'high_roller', name: 'High Roller', description: '+20% XP for Wins.', icon: '🎰', cost: 3, bonusType: 'xp', bonusValue: 20 },
];

export const calculateLevel = (xp: number): number => Math.floor(xp / XP_PER_LEVEL) + 1;
export const getTitle = (level: number): string => TITLES[Math.min(level - 1, TITLES.length - 1)];

export const getDifficultyMultiplier = (stage: number): number => {
  // Stage 1: 1.0x, Stage 2: 1.25x, Stage 3: 1.5x etc.
  return 1 + (stage - 1) * 0.25;
};

export const getArchetype = (traits: string[]) => {
  for (const [name, data] of Object.entries(ARCHETYPES)) {
    if (data.traits.some(t => traits.includes(t))) return { name, icon: data.icon };
  }
  return { name: 'The Unknown', icon: '👤' };
};

export const calculateXpGain = (score: number, outcome: 'Success' | 'Failure' | 'Neutral', difficulty: string, isDaily?: boolean, stage: number = 1): number => {
  let base = score * 2; 
  if (outcome === 'Success') base += 100;
  if (outcome === 'Failure') base += 20; 
  const diffMultiplier = difficulty === 'Medium' ? 1.2 : difficulty === 'Hard' ? 1.5 : difficulty === 'Extreme' ? 2.0 : 1;
  const stageMultiplier = 1 + (stage - 1) * 0.1; // 10% more XP per stage
  return Math.floor(base * diffMultiplier * stageMultiplier) + (isDaily ? 100 : 0);
};

export const checkNewAchievements = (currentProfile: UserProfile, result: AnalysisResult, scenario: Scenario): Achievement[] => {
  const newUnlocked: Achievement[] = [];
  const existingIds = new Set(currentProfile.achievements);
  const check = (id: string, condition: boolean) => {
    if (condition && !existingIds.has(id)) {
      const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
      if (ach) newUnlocked.push(ach);
    }
  };
  check('first_blood', true);
  check('negotiator', result.outcome === 'Success');
  check('silver_tongue', result.score >= 90);
  check('iron_will', result.outcome === 'Success' && scenario.difficulty === 'Hard');
  check('godslayer', result.outcome === 'Success' && scenario.difficulty === 'Extreme');
  return newUnlocked;
};

export const getInitialProfile = (): UserProfile => ({
  xp: 0, level: 1, title: TITLES[0], battlesWon: 0, battlesLost: 0,
  achievements: [], skills: [], skillPoints: 0, currentStreak: 0,
  lastPlayedDate: '', bossMemories: {}, globalTraits: []
});
