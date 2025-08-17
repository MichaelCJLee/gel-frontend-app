import type { Conversation, Message } from './types'

// Storage keys
const STORAGE_KEYS = {
  CONVERSATIONS: 'genone_conversations',
  CURRENT_CONVERSATION: 'genone_current_conversation',
  USER_PREFERENCES: 'genone_user_preferences'
} as const

// Utility functions for localStorage
export const storage = {
  // Generic localStorage helpers
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue
      return JSON.parse(item, (_key, value) => {
        // Convert date strings back to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      })
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error)
      return defaultValue
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage key "${key}":`, error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  },

  clear: (): void => {
    try {
      // Only clear GenOne-specific keys
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Error clearing GenOne localStorage:', error)
    }
  }
}

// Conversation-specific storage functions
export const conversationStorage = {
  // Get all conversations
  getConversations: (): Conversation[] => {
    return storage.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, [])
  },

  // Save all conversations
  saveConversations: (conversations: Conversation[]): void => {
    storage.set(STORAGE_KEYS.CONVERSATIONS, conversations)
  },

  // Get current conversation ID
  getCurrentConversationId: (): string | null => {
    return storage.get<string | null>(STORAGE_KEYS.CURRENT_CONVERSATION, null)
  },

  // Save current conversation ID
  saveCurrentConversationId: (id: string | null): void => {
    storage.set(STORAGE_KEYS.CURRENT_CONVERSATION, id)
  },

  // Add a new conversation
  addConversation: (conversation: Conversation): void => {
    const conversations = conversationStorage.getConversations()
    conversations.unshift(conversation) // Add to beginning for recency
    conversationStorage.saveConversations(conversations)
  },

  // Update an existing conversation
  updateConversation: (id: string, updates: Partial<Conversation>): void => {
    const conversations = conversationStorage.getConversations()
    const index = conversations.findIndex(conv => conv.id === id)
    if (index !== -1) {
      conversations[index] = { ...conversations[index], ...updates, updatedAt: new Date() }
      conversationStorage.saveConversations(conversations)
    }
  },

  // Delete a conversation
  deleteConversation: (id: string): void => {
    const conversations = conversationStorage.getConversations()
    const filtered = conversations.filter(conv => conv.id !== id)
    conversationStorage.saveConversations(filtered)
  },

  // Add message to conversation
  addMessage: (conversationId: string, message: Message): void => {
    const conversations = conversationStorage.getConversations()
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      conversation.messages.push(message)
      conversation.updatedAt = new Date()
      conversationStorage.saveConversations(conversations)
    }
  },

  // Update message in conversation
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>): void => {
    const conversations = conversationStorage.getConversations()
    const conversation = conversations.find(conv => conv.id === conversationId)
    if (conversation) {
      const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        conversation.messages[messageIndex] = { ...conversation.messages[messageIndex], ...updates }
        conversation.updatedAt = new Date()
        conversationStorage.saveConversations(conversations)
      }
    }
  },

  // Export conversation as JSON
  exportConversation: (id: string): string => {
    const conversations = conversationStorage.getConversations()
    const conversation = conversations.find(conv => conv.id === id)
    if (!conversation) {
      throw new Error('Conversation not found')
    }
    return JSON.stringify(conversation, null, 2)
  },

  // Import conversation from JSON
  importConversation: (jsonData: string): Conversation => {
    try {
      const conversation = JSON.parse(jsonData, (_key, value) => {
        // Convert date strings back to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      })
      
      // Validate the conversation structure
      if (!conversation.id || !conversation.title || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation format')
      }
      
      // Generate new ID to avoid conflicts
      conversation.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      conversation.title = `[Imported] ${conversation.title}`
      
      conversationStorage.addConversation(conversation)
      return conversation
    } catch (error) {
      throw new Error(`Failed to import conversation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Generate unique IDs
export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
} 