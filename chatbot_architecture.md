# Chatbot Module Architecture

This document provides a comprehensive architectural overview of the Chatbot Module, designed to assist in creating your hackathon presentation slides. 

## 1. High-Level Architecture Overview

The Chatbot module is a full-stack, AI-driven, multimodal assistant. It uses an **Agentic RAG (Retrieval-Augmented Generation)** approach, meaning the AI dynamically decides whether it needs to fetch external data (from the database or live APIs) to answer the user's query.

The architecture is split into three main layers:
1. **Frontend (React UI & Client Hooks)**
2. **Serverless Backend (Supabase Edge Functions)**
3. **Data & Integration Layer (Supabase Postgres & External APIs)**

---

## 2. Frontend Layer (React)

The frontend provides a rich, multimodal interface for the user, focusing on real-time streaming and voice capabilities.

* **UI Components (`ChatWindow`, `MessageBubble`)**: Displays the chat interface, citations (showing where the data came from), and handles typing animations via Server-Sent Events (SSE).
* **State Management (`useChat.js`)**: 
  * Manages chat sessions using `localStorage`.
  * Sends requests to the backend and consumes the streaming response chunk-by-chunk for near-zero perceived latency.
  * Persists completed chat logs to the Supabase `chat_logs` table for analytics.
* **Voice & Multilingual Handling (`useSpeech.js`)**:
  * **Speech-to-Text (STT)**: Allows users to speak their queries. It detects regional languages and routes the audio to the **Sarvam AI STT** Edge Function for accurate Indian language transcription.
  * **Text-to-Speech (TTS)**: Reads the bot's response aloud. It dynamically routes Hindi/Marathi (Devanagari script) to the **Sarvam AI TTS** Edge Function for high-quality, natural-sounding regional voices, while falling back to the Browser's Native TTS for English/Hinglish to minimize latency.

---

## 3. Backend Layer (Supabase Edge Functions)

The core intelligence of the chatbot resides in a highly resilient, serverless Deno environment.

### A. The LLM Engine (`chat-handler/llm.ts`)
The backend uses **Google Gemini** as the primary intelligence engine, orchestrated with a robust cascading fallback system to ensure 100% uptime:
1. **Primary Model**: `gemini-flash-lite-latest` (Optimized for blazingly fast streaming responses, ~1-2s latency).
2. **Fallback 1**: `gemini-3.5-flash` (If the lite model is unavailable).
3. **Fallback 2**: `gemini-3.6-flash` (Heavier model).
4. **Fallback 3**: `Groq API (Qwen 3.8-27b)` (A secondary provider triggered only if Google's entire API goes down).

### B. Agentic RAG & Tool Calling
Instead of just answering from static training data, the LLM is equipped with "Tools" (Function Calling). When a user asks a question, the AI decides which tool to use. 

**Data Fetching Flow (`db_queries.ts`)**:
1. **Database-First Strategy**: The system always attempts to query the Supabase PostgreSQL database first (e.g., checking the `observations` table for the latest weather). This ensures fast, localized, and cheap data retrieval.
2. **Live API Fallback**: If the required data is missing, stale, or the location is unknown in the DB, the system automatically falls back to live external APIs (like Open-Meteo for Geocoding and Weather). 
3. **Synthesis**: The fetched JSON data is returned to the LLM, which then synthesizes it into a natural, conversational response for the user.

---

## 4. Multilingual Capabilities

The chatbot is strictly designed to respect the linguistic diversity of the users (e.g., Indian farmers).

* **Strict Language Prompting**: The LLM is given system instructions to reply in the *exact same language and script* as the user. If the user asks in Marathi, it replies in Marathi (without digits). If asked in English, it can use English/Hinglish.
* **Dynamic Language Tagging**: The LLM injects a hidden `[LANG: xx-IN]` tag into the stream.
* **Frontend Extraction**: The frontend intercepts this tag, removing it from the visual UI, and uses it to automatically configure the correct TTS voice (e.g., triggering Sarvam TTS for Marathi, Native TTS for English).

---

## 5. Integration with Other Modules

The chatbot does not operate in a silo; it is the central interface that surfaces data from all other modules in the system via the shared Supabase Postgres Schema (`init_schema.sql`).

* **Weather Module Integration**: 
  * The Weather module runs cron jobs to populate the `observations` and `forecasts` tables.
  * The Chatbot queries these tables first when a user asks for weather conditions, ensuring consistency across the app.
* **Alerts Module Integration**: 
  * The Alerts module manages the `alerts` table (utilizing PostGIS geometry for region-based alerts).
  * The Chatbot can query this table to warn users if their specific location is under a Severe or Extreme weather alert.
* **Farmer/Agricultural Module Integration**: 
  * The Farmer module defines `crop_stage_rules` (e.g., "If raining > 20mm, advise against spraying pesticide").
  * The Chatbot executes the `getCropAdvisory` tool, cross-referencing the user's requested crop against the weather rules to provide tailored farming advice.
* **Analytics**:
  * Every query, response, source citation, and language used is logged in the `chat_logs` table, allowing administrators to see exactly how users are interacting with the system.
