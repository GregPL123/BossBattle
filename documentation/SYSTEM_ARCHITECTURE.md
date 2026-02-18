# BossBattle AI - Technical Documentation

## 1. Executive Summary
BossBattle AI is a real-time voice sparring application designed for workplace negotiation training. It allows users to practice high-stakes conversations (salary reviews, conflict resolution, resignations) against an AI persona.

*   **Target Audience:** Professionals, managers, and career-advancement seekers.
*   **Core Value Proposition:** High-fidelity psychological training using low-latency voice AI to build muscle memory for difficult professional dialogues.
*   **Business Model:** B2C (Freemium/Subscription) and B2B (Corporate training licenses).

## 2. Product Scope
### Core Features (MVP)
*   **Real-time Voice Engine:** Low-latency verbal interaction with personality-driven AI.
*   **Performance Analysis:** Comprehensive post-session reporting with "Tactical Rewrites" and "Tension Arcs."
*   **Gamification:** Leveling system, XP progression, and unlockable professional titles.
*   **Scenario Engine:** Preset scenarios plus prompt-based custom scenario generation.
*   **Cloud Sync:** Cross-device progress via Firebase.

### Roadmap
*   **Video Integration:** Face-to-face AI sparring (Avatar/Video).
*   **Peer Review:** Optional feedback from high-level community members.
*   **Enterprise Dashboard:** Team-wide negotiation skill tracking.

### Non-Goals
*   General-purpose chatbot functionality.
*   Direct legal or HR mediation (educational purposes only).

## 3. High-Level Architecture
BossBattle AI follows a **Decentralized Client-Heavy Architecture**. 

### System Context
The user interacts via a web interface. The system integrates directly with Google Gemini for intelligence and Firebase for persistence.

### Containers
1.  **Frontend (React/TypeScript SPA):** Handles audio signal processing, voice activity detection (VAD), local state, and visualization.
2.  **AI Layer (Google Gemini 2.5 Flash Native Audio):** Provides real-time STT (Speech-to-Text), LLM reasoning, and TTS (Text-to-Speech) in a single unified stream.
3.  **Persistence Layer (Firebase Firestore):** Stores user profiles, history, and community scenarios.
4.  **Auth Layer (Firebase Auth):** Manages Google OAuth.

## 4. Technology Stack
*   **Frontend:** React 19, Tailwind CSS (UI), Lucide/DiceBear (Assets).
*   **Voice AI:** `@google/genai` (Gemini Live API).
*   **Backend-as-a-Service:** Firebase (Firestore, Auth).
*   **Audio Processing:** Web Audio API (ScriptProcessor/AnalyserNodes).
*   **Deployment:** Vercel / Firebase Hosting.

## 5. Data Model Overview
### Core Entities
*   **User Profile:** `uid`, `xp`, `level`, `achievements[]`, `currentStreak`, `lastPlayedDate`.
*   **History Entry:** `id`, `scenarioId`, `score`, `transcript[]`, `analysisResult` (JSON).
*   **Scenario:** `id`, `name`, `systemInstruction`, `difficulty`, `voiceConfig`.
*   **Community Scenario:** `authorId`, `likes`, `downloads`.

## 6. API Overview
### Domains
*   **Voice (Live API):** WebSocket connection to Gemini 2.5 endpoint for multi-modal streaming.
*   **Data (Firebase SDK):** Standard CRUD operations for user data and shared scenarios.
*   **Analysis (REST-like Content Generation):** Async call to Gemini to review transcripts post-session.

## 7. Security Considerations
*   **API Protection:** Environment variables for keys. Client-side restricted keys (restricted by Referrer/App Check).
*   **Authorization:** Firestore Security Rules enforce that users can only read/write their own `users/{uid}` records.
*   **Privacy:** Transcripts are stored for user review; PII scrubbing is recommended for production.

## 8. Scalability & Performance
*   **Latency Assumption:** Target <300ms turn-taking latency. Achieved via Gemini Native Audio (bypassing separate STT/TTS chains).
*   **Scaling Strategy:** Entirely serverless. Firebase scales horizontally; Gemini API handles high concurrency.
*   **Bottlenecks:** Browser-side audio buffer processing on low-end devices.

## 9. Operational Model
*   **Environments:** Dev (Local), Prod (Managed hosting).
*   **CI/CD:** Automated deployment via GitHub Actions.
*   **Monitoring:** Firebase Analytics for user retention; Console logs for AI session errors.

## 10. Risks & Technical Debt
*   **Live API Stability:** Gemini Live is in preview; breaking SDK changes are possible.
*   **Client-Side AI Orchestration:** Handling the WebSocket state machine purely in React can become complex; moving to a dedicated XState machine is a suggested refactor.
*   **Audio Standards:** Reliance on `ScriptProcessorNode` (deprecated) vs `AudioWorklet` (modern).

## 11. Architecture Decision Records (ADR)

### ADR 001: Direct Client-to-AI Connection
*   **Context:** Need for lowest possible latency in voice conversation.
*   **Decision:** Connect the browser directly to the Gemini Live API via the SDK.
*   **Consequence:** Eliminates backend hop; requires careful management of API keys on the frontend.

### ADR 002: Firebase as Primary Persistence
*   **Context:** Fast-moving startup requires minimal infrastructure management.
*   **Decision:** Use Firebase for Auth and Firestore.
*   **Consequence:** Rapid feature delivery; potential for vendor lock-in.

### ADR 003: Unified Audio Processing
*   **Context:** User must feel the "weight" of the conversation visually.
*   **Decision:** Use Web Audio API for real-time Fourier analysis of both user and AI streams.
*   **Consequence:** High CPU usage during session; enables high-fidelity HUD visualizations.
