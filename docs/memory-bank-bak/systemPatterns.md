# GenOne System Patterns

## 🏗️ Architectural Patterns Overview

**Architecture Style**: Modular Frontend with Microservice Backend  
**Primary Patterns**: Component-Based Architecture, Event-Driven Communication, Repository Pattern  
**Integration Style**: RESTful APIs with Server-Sent Events (SSE) for real-time streaming  

## 🎯 Core System Patterns

### 1. **Component Architecture Pattern**

**Pattern**: Atomic Design with shadcn/ui Foundation
```
Atoms (shadcn/ui) → Molecules → Organisms → Templates → Pages
```

**Implementation Structure**:
```typescript
// Atomic Components (shadcn/ui base)
import { Button, Input, Card } from "@/components/ui"

// Molecular Components (business logic)
export function ChatMessage({ message, onRetry }: ChatMessageProps) {
  return (
    <Card className="message-card">
      <CardContent>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src={message.avatar} />
          </Avatar>
          <div className="message-content">
            <p>{message.content}</p>
            {message.agentSteps && <AgentTimeline steps={message.agentSteps} />}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Organism Components (feature-complete)
export function ChatInterface() {
  return (
    <div className="chat-interface">
      <ChatHeader />
      <MessageList />
      <ChatInput />
    </div>
  )
}
```

### 2. **State Management Pattern**

**Pattern**: React Context + Custom Hooks for Global State
```typescript
// Context Definition
interface ChatContextType {
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoading: boolean
  sendMessage: (content: string) => Promise<void>
  createConversation: () => void
  switchConversation: (id: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

// Provider Implementation
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ChatState>(initialState)
  
  const sendMessage = useCallback(async (content: string) => {
    // Implementation with error handling
  }, [])
  
  return (
    <ChatContext.Provider value={{ ...state, sendMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

// Custom Hook
export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within ChatProvider')
  }
  return context
}
```

### 3. **Data Fetching Pattern**

**Pattern**: Custom Hooks with React Query Integration
```typescript
// API Client Pattern
class ApiClient {
  private baseURL: string
  private supabase: SupabaseClient
  
  constructor(baseURL: string, supabase: SupabaseClient) {
    this.baseURL = baseURL
    this.supabase = supabase
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const { data: { session } } = await this.supabase.auth.getSession()
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
}

// Custom Hook Pattern
export function useStreamingChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true)
    setError(null)
    
    try {
      const eventSource = new EventSource('/api/chat/stream', {
        headers: { 'Content-Type': 'application/json' }
      })
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)
        handleStreamingData(data)
      }
      
      eventSource.onerror = () => {
        setError('Streaming connection failed')
        setIsStreaming(false)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsStreaming(false)
    }
  }, [])
  
  return { messages, isStreaming, error, sendMessage }
}
```

### 4. **Authentication Pattern**

**Pattern**: Supabase Auth with Context Provider
```typescript
// Auth Context Pattern
interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Protected Route Pattern
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return <>{children}</>
}
```

### 5. **Real-time Communication Pattern**

**Pattern**: Server-Sent Events with Fallback to Polling
```typescript
// Streaming Hook Pattern
export function useAgentStreaming(conversationId: string) {
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([])
  const [isActive, setIsActive] = useState(false)
  
  const startStreaming = useCallback((messageId: string) => {
    setIsActive(true)
    setAgentSteps([])
    
    const eventSource = new EventSource(
      `/api/conversations/${conversationId}/messages/${messageId}/stream`
    )
    
    eventSource.addEventListener('agent_step', (event) => {
      const step: AgentStep = JSON.parse(event.data)
      setAgentSteps(prev => [...prev, step])
    })
    
    eventSource.addEventListener('agent_complete', () => {
      setIsActive(false)
      eventSource.close()
    })
    
    eventSource.onerror = () => {
      setIsActive(false)
      eventSource.close()
      // Fallback to polling if SSE fails
      startPolling(messageId)
    }
    
    return () => {
      eventSource.close()
      setIsActive(false)
    }
  }, [conversationId])
  
  return { agentSteps, isActive, startStreaming }
}

// Polling Fallback Pattern
function startPolling(messageId: string) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/messages/${messageId}/steps`)
      const steps = await response.json()
      setAgentSteps(steps)
      
      if (steps.some((step: AgentStep) => step.type === 'complete')) {
        clearInterval(pollInterval)
        setIsActive(false)
      }
    } catch (error) {
      console.error('Polling failed:', error)
      clearInterval(pollInterval)
      setIsActive(false)
    }
  }, 1000)
}
```

## 🔄 Integration Patterns

### 6. **Supabase Integration Pattern**

**Pattern**: Repository Pattern with Supabase Client
```typescript
// Repository Interface
interface ConversationRepository {
  create(userId: string, title: string): Promise<Conversation>
  findByUserId(userId: string): Promise<Conversation[]>
  update(id: string, updates: Partial<Conversation>): Promise<Conversation>
  delete(id: string): Promise<void>
}

// Supabase Repository Implementation
export class SupabaseConversationRepository implements ConversationRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async create(userId: string, title: string): Promise<Conversation> {
    const { data, error } = await this.supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    
    if (error) throw new Error(`Failed to create conversation: ${error.message}`)
    return this.mapToConversation(data)
  }
  
  async findByUserId(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    
    if (error) throw new Error(`Failed to fetch conversations: ${error.message}`)
    return data.map(this.mapToConversation)
  }
  
  private mapToConversation(data: any): Conversation {
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      messages: data.messages || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}
```

### 7. **LangGraph API Integration Pattern**

**Pattern**: Adapter Pattern for External API
```typescript
// LangGraph API Adapter
export class LangGraphAdapter {
  private baseURL: string
  private apiKey: string
  
  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }
  
  async streamChat(message: string, conversationId: string): Promise<ReadableStream> {
    const response = await fetch(`${this.baseURL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        stream_mode: 'updates',
        include_metadata: true,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`LangGraph API error: ${response.statusText}`)
    }
    
    return response.body!
  }
  
  parseStreamingResponse(chunk: string): AgentStep | null {
    try {
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          return this.mapToAgentStep(data)
        }
      }
    } catch (error) {
      console.error('Failed to parse streaming response:', error)
    }
    return null
  }
  
  private mapToAgentStep(data: any): AgentStep {
    return {
      id: data.run_id || crypto.randomUUID(),
      type: data.event === 'on_chain_end' ? 'complete' : 'progress',
      name: data.name || 'Processing',
      description: data.data?.output?.content || 'Working...',
      timestamp: new Date(),
      metadata: data.data || {},
    }
  }
}
```

## 🛡️ Error Handling Patterns

### 8. **Error Boundary Pattern**

**Pattern**: React Error Boundaries with Fallback UI
```typescript
// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ChatErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Chat Error Boundary caught an error:', error, errorInfo)
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong with the chat interface.</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}

// Usage Pattern
<ChatErrorBoundary>
  <ChatInterface />
</ChatErrorBoundary>
```

### 9. **API Error Handling Pattern**

**Pattern**: Centralized Error Handling with User-Friendly Messages
```typescript
// Error Types
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType
  message: string
  details?: any
  timestamp: Date
}

// Error Handler Utility
export class ErrorHandler {
  static handle(error: unknown): AppError {
    const timestamp = new Date()
    
    if (error instanceof Response) {
      return {
        type: ErrorType.SERVER_ERROR,
        message: `Server error: ${error.status} ${error.statusText}`,
        details: { status: error.status },
        timestamp,
      }
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection.',
        timestamp,
      }
    }
    
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error,
      timestamp,
    }
  }
  
  static getUserMessage(error: AppError): string {
    const messages = {
      [ErrorType.NETWORK_ERROR]: 'Connection issue. Please try again.',
      [ErrorType.AUTH_ERROR]: 'Please sign in again.',
      [ErrorType.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorType.SERVER_ERROR]: 'Server is temporarily unavailable.',
      [ErrorType.UNKNOWN_ERROR]: 'Something went wrong. Please try again.',
    }
    
    return messages[error.type] || error.message
  }
}
```

## 🎨 UI Patterns

### 10. **Loading State Pattern**

**Pattern**: Consistent Loading States Across Components
```typescript
// Loading State Hook
export function useLoadingState() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const execute = useCallback(async <T>(
    asyncFunction: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await asyncFunction()
      return result
    } catch (err) {
      const appError = ErrorHandler.handle(err)
      setError(ErrorHandler.getUserMessage(appError))
      return null
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { loading, error, execute }
}

// Loading Component Pattern
export function LoadingButton({ 
  loading, 
  children, 
  ...props 
}: ButtonProps & { loading: boolean }) {
  return (
    <Button disabled={loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
```

## 📊 Performance Patterns

### 11. **Virtualization Pattern**

**Pattern**: Virtual Scrolling for Large Message Lists
```typescript
// Virtual Message List
export function VirtualMessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated message height
    overscan: 5,
  })
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ChatMessage message={messages[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🧪 Testing Patterns

### 12. **Component Testing Pattern**

**Pattern**: Testing Library with Custom Render Function
```typescript
// Test Utilities
export function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    user?: User
    initialConversations?: Conversation[]
  }
) {
  const { user, initialConversations = [] } = options || {}
  
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider initialUser={user}>
        <ChatProvider initialConversations={initialConversations}>
          {children}
        </ChatProvider>
      </AuthProvider>
    )
  }
  
  return render(ui, { wrapper: Wrapper })
}

// Component Test Example
describe('ChatMessage', () => {
  it('displays agent timeline when steps are provided', async () => {
    const message: Message = {
      id: '1',
      content: 'Test response',
      role: 'assistant',
      agentSteps: [
        { id: '1', name: 'Research', description: 'Searching...', type: 'progress' },
        { id: '2', name: 'Complete', description: 'Done', type: 'complete' },
      ],
    }
    
    renderWithProviders(<ChatMessage message={message} />)
    
    expect(screen.getByText('Agent Activity (2 events)')).toBeInTheDocument()
    
    // Click to expand timeline
    fireEvent.click(screen.getByText('Agent Activity (2 events)'))
    
    expect(screen.getByText('Research')).toBeInTheDocument()
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })
})
```

These system patterns provide a consistent foundation for building the GenOne application, ensuring maintainability, scalability, and code quality across all components and features. 