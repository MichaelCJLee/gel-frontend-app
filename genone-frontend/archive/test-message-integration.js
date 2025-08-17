// Test script for message history integration
// Run this in browser console after logging in and the app has loaded

async function testMessageIntegration() {
  console.log('🧪 Testing Message History Integration...')
  
  // Check if we have access to the conversation context
  if (!window.testConversationContext) {
    console.error('❌ Conversation context not available. Make sure the app is loaded.')
    return
  }
  
  const context = window.testConversationContext
  
  try {
    // Test 1: Check if we have conversations loaded
    console.log('\n📋 Step 1: Checking loaded conversations...')
    const conversations = context.getConversations()
    console.log(`✅ Found ${conversations.length} conversations`)
    
    if (conversations.length === 0) {
      console.log('⚠️ No conversations found. Creating a test conversation...')
      const newConvId = await context.createConversation('Test Message History')
      console.log(`✅ Created test conversation: ${newConvId}`)
      
      // Add a test message
      const messageId = context.addMessage(newConvId, {
        role: 'user',
        content: 'Hello, this is a test message for message history integration.'
      })
      console.log(`✅ Added test message: ${messageId}`)
      
      // Refresh conversations
      const updatedConversations = context.getConversations()
      console.log(`✅ Updated conversations count: ${updatedConversations.length}`)
    }
    
    // Test 2: Test conversation switching and message loading
    console.log('\n🔄 Step 2: Testing conversation switching...')
    const testConversation = context.getConversations()[0]
    
    if (testConversation) {
      console.log(`📝 Switching to conversation: "${testConversation.title}" (${testConversation.id})`)
      
      // Record messages before switching
      const messagesBefore = testConversation.messages.length
      console.log(`📨 Messages before switch: ${messagesBefore}`)
      
      // Switch conversation (this should trigger message loading)
      await context.setCurrentConversation(testConversation.id)
      
      // Check messages after switching
      const updatedConversations = context.getConversations()
      const updatedConversation = updatedConversations.find(c => c.id === testConversation.id)
      const messagesAfter = updatedConversation ? updatedConversation.messages.length : 0
      
      console.log(`📨 Messages after switch: ${messagesAfter}`)
      
      if (messagesAfter > messagesBefore) {
        console.log('✅ Message loading successful! Messages were loaded from backend.')
      } else if (messagesAfter === messagesBefore && messagesBefore > 0) {
        console.log('✅ Messages were already loaded (cached).')
      } else {
        console.log('⚠️ No messages found. This might be a new conversation.')
      }
      
      // Display message details
      if (updatedConversation && updatedConversation.messages.length > 0) {
        console.log('\n📨 Message Details:')
        updatedConversation.messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`)
          console.log(`     🕒 ${msg.timestamp.toLocaleString()}`)
          if (msg.agentSteps && msg.agentSteps.length > 0) {
            console.log(`     🤖 Agent steps: ${msg.agentSteps.length}`)
          }
        })
      }
    }
    
    // Test 3: Test direct API call
    console.log('\n🔌 Step 3: Testing direct API call...')
    
    // Get session service from the app
    const sessionService = window.sessionService
    if (sessionService && testConversation) {
      try {
        const messagesResponse = await sessionService.getSessionMessages(testConversation.id)
        console.log('✅ Direct API call successful:', {
          sessionId: messagesResponse.session_id,
          threadId: messagesResponse.thread_id,
          totalMessages: messagesResponse.total_messages,
          messagesLength: messagesResponse.messages.length
        })
      } catch (error) {
        console.error('❌ Direct API call failed:', error.message)
      }
    }
    
    console.log('\n🎉 Message History Integration test completed!')
    
    return {
      success: true,
      conversationsCount: context.getConversations().length,
      currentConversation: context.getCurrentConversation()?.title || 'None'
    }
    
  } catch (error) {
    console.error('❌ Integration test failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('🚀 Message History Integration Test')
  console.log('⏳ Waiting 2 seconds for app to load...')
  
  setTimeout(() => {
    testMessageIntegration().then(result => {
      if (result.success) {
        console.log('✅ Integration test completed successfully')
        console.log('📊 Results:', result)
        window.integrationTestResult = result
      } else {
        console.error('❌ Integration test failed:', result.error)
      }
    })
  }, 2000)
} else {
  console.log('⚠️ Run this script in the browser console after the app loads')
}

// Export for manual testing
window.testMessageIntegration = testMessageIntegration
