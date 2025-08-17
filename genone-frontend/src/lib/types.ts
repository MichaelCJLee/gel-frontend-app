// Core conversation and message types
export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  agentSteps?: AgentStep[]
  isLoading?: boolean
  files?: Array<{name: string, type: string}>
  isError?: boolean
}

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  project?: string // OneNZ Migration, Ignite Suite, etc.
}

// Agent activity timeline types
export interface AgentStep {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'error'
  timestamp: Date
  data?: Record<string, unknown>
  agent?: 'system' | 'concierge' | 'researcher' | 'analyst'
}

// LangGraph streaming event types (Google reference pattern)
export interface ProcessedEvent {
  title: string
  data: any
}

// Unified timeline event for merging historical and real-time events
export interface UnifiedTimelineEvent {
  id: string
  title: string
  data: string | any
  timestamp: Date
  source: 'historical' | 'realtime'
  status?: 'pending' | 'in-progress' | 'completed' | 'error'
  node?: string // For LangGraph events
  runId?: string
}

// LangGraph streaming response types
export interface LangGraphStreamEvent {
  event: string
  data: {
    node?: string
    content?: {
      messages?: Array<{
        type: string
        content: string
        metadata?: {
          id?: string
          name?: string | null
          tool_calls?: any[]
          additional_kwargs?: any
        }
      }>
    }
    timestamp?: string
    [key: string]: any
  }
}

// Streaming session management types
export interface StreamingSession {
  id: string
  threadId: string
  abortController?: AbortController
  reader?: ReadableStreamDefaultReader<Uint8Array>
  status: 'idle' | 'connecting' | 'streaming' | 'error' | 'closed'
  lastActivity: number
  resources: Set<() => void> // Cleanup functions
}

// UI state management types
export interface ConversationState {
  conversations: Conversation[]
  currentConversationId: string | null
  isLoading: boolean
  searchQuery: string
}

// Context types
export interface ConversationContextType {
  // State
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoading: boolean
  searchQuery: string
  messageLoadingStates: Record<string, boolean>
  
  // Actions
  createConversation: (title?: string, project?: string) => Promise<string>
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  setCurrentConversation: (id: string) => Promise<void>
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void
  addAgentStep: (conversationId: string, messageId: string, step: Omit<AgentStep, 'id' | 'timestamp'>) => void
  updateAgentStep: (conversationId: string, messageId: string, stepId: string, updates: Partial<AgentStep>) => void
  setSearchQuery: (query: string) => void
  exportConversation: (id: string) => string
  importConversation: (data: string) => Promise<void>
  clearAllConversations: (deleteFromBackend?: boolean) => Promise<void>
  refreshConversation: (conversationId: string) => Promise<void>
}

// Backend message history types (matching API response)
export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string // ISO string from backend
  agent_steps?: BackendAgentStep[] | null
}

export interface BackendAgentStep {
  id: string
  type: string
  title: string
  content: string
  timestamp: string // ISO string from backend
  status: 'pending' | 'complete' | 'error'
  metadata?: Record<string, any>
}

export interface SessionMessagesResponse {
  session_id: string
  thread_id: string
  messages: SessionMessage[]
  total_messages: number
  last_updated: string
}

// Activity timeline props
export interface ActivityTimelineProps {
  agentSteps: AgentStep[]
  isLoading: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

// Google reference ActivityTimeline props
export interface GoogleActivityTimelineProps {
  processedEvents: ProcessedEvent[]
  isLoading: boolean
}

// Project categories for conversation organization
export const PROJECT_CATEGORIES = {
  'onenz-migration': 'OneNZ Migration',
  'ignite-suite': 'Ignite Suite',
  'general': 'General',
  'research': 'Research',
  'analysis': 'Analysis'
} as const

export type ProjectCategory = keyof typeof PROJECT_CATEGORIES 