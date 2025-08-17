import { Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { ConversationProvider } from './context/ConversationContext'
import { AuthProvider } from './components/auth/AuthProvider'
import { AuthGuard } from './components/auth/AuthGuard'
import { LangGraphChatInterface } from './components/chat/LangGraphChatInterface'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from 'sonner'
import './App.css'

// Stagewise toolbar for development (lazy loaded)
const StagewiseWrapper = import.meta.env.DEV ? lazy(async () => {
  try {
    const [{ StagewiseToolbar }, { ReactPlugin }] = await Promise.all([
      import('@stagewise/toolbar-react'),
      import('@stagewise-plugins/react')
    ])
    
    return {
      default: () => (
        <StagewiseToolbar 
          config={{
            plugins: [ReactPlugin]
          }}
        />
      )
    }
  } catch (error) {
    console.warn('Stagewise toolbar failed to load:', error)
    return { default: () => <></> }
  }
}) : null

// Load test utilities in development
if (import.meta.env.DEV) {
  import('./lib/test-auth-integration')
}

/**
 * Main GenOne application with admin-provisioned authentication
 * Provides authentication, theming, and conversation context
 */
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuthGuard>
            <ConversationProvider>
              <div className="h-screen w-full bg-background text-foreground">
                <Routes>
                  <Route path="/*" element={<LangGraphChatInterface />} />
                </Routes>
              </div>
              <Toaster
                position="top-right"
                richColors
                closeButton
                theme="system"
              />
              {StagewiseWrapper && (
                <Suspense fallback={null}>
                  <StagewiseWrapper />
                </Suspense>
              )}
            </ConversationProvider>
          </AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
