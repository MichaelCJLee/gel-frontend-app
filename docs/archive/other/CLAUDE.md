# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GenOne is an AI-native orchestration assistant designed for non-technical enterprise users to generate structured requirement stories from internal documentation through a conversational interface. The project consists of a React frontend (genone-frontend) integrated with a FastAPI backend running LangGraph agents.

## Common Development Commands

### Frontend Development (genone-frontend/)

```bash
# Development
npm run dev                    # Start Vite dev server on port 5173
npm run build                  # TypeScript check + production build
npm run build:prod             # Production build with NODE_ENV=production
npm run preview                # Preview production build locally
npm run preview:prod           # Preview production build with production mode

# Code Quality
npm run lint                   # Run ESLint
npm run test                   # Run Vitest in watch mode
npm run test:run               # Run tests once (CI mode)
npm run test:ui                # Run tests with UI interface

# Deployment
npm run serve                  # Serve dist folder on port 3000
```

### Backend Integration

The frontend connects to a FastAPI Business Analyst Agent service. Key endpoints:
- `/api/v1/chat/stream` - Real-time streaming chat with SSE
- `/api/v1/sessions` - Session management
- `/api/v1/sessions/{id}/messages` - Message history persistence

## Architecture & Key Components

### Frontend Architecture

**State Management**
- React Context API for global state (Auth, Theme, Conversations)
- Zustand for complex state management (optional, installed)
- In-memory message caching with backend sync

**Authentication**
- Supabase Auth integration with JWT tokens
- AuthGuard component for route protection
- Automatic token refresh via useAuthErrorHandler hook

**Core Services**
- `langGraphService.ts` - Singleton for AI streaming via SSE
- `sessionService.ts` - Backend session and message management
- `supabase.ts` - Supabase client configuration

**Key Components**
- `LangGraphChatInterface` - Main chat UI with streaming support
- `ConversationSidebar` - Session selection and management
- `ActivityTimeline` - Visual display of AI agent operations
- `ErrorBoundary` - Global error handling

**Streaming Architecture**
- Server-Sent Events (SSE) for real-time AI responses
- Activity timeline tracking for agent operations
- Abort controllers for cancellable requests
- Session-based streaming with automatic reconnection

### Deployment Configuration

**Frontend Deployment**
- Static export served via Docker container
- Nginx configuration for routing
- Environment variables in .env.production
- Cloud Run deployment via deploy-frontend.sh

**Docker Setup**
```bash
# Build frontend container
docker build -f Dockerfile.frontend -t genone-frontend .

# Run with docker-compose
docker-compose -f docker-compose.frontend.yml up
```

### Important Patterns

**Message Handling**
- Messages stored in-memory during development
- Backend persistence via session API
- Optimistic updates for better UX
- Automatic cleanup after 30 minutes of inactivity

**Error Handling**
- Global ErrorBoundary component
- useAuthErrorHandler for auth errors
- Graceful degradation when backend unavailable
- Toast notifications via sonner

**TypeScript Patterns**
- Strict typing throughout the codebase
- Interface definitions in lib/types.ts
- Type-safe API integration
- Proper null/undefined handling

### Testing Approach

```bash
# Run all tests
npm run test:run

# Test specific components
npm run test -- ActivityTimeline

# Integration tests
node test-message-integration.js
node test-activity-timeline-fix.js
```

### Development Tips

1. **Environment Setup**: Copy `.env.example` to `.env.local` and configure Supabase credentials
2. **Backend Connection**: Ensure FastAPI backend is running on localhost:8000
3. **Hot Module Replacement**: Vite provides instant updates during development
4. **Component Development**: Use shadcn/ui components from the ui/ directory
5. **Streaming Debug**: Check console for SSE event details and connection status

### Common Issues & Solutions

1. **Streaming Timeout**: Check SESSION_WAKEUP_SOLUTION.md for idle session handling
2. **Auth Errors**: Verify Supabase configuration and JWT token validity
3. **CORS Issues**: Backend must allow frontend origin in CORS settings
4. **Build Errors**: Run `npm run build` to catch TypeScript errors early

### Key Files to Understand

- `src/App.tsx` - Main routing and provider setup
- `src/components/chat/LangGraphChatInterface.tsx` - Core chat implementation
- `src/hooks/useStreamingSession.ts` - Streaming state management
- `src/context/ConversationContext.tsx` - Conversation state and backend sync
- `vite.config.ts` - Build and proxy configuration