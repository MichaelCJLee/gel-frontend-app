import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className, size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  }

  return (
    <div className={cn(
      "rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center",
      sizeClasses[size],
      className
    )}>
      GO
    </div>
  )
} 