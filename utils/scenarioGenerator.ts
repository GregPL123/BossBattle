
import { GoogleGenAI, Type } from "@google/genai";
import { Scenario, Language } from "../types";

export async function generateScenarioFromPrompt(
  apiKey: string, 
  userPrompt: string,
  lang: Language = 'en'
): Promise<Scenario> {
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert negotiation simulation designer. 
    Create a challenging, realistic roleplay scenario based on the user's input: "${userPrompt}".
    
    The scenario must be designed for a voice-based training app where the user talks to an AI Boss.
    
    CRITICAL: All fields (name, description, objectives, systemInstruction) must be in ${lang === 'pl' ? 'Polish' : 'English'}.
    
    Requirements:
    1. Create a distinct "Boss" persona (Name, Role, Personality).
    2. Define a conflict or negotiation goal.
    3. Set appropriate difficulty, duration, and ambience.
    4. Create 3 specific, actionable objectives for the user to win.
    5. Write a System Instruction that forces the AI to stay in character, be skeptical, and speak concisely.

    Choose a voice from: 'Kore' (Assertive Female), 'Fenrir' (Deep Male), 'Puck' (Playful/Trickster), 'Charon' (Authoritative/Older), 'Aoede' (Soft/Formal).
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
            name: { type: Type.STRING, description: "Title like 'Vs. VP Johnson'" },
            description: { type: Type.STRING, description: "Short context briefing" },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "Extreme"] },
            voiceName: { type: Type.STRING, enum: ["Kore", "Fenrir", "Puck", "Charon", "Aoede"] },
            durationMinutes: { type: Type.INTEGER },
            ambience: { type: Type.STRING, enum: ["quiet", "office", "intense"] },
            objectives: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            systemInstruction: { type: Type.STRING, description: "Full prompt for the AI Boss" }
          },
          required: ["name", "description", "difficulty", "voiceName", "durationMinutes", "ambience", "objectives", "systemInstruction"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from scenario generator");
    
    const data = JSON.parse(jsonText);

    return {
      id: `gen-${Date.now()}`,
      ...data
    } as Scenario;

  } catch (error) {
    console.error("Scenario generation failed:", error);
    throw new Error("Failed to generate scenario. Please try a different prompt.");
  }
}
