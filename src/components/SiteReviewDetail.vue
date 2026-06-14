<template>
  <div class="review-detail">
    <div class="detail-header">
      <div class="detail-title">
        <button class="back-btn" @click="$emit('back')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div class="title-row">
            <span class="site-order">{{ siteInfo.siteOrder }}</span>
            <h2>{{ siteName }}</h2>
          </div>
          <p class="detail-sub">站点复盘详情</p>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn btn-secondary btn-sm" @click="$emit('handover', siteName)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          生成交接单
        </button>
      </div>
    </div>

    <div class="stat-cards">
      <div class="stat-card sc-total">
        <div class="sc-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
        </div>
        <div class="sc-info">
          <div class="sc-value">{{ siteInfo.total }}</div>
          <div class="sc-label">物料箱总数</div>
        </div>
      </div>
      <div class="stat-card sc-arrived">
        <div class="sc-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="sc-info">
          <div class="sc-value">{{ siteInfo.arrived }}</div>
          <div class="sc-label">已到达</div>
        </div>
      </div>
      <div class="stat-card sc-transit">
        <div class="sc-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="sc-info">
          <div class="sc-value">{{ siteInfo.transit + siteInfo.pending + siteInfo.supplement }}</div>
          <div class="sc-label">待发/在途/需补</div>
        </div>
      </div>
      <div class="stat-card sc-risk" v-if="siteInfo.highRisk > 0">
        <div class="sc-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
        </div>
        <div class="sc-info">
          <div class="sc-value">{{ siteInfo.highRisk }}</div>
          <div class="sc-label">高风险箱</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="panel anomaly-panel" v-if="anomalyItems.length > 0">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            异常项摘要
            <span class="panel-badge">{{ anomalyItems.length }}</span>
          </div>
          <span class="panel-hint">点击异常项可快速定位箱体</span>
        </div>
        <div class="anomaly-list">
          <div
            v-for="(item, idx) in anomalyItems"
            :key="idx"
            class="anomaly-item"
            :class="item.level"
            @click="handleLocateBox(item.boxId)"
          >
            <div class="ai-icon">
              <svg v-if="item.level === 'danger'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
              <svg v-else-if="item.level === 'warning'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/></svg>
            </div>
            <div class="ai-content">
              <div class="ai-title">{{ item.title }}</div>
              <div class="ai-desc">{{ item.desc }}</div>
            </div>
            <div class="ai-action">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div class="panel box-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
            箱体清单
            <span class="panel-badge">{{ siteBoxes.length }}</span>
          </div>
          <div class="box-filters">
            <button
              class="filter-btn"
              :class="{ active: boxFilter === 'all' }"
              @click="boxFilter = 'all'"
            >全部</button>
            <button
              class="filter-btn"
              :class="{ active: boxFilter === 'abnormal' }"
              @click="boxFilter = 'abnormal'"
            >异常</button>
          </div>
        </div>

        <div class="box-list" ref="boxListRef">
          <div
            v-for="box in filteredBoxes"
            :key="box.id"
            class="box-item"
            :class="{ highlight: highlightId === box.id, abnormal: isBoxAbnormal(box) }"
            :data-id="box.id"
          >
            <div class="box-main">
              <div class="box-left">
                <span class="box-no" :class="{ duplicate: isDuplicate(box) }">{{ box.boxNumber || '—' }}</span>
                <span class="box-summary">{{ box.summary || '—' }}</span>
              </div>
              <div class="box-right">
                <span class="tag" :class="statusClass(box.status)">{{ statusLabel(box.status) }}</span>
                <span class="tag" :class="riskClass(box.riskLevel)">{{ riskLabel(box.riskLevel) }}</span>
              </div>
            </div>
            <div class="box-meta">
              <span class="meta-item" :class="{ 'empty': !box.responsible }">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                {{ box.responsible || '未填责任人' }}
              </span>
              <span class="meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ box.timeSlot || '未设时段' }}
              </span>
              <span v-if="box.status === 'arrived'" class="meta-item checknote" :class="{ 'empty': !box.checkNote }">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                {{ box.checkNote ? '已填写核对说明' : '缺核对说明' }}
              </span>
            </div>
          </div>

          <div v-if="filteredBoxes.length === 0" class="box-empty">
            暂无符合条件的箱体
          </div>
        </div>
      </div>

      <div class="panel handover-panel">
        <div class="panel-header">
          <div class="panel-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            交接记录概览
            <span class="panel-badge">{{ siteHandovers.length }}</span>
          </div>
        </div>

        <div v-if="siteHandovers.length === 0" class="handover-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p>暂无交接记录</p>
        </div>

        <div v-else class="handover-list">
          <div
            v-for="record in siteHandovers"
            :key="record.id"
            class="handover-item"
            @click="$emit('reopen-handover', record)"
          >
            <div class="hi-top">
              <span class="hi-time">{{ formatTime(record.createdAt) }}</span>
              <span class="hi-count">{{ record.totalBoxes }} 箱</span>
            </div>
            <div class="hi-people" v-if="record.handoverPerson || record.receiverPerson">
              <span class="person from">{{ record.handoverPerson || '—' }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              <span class="person to">{{ record.receiverPerson || '—' }}</span>
            </div>
            <div class="hi-stats">
              <span class="hi-stat arrived" v-if="record.arrivedCount > 0">{{ record.arrivedCount }} 已到</span>
              <span class="hi-stat transit" v-if="record.transitCount > 0">{{ record.transitCount }} 在途</span>
              <span class="hi-stat pending" v-if="record.pendingCount > 0">{{ record.pendingCount }} 待发</span>
              <span class="hi-stat risk" v-if="record.highRiskCount > 0">{{ record.highRiskCount }} 高风险</span>
            </div>
            <div class="hi-note" v-if="record.siteNote">
              {{ record.siteNote }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { STATUS_OPTIONS, RISK_OPTIONS } from '../lib/constants.js'

const props = defineProps({
  siteName: { type: String, required: true },
  boxes: { type: Array, required: true },
  handoverRecords: { type: Array, default: () => [] }
})

const emit = defineEmits(['back', 'handover', 'reopen-handover'])

const boxFilter = ref('all')
const highlightId = ref(null)
const boxListRef = ref(null)

const statusMap = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))
const riskMap = Object.fromEntries(RISK_OPTIONS.map(r => [r.value, r.label]))
const statusClassMap = {
  pending: 'tag-status-pending',
  transit: 'tag-status-transit',
  arrived: 'tag-status-arrived',
  supplement: 'tag-status-supplement'
}
const riskClassMap = Object.fromEntries(RISK_OPTIONS.map(r => [r.value, r.class]))

const siteBoxes = computed(() => {
  return props.boxes
    .filter(b => b.siteName === props.siteName)
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
})

const duplicateBoxNumbers = computed(() => {
  const map = new Map()
  siteBoxes.value.forEach(b => {
    const key = (b.boxNumber || '').trim().toUpperCase()
    if (!key) return
    map.set(key, (map.get(key) || 0) + 1)
  })
  const set = new Set()
  map.forEach((cnt, key) => { if (cnt > 1) set.add(key) })
  return set
})

const siteInfo = computed(() => {
  const info = {
    siteOrder: 0,
    total: siteBoxes.value.length,
    arrived: 0,
    transit: 0,
    pending: 0,
    supplement: 0,
    highRisk: 0,
    missingResponsible: 0,
    missingCheckNote: 0
  }
  siteBoxes.value.forEach(box => {
    if (!info.siteOrder) info.siteOrder = box.siteOrder || 0
    if (box.status === 'arrived') info.arrived += 1
    else if (box.status === 'transit') info.transit += 1
    else if (box.status === 'supplement') info.supplement += 1
    else info.pending += 1
    if (box.riskLevel === 'high') info.highRisk += 1
    if (!box.responsible || !box.responsible.trim()) info.missingResponsible += 1
    if (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) info.missingCheckNote += 1
  })
  return info
})

const anomalyItems = computed(() => {
  const items = []

  const byBoxNumber = new Map()
  siteBoxes.value.forEach(b => {
    const key = (b.boxNumber || '').trim().toUpperCase()
    if (!key) return
    if (!byBoxNumber.has(key)) byBoxNumber.set(key, [])
    byBoxNumber.get(key).push(b)
  })
  byBoxNumber.forEach((group) => {
    if (group.length > 1) {
      group.forEach(b => {
        items.push({
          level: 'danger',
          title: '箱号重复',
          desc: `${b.boxNumber} 与其他箱体箱号重复`,
          boxId: b.id
        })
      })
    }
  })

  siteBoxes.value.forEach(box => {
    if (box.riskLevel === 'high') {
      items.push({
        level: 'danger',
        title: '高风险箱',
        desc: `${box.boxNumber || '未填箱号'} - ${box.summary || '未填摘要'}`,
        boxId: box.id
      })
    }
    if (box.status === 'supplement') {
      items.push({
        level: 'warning',
        title: '需补充物料',
        desc: `${box.boxNumber || '未填箱号'} - ${box.summary || '未填摘要'}`,
        boxId: box.id
      })
    }
    if (!box.responsible || !box.responsible.trim()) {
      items.push({
        level: 'warning',
        title: '责任人未填写',
        desc: `${box.boxNumber || '未填箱号'} - 请填写责任人`,
        boxId: box.id
      })
    }
    if (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) {
      items.push({
        level: 'info',
        title: '已到达缺核对说明',
        desc: `${box.boxNumber || '未填箱号'} - 请补充核对说明`,
        boxId: box.id
      })
    }
  })

  return items
})

const filteredBoxes = computed(() => {
  if (boxFilter.value === 'abnormal') {
    return siteBoxes.value.filter(box => isBoxAbnormal(box))
  }
  return siteBoxes.value
})

const siteHandovers = computed(() => {
  return props.handoverRecords
    .filter(r => r.siteName === props.siteName)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
})

function isDuplicate(box) {
  const key = (box.boxNumber || '').trim().toUpperCase()
  return duplicateBoxNumbers.value.has(key)
}

function isBoxAbnormal(box) {
  return (
    box.riskLevel === 'high' ||
    box.status === 'supplement' ||
    !box.responsible || !box.responsible.trim() ||
    (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) ||
    isDuplicate(box)
  )
}

function statusLabel(status) {
  return statusMap[status] || '未知'
}

function statusClass(status) {
  return statusClassMap[status] || ''
}

function riskLabel(level) {
  return riskMap[level] || '未知'
}

function riskClass(level) {
  return riskClassMap[level] || ''
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function handleLocateBox(boxId) {
  boxFilter.value = 'all'
  highlightId.value = boxId
  await nextTick()
  const el = boxListRef.value?.querySelector(`.box-item[data-id="${boxId}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => { highlightId.value = null }, 2500)
  }
}
</script>

<style scoped>
.review-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
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

.detail-title {
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

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.site-order {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.detail-title h2 {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.detail-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
}

.sc-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.sc-total .sc-icon { background: #eff6ff; color: #2563eb; }
.sc-arrived .sc-icon { background: var(--color-success-light); color: var(--color-success); }
.sc-transit .sc-icon { background: var(--color-info-light); color: var(--color-info); }
.sc-risk .sc-icon { background: var(--color-danger-light); color: var(--color-danger); }

.sc-value {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  line-height: 1.1;
}

.sc-arrived .sc-value { color: var(--color-success); }
.sc-transit .sc-value { color: var(--color-info); }
.sc-risk .sc-value { color: var(--color-danger); }

.sc-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-top: 2px;
  letter-spacing: 0.3px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: auto;
  gap: 16px;
}

.box-panel {
  grid-column: 1 / -1;
}

.handover-panel {
  grid-column: 1 / -1;
}

@media (min-width: 1200px) {
  .content-grid {
    grid-template-columns: 360px 1fr;
  }
  .box-panel {
    grid-column: 2;
    grid-row: 1 / 3;
  }
  .anomaly-panel {
    grid-column: 1;
    grid-row: 1;
  }
  .handover-panel {
    grid-column: 1;
    grid-row: 2;
  }
}

.panel {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.panel-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.panel-hint {
  font-size: 11px;
  color: #9ca3af;
}

.anomaly-list {
  padding: 10px;
  overflow-y: auto;
  max-height: 360px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.anomaly-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
}

.anomaly-item.danger {
  background: #fef2f2;
  border-color: #fecaca;
}
.anomaly-item.warning {
  background: #fffbeb;
  border-color: #fde68a;
}
.anomaly-item.info {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.anomaly-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.ai-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.anomaly-item.danger .ai-icon { background: var(--color-danger); color: #fff; }
.anomaly-item.warning .ai-icon { background: var(--color-warning); color: #fff; }
.anomaly-item.info .ai-icon { background: var(--color-info); color: #fff; }

.ai-content {
  flex: 1;
  min-width: 0;
}

.ai-title {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 2px;
}

.anomaly-item.danger .ai-title { color: #991b1b; }
.anomaly-item.warning .ai-title { color: #92400e; }
.anomaly-item.info .ai-title { color: #155e75; }

.ai-desc {
  font-size: 11px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-action {
  flex-shrink: 0;
  color: var(--color-primary);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.15s;
}

.anomaly-item:hover .ai-action {
  opacity: 1;
  transform: translateX(0);
}

.box-filters {
  display: flex;
  gap: 4px;
  background: #f3f4f6;
  padding: 3px;
  border-radius: 8px;
}

.filter-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  border-radius: 6px;
  transition: all 0.15s;
}

.filter-btn.active {
  background: #fff;
  color: var(--color-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.box-list {
  padding: 10px;
  overflow-y: auto;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.box-item {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid #f0f0f0;
  transition: all 0.15s;
}

.box-item:hover {
  background: #fafbff;
  border-color: #e0e7ff;
}

.box-item.highlight {
  animation: highlight-flash 2.5s ease-out;
}

.box-item.abnormal {
  background: #fffbeb;
  border-color: #fde68a;
}

@keyframes highlight-flash {
  0% { background: #fef08a; border-color: var(--color-warning); box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.15); }
  100% { background: transparent; }
}

.box-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.box-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.box-no {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  background: #f3f4f6;
  color: #1f2937;
  padding: 3px 10px;
  border-radius: 5px;
  flex-shrink: 0;
}

.box-no.duplicate {
  background: var(--color-danger-light);
  color: var(--color-danger);
  box-shadow: 0 0 0 1px #fecaca;
}

.box-summary {
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.box-right {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.box-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6b7280;
}

.meta-item.empty {
  color: var(--color-warning);
  font-weight: 600;
}

.meta-item.checknote.empty {
  color: var(--color-info);
}

.box-empty {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.handover-list {
  padding: 10px;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.handover-empty {
  padding: 30px 20px;
  text-align: center;
  color: #9ca3af;
}

.handover-empty svg {
  opacity: 0.4;
  margin-bottom: 8px;
}

.handover-empty p {
  font-size: 12px;
}

.handover-item {
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: #fafafa;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.handover-item:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.hi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.hi-time {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  color: #374151;
  font-weight: 600;
}

.hi-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 1px 8px;
  border-radius: 999px;
}

.hi-people {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 6px;
}

.hi-people svg {
  color: #d1d5db;
}

.person {
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 11px;
}

.person.from { background: var(--color-primary-light); color: var(--color-primary); }
.person.to { background: var(--color-success-light); color: var(--color-success); }

.hi-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.hi-stat {
  font-size: 11px;
  font-weight: 600;
}

.hi-stat.arrived { color: var(--color-success); }
.hi-stat.transit { color: var(--color-info); }
.hi-stat.pending { color: #6b7280; }
.hi-stat.risk { color: var(--color-danger); }

.hi-note {
  font-size: 11px;
  color: #6b7280;
  padding-top: 6px;
  border-top: 1px dashed #f0f0f0;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .box-panel,
  .anomaly-panel,
  .handover-panel {
    grid-column: 1;
    grid-row: auto;
  }

  .anomaly-list,
  .box-list,
  .handover-list {
    max-height: none;
  }

  .box-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .box-right {
    width: 100%;
  }

  .ai-action {
    opacity: 1;
    transform: none;
  }
}
</style>
