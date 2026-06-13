<template>
  <aside class="alert-panel">
    <div class="panel-header">
      <div class="panel-title">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        告警检查
        <span class="total-badge" :class="{ danger: dangerCount > 0 }">{{ alerts.length }}</span>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="summary">
      <div class="summary-item danger" v-if="dangerCount > 0">
        <span class="sum-dot"></span>
        <span class="sum-label">严重</span>
        <span class="sum-num">{{ dangerCount }}</span>
      </div>
      <div class="summary-item warning" v-if="warningCount > 0">
        <span class="sum-dot"></span>
        <span class="sum-label">警告</span>
        <span class="sum-num">{{ warningCount }}</span>
      </div>
      <div class="summary-item info" v-if="infoCount > 0">
        <span class="sum-dot"></span>
        <span class="sum-label">提示</span>
        <span class="sum-num">{{ infoCount }}</span>
      </div>
      <div v-if="alerts.length === 0" class="all-clear">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        检查通过，暂无异常
      </div>
    </div>

    <div class="alert-list">
      <div
        v-for="(alert, idx) in alerts"
        :key="idx"
        class="alert-item"
        :class="alert.level"
        @click="handleLocate(alert)"
      >
        <div class="alert-left">
          <div class="alert-icon">
            <svg v-if="alert.level === 'danger'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <svg v-else-if="alert.level === 'warning'" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          </div>
        </div>
        <div class="alert-body">
          <div class="alert-title">{{ alert.title }}</div>
          <div class="alert-message">{{ alert.message }}</div>
          <div class="alert-actions" v-if="alert.recordIds && alert.recordIds.length > 0">
            <span class="locate-btn">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              点击定位 {{ alert.recordIds.length }} 条记录
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <div class="check-list-title">检查项说明</div>
      <ul class="check-list">
        <li><span class="dot danger"></span>箱号重复</li>
        <li><span class="dot warning"></span>高风险箱过多（≥3）</li>
        <li><span class="dot warning"></span>责任人未填写</li>
        <li><span class="dot warning"></span>已到达但缺核对说明</li>
        <li><span class="dot info"></span>站点顺序断档</li>
      </ul>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  alerts: { type: Array, required: true }
})

const emit = defineEmits(['close', 'locate'])

const dangerCount = computed(() => props.alerts.filter(a => a.level === 'danger').length)
const warningCount = computed(() => props.alerts.filter(a => a.level === 'warning').length)
const infoCount = computed(() => props.alerts.filter(a => a.level === 'info').length)

function handleLocate(alert) {
  if (alert.recordIds && alert.recordIds.length > 0) {
    emit('locate', alert)
  }
}
</script>

<style scoped>
.alert-panel {
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

.panel-header {
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.panel-title {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-danger);
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 1px 9px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}
.total-badge.danger {
  background: var(--color-danger);
  color: #fff;
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

.summary {
  padding: 12px 16px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid #f9fafb;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  background: #fafafa;
}

.sum-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.summary-item.danger { color: var(--color-danger); background: var(--color-danger-light); }
.summary-item.danger .sum-dot { background: var(--color-danger); }
.summary-item.warning { color: var(--color-warning); background: var(--color-warning-light); }
.summary-item.warning .sum-dot { background: var(--color-warning); }
.summary-item.info { color: var(--color-info); background: var(--color-info-light); }
.summary-item.info .sum-dot { background: var(--color-info); }

.sum-label { font-weight: 600; }
.sum-num { font-weight: 800; font-size: 13px; }

.all-clear {
  color: var(--color-success);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 5px;
}

.alert-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px 10px;
}

.alert-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.alert-item.danger {
  background: #fef2f2;
  border-color: #fecaca;
}
.alert-item.warning {
  background: #fffbeb;
  border-color: #fde68a;
}
.alert-item.info {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.alert-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.alert-item.danger:hover { box-shadow: 0 2px 8px rgba(220, 38, 38, 0.1); }
.alert-item.warning:hover { box-shadow: 0 2px 8px rgba(217, 119, 6, 0.1); }
.alert-item.info:hover { box-shadow: 0 2px 8px rgba(8, 145, 178, 0.1); }

.alert-left {
  flex-shrink: 0;
  padding-top: 1px;
}

.alert-item.danger .alert-icon { color: var(--color-danger); }
.alert-item.warning .alert-icon { color: var(--color-warning); }
.alert-item.info .alert-icon { color: var(--color-info); }

.alert-body { flex: 1; min-width: 0; }

.alert-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 3px;
}
.alert-item.danger .alert-title { color: #991b1b; }
.alert-item.warning .alert-title { color: #92400e; }
.alert-item.info .alert-title { color: #155e75; }

.alert-message {
  font-size: 12px;
  color: #4b5563;
  line-height: 1.4;
}

.alert-actions {
  margin-top: 6px;
}

.locate-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 8px;
  border-radius: 4px;
}

.panel-footer {
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #f3f4f6;
  flex-shrink: 0;
}

.check-list-title {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
  letter-spacing: 0.3px;
}

.check-list {
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 10px;
}

.check-list li {
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot.danger { background: var(--color-danger); }
.dot.warning { background: var(--color-warning); }
.dot.info { background: var(--color-info); }
</style>
