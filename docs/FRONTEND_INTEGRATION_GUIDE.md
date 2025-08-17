# Frontend Integration Guide - Business Analyst Agent API

## 🎯 **Overview**

This guide provides comprehensive integration instructions for the Business Analyst Agent FastAPI service. The API is production-ready with full authentication, memory persistence, and real-time streaming capabilities.

**Service URL**: `http://localhost:8000` (development)  
**API Base Path**: `/api/v1`  
**Authentication**: Supabase JWT Bearer tokens  
**Memory**: PostgreSQL-backed persistent memory with AsyncPostgresSaver  

---

## 🔐 **Authentication System**

### **Authentication Method**
- **Type**: JWT Bearer tokens from Supabase
- **Header**: `Authorization: Bearer <jwt_token>`
- **Provider**: Native Supabase authentication

### **Getting JWT Tokens**
```javascript
// Using Supabase JavaScript client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://fzooarztswbfepghrczt.supabase.co',
  'your_anon_key'
)

// Sign in user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

if (data.session) {
  const jwt_token = data.session.access_token
  // Use this token in API requests
}
```

### **Token Usage in Requests**
```javascript
const headers = {
  'Authorization': `Bearer ${jwt_token}`,
  'Content-Type': 'application/json'
}
```

### **Authentication Errors**
| Status Code | Error | Description |
|-------------|-------|-------------|
| `401` | Authentication failed | Invalid or expired JWT token |
| `403` | Not authenticated | Missing Authorization header |

---

## 📋 **Session Management API**

### **1. Create Chat Session**
**Endpoint**: `POST /api/v1/sessions/`  
**Authentication**: Required  

```javascript
const createSession = async (title, metadata = {}) => {
  const response = await fetch('http://localhost:8000/api/v1/sessions/', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: title,
      metadata: metadata
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return await response.json()
}

// Example response:
{
  "id": "a1d9e0fd-1c3d-4e0c-a944-25303bdb9dc9",
  "user_id": "42f59e2a-abd2-485a-bddf-cdaf9e69f275",
  "thread_id": "user_42f59e2a-abd2-485a-bddf-cdaf9e69f275_session_9de221c1",
  "title": "Integration Guide Test Session",
  "created_at": "2025-06-24T02:48:32.430619Z",
  "updated_at": "2025-06-24T02:48:32.430619Z",
  "is_active": true,
  "metadata": {}
}
```

### **2. List User Sessions**
**Endpoint**: `GET /api/v1/sessions/`  
**Authentication**: Required  

```javascript
const listSessions = async (page = 1, pageSize = 20, activeOnly = true) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString(),
    active_only: activeOnly.toString()
  })
  
  const response = await fetch(`http://localhost:8000/api/v1/sessions/?${params}`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  })
  
  return await response.json()
}

// Example response:
{
  "sessions": [
    {
      "id": "session_id",
      "user_id": "user_id", 
      "thread_id": "user_user_id_session_random",
      "title": "Session Title",
      "created_at": "2025-06-24T02:48:32.430619Z",
      "updated_at": "2025-06-24T02:48:32.430619Z",
      "is_active": true,
      "metadata": {}
    }
  ],
  "total": 37,
  "page": 1,
  "page_size": 20
}
```

### **3. Get Specific Session**
**Endpoint**: `GET /api/v1/sessions/{session_id}`  
**Authentication**: Required  

```javascript
const getSession = async (sessionId) => {
  const response = await fetch(`http://localhost:8000/api/v1/sessions/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  })
  
  if (response.status === 404) {
    throw new Error('Session not found')
  }
  
  return await response.json()
}
```

### **4. Update Session**
**Endpoint**: `PUT /api/v1/sessions/{session_id}`  
**Authentication**: Required  

```javascript
const updateSession = async (sessionId, updates) => {
  const response = await fetch(`http://localhost:8000/api/v1/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${jwt_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  return await response.json()
}

// Example usage:
await updateSession('session_id', {
  title: 'Updated Title',
  is_active: false
})
```

### **5. Delete Session**
**Endpoint**: `DELETE /api/v1/sessions/{session_id}`  
**Authentication**: Required  

```javascript
const deleteSession = async (sessionId) => {
  const response = await fetch(`http://localhost:8000/api/v1/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${jwt_token}`
    }
  })
  
  if (response.status === 404) {
    throw new Error('Session not found')
  }
  
  return await response.json()
}
```

---

## 🌊 **Real-Time Streaming API**

### **Primary Streaming Endpoint**
**Endpoint**: `POST /api/v1/chat/stream`  
**Authentication**: Required  
**Response Type**: Server-Sent Events (SSE)  

### **Request Format**
```javascript
const streamRequest = {
  message: "Your message to the agent",
  session_id: "optional_session_id",        // Use existing session
  thread_id: "optional_thread_id",          // Use existing thread
  stream_mode: "updates",                   // updates, messages, values, debug
  use_persistent_memory: true,              // Use PostgreSQL memory
  include_metadata: true                    // Include response metadata
}
```

### **Streaming Implementation**
```javascript
const streamChat = async (message, sessionId = null, usePersistentMemory = true) => {
  const requestBody = {
    message: message,
    stream_mode: "updates",
    use_persistent_memory: usePersistentMemory,
    include_metadata: true
  }
  
  if (sessionId) {
    requestBody.session_id = sessionId
  }
  
  const response = await fetch('http://localhost:8000/api/v1/chat/stream', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            handleStreamEvent(data)
          } catch (e) {
            console.warn('Failed to parse SSE data:', line)
          }
        } else if (line.startsWith('event: ')) {
          const eventType = line.slice(7)
          handleEventType(eventType)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

const handleStreamEvent = (data) => {
  switch (data.type) {
    case 'stream_start':
      console.log('Stream started:', data.thread_id)
      break
    case 'stream_complete':
      console.log('Stream completed')
      break
    case 'chunk_processed':
      // Progress indicator
      break
    default:
      console.log('Stream data:', data)
  }
}
```

### **Stream Event Types**
| Event Type | Description | Data Format |
|------------|-------------|-------------|
| `status` | Stream lifecycle events | `{type: "stream_start/stream_complete", timestamp, thread_id?}` |
| `update` | Agent node updates | `{node: "agent", content: {messages: [...]}, timestamp}` |
| `message` | Individual messages | `{type: "AIMessage", content: "...", metadata: {...}}` |
| `progress` | Processing progress | `{type: "chunk_processed", timestamp}` |
| `error` | Error events | `{type: "stream_error", error: "...", timestamp}` |

---

## 💬 **Simple Chat API**

### **Non-Streaming Endpoint**
**Endpoint**: `POST /api/v1/chat/invoke`  
**Authentication**: Not required (legacy support)  

```javascript
const simpleChat = async (message, threadId = null) => {
  const response = await fetch('http://localhost:8000/api/v1/chat/invoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: message,
      thread_id: threadId
    })
  })
  
  return await response.json()
}

// Example response:
{
  "response": "Hello! How can I help you today?",
  "thread_id": "test_thread_123",
  "timestamp": "2025-06-24T02:49:21.733547",
  "metadata": {
    "message_count": 4,
    "processing_time": "calculated_if_needed",
    "messages": [...]
  }
}
```

---

## 🧠 **Memory Management**

### **Memory Persistence**
- **Type**: PostgreSQL-backed with AsyncPostgresSaver
- **Scope**: Per user, per session/thread
- **Isolation**: Complete user isolation via thread ID prefixing
- **Persistence**: Conversations persist across requests within same session

### **Thread ID Format**
```
user_{user_id}_session_{random_suffix}
Example: user_42f59e2a-abd2-485a-bddf-cdaf9e69f275_session_9de221c1
```

### **Memory Modes**
```javascript
// Persistent memory (recommended)
{
  "use_persistent_memory": true  // Uses PostgreSQL AsyncPostgresSaver
}

// In-memory (for testing)
{
  "use_persistent_memory": false  // Uses MemorySaver
}
```

---

## 🔍 **Health Check & Monitoring**

### **Health Check**
**Endpoint**: `GET /api/v1/health`  
**Authentication**: Not required  

```javascript
const checkHealth = async () => {
  const response = await fetch('http://localhost:8000/api/v1/health')
  return await response.json()
}

// Response:
{
  "status": "healthy",
  "timestamp": "2025-06-24T02:47:50.233767",
  "version": "1.0.0",
  "environment": "development"
}
```

### **Service Metrics**
**Endpoint**: `GET /api/v1/metrics`  
**Authentication**: Not required  

```javascript
const getMetrics = async () => {
  const response = await fetch('http://localhost:8000/api/v1/metrics')
  return await response.json()
}
```

---

## ⚠️ **Error Handling**

### **Standard Error Format**
```javascript
{
  "error": "Error Type",
  "message": "Human readable message",
  "status_code": 400,
  "path": "/api/v1/endpoint",
  "method": "POST",
  "timestamp": "2025-06-24T02:47:50.233767"
}
```

### **Common HTTP Status Codes**
| Code | Meaning | Common Causes |
|------|---------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid request format or parameters |
| `401` | Unauthorized | Invalid or expired JWT token |
| `403` | Forbidden | Missing authentication or access denied |
| `404` | Not Found | Resource doesn't exist or user doesn't own it |
| `422` | Validation Error | Request validation failed |
| `429` | Rate Limited | Too many requests (30/minute limit) |
| `500` | Server Error | Internal server error |

### **Error Handling Best Practices**
```javascript
const handleApiError = async (response) => {
  if (!response.ok) {
    const errorData = await response.json()

    switch (response.status) {
      case 401:
        // Redirect to login or refresh token
        await refreshAuthToken()
        break
      case 403:
        // Show access denied message
        showError('Access denied')
        break
      case 404:
        // Resource not found
        showError('Resource not found')
        break
      case 429:
        // Rate limited - implement backoff
        await delay(60000) // Wait 1 minute
        break
      default:
        showError(errorData.message || 'An error occurred')
    }

    throw new Error(`${response.status}: ${errorData.message}`)
  }
}
```

---

## 🚀 **Production Considerations**

### **Rate Limiting**
- **Limit**: 30 requests per minute per IP
- **Burst**: Additional burst capacity available
- **Headers**: Check `X-RateLimit-*` headers in responses

### **CORS Configuration**
- **Allowed Origins**: `localhost:3000`, `localhost:3001`, `localhost:5173`, `localhost:5174`
- **Credentials**: Supported
- **Methods**: All standard HTTP methods
- **Headers**: All headers allowed

### **Security Headers**
- **Content Security Policy**: Enabled
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin

### **Connection Management**
- **Max Connections**: 100 concurrent connections
- **Timeout**: Configurable connection timeout
- **Keep-Alive**: Supported for streaming

---

## 📚 **Complete Integration Example**

```javascript
class BusinessAnalystClient {
  constructor(supabaseUrl, supabaseAnonKey) {
    this.apiBase = 'http://localhost:8000/api/v1'
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
    this.jwt_token = null
  }

  async authenticate(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email, password
    })

    if (error) throw error
    this.jwt_token = data.session.access_token
    return data.user
  }

  async createSession(title, metadata = {}) {
    const response = await fetch(`${this.apiBase}/sessions/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, metadata })
    })

    await this.handleErrors(response)
    return await response.json()
  }

  async streamChat(message, sessionId = null, onEvent = null) {
    const requestBody = {
      message,
      stream_mode: "updates",
      use_persistent_memory: true,
      include_metadata: true
    }

    if (sessionId) requestBody.session_id = sessionId

    const response = await fetch(`${this.apiBase}/chat/stream`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody)
    })

    await this.handleErrors(response)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (onEvent) onEvent(data)
            } catch (e) {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.jwt_token}`,
      'Content-Type': 'application/json'
    }
  }

  async handleErrors(response) {
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`${response.status}: ${errorData.message}`)
    }
  }
}

// Usage Example:
const client = new BusinessAnalystClient(
  'https://fzooarztswbfepghrczt.supabase.co',
  'your_anon_key'
)

// Authenticate
await client.authenticate('user@example.com', 'password')

// Create session
const session = await client.createSession('My Chat Session')

// Stream chat with event handling
await client.streamChat(
  'Hello, how can you help me with business analysis?',
  session.id,
  (event) => {
    if (event.type === 'stream_start') {
      console.log('Chat started')
    } else if (event.node === 'agent') {
      console.log('Agent response:', event.content.messages[0].content)
    }
  }
)
```

---

## 🎯 **Next Steps**

1. **Set up authentication** with your Supabase credentials
2. **Implement session management** for user conversations
3. **Add streaming chat interface** with real-time updates
4. **Handle errors gracefully** with proper user feedback
5. **Test memory persistence** across different sessions
6. **Monitor performance** using health check and metrics endpoints

This integration guide provides everything needed for seamless frontend integration with the Business Analyst Agent API. The system is production-ready with comprehensive authentication, memory persistence, and real-time streaming capabilities.
