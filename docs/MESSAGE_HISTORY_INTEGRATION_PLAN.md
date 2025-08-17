# Message History Integration Plan

## 🎯 **Objective**
Integrate the new backend message history API (`GET /api/v1/sessions/{session_id}/messages`) to restore chat history when users login, refresh browser, or switch sessions.

## 📊 **Current State Analysis**

### ✅ **What's Working**
- **Backend API**: Message history endpoint implemented and tested
- **Authentication**: JWT tokens working with SessionService
- **Session Management**: Sessions properly stored and retrieved from backend
- **Frontend Architecture**: ConversationContext manages conversations and messages

### ❌ **What's Missing**
- **Message Loading**: Frontend doesn't load messages from backend
- **Message Persistence**: Messages only stored in memory (`messagesRef.current`)
- **Session Restoration**: Chat history lost on browser refresh/logout

## 🔧 **Integration Strategy**

### **Phase 1: Core Message Loading**

#### **1.1 Update ConversationContext**
- Add message loading to `mapSessionToConversation`
- Load messages when sessions are loaded
- Cache messages in `messagesRef.current` for performance

#### **1.2 Message Format Conversion**
- Convert backend `SessionMessage` to frontend `Message` format
- Handle agent steps conversion from backend to frontend format
- Preserve message IDs and timestamps

#### **1.3 Loading States**
- Add loading indicators for message history
- Handle empty conversations gracefully
- Show error states when message loading fails

### **Phase 2: Performance Optimization**

#### **2.1 Lazy Loading**
- Load messages only when conversation is selected
- Cache loaded messages to avoid repeated API calls
- Implement message pagination for large conversations

#### **2.2 Background Loading**
- Load messages for recent sessions in background
- Prioritize current session message loading
- Use Web Workers for large message processing (future)

### **Phase 3: Enhanced Features**

#### **3.1 Real-time Updates**
- Sync new messages with backend after streaming
- Update message cache when new messages arrive
- Handle concurrent session access

#### **3.2 Offline Support**
- Cache messages in IndexedDB for offline access
- Sync changes when connection restored
- Handle conflict resolution

## 🛠 **Implementation Details**

### **1. Message Format Conversion**

```typescript
// Convert backend SessionMessage to frontend Message
function convertSessionMessageToMessage(sessionMsg: SessionMessage): Message {
  return {
    id: sessionMsg.id,
    content: sessionMsg.content,
    role: sessionMsg.role,
    timestamp: new Date(sessionMsg.timestamp),
    agentSteps: sessionMsg.agent_steps?.map(convertBackendAgentStep) || []
  }
}

function convertBackendAgentStep(backendStep: BackendAgentStep): AgentStep {
  return {
    id: backendStep.id,
    title: backendStep.title,
    description: backendStep.content,
    status: backendStep.status === 'complete' ? 'completed' : 
            backendStep.status === 'pending' ? 'pending' : 'error',
    timestamp: new Date(backendStep.timestamp),
    type: backendStep.type,
    metadata: backendStep.metadata
  }
}
```

### **2. Enhanced mapSessionToConversation**

```typescript
const mapSessionToConversation = useCallback(async (
  session: ChatSessionResponse, 
  loadMessages: boolean = false
): Promise<Conversation> => {
  let messages: Message[] = []
  
  if (loadMessages) {
    try {
      const messageResponse = await sessionService.getSessionMessages(session.id)
      messages = messageResponse.messages.map(convertSessionMessageToMessage)
      
      // Cache messages
      messagesRef.current[session.id] = messages
    } catch (error) {
      console.warn(`Failed to load messages for session ${session.id}:`, error)
      // Use empty array, don't fail the whole session loading
    }
  } else {
    // Use cached messages if available
    messages = messagesRef.current[session.id] || []
  }

  return {
    id: session.id,
    title: session.title,
    createdAt: new Date(session.created_at),
    updatedAt: new Date(session.updated_at),
    messages,
    project: session.metadata?.project as string | undefined
  }
}, [])
```

### **3. Lazy Message Loading**

```typescript
const loadMessagesForSession = useCallback(async (sessionId: string) => {
  // Skip if already loaded
  if (messagesRef.current[sessionId]) {
    return messagesRef.current[sessionId]
  }

  setMessageLoadingStates(prev => ({ ...prev, [sessionId]: true }))
  
  try {
    const response = await sessionService.getSessionMessages(sessionId)
    const messages = response.messages.map(convertSessionMessageToMessage)
    
    // Cache messages
    messagesRef.current[sessionId] = messages
    
    // Update conversation in state
    setConversations(prev => 
      prev.map(conv => 
        conv.id === sessionId 
          ? { ...conv, messages, updatedAt: new Date(response.last_updated) }
          : conv
      )
    )
    
    return messages
  } catch (error) {
    console.error(`Failed to load messages for session ${sessionId}:`, error)
    return []
  } finally {
    setMessageLoadingStates(prev => ({ ...prev, [sessionId]: false }))
  }
}, [])
```

### **4. Enhanced setCurrentConversation**

```typescript
const setCurrentConversation = useCallback(async (id: string) => {
  const session = sessions.find(s => s.id === id)
  if (!session) {
    console.warn('[ConversationContext] Session not found:', id)
    return
  }

  // Load messages if not already loaded
  if (!messagesRef.current[id]) {
    await loadMessagesForSession(id)
  }

  setCurrentSession(session)
}, [sessions, loadMessagesForSession])
```

## 📋 **Implementation Checklist**

### **Phase 1: Core Integration**
- [ ] Add message conversion utilities
- [ ] Update SessionService with message loading
- [ ] Modify mapSessionToConversation for message loading
- [ ] Add lazy loading for setCurrentConversation
- [ ] Add loading states for message history
- [ ] Test with existing sessions

### **Phase 2: Error Handling**
- [ ] Handle authentication errors gracefully
- [ ] Provide fallback for failed message loading
- [ ] Add retry logic for transient failures
- [ ] Show user-friendly error messages

### **Phase 3: Performance**
- [ ] Implement message caching strategy
- [ ] Add background loading for recent sessions
- [ ] Optimize for large conversations
- [ ] Add pagination support (if needed)

### **Phase 4: Testing**
- [ ] Unit tests for message conversion
- [ ] Integration tests for message loading
- [ ] End-to-end tests for session restoration
- [ ] Performance tests with large conversations

## 🧪 **Testing Strategy**

### **Manual Testing**
1. **Login → Send Messages → Logout → Login**: Verify history persists
2. **Browser Refresh**: Verify messages reload correctly
3. **Multiple Sessions**: Verify correct message isolation
4. **Large Conversations**: Test performance with 50+ messages
5. **Network Errors**: Test graceful degradation

### **Automated Testing**
```typescript
describe('Message History Integration', () => {
  test('should load messages when session is selected', async () => {
    // Mock session with messages
    // Select session
    // Verify messages are loaded and displayed
  })

  test('should handle empty conversations gracefully', async () => {
    // Mock session with no messages
    // Verify empty state is shown
  })

  test('should cache messages to avoid repeated API calls', async () => {
    // Load session messages
    // Switch away and back
    // Verify API called only once
  })
})
```

## 🚀 **Rollout Plan**

### **Development**
1. Implement core message loading functionality
2. Test with development data
3. Add error handling and loading states
4. Performance testing and optimization

### **Staging**
1. Deploy to staging environment
2. Test with production-like data
3. User acceptance testing
4. Performance monitoring

### **Production**
1. Feature flag rollout (if available)
2. Monitor error rates and performance
3. Gradual rollout to all users
4. Post-deployment monitoring

## 📊 **Success Metrics**

### **Functional**
- ✅ Chat history persists across browser sessions
- ✅ Messages load within 2 seconds for typical conversations
- ✅ Error rate < 1% for message loading
- ✅ No data loss during session transitions

### **Performance**
- ✅ Initial page load time increase < 500ms
- ✅ Memory usage increase < 50MB for typical usage
- ✅ API response time < 2 seconds for message history
- ✅ Cache hit rate > 80% for repeated session access

### **User Experience**
- ✅ Seamless transition between sessions
- ✅ Clear loading indicators
- ✅ Graceful error handling
- ✅ No breaking changes to existing functionality
