import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
          ui: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
          langgraph: ['@langchain/langgraph-sdk'],
        },
      },
    },
    // Optimize for production
    chunkSizeWarningLimit: 1000,
  },
  // Preview server configuration (for testing built files)
  preview: {
    port: 3000,
    host: true,
  },
})
