<template>
  <div class="anomaly-list">
    <div class="list-header">
      <div class="header-left">
        <button class="back-btn" @click="$emit('back')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <h2>异常处理清单</h2>
          <p class="header-sub">跟踪管理所有异常项的处理进度</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary btn-sm" @click="handleRefresh">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          刷新
        </button>
        <button class="btn btn-primary btn-sm" @click="handleCreateManual">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          手动创建
        </button>
      </div>
    </div>

    <div class="stats-bar">
      <div class="stat-item" :class="{ active: !filters.status }" @click="clearStatusFilter">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">全部</span>
      </div>
      <div class="stat-item pending" :class="{ active: filters.status === 'pending' }" @click="setStatusFilter('pending')">
        <span class="stat-value">{{ stats.pending }}</span>
        <span class="stat-label">待处理</span>
      </div>
      <div class="stat-item processing" :class="{ active: filters.status === 'processing' }" @click="setStatusFilter('processing')">
        <span class="stat-value">{{ stats.processing }}</span>
        <span class="stat-label">处理中</span>
      </div>
      <div class="stat-item resolved" :class="{ active: filters.status === 'resolved' }" @click="setStatusFilter('resolved')">
        <span class="stat-value">{{ stats.resolved }}</span>
        <span class="stat-label">已解决</span>
      </div>
      <div class="stat-item ignored" :class="{ active: filters.status === 'ignored' }" @click="setStatusFilter('ignored')">
        <span class="stat-value">{{ stats.ignored }}</span>
        <span class="stat-label">无需处理</span>
      </div>
      <div class="stat-item closed-rate" :class="{ active: filters.status === '' && false }">
        <span class="stat-value">{{ closedLoopRate }}%</span>
        <span class="stat-label">闭环率</span>
      </div>
      <div class="stat-item-divider"></div>
      <div class="stat-item danger">
        <span class="stat-value">{{ stats.danger }}</span>
        <span class="stat-label">严重</span>
      </div>
      <div class="stat-item warning">
        <span class="stat-value">{{ stats.warning }}</span>
        <span class="stat-label">警告</span>
      </div>
      <div class="stat-item info">
        <span class="stat-value">{{ stats.info }}</span>
        <span class="stat-label">提示</span>
      </div>
    </div>

    <div class="closed-loop-bar" v-if="stats.total > 0">
      <div class="clb-track">
        <div class="clb-fill" :style="{ width: closedLoopRate + '%' }" :class="{ high: closedLoopRate >= 80, medium: closedLoopRate >= 50 && closedLoopRate < 80, low: closedLoopRate < 50 }"></div>
      </div>
      <div class="clb-labels">
        <span class="clb-label open" v-if="stats.open > 0">{{ stats.open }} 项待闭环</span>
        <span class="clb-label closed" v-if="stats.closed > 0">{{ stats.closed }} 项已闭环</span>
        <span class="clb-label all-closed" v-if="stats.open === 0 && stats.closed > 0">全部已闭环 ✓</span>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <select v-model="filters.siteName" class="filter-select">
          <option value="">全部站点</option>
          <option v-for="site in siteList" :key="site" :value="site">{{ site }}</option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.responsible" class="filter-select">
          <option value="">全部责任人</option>
          <option v-for="person in responsibleList" :key="person" :value="person">{{ person }}</option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.handler" class="filter-select">
          <option value="">全部处理人</option>
          <option v-for="handler in handlerList" :key="handler" :value="handler">{{ handler }}</option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.type" class="filter-select">
          <option value="">全部异常类型</option>
          <option v-for="type in typeOptions" :key="type.value" :value="type.value">{{ type.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.source" class="filter-select">
          <option value="">全部来源</option>
          <option v-for="src in sourceOptions" :key="src.value" :value="src.value">{{ src.label }}</option>
        </select>
      </div>
      <div class="filter-group">
        <select v-model="filters.level" class="filter-select">
          <option value="">全部级别</option>
          <option value="danger">严重</option>
          <option value="warning">警告</option>
          <option value="info">提示</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-text" @click="clearFilters">
          重置
        </button>
      </div>
    </div>

    <div v-if="filteredAnomalies.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <p class="empty-title">暂无符合条件的异常项</p>
      <p class="empty-sub">调整筛选条件或创建新的异常项</p>
    </div>

    <div v-else class="anomaly-table-wrap">
      <table class="anomaly-table">
        <thead>
          <tr>
            <th class="th-level">级别</th>
            <th class="th-type">类型</th>
            <th class="th-box">关联箱体</th>
            <th class="th-site">站点</th>
            <th class="th-responsible">责任人</th>
            <th class="th-handler">处理人</th>
            <th class="th-status">状态</th>
            <th class="th-source">来源</th>
            <th class="th-plan">计划完成</th>
            <th class="th-time">创建时间</th>
            <th class="th-actions">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="anomaly in sortedAnomalies"
            :key="anomaly.id"
            class="anomaly-row"
            :class="[anomaly.level, { closed: isClosed(anomaly) }]"
            @click="handleView(anomaly)"
          >
            <td class="td-level">
              <span class="level-badge" :class="anomaly.level">
                {{ getLevelLabel(anomaly.level) }}
              </span>
            </td>
            <td class="td-type">
              <span class="type-tag" :class="getTypeClass(anomaly.type)">
                {{ getTypeLabel(anomaly.type) }}
              </span>
            </td>
            <td class="td-box">
              <span class="box-no">{{ anomaly.boxNumber || '—' }}</span>
            </td>
            <td class="td-site">{{ anomaly.siteName || '—' }}</td>
            <td class="td-responsible">{{ anomaly.responsible || '—' }}</td>
            <td class="td-handler">
              <span v-if="anomaly.handler" class="handler-tag">{{ anomaly.handler }}</span>
              <span v-else class="empty-text">未指派</span>
            </td>
            <td class="td-status">
              <span class="status-tag" :class="getStatusClass(anomaly.status)">
                {{ getStatusLabel(anomaly.status) }}
              </span>
            </td>
            <td class="td-source">{{ getSourceLabel(anomaly.source) }}</td>
            <td class="td-plan">
              <span v-if="anomaly.planDate" :class="{ overdue: isOverdue(anomaly) }">
                {{ formatPlanDate(anomaly.planDate) }}
              </span>
              <span v-else class="empty-text">未设置</span>
            </td>
            <td class="td-time">{{ formatTime(anomaly.createdAt) }}</td>
            <td class="td-actions" @click.stop>
              <button v-if="!isClosed(anomaly)" class="action-btn edit" title="处理" @click="handleEdit(anomaly)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn view" title="查看详情" @click="handleView(anomaly)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AnomalyFormModal
      v-if="formVisible"
      :mode="formMode"
      :anomaly-data="formAnomalyData"
      :is-read-only="formReadOnly"
      @save="handleFormSave"
      @close="formVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ANOMALY_TYPE_OPTIONS,
  ANOMALY_STATUS_OPTIONS,
  ANOMALY_SOURCE_OPTIONS
} from '../lib/constants.js'
import { filterAnomalies, getAnomalyStats, isAnomalyClosed } from '../lib/anomalies.js'
import { AnomalyDB } from '../lib/db.js'
import AnomalyFormModal from './AnomalyFormModal.vue'

const props = defineProps({
  anomalies: { type: Array, required: true },
  boxes: { type: Array, default: () => [] }
})

const emit = defineEmits(['back', 'refresh', 'update', 'locate-box'])

const filters = ref({
  siteName: '',
  responsible: '',
  handler: '',
  type: '',
  status: '',
  source: '',
  level: ''
})

const formVisible = ref(false)
const formMode = ref('edit')
const formReadOnly = ref(false)
const formAnomalyData = ref(null)

const typeOptions = ANOMALY_TYPE_OPTIONS
const sourceOptions = ANOMALY_SOURCE_OPTIONS
const statusOptions = ANOMALY_STATUS_OPTIONS

const siteList = computed(() => {
  const set = new Set()
  props.anomalies.forEach(a => a.siteName && set.add(a.siteName))
  return [...set].sort()
})

const responsibleList = computed(() => {
  const set = new Set()
  props.anomalies.forEach(a => a.responsible && set.add(a.responsible))
  return [...set].sort()
})

const handlerList = computed(() => {
  const set = new Set()
  props.anomalies.forEach(a => a.handler && set.add(a.handler))
  return [...set].sort()
})

const stats = computed(() => getAnomalyStats(props.anomalies))

const closedLoopRate = computed(() => {
  if (stats.value.total === 0) return 100
  return Math.round((stats.value.resolved + stats.value.ignored) / stats.value.total * 100)
})

const filteredAnomalies = computed(() => {
  return filterAnomalies(props.anomalies, filters.value)
})

const sortedAnomalies = computed(() => {
  return [...filteredAnomalies.value].sort((a, b) => {
    if (isClosed(a) !== isClosed(b)) {
      return isClosed(a) ? 1 : -1
    }
    const levelOrder = { danger: 0, warning: 1, info: 2 }
    const levelDiff = levelOrder[a.level] - levelOrder[b.level]
    if (levelDiff !== 0) return levelDiff
    return b.createdAt - a.createdAt
  })
})

function isClosed(anomaly) {
  return isAnomalyClosed(anomaly)
}

function isOverdue(anomaly) {
  if (!anomaly.planDate || isClosed(anomaly)) return false
  const planTime = new Date(anomaly.planDate).getTime()
  return planTime < Date.now()
}

function getLevelLabel(level) {
  const map = { danger: '严重', warning: '警告', info: '提示' }
  return map[level] || level
}

function getTypeLabel(type) {
  const opt = ANOMALY_TYPE_OPTIONS.find(o => o.value === type)
  return opt ? opt.label : type
}

function getTypeClass(type) {
  const opt = ANOMALY_TYPE_OPTIONS.find(o => o.value === type)
  return opt ? opt.class : ''
}

function getStatusLabel(status) {
  const opt = ANOMALY_STATUS_OPTIONS.find(o => o.value === status)
  return opt ? opt.label : status
}

function getStatusClass(status) {
  const opt = ANOMALY_STATUS_OPTIONS.find(o => o.value === status)
  return opt ? opt.class : ''
}

function getSourceLabel(source) {
  const opt = ANOMALY_SOURCE_OPTIONS.find(o => o.value === source)
  return opt ? opt.label : source
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatPlanDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function setStatusFilter(status) {
  filters.value.status = filters.value.status === status ? '' : status
}

function clearStatusFilter() {
  filters.value.status = ''
}

function clearFilters() {
  filters.value = {
    siteName: '',
    responsible: '',
    handler: '',
    type: '',
    status: '',
    source: '',
    level: ''
  }
}

function handleRefresh() {
  emit('refresh')
}

function handleCreateManual() {
  formMode.value = 'create'
  formReadOnly.value = false
  formAnomalyData.value = {
    type: 'other',
    level: 'warning',
    title: '',
    description: '',
    boxId: null,
    boxNumber: '',
    siteName: filters.value.siteName || siteList.value[0] || '',
    responsible: '',
    source: 'manual',
    status: 'pending',
    handler: '',
    processNote: '',
    planDate: '',
    result: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    history: [],
    typeLabel: '其他异常',
    sourceLabel: '手动创建'
  }
  formVisible.value = true
}

function handleEdit(anomaly) {
  formMode.value = 'edit'
  formReadOnly.value = false
  formAnomalyData.value = { ...anomaly }
  formVisible.value = true
}

function handleView(anomaly) {
  formMode.value = 'view'
  formReadOnly.value = true
  formAnomalyData.value = { ...anomaly }
  formVisible.value = true
}

async function handleFormSave(updates) {
  try {
    let result
    if (formMode.value === 'create') {
      const data = {
        ...formAnomalyData.value,
        ...updates
      }
      delete data.id
      delete data.typeLabel
      delete data.sourceLabel
      result = await AnomalyDB.add(data)
    } else {
      result = await AnomalyDB.update(formAnomalyData.value.id, updates)
    }
    formVisible.value = false
    emit('update', result)
    emit('refresh')
  } catch (e) {
    console.error('保存异常失败:', e)
    alert('保存失败，请重试')
  }
}
</script>

<style scoped>
.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 16px 20px;
  box-shadow: var(--shadow-sm);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #eff6ff;
  color: var(--color-primary);
  border-color: #bfdbfe;
}

.list-header h2 {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.header-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-bar {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  min-width: 70px;
}

.stat-item:hover {
  background: #f9fafb;
}

.stat-item.active {
  background: var(--color-primary-light);
  border-color: #bfdbfe;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-top: 2px;
}

.stat-item .stat-value { color: #374151; }
.stat-item.pending .stat-value { color: #4b5563; }
.stat-item.processing .stat-value { color: var(--color-info); }
.stat-item.resolved .stat-value { color: var(--color-success); }
.stat-item.ignored .stat-value { color: #9ca3af; }
.stat-item.danger .stat-value { color: var(--color-danger); }
.stat-item.warning .stat-value { color: var(--color-warning); }
.stat-item.info .stat-value { color: var(--color-info); }

.stat-item.closed-rate .stat-value { color: var(--color-primary); }

.stat-item.active .stat-value { color: var(--color-primary); }

.stat-item-divider {
  width: 1px;
  background: #e5e7eb;
  margin: 0 8px;
}

.closed-loop-bar {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: 12px 16px;
}
.clb-track {
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}
.clb-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.clb-fill.high { background: linear-gradient(90deg, #16a34a, #22c55e); }
.clb-fill.medium { background: linear-gradient(90deg, #d97706, #f59e0b); }
.clb-fill.low { background: linear-gradient(90deg, #dc2626, #ef4444); }
.clb-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  gap: 8px;
}
.clb-label {
  font-size: 11px;
  font-weight: 600;
}
.clb-label.open { color: var(--color-danger); }
.clb-label.closed { color: var(--color-success); }
.clb-label.all-closed { color: var(--color-success); font-weight: 700; }

.filter-bar {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-select {
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  min-width: 120px;
}

.filter-actions {
  margin-left: auto;
}

.empty-state {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  opacity: 0.4;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
}

.empty-sub {
  font-size: 12px;
}

.anomaly-table-wrap {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.anomaly-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.anomaly-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.anomaly-table th {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.anomaly-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.anomaly-row {
  cursor: pointer;
  transition: background-color 0.15s;
}

.anomaly-row:hover {
  background: #fafbff;
}

.anomaly-row.closed {
  opacity: 0.7;
}

.anomaly-row.danger {
  background: #fff5f5;
}

.anomaly-row.danger:hover {
  background: #fef2f2;
}

.anomaly-row.warning {
  background: #fffbeb;
}

.anomaly-row.warning:hover {
  background: #fef3c7;
}

.level-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.level-badge.danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.level-badge.warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.level-badge.info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tag-anomaly-danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.tag-anomaly-warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.tag-anomaly-info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.tag-anomaly-ignored {
  background: #f3f4f6;
  color: #6b7280;
}

.box-no {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-weight: 600;
  color: #1f2937;
}

.handler-tag {
  padding: 2px 8px;
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.empty-text {
  color: #d1d5db;
  font-style: italic;
}

.overdue {
  color: var(--color-danger);
  font-weight: 600;
}

.td-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.action-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #f3f4f6;
  color: var(--color-primary);
}

.action-btn.edit:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

@media (max-width: 768px) {
  .stats-bar {
    padding: 8px;
    gap: 4px;
  }

  .stat-item {
    padding: 6px 10px;
    min-width: 60px;
  }

  .stat-value {
    font-size: 16px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }

  .filter-actions {
    margin-left: 0;
    justify-content: flex-end;
  }
}
</style>
