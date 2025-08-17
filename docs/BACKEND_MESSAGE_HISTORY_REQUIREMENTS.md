# Backend Message History API Requirements

## 🎯 **Problem Statement**

**Issue**: Chat history disappears when users logout/login or refresh browser because messages are only stored in frontend memory.

**Root Cause**: Frontend stores messages in `messagesRef.current` (memory only) but never retrieves conversation history from LangGraph checkpoints where it actually exists.

**Evidence**: Database shows 44 sessions and 117 LangGraph checkpoints, but frontend can't access this conversation history.

## 📋 **Required Backend Changes**

### **1. New API Endpoint: Get Session Messages**

**Endpoint**: `GET /api/v1/sessions/{session_id}/messages`

**Purpose**: Retrieve formatted conversation history for a session from LangGraph checkpoints.

**Authentication**: ✅ Required (JWT token)

**Request**:
```http
GET /api/v1/sessions/{session_id}/messages
Authorization: Bearer {jwt_token}
```

**Response Model**:
```typescript
interface SessionMessage {
  id: string                    // Generated message ID
  role: 'user' | 'assistant'   // Message role
  content: string              // Message content
  timestamp: string            // ISO timestamp
  agentSteps?: AgentStep[]     // Optional: Agent reasoning steps
}

interface AgentStep {
  id: string
  type: string                 // e.g., "thinking", "tool_call", "search"
  title: string               // e.g., "Sequential Thinking", "Azure DevOps Search"
  content: string             // Step content/description
  timestamp: string           // ISO timestamp
  status: 'pending' | 'complete' | 'error'
  metadata?: Record<string, any>
}

interface SessionMessagesResponse {
  session_id: string
  thread_id: string
  messages: SessionMessage[]
  total_messages: number
  last_updated: string        // ISO timestamp
}
```

**Error Responses**:
- `404`: Session not found or user doesn't own session
- `401`: Authentication required
- `500`: Failed to retrieve messages from LangGraph

### **2. Implementation Requirements**

**Data Source**: Use existing LangGraph checkpoint system
- Query `checkpoints` table using session's `thread_id`
- Use LangGraph native endpoint: `GET /threads/{thread_id}/state`
- Parse LangGraph state to extract conversation messages

**Message Parsing Logic**:
```python
# Pseudo-code for message extraction
def extract_messages_from_langgraph_state(thread_id: str) -> List[SessionMessage]:
    # 1. Call LangGraph: GET /threads/{thread_id}/state
    # 2. Extract messages from state.values.messages
    # 3. Format into SessionMessage objects
    # 4. Generate stable message IDs (hash-based or sequential)
    # 5. Parse agent steps from tool calls/reasoning
    # 6. Return formatted message list
```

**User Access Control**:
- Verify session belongs to authenticated user
- Use existing session ownership validation from `chat_sessions` table

**Performance Considerations**:
- Cache message history for active sessions (optional)
- Limit message history (e.g., last 100 messages)
- Paginate if conversation is very long

### **3. Integration Points**

**Existing Code to Leverage**:
- `fastapi_service/routes/sessions.py` - Session ownership validation
- `fastapi_service/auth.py` - JWT authentication
- LangGraph checkpoint system - Message storage
- `agent_factory/business_analyst/utils.py` - Thread ID utilities

**Database Tables**:
- `chat_sessions` - Session metadata and ownership
- `checkpoints` - LangGraph conversation state (read-only)

## 🔧 **Frontend Integration Plan**

### **When to Call the Endpoint**

**1. Session Loading** (ConversationContext.tsx):
```typescript
// After loading sessions, load messages for each session
const loadSessionMessages = async (sessionId: string) => {
  const response = await sessionService.getSessionMessages(sessionId)
  messagesRef.current[sessionId] = response.messages
}
```

**2. Session Selection**:
```typescript
// When user selects a conversation, ensure messages are loaded
const setCurrentConversation = async (sessionId: string) => {
  if (!messagesRef.current[sessionId]) {
    await loadSessionMessages(sessionId)
  }
  setCurrentSession(session)
}
```

### **Frontend Service Method**

**Add to SessionService** (`src/lib/sessionService.ts`):
```typescript
async getSessionMessages(sessionId: string): Promise<SessionMessagesResponse> {
  const headers = await this.getAuthHeaders()
  const response = await fetch(`${this.apiBase}/sessions/${sessionId}/messages`, {
    headers
  })
  return await this.handleResponse<SessionMessagesResponse>(response)
}
```

## 🧪 **Testing Requirements**

### **Backend Tests**
1. **Authentication**: Verify JWT token required
2. **Authorization**: User can only access their own session messages
3. **Data Retrieval**: Messages correctly extracted from LangGraph
4. **Error Handling**: Proper error responses for invalid sessions
5. **Performance**: Response time under 2 seconds for typical conversations

### **Integration Tests**
1. **End-to-End**: Send message → logout → login → verify history persists
2. **Multiple Sessions**: Verify correct message isolation between sessions
3. **Large Conversations**: Test with 50+ message conversations
4. **Agent Steps**: Verify agent reasoning steps are properly included

## 📊 **Success Criteria**

### **Functional Requirements**
- ✅ Chat history persists across browser sessions
- ✅ Messages load when user selects conversation
- ✅ Agent reasoning steps included in message history
- ✅ User can only access their own conversation history
- ✅ Performance: Messages load within 2 seconds

### **Technical Requirements**
- ✅ Uses existing LangGraph checkpoint system (no new tables)
- ✅ Follows existing authentication patterns
- ✅ Consistent with current API design patterns
- ✅ Proper error handling and logging
- ✅ Backward compatible with existing frontend code

## 🚀 **Implementation Priority**

**Phase 1** (Critical): Basic message retrieval
- Implement core endpoint with user/assistant messages
- Basic error handling and authentication

**Phase 2** (Enhancement): Agent steps and metadata
- Include agent reasoning steps in response
- Add message metadata and timestamps

**Phase 3** (Optimization): Performance improvements
- Add caching for active sessions
- Implement pagination for large conversations

## 📝 **Notes for Backend Team**

1. **LangGraph Integration**: The conversation history already exists in LangGraph checkpoints - just need to expose it via API
2. **No Database Changes**: Use existing `chat_sessions` and `checkpoints` tables
3. **Authentication Pattern**: Follow same pattern as other session endpoints
4. **Message IDs**: Generate stable, consistent message IDs (consider hash-based on content + timestamp)
5. **Agent Steps**: Extract from LangGraph tool calls and reasoning steps for rich conversation history

## 🔗 **Related Files**

**Backend Files to Modify**:
- `fastapi_service/routes/sessions.py` - Add new endpoint
- `fastapi_service/models.py` - Add response models

**Frontend Files (for reference)**:
- `src/lib/sessionService.ts` - Will add getSessionMessages method
- `src/context/ConversationContext.tsx` - Will call endpoint on session load

**Database Tables (read-only)**:
- `chat_sessions` - Session ownership validation
- `checkpoints` - LangGraph conversation state
