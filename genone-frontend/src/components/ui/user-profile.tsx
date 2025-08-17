import { useState } from 'react'
import { Button } from './button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  User,
  LogOut,
  Loader2
} from 'lucide-react'
import { useAuthContext } from '../auth/AuthProvider'
import { toast } from 'sonner'

interface UserProfileProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

export function UserProfile({ user: propUser }: UserProfileProps) {
  const [open, setOpen] = useState(false)
  const { user, profile, logout, loading } = useAuthContext()

  // Use real user data from authentication context, with fallback to props
  const displayUser = {
    name: profile?.full_name ||
          propUser?.name ||
          user?.email?.split('@')[0] ||
          'User',
    email: user?.email || propUser?.email || '',
    avatar: propUser?.avatar // Only use prop avatar since profile doesn't have avatar_url
  }

  // Handle logout with proper error handling and user feedback
  const handleLogout = async () => {
    try {
      setOpen(false) // Close dropdown immediately
      await logout()
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out. Please try again.')
    }
  }

  // Get user initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full hover:bg-accent"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              {getInitials(displayUser.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayUser.name}</p>
            <p className="text-xs text-muted-foreground">{displayUser.email}</p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Log out option with proper functionality */}
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loading}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          <span>{loading ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 