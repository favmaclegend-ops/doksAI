import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Message, ChatSession } from './types'
import { v4 as uuidv4 } from 'uuid'
import { ragAPI, type QueryRequest } from '@/services/api'
import config from '@/config'

export const useChatStore = defineStore('chat', () => {
  // Load sessions from localStorage if available
  const savedSessions = localStorage.getItem('chat_sessions')
  const initialSessions = savedSessions
    ? JSON.parse(savedSessions, (key, value) => {
        // Revive dates
        if (key === 'createdAt' || key === 'updatedAt' || key === 'timestamp') {
          return new Date(value)
        }
        return value
      })
    : {}

  const sessions = ref<Record<string, ChatSession>>(initialSessions)
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)

  // Persist sessions to localStorage whenever they change
  watch(
    sessions,
    (newSessions) => {
      localStorage.setItem('chat_sessions', JSON.stringify(newSessions))
    },
    { deep: true },
  )

  const currentSession = computed(() => {
    return currentSessionId.value ? sessions.value[currentSessionId.value] : null
  })

  const messages = computed(() => {
    return currentSession.value?.messages || []
  })

  const generateSessionId = (): string => {
    return uuidv4()
  }

  const createSession = (initialMessage?: string): string => {
    const sessionId = generateSessionId()
    const newSession: ChatSession = {
      id: sessionId,
      title: initialMessage
        ? initialMessage.length > 50
          ? initialMessage.substring(0, 50) + '...'
          : initialMessage
        : 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false,
    }

    if (initialMessage) {
      newSession.messages.push({
        id: 0,
        content: initialMessage,
        isUser: true,
        timestamp: new Date(),
      })
    }

    sessions.value[sessionId] = newSession
    currentSessionId.value = sessionId
    return sessionId
  }

  const setCurrentSession = (sessionId: string) => {
    if (sessions.value[sessionId]) {
      currentSessionId.value = sessionId
    }
  }

  const addMessage = (sessionId: string, message: Omit<Message, 'id'>) => {
    const session = sessions.value[sessionId]
    if (!session) return

    const newMessage: Message = {
      ...message,
      id: session.messages.length,
    }

    session.messages.push(newMessage)
    session.updatedAt = new Date()
  }

  const updateMessage = (sessionId: string, messageId: number, updates: Partial<Message>) => {
    const session = sessions.value[sessionId]
    if (!session) return

    const messageIndex = session.messages.findIndex((m: Message) => m.id === messageId)
    if (messageIndex !== -1 && session.messages[messageIndex]) {
      Object.assign(session.messages[messageIndex], updates)
      session.updatedAt = new Date()
    }
  }

  const deleteSession = (sessionId: string) => {
    if (sessions.value[sessionId]) {
      delete sessions.value[sessionId]
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
      }
    }
  }

  const archiveSession = (sessionId: string) => {
    if (sessions.value[sessionId]) {
      sessions.value[sessionId].isArchived = true
      sessions.value[sessionId].updatedAt = new Date()
    }
  }

  const updateSessionTitle = (sessionId: string, title: string) => {
    if (sessions.value[sessionId]) {
      sessions.value[sessionId].title = title
      sessions.value[sessionId].updatedAt = new Date()
    }
  }

  // clearSession is essentially deleteSession, keeping it for backward compatibility or refactoring it to use deleteSession
  const clearSession = (sessionId: string) => {
    deleteSession(sessionId)
  }

  const getAllSessions = computed(() => {
    return Object.values(sessions.value)
      .filter((session) => !session.isArchived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  })

  const queryRAG = async (sessionId: string, question: string, docId?: string): Promise<void> => {
    const session = sessions.value[sessionId]
    if (!session) return

    isLoading.value = true

    try {
      // Add user message
      addMessage(sessionId, {
        content: question,
        isUser: true,
        timestamp: new Date(),
      })

      // Add initial AI message with streaming state
      const aiMessageId = session.messages.length
      addMessage(sessionId, {
        content: '',
        isUser: false,
        timestamp: new Date(),
        isStreaming: true,
      })

      // Prepare query request
      const queryRequest: QueryRequest = {
        question,
        top_k: config.DEFAULT_TOP_K,
        min_score: config.DEFAULT_MIN_SCORE,
      }

      if (docId) {
        queryRequest.doc_id = docId
      }

      // Query the RAG API
      const response = await ragAPI.queryDocuments(queryRequest)

      if (response.success && response.answer) {
        // Stream the response
        await streamResponse(sessionId, aiMessageId, response.answer.text, {
          sources: response.answer.sources,
          confidence: response.answer.confidence,
        })
      } else {
        // Handle error case
        updateMessage(sessionId, aiMessageId, {
          content: `I apologize, but I encountered an error: ${response.error || 'Unable to process your question'}`,
          isStreaming: false,
        })
      }
    } catch (error) {
      console.error('RAG query error:', error)
      // Find the AI message and update it with error
      const aiMessageId = session.messages.length - 1
      updateMessage(sessionId, aiMessageId, {
        content: `I apologize, but I encountered an error while processing your question: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        isStreaming: false,
      })
    } finally {
      isLoading.value = false
    }
  }

  const streamResponse = async (
    sessionId: string,
    messageId: number,
    text: string,
    metadata: { sources?: Message['sources']; confidence?: number } = {},
    delay: number = 30,
  ): Promise<void> => {
    const session = sessions.value[sessionId]
    if (!session) return

    // Stream the text word by word to avoid breaking markdown syntax
    const words = text.split(' ')
    let currentText = ''

    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i]

      updateMessage(sessionId, messageId, {
        content: currentText,
        sources: metadata.sources,
        confidence: metadata.confidence,
      })

      // Small delay to simulate streaming
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    // Mark as finished streaming
    updateMessage(sessionId, messageId, {
      content: text,
      isStreaming: false,
      sources: metadata.sources,
      confidence: metadata.confidence,
    })
  }

  return {
    sessions,
    currentSessionId,
    isLoading,
    currentSession,
    messages,
    getAllSessions,
    generateSessionId,
    createSession,
    setCurrentSession,
    addMessage,
    updateMessage,
    clearSession,
    deleteSession,
    archiveSession,
    updateSessionTitle,
    queryRAG,
    streamResponse,
  }
})
