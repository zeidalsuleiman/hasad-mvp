# HASAD AI Assistant Specification

## Goal
Provide grounded, farmer-friendly answers using local project knowledge and farm-specific context.

## Current assistant state
Implemented now:
- session-based assistant chat
- per-farm chat history
- persisted chat sessions/messages
- grounded context from farm/weather/irrigation/disease/crop
- assistant UI integrated into dashboard

Not fully implemented yet:
- full RAG over curated agronomy documents
- advanced retrieval ranking
- multi-step agentic orchestration

## Allowed context sources
1. Local agronomy documents
2. Current farm profile
3. Current crop config
4. Latest weather result
5. Latest irrigation recommendation
6. Latest disease assessment
7. Prior messages in the current chat session

## Rules
- Prefer grounded answers over generic advice
- If farm-specific context is missing, say what is missing
- Use simple language
- Do not fabricate unsupported recommendations
- Store chat sessions and messages in database
- Keep responses readable for non-technical farmers

## Current UX expectations
- assistant chat is accessible from dashboard
- chat area is scrollable
- users can start a new chat
- users can view previous sessions
- sessions are farm-specific in the UI
- assistant replies are persisted

## Future RAG phase
The next assistant upgrade should:
- retrieve from curated agronomy/project knowledge
- combine retrieved knowledge with live farm context
- improve citation/grounding quality
- remain bounded by available evidence

## Future agentic phase
Later, the assistant may orchestrate tools such as:
- weather
- irrigation
- disease
- reports

But that is not part of the current assistant spec.