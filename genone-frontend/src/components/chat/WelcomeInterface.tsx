export function WelcomeInterface() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 min-h-[60vh]">
      <div className="w-full max-w-3xl space-y-6 text-center">
        {/* Welcome Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">What can I help with?</h1>
          <p className="text-muted-foreground text-lg">
            I'm GenOne — your AI assistant for enterprise knowledge retrieval and Product Development Lifecycle (PDLC) support.
          </p>
        </div>

        {/* Footer */}
        <div className="text-sm text-muted-foreground">
          GenOne can make mistakes. Check important info.
        </div>
      </div>
    </div>
  )
} 