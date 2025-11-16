<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <!-- Header with Logo and Collapse -->
    <div class="sidebar-header">
      <LogoText v-if="!isCollapsed" class="logo" />
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? 'Expand' : 'Collapse'">
        <svg v-if="!isCollapsed" class="icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v2H1V3a1 1 0 0 1 1-1h12zM1 13V6h4v8H2a1 1 0 0 1-1-1zm5 1V6h9v7a1 1 0 0 1-1 1H6z"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 4a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1zm2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm1 .5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v2H1V3a1 1 0 0 1 1-1h12zM1 13V6h4v8H2a1 1 0 0 1-1-1zm5 1V6h9v7a1 1 0 0 1-1 1H6z"/>
        </svg>
      </button>
    </div>

    <!-- Search Bar / Search Button -->
    <div v-if="!isCollapsed" class="search-container">
      <input
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
      <RouterLink
        v-for="session in filteredSessions"
        :key="session.id"
        :to="`/c/${session.id}`"
        class="session-item"
        :class="{ active: isCurrentSession(session.id) }"
        @click="chatStore.setCurrentSession(session.id)"
      >
        <span class="session-title">{{ session.title || 'Untitled' }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/store'
import { RouterLink } from 'vue-router'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import LogoText from '@/components/LogoText.vue'

const chatStore = useChatStore()
const router = useRouter()
const isCollapsed = ref(false)
const searchQuery = ref('')

const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) return chatStore.getAllSessions
  return chatStore.getAllSessions.filter((s) =>
    (s.title || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const createNewChat = () => {
  // Create empty session - user will type first message
  const sessionId = chatStore.generateSessionId()
  
  // Initialize session with empty messages array
  const newSession = {
    id: sessionId,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    title: undefined,
  }
  
  chatStore.sessions[sessionId] = newSession
  chatStore.currentSessionId = sessionId
  
  router.push(`/c/${sessionId}`)
}

const isCurrentSession = (sessionId: string) => chatStore.currentSessionId === sessionId
</script>

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
  gap: 4px;
}

.session-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: transparent;
  color: #374151;
  text-decoration: none;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.session-item:hover {
  background: #e5e7eb;
}

.session-item.active {
  background: #eff6ff;
  border-left-color: #2563eb;
  color: #2563eb;
  font-weight: 500;
}

.session-title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
}

.session-icon {
  font-size: 20px;
  flex-shrink: 0;
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
</style>
