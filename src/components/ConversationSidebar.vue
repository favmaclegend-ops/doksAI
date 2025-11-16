<template>
  <div class="sidebar">
    <div class="sessions-list">
      <div
        v-for="session in chatStore.getAllSessions"
        :key="session.id"
        class="session-item"
        @click="chatStore.setCurrentSession(session.id)"
      >
        <div class="session-title">{{ session.title || 'Untitled' }}</div>
        <div class="session-preview">{{ getPreview(session) }}</div>
        <div class="session-time">{{ formatTime(session.updatedAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/store'
import type { ChatSession } from '@/store/types'

const chatStore = useChatStore()

// Get first 50 chars of first message
const getPreview = (session: ChatSession) => {
  const firstMessage = session.messages[0]?.content || ''
  return firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '')
}

// Format relative time
const formatTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  overflow: hidden;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.session-item {
  padding: 12px 16px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background-color: #efefef;
  }

  &:active {
    background-color: #e0e0e0;
  }
}

.session-item.active {
  border-left-color: #2563eb;
  background-color: #eff6ff;
}

.session-title {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-preview {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-time {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>
