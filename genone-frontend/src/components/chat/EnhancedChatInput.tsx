import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Square, Sparkles, Zap, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFileUpload } from '@/hooks/useFileUpload'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface EnhancedChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void
  onCancel?: () => void
  isLoading?: boolean
  placeholder?: string
  disabled?: boolean
  className?: string
  maxRows?: number
  showAdvancedFeatures?: boolean
  enableFileUpload?: boolean
}

// Tooltip text constants for mode buttons
const TOOLTIP_TEXTS = {
  fastMode: "Be Fast Mode: Adaptive search; deepens as conversation evolves. Expansion is guided.",
  deepMode: "Go Deep Mode: Engages a deep, exhaustive search with automatic expansion for the most complete details."
} as const

export function EnhancedChatInput({
  onSendMessage,
  onCancel,
  isLoading = false,
  placeholder = "Type your message...",
  disabled = false,
  className,
  maxRows = 6,
  showAdvancedFeatures = true,
  enableFileUpload = true
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState('')
  const [reasoningMode, setReasoningMode] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use file upload hook with validation
  const {
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
    formatFileSize,
    canAddMoreFiles
  } = useFileUpload({
    maxFiles: 3,
    onError: (errors) => {
      // Show error messages to user using toast
      errors.forEach(error => {
        toast.error(error, {
          duration: 5000,
        })
      })
    },
    onWarning: (warnings) => {
      // Show warning messages to user using toast
      warnings.forEach(warning => {
        toast.warning(warning, {
          duration: 8000, // Longer duration for warnings
        })
      })
    }
  })

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = '120px' // Reset to min height
      const scrollHeight = textarea.scrollHeight
      const lineHeight = 24 // Approximate line height in pixels
      const maxHeight = lineHeight * maxRows
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`
    }
  }, [message, maxRows])

  // Focus textarea on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus()
    }
  }, [disabled])

  const handleSubmit = () => {
    const trimmedMessage = message.trim()

    if (trimmedMessage && !isLoading && !disabled) {
      // Prepend ||RM|| if reasoning mode is active
      const finalMessage = reasoningMode ? `||RM|| ${trimmedMessage}` : trimmedMessage
      onSendMessage(finalMessage, selectedFiles.length > 0 ? selectedFiles : undefined)
      setMessage('')
      clearFiles()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCancel = () => {
    onCancel?.()
  }

  const handleAttachmentClick = () => {
    if (!disabled && !isLoading && fileInputRef.current && canAddMoreFiles) {
      fileInputRef.current.click()
    }
  }

  const isMessageEmpty = !message.trim()
  const canSend = !isMessageEmpty && !isLoading && !disabled

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn("w-full px-2 pt-2 pb-4", className)}>
      {/* Unified Input Container with Flexbox */}
      <div className="flex flex-col rounded-2xl overflow-hidden bg-background shadow-input ring-1 ring-input transition-all duration-200">
        {/* Textarea Section */}
        <div className="relative flex-1">
          {/* Selected Files Display - Inside the input container */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-3 p-3 pb-2">
              {selectedFiles.map((file, index) => {
                // Get file type display name
                const getFileTypeDisplay = (type: string) => {
                  if (type === 'application/pdf') return 'PDF'
                  if (type.startsWith('image/')) return 'Image'
                  if (type === 'text/plain') return 'Text'
                  if (type.includes('csv')) return 'CSV'
                  if (type.includes('markdown')) return 'Markdown'
                  return 'File'
                }

                // Get file icon and color
                const getFileIcon = (type: string) => {
                  if (type === 'application/pdf') {
                    return { icon: '📄', bgColor: 'bg-red-50', iconColor: 'text-red-600' }
                  }
                  if (type.startsWith('image/')) {
                    return { icon: '🖼️', bgColor: 'bg-green-50', iconColor: 'text-green-600' }
                  }
                  if (type === 'text/plain' || type.includes('csv') || type.includes('markdown')) {
                    return { icon: '📝', bgColor: 'bg-blue-50', iconColor: 'text-blue-600' }
                  }
                  return { icon: '📄', bgColor: 'bg-gray-50', iconColor: 'text-gray-600' }
                }

                const fileIcon = getFileIcon(file.type)
                const fileTypeDisplay = getFileTypeDisplay(file.type)

                return (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-background rounded-xl border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-200 min-w-[200px] max-w-[280px]"
                  >
                    {/* File Icon */}
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      fileIcon.bgColor
                    )}>
                      <span className={cn("text-sm", fileIcon.iconColor)}>
                        {fileIcon.icon}
                      </span>
                    </div>

                    {/* File Info */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium text-foreground text-sm truncate max-w-[140px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {fileTypeDisplay} • {formatFileSize(file.size)}
                      </span>
                    </div>

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-5 w-5 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full flex-shrink-0"
                      title="Remove file"
                    >
                      <span className="text-sm leading-none">×</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex w-full text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px] max-h-[288px] resize-none border-0 p-4 bg-transparent text-foreground placeholder-muted-foreground transition-all duration-200 [border:none!important] [outline:none!important] [box-shadow:none!important] [appearance:none] focus:outline-none focus:ring-0 focus:border-0 focus:[border:none!important] focus:[outline:none!important] focus:[box-shadow:none!important]",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {/* Integrated Toolbox Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-transparent">
          {/* Left Side: Attachment and Mode Toggle Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Attachment Button */}
            {enableFileUpload && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="inline-block">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAttachmentClick}
                      className={cn(
                        "h-7 w-7 p-0 rounded-full transition-all duration-200",
                        !canAddMoreFiles
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                      disabled={disabled || isLoading || !canAddMoreFiles}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {!canAddMoreFiles ? (
                    <p>Cannot add more files</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">Attach up to 3 files</p>
                      <div className="text-xs space-y-0.5">
                        <p><strong>Supported types:</strong></p>
                        <p>• Text: .txt (1MB max)</p>
                        <p>• PDF: .pdf text-based only (5MB max)</p>
                        <p>• Images: .jpg, .png, .gif (5MB max)</p>
                        <p><strong>Total limit:</strong> 15MB</p>
                      </div>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Mode Toggle Buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={!reasoningMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReasoningMode(false)}
                  className={cn(
                    "h-7 rounded-full transition-all duration-200 flex items-center gap-1.5",
                    !reasoningMode
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 px-3"
                      : "w-7 p-0"
                  )}
                  disabled={disabled || isLoading}
                >
                  <Zap className="h-3.5 w-3.5 flex-shrink-0" />
                  {!reasoningMode && (
                    <span className="text-xs font-medium whitespace-nowrap">Be Fast Mode</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{TOOLTIP_TEXTS.fastMode}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={reasoningMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setReasoningMode(!reasoningMode)}
                  className={cn(
                    "h-7 rounded-full transition-all duration-200 flex items-center gap-1.5",
                    reasoningMode
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 px-3"
                      : "w-7 p-0"
                  )}
                  disabled={disabled || isLoading}
                >
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                  {reasoningMode && (
                    <span className="text-xs font-medium whitespace-nowrap">Go Deep Mode</span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{TOOLTIP_TEXTS.deepMode}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Hints and Character Count */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-1 justify-center min-w-0">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Enter to send</span>
            {message.length > 0 && (
              <span className="text-muted-foreground/80 hidden md:inline">
                {message.length}/40000 • {message.split('\n').length} line{message.split('\n').length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Right Side: Send/Cancel Button */}
          <div className="flex items-center">
            {isLoading ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="h-7 w-7 p-0 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground rounded-full"
                  >
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Cancel generation</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSend}
                    size="sm"
                    className={cn(
                      "h-7 w-7 p-0 transition-all duration-200 rounded-full",
                      canSend
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Send message</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      {enableFileUpload && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.pdf,.jpg,.jpeg,.png,.gif"
          onChange={(e) => {
            if (e.target.files) {
              addFiles(e.target.files)
              // Reset the input value to allow selecting the same file again
              e.target.value = ''
            }
          }}
          className="hidden"
          disabled={disabled || isLoading}
          data-testid="file-input"
        />
      )}

      {/* External Components */}

      {/* Status Indicators */}
      {isLoading && (
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span>
              {reasoningMode ? "AI is thinking in Deep Mode..." : "AI is thinking in Fast Mode..."}
            </span>
          </div>
        </div>
      )}

      {/* Markdown Support Hint */}
      {showAdvancedFeatures && (message.includes('*') || message.includes('`') || message.includes('#')) && (
        <div className="mt-3 p-2 bg-muted rounded text-xs text-muted-foreground">
          <span className="text-primary">💡 Tip:</span> Your message contains markdown formatting which will be rendered in the response.
        </div>
      )}
      </div>
    </TooltipProvider>
  )
}