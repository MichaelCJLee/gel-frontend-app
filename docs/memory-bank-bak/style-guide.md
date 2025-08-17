# GenOne Style Guide

## 🎨 Design System Overview

**Design Philosophy**: Minimalistic, professional, and accessible  
**Primary Inspiration**: ChatGPT interface with enterprise polish  
**Component Library**: shadcn/ui with custom GenOne theming  
**Design Language**: Clean, black & white with strategic accent colors  

## 🌈 Color Palette

### Primary Colors
```css
/* Light Theme */
--background: 0 0% 100%;           /* Pure white */
--foreground: 222.2 84% 4.9%;      /* Near black text */
--card: 0 0% 100%;                 /* Card background */
--card-foreground: 222.2 84% 4.9%; /* Card text */
--popover: 0 0% 100%;              /* Popover background */
--popover-foreground: 222.2 84% 4.9%; /* Popover text */

/* Dark Theme */
--background: 222.2 84% 4.9%;      /* Dark background */
--foreground: 210 40% 98%;         /* Light text */
--card: 222.2 84% 4.9%;            /* Dark card */
--card-foreground: 210 40% 98%;    /* Light card text */
--popover: 222.2 84% 4.9%;         /* Dark popover */
--popover-foreground: 210 40% 98%; /* Light popover text */
```

### Accent Colors
```css
/* GenOne Brand Accent */
--primary: 221.2 83.2% 53.3%;      /* GenOne blue */
--primary-foreground: 210 40% 98%; /* White on blue */

/* Semantic Colors */
--success: 142.1 76.2% 36.3%;      /* Green for success */
--warning: 47.9 95.8% 53.1%;       /* Amber for warnings */
--destructive: 0 84.2% 60.2%;      /* Red for errors */
--info: 199.89 89.47% 49.8%;       /* Blue for info */
```

### Neutral Grays
```css
--muted: 210 40% 96%;              /* Light gray */
--muted-foreground: 215.4 16.3% 46.9%; /* Medium gray text */
--border: 214.3 31.8% 91.4%;       /* Light border */
--input: 214.3 31.8% 91.4%;        /* Input background */
--ring: 221.2 83.2% 53.3%;         /* Focus ring */
```

## 📝 Typography

### Font Stack
```css
/* Primary Font Family */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;

/* Monospace for Code */
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", 
             Consolas, "Courier New", monospace;
```

### Typography Scale
```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }    /* 36px */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }  /* 30px */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }       /* 24px */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }    /* 20px */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }   /* 18px */

/* Body Text */
.text-base { font-size: 1rem; line-height: 1.5rem; }      /* 16px */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }   /* 14px */
.text-xs { font-size: 0.75rem; line-height: 1rem; }       /* 12px */
```

### Font Weights
```css
.font-light { font-weight: 300; }     /* Light */
.font-normal { font-weight: 400; }    /* Regular */
.font-medium { font-weight: 500; }    /* Medium */
.font-semibold { font-weight: 600; }  /* Semi-bold */
.font-bold { font-weight: 700; }      /* Bold */
```

## 🔲 Spacing & Layout

### Spacing Scale (Tailwind CSS)
```css
/* Spacing Units (rem) */
0.5 = 0.125rem = 2px
1   = 0.25rem  = 4px
2   = 0.5rem   = 8px
3   = 0.75rem  = 12px
4   = 1rem     = 16px
5   = 1.25rem  = 20px
6   = 1.5rem   = 24px
8   = 2rem     = 32px
10  = 2.5rem   = 40px
12  = 3rem     = 48px
16  = 4rem     = 64px
```

### Layout Guidelines
- **Container Max Width**: 1200px for main content
- **Sidebar Width**: 320px (collapsible to 64px)
- **Message Bubbles**: Max width 768px
- **Input Field**: Full width with 16px padding
- **Card Padding**: 24px (desktop), 16px (mobile)

## 🎯 Component Standards

### Button Styles
```tsx
// Primary Button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</Button>

// Secondary Button  
<Button variant="outline" className="border-input bg-background hover:bg-accent">
  Secondary Action
</Button>

// Ghost Button
<Button variant="ghost" className="hover:bg-accent hover:text-accent-foreground">
  Ghost Action
</Button>
```

### Input Fields
```tsx
// Standard Input
<Input 
  className="border-input bg-background focus:ring-ring focus:ring-2"
  placeholder="Type your message..."
/>

// Textarea for Chat
<Textarea 
  className="min-h-[60px] max-h-[200px] resize-none"
  placeholder="Ask GenOne to help with your requirements..."
/>
```

### Card Components
```tsx
// Message Card
<Card className="mb-4 border-border bg-card">
  <CardContent className="p-6">
    <div className="flex gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src="/avatar.png" />
        <AvatarFallback>AI</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-card-foreground">Message content...</p>
      </div>
    </div>
  </CardContent>
</Card>
```

## 🎨 UI Patterns

### Chat Interface Pattern
```tsx
// Main Chat Layout
<div className="flex h-screen bg-background">
  {/* Sidebar */}
  <aside className="w-80 border-r border-border bg-muted/30">
    <div className="p-4">
      <Button className="w-full justify-start gap-2">
        <Plus className="h-4 w-4" />
        New Chat
      </Button>
    </div>
    {/* Conversation List */}
  </aside>
  
  {/* Main Chat Area */}
  <main className="flex-1 flex flex-col">
    <header className="border-b border-border p-4">
      <h1 className="font-semibold">GenOne Assistant</h1>
    </header>
    
    <div className="flex-1 overflow-y-auto p-4">
      {/* Messages */}
    </div>
    
    <footer className="border-t border-border p-4">
      {/* Input Field */}
    </footer>
  </main>
</div>
```

### Agent Activity Timeline Pattern
```tsx
// Expandable Timeline Component
<Collapsible>
  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground">
    <ChevronDown className="h-4 w-4" />
    Agent Activity ({steps.length} events)
  </CollapsibleTrigger>
  <CollapsibleContent className="mt-2">
    <div className="space-y-2 border-l-2 border-border pl-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-primary mt-2" />
          <div>
            <p className="font-medium">{step.name}</p>
            <p className="text-muted-foreground">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  </CollapsibleContent>
</Collapsible>
```

## 📱 Responsive Design Guidelines

### Breakpoints
```css
/* Mobile First Approach */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Mobile Adaptations
- **Sidebar**: Collapses to overlay on mobile
- **Message Bubbles**: Full width with reduced padding
- **Input Field**: Sticky bottom positioning
- **Timeline**: Simplified view with fewer details

### Responsive Component Examples
```tsx
// Responsive Sidebar
<aside className="hidden lg:block w-80 border-r border-border">
  {/* Desktop Sidebar */}
</aside>

// Mobile Menu Button
<Button 
  variant="ghost" 
  size="icon"
  className="lg:hidden"
  onClick={() => setSidebarOpen(true)}
>
  <Menu className="h-6 w-6" />
</Button>

// Responsive Message Layout
<div className="max-w-none lg:max-w-3xl mx-auto px-4 lg:px-8">
  {/* Messages */}
</div>
```

## ♿ Accessibility Guidelines

### WCAG AA Compliance
- **Color Contrast**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Focus Indicators**: Visible focus rings on all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Proper ARIA labels and semantic HTML

### Implementation Standards
```tsx
// Accessible Button
<Button
  aria-label="Send message"
  aria-describedby="input-help-text"
>
  <Send className="h-4 w-4" />
  <span className="sr-only">Send message</span>
</Button>

// Accessible Form Input
<div>
  <Label htmlFor="message-input">Message</Label>
  <Input
    id="message-input"
    aria-describedby="message-help"
    placeholder="Type your message..."
  />
  <p id="message-help" className="text-sm text-muted-foreground">
    Press Enter to send, Shift+Enter for new line
  </p>
</div>

// Accessible Timeline
<div role="log" aria-live="polite" aria-label="Agent activity">
  {/* Timeline steps */}
</div>
```

## 🎭 Animation & Transitions

### Micro-Interactions
```css
/* Button Hover */
.transition-colors duration-200 ease-in-out

/* Card Hover */
.transition-shadow duration-300 ease-in-out

/* Sidebar Toggle */
.transition-transform duration-300 ease-in-out

/* Message Appear */
.animate-in slide-in-from-bottom-2 duration-300
```

### Loading States
```tsx
// Typing Indicator
<div className="flex gap-1">
  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
</div>

// Skeleton Loading
<div className="space-y-3">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>
```

## 💻 Code Style Guidelines

### TypeScript Standards
```typescript
// Component Props Interface
interface ChatMessageProps {
  message: {
    id: string
    content: string
    role: 'user' | 'assistant' | 'system'
    timestamp: Date
    agentSteps?: AgentStep[]
  }
  isLoading?: boolean
  onRetry?: () => void
}

// Component Definition
export function ChatMessage({ 
  message, 
  isLoading = false, 
  onRetry 
}: ChatMessageProps) {
  // Component implementation
}
```

### File Organization
```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── chat/         # Chat-specific components
│   ├── layout/       # Layout components
│   └── common/       # Shared components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── types/            # TypeScript type definitions
└── styles/           # Global styles
```

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatMessage`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useChat`)
- **Files**: kebab-case (e.g., `chat-message.tsx`)
- **CSS Classes**: Tailwind utility classes preferred

## 🧪 Component Testing Standards

### Testing Approach
```typescript
// Component Test Example
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatMessage } from './chat-message'

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    const mockMessage = {
      id: '1',
      content: 'Hello GenOne',
      role: 'user' as const,
      timestamp: new Date()
    }
    
    render(<ChatMessage message={mockMessage} />)
    
    expect(screen.getByText('Hello GenOne')).toBeInTheDocument()
  })
})
```

This style guide ensures consistent design and development practices across the GenOne project, maintaining the professional, accessible, and user-friendly interface that aligns with our ChatGPT-inspired design goals. 