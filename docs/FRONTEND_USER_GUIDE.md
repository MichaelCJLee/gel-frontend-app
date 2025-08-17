# Frontend User Guide - Business Analyst Agent API

## 🎯 **Quick Start Guide**

This guide provides step-by-step instructions for frontend developers to integrate with the Business Analyst Agent API. Follow these steps for a seamless integration experience.

---

## 🚀 **Step 1: Environment Setup**

### **Prerequisites**
- Node.js 16+ or modern browser environment
- Supabase account and project
- Access to the Business Analyst Agent API service

### **Required Dependencies**
```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

### **Environment Variables**
```javascript
// .env or environment configuration
VITE_SUPABASE_URL=https://fzooarztswbfepghrczt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 🔐 **Step 2: Authentication Setup**

### **Initialize Supabase Client**
```javascript
// auth.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get current session
export const getCurrentSession = () => {
  return supabase.auth.getSession()
}

// Sign in user
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

// Sign out user
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get JWT token for API requests
export const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}
```

### **Authentication Hook (React Example)**
```javascript
// useAuth.js
import { useState, useEffect } from 'react'
import { supabase } from './auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      setToken(session?.access_token || null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setToken(session?.access_token || null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, token, loading }
}
```

---

## 📋 **Step 3: Session Management**

### **Session Manager Class**
```javascript
// sessionManager.js
class SessionManager {
  constructor(apiBaseUrl, getAuthToken) {
    this.apiBase = apiBaseUrl
    this.getAuthToken = getAuthToken
  }

  async getHeaders() {
    const token = await this.getAuthToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async createSession(title, metadata = {}) {
    const response = await fetch(`${this.apiBase}/sessions/`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ title, metadata })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to create session: ${error.message}`)
    }

    return await response.json()
  }

  async listSessions(page = 1, pageSize = 20, activeOnly = true) {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      active_only: activeOnly.toString()
    })

    const response = await fetch(`${this.apiBase}/sessions/?${params}`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to list sessions: ${error.message}`)
    }

    return await response.json()
  }

  async getSession(sessionId) {
    const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found')
      }
      const error = await response.json()
      throw new Error(`Failed to get session: ${error.message}`)
    }

    return await response.json()
  }

  async updateSession(sessionId, updates) {
    const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: await this.getHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to update session: ${error.message}`)
    }

    return await response.json()
  }

  async deleteSession(sessionId) {
    const response = await fetch(`${this.apiBase}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: await this.getHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Failed to delete session: ${error.message}`)
    }

    return await response.json()
  }
}

export default SessionManager
```

---

## 🌊 **Step 4: Streaming Chat Implementation**

### **Chat Streaming Class**
```javascript
// chatStreamer.js
class ChatStreamer {
  constructor(apiBaseUrl, getAuthToken) {
    this.apiBase = apiBaseUrl
    this.getAuthToken = getAuthToken
  }

  async getHeaders() {
    const token = await this.getAuthToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async streamChat(message, options = {}) {
    const {
      sessionId = null,
      threadId = null,
      streamMode = 'updates',
      usePersistentMemory = true,
      onEvent = null,
      onError = null,
      onComplete = null
    } = options

    const requestBody = {
      message,
      stream_mode: streamMode,
      use_persistent_memory: usePersistentMemory,
      include_metadata: true
    }

    if (sessionId) requestBody.session_id = sessionId
    if (threadId) requestBody.thread_id = threadId

    try {
      const response = await fetch(`${this.apiBase}/chat/stream`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Streaming failed: ${error.message}`)
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
                if (onEvent) onEvent(data)
              } catch (e) {
                console.warn('Failed to parse SSE data:', line)
              }
            } else if (line.startsWith('event: ')) {
              const eventType = line.slice(7)
              // Handle event type if needed
            }
          }
        }

        if (onComplete) onComplete()
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (onError) onError(error)
      throw error
    }
  }
}

export default ChatStreamer
```

---

## 🎨 **Step 5: React Component Examples**

### **Chat Interface Component**
```javascript
// ChatInterface.jsx
import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import SessionManager from './sessionManager'
import ChatStreamer from './chatStreamer'

const ChatInterface = () => {
  const { user, token, loading } = useAuth()
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState(null)

  const sessionManager = useRef(null)
  const chatStreamer = useRef(null)

  useEffect(() => {
    if (token) {
      sessionManager.current = new SessionManager(
        import.meta.env.VITE_API_BASE_URL,
        () => token
      )
      chatStreamer.current = new ChatStreamer(
        import.meta.env.VITE_API_BASE_URL,
        () => token
      )
      loadSessions()
    }
  }, [token])

  const loadSessions = async () => {
    try {
      const response = await sessionManager.current.listSessions()
      setSessions(response.sessions)
    } catch (err) {
      setError(`Failed to load sessions: ${err.message}`)
    }
  }

  const createNewSession = async () => {
    try {
      const session = await sessionManager.current.createSession(
        'New Chat Session'
      )
      setCurrentSession(session)
      setMessages([])
      setSessions(prev => [session, ...prev])
    } catch (err) {
      setError(`Failed to create session: ${err.message}`)
    }
  }

  const selectSession = (session) => {
    setCurrentSession(session)
    setMessages([]) // In a real app, you'd load message history
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming || !currentSession) return

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsStreaming(true)
    setError(null)

    let agentMessage = {
      type: 'agent',
      content: '',
      timestamp: new Date().toISOString()
    }

    try {
      await chatStreamer.current.streamChat(inputMessage, {
        sessionId: currentSession.id,
        onEvent: (event) => {
          if (event.type === 'stream_start') {
            setMessages(prev => [...prev, agentMessage])
          } else if (event.node === 'agent' && event.content.messages) {
            const aiMessage = event.content.messages[0]
            if (aiMessage && aiMessage.content) {
              agentMessage.content = aiMessage.content
              setMessages(prev => 
                prev.map((msg, idx) => 
                  idx === prev.length - 1 ? { ...agentMessage } : msg
                )
              )
            }
          }
        },
        onError: (err) => {
          setError(`Streaming error: ${err.message}`)
        },
        onComplete: () => {
          setIsStreaming(false)
        }
      })
    } catch (err) {
      setError(`Failed to send message: ${err.message}`)
      setIsStreaming(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Please sign in to use the chat</div>

  return (
    <div className="chat-interface">
      {/* Session Sidebar */}
      <div className="sessions-sidebar">
        <button onClick={createNewSession}>New Chat</button>
        <div className="sessions-list">
          {sessions.map(session => (
            <div
              key={session.id}
              className={`session-item ${currentSession?.id === session.id ? 'active' : ''}`}
              onClick={() => selectSession(session)}
            >
              {session.title}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {currentSession ? (
          <>
            <div className="messages">
              {messages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  <div className="content">{message.content}</div>
                  <div className="timestamp">{message.timestamp}</div>
                </div>
              ))}
              {isStreaming && <div className="typing-indicator">Agent is typing...</div>}
            </div>

            <div className="input-area">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                disabled={isStreaming}
              />
              <button onClick={sendMessage} disabled={isStreaming || !inputMessage.trim()}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-session">Select a session or create a new one to start chatting</div>
        )}

        {error && (
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatInterface
```

---

## 🎨 **Step 6: Styling Examples**

### **Basic CSS Styles**
```css
/* ChatInterface.css */
.chat-interface {
  display: flex;
  height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sessions-sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  padding: 20px;
}

.sessions-sidebar button {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;
}

.sessions-sidebar button:hover {
  background: #0056b3;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.session-item:hover {
  background: #e9ecef;
}

.session-item.active {
  background: #007bff;
  color: white;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
}

.message.user {
  align-self: flex-end;
  background: #007bff;
  color: white;
}

.message.agent {
  align-self: flex-start;
  background: #f1f3f4;
  color: #333;
}

.message .content {
  margin-bottom: 4px;
}

.message .timestamp {
  font-size: 0.75rem;
  opacity: 0.7;
}

.typing-indicator {
  align-self: flex-start;
  padding: 12px 16px;
  background: #f1f3f4;
  border-radius: 18px;
  font-style: italic;
  color: #666;
}

.input-area {
  display: flex;
  padding: 20px;
  border-top: 1px solid #ddd;
  gap: 12px;
}

.input-area input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 14px;
}

.input-area input:focus {
  border-color: #007bff;
}

.input-area button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
}

.input-area button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.input-area button:not(:disabled):hover {
  background: #0056b3;
}

.no-session {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 18px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  margin: 20px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message button {
  background: none;
  border: none;
  color: #721c24;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}
```

---

## 🔧 **Step 7: Error Handling & Best Practices**

### **Error Handling Utilities**
```javascript
// errorHandler.js
export class APIError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }
}

export const handleAPIResponse = async (response) => {
  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: 'Unknown error occurred' }
    }

    throw new APIError(
      errorData.message || `HTTP ${response.status}`,
      response.status,
      errorData
    )
  }

  return response
}

export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error

      // Don't retry on authentication errors
      if (error.status === 401 || error.status === 403) {
        throw error
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

export const handleStreamingError = (error, onError) => {
  console.error('Streaming error:', error)

  if (error.status === 401) {
    // Handle authentication error
    onError('Authentication expired. Please sign in again.')
  } else if (error.status === 429) {
    // Handle rate limiting
    onError('Too many requests. Please wait a moment and try again.')
  } else if (error.status >= 500) {
    // Handle server errors
    onError('Server error. Please try again later.')
  } else {
    // Handle other errors
    onError(error.message || 'An unexpected error occurred.')
  }
}
```

### **Performance Optimization Tips**
```javascript
// performanceUtils.js
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Optimize message rendering
export const useMemoizedMessages = (messages) => {
  return useMemo(() => {
    return messages.map((message, index) => ({
      ...message,
      id: message.id || `${message.timestamp}-${index}`
    }))
  }, [messages])
}

// Connection health monitoring
export const useConnectionHealth = (apiBase) => {
  const [isHealthy, setIsHealthy] = useState(true)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiBase}/health`)
        setIsHealthy(response.ok)
      } catch {
        setIsHealthy(false)
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [apiBase])

  return isHealthy
}
```

---

## 📱 **Step 8: Mobile Responsiveness**

### **Responsive Design Considerations**
```css
/* Mobile-first responsive design */
@media (max-width: 768px) {
  .chat-interface {
    flex-direction: column;
  }

  .sessions-sidebar {
    width: 100%;
    height: auto;
    max-height: 200px;
    overflow-y: auto;
  }

  .sessions-list {
    flex-direction: row;
    overflow-x: auto;
    gap: 12px;
    padding-bottom: 8px;
  }

  .session-item {
    min-width: 150px;
    white-space: nowrap;
  }

  .message {
    max-width: 85%;
  }

  .input-area {
    padding: 12px;
  }

  .input-area input {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

@media (max-width: 480px) {
  .sessions-sidebar {
    padding: 12px;
  }

  .messages {
    padding: 12px;
  }

  .message {
    max-width: 90%;
    padding: 8px 12px;
  }

  .input-area {
    padding: 8px;
    gap: 8px;
  }
}
```

---

## 🧪 **Step 9: Testing Your Integration**

### **Test Checklist**
- [ ] **Authentication Flow**
  - [ ] User can sign in successfully
  - [ ] JWT token is properly stored and used
  - [ ] Authentication errors are handled gracefully
  - [ ] Token refresh works (if implemented)

- [ ] **Session Management**
  - [ ] Can create new sessions
  - [ ] Can list existing sessions
  - [ ] Can switch between sessions
  - [ ] Can update session titles
  - [ ] Can delete sessions

- [ ] **Chat Functionality**
  - [ ] Messages send successfully
  - [ ] Streaming responses work in real-time
  - [ ] Memory persistence works within sessions
  - [ ] Error messages are displayed properly
  - [ ] Loading states are shown during requests

- [ ] **Error Handling**
  - [ ] Network errors are caught and displayed
  - [ ] Authentication errors redirect to login
  - [ ] Rate limiting is handled gracefully
  - [ ] Server errors show appropriate messages

- [ ] **Performance**
  - [ ] Large message histories load quickly
  - [ ] Streaming doesn't cause memory leaks
  - [ ] UI remains responsive during long operations
  - [ ] Mobile performance is acceptable

### **Testing Utilities**
```javascript
// testUtils.js
export const createMockSession = () => ({
  id: 'test-session-id',
  user_id: 'test-user-id',
  thread_id: 'user_test-user-id_session_test',
  title: 'Test Session',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  metadata: {}
})

export const createMockMessage = (type = 'user', content = 'Test message') => ({
  type,
  content,
  timestamp: new Date().toISOString()
})

export const simulateStreamingResponse = async (onEvent, delay = 100) => {
  const events = [
    { type: 'stream_start', timestamp: new Date().toISOString() },
    {
      node: 'agent',
      content: {
        messages: [{
          type: 'AIMessage',
          content: 'This is a test response from the agent.'
        }]
      }
    },
    { type: 'stream_complete', timestamp: new Date().toISOString() }
  ]

  for (const event of events) {
    await new Promise(resolve => setTimeout(resolve, delay))
    onEvent(event)
  }
}
```

---

## 🎯 **Step 10: Deployment Considerations**

### **Environment Configuration**
```javascript
// config.js
const config = {
  development: {
    apiBaseUrl: 'http://localhost:8000/api/v1',
    supabaseUrl: 'https://fzooarztswbfepghrczt.supabase.co',
    logLevel: 'debug'
  },
  staging: {
    apiBaseUrl: 'https://staging-api.yourapp.com/api/v1',
    supabaseUrl: 'https://fzooarztswbfepghrczt.supabase.co',
    logLevel: 'info'
  },
  production: {
    apiBaseUrl: 'https://api.yourapp.com/api/v1',
    supabaseUrl: 'https://fzooarztswbfepghrczt.supabase.co',
    logLevel: 'error'
  }
}

export default config[import.meta.env.MODE] || config.development
```

### **Security Best Practices**
- Never expose service role keys in frontend code
- Use environment variables for all configuration
- Implement proper CORS headers on your API
- Validate all user inputs before sending to API
- Implement rate limiting on the frontend side
- Use HTTPS in production
- Implement proper error logging without exposing sensitive data

---

## 🎉 **Congratulations!**

You've successfully integrated the Business Analyst Agent API into your frontend application. Your implementation now includes:

✅ **Complete authentication flow** with Supabase
✅ **Session management** with full CRUD operations
✅ **Real-time streaming chat** with Server-Sent Events
✅ **Persistent memory** across conversations
✅ **Comprehensive error handling** and user feedback
✅ **Mobile-responsive design** for all devices
✅ **Production-ready architecture** with proper security

The API is now ready for production use with full memory persistence, user isolation, and real-time streaming capabilities. Your users will have a seamless chat experience with the Business Analyst Agent!
```
