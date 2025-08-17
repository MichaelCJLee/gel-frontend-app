# FastAPI Business Analyst Agent - Complete Streaming Events Reference

## Overview

This document provides the complete dictionary of streaming events that the FastAPI Business Analyst Agent service emits during real-time conversations. Web developers can use this reference to implement comprehensive event handling in their applications.

## 🎯 Quick Reference

| Event Type | Purpose | When Emitted | Key Data |
|------------|---------|--------------|----------|
| `stream_start` | Stream initialization | Start of conversation | `thread_id`, `stream_mode` |
| `agent_step` | Agent reasoning | During agent processing | `step_name`, `reasoning` |
| `tool_call_start` | Tool execution begins | Before tool runs | `tool_name`, `parameters` |
| `tool_call_result` | Tool execution complete | After tool completes | `success`, `result`, `execution_time` |
| `progressive_search` | Search progress | During multi-source search | `confidence_score`, `key_findings` |
| `data_fusion` | Multi-source synthesis | After search completion | `sources_combined`, `synthesized_insights` |
| `template_generation` | T1 template creation | During template building | `progress`, `current_section` |
| `final_response` | Complete analysis | Analysis finished | `content`, `confidence_score` |
| `error` | Error occurred | When errors happen | `error_type`, `recoverable` |
| `stream_complete` | Stream finished | End of conversation | `total_duration`, `tools_used` |

## 📡 Complete Event Specifications

### 1. Stream Control Events

#### Stream Start Event
Emitted when a new streaming conversation begins.

```javascript
{
    "type": "stream_start",
    "stream_mode": "updates",  // "updates", "messages", "values", "debug"
    "timestamp": "2024-12-22T10:30:00.123456",
    "metadata": {
        "thread_id": "user_alice_session_20241222_143706_abc123",
        "user_id": "alice",
        "agent_version": "1.0.0",
        "max_tools": 16
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'stream_start') {
    console.log(`Starting conversation for user ${event.metadata.user_id}`);
    showLoadingIndicator();
    initializeProgressTracker();
}
```

#### Stream Complete Event
Emitted when the streaming conversation ends successfully.

```javascript
{
    "type": "stream_complete",
    "timestamp": "2024-12-22T10:30:45.678901",
    "metadata": {
        "total_duration": 45.555,
        "tools_used": ["web_search", "confluence_search", "vector_search"],
        "total_tokens": 1250,
        "final_confidence": 0.94,
        "response_sections": 4
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'stream_complete') {
    hideLoadingIndicator();
    showCompletionSummary(event.metadata);
    console.log(`Conversation completed in ${event.metadata.total_duration}s`);
}
```

### 2. Agent Reasoning Events

#### Agent Step Event
Emitted during agent reasoning and decision-making processes.

```javascript
{
    "type": "agent_step",
    "step_name": "analyze_request",  // "analyze_request", "plan_search", "synthesize_data"
    "content": "I need to analyze the market trends for electric vehicles. Let me start by searching for recent data and industry reports.",
    "metadata": {
        "step_number": 1,
        "reasoning": "User is asking for market analysis, need current data from multiple sources",
        "next_action": "web_search",
        "confidence": 0.85,
        "estimated_time": 15.5
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'agent_step') {
    displayAgentThinking(event.content);
    updateProgressPhase(event.step_name);
    showEstimatedTime(event.metadata.estimated_time);
}
```

### 3. Tool Execution Events

#### Tool Call Start Event
Emitted when a tool begins execution.

```javascript
{
    "type": "tool_call_start",
    "tool_name": "web_search",  // "web_search", "confluence_search", "vector_search", etc.
    "description": "Searching for electric vehicle market trends 2024",
    "parameters": {
        "query": "electric vehicle market trends 2024 growth statistics",
        "num_results": 10,
        "date_range": "2024-01-01 to 2024-12-22"
    },
    "metadata": {
        "tool_id": "web_search_001",
        "tool_version": "v7.2",
        "estimated_duration": 3.5,
        "priority": "high"
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'tool_call_start') {
    const toolElement = createToolExecutionDisplay(event);
    showToolProgress(event.tool_name, event.metadata.estimated_duration);
    trackToolExecution(event.metadata.tool_id, event.tool_name);
}
```

#### Tool Call Result Event
Emitted when a tool completes execution (success or failure).

```javascript
{
    "type": "tool_call_result",
    "tool_name": "web_search",
    "success": true,
    "result": {
        "sources": [
            {
                "title": "EV Market Growth Accelerates in 2024",
                "url": "https://example.com/ev-trends",
                "snippet": "Electric vehicle sales increased by 35% in Q3 2024, driven by improved battery technology and government incentives...",
                "relevance_score": 0.92,
                "date": "2024-11-15"
            },
            {
                "title": "Global Electric Vehicle Outlook 2024",
                "url": "https://example.com/global-ev-outlook",
                "snippet": "The global EV market is expected to reach $1.3 trillion by 2025...",
                "relevance_score": 0.88,
                "date": "2024-12-01"
            }
        ],
        "summary": "Found 8 relevant sources about EV market trends with high confidence",
        "total_results": 8,
        "filtered_results": 8
    },
    "metadata": {
        "tool_id": "web_search_001",
        "execution_time": 2.8,
        "sources_found": 8,
        "quality_score": 0.91,
        "cache_hit": false
    }
}
```

**Error Result Example:**
```javascript
{
    "type": "tool_call_result",
    "tool_name": "web_search",
    "success": false,
    "error": "Search service timeout after 30 seconds",
    "error_code": "SEARCH_TIMEOUT",
    "metadata": {
        "tool_id": "web_search_001",
        "execution_time": 30.0,
        "retry_count": 2,
        "max_retries": 3
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'tool_call_result') {
    updateToolStatus(event.metadata.tool_id, event.success);
    if (event.success) {
        displayToolResults(event.result);
        updateConfidenceScore(event.metadata.quality_score);
    } else {
        showToolError(event.error);
        if (event.metadata.retry_count < event.metadata.max_retries) {
            showRetryIndicator();
        }
    }
}
```

### 4. Progressive Search Events

#### Progressive Search Event
Emitted during multi-source search operations to show accumulating results.

```javascript
{
    "type": "progressive_search",
    "search_type": "confluence",  // "web", "confluence", "vector", "ado"
    "content": {
        "current_results": 12,
        "total_sources": 3,
        "confidence_score": 0.85,
        "key_findings": [
            "EV adoption rates vary significantly by region",
            "Infrastructure investment is a key growth driver",
            "Battery technology improvements accelerating adoption",
            "Government policies driving 40% of market growth"
        ],
        "search_progress": 0.75,
        "next_search": "vector_search"
    },
    "metadata": {
        "search_phase": "confluence_search",
        "fusion_ready": true,
        "quality_threshold": 0.8,
        "search_depth": "comprehensive"
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'progressive_search') {
    updateSearchProgress(event.content.search_progress);
    displayKeyFindings(event.content.key_findings);
    updateConfidenceIndicator(event.content.confidence_score);
    showNextSearchPhase(event.content.next_search);
}
```

### 5. Data Fusion Events

#### Data Fusion Event
Emitted when multiple data sources are being combined and synthesized.

```javascript
{
    "type": "data_fusion",
    "content": {
        "sources_combined": ["web_search", "confluence", "vector_search"],
        "fusion_method": "weighted_semantic_similarity",
        "confidence_score": 0.92,
        "synthesized_insights": [
            "Market growth driven by policy changes and infrastructure investment",
            "Consumer adoption accelerating in urban areas, slower in rural regions",
            "Supply chain challenges remain but are improving",
            "Technology advancements reducing cost barriers"
        ],
        "data_quality": {
            "completeness": 0.89,
            "consistency": 0.94,
            "recency": 0.87
        }
    },
    "metadata": {
        "fusion_algorithm": "weighted_semantic_fusion_v2",
        "source_weights": {
            "web_search": 0.4,
            "confluence": 0.35,
            "vector_search": 0.25
        },
        "processing_time": 1.2,
        "cross_validation_score": 0.91
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'data_fusion') {
    showDataFusionProcess(event.content.sources_combined);
    displaySynthesizedInsights(event.content.synthesized_insights);
    updateQualityMetrics(event.content.data_quality);
    showSourceWeights(event.metadata.source_weights);
}
```

### 6. Template Generation Events

#### Template Generation Event
Emitted during T1 template creation and formatting.

```javascript
{
    "type": "template_generation",
    "template_type": "T1_analysis",  // "T1_analysis", "executive_summary", "technical_report"
    "content": {
        "sections": [
            "Executive Summary",
            "Market Analysis", 
            "Key Findings",
            "Recommendations",
            "Risk Assessment"
        ],
        "progress": 0.75,
        "current_section": "Key Findings",
        "completed_sections": ["Executive Summary", "Market Analysis"],
        "estimated_completion": 8.5
    },
    "metadata": {
        "template_version": "T1_v2.1",
        "customization_level": "high",
        "word_count_target": 1500,
        "current_word_count": 1125,
        "formatting": "markdown"
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'template_generation') {
    updateTemplateProgress(event.content.progress);
    highlightCurrentSection(event.content.current_section);
    showCompletedSections(event.content.completed_sections);
    updateWordCount(event.metadata.current_word_count, event.metadata.word_count_target);
}
```

### 7. Final Response Events

#### Final Response Event
Emitted when the complete analysis is ready.

```javascript
{
    "type": "final_response",
    "content": "# Electric Vehicle Market Analysis 2024\n\n## Executive Summary\n\nThe electric vehicle market continues to show robust growth in 2024, with global sales increasing by 35% in Q3 compared to the previous year. This growth is driven by a combination of technological advancements, supportive government policies, and increasing consumer awareness of environmental issues.\n\n## Market Analysis\n\n### Current Trends\n- **Sales Growth**: Global EV sales reached 10.5 million units in 2024\n- **Cost Reduction**: Battery costs decreased by 12% year-over-year\n- **Infrastructure**: Charging infrastructure investment reached $50B globally\n- **Market Share**: EVs now represent 18% of global auto sales\n\n### Regional Performance\n- **China**: Leading with 6.2M units (59% market share)\n- **Europe**: 2.1M units with strong policy support\n- **North America**: 1.8M units, accelerating adoption\n- **Other regions**: 0.4M units, emerging markets\n\n## Key Findings\n\n1. **Policy Impact**: Government incentives driving 40% of adoption\n2. **Consumer Behavior**: Urban adoption outpacing rural by 3:1 ratio\n3. **Technology**: Range anxiety reduced with 400+ mile vehicles\n4. **Infrastructure**: Fast-charging networks expanding 45% annually\n5. **Cost Parity**: EVs approaching price parity with ICE vehicles\n\n## Recommendations\n\n### For Investors\n1. **Focus Areas**: Prioritize charging infrastructure and battery technology\n2. **Geographic Strategy**: Target urban markets first, rural markets second\n3. **Partnerships**: Collaborate with energy providers and tech companies\n\n### For Manufacturers\n1. **Product Strategy**: Develop mid-range vehicles for mass market\n2. **Supply Chain**: Secure battery material supply chains\n3. **Technology**: Invest in fast-charging and autonomous capabilities\n\n## Risk Assessment\n\n- **Supply Chain**: Raw material shortages could impact growth\n- **Policy Changes**: Reduction in incentives could slow adoption\n- **Competition**: Traditional automakers increasing EV investments\n- **Infrastructure**: Charging network gaps in rural areas\n\n---\n*Analysis based on 12 sources including market reports, industry data, and expert insights. Confidence score: 94%*",
    "format": "markdown",
    "metadata": {
        "response_type": "comprehensive_analysis",
        "word_count": 1250,
        "sections": 4,
        "sources_cited": 12,
        "confidence_score": 0.94,
        "tools_used": [
            "web_search",
            "confluence_search",
            "vector_search", 
            "template_generator"
        ],
        "processing_time": 42.3,
        "quality_metrics": {
            "completeness": 0.96,
            "accuracy": 0.94,
            "relevance": 0.92,
            "timeliness": 0.89
        }
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'final_response') {
    displayFinalAnalysis(event.content);
    showQualityMetrics(event.metadata.quality_metrics);
    displaySourceCitation(event.metadata.sources_cited);
    showToolsUsed(event.metadata.tools_used);
    updateConfidenceScore(event.metadata.confidence_score);
}
```

### 8. Error Events

#### Recoverable Error Event
Emitted for errors that can be retried or worked around.

```javascript
{
    "type": "error",
    "error_type": "tool_timeout",  // "tool_timeout", "api_limit", "network_error"
    "message": "Web search timed out after 30 seconds, retrying with optimized parameters",
    "recoverable": true,
    "retry_strategy": "exponential_backoff",
    "metadata": {
        "tool_name": "web_search",
        "retry_count": 1,
        "max_retries": 3,
        "next_retry_delay": 2.0,
        "fallback_available": true
    }
}
```

#### Critical Error Event
Emitted for errors that cannot be recovered from.

```javascript
{
    "type": "error",
    "error_type": "agent_failure",  // "agent_failure", "authentication_error", "system_error"
    "message": "Agent processing failed due to invalid state configuration",
    "recoverable": false,
    "suggested_action": "restart_conversation",
    "metadata": {
        "error_code": "AGENT_STATE_INVALID",
        "thread_id": "user_alice_session_20241222_143706_abc123",
        "stack_trace": "...",
        "support_ticket": "TKT-2024-001234"
    }
}
```

**Usage Example:**
```javascript
if (event.type === 'error') {
    if (event.recoverable) {
        showRetryIndicator(event.metadata.retry_count, event.metadata.max_retries);
        scheduleRetry(event.metadata.next_retry_delay);
    } else {
        showCriticalError(event.message);
        offerConversationRestart();
        logErrorForSupport(event.metadata.error_code);
    }
}
```

## 🎯 Complete Event Handler Example

```javascript
class ComprehensiveEventHandler {
    constructor(uiContainer) {
        this.container = uiContainer;
        this.activeTools = new Map();
        this.searchProgress = new Map();
    }

    handleEvent(event) {
        console.log(`[${event.type}]`, event);
        
        switch (event.type) {
            case 'stream_start':
                this.showLoadingIndicator();
                break;
            case 'agent_step':
                this.displayAgentThinking(event.content);
                break;
            case 'tool_call_start':
                this.showToolExecution(event);
                break;
            case 'tool_call_result':
                this.updateToolStatus(event);
                break;
            case 'progressive_search':
                this.updateSearchProgress(event);
                break;
            case 'data_fusion':
                this.showDataFusion(event);
                break;
            case 'template_generation':
                this.updateTemplateProgress(event);
                break;
            case 'final_response':
                this.displayFinalResponse(event);
                break;
            case 'error':
                this.handleError(event);
                break;
            case 'stream_complete':
                this.hideLoadingIndicator();
                break;
        }
    }

    showToolExecution(event) {
        const toolElement = document.createElement('div');
        toolElement.id = `tool-${event.metadata.tool_id}`;
        toolElement.className = 'tool-execution';
        toolElement.innerHTML = `
            <div class="tool-header">
                <span class="tool-name">${event.tool_name}</span>
                <span class="tool-status">Executing...</span>
            </div>
            <div class="tool-description">${event.description}</div>
        `;
        this.container.appendChild(toolElement);
    }

    updateToolStatus(event) {
        const toolElement = document.getElementById(`tool-${event.metadata.tool_id}`);
        if (toolElement) {
            const statusElement = toolElement.querySelector('.tool-status');
            statusElement.textContent = event.success ? 'Completed' : 'Failed';
            statusElement.className = `tool-status ${event.success ? 'success' : 'error'}`;
        }
    }

    displayFinalResponse(event) {
        const responseElement = document.createElement('div');
        responseElement.className = 'final-response';
        responseElement.innerHTML = `
            <div class="response-content">${this.parseMarkdown(event.content)}</div>
            <div class="response-meta">
                Confidence: ${Math.round(event.metadata.confidence_score * 100)}% | 
                Sources: ${event.metadata.sources_cited} | 
                Tools: ${event.metadata.tools_used.join(', ')}
            </div>
        `;
        this.container.appendChild(responseElement);
    }

    parseMarkdown(markdown) {
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }
}
```

This comprehensive streaming events reference provides web developers with everything needed to implement sophisticated, real-time interfaces for the Business Analyst Agent service. 