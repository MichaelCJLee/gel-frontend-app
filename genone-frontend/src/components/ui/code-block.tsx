import React, { useState } from 'react'
import { MermaidDiagram } from './mermaid-diagram'
import { Button } from './button'
import { Copy, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface CodeBlockProps {
  children: React.ReactNode
  className?: string
  inline?: boolean
}

export function CodeBlock({ children, className, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  // Extract language and code content
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : ''
  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  // Handle inline code
  if (inline) {
    return (
      <code className={cn(
        "bg-muted rounded px-1 py-0.5 font-mono text-xs",
        className
      )}>
        {children}
      </code>
    )
  }

  // Handle mermaid diagrams
  if (language === 'mermaid') {
    return <MermaidDiagram chart={code} className="my-4" />
  }

  // Auto-detect short code for Claude-style inline display
  const isShortCode = code.split('\n').length === 1 && code.length < 300

  if (isShortCode) {
    return (
      <code className={cn(
        "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded px-1.5 py-0.5 font-mono text-sm",
        className
      )}>
        {children}
      </code>
    )
  }

  // Handle regular code blocks
  return (
    <div className="relative group my-4 max-w-full min-w-0">
      <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-t border-l border-r rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
      </div>
      <pre className={cn(
        "bg-muted p-4 rounded-b-lg border-b border-l border-r overflow-x-auto font-mono text-sm max-w-full",
        className
      )}>
        <code className="block">{children}</code>
      </pre>
    </div>
  )
}
