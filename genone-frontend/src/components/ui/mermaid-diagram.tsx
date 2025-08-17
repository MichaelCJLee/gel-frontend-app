import { useEffect, useState } from 'react'
import mermaid from 'mermaid'
import { Button } from './button'
import { Copy, Check, Download, Maximize2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { cleanMermaidSyntax } from '../../lib/mermaidSyntaxCleaner'

// CSS styles for responsive Mermaid diagrams
const mermaidStyles = `
  .mermaid-container .mermaid-svg {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 0 auto;
  }

  .mermaid-container.fullscreen .mermaid-svg {
    width: 80vw;
    min-width: 600px;
    max-width: 1200px;
    height: auto;
    display: block;
    margin: 0 auto;
  }
`

interface MermaidDiagramProps {
  chart: string
  className?: string
  title?: string
}

// Helper function to configure mermaid safely
const configureMermaid = () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'strict', // Changed from 'loose' to 'strict' for better error handling
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    // Disable global error display
    logLevel: 'error',
    suppressErrorRendering: true, // This prevents global error notifications
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis',
    },
    sequence: {
      useMaxWidth: true,
      wrap: true,
    },
    gantt: {
      useMaxWidth: true,
    },
    journey: {
      useMaxWidth: true,
    },
    timeline: {
      useMaxWidth: true,
    },
    gitGraph: {
      useMaxWidth: true,
    },
    c4: {
      useMaxWidth: true,
    },
    sankey: {
      useMaxWidth: true,
    },
    xyChart: {
      useMaxWidth: true,
    },
    requirement: {
      useMaxWidth: true,
    },
    mindmap: {
      useMaxWidth: true,
    },
    quadrantChart: {
      useMaxWidth: true,
    },
    er: {
      useMaxWidth: true,
    },
    pie: {
      useMaxWidth: true,
    },
  })
}

export function MermaidDiagram({ chart, className, title }: MermaidDiagramProps) {
  const [svgContent, setSvgContent] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [cleaningInfo, setCleaningInfo] = useState<{ applied: string[]; warnings: string[] } | null>(null)

  // Initialize mermaid on component mount
  useEffect(() => {
    if (!isInitialized) {
      configureMermaid()
      setIsInitialized(true)
    }
  }, [isInitialized])

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart.trim() || !isInitialized) return

      try {
        setError('')
        setCleaningInfo(null)

        // Generate unique ID for this diagram
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

        // Clear any existing error elements from DOM
        const existingErrors = document.querySelectorAll('[id^="d"], .mermaid-error, .error')
        existingErrors.forEach(el => {
          if (el.textContent?.includes('Syntax error') || el.textContent?.includes('Parse error')) {
            el.remove()
          }
        })

        // Clean the Mermaid syntax first
        const cleaningResult = cleanMermaidSyntax(chart)
        const chartToRender = cleaningResult.cleaned

        // Store cleaning information for debugging
        if (cleaningResult.applied.length > 0 || cleaningResult.warnings.length > 0) {
          setCleaningInfo({
            applied: cleaningResult.applied,
            warnings: cleaningResult.warnings
          })
        }

        // Parse the cleaned diagram first to catch syntax errors
        await mermaid.parse(chartToRender)

        // Render the cleaned diagram
        const { svg } = await mermaid.render(id, chartToRender)

        // Store SVG content with responsive classes
        const parser = new DOMParser()
        const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
        const svgElement = svgDoc.querySelector('svg')

        if (svgElement) {
          // Add responsive classes to the SVG
          svgElement.classList.add('mermaid-svg')
          setSvgContent(svgElement.outerHTML)
        }

      } catch (err) {
        console.error('Mermaid rendering error with cleaned syntax:', err)

        // If cleaned syntax failed, try original syntax as fallback
        try {
          console.log('Attempting fallback to original syntax...')
          const fallbackId = `mermaid-fallback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

          await mermaid.parse(chart)
          const { svg } = await mermaid.render(fallbackId, chart)

          const parser = new DOMParser()
          const svgDoc = parser.parseFromString(svg, 'image/svg+xml')
          const svgElement = svgDoc.querySelector('svg')

          if (svgElement) {
            svgElement.classList.add('mermaid-svg')
            setSvgContent(svgElement.outerHTML)

            // Update cleaning info to show fallback was used
            setCleaningInfo({
              applied: ['fallback-to-original'],
              warnings: ['Cleaned syntax failed, using original syntax']
            })
          }
        } catch (fallbackErr) {
          console.error('Both cleaned and original syntax failed:', fallbackErr)

          // Clear any DOM error elements that mermaid might have created
          setTimeout(() => {
            const errorElements = document.querySelectorAll('[id^="d"], .mermaid-error, .error')
            errorElements.forEach(el => {
              if (el.textContent?.includes('Syntax error') || el.textContent?.includes('Parse error')) {
                el.remove()
              }
            })
          }, 100)

          // Set our controlled error message with both error details
          const cleanedError = err instanceof Error ? err.message : 'Failed to render cleaned diagram'
          const originalError = fallbackErr instanceof Error ? fallbackErr.message : 'Failed to render original diagram'
          setError(`Mermaid syntax error: ${cleanedError}. Original syntax also failed: ${originalError}`)
        }
      }
    }

    renderDiagram()
  }, [chart, isInitialized])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleDownloadSVG = () => {
    if (!svgContent) return
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'mermaid-diagram'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Reusable SVG component
  const DiagramSVG = ({ className: svgClassName }: { className?: string }) => (
    <div
      className={cn("mermaid-container", svgClassName)}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )

  if (error) {
    return (
      <div className={cn("border rounded-lg p-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800", className)}>
        <div className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
          ⚠️ Mermaid Diagram Error
        </div>
        <div className="text-red-700 dark:text-red-300 text-sm mb-3">
          {error}
        </div>
        <details className="group">
          <summary className="text-red-600 dark:text-red-400 text-xs cursor-pointer hover:text-red-700 dark:hover:text-red-300">
            View diagram source
          </summary>
          <pre className="bg-red-100 dark:bg-red-900 p-3 rounded text-xs overflow-x-auto mt-2 text-red-800 dark:text-red-200">
            <code>{chart}</code>
          </pre>
        </details>
      </div>
    )
  }

  if (!svgContent) {
    return (
      <div className={cn("border rounded-lg p-4 bg-muted/50", className)}>
        <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent"></div>
            Loading diagram...
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Inject CSS styles */}
      <style>{mermaidStyles}</style>

      <div className={cn("relative border rounded-lg bg-background overflow-hidden", className)}>
        {/* Header with title and controls */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-muted-foreground">
              {title || 'Mermaid Diagram'}
            </div>
            {cleaningInfo && cleaningInfo.applied.length > 0 && (
              <div
                className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                title={`Applied cleaning rules: ${cleaningInfo.applied.join(', ')}`}
              >
                ✨ Cleaned
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 w-7 p-0"
              title={copied ? "Copied!" : "Copy diagram code"}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
            
            {svgContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadSVG}
                className="h-7 w-7 p-0"
                title="Download as SVG"
              >
                <Download className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-7 w-7 p-0"
              title="View fullscreen"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Diagram container */}
        <div className="p-4 overflow-x-auto">
          <DiagramSVG className="flex justify-center items-center min-h-[200px]" />
        </div>
      </div>

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-[95vw] max-h-[95vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{title || 'Mermaid Diagram'}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <DiagramSVG className="flex justify-center fullscreen" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
