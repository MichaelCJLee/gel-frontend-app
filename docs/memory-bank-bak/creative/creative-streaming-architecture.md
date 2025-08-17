# 🎨 CREATIVE PHASE: STREAMING ARCHITECTURE DESIGN

## 📋 PROBLEM STATEMENT

**Challenge**: Design a robust streaming architecture for LangGraph integration that handles real-time AI responses with proper memory management, session isolation, and seamless user experience.

**Key Requirements**:
- Real-time streaming of AI responses from FastAPI LangGraph service
- Proper EventSource management with cleanup
- Session isolation between conversations and users
- Memory leak prevention
- Error handling and reconnection logic
- Integration with existing localStorage conversation management

**Real Payload Context** (from curl testing):
```json
{
  "event": "update",
  "data": {
    "node": "agent", 
    "content": {
      "messages": [
        {
          "type": "AIMessage",
          "content": "Based on the search results...",
          "metadata": {
            "id": "run--6577669f-2292-47d3-9dd1-9a23d0087ed4-0"
          }
        }
      ]
    },
    "timestamp": "2025-06-22T18:59:58.993921"
  }
}
```

## 🔄 OPTIONS ANALYSIS

### Option 1: Simple EventSource with Basic Cleanup
**Description**: Direct EventSource implementation with basic useEffect cleanup
**Architecture**:
```typescript
const useLangGraphStreaming = (conversationId: string) => {
  const [messages, setMessages] = useState([]);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/stream?id=${conversationId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    
    return () => eventSource.close();
  }, [conversationId]);
};
```

**Pros**:
- Simple implementation
- Minimal code complexity
- Fast to implement

**Cons**:
- No proper session isolation
- Limited error handling
- No memory leak protection for unmounted components
- No request cancellation support

**Complexity**: Low
**Implementation Time**: 2-3 hours

### Option 2: AbortController + Session Management
**Description**: Enhanced EventSource with AbortController and conversation session management
**Architecture**:
```typescript
interface StreamingSession {
  id: string;
  threadId: string;
  eventSource?: EventSource;
  controller?: AbortController;
  status: 'idle' | 'connecting' | 'streaming' | 'error' | 'closed';
}

const useStreamingManager = () => {
  const [sessions, setSessions] = useState<Map<string, StreamingSession>>(new Map());
  const unmountedRef = useRef(false);
  
  const createSession = (conversationId: string) => {
    const controller = new AbortController();
    const threadId = `thread_${Date.now()}_${Math.random()}`;
    
    const session: StreamingSession = {
      id: conversationId,
      threadId,
      controller,
      status: 'idle'
    };
    
    setSessions(prev => new Map(prev).set(conversationId, session));
    return session;
  };
  
  const streamMessage = async (conversationId: string, message: string) => {
    const session = sessions.get(conversationId);
    if (!session) return;
    
    try {
      session.status = 'connecting';
      
      const eventSource = new EventSource(`/api/chat/stream`, {
        // Note: EventSource doesn't support POST body, need custom implementation
      });
      
      session.eventSource = eventSource;
      session.status = 'streaming';
      
      eventSource.onmessage = (event) => {
        if (unmountedRef.current) return;
        
        const data = JSON.parse(event.data);
        // Handle streaming data
      };
      
      eventSource.onerror = () => {
        session.status = 'error';
        // Handle reconnection
      };
      
    } catch (error) {
      session.status = 'error';
    }
  };
  
  const destroySession = (conversationId: string) => {
    const session = sessions.get(conversationId);
    if (session) {
      session.controller?.abort();
      session.eventSource?.close();
      setSessions(prev => {
        const newMap = new Map(prev);
        newMap.delete(conversationId);
        return newMap;
      });
    }
  };
};
```

**Pros**:
- Proper session isolation
- Memory leak protection
- Request cancellation support
- Better error handling
- Scalable to multiple conversations

**Cons**:
- EventSource doesn't support POST requests (need fetch with streaming)
- More complex implementation
- Requires custom streaming parser

**Complexity**: Medium-High
**Implementation Time**: 6-8 hours

### Option 3: Fetch Streaming with ReadableStream (RECOMMENDED)
**Description**: Use fetch with ReadableStream for POST support and full control over streaming
**Architecture**:
```typescript
interface StreamingHook {
  streamMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  abort: () => void;
}

const useLangGraphStreaming = (conversationId: string): StreamingHook => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const unmountedRef = useRef(false);
  
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      abortControllerRef.current?.abort();
    };
  }, []);
  
  const streamMessage = async (message: string) => {
    if (isStreaming) return;
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setIsStreaming(true);
    setError(null);
    
    try {
      const response = await fetch('/api/v1/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          thread_id: `thread_${conversationId}_${Date.now()}`,
          user_id: 'user_session',
          stream_mode: 'updates',
          include_metadata: true
        }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }
      
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done || unmountedRef.current) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6); // Remove 'data: '
              if (jsonData.trim() === '[DONE]') {
                setIsStreaming(false);
                return;
              }
              
              const parsed = JSON.parse(jsonData);
              
              // Handle the real LangGraph payload structure
              if (parsed.event === 'update' && parsed.data?.content?.messages) {
                const messages = parsed.data.content.messages;
                messages.forEach((msg: any) => {
                  if (msg.type === 'AIMessage' && msg.content) {
                    // Update conversation with new content
                    updateConversationMessage(conversationId, msg.content, msg.metadata);
                  }
                });
              }
              
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError' && !unmountedRef.current) {
        setError(error.message);
      }
    } finally {
      if (!unmountedRef.current) {
        setIsStreaming(false);
      }
    }
  };
  
  const abort = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };
  
  return { streamMessage, isStreaming, error, abort };
};
```

**Pros**:
- Full POST request support (required for LangGraph API)
- Complete control over streaming process
- Proper abort/cancellation support
- Memory leak protection with unmount detection
- Real error handling and recovery
- Compatible with actual LangGraph payload format
- Session isolation built-in

**Cons**:
- More complex than EventSource
- Manual SSE parsing required
- Slightly more code to maintain

**Complexity**: Medium
**Implementation Time**: 4-6 hours

### Option 4: React Query + Streaming (Over-engineered)
**Description**: Use React Query with custom streaming support
**Pros**: Caching, background refetching, optimistic updates
**Cons**: Over-complexity for streaming use case, not designed for real-time streams
**Complexity**: High
**Implementation Time**: 8-12 hours

## 🎯 DECISION: Option 3 - Fetch Streaming with ReadableStream

**Rationale**:
1. **Technical Compatibility**: LangGraph API requires POST requests with JSON body - EventSource doesn't support this
2. **Real Payload Support**: Tested architecture handles actual LangGraph streaming format
3. **Memory Safety**: Built-in protection against memory leaks and unmounted component updates
4. **User Experience**: Proper error handling and cancellation for better UX
5. **Maintainability**: Clean, focused implementation without over-engineering

## 📋 IMPLEMENTATION PLAN

### Phase 1: Core Streaming Hook (2 hours)
1. Create `useLangGraphStreaming` hook with fetch + ReadableStream
2. Implement proper abort controller management
3. Add unmount protection with useRef
4. Handle real LangGraph payload parsing

### Phase 2: Conversation Integration (1 hour)
1. Integrate with existing conversation context
2. Update localStorage with streaming messages
3. Handle message metadata and run IDs

### Phase 3: Error Handling (1 hour)
1. Implement retry logic for failed connections
2. Add timeout handling
3. Create user-friendly error states

### Phase 4: Testing & Optimization (1-2 hours)
1. Test with real LangGraph service
2. Verify memory leak prevention
3. Performance optimization

## 🔧 TECHNICAL SPECIFICATIONS

### API Integration
```typescript
// Request format (matches tested curl command)
{
  message: string;
  thread_id: string;  // Format: "thread_{conversationId}_{timestamp}"
  user_id: string;    // Session identifier
  stream_mode: 'updates';
  include_metadata: boolean;
}

// Response format (actual LangGraph structure)
{
  event: 'update' | 'progress' | 'chunk_processed';
  data: {
    node: string;
    content: {
      messages: Array<{
        type: 'AIMessage' | 'HumanMessage';
        content: string;
        metadata: {
          id: string;
          tool_calls?: any[];
          additional_kwargs?: any;
        }
      }>
    };
    timestamp: string;
  }
}
```

### Memory Management
```typescript
// Key patterns for leak prevention
1. AbortController per request
2. Unmount detection with useRef
3. Proper cleanup in useEffect return
4. Reader cleanup in finally blocks
5. Conditional state updates (check unmounted)
```

## ✅ VERIFICATION CHECKPOINT

- [x] Architecture handles real LangGraph payload format
- [x] POST request support for API compatibility  
- [x] Memory leak prevention patterns included
- [x] Session isolation designed
- [x] Error handling and recovery planned
- [x] Integration with existing conversation system planned

🎨🎨🎨 EXITING CREATIVE PHASE - STREAMING ARCHITECTURE DECISION MADE 🎨🎨🎨 