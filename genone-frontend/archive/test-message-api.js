// Test script for message history API
// Run this in browser console after logging in

async function testMessageAPI() {
  console.log('🧪 Testing Message History API...')
  
  // Get current session from Supabase
  const { data: { session }, error } = await window.supabase.auth.getSession()
  
  if (error || !session) {
    console.error('❌ Not authenticated:', error)
    return
  }
  
  console.log('✅ Authenticated as:', session.user.email)
  console.log('🔑 Token expires at:', new Date(session.expires_at * 1000))
  
  const token = session.access_token
  const apiBase = 'http://localhost:8000/api/v1'
  
  try {
    // Test 1: List sessions
    console.log('\n📋 Testing session list...')
    const sessionsResponse = await fetch(`${apiBase}/sessions/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!sessionsResponse.ok) {
      throw new Error(`Sessions API failed: ${sessionsResponse.status}`)
    }
    
    const sessionsData = await sessionsResponse.json()
    console.log('✅ Sessions loaded:', sessionsData.sessions.length)
    
    if (sessionsData.sessions.length === 0) {
      console.log('⚠️ No sessions found. Creating a test session...')
      
      // Create a test session
      const createResponse = await fetch(`${apiBase}/sessions/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Test Message History Session',
          metadata: { test: true }
        })
      })
      
      if (!createResponse.ok) {
        throw new Error(`Session creation failed: ${createResponse.status}`)
      }
      
      const newSession = await createResponse.json()
      console.log('✅ Test session created:', newSession.id)
      sessionsData.sessions = [newSession]
    }
    
    // Test 2: Get messages for first session
    const testSession = sessionsData.sessions[0]
    console.log(`\n💬 Testing message history for session: ${testSession.id}`)
    console.log(`📝 Session title: "${testSession.title}"`)
    console.log(`🧵 Thread ID: ${testSession.thread_id}`)
    
    const messagesResponse = await fetch(`${apiBase}/sessions/${testSession.id}/messages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      throw new Error(`Messages API failed: ${messagesResponse.status} - ${errorText}`)
    }
    
    const messagesData = await messagesResponse.json()
    console.log('✅ Messages API response:', {
      sessionId: messagesData.session_id,
      threadId: messagesData.thread_id,
      totalMessages: messagesData.total_messages,
      messagesLength: messagesData.messages.length,
      lastUpdated: messagesData.last_updated
    })
    
    // Display message details
    if (messagesData.messages.length > 0) {
      console.log('\n📨 Message Details:')
      messagesData.messages.forEach((msg, index) => {
        console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
        if (msg.agent_steps && msg.agent_steps.length > 0) {
          console.log(`     🤖 Agent steps: ${msg.agent_steps.length}`)
          msg.agent_steps.forEach((step, stepIndex) => {
            console.log(`       ${stepIndex + 1}. ${step.type}: ${step.title}`)
          })
        }
      })
    } else {
      console.log('📭 No messages found in this session')
    }
    
    console.log('\n🎉 Message History API test completed successfully!')
    
    return {
      session: testSession,
      messages: messagesData,
      success: true
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return {
      error: error.message,
      success: false
    }
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined' && window.supabase) {
  console.log('🚀 Running message API test...')
  testMessageAPI().then(result => {
    if (result.success) {
      console.log('✅ Test completed successfully')
      window.testResult = result
    } else {
      console.error('❌ Test failed:', result.error)
    }
  })
} else {
  console.log('⚠️ Run this script in the browser console after logging in')
}
