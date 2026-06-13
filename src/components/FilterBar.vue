<template>
  <div class="filter-bar">
    <div class="filter-row">
      <div class="filter-fields">
        <div class="field-wrap">
          <label class="field-label">站点</label>
          <select v-model="localFilters.siteName" :disabled="checkMode" @change="emitChange">
            <option value="">全部站点</option>
            <option v-for="s in siteOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div class="field-wrap">
          <label class="field-label">责任人</label>
          <select v-model="localFilters.responsible" @change="emitChange">
            <option value="">全部</option>
            <option v-for="r in responsibleOptions" :key="r" :value="r">{{ r || '(未填写)' }}</option>
          </select>
        </div>
        <div class="field-wrap">
          <label class="field-label">状态</label>
          <select v-model="localFilters.status" @change="emitChange">
            <option value="">全部状态</option>
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="field-wrap">
          <label class="field-label">风险</label>
          <select v-model="localFilters.riskLevel" @change="emitChange">
            <option value="">全部</option>
            <option v-for="r in riskOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
      </div>

      <div class="filter-actions">
        <button v-if="selectedIds.size > 0" class="btn btn-secondary btn-sm batch-info" @click="$emit('clear-selection')">
          已选 {{ selectedIds.size }} 项 · 清除
        </button>
        <div v-if="selectedIds.size > 0" class="batch-ops">
          <button class="btn btn-sm btn-secondary" @click="$emit('batch-update', 'pending')">待发出</button>
          <button class="btn btn-sm btn-secondary" @click="$emit('batch-update', 'transit')">在途</button>
          <button class="btn btn-sm btn-secondary" @click="$emit('batch-update', 'arrived')">已到达</button>
          <button class="btn btn-sm btn-secondary" @click="$emit('batch-update', 'supplement')">需补充</button>
        </div>
        <button v-if="!checkMode" class="btn btn-secondary btn-sm" @click="$emit('copy-last')" title="将上一站物料箱配置复制到当前选中站点">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          复制上一站
        </button>
        <button class="btn btn-secondary btn-sm toggle-alert" :class="{ active: showLocalAlert }" @click="toggleAlert">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          告警
          <span v-if="alertCount > 0" class="alert-count" :class="{ danger: alertCount > 3 }">{{ alertCount }}</span>
        </button>
        <button class="btn btn-primary btn-sm" @click="$emit('add-box')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增物料箱
        </button>
      </div>
    </div>

    <div v-if="checkMode" class="check-mode-hint">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      站点核对模式 · 当前站点：<strong>{{ checkSite }}</strong> · 请逐项确认每只箱子
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { STATUS_OPTIONS, RISK_OPTIONS } from '../lib/constants.js'

const props = defineProps({
  filters: { type: Object, required: true },
  boxes: { type: Array, required: true },
  selectedIds: { type: Set, required: true },
  alertCount: { type: Number, default: 0 },
  checkMode: { type: Boolean, default: false },
  checkSite: { type: String, default: '' }
})

const emit = defineEmits(['update:filters', 'batch-update', 'add-box', 'copy-last', 'clear-selection', 'toggle-alert'])

const statusOptions = STATUS_OPTIONS
const riskOptions = RISK_OPTIONS
const showLocalAlert = ref(true)

const localFilters = ref({ ...props.filters })

watch(() => props.filters, (v) => {
  localFilters.value = { ...v }
}, { deep: true })

function emitChange() {
  emit('update:filters', { ...localFilters.value })
}

const siteOptions = computed(() => {
  const set = new Set()
  props.boxes.forEach(b => b.siteName && set.add(b.siteName))
  return [...set].sort((a, b) => {
    const aBox = props.boxes.find(x => x.siteName === a)
    const bBox = props.boxes.find(x => x.siteName === b)
    return (aBox?.orderIndex || 0) - (bBox?.orderIndex || 0)
  })
})

const responsibleOptions = computed(() => {
  const set = new Set()
  props.boxes.forEach(b => set.add(b.responsible || ''))
  return [...set].sort()
})

function toggleAlert() {
  showLocalAlert.value = !showLocalAlert.value
  emit('toggle-alert')
}
</script>

<style scoped>
.filter-bar {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-fields {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 140px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-wrap select {
  width: 100%;
}

.field-wrap select:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.batch-info {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: #bfdbfe;
}

.batch-ops {
  display: flex;
  gap: 4px;
  padding: 3px;
  background: #f9fafb;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.batch-ops .btn {
  padding: 4px 10px;
}

.toggle-alert {
  position: relative;
  padding-right: 14px;
}

.toggle-alert.active {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-color: #fde68a;
}

.alert-count {
  margin-left: 6px;
  padding: 0 6px;
  background: var(--color-danger-light);
  color: var(--color-danger);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  line-height: 16px;
}

.alert-count.danger {
  background: var(--color-danger);
  color: #fff;
}

.check-mode-hint {
  margin-top: 12px;
  padding: 8px 12px;
  background: linear-gradient(90deg, #fef3c7, #fde68a);
  color: #92400e;
  border-radius: var(--radius-sm);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.check-mode-hint strong {
  color: #78350f;
  font-weight: 700;
}
</style>
