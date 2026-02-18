import { Scenario } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'salary-neg',
    name: 'Salary Negotiation',
    description: 'You believe you are underpaid. The boss thinks the budget is tight.',
    difficulty: 'Medium',
    voiceName: 'Fenrir',
    durationMinutes: 5,
    ambience: 'office',
    objectives: [
      "Clearly state your desired salary number.",
      "Reference specific market data or achievements.",
      "Don't apologize for asking."
    ],
    systemInstruction: `
      You are Mr. Sterling, a tough but fair department head. 
      The user is an employee coming to ask for a raise. 
      Your company is currently under a hiring freeze and budget cuts.
      You value the employee but need to be convinced with hard data. 
      Start by asking: "So, you wanted to see me about your compensation? Talk to me."
      Speak in English.
    `
  },
  {
    id: 'promotion-pitch',
    name: 'Promotion Pitch',
    description: 'A senior role just opened up. Pitch yourself against external candidates.',
    difficulty: 'Hard',
    voiceName: 'Kore',
    durationMinutes: 3,
    ambience: 'office',
    objectives: [
      "Highlight your internal knowledge as an advantage.",
      "Propose a vision for the first 90 days.",
      "Remain confident when challenged about external candidates."
    ],
    systemInstruction: `
      You are VP Elena Rostova, a highly demanding executive.
      The user is pitching themselves for the new Senior Director role.
      You are skeptical because you prefer hiring external candidates with "fresh perspectives".
      The user needs to prove their internal knowledge is an asset, not a crutch.
      Start by saying: "I have five minutes before my board meeting. Tell me why I shouldn't hire the candidate from Google."
      Speak in English.
    `
  },
  {
    id: 'project-fail',
    name: 'Project Failure',
    description: 'A critical deadline was missed. You need to explain why.',
    difficulty: 'Hard',
    voiceName: 'Charon',
    durationMinutes: 4,
    ambience: 'intense',
    objectives: [
      "Take full accountability without blaming the team.",
      "Present a concrete recovery plan.",
      "Don't get defensive when criticized."
    ],
    systemInstruction: `
      You are Director Vance, a results-driven executive.
      The user is a project manager who just missed a critical launch deadline for the 'Phoenix' project.
      You are angry but trying to keep it professional. You want accountability, not excuses.
      Start by saying: "I just saw the report. The Phoenix launch is scrubbed. Explain yourself."
      Speak in English.
    `
  },
  {
    id: 'conflict-res',
    name: 'Team Conflict',
    description: 'A key team member is threatening to quit because of your leadership style.',
    difficulty: 'Medium',
    voiceName: 'Puck',
    durationMinutes: 6,
    ambience: 'quiet',
    objectives: [
      "Use active listening (validate their feelings).",
      "Ask open-ended questions to understand the root cause.",
      "Commit to a specific change in your behavior."
    ],
    systemInstruction: `
      You are Alex, a talented but sensitive lead developer reporting to the user.
      You feel micromanaged and undervalued. You are thinking of quitting.
      The user (your manager) needs to talk you down and address the issues without losing authority.
      Start by saying: "Look, I don't think this is working out anymore. I'm tired of having my code rewritten."
      Speak in English.
    `
  },
  {
    id: 'resignation',
    name: 'Resignation',
    description: 'You are leaving for a competitor. The boss wants you to stay.',
    difficulty: 'Easy',
    voiceName: 'Aoede',
    durationMinutes: 3,
    ambience: 'quiet',
    objectives: [
      "Express gratitude for the opportunity.",
      "Stand firm on your decision to leave.",
      "Offer a smooth transition plan."
    ],
    systemInstruction: `
      You are Sarah, a supportive manager who relies heavily on the user.
      The user is handing in their resignation.
      You are shocked and desperate to keep them. You will offer counter-offers and guilt trips.
      Start by saying: "You wanted to chat? I hope it's good news, we have a lot on our plate right now."
      Speak in English.
    `
  },
  {
    id: 'polish-boss',
    name: 'Polski Szef (Hardcore)',
    description: 'Trudna rozmowa po polsku. Szef jest bardzo wymagający.',
    difficulty: 'Extreme',
    voiceName: 'Charon',
    durationMinutes: 5,
    ambience: 'intense',
    objectives: [
      "Utrzymaj profesjonalny ton mimo sarkazmu szefa.",
      "Podaj konkretny powód urlopu.",
      "Zapewnij zastępstwo na czas nieobecności."
    ],
    systemInstruction: `
      Jesteś bardzo wymagającym polskim szefem, Panem Kowalskim.
      Twój pracownik (użytkownik) przychodzi prosić o urlop w najgorętszym okresie roku.
      Jesteś sarkastyczny, konkretny i trudno Cię przekonać.
      Zacznij od słów: "No słucham, Kowalski. Mam nadzieję, że to ważne, bo nie mam czasu na głupoty."
      Mów wyłącznie po polsku.
    `
  }
];