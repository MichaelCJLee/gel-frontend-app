# GenOne Technical Context

## 🖥️ Development Environment

**Platform**: macOS (darwin 24.5.0)  
**Shell**: /bin/zsh  
**Node.js**: Version 18+ required  
**Package Manager**: npm (preferred) or yarn  
**IDE**: VS Code with TypeScript and React extensions  

## 🏗️ Technology Stack

### Frontend Stack
- **Framework**: Vite + React 18
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.4+
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context + Custom Hooks
- **HTTP Client**: Fetch API with custom abstractions
- **Real-time**: Server-Sent Events (SSE)
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite (ES modules)

### Backend Integration
- **Primary API**: LangGraph FastAPI service
- **Database**: Supabase (PostgreSQL with real-time)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage (if needed)
- **Real-time**: Supabase Realtime + SSE from LangGraph
- **Agent Memory**: LangGraph API handles conversation persistence via `enable_memory: true`

## 🔧 Development Tools & Configuration

### Package.json Structure
```json
{
  "name": "genone-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.38.0",
    "@langchain/langgraph-sdk": "^0.0.19",
    "lucide-react": "^0.263.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^1.14.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.2",
    "vite": "^4.4.5",
    "vitest": "^0.34.0"
  }
}
```

### Vite Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'class-variance-authority'],
        },
      },
    },
  },
})
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 🌐 Environment Configuration

### Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LANGGRAPH_API_URL=http://localhost:8000
VITE_LANGGRAPH_API_KEY=your-api-key
VITE_APP_ENV=development
```

### Environment Types
```typescript
// src/types/env.d.ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_LANGGRAPH_API_URL: string
  readonly VITE_LANGGRAPH_API_KEY: string
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## 🗂️ Project Structure

```
genone-frontend/
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── chat/               # Chat-specific components
│   │   │   ├── chat-interface.tsx
│   │   │   ├── message-list.tsx
│   │   │   ├── chat-input.tsx
│   │   │   └── agent-timeline.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── main-layout.tsx
│   │   └── auth/               # Authentication components
│   │       ├── login-form.tsx
│   │       └── auth-guard.tsx
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useStreamingChat.ts
│   │   └── useSupabase.ts
│   ├── lib/                    # Utility functions
│   │   ├── supabase.ts
│   │   ├── langgraph.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── database.ts
│   │   └── api.ts
│   ├── providers/              # Context providers
│   │   ├── auth-provider.tsx
│   │   ├── chat-provider.tsx
│   │   └── theme-provider.tsx
│   ├── pages/                  # Page components
│   │   ├── chat.tsx
│   │   ├── login.tsx
│   │   └── dashboard.tsx
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── components.css
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/                      # Test files
│   ├── __mocks__/
│   ├── components/
│   └── utils/
├── .env.local
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🔗 API Integration Specifications

### LangGraph API Integration
```typescript
// LangGraph API Configuration
export const LANGGRAPH_CONFIG = {
  baseURL: import.meta.env.VITE_LANGGRAPH_API_URL,
  apiKey: import.meta.env.VITE_LANGGRAPH_API_KEY,
  endpoints: {
    chat: '/api/v1/chat',
    stream: '/api/v1/chat/stream',
    conversations: '/api/v1/conversations',
  },
  streamConfig: {
    mode: 'updates',
    includeMetadata: true,
    timeout: 30000,
  },
} as const
```

### Supabase Configuration
```typescript
// Supabase Configuration
export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
} as const
```

## 🛡️ Security Considerations

### Authentication Security
- **Token Storage**: Secure storage in httpOnly cookies (Supabase handles this)
- **CSRF Protection**: Built-in Supabase CSRF protection
- **Session Management**: Automatic token refresh
- **Route Protection**: Client-side route guards

### API Security
- **Authorization Headers**: Bearer token authentication
- **Input Validation**: Client-side validation with server-side verification
- **Rate Limiting**: Implemented at API gateway level
- **CORS Configuration**: Proper CORS headers for cross-origin requests

### Data Security
- **Row Level Security**: Supabase RLS policies
- **Data Encryption**: TLS in transit, encryption at rest
- **Audit Logging**: User activity tracking
- **Data Retention**: Configurable retention policies

## 🚀 Performance Requirements

### Core Performance Metrics
- **Initial Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Chat Response Time**: < 3 seconds (as per PRD)
- **Agent Timeline Updates**: Real-time (< 500ms delay)
- **Memory Usage**: < 100MB for typical session

### Optimization Strategies
- **Code Splitting**: Lazy loading of non-critical components
- **Bundle Optimization**: Tree shaking and minification
- **Image Optimization**: WebP format with fallbacks
- **Caching Strategy**: Service worker for static assets
- **Virtual Scrolling**: For large message lists

## 📊 Monitoring & Analytics

### Error Tracking
- **Error Boundaries**: React error boundaries for graceful failures
- **Logging**: Console logging with appropriate levels
- **Error Reporting**: Integration with error tracking service (future)

### Performance Monitoring
- **Web Vitals**: Core Web Vitals tracking
- **User Analytics**: Basic usage analytics (privacy-compliant)
- **Performance Metrics**: Load times and user interactions

## 🧪 Testing Strategy

### Testing Levels
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **E2E Tests**: Full user flow testing (future phase)

### Testing Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

## 🚀 Deployment Configuration

### Build Process
```bash
# Production build
npm run build

# Build output validation
npm run preview
```

### Static Asset Deployment
- **Build Output**: `dist/` directory
- **Asset Optimization**: Automatic optimization by Vite
- **CDN Ready**: Optimized for CDN deployment
- **Environment Variables**: Build-time environment variable injection

## 🔧 Development Workflow

### Local Development Setup
```bash
# Clone repository
git clone <repository-url>
cd genone-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Code Quality Tools
- **ESLint**: Code linting with TypeScript rules
- **Prettier**: Code formatting (configured in .eslintrc)
- **TypeScript**: Type checking
- **Git Hooks**: Pre-commit hooks for code quality

This technical context provides the foundation for consistent development practices and ensures all team members understand the technical constraints and requirements for the GenOne project. 