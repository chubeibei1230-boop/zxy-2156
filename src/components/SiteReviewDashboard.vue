<template>
  <div class="review-dashboard">
    <div class="dashboard-header">
      <div class="dashboard-title">
        <button class="back-btn" @click="$emit('back')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h2>站点复盘看板</h2>
          <p class="dashboard-sub">按站点汇总查看物料箱全链路状态</p>
        </div>
      </div>
      <div class="dashboard-summary" v-if="totalStats.total > 0">
        <span class="ds-item ds-total">
          <span class="ds-value">{{ totalStats.total }}</span>
          <span class="ds-label">总箱数</span>
        </span>
        <span class="ds-item ds-arrived">
          <span class="ds-value">{{ totalStats.arrived }}</span>
          <span class="ds-label">已到达</span>
        </span>
        <span class="ds-item ds-risk" v-if="totalStats.highRisk > 0">
          <span class="ds-value">{{ totalStats.highRisk }}</span>
          <span class="ds-label">高风险</span>
        </span>
        <span class="ds-item ds-anomaly" v-if="totalStats.anomaly > 0">
          <span class="ds-value">{{ totalStats.anomaly }}</span>
          <span class="ds-label">异常项</span>
        </span>
      </div>
    </div>

    <div v-if="hasActiveFilters" class="filter-scope">
      <div class="scope-label">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        当前筛选范围
      </div>
      <div class="scope-tags">
        <span v-if="appliedFilters.siteName" class="scope-tag">站点：{{ appliedFilters.siteName }}</span>
        <span v-if="appliedFilters.responsible" class="scope-tag">责任人：{{ appliedFilters.responsible }}</span>
        <span v-if="appliedFilters.status" class="scope-tag">状态：{{ statusLabel(appliedFilters.status) }}</span>
        <span v-if="appliedFilters.riskLevel" class="scope-tag">风险：{{ riskLabel(appliedFilters.riskLevel) }}</span>
      </div>
      <div class="scope-hint">
        ( {{ totalStats.total }} 箱 / 覆盖 {{ siteSummaries.length }} 个站点，仅基于筛选后的数据统计 )
      </div>
    </div>

    <div v-if="siteSummaries.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3v18h18"/>
          <path d="M7 14l4-4 4 4 5-5"/>
        </svg>
      </div>
      <p class="empty-title">暂无站点数据</p>
      <p class="empty-sub">请先添加物料箱及站点信息</p>
    </div>

    <div v-else class="site-grid">
      <div
        v-for="site in siteSummaries"
        :key="site.siteName"
        class="site-card"
        :class="{ 'has-alert': site.anomalyCount > 0 }"
        @click="handleSelectSite(site.siteName)"
      >
        <div class="card-header">
          <div class="site-label">
            <span class="site-order">{{ site.siteOrder }}</span>
            <span class="site-name">{{ site.siteName }}</span>
          </div>
          <span v-if="site.anomalyCount > 0" class="anomaly-badge">{{ site.anomalyCount }}</span>
        </div>

        <div class="card-metrics">
          <div class="metric metric-total">
            <div class="metric-value">{{ site.total }}</div>
            <div class="metric-label">总箱数</div>
          </div>
          <div class="metric metric-arrived">
            <div class="metric-value">{{ site.arrived }}</div>
            <div class="metric-label">已到达</div>
          </div>
          <div class="metric metric-progress">
            <div class="metric-value">{{ site.arrivedRate }}%</div>
            <div class="metric-label">完成率</div>
          </div>
        </div>

        <div class="card-progress-bar">
          <div
            class="progress-fill"
            :style="{ width: site.arrivedRate + '%' }"
            :class="{ 'full': site.arrivedRate === 100 }"
          ></div>
        </div>

        <div class="card-status">
          <span v-if="site.pending > 0" class="status-tag st-pending">
            <span class="st-dot"></span>待发 {{ site.pending }}
          </span>
          <span v-if="site.transit > 0" class="status-tag st-transit">
            <span class="st-dot"></span>在途 {{ site.transit }}
          </span>
          <span v-if="site.supplement > 0" class="status-tag st-supplement">
            <span class="st-dot"></span>需补 {{ site.supplement }}
          </span>
        </div>

        <div class="card-alerts" v-if="site.highRisk > 0 || site.missingResponsible > 0 || site.missingCheckNote > 0 || site.duplicateCount > 0">
          <div v-if="site.duplicateCount > 0" class="alert-item ai-danger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            箱号重复 {{ site.duplicateCount }}
          </div>
          <div v-if="site.highRisk > 0" class="alert-item ai-danger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
            </svg>
            高风险 {{ site.highRisk }}
          </div>
          <div v-if="site.missingResponsible > 0" class="alert-item ai-warning">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
            </svg>
            缺责任人 {{ site.missingResponsible }}
          </div>
          <div v-if="site.missingCheckNote > 0" class="alert-item ai-info">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
            缺核对说明 {{ site.missingCheckNote }}
          </div>
        </div>

        <div class="card-anomaly-closed" v-if="site.anomalyOpen !== undefined && (site.anomalyOpen > 0 || site.anomalyClosed > 0)">
          <span v-if="site.anomalyOpen > 0" class="closed-tag open">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
            {{ site.anomalyOpen }} 未闭环
          </span>
          <span v-if="site.anomalyClosed > 0" class="closed-tag closed">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            {{ site.anomalyClosed }} 已闭环
          </span>
          <button v-if="site.anomalyOpen > 0" class="handle-anomaly-btn" @click.stop="$emit('create-anomalies', site.siteName)">去处理</button>
          <button class="view-anomaly-btn" @click.stop="$emit('open-anomaly-list', { siteName: site.siteName })">查看异常</button>
        </div>

        <div class="card-handover" v-if="site.latestHandover">
          <div class="handover-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            最近交接
          </div>
          <div class="handover-content">
            <span class="handover-time">{{ formatTime(site.latestHandover._sortTime || site.latestHandover.createdAt) }}</span>
            <span class="handover-people" v-if="site.latestHandover.handoverPerson || site.latestHandover.receiverPerson">
              {{ site.latestHandover.handoverPerson || '—' }} → {{ site.latestHandover.receiverPerson || '—' }}
            </span>
          </div>
        </div>

        <div class="card-foot">
          <span class="view-detail">查看详情</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { STATUS_OPTIONS, RISK_OPTIONS } from '../lib/constants.js'
import { hasOpenAnomaliesForSite, isAnomalyClosed } from '../lib/anomalies.js'

const props = defineProps({
  boxes: { type: Array, required: true },
  allBoxes: { type: Array, default: () => [] },
  handoverRecords: { type: Array, default: () => [] },
  anomalies: { type: Array, default: () => [] },
  appliedFilters: {
    type: Object,
    default: () => ({ siteName: '', responsible: '', status: '', riskLevel: '' })
  }
})

const emit = defineEmits(['back', 'select-site', 'open-anomaly-list', 'create-anomalies'])

const statusMap = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))
const riskMap = Object.fromEntries(RISK_OPTIONS.map(r => [r.value, r.label]))

const hasActiveFilters = computed(() => {
  const f = props.appliedFilters || {}
  return !!(f.siteName || f.responsible || f.status || f.riskLevel || f.anomalies)
})

function statusLabel(status) { return statusMap[status] || status }
function riskLabel(level) { return riskMap[level] || level }

const siteSummaries = computed(() => {
  const map = new Map()

  props.boxes.forEach(box => {
    const site = box.siteName
    if (!site) return
    if (!map.has(site)) {
      map.set(site, {
        siteName: site,
        siteOrder: box.siteOrder || 0,
        total: 0,
        arrived: 0,
        transit: 0,
        pending: 0,
        supplement: 0,
        highRisk: 0,
        missingResponsible: 0,
        missingCheckNote: 0,
        duplicateCount: 0,
        _boxNumbers: new Map(),
        orderIndex: box.orderIndex || 9999
      })
    }
    const s = map.get(site)
    s.total += 1
    if (box.status === 'arrived') s.arrived += 1
    else if (box.status === 'transit') s.transit += 1
    else if (box.status === 'supplement') s.supplement += 1
    else s.pending += 1

    if (box.riskLevel === 'high') s.highRisk += 1
    if (!box.responsible || !box.responsible.trim()) s.missingResponsible += 1
    if (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) s.missingCheckNote += 1
    if (s.orderIndex > (box.orderIndex || 9999)) s.orderIndex = box.orderIndex || 9999

    const key = (box.boxNumber || '').trim().toUpperCase()
    if (key) {
      s._boxNumbers.set(key, (s._boxNumbers.get(key) || 0) + 1)
    }
  })

  map.forEach(s => {
    let dup = 0
    s._boxNumbers.forEach(cnt => { if (cnt > 1) dup += cnt })
    s.duplicateCount = dup
    delete s._boxNumbers
  })

  const result = [...map.values()].sort((a, b) => {
    if (a.siteOrder !== b.siteOrder) return a.siteOrder - b.siteOrder
    return a.orderIndex - b.orderIndex
  })

  result.forEach(s => {
    s.arrivedRate = s.total === 0 ? 0 : Math.round((s.arrived / s.total) * 100)
    s.anomalyCount = s.highRisk + s.missingResponsible + s.missingCheckNote + s.supplement + s.duplicateCount

    const siteHandovers = props.handoverRecords
      .filter(r => r.siteName === s.siteName)
      .map(r => ({
        ...r,
        _sortTime: parseHandoverTime(r)
      }))
      .sort((a, b) => b._sortTime - a._sortTime)
    s.latestHandover = siteHandovers.length > 0 ? siteHandovers[0] : null

    const siteAnomalies = (props.anomalies || []).filter(a => a.siteName === s.siteName)
    s.anomalyOpen = siteAnomalies.filter(a => a.status !== 'resolved' && a.status !== 'ignored').length
    s.anomalyClosed = siteAnomalies.filter(a => a.status === 'resolved' || a.status === 'ignored').length
    s.anomalyAllClosed = siteAnomalies.length > 0 && s.anomalyOpen === 0
  })

  return result
})

const totalStats = computed(() => {
  const stats = {
    total: 0,
    arrived: 0,
    highRisk: 0,
    anomaly: 0
  }
  siteSummaries.value.forEach(s => {
    stats.total += s.total
    stats.arrived += s.arrived
    stats.highRisk += s.highRisk
    stats.anomaly += s.anomalyCount
  })
  return stats
})

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function parseHandoverTime(record) {
  if (record.handoverTime) {
    const time = new Date(record.handoverTime).getTime()
    if (!Number.isNaN(time)) return time
  }
  return record.createdAt || 0
}

function handleSelectSite(siteName) {
  emit('select-site', siteName)
}
</script>

<style scoped>
.review-dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.dashboard-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: #f9fafb;
  color: var(--color-primary);
  border-color: #bfdbfe;
}

.dashboard-title h2 {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.dashboard-sub {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
}

.filter-scope {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: linear-gradient(90deg, #fff7ed, #fef2f2);
  border: 1px solid #fde68a;
  border-radius: var(--radius-md);
}

.scope-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: #92400e;
  flex-shrink: 0;
}

.scope-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.scope-tag {
  background: #fff;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: #78350f;
  border: 1px solid #fde68a;
}

.scope-hint {
  font-size: 11px;
  color: #a16207;
  font-weight: 500;
}

@media (max-width: 640px) {
  .filter-scope {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.dashboard-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ds-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.ds-value {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
  line-height: 1;
}

.ds-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
}

.ds-arrived .ds-value { color: var(--color-success); }
.ds-risk .ds-value { color: var(--color-danger); }
.ds-anomaly .ds-value { color: var(--color-warning); }

.empty-state {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: 60px 20px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon {
  opacity: 0.35;
  margin-bottom: 14px;
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

.site-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.site-card {
  background: #fff;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  padding: 18px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.site-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  border-color: #bfdbfe;
}

.site-card.has-alert {
  border-color: #fde68a;
}

.site-card.has-alert:hover {
  border-color: #fbbf24;
  box-shadow: 0 8px 24px rgba(217, 119, 6, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.site-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.site-order {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.site-name {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.anomaly-badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 11px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.25); }
  50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.08); }
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metric {
  text-align: center;
  padding: 10px 6px;
  background: #f9fafb;
  border-radius: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-top: 3px;
}

.metric-arrived .metric-value { color: var(--color-success); }
.metric-progress .metric-value { color: var(--color-primary); }

.card-progress-bar {
  height: 6px;
  background: #f3f4f6;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #4f46e5);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.progress-fill.full {
  background: linear-gradient(90deg, #16a34a, #22c55e);
}

.card-status {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.st-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.st-pending { background: #f3f4f6; color: #4b5563; }
.st-pending .st-dot { background: #9ca3af; }
.st-transit { background: var(--color-info-light); color: var(--color-info); }
.st-transit .st-dot { background: var(--color-info); }
.st-supplement { background: var(--color-warning-light); color: var(--color-warning); }
.st-supplement .st-dot { background: var(--color-warning); }

.card-alerts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.alert-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.ai-danger { background: var(--color-danger-light); color: var(--color-danger); }
.ai-warning { background: var(--color-warning-light); color: var(--color-warning); }
.ai-info { background: var(--color-info-light); color: var(--color-info); }

.card-anomaly-closed {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
  flex-wrap: wrap;
}
.closed-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.closed-tag.open {
  background: var(--color-danger-light);
  color: var(--color-danger);
}
.closed-tag.closed {
  background: var(--color-success-light);
  color: var(--color-success);
}
.handle-anomaly-btn {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: auto;
  white-space: nowrap;
}
.handle-anomaly-btn:hover {
  background: #1d4ed8;
}
.view-anomaly-btn {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: #fff;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.view-anomaly-btn:hover {
  background: var(--color-primary-light);
}

.card-handover {
  padding-top: 10px;
  border-top: 1px solid #f3f4f6;
}

.handover-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 4px;
}

.handover-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  flex-wrap: wrap;
}

.handover-time {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  color: #6b7280;
  font-weight: 500;
}

.handover-people {
  color: #374151;
  font-weight: 600;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding-top: 4px;
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 600;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s;
}

.site-card:hover .card-foot {
  opacity: 1;
  transform: translateX(0);
}

@media (max-width: 640px) {
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .dashboard-summary {
    width: 100%;
  }

  .ds-item {
    flex: 1;
    justify-content: center;
    padding: 8px 10px;
  }

  .site-grid {
    grid-template-columns: 1fr;
  }

  .card-foot {
    opacity: 1;
    transform: none;
  }
}
</style>
