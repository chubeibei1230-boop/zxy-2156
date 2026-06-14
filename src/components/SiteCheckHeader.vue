<template>
  <div class="site-check-header">
    <div class="stats-row">
      <div class="stat-card completion">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="stat-body">
          <div class="stat-label">完成率</div>
          <div class="stat-value">{{ completionPercent }}%</div>
          <div class="stat-bar">
            <div class="stat-bar-fill" :style="{ width: completionPercent + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="stat-card remaining">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div class="stat-body">
          <div class="stat-label">剩余未确认</div>
          <div class="stat-value large">{{ remainingCount }}</div>
          <div class="stat-desc">共 {{ siteBoxes.length }} 只箱子</div>
        </div>
      </div>

      <div class="stat-card anomaly">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
        </div>
        <div class="stat-body">
          <div class="stat-label">异常(闭环)</div>
          <div class="stat-value large" :class="{ 'has-anomaly': anomalyOpenCount > 0 }">{{ anomalyOpenCount }}</div>
          <div class="stat-desc">{{ anomalyClosedCount }} 已闭环 / {{ anomalyOpenCount }} 未闭环</div>
        </div>
      </div>

      <div class="stat-card arrived">
        <div class="stat-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="stat-body">
          <div class="stat-label">已到达</div>
          <div class="stat-value large">{{ arrivedCount }}</div>
          <div class="stat-desc">{{ transitCount }} 只在途中</div>
        </div>
      </div>
    </div>

    <div class="breakdown">
      <span class="bd-label">进度明细：</span>
      <span class="bd-tag pending" v-if="pendingCount > 0">待发出 {{ pendingCount }}</span>
      <span class="bd-tag transit" v-if="transitCount > 0">在途 {{ transitCount }}</span>
      <span class="bd-tag arrived" v-if="arrivedCount > 0">已到达 {{ arrivedCount }}</span>
      <span class="bd-tag supplement" v-if="supplementCount > 0">需补充 {{ supplementCount }}</span>
      <button class="bd-handover-btn" @click="$emit('handover', siteName)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        生成交接单
      </button>
      <button v-if="anomalyOpenCount > 0" class="bd-anomaly-btn" @click="$emit('create-anomalies')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
        处理异常 ({{ anomalyOpenCount }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { isAnomalyClosed, hasOpenAnomaliesForSite } from '../lib/anomalies.js'

const props = defineProps({
  siteBoxes: { type: Array, required: true },
  siteName: { type: String, required: true },
  anomalies: { type: Array, default: () => [] }
})

const emit = defineEmits(['handover', 'create-anomalies'])

const arrivedCount = computed(() => props.siteBoxes.filter(b => b.status === 'arrived').length)
const transitCount = computed(() => props.siteBoxes.filter(b => b.status === 'transit').length)
const pendingCount = computed(() => props.siteBoxes.filter(b => b.status === 'pending').length)
const supplementCount = computed(() => props.siteBoxes.filter(b => b.status === 'supplement').length)

const remainingCount = computed(() => {
  return props.siteBoxes.filter(b => b.status !== 'arrived' || !b.checkNote || !b.checkNote.trim()).length
})

const completionPercent = computed(() => {
  const total = props.siteBoxes.length
  if (total === 0) return 0
  const done = props.siteBoxes.filter(b => b.status === 'arrived' && b.checkNote && b.checkNote.trim()).length
  return Math.round((done / total) * 100)
})

const siteAnomalies = computed(() => {
  return props.anomalies.filter(a => a.siteName === props.siteName)
})
const anomalyOpenCount = computed(() => {
  return siteAnomalies.value.filter(a => !isAnomalyClosed(a)).length
})
const anomalyClosedCount = computed(() => {
  return siteAnomalies.value.filter(a => isAnomalyClosed(a)).length
})
</script>

<style scoped>
.site-check-header {
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #fde68a 100%);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  border: 1px solid #fcd34d;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.08);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-sm);
  padding: 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.completion .stat-icon { background: #dcfce7; color: var(--color-success); }
.remaining .stat-icon { background: #dbeafe; color: var(--color-primary); }
.anomaly .stat-icon { background: #fee2e2; color: var(--color-danger); }
.arrived .stat-icon { background: #cffafe; color: var(--color-info); }

.stat-body { flex: 1; min-width: 0; }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #78716c;
  letter-spacing: 0.3px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
  margin-top: 2px;
}

.stat-value.large {
  font-size: 26px;
}

.stat-value.has-anomaly {
  color: var(--color-danger);
}

.stat-bar {
  margin-top: 8px;
  height: 6px;
  background: #e7e5e4;
  border-radius: 3px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success), #15803d);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.stat-desc {
  font-size: 11px;
  color: #78716c;
  margin-top: 2px;
}

.breakdown {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(180, 83, 9, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bd-label {
  font-size: 12px;
  color: #78716c;
  font-weight: 500;
}

.bd-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.bd-tag.pending { background: #f3f4f6; color: #4b5563; }
.bd-tag.transit { background: var(--color-info-light); color: var(--color-info); }
.bd-tag.arrived { background: var(--color-success-light); color: var(--color-success); }
.bd-tag.supplement { background: var(--color-warning-light); color: var(--color-warning); }

.bd-handover-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: auto;
  white-space: nowrap;
}

.bd-handover-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

.bd-anomaly-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bd-anomaly-btn:hover {
  background: var(--color-danger);
  color: #fff;
}
</style>
