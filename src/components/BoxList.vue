<template>
  <div class="box-list-wrap" ref="listWrapRef">
    <div v-if="groupedBoxes.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M8 8V5a4 4 0 0 1 8 0v3"/><line x1="3" y1="13" x2="21" y2="13"/></svg>
      </div>
      <p class="empty-title">暂无物料箱记录</p>
      <p class="empty-sub">点击右上角「新增物料箱」或「演示数据」开始</p>
    </div>

    <template v-else>
      <div v-for="group in groupedBoxes" :key="group.siteName" class="site-group" :data-site="group.siteName">
        <div class="site-group-header">
          <div class="site-group-title">
            <span class="site-order">{{ group.siteOrder }}</span>
            <span class="site-name">{{ group.siteName }}</span>
            <span class="site-count">{{ group.boxes.length }} 箱</span>
          </div>
          <div class="site-group-status">
            <span v-for="s in group.statLabels" :key="s.label" class="mini-stat" :class="s.class">{{ s.label }} {{ s.count }}</span>
          </div>
        </div>

        <div class="box-table-wrap">
          <div class="box-table-header">
            <div class="col-check">
              <input type="checkbox" :checked="isAllSelected(group)" @change="$emit('select-all', group.boxes.map(b => b.id))" />
            </div>
            <div class="col-drag"></div>
            <div class="col-boxno">箱号</div>
            <div class="col-summary">箱内摘要</div>
            <div class="col-time">到达时段</div>
            <div class="col-risk">风险</div>
            <div class="col-responsible">责任人</div>
            <div class="col-status">状态</div>
            <div v-if="checkMode" class="col-checknote">核对说明</div>
            <div class="col-actions">操作</div>
          </div>

          <div class="box-table-body" :ref="el => setupSortable(el, group)">
            <div
              v-for="box in group.boxes"
              :key="box.id"
              class="box-row"
              :data-id="box.id"
              :class="{
                selected: selectedIds.has(box.id),
                highlight: highlightIds.includes(box.id),
                'need-check': checkMode && needCheck(box)
              }"
            >
              <div class="col-check">
                <input type="checkbox" :checked="selectedIds.has(box.id)" @change="$emit('select', box.id)" />
              </div>
              <div class="col-drag drag-handle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
              </div>
              <div class="col-boxno">
                <span class="boxno-label" :class="{ duplicate: isDuplicate(box) }">{{ box.boxNumber || '—' }}</span>
              </div>
              <div class="col-summary">{{ box.summary || '—' }}
                <span v-if="box.remark" class="remark-tip" :title="box.remark">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                </span>
              </div>
              <div class="col-time">{{ box.timeSlot || '—' }}</div>
              <div class="col-risk">
                <span class="tag" :class="riskClass(box.riskLevel)">{{ riskLabel(box.riskLevel) }}</span>
              </div>
              <div class="col-responsible">
                <input
                  v-if="editingField === `${box.id}-responsible`"
                  type="text"
                  :value="box.responsible"
                  @blur="saveField(box.id, 'responsible', $event.target.value)"
                  @keyup.enter="saveField(box.id, 'responsible', $event.target.value); editingField = null"
                  @keyup.esc="editingField = null"
                  ref="inputRefs"
                  class="inline-input"
                  placeholder="点击填写"
                />
                <span v-else class="editable" @click="startEdit(box.id, 'responsible', box.responsible)">
                  {{ box.responsible || '<span class="empty-field">未填写</span>' }}
                </span>
              </div>
              <div class="col-status">
                <select
                  :value="box.status"
                  @change="$emit('update', box.id, { status: $event.target.value })"
                  class="inline-select"
                  :class="statusSelectClass(box.status)"
                >
                  <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
              <div v-if="checkMode" class="col-checknote">
                <textarea
                  class="inline-textarea"
                  :class="{ missing: box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim()) }"
                  :value="box.checkNote"
                  rows="1"
                  placeholder="核对说明..."
                  @input="autoResizeTextarea"
                  @blur="$emit('update', box.id, { checkNote: $event.target.value })"
                ></textarea>
              </div>
              <div class="col-actions">
                <button class="icon-btn" title="编辑" @click="$emit('edit', box)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="icon-btn danger" title="删除" @click="$emit('remove', box.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import { STATUS_OPTIONS, RISK_OPTIONS } from '../lib/constants.js'

const props = defineProps({
  boxes: { type: Array, required: true },
  selectedIds: { type: Set, required: true },
  checkMode: { type: Boolean, default: false },
  highlightIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'select-all', 'update', 'remove', 'edit', 'reorder'])

const statusOptions = STATUS_OPTIONS
const editingField = ref(null)
const inputRefs = ref([])
const listWrapRef = ref(null)
const sortableInstances = []

const duplicateBoxNumbers = computed(() => {
  const map = new Map()
  props.boxes.forEach(b => {
    const key = b.boxNumber.trim().toUpperCase()
    if (!key) return
    map.set(key, (map.get(key) || 0) + 1)
  })
  const set = new Set()
  map.forEach((cnt, key) => { if (cnt > 1) set.add(key) })
  return set
})

const groupedBoxes = computed(() => {
  const groups = new Map()
  props.boxes.forEach((box, idx) => {
    const site = box.siteName || '未分配站点'
    if (!groups.has(site)) {
      groups.set(site, {
        siteName: site,
        siteOrder: box.siteOrder || (idx + 1),
        boxes: []
      })
    }
    groups.get(site).boxes.push(box)
  })
  return [...groups.values()]
    .sort((a, b) => a.siteOrder - b.siteOrder)
    .map(g => {
      const pending = g.boxes.filter(b => b.status === 'pending').length
      const transit = g.boxes.filter(b => b.status === 'transit').length
      const arrived = g.boxes.filter(b => b.status === 'arrived').length
      const supplement = g.boxes.filter(b => b.status === 'supplement').length
      g.statLabels = []
      if (pending) g.statLabels.push({ label: '待发', count: pending, class: 'm-pending' })
      if (transit) g.statLabels.push({ label: '在途', count: transit, class: 'm-transit' })
      if (arrived) g.statLabels.push({ label: '已到', count: arrived, class: 'm-arrived' })
      if (supplement) g.statLabels.push({ label: '需补', count: supplement, class: 'm-supplement' })
      return g
    })
})

function isAllSelected(group) {
  return group.boxes.length > 0 && group.boxes.every(b => props.selectedIds.has(b.id))
}

function isDuplicate(box) {
  const key = box.boxNumber.trim().toUpperCase()
  return duplicateBoxNumbers.value.has(key)
}

function needCheck(box) {
  if (box.status !== 'arrived') return false
  return !box.checkNote || !box.checkNote.trim()
}

function riskClass(level) {
  return RISK_OPTIONS.find(r => r.value === level)?.class || ''
}

function riskLabel(level) {
  return RISK_OPTIONS.find(r => r.value === level)?.label || '未知'
}

function statusSelectClass(status) {
  const map = {
    pending: 'status-pending',
    transit: 'status-transit',
    arrived: 'status-arrived',
    supplement: 'status-supplement'
  }
  return map[status] || ''
}

function startEdit(id, field, current) {
  editingField.value = `${id}-${field}`
  nextTick(() => {
    const inputs = document.querySelectorAll('.inline-input')
    const last = inputs[inputs.length - 1]
    if (last) {
      last.focus()
      last.select()
    }
  })
}

function saveField(id, field, value) {
  emit('update', id, { [field]: value.trim() })
  editingField.value = null
}

function autoResizeTextarea(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

function setupSortable(el, group) {
  if (!el) return
  const existing = sortableInstances.find(s => s.el === el)
  if (existing) return
  const instance = Sortable.create(el, {
    animation: 180,
    handle: '.drag-handle',
    draggable: '.box-row',
    ghostClass: 'drag-ghost',
    chosenClass: 'drag-chosen',
    dragClass: 'drag-dragging',
    onEnd: () => {
      const rows = el.querySelectorAll('.box-row')
      const newOrder = []
      rows.forEach((row, idx) => {
        const id = parseInt(row.dataset.id)
        const box = group.boxes.find(b => b.id === id)
        if (box) {
          newOrder.push({ ...box })
        }
      })
      const updatedBoxes = [...props.boxes]
      const groupStartOrder = group.boxes.length > 0
        ? Math.min(...group.boxes.map(b => b.orderIndex || 0))
        : 0
      newOrder.forEach((box, idx) => {
        box.orderIndex = groupStartOrder + idx
        const globalIdx = updatedBoxes.findIndex(b => b.id === box.id)
        if (globalIdx > -1) updatedBoxes[globalIdx] = box
      })
      emit('reorder', updatedBoxes)
    }
  })
  instance.el = el
  sortableInstances.push(instance)
}

function scrollTo(id) {
  nextTick(() => {
    const el = document.querySelector(`.box-row[data-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  })
}

onBeforeUnmount(() => {
  sortableInstances.forEach(s => s.destroy())
  sortableInstances.length = 0
})

defineExpose({ scrollTo })
</script>

<style scoped>
.box-list-wrap {
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.empty-state {
  padding: 80px 20px;
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

.site-group + .site-group {
  border-top: 4px solid var(--color-bg);
}

.site-group-header {
  padding: 12px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, #fafafa, #fff);
  border-bottom: 1px solid #f3f4f6;
}

.site-group-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.site-order {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.site-name {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
}

.site-count {
  font-size: 12px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 10px;
  border-radius: 999px;
}

.site-group-status {
  display: flex;
  gap: 6px;
}

.mini-stat {
  padding: 2px 9px;
  font-size: 11px;
  border-radius: 999px;
  font-weight: 600;
}
.mini-stat.m-pending { background: #f3f4f6; color: #4b5563; }
.mini-stat.m-transit { background: var(--color-info-light); color: var(--color-info); }
.mini-stat.m-arrived { background: var(--color-success-light); color: var(--color-success); }
.mini-stat.m-supplement { background: var(--color-warning-light); color: var(--color-warning); }

.box-table-wrap {
  overflow-x: auto;
}

.box-table-header {
  display: grid;
  grid-template-columns: 40px 36px 120px 1fr 100px 72px 110px 110px 1fr 80px;
  padding: 8px 16px;
  gap: 12px;
  align-items: center;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  white-space: nowrap;
}

.box-table-body {
  display: block;
}

.box-row {
  display: grid;
  grid-template-columns: 40px 36px 120px 1fr 100px 72px 110px 110px 1fr 80px;
  padding: 12px 16px;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
  transition: background-color 0.15s, box-shadow 0.15s;
  font-size: 13px;
}

.box-row:last-child { border-bottom: none; }

.box-row:hover {
  background: #fafbff;
}

.box-row.selected {
  background: #eff6ff;
  box-shadow: inset 3px 0 0 var(--color-primary);
}

.box-row.highlight {
  animation: highlight-flash 2s ease-out;
}

.box-row.need-check {
  background: #fffbeb;
}

@keyframes highlight-flash {
  0% { background: #fef08a; box-shadow: inset 3px 0 0 var(--color-warning); }
  100% { background: transparent; }
}

.col-check {
  display: flex;
  align-items: center;
  justify-content: center;
}

.col-check input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.col-drag {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d1d5db;
  cursor: grab;
}
.col-drag:active { cursor: grabbing; }
.col-drag:hover { color: var(--color-primary); }

.col-boxno {
  font-weight: 600;
  color: #1f2937;
}
.boxno-label {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  background: #f3f4f6;
  padding: 3px 9px;
  border-radius: 5px;
  display: inline-block;
}
.boxno-label.duplicate {
  background: var(--color-danger-light);
  color: var(--color-danger);
  box-shadow: 0 0 0 1px #fecaca;
}

.col-summary {
  color: #374151;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}
.col-summary > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-tip {
  color: var(--color-warning);
  flex-shrink: 0;
}

.col-time {
  font-size: 12px;
  color: #6b7280;
}

.col-risk { white-space: nowrap; }
.col-responsible { min-width: 0; }

.editable {
  cursor: pointer;
  padding: 3px 6px;
  border-radius: 4px;
  border: 1px dashed transparent;
  transition: all 0.15s;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editable:hover {
  border-color: var(--color-primary);
  background: #eff6ff;
}
.empty-field {
  color: #d1d5db;
  font-style: italic;
}

.inline-input {
  width: 100%;
  padding: 3px 8px;
  font-size: 13px;
}

.inline-select {
  width: 100%;
  padding: 5px 26px 5px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 5px;
  background: #fff;
}
.inline-select.status-pending { background: #f3f4f6; color: #4b5563; border-color: #e5e7eb; }
.inline-select.status-transit { background: var(--color-info-light); color: var(--color-info); border-color: #a5f3fc; }
.inline-select.status-arrived { background: var(--color-success-light); color: var(--color-success); border-color: #bbf7d0; }
.inline-select.status-supplement { background: var(--color-warning-light); color: var(--color-warning); border-color: #fde68a; }

.col-checknote { min-width: 0; }

.inline-textarea {
  width: 100%;
  min-height: 30px;
  padding: 5px 9px;
  font-size: 12px;
  resize: none;
  line-height: 1.4;
  border-radius: 5px;
}

.inline-textarea.missing {
  border-color: var(--color-danger);
  background: var(--color-danger-light);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.05);
}

.col-actions {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: var(--color-primary);
}

.icon-btn.danger:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.drag-ghost {
  opacity: 0.4;
  background: #dbeafe !important;
}

.drag-chosen {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.drag-dragging {
  background: #fff;
}

/* Responsive columns for check mode toggle */
.box-list-wrap:not(:has(.col-checknote)) .box-table-header,
.box-list-wrap:not(:has(.col-checknote)) .box-row {
  grid-template-columns: 40px 36px 120px 1fr 100px 72px 110px 110px 80px;
}
</style>
