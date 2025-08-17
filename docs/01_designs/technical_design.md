## **1. 🎯 Purpose**

This TRD outlines the high-level technical requirements and architectural direction for **GenOne**, a scoped version of the AI-native orchestration assistant focused on enabling non-technical enterprise users to generate structured requirement stories from internal documentation through a conversational interface.

GenOne is designed for deployment within OneNZ infrastructure, using a containerized, all-Cloud Run model — including the static frontend, FastAPI orchestration backend, and a self-hosted Supabase Postgres database. This setup supports piloting the product with real BA users while validating deployment, performance, and adoption patterns in structured SDLC environments.

---

## **2. 🧩 System Overview**

The system follows a stateless, containerized architecture hosted fully on Cloud Run, with the following components:

1. **Frontend Application**: Next.js (React 19) app statically exported and served from Cloud Run
2. **Backend API**: FastAPI app running LangGraph agents, hosted as a Cloud Run service
3. **Agent Layer**: LangGraph-based agent orchestration embedded in the backend
4. **Database Layer**: Self-hosted Supabase PostgreSQL with pgvector, containerized and deployed to Cloud Run with VPC networking
5. **Integration Layer**: MCP-based connectors to ingest documentation from Confluence, Khub, and ADO

### **Frontend**

- **Framework**: Next.js 15 (App Router) with next export
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Component Library**: shadcn/ui (black theme)
- **Text Editor**: BlockNote
- **Routing**: App Router
- **Hosting**: Static build deployed to Cloud Run (using serve or equivalent)
- **Authentication**: Supabase Auth (browser JWT)

### **Backend**

- **Framework**: FastAPI (Python 3.12)
- **Agent Engine**: LangGraph
- **LLM Provider Layer**: Custom LLM Factory abstraction
- **Authentication**: Supabase JWT verification
- **Logging**: Structured request logs with trace IDs
- **Hosting**: Cloud Run service with autoscaling (min 0)

### **Database**

- **Database Engine**: Supabase (PostgreSQL 15 + pgvector)
- **Deployment**: Self-hosted container on Cloud Run (optionally Cloud Run Jobs or long-lived container)
- **Networking**: Internal VPC access only
- **Local Dev**: Docker-based Supabase setup with seed scripts

### **LLM Integration**

- **Supported Providers**:
    - Gemini 2.0 Flash (fallback to Gemini 1.5)
    - Claude 3.7 via Databricks or Bedrock
    - Llama 4 via Databricks
    - OpenAI and Ollama (planned)
- **Credentials**: Stored in GCP Secret Manager and injected via env vars

### **External Integration**

- ADO Integration: MCP pipeline to retrieve .md from ADO for the ingested knowledges extracted from Confluence, ADO, and Khub

---

## **3. 🧠 Key Components**

### **3.1 Conversational UI**

- Slash command-style prompt entry
- Inline Markdown rendering for stories and summaries
- Editing support via rich text block editor (BlockNote)

### **3.2 Agent Orchestration Layer**

- LangGraph orchestrator with plug-in agent units
    - Knowledge Synthesizer
    - Story Filter
    - BA Story Generator
    - Story Critic
- Story generation aligned with internal requirement playbook

### **3.3 Memory & Context**

- Stateless orchestration by default
- Request-scoped metadata logging
- Optional project token/context tracking for reusability

### **3.4 Artefact Pipeline**

- Outputs: Markdown + Gherkin stories
- HITL: Inline editing, tagging, and review checkpoint
- Export: Clipboard export (no write-back to ADO in scope)

### **3.5 Factories**

- **LLM Factory**: Model abstraction + fallback
- **Agent Factory**: Modular task agents
- **MCP Factory**: Retrieval, parsing, and enrichment chain for .md content

---

## **4. 🛠️ Core Functional Requirements**

| **Ref** | **Requirement** |
| --- | --- |
| FR1 | Accept questions and story prompts via chat |
| FR2 | Retrieve and summarize knowledge across Confluence, ADO, Khub |
| FR3 | Generate structured Gherkin-style requirement stories |
| FR4 | Inline review + editing support for HITL validation |
| FR5 | Retrieve and filter existing stories for quality review |
| FR6 | Evaluate existing stories for structure, clarity, and completeness |
| FR7 | Log orchestration flow, output quality scores, and feedback loop metadata |

---

## **5. ⚙️ Integration Requirements**

### **5.1 External Tools**

- **Document Sources**: Confluence, ADO, Khub (.md exports) in ADO
- **CI/CD**: ADO pipeline → Cloud Build or gcloud CLI for deployment
- **Secrets**: Managed via GCP Secret Manager

### **5.2 LLM Integration**

- All LLM calls routed through LLM Factory
- Support for retry, fallback, and context truncation
- Embeddings stored in pgvector in Supabase

---

## **6. 🔐 Security & Compliance**

- Supabase Auth + JWT verification (no passwords stored)
- Cloud Run ingress restricted (HTTPS only)
- No sensitive PII stored or logged unless encrypted
- Inline editing logs versioned for audit
- GCP IAM + Secret Manager used for deployment credentials

---

## **7. ⏱️ Performance Requirements**

| **Metric** | **Target** |
| --- | --- |
| Q&A Prompt Response Time | ≤ 1.5 seconds |
| Story Generation Latency | ≤ 3 minutes per prompt |
| Orchestration Stability | ≥ 95% success rate |
| Uptime (Pilot Scope) | ≥ 99.9% during business hours |

---

## **8. 🔁 Deployment Strategy**

| **Layer** | **Deployment Target** |
| --- | --- |
| **Frontend** | **Cloud Run container** hosting static Next.js export (serve) |
| **Backend API** | **Cloud Run service** (FastAPI + LangGraph + Agent Factory) |
| **Database** | **Self-hosted Supabase** container running PostgreSQL + pgvector on Cloud Run (Job or Service) |
| **Authentication** | Supabase Auth (JWT validated in backend) |
| **CI/CD** | GitHub Actions with Cloud Run deployment |
| **Secrets Management** | GCP Secret Manager for model keys, DB URLs, and system tokens |

---

## **9. 📓 Open Technical Questions**

- What is the right retry strategy for LLM invocation failures in Cloud Run stateless model?
- Can Cloud Run containers for Supabase support reliable auto-backup and restore?
- How should multi-source document conflicts be resolved during prompt orchestration?
- Will users need persistent project-level memory during the pilot, or is session-level context sufficient?
- Should we log user feedback to enable future reinforcement learning loops?

---

Let me know if you’d like this inserted directly into Notion or formatted for markdown/print.