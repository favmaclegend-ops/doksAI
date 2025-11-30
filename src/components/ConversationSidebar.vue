<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { useRouter, useRoute } from 'vue-router'
import { useChatStore } from '@/store'
import LogoText from '@/components/LogoText.vue'
import {
  ChatBubbleLeftIcon,
  TrashIcon,
  ArchiveBoxIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route = useRoute()
const chatStore = useChatStore()

const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const isCollapsed = ref(false)

// Debounce search update
const updateSearch = useDebounceFn((value: string) => {
  debouncedSearchQuery.value = value
}, 300)

watch(searchQuery, (newValue) => {
  updateSearch(newValue)
})

// Load sidebar state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem('sidebar_collapsed')
  if (savedState) {
    isCollapsed.value = JSON.parse(savedState)
  }
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})

const handleGlobalKeydown = (e: KeyboardEvent) => {
  // Ctrl+K or Cmd+K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    if (isCollapsed.value) {
      isCollapsed.value = false
    }
    searchInput.value?.focus()
  }

  // Ctrl+N or Cmd+N for new chat
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault()
    createNewChat()
  }
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed.value))
}

const filteredSessions = computed(() => {
  const sessions = chatStore.getAllSessions
  if (!debouncedSearchQuery.value) return sessions

  const query = debouncedSearchQuery.value.toLowerCase()
  return sessions.filter(
    (session) =>
      (session.title || 'New Chat').toLowerCase().includes(query) ||
      session.messages.some((msg) => msg.content.toLowerCase().includes(query)),
  )
})

const createNewChat = () => {
  const sessionId = chatStore.createSession()
  router.push(`/c/${sessionId}`)
  // On mobile, we might want to close the sidebar here if it was an overlay
}

const selectSession = (sessionId: string) => {
  router.push(`/c/${sessionId}`)
  if (window.innerWidth < 640) {
    isCollapsed.value = true
  }
}

const deleteSession = (sessionId: string, event: Event) => {
  event.stopPropagation() // Prevent navigation
  if (confirm('Are you sure you want to delete this conversation?')) {
    chatStore.deleteSession(sessionId)
    if (route.params.id === sessionId) {
      router.push('/')
    }
  }
}

const archiveSession = (sessionId: string, event: Event) => {
  event.stopPropagation() // Prevent navigation
  chatStore.archiveSession(sessionId)
  if (route.params.id === sessionId) {
    router.push('/')
  }
}

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return 'Today'
  } else if (days === 1) {
    return 'Yesterday'
  } else if (days < 7) {
    return `${days} days ago`
  } else {
    return new Date(date).toLocaleDateString()
  }
}

// Group sessions by time
const groupedSessions = computed(() => {
  const groups: Record<string, typeof filteredSessions.value> = {}

  filteredSessions.value.forEach((session) => {
    const timeLabel = formatTime(session.updatedAt)
    if (!groups[timeLabel]) {
      groups[timeLabel] = []
    }
    groups[timeLabel].push(session)
  })

  return groups
})
</script>

<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Header with Logo and Collapse -->
    <div class="sidebar-header">
      <LogoText v-if="!isCollapsed" class="logo" />
      <button class="collapse-btn" @click="toggleSidebar" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <svg v-if="!isCollapsed" class="icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v2H1V3a1 1 0 0 1 1-1h12zM1 13V6h4v8H2a1 1 0 0 1-1-1zm5 1V6h9v7a1 1 0 0 1-1 1H6z"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>

    <!-- Search Bar / Search Button -->
    <div v-if="!isCollapsed" class="search-container">
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        placeholder="Search chats..."
        class="search-input"
      />
    </div>
    <button v-else class="icon-btn" title="Search chats">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </button>

    <!-- New Chat Button / New Chat Icon -->
    <button @click="createNewChat" class="new-chat-btn" v-if="!isCollapsed">
      + New Chat
    </button>
    <button @click="createNewChat" class="icon-btn" v-else title="New chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <line x1="12" y1="7" x2="12" y2="13"></line>
        <line x1="9" y1="10" x2="15" y2="10"></line>
      </svg>
    </button>

    <!-- Chat Sessions -->
    <div v-if="!isCollapsed" class="sessions-list">
      <template v-for="(sessions, label) in groupedSessions" :key="label">
        <div class="session-group-header">{{ label }}</div>
        <div class="space-y-1">
          <div
            v-for="session in sessions"
            :key="session.id"
            @click="selectSession(session.id)"
            class="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors relative"
            :class="{
              'bg-white shadow-sm ring-1 ring-gray-200': route.params.id === session.id,
              'hover:bg-gray-100': route.params.id !== session.id,
            }"
          >
            <ChatBubbleLeftIcon class="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-700 font-medium truncate">
                {{ session.title || 'New Chat' }}
              </p>
              <p class="text-xs text-gray-400 truncate">
                {{ session.messages[session.messages.length - 1]?.content || 'No messages' }}
              </p>
            </div>

            <!-- Hover Actions -->
            <div
              class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                @click="archiveSession(session.id, $event)"
                class="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                title="Archive"
              >
                <ArchiveBoxIcon class="w-4 h-4" />
              </button>
              <button
                @click="deleteSession(session.id, $event)"
                class="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </template>

      <div v-if="filteredSessions.length === 0" class="text-center py-8">
        <p class="text-sm text-gray-500">No conversations found</p>
      </div>
    </div>

    <!-- Collapsed view - icon buttons -->
    <div v-else class="collapsed-sessions">
      <button
        v-for="session in filteredSessions"
        :key="session.id"
        @click="selectSession(session.id)"
        class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors relative"
        :class="{
          'bg-blue-50 text-blue-600': route.params.id === session.id,
          'text-gray-600': route.params.id !== session.id,
        }"
        :title="session.title"
      >
        <ChatBubbleLeftIcon class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 260px;
  background: #f5f5f5;
  color: #1f2937;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid #e0e0e0;
}

.sidebar.collapsed {
  width: 70px;
  padding: 12px 8px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 8px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.logo {
  font-size: 0.875rem !important;
  white-space: nowrap;
  flex: 1;
}

.collapse-btn {
  background: white;
  border: 1px solid #d1d5db;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;
  transition: all 0.2s;
}

.collapse-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.search-container {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-input::placeholder {
  color: #9ca3af;
}

.new-chat-btn {
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  color: #1f2937;
  text-decoration: none;
  text-align: center;
  margin-bottom: 12px;
  transition: all 0.2s;
  cursor: pointer;
  display: block;
  font-weight: 500;
  font-size: 0.875rem;
}

.new-chat-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.icon-btn {
  width: 100%;
  height: 40px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-decoration: none;
  margin-bottom: 8px;
}

.icon-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #374151;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-group-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px 4px;
  margin-top: 8px;
}

.collapsed-sessions {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

/* Scrollbar styling */
.sessions-list::-webkit-scrollbar {
  width: 6px;
}

.sessions-list::-webkit-scrollbar-track {
  background: transparent;
}

.sessions-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.sessions-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.collapsed-sessions::-webkit-scrollbar {
  width: 6px;
}

.collapsed-sessions::-webkit-scrollbar-track {
  background: transparent;
}

.collapsed-sessions::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.collapsed-sessions::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
