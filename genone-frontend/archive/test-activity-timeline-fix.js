// Test script to verify ActivityTimeline fix
// Run this in browser console after logging in and selecting a conversation with agent steps

console.log('🧪 Testing ActivityTimeline Fix...')

// Test 1: Check if historicalActivities are populated
function testHistoricalActivities() {
  console.log('📋 Test 1: Checking historicalActivities population...')
  
  const conversations = window.testConversationContext?.getConversations() || []
  console.log('Available conversations:', conversations.length)
  
  if (conversations.length === 0) {
    console.log('❌ No conversations found. Please create a conversation first.')
    return false
  }
  
  // Find a conversation with messages that have agent steps
  const convWithAgentSteps = conversations.find(conv => 
    conv.messages.some(msg => msg.agentSteps && msg.agentSteps.length > 0)
  )
  
  if (!convWithAgentSteps) {
    console.log('❌ No conversations with agent steps found.')
    return false
  }
  
  console.log('✅ Found conversation with agent steps:', convWithAgentSteps.title)
  
  // Check messages with agent steps
  const messagesWithSteps = convWithAgentSteps.messages.filter(msg => 
    msg.agentSteps && msg.agentSteps.length > 0
  )
  
  console.log(`📊 Messages with agent steps: ${messagesWithSteps.length}`)
  messagesWithSteps.forEach((msg, index) => {
    console.log(`  ${index + 1}. Message ID: ${msg.id}`)
    console.log(`     Agent steps: ${msg.agentSteps.length}`)
    console.log(`     Content preview: ${msg.content.substring(0, 100)}...`)
  })
  
  return true
}

// Test 2: Check if raw JSON is being filtered out
function testContentFiltering() {
  console.log('📋 Test 2: Checking content filtering...')
  
  const conversations = window.testConversationContext?.getConversations() || []
  const messagesWithRawJSON = []
  
  conversations.forEach(conv => {
    conv.messages.forEach(msg => {
      if (msg.content.includes('additional_kwargs') || 
          msg.content.includes('tool_calls') || 
          msg.content.includes('response_metadata')) {
        messagesWithRawJSON.push({
          conversationId: conv.id,
          messageId: msg.id,
          hasAgentSteps: !!(msg.agentSteps && msg.agentSteps.length > 0),
          contentPreview: msg.content.substring(0, 150)
        })
      }
    })
  })
  
  console.log(`📊 Messages with raw JSON content: ${messagesWithRawJSON.length}`)
  messagesWithRawJSON.forEach((msg, index) => {
    console.log(`  ${index + 1}. Message ID: ${msg.messageId}`)
    console.log(`     Has agent steps: ${msg.hasAgentSteps}`)
    console.log(`     Content: ${msg.contentPreview}...`)
  })
  
  return messagesWithRawJSON
}

// Test 3: Simulate conversation selection to trigger useEffect
async function testConversationSelection() {
  console.log('📋 Test 3: Testing conversation selection...')
  
  const conversations = window.testConversationContext?.getConversations() || []
  const convWithAgentSteps = conversations.find(conv => 
    conv.messages.some(msg => msg.agentSteps && msg.agentSteps.length > 0)
  )
  
  if (!convWithAgentSteps) {
    console.log('❌ No conversation with agent steps found for testing.')
    return false
  }
  
  console.log('🔄 Selecting conversation to trigger useEffect:', convWithAgentSteps.title)
  
  try {
    await window.testConversationContext.setCurrentConversation(convWithAgentSteps.id)
    console.log('✅ Conversation selected successfully')
    
    // Wait a bit for useEffect to run
    setTimeout(() => {
      console.log('📊 Check browser console for LangGraphChatInterface logs about historical activities conversion')
    }, 1000)
    
    return true
  } catch (error) {
    console.error('❌ Failed to select conversation:', error)
    return false
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running ActivityTimeline Fix Tests...')
  console.log('=' .repeat(50))
  
  const test1Result = testHistoricalActivities()
  console.log('')
  
  const test2Result = testContentFiltering()
  console.log('')
  
  if (test1Result) {
    await testConversationSelection()
  }
  
  console.log('')
  console.log('🎯 Test Summary:')
  console.log(`- Historical activities check: ${test1Result ? '✅' : '❌'}`)
  console.log(`- Content filtering check: ${test2Result.length > 0 ? '⚠️ Found raw JSON' : '✅ No raw JSON'}`)
  console.log('')
  console.log('💡 Next steps:')
  console.log('1. Check browser console for conversion logs')
  console.log('2. Verify ActivityTimeline appears for historical messages')
  console.log('3. Verify raw JSON is replaced with placeholder text')
}

// Export functions to window for manual testing
window.testActivityTimelineFix = {
  testHistoricalActivities,
  testContentFiltering,
  testConversationSelection,
  runAllTests
}

console.log('✅ Test functions loaded!')
console.log('Run: testActivityTimelineFix.runAllTests()')
