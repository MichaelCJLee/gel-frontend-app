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

    // Session Management
    async createSession(title, metadata = {}) {
        const response = await fetch(`${this.baseUrl}${this.apiPrefix}/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, metadata })
        });
        return response.json();
    }

    async getSessions(page = 1, pageSize = 20, activeOnly = true) {
        const params = new URLSearchParams({ page, page_size: pageSize, active_only: activeOnly });
        const response = await fetch(`${this.baseUrl}${this.apiPrefix}/sessions?${params}`);
        return response.json();
    }

    async getSessionMessages(sessionId) {
        const response = await fetch(`${this.baseUrl}${this.apiPrefix}/sessions/${sessionId}/messages`);
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

## 💬 Message History Integration

### Overview

The FastAPI service provides persistent conversation history through LangGraph checkpoints. This allows users to maintain conversation continuity across browser sessions, logout/login cycles, and device switches.

### Message History API

#### Get Session Messages

```javascript
// Retrieve conversation history for a session
async getSessionMessages(sessionId, authToken) {
    const response = await fetch(`${this.baseUrl}${this.apiPrefix}/sessions/${sessionId}/messages`, {
        headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get messages: ${response.status}`);
    }

    return response.json();
}
```

#### Response Format

```typescript
interface SessionMessagesResponse {
    session_id: string;
    thread_id: string;
    messages: SessionMessage[];
    total_messages: number;
    last_updated: string;
}

interface SessionMessage {
    id: string;                    // Stable message ID
    role: 'user' | 'assistant';   // Message role
    content: string;              // Message content
    timestamp: string;            // ISO timestamp
    agent_steps?: AgentStep[];    // Optional agent reasoning steps
}

interface AgentStep {
    id: string;
    type: string;                 // 'thinking', 'tool_call', 'search'
    title: string;               // 'Sequential Thinking', 'Azure DevOps Search'
    content: string;             // Step content/description
    timestamp: string;           // ISO timestamp
    status: 'pending' | 'complete' | 'error';
    metadata?: Record<string, any>;
}
```

### React Integration Example

```jsx
import React, { useState, useEffect, useCallback } from 'react';

const ConversationManager = ({ userId, authToken }) => {
    const [sessions, setSessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    const client = new BusinessAnalystClient('http://localhost:8000');

    // Load user sessions
    const loadSessions = useCallback(async () => {
        try {
            const response = await client.getSessions();
            setSessions(response.sessions);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        }
    }, []);

    // Load messages for a session
    const loadSessionMessages = useCallback(async (sessionId) => {
        if (!sessionId) return;

        setLoading(true);
        try {
            const response = await client.getSessionMessages(sessionId, authToken);
            setMessages(response.messages);
            console.log(`Loaded ${response.total_messages} messages for session ${sessionId}`);
        } catch (error) {
            console.error('Failed to load messages:', error);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    }, [authToken]);

    // Handle session selection
    const selectSession = useCallback(async (session) => {
        setCurrentSession(session);
        await loadSessionMessages(session.id);
    }, [loadSessionMessages]);

    // Load sessions on mount
    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Auto-load messages when session changes
    useEffect(() => {
        if (currentSession) {
            loadSessionMessages(currentSession.id);
        }
    }, [currentSession, loadSessionMessages]);

    return (
        <div className="conversation-manager">
            <div className="session-list">
                <h3>Conversations</h3>
                {sessions.map(session => (
                    <div
                        key={session.id}
                        className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
                        onClick={() => selectSession(session)}
                    >
                        <div className="session-title">{session.title}</div>
                        <div className="session-date">
                            {new Date(session.updated_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="message-history">
                <h3>
                    {currentSession ? currentSession.title : 'Select a conversation'}
                </h3>

                {loading ? (
                    <div className="loading">Loading messages...</div>
                ) : (
                    <div className="messages">
                        {messages.map(message => (
                            <MessageComponent key={message.id} message={message} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const MessageComponent = ({ message }) => {
    return (
        <div className={`message ${message.role}`}>
            <div className="message-header">
                <span className="role">{message.role}</span>
                <span className="timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                </span>
            </div>

            <div className="message-content">
                {message.content}
            </div>

            {message.agent_steps && message.agent_steps.length > 0 && (
                <div className="agent-steps">
                    <h4>Agent Reasoning:</h4>
                    {message.agent_steps.map(step => (
                        <div key={step.id} className={`agent-step ${step.type}`}>
                            <div className="step-header">
                                <span className="step-type">{step.type}</span>
                                <span className="step-title">{step.title}</span>
                                <span className={`step-status ${step.status}`}>
                                    {step.status}
                                </span>
                            </div>
                            <div className="step-content">{step.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export { ConversationManager, MessageComponent };
```

### Session Management Integration

#### Complete Session Workflow

```javascript
class SessionManager {
    constructor(baseUrl, authToken) {
        this.client = new BusinessAnalystClient(baseUrl);
        this.authToken = authToken;
        this.currentSession = null;
        this.messageCache = new Map();
    }

    // Create a new conversation session
    async createSession(title = "New Conversation") {
        try {
            const response = await fetch(`${this.client.baseUrl}${this.client.apiPrefix}/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title,
                    metadata: {
                        created_by: 'web_app',
                        version: '1.0'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to create session: ${response.status}`);
            }

            const session = await response.json();
            this.currentSession = session;
            return session;
        } catch (error) {
            console.error('Session creation failed:', error);
            throw error;
        }
    }

    // Load conversation history and restore context
    async loadSession(sessionId) {
        try {
            // Get session details
            const sessionResponse = await fetch(`${this.client.baseUrl}${this.client.apiPrefix}/sessions/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!sessionResponse.ok) {
                throw new Error(`Session not found: ${sessionResponse.status}`);
            }

            const session = await sessionResponse.json();
            this.currentSession = session;

            // Load message history
            const messages = await this.getSessionMessages(sessionId);
            this.messageCache.set(sessionId, messages);

            return {
                session: session,
                messages: messages,
                threadId: session.thread_id
            };
        } catch (error) {
            console.error('Session loading failed:', error);
            throw error;
        }
    }

    // Get cached or fresh message history
    async getSessionMessages(sessionId) {
        // Check cache first
        if (this.messageCache.has(sessionId)) {
            return this.messageCache.get(sessionId);
        }

        try {
            const response = await fetch(`${this.client.baseUrl}${this.client.apiPrefix}/sessions/${sessionId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to get messages: ${response.status}`);
            }

            const data = await response.json();
            this.messageCache.set(sessionId, data.messages);
            return data.messages;
        } catch (error) {
            console.error('Message loading failed:', error);
            return [];
        }
    }

    // Continue conversation with existing context
    async continueConversation(message, onUpdate) {
        if (!this.currentSession) {
            throw new Error('No active session - create or load a session first');
        }

        const streaming = new StreamingChat(this.client);

        // Add user message to cache immediately
        const userMessage = {
            id: `user_${Date.now()}`,
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
        };

        const cachedMessages = this.messageCache.get(this.currentSession.id) || [];
        cachedMessages.push(userMessage);
        this.messageCache.set(this.currentSession.id, cachedMessages);

        // Start streaming with session context
        return await streaming.startConversation(
            message,
            this.currentSession.thread_id,
            (event) => {
                // Update cache with assistant responses
                if (event.type === 'final_response') {
                    const assistantMessage = {
                        id: `assistant_${Date.now()}`,
                        role: 'assistant',
                        content: event.content,
                        timestamp: new Date().toISOString(),
                        agent_steps: this.extractAgentSteps(event)
                    };

                    const messages = this.messageCache.get(this.currentSession.id) || [];
                    messages.push(assistantMessage);
                    this.messageCache.set(this.currentSession.id, messages);
                }

                if (onUpdate) {
                    onUpdate(event);
                }
            }
        );
    }

    extractAgentSteps(event) {
        // Extract agent steps from streaming event metadata
        if (event.metadata && event.metadata.tools_used) {
            return event.metadata.tools_used.map((tool, index) => ({
                id: `step_${Date.now()}_${index}`,
                type: 'tool_call',
                title: tool,
                content: `Executed ${tool}`,
                timestamp: new Date().toISOString(),
                status: 'complete'
            }));
        }
        return [];
    }

    // Clear cache when user logs out
    clearCache() {
        this.messageCache.clear();
        this.currentSession = null;
    }
}
```

### Error Handling and Fallbacks

```javascript
class RobustMessageLoader {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    async loadWithRetry(sessionId) {
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                return await this.sessionManager.getSessionMessages(sessionId);
            } catch (error) {
                console.warn(`Message loading attempt ${attempt} failed:`, error);

                if (attempt === this.retryAttempts) {
                    // Final attempt failed - provide fallback
                    return this.provideFallback(sessionId, error);
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }
    }

    provideFallback(sessionId, error) {
        console.error(`Failed to load messages for session ${sessionId}:`, error);

        // Return empty state with error indication
        return [{
            id: 'error_message',
            role: 'assistant',
            content: 'Sorry, I couldn\'t load the conversation history. You can start a new conversation, and I\'ll remember our discussion going forward.',
            timestamp: new Date().toISOString(),
            agent_steps: [{
                id: 'error_step',
                type: 'error',
                title: 'History Load Failed',
                content: 'Message history temporarily unavailable',
                timestamp: new Date().toISOString(),
                status: 'error'
            }]
        }];
    }
}
```

### Production Integration Checklist

#### Authentication Requirements
- ✅ JWT token validation for all message history endpoints
- ✅ Session ownership verification (users can only access their own sessions)
- ✅ Proper error handling for expired/invalid tokens

#### Performance Considerations
- ✅ Message caching to reduce API calls
- ✅ Lazy loading of message history (load on session selection)
- ✅ Pagination support for large conversations (if needed)
- ✅ Response time under 2 seconds for typical conversations

#### Error Handling
- ✅ Graceful degradation when message history unavailable
- ✅ Retry logic for transient failures
- ✅ Clear error messages for users
- ✅ Fallback to empty state when necessary

#### Security
- ✅ No sensitive data in error messages
- ✅ Proper input validation for session IDs
- ✅ Rate limiting protection
- ✅ CORS configuration for web app domains

### Testing Message History Integration

#### Unit Tests for Message Loading

```javascript
describe('Message History Integration', () => {
    let sessionManager, mockAuthToken;

    beforeEach(() => {
        mockAuthToken = 'mock_jwt_token';
        sessionManager = new SessionManager('http://localhost:8000', mockAuthToken);
    });

    test('should load session messages successfully', async () => {
        // Mock successful API response
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({
                session_id: 'test_session_123',
                thread_id: 'test_thread_123',
                messages: [
                    {
                        id: 'msg_1',
                        role: 'user',
                        content: 'Hello',
                        timestamp: '2025-06-24T05:43:33.728996+00:00'
                    },
                    {
                        id: 'msg_2',
                        role: 'assistant',
                        content: 'Hi there! How can I help you?',
                        timestamp: '2025-06-24T05:43:34.728996+00:00',
                        agent_steps: [
                            {
                                id: 'step_1',
                                type: 'thinking',
                                title: 'Sequential Thinking',
                                content: 'User is greeting me, I should respond politely',
                                timestamp: '2025-06-24T05:43:34.728996+00:00',
                                status: 'complete'
                            }
                        ]
                    }
                ],
                total_messages: 2,
                last_updated: '2025-06-24T05:43:34.728996+00:00'
            })
        });

        const messages = await sessionManager.getSessionMessages('test_session_123');

        expect(messages).toHaveLength(2);
        expect(messages[0].role).toBe('user');
        expect(messages[1].role).toBe('assistant');
        expect(messages[1].agent_steps).toHaveLength(1);
        expect(messages[1].agent_steps[0].type).toBe('thinking');
    });

    test('should handle authentication errors', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized'
        });

        await expect(
            sessionManager.getSessionMessages('test_session_123')
        ).rejects.toThrow('Failed to get messages: 401');
    });

    test('should cache messages to reduce API calls', async () => {
        const mockResponse = {
            ok: true,
            json: () => Promise.resolve({
                session_id: 'test_session_123',
                messages: [{ id: 'msg_1', role: 'user', content: 'Test' }],
                total_messages: 1
            })
        };

        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        // First call should hit API
        await sessionManager.getSessionMessages('test_session_123');
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Second call should use cache
        await sessionManager.getSessionMessages('test_session_123');
        expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1, not 2
    });
});
```

#### Integration Test Example

```javascript
describe('End-to-End Message History Flow', () => {
    let sessionManager;

    beforeEach(() => {
        sessionManager = new SessionManager('http://localhost:8000', 'real_jwt_token');
    });

    test('complete conversation flow with history persistence', async () => {
        // Step 1: Create new session
        const session = await sessionManager.createSession('Test Conversation');
        expect(session.id).toBeTruthy();
        expect(session.thread_id).toBeTruthy();

        // Step 2: Send first message
        const events1 = [];
        await sessionManager.continueConversation(
            'What are the current market trends?',
            (event) => events1.push(event)
        );

        // Verify streaming events
        expect(events1.some(e => e.type === 'final_response')).toBe(true);

        // Step 3: Load message history
        const messages = await sessionManager.getSessionMessages(session.id);
        expect(messages.length).toBeGreaterThan(0);
        expect(messages[0].role).toBe('user');
        expect(messages[0].content).toBe('What are the current market trends?');

        // Step 4: Continue conversation
        const events2 = [];
        await sessionManager.continueConversation(
            'Can you provide more details about technology trends?',
            (event) => events2.push(event)
        );

        // Step 5: Verify conversation continuity
        const updatedMessages = await sessionManager.getSessionMessages(session.id);
        expect(updatedMessages.length).toBeGreaterThan(messages.length);

        // Should have both user messages
        const userMessages = updatedMessages.filter(m => m.role === 'user');
        expect(userMessages).toHaveLength(2);
        expect(userMessages[1].content).toBe('Can you provide more details about technology trends?');
    });

    test('session restoration after logout/login', async () => {
        // Simulate user logout
        sessionManager.clearCache();

        // Simulate user login with existing session
        const existingSessionId = 'existing_session_123';
        const restoredSession = await sessionManager.loadSession(existingSessionId);

        expect(restoredSession.session).toBeTruthy();
        expect(restoredSession.messages).toBeInstanceOf(Array);
        expect(restoredSession.threadId).toBeTruthy();

        // Should be able to continue conversation
        await sessionManager.continueConversation(
            'Continuing our previous discussion...',
            (event) => console.log('Event:', event.type)
        );
    });
});
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

This integration guide provides your web app team with everything needed to successfully integrate the Business Analyst Agent service, including complete event references, security best practices, performance monitoring, comprehensive testing examples, and the new **message history functionality** for persistent conversation management.

## 🎯 **Message History Integration Summary**

The newly added message history functionality provides:

- ✅ **Persistent Conversations**: Chat history survives browser sessions, logout/login cycles
- ✅ **Native LangGraph Integration**: Uses existing checkpoint system, no additional storage needed
- ✅ **Agent Reasoning Steps**: Includes detailed agent thinking and tool execution history
- ✅ **Production Ready**: Authentication, error handling, caching, and performance optimized
- ✅ **Easy Integration**: Simple REST API with comprehensive TypeScript interfaces

**Key Endpoints Added:**
- `GET /api/v1/sessions/{session_id}/messages` - Retrieve conversation history
- Enhanced session management with message persistence

**Frontend teams can now solve the chat history persistence issue** by integrating these endpoints into their conversation management systems.