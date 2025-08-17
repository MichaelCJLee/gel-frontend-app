import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useConversations } from '../../context/ConversationContext'
import { LangGraphMessageList } from './LangGraphMessageList'
import { EnhancedChatInput } from './EnhancedChatInput'
import { WelcomeInterface } from './WelcomeInterface'
import { NewConversationSidebar as ConversationSidebar } from './NewConversationSidebar'
// import { SearchModal } from './SearchModal' // TODO: Uncomment when re-enabling search functionality
import { useStreamingSession } from '../../hooks/useStreamingSession'
import { useSessionWakeUp } from '../../hooks/useSessionWakeUp'
import type { ProcessedEvent, AgentStep } from '../../lib/types'

import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ThemeToggle } from '../ui/theme-toggle'
import { UserProfile } from '../ui/user-profile'
import { Logo } from '../ui/logo'
import {
  Menu,
  // Search, // TODO: Uncomment when re-enabling search functionality
  PenTool,
  Loader2
} from 'lucide-react'
import { cn } from '../../lib/utils'

/**
 * Convert AgentStep to ProcessedEvent for activity timeline
 */
function convertAgentStepToProcessedEvent(step: AgentStep): ProcessedEvent {
  // Map agent step types to more readable titles
  const titleMap: Record<string, string> = {
    'tool_call': step.title || 'Tool Call',
    'thinking': 'Sequential Thinking',
    'search': 'Searching Knowledge Base',
    'research': 'Researching',
    'analysis': 'Analyzing'
  }
  
  const stepType = (step.data as any)?.type || ''
  
  console.log('[convertAgentStepToProcessedEvent] Converting step:', {
    id: step.id,
    title: step.title,
    description: step.description,
    stepType,
    data: step.data
  })
  
  return {
    title: titleMap[stepType] || step.title,
    data: step.description || (step.data as any) || ''
  }
}

export function LangGraphChatInterface() {
  const { 
    currentConversation,
    createConversation,
    addMessage,
    updateMessage,
    refreshConversation,
    messageLoadingStates
  } = useConversations()
  
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(256)
  // const [searchModalOpen, setSearchModalOpen] = useState(false) // TODO: Uncomment when re-enabling search
  
  // LangGraph streaming state
  const [liveActivityEvents, setLiveActivityEvents] = useState<ProcessedEvent[]>([])
  const [historicalActivities, setHistoricalActivities] = useState<Record<string, ProcessedEvent[]>>({})
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState<string>('')
  
  // Use ref to capture current events for callbacks (prevents stale closure)
  const liveActivityEventsRef = useRef<ProcessedEvent[]>([])
  
  // Keep ref in sync with state
  useEffect(() => {
    liveActivityEventsRef.current = liveActivityEvents
  }, [liveActivityEvents])
  
  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation?.messages])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Clear historical activities when switching conversations
  // We only want to show ActivityTimeline for live streaming events
  // Historical events from Supabase should be hidden for cleaner UX
  //
  // TODO: Future ActivityTimeline Enhancements
  // 1. Implement proper formatting for all agent event types (not just progressive_search)
  // 2. Add option to show/hide historical timelines per user preference
  // 3. Improve timeline data formatting for different tool calls:
  //    - web_search_gemini events
  //    - get_knowledge_details events
  //    - Other custom tool events
  // 4. Consider persisting timeline visibility state across sessions
  // 5. Add timeline export/sharing functionality
  // 6. Implement timeline filtering by event type
  useEffect(() => {
    console.log('[LangGraphChatInterface] Processing historical activities for conversation:', currentConversation?.id)
    
    // Only rebuild historical activities when conversation changes, not when messages update
    if (!currentConversation?.id) {
      setHistoricalActivities({})
      return
    }
    
    // Build historical activities from messages with agent steps
    setHistoricalActivities(prev => {
      const newHistoricalActivities: Record<string, ProcessedEvent[]> = {}
      
      if (currentConversation?.messages) {
        currentConversation.messages.forEach(message => {
          console.log(`[LangGraphChatInterface] Processing message ${message.id}:`, {
            role: message.role,
            hasAgentSteps: !!message.agentSteps,
            agentStepsLength: message.agentSteps?.length || 0,
            agentStepsDetail: message.agentSteps,
            hasPrevActivity: !!prev[message.id],
            contentLength: message.content.length
          })
          
          // Preserve existing historical activities (from live streaming)
          if (prev[message.id]) {
            newHistoricalActivities[message.id] = prev[message.id]
            console.log(`[LangGraphChatInterface] Preserved existing activities for ${message.id}`)
          } else if (message.agentSteps && message.agentSteps.length > 0) {
            // Convert agent steps to processed events for messages that don't have activities yet
            const processedEvents = message.agentSteps.map(convertAgentStepToProcessedEvent)
            newHistoricalActivities[message.id] = processedEvents
            
            console.log(`[LangGraphChatInterface] Converted ${message.agentSteps.length} agent steps for message ${message.id}:`, processedEvents)
          }
        })
      }
      
      console.log('[LangGraphChatInterface] Updated historical activities:', Object.keys(newHistoricalActivities).length, 'messages with activities')
      return newHistoricalActivities
    })
  }, [currentConversation?.id, currentConversation?.messages])

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Streaming session callbacks - memoized to prevent hook recreation
  const onEventCallback = useCallback((event: ProcessedEvent, messageId?: string) => {
    console.log('[LangGraphChatInterface] Received event:', event, 'for messageId:', messageId)
    setLiveActivityEvents(prev => [...prev, event])
  }, [])

  // Use ref for accumulating streaming content (best practice from research)
  const streamingContentRef = useRef('')
  
  const onMessageCallback = useCallback((content: string, messageId?: string) => {
    console.log('[LangGraphChatInterface] Received message content:', content, 'for messageId:', messageId)
    
    // Use the passed messageId or fall back to state
    const targetMessageId = messageId || currentStreamingMessageId
    
    // Accumulate content using ref (prevents stale closure issues)
    streamingContentRef.current += content
    const newContent = streamingContentRef.current
    
    console.log('[LangGraphChatInterface] Accumulating content in ref:', newContent)
    
    // Update state for UI reactivity
    setStreamingContent(newContent)
    
    // Update the message immediately with accumulated content
    if (targetMessageId && currentConversation) {
      console.log('[LangGraphChatInterface] Updating message with content:', newContent, 'messageId:', targetMessageId)
      updateMessage(currentConversation.id, targetMessageId, {
        content: newContent,
        isLoading: true
      })
    }
  }, [currentStreamingMessageId, currentConversation, updateMessage])

  const onErrorCallback = useCallback((error: Error, messageId?: string) => {
    console.error('[LangGraphChatInterface] Streaming error:', error, 'for messageId:', messageId)
    setIsLoading(false)
    setCurrentStreamingMessageId(null)
    setStreamingContent('')

    // Add error message to conversation
    if (currentConversation) {
      console.log('[LangGraphChatInterface] Adding error message to conversation:', error.message)
      addMessage(currentConversation.id, {
        role: 'assistant',
        content: error.message,
        isError: true
      })
    }
  }, [currentConversation, addMessage])

  const onStreamingCompleteCallback = useCallback((messageId?: string, conversationId?: string) => {
    console.log('[LangGraphChatInterface] Streaming completed for messageId:', messageId, 'conversationId:', conversationId)
    console.log('[LangGraphChatInterface] Final streamingContent:', streamingContent)
    console.log('[LangGraphChatInterface] Final streamingContentRef:', streamingContentRef.current)
    console.log('[LangGraphChatInterface] currentStreamingMessageId:', currentStreamingMessageId)
    console.log('[LangGraphChatInterface] currentConversation:', currentConversation?.id)
    console.log('[LangGraphChatInterface] liveActivityEvents count:', liveActivityEvents.length)

    // Use the passed messageId or fall back to state
    const targetMessageId = messageId || currentStreamingMessageId

    // Finalize the streaming message first using passed conversationId
    if (targetMessageId && conversationId) {
      const finalContent = streamingContentRef.current || streamingContent || ""
      console.log('[LangGraphChatInterface] Finalizing message with content:', finalContent, 'messageId:', targetMessageId, 'conversationId:', conversationId)
      updateMessage(conversationId, targetMessageId, {
        content: finalContent,
        isLoading: false
      })
    } else {
      console.log('[LangGraphChatInterface] NOT finalizing message - missing ID or conversation', { targetMessageId, conversationId })
    }
    
    // Move live events to historical when streaming completes (BEFORE clearing)
    const currentEvents = liveActivityEventsRef.current
    console.log('[LangGraphChatInterface] Current events from ref:', currentEvents.length, currentEvents)
    
    setHistoricalActivities(prev => {
      if (targetMessageId && currentEvents.length > 0) {
        console.log('[LangGraphChatInterface] Moving events to historical for message:', targetMessageId)
        console.log('[LangGraphChatInterface] Live events being moved:', currentEvents)
        const newHistorical = {
          ...prev,
          [targetMessageId]: [...currentEvents]
        }
        console.log('[LangGraphChatInterface] New historical activities:', newHistorical)
        return newHistorical
      }
      console.log('[LangGraphChatInterface] NOT moving events - no messageId or no events:', { targetMessageId, eventsCount: currentEvents.length })
      return prev
    })
    
    console.log('[LangGraphChatInterface] Clearing state...')
    setIsLoading(false)
    setCurrentStreamingMessageId(null)
    setStreamingContent('')
    streamingContentRef.current = '' // Clear ref as well
    
    // Clear live events AFTER moving to historical
    setLiveActivityEvents([])
    
    // Refresh conversation after a delay to get updated title
    if (conversationId) {
      setTimeout(() => {
        console.log('[LangGraphChatInterface] Refreshing conversation to get updated title...')
        refreshConversation(conversationId)
      }, 2000) // Wait 2 seconds for backend to generate title
    }
  }, [currentStreamingMessageId, currentConversation, updateMessage, streamingContent, refreshConversation])

  // Streaming session management
  const streamingSession = useStreamingSession({
    userId: 'test_user', // Add userId for API compatibility
    onEvent: onEventCallback,
    onMessage: onMessageCallback,
    onError: onErrorCallback,
    onStreamingComplete: onStreamingCompleteCallback
  })

  // Session wake-up management - handles idle session validation
  useSessionWakeUp()

  // Send message with LangGraph streaming
  const sendMessage = useCallback(async (message: string, files?: File[]) => {
    console.log('=== SEND MESSAGE START ===')
    console.log('[LangGraphChatInterface] sendMessage called with:', { message, filesCount: files?.length || 0 })
    console.log('[LangGraphChatInterface] Current state:', {
      isLoading,
      currentConversation: currentConversation?.id,
      streamingSession: !!streamingSession
    })
    
    if (isLoading) {
      console.log('[LangGraphChatInterface] Already loading, ignoring request')
      return // Prevent multiple concurrent streams
    }
    
    console.log('[LangGraphChatInterface] Setting loading state and clearing events')
    setIsLoading(true)
    setLiveActivityEvents([])
    setStreamingContent('')
    streamingContentRef.current = '' // Clear the ref for new stream
    
    let conversationId: string

    if (!currentConversation) {
      // Create a new conversation if none exists
      console.log('[LangGraphChatInterface] No current conversation, creating new one')
      try {
        conversationId = await createConversation()
        console.log('[LangGraphChatInterface] Created new conversation:', conversationId)
      } catch (error) {
        console.error('[LangGraphChatInterface] Failed to create conversation:', error)
        setIsLoading(false)
        return
      }
    } else {
      conversationId = currentConversation.id
      console.log('[LangGraphChatInterface] Using existing conversation:', conversationId)
    }
    
    console.log('[LangGraphChatInterface] Adding user message to conversation')
    // Add user message with files if any
    const userMessageFiles = files ? files.map(file => ({
      name: file.name,
      type: file.type === 'application/pdf' ? 'pdf' :
            file.type.startsWith('image/') ? 'image' : 'file'
    })) : undefined

    addMessage(conversationId, {
      content: message,
      role: 'user',
      files: userMessageFiles
    })

    // Scroll to bottom after user message is added
    setTimeout(() => scrollToBottom(), 100)

    // Create placeholder AI message for streaming and get the actual ID
    console.log('[LangGraphChatInterface] Adding placeholder AI message')
    const actualMessageId = addMessage(conversationId, {
      content: '', // Start with empty content
      role: 'assistant',
      isLoading: true
    })
    
    console.log('[LangGraphChatInterface] Actual AI message ID from addMessage:', actualMessageId)
    setCurrentStreamingMessageId(actualMessageId)

    try {
      console.log('[LangGraphChatInterface] About to call streamingSession.streamMessage')
      console.log('[LangGraphChatInterface] streamingSession object:', streamingSession)
      console.log('[LangGraphChatInterface] Parameters:', { conversationId, message, filesCount: files?.length || 0 })

      // Start LangGraph streaming with message ID context and optional files
      await streamingSession.streamMessage(conversationId, message, actualMessageId, files)
      
      console.log('[LangGraphChatInterface] streamMessage completed successfully')
      
    } catch (error) {
      console.error('[LangGraphChatInterface] Failed to stream message:', error)
      console.error('[LangGraphChatInterface] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      
      setIsLoading(false)
      setCurrentStreamingMessageId(null)
      setStreamingContent('')
      
      // Update the message with error content
      if (currentConversation) {
        console.log('[LangGraphChatInterface] Updating message with error content')
        updateMessage(conversationId, actualMessageId, {
          content: 'Sorry, I encountered an error processing your request. Please try again.',
          isLoading: false
        })
      }
    }
    
    console.log('=== SEND MESSAGE END ===')
  }, [currentConversation, createConversation, addMessage, updateMessage, scrollToBottom, isLoading, streamingSession, currentStreamingMessageId, streamingContent])

  const handleCancelGeneration = useCallback(() => {
    console.log('[LangGraphChatInterface] Cancelling generation')
    if (currentConversation) {
      streamingSession.cancelStreaming(currentConversation.id)
    }
    setIsLoading(false)
    setCurrentStreamingMessageId(null)
    setLiveActivityEvents([])
    setStreamingContent('')
  }, [currentConversation, streamingSession])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // TODO: Uncomment when re-enabling search functionality
  // const openSearchModal = () => {
  //   setSearchModalOpen(true)
  // }

  // Show welcome interface if no current conversation
  const isLoadingMessages = currentConversation && messageLoadingStates[currentConversation.id]
  const showWelcome = !currentConversation || (currentConversation.messages.length === 0 && !isLoadingMessages)

  // Test API connection function
  const testApiConnection = useCallback(async () => {
    console.log('[LangGraphChatInterface] Testing API connection...')
    const apiBase = import.meta.env.VITE_API_BASE_URL_2 || '/api/v1'
    
    try {
      // Test health endpoint
      const healthResponse = await fetch(`${apiBase}/health`)
      console.log('[LangGraphChatInterface] Health check response:', {
        ok: healthResponse.ok,
        status: healthResponse.status,
        statusText: healthResponse.statusText
      })
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.text()
        console.log('[LangGraphChatInterface] Health data:', healthData)
      }
      
      // Test streaming endpoint
      console.log('[LangGraphChatInterface] Testing streaming endpoint...')
      const streamResponse = await fetch(`${apiBase}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: 'test connection',
          stream_mode: 'updates',
          include_metadata: true,
          user_id: 'test_user'
        })
      })
      
      console.log('[LangGraphChatInterface] Stream response:', {
        ok: streamResponse.ok,
        status: streamResponse.status,
        statusText: streamResponse.statusText,
        headers: Object.fromEntries(streamResponse.headers.entries())
      })
      
      if (!streamResponse.ok) {
        const errorText = await streamResponse.text()
        console.error('[LangGraphChatInterface] Stream error response:', errorText)
      }
      
    } catch (error) {
      console.error('[LangGraphChatInterface] API connection test failed:', error)
    }
  }, [])

  // Expose test function to window for debugging
  useEffect(() => {
    (window as any).testApiConnection = testApiConnection
    return () => {
      delete (window as any).testApiConnection
    }
  }, [testApiConnection])

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position like v0 */}
      <div 
        className={cn(
          "fixed left-0 top-0 z-40 bg-background border-r border-border flex flex-col h-screen transition-all duration-300",
          sidebarOpen 
            ? "translate-x-0" 
            : "-translate-x-full lg:translate-x-0 lg:w-12"
        )}
        style={{
          width: sidebarOpen ? `${sidebarWidth}px` : '48px'
        }}
      >
        {sidebarOpen ? (
          // TODO: Uncomment when re-enabling search: onSearchClick={openSearchModal}
          <ConversationSidebar
            onClose={() => setSidebarOpen(false)}
            width={sidebarWidth}
            onWidthChange={setSidebarWidth}
          />
        ) : (
          /* Mini Sidebar Content */
          <div className="flex flex-col items-center py-4 gap-3 h-full">
            {/* GO Logo */}
            <div className="mb-2">
              <Logo size="sm" />
            </div>
            
            {/* Menu Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title="Open sidebar"
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* New Chat */}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  await createConversation()
                } catch (error) {
                  console.error('[LangGraphChatInterface] Failed to create new conversation:', error)
                }
              }}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title="New chat"
            >
              <PenTool className="h-4 w-4" />
            </Button>
            
            {/* TODO: Re-enable search functionality when ready to implement properly */}
            {/* Search - TEMPORARILY DISABLED */}
            {/*
            <Button
              variant="ghost"
              size="sm"
              onClick={openSearchModal}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title="Search chats"
            >
              <Search className="h-4 w-4" />
            </Button>
            */}
          </div>
        )}
      </div>

      {/* Main Content Area - With proper margin offset like v0 */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "" : "lg:ml-12"
        )}
        style={{
          marginLeft: sidebarOpen ? `${sidebarWidth}px` : undefined
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Business Analyst</h1>
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                Alpha
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            <UserProfile />
          </div>
        </div>

        {/* Content Area - ChatGPT-style flex layout */}
        <div className="flex-1 flex flex-col min-h-0">
          {isLoadingMessages ? (
            /* Loading state while fetching messages */
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : showWelcome ? (
            /* Enhanced Welcome Interface with proper flex layout */
            <>
              {/* Welcome Content - Takes available space */}
              <div className="flex-1 overflow-hidden">
                <WelcomeInterface />
              </div>
              {/* Input Container - Fixed height at bottom */}
              <div className="flex-shrink-0 bg-background px-4 py-2">
                <div className="max-w-4xl mx-auto">
                  <EnhancedChatInput
                    onSendMessage={sendMessage}
                    onCancel={handleCancelGeneration}
                    isLoading={isLoading}
                    placeholder="Ask anything..."
                  />
                </div>
              </div>
            </>
          ) : (
            /* Chat Messages and Input - Proper flex layout like ChatGPT */
            <>
              {/* Messages Container - Takes all available space, scrollable */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
              >
                <div className="max-w-4xl mx-auto">
                  <LangGraphMessageList
                    messages={messages}
                    isLoading={isLoading}
                    liveActivityEvents={liveActivityEvents}
                    historicalActivities={historicalActivities}
                  />
                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Container - Fixed height at bottom, never overlaps */}
              <div className="flex-shrink-0 bg-background px-4 py-2">
                <div className="max-w-4xl mx-auto">
                  <EnhancedChatInput
                    onSendMessage={sendMessage}
                    onCancel={handleCancelGeneration}
                    isLoading={isLoading}
                    placeholder="Continue the conversation..."
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TODO: Re-enable search modal when ready to implement properly */}
      {/* Search Modal - TEMPORARILY DISABLED */}
      {/*
      <SearchModal
        open={searchModalOpen}
        onOpenChange={setSearchModalOpen}
      />
      */}
    </div>
  )
} 