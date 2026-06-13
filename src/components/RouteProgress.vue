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
            <span v-if="site.alertCount > 0" class="alert-badge">{{ site.alertCount > 9 ? '9+' : site.alertCount }}</span>
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

const props = defineProps({
  boxes: { type: Array, required: true },
  activeSite: { type: String, default: null }
})

defineEmits(['select-site'])

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
