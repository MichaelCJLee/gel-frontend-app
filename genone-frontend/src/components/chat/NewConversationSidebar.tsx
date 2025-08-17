import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useConversations } from '@/context/ConversationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Edit3, Trash2, PenSquare, PanelLeftClose } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface NewConversationSidebarProps {
  className?: string
  onClose?: () => void
  width?: number
  onWidthChange?: (width: number) => void
}

export function NewConversationSidebar({ 
  className, 
  onClose,
  width = 256,
  onWidthChange 
}: NewConversationSidebarProps) {
  const {
    conversations,
    currentConversation,
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversation,
  } = useConversations()

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = Math.max(200, Math.min(500, e.clientX))
    onWidthChange?.(newWidth)
  }, [isResizing, onWidthChange])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add global event listeners when resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  // Step 2: Add basic structure with real data
  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-full bg-background flex flex-col relative border-r border-border",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold">GenOne</h1>
            <p className="text-xs text-muted-foreground">PDLC AI Assistant</p>
          </div>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              title="Close sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        <Button 
          onClick={() => createConversation()} 
          className="w-full justify-center gap-2" 
          variant="outline"
        >
          <PenSquare className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2">
        <p className="text-sm text-muted-foreground mb-2 px-2">
          {conversations.length} conversations
        </p>
        
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => setCurrentConversation(conv.id)}
            className={cn(
              "flex items-center gap-2 p-2 rounded cursor-pointer mb-1",
              currentConversation?.id === conv.id
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {conv.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(conv.updatedAt, { addSuffix: true })}
              </p>
            </div>
            {/* Step 3: Menu button with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedConversation(conv)
                    setNewTitle(conv.title)
                    setRenameDialogOpen(true)
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedConversation(conv)
                    setDeleteDialogOpen(true)
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border transition-colors",
          isResizing && "bg-border"
        )}
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar"
      />

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
            <DialogDescription>
              Enter a new name for this conversation.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Conversation title..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && selectedConversation) {
                renameConversation(selectedConversation.id, newTitle)
                setRenameDialogOpen(false)
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedConversation) {
                  renameConversation(selectedConversation.id, newTitle)
                  setRenameDialogOpen(false)
                }
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedConversation?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedConversation) {
                  deleteConversation(selectedConversation.id)
                  setDeleteDialogOpen(false)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}