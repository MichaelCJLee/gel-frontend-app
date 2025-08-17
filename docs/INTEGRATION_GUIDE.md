# FastAPI Business Analyst Agent - Web App Integration Guide

## Overview

This guide provides web application teams with everything needed to integrate the FastAPI Business Analyst Agent service into their applications. The service offers real-time streaming capabilities equivalent to the existing `chat.py` interface, with enhanced multi-user support and production-ready features.

## 🔗 Integration Architecture

```
Web Application Frontend
         ↓ HTTP/SSE
FastAPI Business Analyst Service
         ↓ Direct Import
Business Analyst Agent (LangGraph)
         ↓ Tool Calls
16 V7 Multi-Source Tools
```

## 🚀 Quick Integration

### 1. Basic Setup

```javascript
class BusinessAnalystClient {
    constructor(baseUrl = 'http://localhost:8000', userId = null) {
        this.baseUrl = baseUrl;
        this.userId = userId;
        this.apiPrefix = '/api/v1';
    }

    async checkHealth() {
        const response = await fetch(`${this.baseUrl}${this.apiPrefix}/health`);
        return response.json();
    }

    async getAgentInfo() {
        const response = await fetch(`${this.baseUrl}${this.apiPrefix}/agent/info`);
        return response.json();
    }
}

// Initialize client
const client = new BusinessAnalystClient('http://localhost:8000', 'user123');
```

### 2. Real-Time Streaming Integration

```javascript
class StreamingChat {
    constructor(client) {
        this.client = client;
        this.activeStreams = new Map();
    }

    async startConversation(message, threadId = null, onUpdate = null) {
        const requestBody = {
            message: message,
            thread_id: threadId,
            user_id: this.client.userId,
            stream_mode: 'updates',
            include_metadata: true
        };

        try {
            const response = await fetch(`${this.client.baseUrl}${this.client.apiPrefix}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return this.processStream(response, onUpdate);
        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        }
    }

    async processStream(response, onUpdate) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (onUpdate) {
                                onUpdate(data);
                            }
                        } catch (e) {
                            console.warn('Failed to parse streaming data:', e);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }
}
```

### 3. React Component Example

```jsx
import React, { useState, useCallback, useRef } from 'react';

const BusinessAnalystChat = ({ userId }) => {
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [threadId, setThreadId] = useState(null);
    const streamingRef = useRef(null);

    const handleStreamUpdate = useCallback((data) => {
        console.log('Stream update:', data);

        switch (data.type) {
            case 'agent_step':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'agent_step',
                    content: data.content,
                    timestamp: new Date()
                }]);
                break;

            case 'tool_call':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'tool_call',
                    tool: data.content.tool_name,
                    description: data.content.description,
                    timestamp: new Date()
                }]);
                break;

            case 'final_response':
                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'final_response',
                    content: data.content,
                    timestamp: new Date()
                }]);
                setIsStreaming(false);
                break;

            case 'error':
                console.error('Agent error:', data.content);
                setIsStreaming(false);
                break;
        }
    }, []);

    const sendMessage = async () => {
        if (!currentMessage.trim() || isStreaming) return;

        setIsStreaming(true);
        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user_message',
            content: currentMessage,
            timestamp: new Date()
        }]);

        try {
            const client = new BusinessAnalystClient('http://localhost:8000', userId);
            const streaming = new StreamingChat(client);
            
            await streaming.startConversation(
                currentMessage,
                threadId,
                handleStreamUpdate
            );

            // Generate thread ID if not exists
            if (!threadId) {
                setThreadId(`user_${userId}_session_${Date.now()}`);
            }

        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => [...prev, {
                id: Date.now(),
                type: 'error',
                content: `Error: ${error.message}`,
                timestamp: new Date()
            }]);
        } finally {
            setIsStreaming(false);
            setCurrentMessage('');
        }
    };

    return (
        <div className="business-analyst-chat">
            <div className="messages">
                {messages.map(message => (
                    <div key={message.id} className={`message ${message.type}`}>
                        <div className="timestamp">
                            {message.timestamp.toLocaleTimeString()}
                        </div>
                        <div className="content">
                            {message.type === 'tool_call' ? (
                                <div>
                                    <strong>🔧 {message.tool}</strong>
                                    <p>{message.description}</p>
                                </div>
                            ) : (
                                message.content
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="input-area">
                <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Ask the Business Analyst..."
                    disabled={isStreaming}
                />
                <button onClick={sendMessage} disabled={isStreaming || !currentMessage.trim()}>
                    {isStreaming ? 'Processing...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default BusinessAnalystChat;
```

## 📡 Complete Streaming Event Reference

The service provides comprehensive streaming events that match the functionality of `chat.py`. Here's the complete event dictionary your web app team can use directly:

### Stream Status Events

```javascript
// Stream initialization
{
    "type": "stream_start",
    "stream_mode": "updates",
    "timestamp": "2024-12-22T10:30:00.123456",
    "metadata": {
        "thread_id": "user_alice_session_20241222_143706_abc123",
        "user_id": "alice"
    }
}

// Stream completion
{
    "type": "stream_complete",
    "timestamp": "2024-12-22T10:30:45.678901",
    "metadata": {
        "total_duration": 45.555,
        "tools_used": ["web_search", "confluence_search"],
        "total_tokens": 1250
    }
}
```

### Agent Step Events

```javascript
// Agent reasoning step
{
    "type": "agent_step",
    "step_name": "analyze_request",
    "content": "I need to analyze the market trends for electric vehicles. Let me start by searching for recent data...",
    "metadata": {
        "step_number": 1,
        "reasoning": "User is asking for market analysis, need current data",
        "next_action": "web_search"
    }
}
```

### Tool Call Events

```javascript
// Tool execution start
{
    "type": "tool_call_start",
    "tool_name": "web_search",
    "description": "Searching for electric vehicle market trends 2024",
    "parameters": {
        "query": "electric vehicle market trends 2024 growth statistics",
        "num_results": 10
    },
    "metadata": {
        "tool_id": "web_search_001",
        "estimated_duration": 3.5
    }
}

// Tool execution result
{
    "type": "tool_call_result",
    "tool_name": "web_search",
    "success": true,
    "result": {
        "sources": [
            {
                "title": "EV Market Growth Accelerates in 2024",
                "url": "https://example.com/ev-trends",
                "snippet": "Electric vehicle sales increased by 35% in Q3 2024..."
            }
        ],
        "summary": "Found 8 relevant sources about EV market trends"
    },
    "metadata": {
        "tool_id": "web_search_001",
        "execution_time": 2.8,
        "sources_found": 8
    }
}
```

### Progressive Search Events

```javascript
// Progressive search accumulation
{
    "type": "progressive_search",
    "search_type": "confluence",
    "content": {
        "current_results": 12,
        "total_sources": 3,
        "confidence_score": 0.85,
        "key_findings": [
            "EV adoption rates vary by region",
            "Infrastructure investment is key driver",
            "Battery technology improvements accelerating"
        ]
    },
    "metadata": {
        "search_phase": "confluence_search",
        "fusion_ready": true
    }
}
```

### Multi-Source Data Fusion Events

```javascript
// Data fusion process
{
    "type": "data_fusion",
    "content": {
        "sources_combined": ["web_search", "confluence", "vector_search"],
        "fusion_method": "semantic_similarity",
        "confidence_score": 0.92,
        "synthesized_insights": [
            "Market growth driven by policy changes",
            "Consumer adoption accelerating in urban areas",
            "Supply chain challenges remain"
        ]
    },
    "metadata": {
        "fusion_algorithm": "weighted_semantic_fusion",
        "source_weights": {
            "web_search": 0.4,
            "confluence": 0.35,
            "vector_search": 0.25
        }
    }
}
```

### Template Generation Events

```javascript
// T1 template generation
{
    "type": "template_generation",
    "template_type": "T1_analysis",
    "content": {
        "sections": [
            "Executive Summary",
            "Market Analysis",
            "Key Findings",
            "Recommendations"
        ],
        "progress": 0.75,
        "current_section": "Key Findings"
    },
    "metadata": {
        "template_version": "T1_v2.1",
        "customization_level": "high"
    }
}
```

### Final Response Events

```javascript
// Complete response with full analysis
{
    "type": "final_response",
    "content": "# Electric Vehicle Market Analysis 2024\n\n## Executive Summary\n\nThe electric vehicle market continues to show robust growth in 2024...\n\n## Market Analysis\n\n### Current Trends\n- Global EV sales increased by 35% in Q3 2024\n- Battery costs decreased by 12% year-over-year\n- Infrastructure investment reached $50B globally\n\n### Key Findings\n1. **Policy Impact**: Government incentives driving 40% of adoption\n2. **Consumer Behavior**: Urban adoption outpacing rural by 3:1\n3. **Technology**: Range anxiety reduced with 400+ mile vehicles\n\n## Recommendations\n\n1. **Investment Focus**: Prioritize charging infrastructure\n2. **Market Entry**: Target urban markets first\n3. **Partnerships**: Collaborate with energy providers\n\n---\n*Analysis based on 12 sources including market reports, industry data, and expert insights.*",
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
        ]
    }
}
```

### Error Events

```javascript
// Recoverable error
{
    "type": "error",
    "error_type": "tool_timeout",
    "message": "Web search timed out, retrying with different parameters",
    "recoverable": true,
    "retry_strategy": "exponential_backoff",
    "metadata": {
        "tool_name": "web_search",
        "retry_count": 1,
        "max_retries": 3
    }
}

// Critical error
{
    "type": "error",
    "error_type": "agent_failure",
    "message": "Agent processing failed due to invalid state",
    "recoverable": false,
    "suggested_action": "restart_conversation",
    "metadata": {
        "error_code": "AGENT_STATE_INVALID",
        "thread_id": "user_alice_session_20241222_143706_abc123"
    }
}
```

## 🎯 Event-Driven UI Implementation

### Complete Event Handler

```javascript
class AgentEventHandler {
    constructor(uiContainer) {
        this.container = uiContainer;
        this.currentToolCalls = new Map();
        this.progressTracker = new ProgressTracker();
    }

    handleEvent(event) {
        console.log('Received event:', event);
        
        switch (event.type) {
            case 'stream_start':
                this.showStreamStart(event);
                break;
                
            case 'agent_step':
                this.displayAgentStep(event);
                break;
                
            case 'tool_call_start':
                this.showToolStart(event);
                break;
                
            case 'tool_call_result':
                this.showToolResult(event);
                break;
                
            case 'progressive_search':
                this.updateProgressiveSearch(event);
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
                this.showStreamComplete(event);
                break;
                
            default:
                console.warn('Unhandled event type:', event.type);
        }
    }

    showToolStart(event) {
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-execution';
        toolElement.id = `tool-${event.metadata.tool_id}`;
        toolElement.innerHTML = `
            <div class="tool-header">
                <span class="tool-icon">🔧</span>
                <span class="tool-name">${event.tool_name}</span>
                <span class="tool-status executing">Executing...</span>
            </div>
            <div class="tool-description">${event.description}</div>
            <div class="tool-progress">
                <div class="progress-bar" style="animation: progress ${event.metadata.estimated_duration}s linear;"></div>
            </div>
        `;
        
        this.container.appendChild(toolElement);
        this.currentToolCalls.set(event.metadata.tool_id, toolElement);
    }

    showToolResult(event) {
        const toolElement = this.currentToolCalls.get(event.metadata.tool_id);
        if (!toolElement) return;

        const statusElement = toolElement.querySelector('.tool-status');
        statusElement.textContent = event.success ? 'Completed' : 'Failed';
        statusElement.className = `tool-status ${event.success ? 'success' : 'error'}`;

        // Add result details
        const resultElement = document.createElement('div');
        resultElement.className = 'tool-result';
        
        if (event.success) {
            resultElement.innerHTML = `
                <div class="result-summary">
                    ✅ ${event.result.summary || 'Tool executed successfully'}
                </div>
                <div class="result-details">
                    <small>Execution time: ${event.metadata.execution_time}s</small>
                    ${event.result.sources ? `<small> • Sources found: ${event.result.sources.length}</small>` : ''}
                </div>
            `;
        } else {
            resultElement.innerHTML = `
                <div class="result-summary error">
                    ❌ ${event.error || 'Tool execution failed'}
                </div>
            `;
        }

        toolElement.appendChild(resultElement);
    }

    updateProgressiveSearch(event) {
        const searchElement = document.createElement('div');
        searchElement.className = 'progressive-search';
        searchElement.innerHTML = `
            <div class="search-header">
                <span class="search-icon">🔍</span>
                <span class="search-type">${event.search_type} Search</span>
                <span class="confidence-score">Confidence: ${Math.round(event.content.confidence_score * 100)}%</span>
            </div>
            <div class="search-results">
                <div class="results-count">${event.content.current_results} results from ${event.content.total_sources} sources</div>
                <div class="key-findings">
                    ${event.content.key_findings.map(finding => `<div class="finding">• ${finding}</div>`).join('')}
                </div>
            </div>
        `;
        
        this.container.appendChild(searchElement);
    }

    showDataFusion(event) {
        const fusionElement = document.createElement('div');
        fusionElement.className = 'data-fusion';
        fusionElement.innerHTML = `
            <div class="fusion-header">
                <span class="fusion-icon">🔄</span>
                <span class="fusion-title">Data Fusion</span>
                <span class="confidence-score">Confidence: ${Math.round(event.content.confidence_score * 100)}%</span>
            </div>
            <div class="fusion-sources">
                ${event.content.sources_combined.map(source => `<span class="source-tag">${source}</span>`).join('')}
            </div>
            <div class="synthesized-insights">
                <h4>Synthesized Insights:</h4>
                ${event.content.synthesized_insights.map(insight => `<div class="insight">• ${insight}</div>`).join('')}
            </div>
        `;
        
        this.container.appendChild(fusionElement);
    }

    displayFinalResponse(event) {
        const responseElement = document.createElement('div');
        responseElement.className = 'final-response';
        
        // Parse markdown content if needed
        const content = event.format === 'markdown' ? 
            this.parseMarkdown(event.content) : 
            event.content;

        responseElement.innerHTML = `
            <div class="response-header">
                <span class="response-icon">📋</span>
                <span class="response-title">Analysis Complete</span>
                <span class="response-meta">
                    ${event.metadata.word_count} words • 
                    ${event.metadata.sources_cited} sources • 
                    ${Math.round(event.metadata.confidence_score * 100)}% confidence
                </span>
            </div>
            <div class="response-content">${content}</div>
            <div class="response-footer">
                <div class="tools-used">
                    Tools used: ${event.metadata.tools_used.join(', ')}
                </div>
            </div>
        `;
        
        this.container.appendChild(responseElement);
    }

    parseMarkdown(markdown) {
        // Simple markdown parser for basic formatting
        return markdown
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            .replace(/\n/g, '<br>');
    }
}
```

## 🔒 Production Security Implementation

### Authentication Integration

```javascript
class SecureBusinessAnalystClient extends BusinessAnalystClient {
    constructor(baseUrl, authToken) {
        super(baseUrl);
        this.authToken = authToken;
        this.userId = this.extractUserIdFromToken(authToken);
    }

    async makeSecureRequest(endpoint, options = {}) {
        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
            'X-Request-ID': this.generateRequestId(),
            ...options.headers
        };

        const response = await fetch(`${this.baseUrl}${this.apiPrefix}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            throw new Error('Authentication failed - please login again');
        }

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        return response;
    }

    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    extractUserIdFromToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub || payload.user_id;
        } catch (error) {
            console.error('Failed to extract user ID from token');
            return null;
        }
    }
}
```

## 📊 Performance Monitoring

### Real-Time Performance Tracking

```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            responseTime: [],
            toolExecutionTime: [],
            streamingLatency: [],
            errorRate: 0,
            totalRequests: 0
        };
    }

    startRequest() {
        return {
            startTime: performance.now(),
            requestId: `req_${Date.now()}`
        };
    }

    endRequest(requestInfo, success = true) {
        const duration = performance.now() - requestInfo.startTime;
        this.metrics.responseTime.push(duration);
        this.metrics.totalRequests++;
        
        if (!success) {
            this.metrics.errorRate++;
        }

        // Keep only last 100 measurements
        if (this.metrics.responseTime.length > 100) {
            this.metrics.responseTime.shift();
        }

        console.log(`Request ${requestInfo.requestId} completed in ${duration.toFixed(2)}ms`);
    }

    trackToolExecution(toolName, duration) {
        this.metrics.toolExecutionTime.push({
            tool: toolName,
            duration: duration,
            timestamp: Date.now()
        });

        // Keep only last 50 tool executions
        if (this.metrics.toolExecutionTime.length > 50) {
            this.metrics.toolExecutionTime.shift();
        }
    }

    getMetrics() {
        const avgResponseTime = this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length || 0;
        const errorRate = (this.metrics.errorRate / this.metrics.totalRequests) * 100 || 0;

        return {
            averageResponseTime: avgResponseTime.toFixed(2),
            errorRate: errorRate.toFixed(2),
            totalRequests: this.metrics.totalRequests,
            recentToolExecutions: this.metrics.toolExecutionTime.slice(-10)
        };
    }
}
```

## 🧪 Testing Your Integration

### Comprehensive Test Suite

```javascript
// Integration test example
describe('Business Analyst Integration', () => {
    let client, monitor;

    beforeEach(() => {
        client = new BusinessAnalystClient('http://localhost:8000', 'test_user');
        monitor = new PerformanceMonitor();
    });

    test('should handle complete conversation flow', async () => {
        const events = [];
        const streaming = new StreamingChat(client);
        
        const requestInfo = monitor.startRequest();
        
        try {
            await streaming.startConversation(
                'Analyze current market trends',
                null,
                (event) => events.push(event)
            );
            
            monitor.endRequest(requestInfo, true);
        } catch (error) {
            monitor.endRequest(requestInfo, false);
            throw error;
        }

        // Verify event sequence
        expect(events.some(e => e.type === 'stream_start')).toBe(true);
        expect(events.some(e => e.type === 'agent_step')).toBe(true);
        expect(events.some(e => e.type === 'tool_call_start')).toBe(true);
        expect(events.some(e => e.type === 'tool_call_result')).toBe(true);
        expect(events.some(e => e.type === 'final_response')).toBe(true);
        expect(events.some(e => e.type === 'stream_complete')).toBe(true);

        // Verify final response structure
        const finalResponse = events.find(e => e.type === 'final_response');
        expect(finalResponse.content).toBeTruthy();
        expect(finalResponse.metadata.confidence_score).toBeGreaterThan(0.5);
        expect(finalResponse.metadata.tools_used).toBeInstanceOf(Array);
    });

    test('should handle authentication errors gracefully', async () => {
        const secureClient = new SecureBusinessAnalystClient('http://localhost:8000', 'invalid_token');
        
        await expect(
            secureClient.makeSecureRequest('/agent/info')
        ).rejects.toThrow('Authentication failed');
    });

    test('should track performance metrics', async () => {
        const requestInfo = monitor.startRequest();
        
        // Simulate tool execution
        monitor.trackToolExecution('web_search', 2500);
        monitor.trackToolExecution('confluence_search', 1800);
        
        monitor.endRequest(requestInfo, true);
        
        const metrics = monitor.getMetrics();
        expect(metrics.totalRequests).toBe(1);
        expect(metrics.recentToolExecutions).toHaveLength(2);
    });
});
```

This integration guide provides your web app team with everything needed to successfully integrate the Business Analyst Agent service, including complete event references, security best practices, performance monitoring, and comprehensive testing examples. 