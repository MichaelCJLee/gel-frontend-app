import React from 'react'
import { FileText, Image, Paperclip } from 'lucide-react'

interface FileAttachment {
  name: string
  type: string
}

interface FileAttachmentsProps {
  files: FileAttachment[]
  className?: string
}

/**
 * Component for displaying file attachments above message bubbles
 * Supports both streaming messages (with files property) and historical messages (parsed from content)
 */
export const FileAttachments: React.FC<FileAttachmentsProps> = ({ files, className = '' }) => {
  if (!files || files.length === 0) {
    return null
  }

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return { icon: FileText, bgColor: 'bg-red-100', iconColor: 'text-red-600' }
      case 'image':
        return { icon: Image, bgColor: 'bg-green-100', iconColor: 'text-green-600' }
      default:
        return { icon: Paperclip, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' }
    }
  }

  const getFileTypeLabel = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'PDF'
      case 'image':
        return 'Image'
      default:
        return 'File'
    }
  }

  return (
    <div className={`mb-3 flex flex-col items-end ${className}`}>
      <div className="space-y-2">
        {files.map((file, index) => {
          const fileIcon = getFileIcon(file.type)
          const IconComponent = fileIcon.icon
          const typeLabel = getFileTypeLabel(file.type)
          
          return (
            <div
              key={index}
              className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5 shadow-sm"
            >
              {/* File Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${fileIcon.bgColor}`}>
                <IconComponent className={`w-4 h-4 ${fileIcon.iconColor}`} />
              </div>
              
              {/* File Info */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-foreground text-sm truncate">
                  {file.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {typeLabel}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Utility function to parse file context from message content (for historical messages)
 * Extracts file information from embedded context in the format:
 * --- Uploaded Files Context ---
 * [PDF: filename.pdf]
 * [File: filename.txt]
 * [Image: filename.jpg] or [Image Analysis: filename.jpg]
 */
export const parseFileContext = (content: string): { cleanContent: string; files: FileAttachment[] } => {
  const fileContextPattern = /\n\n--- Uploaded Files Context ---\n([\s\S]*?)$/
  const match = content.match(fileContextPattern)

  if (match) {
    const fileContext = match[1]
    const cleanContent = content.replace(match[0], '').trim()

    // Extract file information from context
    const files: FileAttachment[] = []
    const lines = fileContext.split('\n')

    for (const line of lines) {
      // Match patterns like [PDF: filename.pdf], [File: filename.txt], [Image: filename.jpg], or [Image Analysis: filename.jpg]
      const fileMatch = line.match(/\[(PDF|File|Image(?:\s+Analysis)?): ([^\]]+)\]/)
      if (fileMatch) {
        // Normalize "Image Analysis" to "image" for consistency
        const fileType = fileMatch[1].toLowerCase().includes('image') ? 'image' : fileMatch[1].toLowerCase()
        files.push({
          name: fileMatch[2],
          type: fileType
        })
      }
    }

    return { cleanContent, files }
  }

  return { cleanContent: content, files: [] }
}

/**
 * Utility function to extract files from a message
 * Handles both streaming messages (message.files) and historical messages (parsed from content)
 * FIXED: Always removes file context from content, regardless of message.files presence
 */
export const extractFilesFromMessage = (message: { content: string; files?: FileAttachment[] }): { 
  cleanContent: string; 
  files: FileAttachment[] 
} => {
  // Strip ||RM|| prefix if present
  const rawContent = message.content.startsWith('||RM|| ')
    ? message.content.substring(7)
    : message.content

  // ALWAYS parse file context to get clean content (fixes the content processing issue)
  const { cleanContent, files: parsedFiles } = parseFileContext(rawContent)

  // For streaming messages, prefer message.files over parsed files, but use clean content
  if (message.files && message.files.length > 0) {
    return {
      cleanContent, // Use clean content (file context removed)
      files: message.files // Use files from message property
    }
  }

  // For historical messages, use both parsed content and files
  return { cleanContent, files: parsedFiles }
}
