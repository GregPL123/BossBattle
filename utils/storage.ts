
import { HistoryEntry, AnalysisResult, Scenario, UserProfile } from '../types';
import { getInitialProfile, calculateLevel, getTitle } from './gamification';

const HISTORY_KEY = 'boss_battle_history';
const CUSTOM_SCENARIOS_KEY = 'boss_battle_custom_scenarios';
const PROFILE_KEY = 'boss_battle_profile';

// --- History Management ---

export const saveHistory = (scenario: Scenario, result: AnalysisResult) => {
  try {
    const existing = getHistory();
    // Fix: HistoryEntry extends AnalysisResult, so it requires the 'feedback' property.
    // We spread 'result' to include all required AnalysisResult fields and add HistoryEntry specific fields.
    const newEntry: HistoryEntry = {
      ...result,
      id: Date.now().toString(),
      scenarioName: scenario.name,
      timestamp: Date.now(),
      feedbackShort: result.feedback.substring(0, 120) + (result.feedback.length > 120 ? '...' : '')
    };
    
    const updated = [newEntry, ...existing].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (): HistoryEntry[] => {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

// --- Custom Scenarios Management ---

export const saveCustomScenario = (scenario: Scenario) => {
  try {
    const existing = getCustomScenarios();
    const updated = [scenario, ...existing];
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save custom scenario", e);
  }
};

export const getCustomScenarios = (): Scenario[] => {
  try {
    const data = localStorage.getItem(CUSTOM_SCENARIOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const deleteCustomScenario = (id: string) => {
  try {
    const existing = getCustomScenarios();
    const updated = existing.filter(s => s.id !== id);
    localStorage.setItem(CUSTOM_SCENARIOS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to delete custom scenario", e);
  }
};

// --- User Profile Management ---

export const getUserProfile = (): UserProfile => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    if (!data) return getInitialProfile();
    
    const parsed = JSON.parse(data);
    // Migration: Add fields if missing from old save
    if (!parsed.achievements) parsed.achievements = [];
    if (!parsed.skills) parsed.skills = [];
    if (typeof parsed.skillPoints === 'undefined') parsed.skillPoints = 0;
    if (typeof parsed.currentStreak === 'undefined') parsed.currentStreak = 0;
    if (!parsed.lastPlayedDate) parsed.lastPlayedDate = '';
    
    return parsed;
  } catch (e) {
    return getInitialProfile();
  }
};

export const updateUserProfile = (
  xpGain: number, 
  won: boolean,
  newAchievements: string[] = []
): { profile: UserProfile, leveledUp: boolean } => {
  const profile = getUserProfile();
  const oldLevel = profile.level;
  
  profile.xp += xpGain;
  const newLevel = calculateLevel(profile.xp);
  
  if (newLevel > oldLevel) {
    // Award 1 Skill Point per level up
    profile.skillPoints += (newLevel - oldLevel);
  }
  
  profile.level = newLevel;
  profile.title = getTitle(profile.level);
  
  if (won) profile.battlesWon += 1;
  else profile.battlesLost += 1;

  // Streak Logic
  const today = new Date().toISOString().split('T')[0];
  if (profile.lastPlayedDate !== today) {
     const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
     if (profile.lastPlayedDate === yesterday) {
        profile.currentStreak += 1;
     } else {
        const lastDate = new Date(profile.lastPlayedDate);
        const diffTime = Math.abs(new Date(today).getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 1) profile.currentStreak = 1; 
        else if (diffDays === 1) profile.currentStreak += 1;
     }
     if (profile.currentStreak === 0) profile.currentStreak = 1;
     profile.lastPlayedDate = today;
  }

  // Add new unique achievements
  newAchievements.forEach(id => {
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
    }
  });
  
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  
  return {
    profile,
    leveledUp: profile.level > oldLevel
  };
};
