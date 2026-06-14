<template>
  <div class="route-progress-wrap">
    <div class="route-progress-inner">
      <div class="progress-bar-track">
        <div
          v-for="(site, idx) in siteStats"
          :key="site.name"
          class="site-node"
          :class="{
            active: isActive(site.name),
            done: getStatus(site) === 'done',
            partial: getStatus(site) === 'partial',
            alert: site.alertCount > 0
          }"
          :style="{ width: siteWidth }"
          @click="$emit('select-site', site.name)"
        >
          <div class="site-dot">
            <div class="dot-inner">
              <span v-if="getStatus(site) === 'done'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
              </span>
              <span v-else>{{ idx + 1 }}</span>
            </div>
            <span v-if="site.anomalyOpen > 0" class="alert-badge">{{ site.anomalyOpen > 9 ? '9+' : site.anomalyOpen }}</span>
          </div>
          <div class="site-info">
            <div class="site-name">{{ site.name }}</div>
            <div class="site-meta">
              <span class="meta-count">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/></svg>
                {{ site.total }}
              </span>
              <span class="meta-status">{{ getLabel(site) }}</span>
            </div>
            <div class="site-anomaly-status" v-if="site.anomalyOpen > 0 || site.anomalyClosed > 0">
              <span v-if="site.anomalyOpen > 0" class="sas-open">{{ site.anomalyOpen }} 未闭环</span>
              <span v-else-if="site.anomalyClosed > 0" class="sas-closed">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                已闭环
              </span>
            </div>
            <div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
              <button class="site-handover-btn" @click.stop="$emit('handover', site.name)" title="生成交接单">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                交接
              </button>
              <button v-if="site.anomalyOpen > 0" class="site-anomaly-btn" @click.stop="$emit('create-anomalies', site.name)" title="处理异常">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                异常
              </button>
            </div>
          </div>
          <div v-if="idx < siteStats.length - 1" class="connector">
            <div class="connector-fill" :class="{ done: getStatus(site) === 'done' && (getStatus(siteStats[idx + 1]) === 'done') }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isAnomalyClosed } from '../lib/anomalies.js'

const props = defineProps({
  boxes: { type: Array, required: true },
  activeSite: { type: String, default: null },
  anomalies: { type: Array, default: () => [] }
})

defineEmits(['select-site', 'handover', 'create-anomalies', 'open-anomaly-list'])

const siteStats = computed(() => {
  const map = new Map()
  props.boxes.forEach(box => {
    const site = box.siteName
    if (!site) return
    if (!map.has(site)) {
      map.set(site, {
        name: site,
        total: 0,
        arrived: 0,
        transit: 0,
        pending: 0,
        supplement: 0,
        alertCount: 0,
        anomalyOpen: 0,
        anomalyClosed: 0,
        anomalyAllClosed: false,
        orderIndex: box.orderIndex || 9999
      })
    }
    const s = map.get(site)
    s.total += 1
    if (box.status === 'arrived') s.arrived += 1
    else if (box.status === 'transit') s.transit += 1
    else if (box.status === 'supplement') s.supplement += 1
    else s.pending += 1
    if (s.orderIndex > (box.orderIndex || 9999)) s.orderIndex = box.orderIndex || 9999
    if (box.riskLevel === 'high' || (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) || !box.responsible) {
      s.alertCount += 1
    }
  })
  const siteAnomalies = new Map()
  props.anomalies.forEach(a => {
    if (!a.siteName) return
    if (!siteAnomalies.has(a.siteName)) {
      siteAnomalies.set(a.siteName, [])
    }
    siteAnomalies.get(a.siteName).push(a)
  })
  map.forEach((s, siteName) => {
    const anomalies = siteAnomalies.get(siteName) || []
    s.anomalyOpen = anomalies.filter(a => !isAnomalyClosed(a)).length
    s.anomalyClosed = anomalies.filter(a => isAnomalyClosed(a)).length
    s.anomalyAllClosed = anomalies.length > 0 && s.anomalyOpen === 0
  })
  return [...map.values()].sort((a, b) => a.orderIndex - b.orderIndex)
})

const siteWidth = computed(() => {
  const count = Math.max(siteStats.value.length, 1)
  return `${100 / count}%`
})

function getStatus(site) {
  if (site.total === 0) return 'empty'
  if (site.arrived === site.total) return 'done'
  if (site.arrived > 0 || site.transit > 0) return 'partial'
  return 'pending'
}

function getLabel(site) {
  const status = getStatus(site)
  if (status === 'done') return `${site.arrived}/${site.total} 全到`
  if (status === 'partial') return `${site.arrived + site.transit}/${site.total} 进行中`
  if (status === 'empty') return '无'
  return `${site.pending}/${site.total} 待发`
}

function isActive(siteName) {
  return props.activeSite === siteName
}
</script>

<style scoped>
.route-progress-wrap {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 71px;
  z-index: 15;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
}

.route-progress-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px 24px;
}

.progress-bar-track {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.site-node {
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 8px;
  transition: transform 0.2s;
}

.site-node:hover {
  transform: translateY(-2px);
}

.site-dot {
  position: relative;
  z-index: 2;
}

.dot-inner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.25s;
}

.site-node.done .dot-inner {
  background: var(--color-success);
  border-color: var(--color-success);
  color: #fff;
  box-shadow: 0 0 0 4px var(--color-success-light);
}

.site-node.partial .dot-inner {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  box-shadow: 0 0 0 4px var(--color-primary-light);
}

.site-node.active .dot-inner {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: #fff;
  box-shadow: 0 0 0 4px var(--color-warning-light);
}

.site-node.alert .dot-inner {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px var(--color-danger-light); }
  50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0.1); }
}

.alert-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-danger);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.site-info {
  margin-top: 10px;
  text-align: center;
  max-width: 100%;
}

.site-name {
  font-size: 13px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-node.active .site-name {
  color: var(--color-warning);
}

.site-meta {
  margin-top: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
}

.meta-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #6b7280;
}

.meta-status {
  font-weight: 500;
}

.site-node.done .meta-status { color: var(--color-success); }
.site-node.partial .meta-status { color: var(--color-primary); }
.site-node.active .meta-status { color: var(--color-warning); }

.site-handover-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 4px;
  white-space: nowrap;
}

.site-handover-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.site-anomaly-status {
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.sas-open {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-danger);
  background: var(--color-danger-light);
  padding: 1px 6px;
  border-radius: 999px;
}

.sas-closed {
  font-size: 9px;
  font-weight: 700;
  color: var(--color-success);
  background: var(--color-success-light);
  padding: 1px 6px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.site-anomaly-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 2px;
  white-space: nowrap;
}

.site-anomaly-btn:hover {
  background: var(--color-danger);
  color: #fff;
}

.connector {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 100%;
  height: 2px;
  z-index: 1;
  pointer-events: none;
}

.connector::before {
  content: '';
  position: absolute;
  inset: 0;
  background: #e5e7eb;
}

.connector-fill {
  position: absolute;
  inset: 0;
  width: 0;
  background: transparent;
  transition: width 0.5s ease;
}

.connector-fill.done {
  width: 100%;
  background: var(--color-success);
}
</style>
