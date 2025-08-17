import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  const handleToggle = () => {
    console.log('Theme toggle clicked, current theme:', theme)
    console.log('Document classes before toggle:', document.documentElement.className)
    toggleTheme()
    setTimeout(() => {
      console.log('Document classes after toggle:', document.documentElement.className)
    }, 100)
  }

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getTooltip = () => {
    switch (theme) {
      case 'dark':
        return 'Dark mode'
      case 'light':
        return 'Light mode'
      case 'system':
        return 'System mode'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className="h-8 w-8 p-0"
      title={getTooltip()}
    >
      {getIcon()}
      <span className="sr-only">{getTooltip()}</span>
    </Button>
  )
} 