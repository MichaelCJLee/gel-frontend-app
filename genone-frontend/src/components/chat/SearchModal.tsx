import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Search,
  MessageSquare,
  X
} from 'lucide-react'
import { useConversations } from '@/context/ConversationContext'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectConversation?: (id: string) => void
}

export function SearchModal({ open, onOpenChange, onSelectConversation }: SearchModalProps) {
  const { conversations, setCurrentConversation } = useConversations()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    const query = searchQuery.toLowerCase()
    return (
      conv.title.toLowerCase().includes(query) ||
      conv.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      )
    )
  })

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Clear search when modal closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('')
    }
  }, [open])

  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id)
    onSelectConversation?.(id)
    onOpenChange(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false)
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // TODO: Add keyboard navigation for results
      e.preventDefault()
    } else if (e.key === 'Enter' && filteredConversations.length > 0) {
      handleSelectConversation(filteredConversations[0].id)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="bg-background border border-border max-w-2xl max-h-[80vh] p-0 shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Search className="h-5 w-5" />
            Search chats
          </DialogTitle>
        </DialogHeader>
        
        {/* Search Input */}
        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="pl-10 bg-background border-border text-foreground placeholder-muted-foreground"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 max-h-96">
          <div className="px-6 pb-6">
            {searchQuery === '' ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start typing to search your conversations</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations found for "{searchQuery}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  {filteredConversations.length} result{filteredConversations.length !== 1 ? 's' : ''} found
                </p>
                
                {filteredConversations.map((conversation) => {
                  // Find matching message content for preview
                  const matchingMessage = conversation.messages.find(msg =>
                    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  
                  return (
                    <div
                      key={conversation.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors border",
                        "hover:bg-muted/50 border-border"
                      )}
                      onClick={() => handleSelectConversation(conversation.id)}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare className="h-5 w-5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-medium text-foreground truncate">
                              {conversation.title}
                            </h3>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}
                            </span>
                          </div>
                          
                          {matchingMessage && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {matchingMessage.content.length > 150 
                                ? matchingMessage.content.substring(0, 150) + '...'
                                : matchingMessage.content
                              }
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {conversation.messages.length} messages
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 