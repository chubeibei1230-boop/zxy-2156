<template>
  <div class="handover-history">
    <div class="history-header">
      <div class="history-title">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        交接记录
        <span class="count-badge" v-if="records.length > 0">{{ records.length }}</span>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div v-if="records.length === 0" class="empty-state">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p class="empty-text">暂无交接记录</p>
      <p class="empty-hint">在站点列表中点击「交接」按钮生成交接单</p>
    </div>

    <div v-else class="record-list">
      <div v-for="record in sortedRecords" :key="record.id" class="record-card">
        <div class="record-main" @click="$emit('reopen', record)">
          <div class="record-top">
            <span class="record-site">{{ record.siteName }}</span>
            <span class="record-time">{{ formatTime(record.createdAt) }}</span>
          </div>
          <div class="record-meta">
            <span class="meta-item">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
              {{ record.totalBoxes }} 箱
            </span>
            <span class="meta-item arrived" v-if="record.arrivedCount > 0">{{ record.arrivedCount }} 已到</span>
            <span class="meta-item risk" v-if="record.highRiskCount > 0">{{ record.highRiskCount }} 高风险</span>
            <span class="meta-item supplement" v-if="record.supplementCount > 0">{{ record.supplementCount }} 需补</span>
          </div>
          <div class="record-people" v-if="record.handoverPerson || record.receiverPerson">
            <span v-if="record.handoverPerson" class="person-tag from">{{ record.handoverPerson }}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            <span v-if="record.receiverPerson" class="person-tag to">{{ record.receiverPerson }}</span>
          </div>
        </div>
        <div class="record-actions">
          <button class="action-btn" title="打开交接单" @click.stop="$emit('reopen', record)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </button>
          <button class="action-btn danger" title="删除记录" @click.stop="handleDelete(record)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: { type: Array, required: true }
})

const emit = defineEmits(['close', 'reopen', 'delete'])

const sortedRecords = computed(() => {
  return [...props.records].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
})

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleDelete(record) {
  if (confirm(`确认删除「${record.siteName}」的交接记录？`)) {
    emit('delete', record.id)
  }
}
</script>

<style scoped>
.handover-history {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 220px);
  position: sticky;
  top: 180px;
  overflow: hidden;
}

.history-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.history-title {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
}

.count-badge {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 1px 9px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.close-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.15s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
}

.empty-state svg {
  opacity: 0.4;
  margin-bottom: 10px;
}

.empty-text {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.empty-hint {
  font-size: 11px;
}

.record-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px 10px;
}

.record-card {
  display: flex;
  gap: 0;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  background: #fafafa;
}

.record-card:hover {
  background: #f0f7ff;
  border-color: #bfdbfe;
}

.record-main {
  flex: 1;
  min-width: 0;
}

.record-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.record-site {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.record-time {
  font-size: 11px;
  color: #9ca3af;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.record-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.meta-item {
  font-size: 11px;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.meta-item.arrived { color: var(--color-success); font-weight: 600; }
.meta-item.risk { color: var(--color-danger); font-weight: 600; }
.meta-item.supplement { color: var(--color-warning); font-weight: 600; }

.record-people {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.person-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

.person-tag.from {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.person-tag.to {
  background: var(--color-success-light);
  color: var(--color-success);
}

.record-people svg {
  color: #d1d5db;
}

.record-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;
  margin-left: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.action-btn.danger:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
</style>
