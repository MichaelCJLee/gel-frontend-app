/**
 * Test utilities for conversation context
 * Exposes conversation context functions for browser console testing
 */

// This will be set by the ConversationProvider when in development mode
let conversationContextRef: any = null

/**
 * Set the conversation context reference for testing
 */
export const setConversationContextRef = (context: any) => {
  conversationContextRef = context
}

/**
 * Test conversation creation
 */
export const testCreateConversation = async (title?: string) => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }
  
  return await conversationContextRef.createConversation(title)
}

/**
 * Test adding a message
 */
export const testAddMessage = (conversationId: string, message: any) => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }
  
  return conversationContextRef.addMessage(conversationId, message)
}

/**
 * Get all conversations
 */
export const testGetConversations = () => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }
  
  return conversationContextRef.conversations
}

/**
 * Get current conversation
 */
export const testGetCurrentConversation = () => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }
  
  return conversationContextRef.currentConversation
}

/**
 * Test deleting a conversation
 */
export const testDeleteConversation = async (conversationId: string) => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }
  
  return await conversationContextRef.deleteConversation(conversationId)
}

/**
 * Test renaming a conversation
 */
export const testRenameConversation = async (conversationId: string, title: string) => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }

  return await conversationContextRef.renameConversation(conversationId, title)
}

/**
 * Test setting current conversation
 */
export const testSetCurrentConversation = async (conversationId: string) => {
  if (!conversationContextRef) {
    throw new Error('Conversation context not available')
  }

  return await conversationContextRef.setCurrentConversation(conversationId)
}

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testConversationContext = {
    createConversation: testCreateConversation,
    addMessage: testAddMessage,
    getConversations: testGetConversations,
    getCurrentConversation: testGetCurrentConversation,
    deleteConversation: testDeleteConversation,
    renameConversation: testRenameConversation,
    setCurrentConversation: testSetCurrentConversation
  }
}
