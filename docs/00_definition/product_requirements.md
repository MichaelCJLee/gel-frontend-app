## **📍 Overview**

GenOne is a deployable conversational AI assistant for requirement story generation, built specifically for **non-technical enterprise users**. It enables BAs and PMs to transform unstructured documentation (e.g., Confluence, Khub, ADO) into structured user stories — directly through chat, without needing IDE access or engineering support.

This PRD defines the scoped Lite version being piloted at OneNZ, serving as both a usability validation and a platform packaging probe.

### **🧩 Problem Statement**

Business Analysts spend excessive time manually converting internal documentation into structured user stories. Existing AI agents have demonstrated that automation is possible — but current setups (like IDE-based PoCs) exclude non-technical users. This causes delays in backlog creation, inconsistent artefacts, and limits the reach of AI-powered orchestration.

### **🎯 Purpose**

Enable **BAs and PMs to self-serve requirement story generation** by removing technical entry barriers, embedding orchestration in a conversational UI, and aligning outputs with internal planning tools like ADO. Validate real-world deployment feasibility and gather learnings to inform future packaging.

### **✨ Vision**

We envision a future where enterprise product delivery begins with chat: where BAs can generate backlog-ready stories from internal documentation in minutes — standardised, structured, and ready for planning.

### **🚀 Elevator Pitch**

GenOne turns enterprise knowledge into backlog-ready user stories — through chat, not code. Built for BAs. Trusted by delivery squads. Powered by agent orchestration.

---

## **🧑‍🤝‍🧑 User Personas**

### **👤 Pete – Business Analyst**

- **Goals**: A fast, consistent way to turn internal docs into clean, accepted user stories.
- **Pain Points**: Manual story creation is time-consuming and inconsistent.
- **Behavior**: Uses Confluence, ADO, Khub and email; prefers UI/chat-based workflows.

---

## **💫 Customer Value Proposition**

We believe that:

- Providing a **deployable conversational AI assistant** for story generation
- For **BAs and PMs** in structured enterprise environments
- Will eliminate the bottleneck of manual story writing
- And deliver **backlog-ready outputs** that reduce rework, accelerate planning, and improve delivery consistency

We’ll know we’re right when:

- Users adopt it with HITL
- Stories pass acceptance with minimal edit

---

## **🚀 Objective**

### **🌟 North Star**

- Empower non-technical roles (e.g., BAs and PMs) to autonomously generate structured requirement stories through a conversational interface.
- Establish agent-led story generation as a viable and scalable alternative to manual backlog writing.
- Use this pilot to validate how lightweight orchestration agents can be embedded into real-world enterprise SDLC workflows.

### **🎯 Goals**

- Successfully deploy GenOne within OneNZ infrastructure and enable adoption by real BA users.
- Demonstrate that the tool reduces backlog creation time by at least 50% while maintaining or improving story quality.
- Identify reusable design and orchestration patterns that can be ported into the **Ignite Suite** and tested within **MigrationX** contexts.

### **📊 Success Metrics**

- ≥ 80% of generated stories meet usability and formatting thresholds defined in the BA playbook.
- ≥ 90% of stories pass BA or delivery squad acceptance with minimal rework.
- ≥ 50% reduction in time to create backlog-ready user stories.
- At least 3 reusable orchestration or UX patterns captured and mapped to other journeys or agent deployments.

---

## **📦 Scope**

### **🔍 In Scope**

- Requirement story generation from the vector store & the graph store derived from Confluence, ADO, Khub
- Core orchestration logic using Ask Khalil engine
- Lightweight chat interface for story generation
- Deployment within OneNZ infrastructure
- Human-in-the-loop (HITL) review capability
- Capture of deployment & feedback insights
- Linkage to MigrationX and Ignite use cases

---

## **🔄** User Scenarios & Flows

### **Scenario 1: Knowledge Q&A Across Documentation**

- User opens the chat interface and types a question like “Tell me everything about Service Order Management (SOM).”
- The orchestration agent invokes the MCP Factory to retrieve and scan all relevant markdown documents from Confluence related to SOM.
- A Knowledge Synthesizer agent from the Agent Factory analyzes the retrieved documents, identifies relevant topics, workflows, and decisions, and generates a comprehensive summary.
- The answer is presented inline in the chat, with reference links to underlying documents.
- Human-in-the-loop validation enables the user to edit, clarify, or mark important sections for reuse.
- The final version is saved back into Notion as a knowledge artefact or copied to other systems as needed.

**Key Factories Used:** MCP Factory (context retrieval), Agent Factory (knowledge synthesis)

---

### **Scenario 2: Story Retrieval from ADO**

- User initiates a prompt in the chat like “Show me all ADO stories related to voicemail.”
- The orchestration agent queries available ADO markdown exports using the MCP Factory to locate relevant stories.
- A Filtering Agent from the Agent Factory matches stories based on topic tags, content embeddings, and historical linkage to voicemail features.
- A structured list of relevant story IDs and summaries is returned inline in the chat interface.
- Human-in-the-loop validation allows the user to select, flag, or annotate stories for review.

**Key Factories Used:** MCP Factory (ADO context retrieval), Agent Factory (story filtering)

---

### **Scenario 3: Change Plan Journey Story Generation**

- User types “Generate a requirement story for the Change Plan Journey.”
- The orchestration agent triggers the MCP Factory to gather context from Confluence, ADO, and Khub markdown sources.
- A BA Story Generator agent from the Agent Factory applies the team’s requirement story playbook to draft a structured Gherkin-style story based on the retrieved context.
- The story is presented inline for review, with editable acceptance criteria and assumptions.
- Human-in-the-loop editing allows refinement to align with delivery expectations.
- The finalized story is saved to ADO or exported for engineering planning.

**Key Factories Used:** MCP Factory (multi-source context retrieval), Agent Factory (BA story generation)

---

### **Scenario 4: Story Quality Review**

- User types “Review story ADO-1389 and rate its quality.”
- The orchestration agent locates the story using the MCP Factory’s ADO markdown retrieval pipeline.
- A Story Critic agent from the Agent Factory evaluates the story’s clarity, completeness, and alignment with the requirement playbook.
- The agent returns a score (e.g., 6/10) along with commentary on missing elements, vague phrasing, or structural gaps.
- The user can accept the feedback, ask for improvements, or regenerate based on suggestions.
- Results are logged for auditing or reused to coach future story writing.

**Key Factories Used:** MCP Factory (story retrieval), Agent Factory (story review & scoring)

---

## **⚙️ Features & Functionalities**

### **👤 User Stories**

As a BA, I want to generate structured requirement stories from enterprise documentation (Confluence, Khub, ADO), so I can reduce manual effort and accelerate planning.

### **🛠️ Functional Requirements**

- **FR1: Multi-source Q&A Retrieval**
    
    Users can ask questions based on .md content ingested from internal sources like Confluence, ADO, and Khub.
    
- **FR2: Story Generation Engine**
    
    Outputs must follow Gherkin format and align with the internal BA requirement story playbook.
    
- **FR3: Human-in-the-Loop (HITL) Validation**
    
    Generated stories must go through inline review/edit checkpoints before usage.
    

### **✨ Non-Functional Requirements**

- **NFR1**: ≤ 3 minutes from input to story output
- **NFR2**: ≥ 80% of stories must meet usability and formatting thresholds
- **NFR3**: ≥ 99.9% uptime during active usage windows
- **NFR4**: Deployment must fully comply with OneNZ infrastructure and security policies

---

## **🧠 Assumptions**

### **👤 User Behavior Assumptions**

- Users prefer chat-based tools over form-based generators
- BAs will accept 70–80% quality outputs if formatting and structure are correct
- Lightweight feedback channels will drive iteration

### **⚙️ Technical Assumptions**

- Ask Khalil’s orchestration can run independently from full Opshell
- .md ingestion provides enough context for coherent story outputs
- Output templates generalise across at least 3 delivery squads

### **🧭 Operational / System Assumptions**

- HITL reviewers are available during pilot
- Infra access can be granted within timeline

### **💼 Business Assumptions**

- Accelerating backlog creation is seen as high-value
- Pilot feedback will guide broader integration into Ignite and MigrationX
- Packaging learnings are reusable for future external deployment

---

## **❗ Risks**

- OneNZ infra/security may delay deployment
- Non-technical users may find the UI unclear or unintuitive
- Delivery squads may reject outputs due to low quality context
- Pilot learnings may not generalize to broader MigrationX or Ignite use

---

## **❓ Open Questions**

1. **How do we distinguish the quality of orchestration from the quality of story content?**
    
    (i.e., are failures due to input quality, prompt logic, or output format?)
    
2. **What is the right feedback loop cadence for BA users?**
    
    (e.g., inline thumbs-up vs structured reviews vs async comments)
    
3. **How reusable are orchestration agents across different teams or SDLC phases?**
    
    (Is the story generation flow for PMs the same as for compliance teams?)
    
4. **What happens when multiple knowledge sources conflict?**
    
    (How should the orchestration layer handle ambiguity across Confluence, ADO, etc.?)
    
5. **Can agent orchestration scale beyond story generation into planning artefacts?**
    
    (e.g., PRDs, epics, roadmaps — is there a progression path?)
    

---

## **🔗 Related Docs**

- **Design Requirement Doc:** [Link or placeholder]
- **Technical Spec / Architecture:** [Link or placeholder]
- **Agent Specs or Prompt Patterns:** [Link or placeholder]
- **Opshell or Folder Convention:** [Link or placeholder]