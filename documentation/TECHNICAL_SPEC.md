# Specyfikacja Techniczna - BossBattle AI

## 1. Architektura Systemu
Aplikacja opiera się na architekturze **Client-Centric Real-time**, gdzie większość logiki przetwarzania sygnału audio odbywa się bezpośrednio w przeglądarce użytkownika.

### 1.1 Przetwarzanie Audio (Audio Pipeline)
- **Input:** Przechwytywanie strumienia z mikrofonu przez `getUserMedia`.
- **VAD (Voice Activity Detection):** Autorski algorytm RMS wyliczany w `ScriptProcessorNode` z konfigurowalną bramką szumu (`Noise Gate`).
- **Encoding:** Konwersja Float32 do Int16 PCM (16kHz) przesyłana przez WebSockets do Gemini.
- **Output:** Dekodowanie surowych bajtów PCM (24kHz) z Gemini i harmonogramowanie ich w `AudioContext` za pomocą `nextStartTime` w celu uniknięcia przerw w dźwięku.

### 1.2 Integracja AI (Gemini Live API)
Używamy modelu `gemini-2.5-flash-native-audio-preview-12-2025` w trybie multimodalnym.
- **Modality:** AUDIO (Single modality).
- **System Instruction:** Dynamicznie wstrzykiwana na podstawie wybranego scenariusza i poziomu gracza.
- **Turn-taking:** Model jest instruowany, aby zawsze zaczynać rozmowę.

### 1.3 Analiza Sesji (Post-Match Analysis)
Po zakończeniu rozmowy, cały transcript jest przesyłany do modelu `gemini-3-pro-preview` z predefiniowanym schematem JSON (`responseSchema`), co gwarantuje strukturalną i powtarzalną informację zwrotną.

## 2. Model Danych (Firestore)
- `/users/{uid}`: Profil użytkownika (XP, Level, Skills, Achievements).
- `/community_scenarios/{id}`: Scenariusze udostępnione przez społeczność (Likes, Downloads).

## 3. Bezpieczeństwo
- Klucze API są wstrzykiwane przez `process.env`.
- Firebase Security Rules ograniczają zapisy tylko do własnych dokumentów użytkownika (`request.auth.uid == userId`).
