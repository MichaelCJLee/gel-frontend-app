# GenOne - Conversational AI Assistant Project Brief

## 📍 Project Overview

**Project Name**: GenOne  
**Project Type**: Conversational AI Assistant for Enterprise  
**Target Users**: Business Analysts and Product Managers (Non-technical)  
**Deployment**: OneNZ Infrastructure (Pilot)  

GenOne is a deployable conversational AI assistant for requirement story generation, built specifically for **non-technical enterprise users**. It enables BAs and PMs to transform unstructured documentation (e.g., Confluence, Khub, ADO) into structured user stories — directly through chat, without needing IDE access or engineering support.

## 🎯 Vision & Purpose

### Vision
We envision a future where enterprise product delivery begins with chat: where BAs can generate backlog-ready stories from internal documentation in minutes — standardised, structured, and ready for planning.

### Purpose
Enable **BAs and PMs to self-serve requirement story generation** by removing technical entry barriers, embedding orchestration in a conversational UI, and aligning outputs with internal planning tools like ADO.

## 🚀 Business Objectives

### North Star
- Empower non-technical roles (e.g., BAs and PMs) to autonomously generate structured requirement stories through a conversational interface
- Establish agent-led story generation as a viable and scalable alternative to manual backlog writing
- Use this pilot to validate how lightweight orchestration agents can be embedded into real-world enterprise SDLC workflows

### Success Metrics
- ≥ 80% of generated stories meet usability and formatting thresholds defined in the BA playbook
- ≥ 90% of stories pass BA or delivery squad acceptance with minimal rework
- ≥ 50% reduction in time to create backlog-ready user stories
- At least 3 reusable orchestration or UX patterns captured and mapped to other journeys or agent deployments

## 🧑‍🤝‍🧑 Target Persona

**Pete – Business Analyst**
- **Goals**: A fast, consistent way to turn internal docs into clean, accepted user stories
- **Pain Points**: Manual story creation is time-consuming and inconsistent
- **Behavior**: Uses Confluence, ADO, Khub and email; prefers UI/chat-based workflows

## 💻 Technical Architecture

### System Components
1. **Frontend Application**: Next.js 15 (React 19) app statically exported and served from Cloud Run
2. **Backend API**: FastAPI app running LangGraph agents, hosted as a Cloud Run service
3. **Agent Layer**: LangGraph-based agent orchestration embedded in the backend
4. **Database Layer**: Self-hosted Supabase PostgreSQL with pgvector, containerized and deployed to Cloud Run
5. **Integration Layer**: MCP-based connectors to ingest documentation from Confluence, Khub, and ADO

### Technology Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, BlockNote
- **Backend**: FastAPI (Python 3.12), LangGraph, Custom LLM Factory abstraction
- **Database**: Supabase (PostgreSQL 15 + pgvector)
- **Authentication**: Supabase Auth (browser JWT)
- **LLM Providers**: Gemini 2.0 Flash, Claude 3.7, Llama 4, OpenAI, Ollama
- **Deployment**: Cloud Run (containerized, all-Cloud Run model)

## 🎨 Design Philosophy

### Visual Identity
- **Theme**: Black & white minimalistic design
- **UI Framework**: shadcn/ui with classic white and dark feel
- **User Experience**: ChatGPT-style conversational interface
- **Responsive**: Mobile-first, accessible design

### Key Features
- **Conversational UI**: Slash command-style prompt entry
- **Real-time Streaming**: Server-sent events for live agent responses
- **Activity Timeline**: Visualization of agent thinking steps and tool usage
- **Rich Text Support**: BlockNote editor for inline editing and review
- **HITL Capabilities**: Human-in-the-loop validation and editing

## 🔄 Core User Flows

### Scenario 1: Knowledge Q&A
User asks questions about documentation → Agent retrieves and scans relevant documents → Knowledge Synthesizer analyzes and generates comprehensive summary → Answer presented with reference links → HITL validation enables editing

### Scenario 2: Story Generation
User requests requirement story → Agent gathers context from multiple sources → BA Story Generator applies team playbook → Structured Gherkin-style story presented → HITL editing for refinement → Export to ADO or planning tools

### Scenario 3: Story Quality Review
User requests story review → Agent locates and evaluates story → Story Critic rates quality and provides feedback → User can accept, improve, or regenerate based on suggestions

## 🛠️ Implementation Phases

### Phase 1: Foundation (Current Task)
- Initialize Next.js 15 project with App Router
- Configure shadcn/ui with black/white theme
- Set up basic chat interface
- Implement streaming integration with FastAPI backend

### Phase 2: Core Features
- Build comprehensive activity timeline
- Add tool visualization and progress tracking
- Implement error handling and recovery
- Create responsive mobile experience

### Phase 3: Advanced Capabilities
- Add HITL editing and validation
- Implement story generation workflows
- Create export and integration features
- Performance optimization

### Phase 4: Enterprise Integration
- Deploy to OneNZ infrastructure
- Integrate with internal systems
- User acceptance testing
- Production rollout and monitoring

## 📊 Technical Requirements

### Performance Targets
- Q&A Prompt Response Time: ≤ 1.5 seconds
- Story Generation Latency: ≤ 3 minutes per prompt
- Orchestration Stability: ≥ 95% success rate
- Uptime (Pilot Scope): ≥ 99.9% during business hours

### Integration Points
- **Document Sources**: Confluence, ADO, Khub (.md exports)
- **Agent Engine**: 16 V7 multi-source tools for progressive search
- **Streaming Events**: Comprehensive event handling for real-time UI updates
- **Security**: Supabase Auth + JWT verification, GCP Secret Manager

## 🔐 Security & Compliance

- Supabase Auth + JWT verification (no passwords stored)
- Cloud Run ingress restricted (HTTPS only)
- No sensitive PII stored or logged unless encrypted
- Inline editing logs versioned for audit
- GCP IAM + Secret Manager used for deployment credentials

## 📈 Success Measures

### Immediate Goals (Pilot)
- Successfully deploy within OneNZ infrastructure
- Enable adoption by real BA users
- Demonstrate 50% reduction in backlog creation time
- Maintain story quality while improving speed

### Long-term Vision
- Expand to other enterprise contexts (MigrationX, Ignite Suite)
- Scale orchestration patterns across different teams
- Establish as standard tool for requirement story generation
- Build foundation for broader AI-native SDLC workflows

## 🎯 Current Focus

**Active Task**: Building ChatGPT-like conversational interface with real-time agent visualization
**Priority**: High
**Timeline**: Immediate development focus
**Key Deliverable**: Functional chat interface with activity timeline showing agent thinking steps

This project represents a strategic investment in AI-native tooling for enterprise product delivery, with the potential to transform how business analysts and product managers create structured requirements and stories. 