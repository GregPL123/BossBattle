
import { HistoryEntry, AnalysisResult, Scenario, UserProfile, BossRelation } from '../types';
import { getInitialProfile, calculateLevel, getTitle, SKILL_TREE } from './gamification';

const PROFILE_KEY = 'boss_battle_profile';
const HISTORY_KEY = 'boss_battle_history';
const CUSTOM_SCENARIOS_KEY = 'boss_battle_custom_scenarios';

export const getUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return getInitialProfile();
    const parsed = JSON.parse(data);
    if (!parsed.bossMemories) parsed.bossMemories = {};
    if (!parsed.globalTraits) parsed.globalTraits = [];
    if (!parsed.skills) parsed.skills = [];
    if (parsed.skillPoints === undefined) parsed.skillPoints = 0;
    return parsed;
  } catch (e) {
    return getInitialProfile();
  }
};

export const unlockSkill = (skillId: string): UserProfile => {
  const profile = getUserProfile();
  const skill = SKILL_TREE.find(s => s.id === skillId);
  
  if (skill && profile.skillPoints >= skill.cost && !profile.skills.includes(skillId)) {
    profile.skillPoints -= skill.cost;
    profile.skills.push(skillId);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
  return profile;
};

export const updateUserProfile = (
  xpGain: number, 
  won: boolean,
  newAchievements: string[] = [],
  analysis?: AnalysisResult,
  scenarioId?: string,
  currentStage: number = 1
): { profile: UserProfile, leveledUp: boolean } => {
  const profile = getUserProfile();
  const oldLevel = profile.level;
  
  profile.xp += xpGain;
  profile.level = calculateLevel(profile.xp);
  
  if (profile.level > oldLevel) {
    profile.skillPoints += (profile.level - oldLevel);
  }
  
  profile.title = getTitle(profile.level);
  
  if (won) profile.battlesWon += 1;
  else profile.battlesLost += 1;

  if (analysis && scenarioId) {
    const prev = profile.bossMemories[scenarioId] || { memory: "", reputation: 0, lastEncounter: 0, highestStage: 1, highestScore: 0, discoveredWeaknesses: [] };
    
    const nextStage = won ? Math.max(prev.highestStage || 1, currentStage + 1) : (prev.highestStage || 1);

    // Merge weaknesses
    const mergedWeaknesses = Array.from(new Set([...(prev.discoveredWeaknesses || []), ...(analysis.discoveredWeaknesses || [])]));

    profile.bossMemories[scenarioId] = {
      memory: analysis.bossMemory,
      reputation: Math.max(-100, Math.min(100, prev.reputation + analysis.reputationChange)),
      lastEncounter: Date.now(),
      highestStage: nextStage,
      highestScore: Math.max(prev.highestScore || 0, analysis.score),
      discoveredWeaknesses: mergedWeaknesses
    };

    analysis.discoveredTraits.forEach(trait => {
      if (!profile.globalTraits.includes(trait)) {
        profile.globalTraits.push(trait);
      }
    });
  }

  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return { profile, leveledUp: profile.level > oldLevel };
};

export const saveHistory = (scenario: Scenario, result: AnalysisResult) => {
  const history = getHistory();
  const entry: HistoryEntry = {
    ...result,
    id: Date.now().toString(),
    timestamp: Date.now(),
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    feedbackShort: result.feedback.substring(0, 100) + "..."
  };
  history.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
};

export const getHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Added missing clearHistory function to allow clearing locally stored session history
export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

// Added missing getCustomScenarios function to retrieve user-generated scenarios from local storage
export const getCustomScenarios = (): Scenario[] => {
  try {
    const data = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Added missing saveCustomScenario function to persist user-generated scenarios locally
export const saveCustomScenario = (scenario: Scenario) => {
  const scenarios = getCustomScenarios();
  if (!scenarios.find(s => s.id === scenario.id)) {
    scenarios.push(scenario);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(scenarios));
  }
};
