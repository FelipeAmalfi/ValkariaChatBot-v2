---
layout: home

hero:
  name: ValkáriaV2
  text: RPG Chatbot with Intelligent NPCs
  tagline: Microservices monorepo — LangGraph AI pipeline — Dark Fantasy UI
  actions:
    - theme: brand
      text: Architecture
      link: /architecture/overview
    - theme: alt
      text: Getting Started
      link: /development/getting-started

features:
  - title: Narrative Authentication
    details: Players authenticate by describing their character's backstory — no passwords, full RPG immersion. Cosine similarity threshold 0.6.
  - title: LangGraph Pipeline
    details: 16-node state machine with 24 intents. Every conversation turn loads state from PostgreSQL, runs the graph, and persists back.
  - title: Microservices Monorepo
    details: auth-service, chat-service, world-service, ingestion-worker — independently deployable, shared packages via npm workspaces.
---
