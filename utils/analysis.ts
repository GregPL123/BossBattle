
import { GoogleGenAI, Type } from "@google/genai";
import { TranscriptItem, Scenario, AnalysisResult, Language } from "../types";

export async function generateAnalysis(
  apiKey: string, 
  transcript: TranscriptItem[], 
  scenario: Scenario,
  lang: Language = 'en'
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey });

  const dialogue = transcript
    .filter(t => !t.isPartial && t.text.trim())
    .map(t => `[Time: ${t.timestamp}] ${t.role === 'user' ? 'Employee' : 'Boss'}: ${t.text}`)
    .join('\n');

  const prompt = `
    Analyze the negotiation roleplay for scenario: "${scenario.name}".
    User = Employee, AI = Boss.
    Language: ${lang === 'pl' ? 'Polish' : 'English'}.

    Evaluation Criteria:
    - Objectives check: ${scenario.objectives.join(', ')}
    - Metrics (0-100): clarity, persuasion, empathy, resilience.
    - Neural Patterns: Identify specific psychological habits of the user (e.g., "Panic response", "Excessive justification", "Rising intonation on statements").
    - Weaknesses: Identify if the user discovered any "Vulnerabilities" of this boss during the chat.
    - Medals: Award 'Silver Tongue' if persuasion > 85, 'Zen Master' if resilience > 85, 'Empathy Expert' if empathy > 85.
    - Tactical Rewrites: Find 2-3 specific phrases the user used and rewrite them.

    Respond STRICTLY in JSON.

    Dialogue Transcript:
    ${dialogue}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            metrics: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.INTEGER },
                persuasion: { type: Type.INTEGER },
                empathy: { type: Type.INTEGER },
                resilience: { type: Type.INTEGER },
              }
            },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            userNeuralPatterns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific behavioral habits detected." },
            bossMemory: { type: Type.STRING },
            reputationChange: { type: Type.INTEGER },
            discoveredTraits: { type: Type.ARRAY, items: { type: Type.STRING } },
            discoveredWeaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            outcome: { type: Type.STRING, enum: ["Success", "Failure", "Neutral"] },
            medals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  description: { type: Type.STRING }
                }
              }
            },
            objectiveResults: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  objective: { type: Type.STRING },
                  completed: { type: Type.BOOLEAN },
                  feedback: { type: Type.STRING }
                }
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  userSaid: { type: Type.STRING },
                  betterResponse: { type: Type.STRING },
                  reasoning: { type: Type.STRING }
                }
              }
            },
            sentimentTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  score: { type: Type.INTEGER },
                  segment: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  timestamp: { type: Type.NUMBER }
                }
              }
            },
            timestampedAdvice: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timestamp: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  advice: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["tactical", "emotional", "linguistic"] }
                }
              }
            }
          },
          required: ["score", "metrics", "feedback", "bossMemory", "reputationChange", "discoveredTraits", "outcome", "objectiveResults", "suggestions", "sentimentTrend", "timestampedAdvice"]
        }
      }
    });

    return JSON.parse(response.text) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw error;
  }
}
