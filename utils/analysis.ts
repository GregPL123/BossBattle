
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
    .map(t => `${t.role === 'user' ? 'Employee' : 'Boss'}: ${t.text}`)
    .join('\n');

  if (!dialogue) {
    throw new Error("No conversation to analyze.");
  }

  const objectives = scenario.objectives || ["Maintain professionalism", "Communicate clearly", "Achieve the goal"];

  const prompt = `
    Analyze the following negotiation roleplay based on the scenario: "${scenario.name}".
    Roleplay Context: ${scenario.description}
    
    The user played the 'Employee'. The AI played the 'Boss'.

    CRITICAL: Provide all text fields (feedback, strengths, improvements, suggestions, sentiment reasons, objective feedback) in ${lang === 'pl' ? 'Polish' : 'English'}.

    Mission Objectives to Verify:
    ${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}
    
    Evaluate the Employee's performance on:
    1. Metrics (0-100): Clarity, Persuasion, Empathy, Resilience.
    2. Objectives: Did they satisfy each mission objective listed above?
    3. Critical Moments: Identify 1-3 key quotes.
    4. Tactical Rewrites: Identify 1-2 weak responses and provide a BETTER alternative in ${lang === 'pl' ? 'Polish' : 'English'}.
    5. Overall Outcome: Success/Failure/Neutral.

    Provide a JSON response.
    
    Conversation Transcript:
    ${dialogue}
  `;

  try {
    // Fixed: Using gemini-3-pro-preview for complex reasoning task as per guidelines
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
              },
              required: ["clarity", "persuasion", "empathy", "resilience"]
            },
            feedback: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalMoments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quote: { type: Type.STRING },
                  feedback: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ["Positive", "Negative"] }
                },
                required: ["quote", "feedback", "type"]
              }
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  context: { type: Type.STRING },
                  userSaid: { type: Type.STRING },
                  betterResponse: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["context", "userSaid", "betterResponse", "reason"]
              }
            },
            sentimentTrend: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                   segment: { type: Type.STRING },
                   score: { type: Type.INTEGER },
                   reason: { type: Type.STRING }
                },
                required: ["segment", "score", "reason"]
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
                  },
                  required: ["objective", "completed", "feedback"]
               }
            },
            outcome: { type: Type.STRING, enum: ["Success", "Failure", "Neutral"] }
          },
          required: ["score", "metrics", "feedback", "strengths", "improvements", "criticalMoments", "objectiveResults", "suggestions", "sentimentTrend", "outcome"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from analysis model");
    return JSON.parse(jsonText) as AnalysisResult;
  } catch (error) {
    console.error("Analysis failed:", error);
    return {
      score: 0,
      metrics: { clarity: 0, persuasion: 0, empathy: 0, resilience: 0 },
      feedback: lang === 'pl' ? "Nie można wygenerować analizy z powodu błędu." : "Could not generate analysis due to an error.",
      strengths: [],
      improvements: [],
      criticalMoments: [],
      suggestions: [],
      sentimentTrend: [],
      objectiveResults: [],
      outcome: 'Neutral'
    };
  }
}
