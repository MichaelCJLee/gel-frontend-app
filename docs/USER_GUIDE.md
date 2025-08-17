# FastAPI Business Analyst Agent - User Guide

## Overview

The FastAPI Business Analyst Agent service provides a production-ready API for interacting with the Business Analyst Agent through real-time streaming and traditional request-response patterns. This service offers multi-user support, secure session isolation, and comprehensive streaming capabilities.

## 🚀 Quick Start

### Starting the Service

```bash
# Development mode
python fastapi_service/run.py

# Production mode (recommended)
uvicorn fastapi_service.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Basic Health Check

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-22T10:30:00.123456",
  "service": "Business Analyst Agent API",
  "version": "1.0.0"
}
```

## 📡 API Endpoints

### Core Endpoints

| Endpoint | Method | Purpose | Response Type |
|----------|--------|---------|---------------|
| `/` | GET | Service information and available endpoints | JSON |
| `/api/v1/health` | GET | Basic health check | JSON |
| `/api/v1/health/detailed` | GET | Detailed health with dependencies | JSON |
| `/api/v1/agent/info` | GET | Agent capabilities and metadata | JSON |
| `/api/v1/chat/stream` | POST | Real-time streaming chat | SSE Stream |
| `/api/v1/chat/invoke` | POST | Simple request-response chat | JSON |
| `/api/v1/stream/test` | GET | Test streaming connectivity | SSE Stream |

## 🔄 Real-Time Streaming

### Streaming Chat Endpoint

**POST** `/api/v1/chat/stream`

Start a real-time conversation with the Business Analyst Agent using Server-Sent Events.

#### Request Body

```json
{
  "message": "Analyze the current market trends for electric vehicles",
  "thread_id": "user_alice_session_20241222_143706_abc123",
  "stream_mode": "updates",
  "include_metadata": true,
  "user_id": "alice"
}
```

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `message` | string | Yes | - | User message to send to the agent |
| `thread_id` | string | No | auto-generated | Thread ID for conversation continuity |
| `stream_mode` | string | No | "updates" | Streaming mode: `updates`, `messages`, `values`, or `debug` |
| `include_metadata` | boolean | No | true | Include metadata in streaming response |
| `user_id` | string | No | null | User ID for session tracking and isolation |

#### Stream Modes

1. **`updates`** (Recommended): Complete agent state updates with tool calls and reasoning
2. **`messages`**: Individual message updates as they're generated
3. **`values`**: Final values and results from each step
4. **`debug`**: Detailed debugging information for development

#### JavaScript Integration Example

```javascript
async function startAgentChat(message, userId = null) {
    // 1. Start the streaming request
    const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: message,
            user_id: userId,
            stream_mode: 'updates',
            include_metadata: true
        })
    });

    // 2. Set up Server-Sent Events listener
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    handleStreamingUpdate(data);
                } catch (e) {
                    console.error('Failed to parse streaming data:', e);
                }
            }
        }
    }
}

function handleStreamingUpdate(data) {
    console.log('Streaming update:', data);
    
    // Handle different event types
    switch (data.type) {
        case 'agent_step':
            displayAgentStep(data.content);
            break;
        case 'tool_call':
            displayToolCall(data.content);
            break;
        case 'final_response':
            displayFinalResponse(data.content);
            break;
        case 'error':
            displayError(data.content);
            break;
    }
}
```

### Alternative: EventSource API

For simpler integration, you can use the browser's built-in EventSource API:

```javascript
function startAgentChatWithEventSource(message, userId = null) {
    // Note: EventSource only supports GET requests, so we need to encode parameters
    const params = new URLSearchParams({
        message: message,
        user_id: userId || '',
        stream_mode: 'updates'
    });
    
    const eventSource = new EventSource(`/api/v1/chat/stream?${params}`);
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleStreamingUpdate(data);
    };
    
    eventSource.onerror = function(error) {
        console.error('EventSource error:', error);
        eventSource.close();
    };
    
    // Close connection when done
    eventSource.addEventListener('stream_complete', function(event) {
        eventSource.close();
    });
}
```

## 💬 Simple Chat

### Non-Streaming Chat Endpoint

**POST** `/api/v1/chat/invoke`

For simple request-response interactions without streaming.

#### Request Body

```json
{
  "message": "What are the key factors to consider in market analysis?",
  "thread_id": "user_alice_session_20241222_143706_abc123"
}
```

#### Response

```json
{
  "response": "Market analysis requires consideration of several key factors...",
  "thread_id": "user_alice_session_20241222_143706_abc123",
  "timestamp": "2024-12-22T10:30:00.123456",
  "metadata": {
    "agent_version": "1.0.0",
    "processing_time": 2.45,
    "tools_used": ["web_search", "confluence_search"]
  }
}
```

## 🔐 Security & Session Management

### User Isolation

The service provides complete isolation between users:

- **Per-request agent instances**: Each request gets a fresh agent
- **User-specific thread IDs**: Automatic prefixing prevents session hijacking
- **Memory isolation**: No cross-user data leakage
- **Concurrent safety**: Multiple users can interact simultaneously

### Thread ID Format

Thread IDs are automatically formatted for security:

```
user_{user_id}_session_{timestamp}_{unique_id}
```

Example: `user_alice_session_20241222_143706_abc123`

### Best Practices

1. **Always provide `user_id`** for multi-user applications
2. **Use consistent thread IDs** for conversation continuity
3. **Handle connection errors** gracefully with reconnection logic
4. **Implement timeouts** for long-running requests

## 📊 Agent Capabilities

### Available Tools

The Business Analyst Agent has access to 16 V7 multi-source tools:

1. **Azure DevOps Tools**: Work item queries, board analysis
2. **Confluence Tools**: Documentation search and analysis
3. **Vector Search Tools**: Semantic search across knowledge bases
4. **Web Search Tools**: Real-time web information retrieval
5. **Template Generation**: T1 template creation and formatting
6. **Expansion Tools**: Self-reasoning semantic expansion
7. **Fusion Tools**: Multi-source data combination
8. **General Tools**: Utility functions and data processing

### Agent Information Endpoint

**GET** `/api/v1/agent/info`

```json
{
  "agent_name": "Business Analyst Agent",
  "version": "1.0.0",
  "capabilities": [
    "Multi-source progressive search",
    "Azure DevOps integration",
    "Confluence knowledge base access",
    "Vector semantic search",
    "Real-time web search",
    "T1 template generation",
    "Self-reasoning expansion"
  ],
  "tools_count": 16,
  "supported_modes": ["updates", "messages", "values", "debug"],
  "max_concurrent_sessions": 10
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Service Configuration
FASTAPI_SERVICE_NAME="Business Analyst Agent API"
FASTAPI_HOST="0.0.0.0"
FASTAPI_PORT="8000"
FASTAPI_ENVIRONMENT="production"
FASTAPI_DEBUG="false"

# CORS Configuration (Production)
FASTAPI_CORS_ORIGINS='["https://yourdomain.com", "https://app.yourdomain.com"]'

# Agent Configuration
FASTAPI_AGENT_TIMEOUT="300"
FASTAPI_MAX_CONCURRENT_REQUESTS="10"
FASTAPI_STREAM_TIMEOUT="600"
```

### Production Configuration

For production deployment, create a `.env` file:

```env
FASTAPI_ENVIRONMENT=production
FASTAPI_DEBUG=false
FASTAPI_CORS_ORIGINS=["https://yourdomain.com"]
FASTAPI_LOG_LEVEL=info
FASTAPI_MAX_CONCURRENT_REQUESTS=20
```

## 🚨 Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "error_code": "INVALID_INPUT",
  "message": "Message field is required"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred",
  "path": "/api/v1/chat/stream",
  "method": "POST"
}
```

#### Streaming Errors
```json
{
  "event": "error",
  "data": {
    "type": "agent_error",
    "message": "Agent processing failed",
    "recoverable": true,
    "retry_after": 5
  }
}
```

### Error Recovery

For streaming connections, implement reconnection logic:

```javascript
function createResilientStream(message, maxRetries = 3) {
    let retryCount = 0;
    
    function attemptConnection() {
        const eventSource = new EventSource('/api/v1/chat/stream');
        
        eventSource.onerror = function(error) {
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(() => {
                    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                    attemptConnection();
                }, 1000 * retryCount); // Exponential backoff
            } else {
                console.error('Max retries exceeded');
            }
        };
        
        return eventSource;
    }
    
    return attemptConnection();
}
```

## 📈 Performance & Monitoring

### Health Checks

The service provides multiple health check endpoints:

```bash
# Basic health
curl http://localhost:8000/api/v1/health

# Detailed health with dependencies
curl http://localhost:8000/api/v1/health/detailed

# Readiness check
curl http://localhost:8000/api/v1/health/ready

# Liveness check  
curl http://localhost:8000/api/v1/health/live
```

### Performance Metrics

Monitor these key metrics:

- **Response time**: Average response time for chat requests
- **Concurrent connections**: Number of active SSE streams
- **Error rate**: Percentage of failed requests
- **Agent processing time**: Time spent in agent execution
- **Memory usage**: Per-request memory consumption

## 🐛 Troubleshooting

### Common Issues

#### Streaming Connection Drops

**Symptoms**: EventSource disconnects unexpectedly
**Solutions**:
1. Implement reconnection logic
2. Check network connectivity
3. Verify server-side timeout settings

#### Cross-User Data Leakage

**Symptoms**: User sees another user's conversation
**Solutions**:
1. Always provide `user_id` in requests
2. Verify thread ID format includes user prefix
3. Check agent isolation implementation

#### Slow Response Times

**Symptoms**: Long delays in agent responses
**Solutions**:
1. Monitor agent processing time
2. Check tool execution performance
3. Consider request queuing for high load

### Debug Mode

Enable debug mode for detailed logging:

```bash
FASTAPI_DEBUG=true FASTAPI_LOG_LEVEL=debug python fastapi_service/run.py
```

Debug mode provides:
- Detailed request/response logging
- Agent execution traces
- Tool call debugging information
- Performance timing data

## 📚 Additional Resources

- **API Documentation**: Visit `/docs` for interactive Swagger UI
- **ReDoc Documentation**: Visit `/redoc` for alternative API docs
- **Integration Guide**: See `INTEGRATION_GUIDE.md` for web app integration
- **Streaming Events Reference**: See `STREAMING_EVENTS.md` for complete event reference

## 🆘 Support

For issues or questions:

1. Check the health endpoints for service status
2. Review logs for error details
3. Verify configuration settings
4. Test with the streaming health check endpoint
5. Consult the integration guide for web app specific issues

The service is designed to be robust and self-healing, with comprehensive error handling and monitoring capabilities built-in. 