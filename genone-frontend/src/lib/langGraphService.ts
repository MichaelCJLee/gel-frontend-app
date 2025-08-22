import type { ProcessedEvent } from './types'
import { supabase } from './supabase'

/**
 * LangGraph streaming service for real-time AI responses
 * Implements Server-Sent Events parsing for the Business Analyst Agent API
 * Now includes JWT authentication for backend integration
 */
export class LangGraphService {
  private apiBase: string

  constructor(apiBase: string = import.meta.env.VITE_API_BASE_URL_2 || '/api/v1') {
    // Remove trailing slash if present to ensure consistent URL construction
    this.apiBase = apiBase.replace(/\/$/, '')
    console.log('[LangGraphService] Initialized with apiBase:', this.apiBase)
  }

  /**
   * Get authentication headers with JWT token from Supabase
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session }, error } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    }

    if (error) {
      console.warn('[LangGraphService] Auth session error:', error)
      throw new Error('Authentication error: ' + error.message)
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
      console.log('[LangGraphService] Added JWT token to headers')
    } else {
      console.warn('[LangGraphService] No access token available - user may not be authenticated')
      throw new Error('Authentication required. Please sign in.')
    }

    return headers
  }

  /**
   * Stream a message to LangGraph and process events in real-time
   * Now includes authentication and session management
   */
  async streamMessage(
    message: string,
    options: {
      sessionId?: string
      threadId?: string
      userId?: string
      onEvent?: (event: ProcessedEvent) => void
      onMessage?: (content: string) => void
      onError?: (error: Error) => void
      signal?: AbortSignal
    } = {}
  ): Promise<void> {
    const { sessionId, threadId, userId, onEvent, onMessage, onError, signal } = options

    console.log('[LangGraphService] streamMessage called with:', {
      message,
      sessionId,
      threadId,
      userId,
      hasSignal: !!signal
    })

    // Prepare request body for authenticated backend
    const requestBody = {
      message,
      session_id: sessionId,
      thread_id: threadId,
      stream_mode: 'updates',
      use_persistent_memory: true,
      include_metadata: true
    }

    console.log('[LangGraphService] Request body:', requestBody)
    console.log('[LangGraphService] Making authenticated request to:', `${this.apiBase}/chat/stream`)

    try {
      // Get authentication headers
      const headers = await this.getAuthHeaders()

      const response = await fetch(`${this.apiBase}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal,
      })

      console.log('[LangGraphService] Response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[LangGraphService] HTTP error response:', errorText)

        // Handle specific authentication errors
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in.')
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.')
        } else if (response.status === 404) {
          throw new Error('Session not found. Please create a new conversation.')
        } else {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
        }
      }

      if (!response.body) {
        console.error('[LangGraphService] No response body available')
        throw new Error('No response body available')
      }

      console.log('[LangGraphService] Starting to read response stream...')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventCount = 0

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('[LangGraphService] Stream completed, total events processed:', eventCount)
            break
          }
          
          // Check if request was aborted
          if (signal?.aborted) {
            console.log('[LangGraphService] Request aborted')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue

            console.log('[LangGraphService] Processing line:', line)

            // Parse Server-Sent Events format
            if (line.startsWith('event: ')) {
              // Event type line - we don't need to store it for now
              continue
            }

            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6)
              
              try {
                const eventData = JSON.parse(dataStr)
                eventCount++

                console.log('[LangGraphService] Parsed event data:', eventData)

                // ✅ CORRECT: Check if error field exists in SSE event data
                if (eventData.error) {
                  const errorMessage = eventData.error || 'Unknown error occurred'
                  console.log('[LangGraphService] Error event received:', errorMessage)

                  // Check if this is a quota exceeded error
                  const isQuotaError = errorMessage.includes('ResourceExhausted') ||
                                       errorMessage.includes('You exceeded your current quota')

                  // Create user-friendly error message
                  const userFriendlyMessage = isQuotaError
                    ? "⚠️ Your request is too large and goes beyond the current API limit. Please shorten it or break it into smaller pieces. "
                    : "❌ Something went wrong. Please try again."

                  console.log('[LangGraphService] Calling onError with user-friendly message:', userFriendlyMessage)
                  onError?.(new Error(userFriendlyMessage))
                  return // Don't process further if it's an error
                }

                // Convert to ProcessedEvent for ActivityTimeline
                const processedEvent = this.convertToProcessedEvent(eventData)
                if (processedEvent) {
                  console.log('[LangGraphService] Calling onEvent with:', processedEvent)
                  onEvent?.(processedEvent)
                }

                // Extract AI message content
                const messageContent = this.extractMessageContent(eventData)
                if (messageContent) {
                  console.log('[LangGraphService] Calling onMessage with:', messageContent)
                  onMessage?.(messageContent)
                }

              } catch (parseError) {
                console.warn('[LangGraphService] Failed to parse SSE data:', parseError, 'Data:', dataStr)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        console.log('[LangGraphService] Reader released')
      }

    } catch (error) {
      console.error('[LangGraphService] Error in streamMessage:', error)

      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, this is expected
        console.log('[LangGraphService] Request was cancelled (AbortError)')
        return
      }

      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('Authentication')) {
        console.error('[LangGraphService] Authentication error:', error.message)
        onError?.(error)
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error'
      console.error('[LangGraphService] Calling onError with:', errorMessage)
      onError?.(new Error(`LangGraph streaming failed: ${errorMessage}`))
    }
  }

  /**
   * Convert LangGraph stream event to ProcessedEvent for ActivityTimeline
   */
  private convertToProcessedEvent(eventData: any): ProcessedEvent | null {
    // Suppress any events that mention memory status
    const eventDataStr = JSON.stringify(eventData).toLowerCase()
    if (eventDataStr.includes('memory enabled') || eventDataStr.includes('memory_enabled')) {
      return null
    }

    // Extract tool information if available
    const toolName = eventData.tool_name || eventData.name || 
                    (eventData.content?.tool_name) || 
                    (eventData.content?.name)

    // Handle different event types from the actual API
    switch (eventData.type) {
      case 'stream_start':
        return {
          title: '🚀 Starting Analysis',
          data: `Stream mode: ${eventData.stream_mode || 'updates'}`
        }

      case 'stream_complete':
        return {
          title: '✅ Analysis Complete',
          data: 'Processing finished'
        }

      case 'chunk_processed':
        // Suppress generic chunk processing events
        return null

      case 'progress':
        // Suppress generic progress events  
        return null

      case 'progressive_search':
        const query = eventData.query || eventData.content?.query || 'N/A'
        const sources = eventData.sources?.join(', ') || eventData.content?.sources?.join(', ') || 'Multiple'
        const totalResults = eventData.total_results_found || eventData.content?.total_results_found || 0
        const execTime = eventData.total_execution_time || eventData.content?.total_execution_time || 0
        
        return {
          title: `🔍 Progressive Search${toolName ? ` (${toolName})` : ''}`,
          data: `Query: "${query}"\nSources: ${sources}\nTotal found: ${totalResults} results\nExecution time: ${execTime}s`
        }

      case 'tool_call_start':
        return {
          title: `⚙️ Using ${toolName || 'tool'}`,
          data: eventData.description || eventData.content?.description || 'Executing tool...'
        }

      case 'tool_call_result':
      case 'tool_result':
        return this.parseToolResult(eventData, toolName)

      case 'agent_step':
        return {
          title: `🧠 ${eventData.step_name || 'Agent Processing'}`,
          data: eventData.content || 'Agent is thinking...'
        }

      case 'data_fusion':
        const sourcesCombined = eventData.content?.sources_combined?.length || 0
        return {
          title: '🔄 Combining Data Sources',
          data: `Fused ${sourcesCombined} sources\nData integration in progress`
        }

      case 'template_generation':
        const progress = Math.round((eventData.content?.progress || 0) * 100)
        return {
          title: '📝 Generating Report',
          data: `Progress: ${progress}%\nTemplate processing...`
        }

      case 'final_response':
        const wordCount = eventData.metadata?.word_count || 0
        return {
          title: '🎯 Analysis Ready',
          data: `Generated ${wordCount} word analysis\nResponse prepared`
        }

      case 'error':
        return {
          title: '❌ Error Occurred',
          data: eventData.message || eventData.content?.message || 'An error occurred during processing'
        }

      default:
        // Handle node-based updates from the actual API response
        if (eventData.node && eventData.content) {
          return this.parseNodeUpdate(eventData)
        }

        return null
    }
  }

  /**
   * Parse tool result events with rich details
   */
  private parseToolResult(eventData: any, toolName?: string): ProcessedEvent | null {
    const tool = toolName || 'Tool'
    const success = eventData.success !== false // Default to true if not specified
    
    // Handle specific tool types with rich formatting
    if (toolName === 'critique_requirement_story_t1' || tool.includes('critique')) {
      const critique = eventData.critique || eventData.content?.critique
      const score = critique?.overall_score || 'N/A'
      const issues = critique?.all_issues?.length || 0
      const compliance = eventData.t1_compliance?.overall_compliant || eventData.content?.t1_compliance?.overall_compliant
      
      return {
        title: `📋 Story Critique (${tool})`,
        data: `Overall Score: ${score}/10\nIssues Found: ${issues}\nCompliance: ${compliance ? 'Yes' : 'No'}\nDetailed analysis completed`
      }
    }
    
    if (toolName === 'web_search_gemini' || tool.includes('web_search')) {
      const results = eventData.results || eventData.content?.results || []
      const totalResults = eventData.total_results || results.length || 0
      const query = eventData.query || eventData.content?.query || 'N/A'
      const sources = results.map((r: any) => r.source || r.title).slice(0, 3).join(', ') || 'Various'
      
      return {
        title: `🌐 Web Search (${tool})`,
        data: `Query: "${query}"\nResults: ${totalResults} found\nTop sources: ${sources}${totalResults > 3 ? '...' : ''}`
      }
    }
    
    if (toolName === 'progressive_search' || tool.includes('progressive')) {
      const searchData = eventData.content || eventData
      const totalResults = searchData.total_results_found || 0
      const sourcesSucceeded = searchData.sources_succeeded || 0
      const sourcesFailed = searchData.sources_failed || 0
      const execTime = searchData.total_execution_time || 0
      
      return {
        title: `🔍 Progressive Search Complete (${tool})`,
        data: `Total: ${totalResults} results from ${sourcesSucceeded + sourcesFailed} sources\nSucceeded: ${sourcesSucceeded}, Failed: ${sourcesFailed}\nExecution time: ${execTime}s`
      }
    }
    
    // Default tool result formatting
    const resultSummary = eventData.result?.summary || 
                         eventData.content?.summary || 
                         (success ? 'Tool executed successfully' : 'Tool execution failed')
    
    return {
      title: `⚙️ ${tool} ${success ? 'completed' : 'failed'}`,
      data: success 
        ? resultSummary
        : eventData.error || eventData.content?.error || 'Tool execution failed'
    }
  }

  /**
   * Parse node-based updates from LangGraph
   */
  private parseNodeUpdate(eventData: any): ProcessedEvent | null {
    const node = eventData.node
    const content = eventData.content
    
    if (!content?.messages?.[0]) {
      return null
    }

    const message = content.messages[0]
    
    // Handle agent node updates (tool calls)
    if (node === 'agent') {
      // Check for tool calls in message metadata
      const toolCalls = message.metadata?.tool_calls || []
      if (toolCalls.length > 0) {
        const toolCall = toolCalls[0]
        const toolName = toolCall.name || 'Unknown Tool'
        const toolArgs = toolCall.args || {}
        
        // Format based on tool type
        if (toolName === 'progressive_search') {
          const query = toolArgs.query || 'N/A'
          const maxResults = toolArgs.max_results || toolArgs.items_requested || 5
          const sources = toolArgs.sources || []
          
          return {
            title: `🔍 Progressive Search`,
            data: `Query: "${query}"\nMax results: ${maxResults}\nSources: ${sources.join(', ')}`
          }
        } else if (toolName === 'web_search_gemini' || toolName === 'web_search') {
          const query = toolArgs.query || 'N/A'
          
          return {
            title: `🌐 Web Search`,
            data: `Query: "${query}"`
          }
        } else if (toolName === 'get_knowledge_details') {
          const sourceTypes = toolArgs.source_types || []
          const itemIds = toolArgs.item_ids || []
          
          // Get distinct source types to avoid repetition
          const distinctSources = [...new Set(sourceTypes)].join(', ')
          
          return {
            title: `📄 Knowledge Details`,
            data: `Items requested: ${itemIds.length}\nSource types: ${distinctSources}`
          }
        } else if (toolName === 'story_critique') {
          const storyId = toolArgs.story_id || toolArgs.id || 'N/A'
          
          return {
            title: `📝 Story Critique`,
            data: `Story ID: ${storyId}`
          }
        } else {
          // Generic tool call display
          const mainParam = Object.keys(toolArgs)[0]
          const paramValue = mainParam ? toolArgs[mainParam] : 'N/A'
          
          return {
            title: `🔧 ${toolName}`,
            data: `${mainParam || 'Parameter'}: ${paramValue}`
          }
        }
      }
      
      // No tool calls found, check for generic content - suppress generic responses
      const content = message.content || ''
      if (content.includes('Analyzing information') || 
          content.includes('Processing') ||
          content.toLowerCase().includes('memory enabled')) {
        return null
      }
    }

    // Handle tool node updates (tool results)
    if (node === 'tools') {
      const content = message.content
      if (typeof content === 'string') {
        try {
          const toolResult = JSON.parse(content)
          
          // Handle progressive search results
          if (toolResult.query && toolResult.result_metrics) {
            const metrics = toolResult.result_metrics
            const totalResults = metrics.total_results || 0
            const successCount = metrics.sources_succeeded || 0
            const failureCount = metrics.sources_failed || 0
            const parallelSpeedup = metrics.parallel_speedup !== undefined ? metrics.parallel_speedup.toFixed(1) : 'N/A'
            const executionTime = metrics.execution_time_ms ? `${metrics.execution_time_ms}ms` : 'N/A'
            
            return {
              title: `🔍 Progressive Search Complete`,
              data: `📊 Found ${totalResults} total results\n✅ ${successCount} sources succeeded, ${failureCount} failed\n⚡ Parallel speedup: ~${parallelSpeedup}x\n⏱️ Execution time: ${executionTime}`
            }
          }
          
          // Handle web search results
          if (toolResult.query && toolResult.results && toolResult.total_results !== undefined) {
            const totalResults = toolResult.total_results || toolResult.results.length || 0
            
            return {
              title: `🌐 Web Search Complete`,
              data: `📊 Results found: ${totalResults}`
            }
          }
          
          // Handle knowledge details results
          if (toolResult.items_requested !== undefined) {
            const itemsRequested = toolResult.items_requested || 0
            const executionTime = toolResult.execution_time ? `${(toolResult.execution_time * 1000).toFixed(0)}ms` : 'N/A'
            
            // Get source breakdown from detailed_results
            let sourceDetails = ''
            if (toolResult.detailed_results) {
              const sourceBreakdown: Record<string, number> = {}
              
              Object.entries(toolResult.detailed_results).forEach(([source, details]: [string, any]) => {
                if (details.found_count) {
                  sourceBreakdown[source] = details.found_count
                }
              })
              
              Object.entries(sourceBreakdown).forEach(([source, count]) => {
                const emoji = source === 'ado' ? '🔧' : source === 'confluence' ? '📚' : '📄'
                sourceDetails += `${emoji} ${source.toUpperCase()} items: ${count}\n`
              })
            }
            
            return {
              title: `📄 Knowledge Details Complete`,
              data: `📊 Items requested: ${itemsRequested}\n${sourceDetails}⏱️ Execution time: ${executionTime}`.trim()
            }
          }
        } catch (e) {
          // Fall through to generic handling
        }
      }
    }

    return null
  }

  /**
   * Extract AI message content from stream event
   */
  private extractMessageContent(eventData: any): string | null {
    // Handle final response content
    if (eventData.type === 'final_response' && eventData.content) {
      return eventData.content
    }

    // Handle agent updates with messages
    if (eventData.node === 'agent' && eventData.content?.messages) {
      const messages = eventData.content.messages
      const aiMessage = messages.find((m: any) => m.type === 'AIMessage')
      
      if (aiMessage && aiMessage.content) {
        return aiMessage.content
      }
    }

    return null
  }

  /**
   * Stream a message with file attachments to LangGraph
   */
  async streamMessageWithFiles(
    message: string,
    files: File[],
    options: {
      sessionId?: string
      threadId?: string
      userId?: string
      onEvent?: (event: ProcessedEvent) => void
      onMessage?: (content: string) => void
      onError?: (error: Error) => void
      signal?: AbortSignal
    } = {}
  ): Promise<void> {
    const { sessionId, threadId, userId, onEvent, onMessage, onError, signal } = options

    console.log('[LangGraphService] streamMessageWithFiles called with:', {
      message,
      filesCount: files.length,
      sessionId,
      threadId,
      userId,
      hasSignal: !!signal
    })

    try {
      // Get authentication headers (without Content-Type for FormData)
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.warn('[LangGraphService] Auth session error:', error)
        throw new Error('Authentication error: ' + error.message)
      }

      if (!session?.access_token) {
        console.warn('[LangGraphService] No access token available')
        throw new Error('Authentication required. Please sign in.')
      }

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('message', message)

      // Add files
      files.forEach((file) => {
        formData.append('files', file)
      })

      // Add other parameters
      if (sessionId) formData.append('session_id', sessionId)
      if (threadId) formData.append('thread_id', threadId)
      formData.append('stream_mode', 'updates')
      formData.append('use_persistent_memory', 'true')
      formData.append('include_metadata', 'true')

      console.log('[LangGraphService] Making file upload request to:', `${this.apiBase}/chat/with-files`)

      const response = await fetch(`${this.apiBase}/chat/with-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
        },
        body: formData,
        signal,
      })

      console.log('[LangGraphService] File upload response received:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[LangGraphService] File upload error response:', errorText)

        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.')
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.')
        } else if (response.status === 404) {
          throw new Error('Session not found. Please create a new conversation.')
        } else {
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
        }
      }

      if (!response.body) {
        console.error('[LangGraphService] No response body available')
        throw new Error('No response body available')
      }

      // Process the stream response (same as regular streamMessage)
      console.log('[LangGraphService] Starting to read file upload response stream...')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let eventCount = 0

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            console.log('[LangGraphService] File upload stream completed, total events processed:', eventCount)
            break
          }

          // Check if request was aborted
          if (signal?.aborted) {
            console.log('[LangGraphService] File upload request aborted')
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Process complete lines
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (!line.trim()) continue
            eventCount++

            // Parse Server-Sent Events format
            if (line.startsWith('event: ')) {
              continue
            }

            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6)

              try {
                const eventData = JSON.parse(dataStr)
                console.log('[LangGraphService] File upload event received:', eventData)

                // ✅ CORRECT: Check if error field exists in SSE event data
                if (eventData.error) {
                  const errorMessage = eventData.error || 'Unknown error occurred'
                  console.log('[LangGraphService] File upload error event received:', errorMessage)

                  // Check if this is a quota exceeded error
                  const isQuotaError = errorMessage.includes('ResourceExhausted') ||
                                       errorMessage.includes('quota') ||
                                       errorMessage.includes('exceeded') ||
                                       errorMessage.includes('limit')

                  // Create user-friendly error message
                  const userFriendlyMessage = isQuotaError
                    ? "⚠️ API usage limit reached. Please try again later or contact support."
                    : "❌ Something went wrong. Please try again."

                  console.log('[LangGraphService] Calling onError with user-friendly message:', userFriendlyMessage)
                  onError?.(new Error(userFriendlyMessage))
                  return // Don't process further if it's an error
                }

                // Convert to ProcessedEvent for ActivityTimeline
                const processedEvent = this.convertToProcessedEvent(eventData)
                if (processedEvent) {
                  console.log('[LangGraphService] Calling onEvent with:', processedEvent)
                  onEvent?.(processedEvent)
                }

                // Extract AI message content
                const messageContent = this.extractMessageContent(eventData)
                if (messageContent) {
                  console.log('[LangGraphService] Calling onMessage with:', messageContent)
                  onMessage?.(messageContent)
                }

              } catch (parseError) {
                console.warn('[LangGraphService] Failed to parse file upload SSE data:', parseError, 'Data:', dataStr)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        console.log('[LangGraphService] File upload reader released')
      }

    } catch (error) {
      console.error('[LangGraphService] Error in streamMessageWithFiles:', error)

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[LangGraphService] File upload request was cancelled (AbortError)')
        return
      }

      // Handle authentication errors specifically
      if (error instanceof Error && error.message.includes('Authentication')) {
        console.error('[LangGraphService] File upload authentication error:', error.message)
        onError?.(error)
        return
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown file upload streaming error'
      console.error('[LangGraphService] Calling onError with:', errorMessage)
      onError?.(new Error(`LangGraph file upload streaming failed: ${errorMessage}`))
    }
  }

  /**
   * Test connection to LangGraph service
   * Health endpoint doesn't require authentication
   */
  async testConnection(): Promise<boolean> {
    console.log('[LangGraphService] Testing connection to:', `${this.apiBase}/health`)
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
      })
      console.log('[LangGraphService] Connection test result:', response.ok)
      return response.ok
    } catch (error) {
      console.error('[LangGraphService] Connection test failed:', error)
      return false
    }
  }

  /**
   * Test authenticated connection to LangGraph service
   */
  async testAuthenticatedConnection(): Promise<boolean> {
    console.log('[LangGraphService] Testing authenticated connection')
    try {
      const headers = await this.getAuthHeaders()
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers,
      })
      console.log('[LangGraphService] Authenticated connection test result:', response.ok)
      return response.ok
    } catch (error) {
      console.error('[LangGraphService] Authenticated connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const langGraphService = new LangGraphService()