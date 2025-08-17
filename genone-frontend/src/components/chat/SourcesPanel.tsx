import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { X, FileText, ExternalLink } from 'lucide-react'
import { cn } from '../../lib/utils'

interface Reference {
  id: string
  title: string
  url?: string
  content?: string
}

interface SourcesPanelProps {
  isOpen: boolean
  onClose: () => void
  references: Reference[]
}

export function SourcesPanel({ isOpen, onClose, references }: SourcesPanelProps) {
  // console.log('📋 SourcesPanel received references:', references)
  
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Side Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Sources</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="flex-1 h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-border">
            <div className="p-4 space-y-3">
              {references.length > 0 ? (
                references.map((reference, index) => {
                  // Detect the source from URL, otherwise use it from content if available
                  const getSourceType = (ref: Reference) => {
                    // URL detection 
                    if (ref.url) {
                      if (ref.url.includes('k-hub.vodafone.nz')) return 'Khub'
                      if (ref.url.includes('dev.azure.com') || ref.url.includes('azure.com')) return 'ADO'
                      if (ref.url.includes('atlassian.net') || ref.url.includes('confluence')) return 'Confluence'
                      if (ref.url.includes('github.com')) return 'GitHub'
                      return 'Web'
                    }
                    // If content contains the source type (from the (Source) part), use it
                    if (ref.content && ['ADO', 'Confluence', 'Khub', 'GitHub', 'Web'].includes(ref.content)) {
                      return ref.content
                    }
                    return 'Document'
                  }

                  const sourceType = getSourceType(reference)
                  
                  return (
                    <div key={reference.id || index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Title */}
                        <span className="font-medium text-sm break-words flex-1 min-w-0">
                          {reference.title}
                        </span>
                        
                        {/* Source Type Badge */}
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground flex-shrink-0">
                          {sourceType}
                        </span>
                        
                        {/* Source Icon with embedded link */}
                        <div className="flex-shrink-0">
                          {reference.url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-primary/10"
                              onClick={() => window.open(reference.url, '_blank')}
                              title={`Open ${sourceType} source`}
                            >
                              <ExternalLink className="h-4 w-4 text-primary" />
                            </Button>
                          ) : (
                            <div className="h-8 w-8 flex items-center justify-center">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No references available for this message</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
