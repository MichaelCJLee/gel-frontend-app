/**
 * Manual Authentication Integration Test Utility
 * Use this in the browser console to test authentication integration
 */

import { supabase } from './supabase'
import { LangGraphService } from './langGraphService'
import { SessionService } from './sessionService'

// Create service instances
const langGraphService = new LangGraphService()
const sessionService = new SessionService()

/**
 * Test authentication status
 */
export async function testAuthStatus() {
  console.log('🔍 Testing authentication status...')
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth error:', error)
      return false
    }
    
    if (session) {
      console.log('✅ User is authenticated:', session.user.email)
      console.log('🔑 Token expires at:', new Date(session.expires_at! * 1000))
      return true
    } else {
      console.log('❌ No active session')
      return false
    }
  } catch (error) {
    console.error('❌ Auth test failed:', error)
    return false
  }
}

/**
 * Test backend connectivity
 */
export async function testBackendConnection() {
  console.log('🔍 Testing backend connection...')
  
  try {
    // Test basic health endpoint
    const healthResult = await langGraphService.testConnection()
    console.log('🏥 Health check:', healthResult ? '✅ OK' : '❌ Failed')
    
    // Test authenticated health endpoint
    const authHealthResult = await langGraphService.testAuthenticatedConnection()
    console.log('🔐 Authenticated health check:', authHealthResult ? '✅ OK' : '❌ Failed')
    
    return healthResult && authHealthResult
  } catch (error) {
    console.error('❌ Backend connection test failed:', error)
    return false
  }
}

/**
 * Test session service
 */
export async function testSessionService() {
  console.log('🔍 Testing session service...')
  
  try {
    // Test connection
    const connectionResult = await sessionService.testConnection()
    console.log('📡 Session service connection:', connectionResult ? '✅ OK' : '❌ Failed')
    
    if (connectionResult) {
      // Try to list sessions
      const sessions = await sessionService.listSessions(1, 5)
      console.log('📋 Current sessions:', sessions.sessions.length, 'sessions found')
      console.log('📊 Session stats:', {
        total: sessions.total,
        page: sessions.page,
        pageSize: sessions.page_size
      })
    }
    
    return connectionResult
  } catch (error) {
    console.error('❌ Session service test failed:', error)
    return false
  }
}

/**
 * Test creating a session
 */
export async function testCreateSession() {
  console.log('🔍 Testing session creation...')
  
  try {
    const session = await sessionService.createSession('Test Session from Browser')
    console.log('✅ Session created:', {
      id: session.id,
      title: session.title,
      threadId: session.thread_id,
      createdAt: session.created_at
    })
    
    return session
  } catch (error) {
    console.error('❌ Session creation failed:', error)
    return null
  }
}

/**
 * Test streaming with authentication
 */
export async function testAuthenticatedStreaming(sessionId?: string) {
  console.log('🔍 Testing authenticated streaming...')
  
  if (!sessionId) {
    console.log('📝 Creating test session first...')
    const session = await testCreateSession()
    if (!session) {
      console.error('❌ Cannot test streaming without a session')
      return false
    }
    sessionId = session.id
  }
  
  return new Promise<boolean>((resolve) => {
    let eventCount = 0
    let messageReceived = false
    
    const timeout = setTimeout(() => {
      console.log('⏰ Streaming test timed out')
      resolve(false)
    }, 30000) // 30 second timeout
    
    langGraphService.streamMessage('Hello, this is a test message', {
      sessionId,
      onEvent: (event) => {
        eventCount++
        console.log('📡 Event received:', event.title)
      },
      onMessage: (content) => {
        messageReceived = true
        console.log('💬 Message received:', content.substring(0, 100) + '...')
      },
      onError: (error) => {
        console.error('❌ Streaming error:', error)
        clearTimeout(timeout)
        resolve(false)
      }
    }).then(() => {
      console.log('✅ Streaming completed')
      console.log('📊 Events received:', eventCount)
      console.log('💬 Message received:', messageReceived)
      clearTimeout(timeout)
      resolve(eventCount > 0 || messageReceived)
    }).catch((error) => {
      console.error('❌ Streaming failed:', error)
      clearTimeout(timeout)
      resolve(false)
    })
  })
}

/**
 * Test message history API
 */
export async function testMessageHistory() {
  console.log('🔍 Testing message history API...')

  try {
    // First, get or create a session
    const sessions = await sessionService.listSessions(1, 5)
    let testSession = sessions.sessions[0]

    if (!testSession) {
      console.log('📝 Creating test session...')
      testSession = await sessionService.createSession('Message History Test Session')
    }

    console.log('🧵 Testing session:', testSession.id, testSession.title)

    // Test the message history endpoint
    const messageHistory = await sessionService.getSessionMessages(testSession.id)
    console.log('✅ Message history retrieved:', {
      sessionId: messageHistory.session_id,
      threadId: messageHistory.thread_id,
      totalMessages: messageHistory.total_messages,
      messagesCount: messageHistory.messages.length
    })

    if (messageHistory.messages.length > 0) {
      console.log('📨 Sample messages:')
      messageHistory.messages.slice(0, 3).forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 80)}...`)
        if (msg.agent_steps && msg.agent_steps.length > 0) {
          console.log(`     🤖 Agent steps: ${msg.agent_steps.length}`)
        }
      })
    } else {
      console.log('📭 No messages found in this session')
    }

    return messageHistory
  } catch (error) {
    console.error('❌ Message history test failed:', error)
    return null
  }
}

/**
 * Test conversation context integration
 */
export async function testConversationContext() {
  console.log('🔍 Testing conversation context integration...')

  try {
    // Check if conversation context is available
    if (typeof window !== 'undefined' && (window as any).testConversationContext) {
      const contextTest = (window as any).testConversationContext

      // Test creating a conversation
      console.log('📝 Testing conversation creation...')
      const conversationId = await contextTest.createConversation('Test Conversation')
      console.log('✅ Conversation created:', conversationId)

      // Test adding a message
      console.log('💬 Testing message addition...')
      const messageId = contextTest.addMessage(conversationId, {
        content: 'Test message',
        role: 'user'
      })
      console.log('✅ Message added:', messageId)

      // Test listing conversations
      console.log('📋 Testing conversation listing...')
      const conversations = contextTest.getConversations()
      console.log('✅ Conversations found:', conversations.length)

      return true
    } else {
      console.log('⚠️ Conversation context test functions not available')
      return false
    }
  } catch (error) {
    console.error('❌ Conversation context test failed:', error)
    return false
  }
}

/**
 * Run all tests including new session management
 */
export async function runAllTests() {
  console.log('🚀 Running all authentication and session integration tests...')
  console.log('=' .repeat(60))

  const results = {
    auth: await testAuthStatus(),
    backend: await testBackendConnection(),
    sessions: await testSessionService(),
    conversationContext: await testConversationContext(),
    streaming: false
  }

  if (results.auth && results.backend && results.sessions) {
    console.log('🔄 Testing streaming...')
    results.streaming = await testAuthenticatedStreaming()
  } else {
    console.log('⏭️ Skipping streaming test due to previous failures')
  }

  console.log('=' .repeat(60))
  console.log('📊 Test Results:')
  console.log('🔐 Authentication:', results.auth ? '✅ PASS' : '❌ FAIL')
  console.log('🏥 Backend Connection:', results.backend ? '✅ PASS' : '❌ FAIL')
  console.log('📡 Session Service:', results.sessions ? '✅ PASS' : '❌ FAIL')
  console.log('🗨️  Conversation Context:', results.conversationContext ? '✅ PASS' : '❌ FAIL')
  console.log('🔄 Streaming:', results.streaming ? '✅ PASS' : '❌ FAIL')

  const allPassed = Object.values(results).every(Boolean)
  console.log('🎯 Overall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED')

  if (allPassed) {
    console.log('🎉 Phase 2 Session Management Migration: COMPLETE!')
    console.log('✨ Backend session integration is working correctly')
  }

  return results
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testAuth = {
    testAuthStatus,
    testBackendConnection,
    testSessionService,
    testCreateSession,
    testAuthenticatedStreaming,
    testConversationContext,
    testMessageHistory,
    runAllTests
  }

  // Expose services for testing
  ;(window as any).sessionService = sessionService
  ;(window as any).supabase = supabase

  console.log('🧪 Authentication and session test utilities loaded!')
  console.log('Available functions:')
  console.log('- testAuth.testAuthStatus()')
  console.log('- testAuth.testBackendConnection()')
  console.log('- testAuth.testSessionService()')
  console.log('- testAuth.testCreateSession()')
  console.log('- testAuth.testAuthenticatedStreaming()')
  console.log('- testAuth.testConversationContext()')
  console.log('- testAuth.testMessageHistory()')
  console.log('- testAuth.runAllTests()')
}
