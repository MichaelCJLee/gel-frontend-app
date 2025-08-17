import React, { useMemo, useState } from 'react'
import type { Message, ProcessedEvent } from '../../lib/types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '../../lib/utils'
import { ActivityTimeline } from './ActivityTimeline'
import { Button } from '../ui/button'
import { CodeBlock } from '../ui/code-block'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { SourcesPanel } from './SourcesPanel'
import { extractReferences } from '../../lib/referenceExtractor'
import { FileAttachments, extractFilesFromMessage } from './FileAttachments'

interface LangGraphMessageListProps {
  messages: Message[]
  isLoading: boolean
  liveActivityEvents: ProcessedEvent[]
  historicalActivities: Record<string, ProcessedEvent[]>
}

// Markdown components for proper styling (from Google reference)
const mdComponents = {
  h1: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn("text-2xl font-bold mt-4 mb-2", className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn("text-xl font-bold mt-3 mb-2", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-bold mt-3 mb-1", className)} {...props}>
      {children}
    </h3>
  ),
  p: ({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn("mb-3 leading-7 overflow-wrap-anywhere", className)} {...props}>
      {children}
    </p>
  ),
  ul: ({ className, children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn("list-disc pl-6 mb-3", className)} {...props}>
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn("list-decimal pl-6 mb-3", className)} {...props}>
      {children}
    </ol>
  ),
  li: ({ className, children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li className={cn("mb-1 overflow-wrap-anywhere", className)} {...props}>
      {children}
    </li>
  ),
  blockquote: ({ className, children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className={cn(
        "border-l-4 border-border pl-4 italic my-3 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ className, children, inline, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => (
    <CodeBlock className={className} inline={inline} {...props}>
      {children}
    </CodeBlock>
  ),
  pre: ({ children }: React.HTMLAttributes<HTMLPreElement>) => (
    <>{children}</>
  ),
  table: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <table
      className={cn(
        "w-full border-collapse my-3",
        className
      )}
      {...props}
    >
      {children}
    </table>
  ),
  thead: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead
      className={cn(
        "bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  ),
  tbody: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  ),
  tr: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr
      className={cn(
        "border-b border-border",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  ),
  th: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        "text-left font-medium p-2 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ className, children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn(
        "p-2 text-sm",
        className
      )}
      {...props}
    >
      {children}
    </td>
  ),
  br: () => <br />,
  strong: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong className={cn("font-bold", className)} {...props}>
      {children}
    </strong>
  ),
  em: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <em className={cn("italic", className)} {...props}>
      {children}
    </em>
  ),
}

// Human Message Bubble Component (Google reference style)
interface HumanMessageBubbleProps {
  message: Message
}

const HumanMessageBubble: React.FC<HumanMessageBubbleProps> = ({ message }) => {
  // Content is now pre-cleaned by parent component
  const content = message.content

  return (
    <div className="text-primary-foreground rounded-3xl break-words min-h-7 bg-primary max-w-[75%] px-4 pt-3 rounded-br-lg">
      <ReactMarkdown
        components={mdComponents}
        remarkPlugins={[[remarkGfm, {singleTilde: false}], remarkBreaks]}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// AI Message Bubble Component (Google reference style - without ActivityTimeline)
interface AiMessageBubbleProps {
  message: Message
  onSourceClick: (messageId: string) => void
}

const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({ message, onSourceClick }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (contentToCopy: string) => {
    try {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }
  // Preprocess content to ensure proper markdown formatting
  const preprocessMarkdown = (content: string): string => {
    // First ensure double newlines before headers and bold lines for proper paragraph breaks
    let processed = content
      // Add double newline before lines that start with ** (bold text)
      .replace(/\n(\*\*[^*]+\*\*)/g, '\n\n$1')
      // Add double newline before markdown headers
      .replace(/\n(#{1,6} )/g, '\n\n$1')
      // Ensure we don't have more than 2 consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
    
    // Now handle line breaks - single newlines become markdown line breaks
    const lines = processed.split('\n')
    const processedLines = lines.map((line, index) => {
      // Don't add line breaks after empty lines or the last line
      if (line.trim() === '' || index === lines.length - 1) {
        return line
      }
      // Add two spaces for markdown line break
      return line + '  '
    })
    
    return processedLines.join('\n').trim()
  }

  // Smart content parser that preserves valuable content while cleaning metadata
  const parseAndCleanContent = (rawContent: string): string => {
    try {
      // Check if content looks like a Python list representation
      const listPattern = /^\[.*\]$/s
      if (listPattern.test(rawContent.trim())) {
        console.log(`[AiMessageBubble] Detected Python list content, attempting to parse...`)

        try {
          // Try to parse as JSON array first (safest approach)
          const parsed = JSON.parse(rawContent)
          if (Array.isArray(parsed)) {
            const joinedContent = parsed.join('\n')
            console.log(`[AiMessageBubble] ✅ Successfully parsed and joined list content`)
            return joinedContent
          }
        } catch (jsonError) {
          // If JSON parsing fails, try manual extraction
          console.log(`[AiMessageBubble] JSON parsing failed, trying manual extraction...`)

          // Extract content between quotes, handling escaped quotes
          const extractedParts: string[] = []
          const quotedContentPattern = /"([^"\\]*(\\.[^"\\]*)*)"|'([^'\\]*(\\.[^'\\]*)*)'/g
          let match

          while ((match = quotedContentPattern.exec(rawContent)) !== null) {
            // Use the captured group that matched (either double or single quotes)
            const content = match[1] || match[3]
            if (content && content.trim()) {
              // Unescape common escape sequences
              const unescaped = content
                .replace(/\\n/g, '\n')
                .replace(/\\t/g, '\t')
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, '\\')
              extractedParts.push(unescaped)
            }
          }

          if (extractedParts.length > 0) {
            const joinedContent = extractedParts.join('\n')
            console.log(`[AiMessageBubble] ✅ Successfully extracted ${extractedParts.length} parts from list`)
            return joinedContent
          }
        }
      }

      // If not a list or parsing failed, return original content
      return rawContent
    } catch (error) {
      console.warn(`[AiMessageBubble] Error parsing content:`, error)
      return rawContent
    }
  }

  const getDisplayContent = (message: Message): { isHistorical: boolean; content: string } => {
    // Detect if message is from historical Supabase data vs live LangGraph
    const isHistoricalMessage = (message: Message): boolean => {
      // Historical messages have MD5 hash IDs (16 hex characters)
      // Live messages use timestamp_random format
      return /^[a-f0-9]{16}$/.test(message.id)
    }

    const isHistorical = isHistoricalMessage(message)

    // Add debugging
    console.log(`[AiMessageBubble] Message ${message.id}:`, {
      isHistorical,
      contentLength: message.content.length,
      contentPreview: message.content.substring(0, 100)
    })

    // Only apply processing to historical messages
    if (isHistorical) {
      // First, try to parse and clean the content
      const parsedContent = parseAndCleanContent(message.content)

      // Check if the parsed content still looks like raw LangGraph JSON/metadata
      const contentStr = parsedContent.toLowerCase()
      const hasRawJSON = contentStr.includes('additional_kwargs') ||
          contentStr.includes('tool_calls') ||
          contentStr.includes('response_metadata') ||
          contentStr.includes("content=''") ||
          contentStr.includes('aimessage') ||
          contentStr.includes('humanmessage') ||
          contentStr.includes('"type":') ||
          contentStr.includes('metadata')

      console.log(`[AiMessageBubble] Historical message analysis:`, {
        messageId: message.id,
        hasRawJSON,
        originalLength: message.content.length,
        parsedLength: parsedContent.length,
        contentPreview: contentStr.substring(0, 200)
      })

      if (hasRawJSON) {
        console.log(`[AiMessageBubble] ✅ SKIPPING raw JSON content for historical message ${message.id}`)
        return {
          isHistorical: true,
          content: "" // Hide messages with raw JSON content
        }
      } else {
        console.log(`[AiMessageBubble] ✅ USING parsed content for historical message ${message.id}`)
        return {
          isHistorical: true,
          content: parsedContent
        }
      }
    }

    // For live messages, return the original content
    return {
      isHistorical: false,
      content: message.content
    }
  }

  const { isHistorical, content } = getDisplayContent(message)

  // Don't render anything for historical messages with empty content
  if (isHistorical && !content.trim()) {
    return null
  }

  // Extract references and get clean content
  const { cleanContent, references } = extractReferences(content)

  // Strip ||RM|| prefix if present in the content
  const strippedContent = cleanContent.startsWith('||RM|| ') ? cleanContent.substring(7) : cleanContent
  const finalContent = preprocessMarkdown(isHistorical ? strippedContent : strippedContent)

  return (
    <div className={`relative break-words flex flex-col w-full min-w-0 ${
      message.isError
        ? 'bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        : ''
    }`}>
      <ReactMarkdown
        components={mdComponents}
        remarkPlugins={[[remarkGfm, {singleTilde: false}]]}
      >
        {finalContent}
      </ReactMarkdown>

      {/* Copy button */}
      <div className="flex justify-start mt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(strippedContent)}
          className="h-8 w-8 p-0"
          title={copied ? "Copied!" : "Copy message"}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>

        {/* Only show Sources button if there are references */}
        {references.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSourceClick(message.id)}
            className="h-8 px-2 flex items-center gap-1"
            title="View sources"
          >
            <ExternalLink className="h-4 w-4" />
            <span className="text-sm">Sources ({references.length})</span>
          </Button>
        )}
      </div>
    </div>
  )
}

export function LangGraphMessageList({
  messages,
  isLoading,
  liveActivityEvents,
  historicalActivities,
}: LangGraphMessageListProps) {
  // Sources panel
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false)
  const [currentReferences, setCurrentReferences] = useState<any[]>([])

  const handleSourceClick = (messageId: string) => {
    // Find the message and extract its references
    const message = messages.find(m => m.id === messageId)
    if (message) {
      const { references } = extractReferences(message.content)
      setCurrentReferences(references)
    }
    setIsSourcesPanelOpen(true)
  }

  // Debug logging
  console.log('[LangGraphMessageList] Props:', {
    messagesCount: messages.length,
    isLoading,
    liveActivityEventsCount: liveActivityEvents.length,
    historicalActivitiesKeys: Object.keys(historicalActivities),
    historicalActivities
  })
  
  // Group consecutive empty assistant messages
  const groupedMessages = useMemo(() => {
    const groups: Array<{
      type: 'user' | 'assistant' | 'assistant-group'
      messages: Message[]
      combinedActivities?: ProcessedEvent[]
    }> = []
    
    let currentGroup: Message[] = []
    
    messages.forEach((message, index) => {
      console.log(`[LangGraphMessageList] Processing message ${index}:`, {
        id: message.id,
        role: message.role,
        hasContent: !!message.content.trim(),
        contentLength: message.content.length,
        hasActivities: !!historicalActivities[message.id],
        activitiesCount: historicalActivities[message.id]?.length || 0
      })
      
      // If it's a user message or assistant with content, flush any current group
      if (message.role === 'user' || (message.role === 'assistant' && message.content.trim())) {
        if (currentGroup.length > 0) {
          // Combine all activities from the group
          const combinedActivities: ProcessedEvent[] = []
          currentGroup.forEach(msg => {
            const activities = historicalActivities[msg.id]
            if (activities) {
              combinedActivities.push(...activities)
            }
          })
          
          console.log('[LangGraphMessageList] Creating assistant-group:', {
            messageCount: currentGroup.length,
            combinedActivitiesCount: combinedActivities.length
          })
          
          groups.push({
            type: 'assistant-group',
            messages: currentGroup,
            combinedActivities
          })
          currentGroup = []
        }
        
        // Add the current message as a single item
        groups.push({
          type: message.role,
          messages: [message]
        })
      } else if (message.role === 'assistant' && !message.content.trim()) {
        // Empty assistant message - add to current group
        console.log('[LangGraphMessageList] Adding to current group:', message.id)
        currentGroup.push(message)
      }
    })
    
    // Don't forget any remaining group
    if (currentGroup.length > 0) {
      const combinedActivities: ProcessedEvent[] = []
      currentGroup.forEach(msg => {
        const activities = historicalActivities[msg.id]
        if (activities) {
          combinedActivities.push(...activities)
        }
      })
      
      groups.push({
        type: 'assistant-group',
        messages: currentGroup,
        combinedActivities
      })
    }
    
    console.log('[LangGraphMessageList] Final grouped messages:', {
      groupsCount: groups.length,
      groups: groups.map(g => ({
        type: g.type,
        messageCount: g.messages.length,
        combinedActivitiesCount: g.combinedActivities?.length || 0
      }))
    })
    
    return groups
  }, [messages, historicalActivities])

  return (
    <>
    <div className="space-y-4 pb-4">
      {groupedMessages.map((group, groupIndex) => {
        const isLastGroup = groupIndex === groupedMessages.length - 1
        const lastMessage = group.messages[group.messages.length - 1]
        const isLastMessage = isLastGroup && messages[messages.length - 1] === lastMessage
        
        if (group.type === 'user') {
          // Render user message with file attachments above
          const message = group.messages[0]
          const { cleanContent, files } = extractFilesFromMessage(message)

          return (
            <div key={message.id || `user-${groupIndex}`} className="flex flex-col items-end gap-2">
              {/* File attachments above message */}
              <FileAttachments files={files} />
              {/* Message bubble - Remove nested flex container that was constraining width */}
              <HumanMessageBubble message={{ ...message, content: cleanContent }} />
            </div>
          )
        } else if (group.type === 'assistant') {
          // Single assistant message with content
          const message = group.messages[0]
          const historicalActivity = message.id ? historicalActivities[message.id] : undefined
          const activityForThisMessage = isLastMessage && isLoading ? liveActivityEvents : historicalActivity
          // Helper function to check if message is historical
          const isHistoricalMessage = (msg: Message): boolean => {
            return /^[a-f0-9]{16}$/.test(msg.id)
          }

          const shouldShowActivityTimeline =
            !isHistoricalMessage(message) && (
              (historicalActivity && historicalActivity.length > 0) ||
              (isLastMessage && isLoading)
            )
          
          return (
            <div key={message.id || `assistant-${groupIndex}`} className="space-y-3">
              {shouldShowActivityTimeline && (
                <div className="w-full">
                  <ActivityTimeline
                    processedEvents={activityForThisMessage || []}
                    isLoading={isLastMessage && isLoading}
                  />
                </div>
              )}
              <div className="flex items-start gap-3 min-w-0 w-full">
                <AiMessageBubble message={message}
                onSourceClick={handleSourceClick}
                />
              </div>
            </div>
          )
        } else {
          // Group of empty assistant messages - show combined timeline
          const activityForGroup = isLastMessage && isLoading ? liveActivityEvents : group.combinedActivities
          // Helper function to check if any message in group is historical
          const hasHistoricalMessages = group.messages.some(msg => /^[a-f0-9]{16}$/.test(msg.id))

          const shouldShowActivityTimeline =
            !hasHistoricalMessages && (
              (group.combinedActivities && group.combinedActivities.length > 0) ||
              (isLastMessage && isLoading)
            )
          
          console.log(`[LangGraphMessageList] Rendering assistant-group ${groupIndex}:`, {
            isLastMessage,
            isLoading,
            combinedActivitiesCount: group.combinedActivities?.length || 0,
            shouldShowActivityTimeline,
            activityForGroup
          })
          
          return (
            <div key={`group-${groupIndex}`} className="space-y-3">
              {shouldShowActivityTimeline && (
                <div className="w-full">
                  <ActivityTimeline
                    processedEvents={activityForGroup || []}
                    isLoading={isLastMessage && isLoading}
                  />
                </div>
              )}
              {/* Don't show empty message bubbles for tool calls */}
            </div>
          )
        }
      })}
    </div>

    {/* Add SourcesPanel component */}
    <SourcesPanel
      isOpen={isSourcesPanelOpen}
      onClose={() => setIsSourcesPanelOpen(false)}
      references={currentReferences}
    />
    </>
  )
} 