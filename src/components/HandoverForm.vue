<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-panel handover-modal">
      <div class="modal-header handover-header">
        <div class="header-left">
          <div class="header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <h3>{{ isReopen ? '历史交接单（快照）' : '站点交接单' }}</h3>
            <p class="header-sub">{{ siteName }} · 共 {{ activeBoxes.length }} 箱</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div class="modal-body handover-body">
        <div v-if="isReopen" class="snapshot-banner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          此为历史快照，内容为交接时的数据状态，重新保存不会更新为当前最新数据
        </div>

        <div class="summary-section">
          <div class="summary-grid">
            <div class="summary-card sc-total">
              <div class="sc-value">{{ totalCount }}</div>
              <div class="sc-label">物料箱总数</div>
            </div>
            <div class="summary-card sc-arrived">
              <div class="sc-value">{{ arrivedCount }}</div>
              <div class="sc-label">已到达</div>
            </div>
            <div class="summary-card sc-transit">
              <div class="sc-value">{{ transitCount }}</div>
              <div class="sc-label">在途</div>
            </div>
            <div class="summary-card sc-pending">
              <div class="sc-value">{{ pendingCount }}</div>
              <div class="sc-label">待发出</div>
            </div>
            <div class="summary-card sc-supplement">
              <div class="sc-value">{{ supplementCount }}</div>
              <div class="sc-label">需补充</div>
            </div>
            <div class="summary-card sc-risk">
              <div class="sc-value" :class="{ 'has-risk': highRiskCount > 0 }">{{ highRiskCount }}</div>
              <div class="sc-label">高风险箱</div>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-item">
              <span class="info-label">责任人分布</span>
              <span class="info-value">{{ responsibleDistribution }}</span>
            </div>
            <div class="info-item" v-if="supplementBoxes.length > 0">
              <span class="info-label">待补充物料</span>
              <div class="info-value supplement-list">
                <span v-for="b in supplementBoxes" :key="b.id || b.boxNumber" class="supplement-tag">
                  <span class="sup-boxno">{{ b.boxNumber || '未填' }}</span>
                  <span v-if="b.summary" class="sup-detail">{{ b.summary }}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="info-row" v-if="anomalyItems.length > 0">
            <div class="info-item anomaly-item">
              <span class="info-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                异常/告警项
              </span>
              <div class="anomaly-list">
                <span v-for="(item, idx) in anomalyItems" :key="idx" class="anomaly-tag" :class="item.level">{{ item.text }}</span>
              </div>
              <div class="anomaly-closed-loop" v-if="anomalyClosedLoopInfo.total > 0">
                <span class="closed-loop-badge closed" v-if="anomalyClosedLoopInfo.closed > 0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ anomalyClosedLoopInfo.closed }} 已闭环
                </span>
                <span class="closed-loop-badge open" v-if="anomalyClosedLoopInfo.open > 0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                  {{ anomalyClosedLoopInfo.open }} 未闭环
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-title">物料箱明细</div>
          <div class="detail-table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th class="th-boxno">箱号</th>
                  <th class="th-summary">箱内摘要</th>
                  <th class="th-time">到达时段</th>
                  <th class="th-risk">风险等级</th>
                  <th class="th-status">状态</th>
                  <th class="th-responsible">责任人</th>
                  <th class="th-checknote">核对说明</th>
                  <th class="th-remark">备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="box in activeBoxes" :key="box.id || box.boxNumber" :class="{ 'row-risk': box.riskLevel === 'high', 'row-supplement': box.status === 'supplement' }">
                  <td class="td-boxno"><span class="boxno-code">{{ box.boxNumber || '—' }}</span></td>
                  <td class="td-summary">{{ box.summary || '—' }}</td>
                  <td class="td-time">{{ box.timeSlot || '—' }}</td>
                  <td class="td-risk"><span class="tag" :class="riskClass(box.riskLevel)">{{ riskLabel(box.riskLevel) }}</span></td>
                  <td class="td-status"><span class="tag" :class="statusClass(box.status)">{{ statusLabel(box.status) }}</span></td>
                  <td class="td-responsible">{{ box.responsible || '—' }}</td>
                  <td class="td-checknote">{{ box.checkNote || '—' }}</td>
                  <td class="td-remark">{{ box.remark || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="handover-fields">
          <div class="fields-title">交接信息</div>
          <div class="fields-grid">
            <div class="form-item">
              <label>交接人</label>
              <input v-model="handoverData.handoverPerson" type="text" placeholder="填写交接人姓名" />
            </div>
            <div class="form-item">
              <label>接收人</label>
              <input v-model="handoverData.receiverPerson" type="text" placeholder="填写接收人姓名" />
            </div>
            <div class="form-item">
              <label>交接时间</label>
              <input v-model="handoverData.handoverTime" type="datetime-local" />
            </div>
            <div class="form-item full">
              <label>现场说明</label>
              <textarea v-model="handoverData.siteNote" rows="3" placeholder="现场交接情况说明、特殊事项等"></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer handover-footer">
        <button class="btn btn-secondary" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="handleSave">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          确认保存交接记录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { STATUS_OPTIONS, RISK_OPTIONS } from '../lib/constants.js'
import { isAnomalyClosed, filterAnomalies } from '../lib/anomalies.js'

const props = defineProps({
  siteName: { type: String, required: true },
  siteBoxes: { type: Array, required: true },
  existingRecord: { type: Object, default: null },
  alerts: { type: Array, default: () => [] },
  anomalies: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'save'])

const statusMap = Object.fromEntries(STATUS_OPTIONS.map(s => [s.value, s.label]))
const riskMap = Object.fromEntries(RISK_OPTIONS.map(r => [r.value, r.label]))
const riskClassMap = Object.fromEntries(RISK_OPTIONS.map(r => [r.value, r.class]))
const statusClassMap = {
  pending: 'tag-status-pending',
  transit: 'tag-status-transit',
  arrived: 'tag-status-arrived',
  supplement: 'tag-status-supplement'
}

const isReopen = computed(() => !!props.existingRecord)

const activeBoxes = computed(() => {
  if (props.existingRecord?.boxes?.length) {
    return props.existingRecord.boxes
  }
  return props.siteBoxes
})

const totalCount = computed(() => activeBoxes.value.length)
const arrivedCount = computed(() => activeBoxes.value.filter(b => b.status === 'arrived').length)
const transitCount = computed(() => activeBoxes.value.filter(b => b.status === 'transit').length)
const pendingCount = computed(() => activeBoxes.value.filter(b => b.status === 'pending').length)
const supplementCount = computed(() => activeBoxes.value.filter(b => b.status === 'supplement').length)
const highRiskCount = computed(() => activeBoxes.value.filter(b => b.riskLevel === 'high').length)

const supplementBoxes = computed(() => activeBoxes.value.filter(b => b.status === 'supplement'))

const responsibleDistribution = computed(() => {
  const map = new Map()
  activeBoxes.value.forEach(b => {
    const name = b.responsible || '未分配'
    map.set(name, (map.get(name) || 0) + 1)
  })
  return [...map.entries()].map(([name, count]) => `${name}(${count})`).join('、')
})

const anomalyItems = computed(() => {
  const items = []
  const boxes = activeBoxes.value

  const byBoxNumber = new Map()
  boxes.forEach(b => {
    const key = (b.boxNumber || '').trim().toUpperCase()
    if (!key) return
    if (!byBoxNumber.has(key)) byBoxNumber.set(key, [])
    byBoxNumber.get(key).push(b)
  })
  byBoxNumber.forEach((group) => {
    if (group.length > 1) {
      items.push({ level: 'danger', text: `箱号重复：${group[0].boxNumber} 出现 ${group.length} 次` })
    }
  })

  const ordered = boxes
    .filter(b => typeof b.orderIndex === 'number' && b.orderIndex > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex)
  if (ordered.length > 1) {
    const gaps = []
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i].orderIndex - ordered[i - 1].orderIndex > 1) {
        for (let g = ordered[i - 1].orderIndex + 1; g < ordered[i].orderIndex; g++) {
          gaps.push(g)
        }
      }
    }
    if (gaps.length > 0) {
      const gapStr = gaps.length <= 3
        ? gaps.join('、')
        : `${gaps.slice(0, 3).join('、')} 等 ${gaps.length} 个`
      items.push({ level: 'info', text: `站点顺序断档：缺号 ${gapStr}` })
    }
  }

  boxes.forEach(b => {
    if (b.riskLevel === 'high') items.push({ level: 'danger', text: `${b.boxNumber || '未填'} 高风险` })
    if (b.status === 'supplement') items.push({ level: 'warning', text: `${b.boxNumber || '未填'} 需补充` })
    if (!b.responsible || !b.responsible.trim()) items.push({ level: 'warning', text: `${b.boxNumber || '未填'} 无责任人` })
    if (b.status === 'arrived' && (!b.checkNote || !b.checkNote.trim())) items.push({ level: 'info', text: `${b.boxNumber || '未填'} 缺核对说明` })
  })

  const siteAlerts = props.alerts.filter(a => {
    if (!a.recordIds || a.recordIds.length === 0) return false
    return a.recordIds.some(rid => boxes.some(b => b.id === rid))
  })
  siteAlerts.forEach(a => {
    const alreadyAdded = items.some(i => i.text.includes(a.message))
    if (!alreadyAdded) {
      items.push({ level: a.level, text: a.message })
    }
  })

  return items
})

const anomalyClosedLoopInfo = computed(() => {
  const boxIds = new Set(activeBoxes.value.map(b => b.id).filter(Boolean))
  const related = props.anomalies.filter(a => boxIds.has(a.boxId))
  const closed = related.filter(a => isAnomalyClosed(a)).length
  const open = related.filter(a => !isAnomalyClosed(a)).length
  return { total: related.length, open, closed }
})

const handoverData = ref({
  handoverPerson: '',
  receiverPerson: '',
  handoverTime: '',
  siteNote: ''
})

watch(() => props.existingRecord, (rec) => {
  if (rec) {
    handoverData.value = {
      handoverPerson: rec.handoverPerson || '',
      receiverPerson: rec.receiverPerson || '',
      handoverTime: rec.handoverTime || '',
      siteNote: rec.siteNote || ''
    }
  }
}, { immediate: true })

function riskClass(level) {
  return riskClassMap[level] || ''
}

function riskLabel(level) {
  return riskMap[level] || '未知'
}

function statusLabel(status) {
  return statusMap[status] || '未知'
}

function statusClass(status) {
  return statusClassMap[status] || ''
}

function handleSave() {
  if (isReopen.value && props.existingRecord) {
    const rec = props.existingRecord
    const record = {
      ...rec,
      boxIds: (rec.boxIds && rec.boxIds.length ? rec.boxIds : activeBoxes.value.map(b => b.id).filter(Boolean)),
      handoverPerson: handoverData.value.handoverPerson.trim(),
      receiverPerson: handoverData.value.receiverPerson.trim(),
      handoverTime: handoverData.value.handoverTime,
      siteNote: handoverData.value.siteNote.trim()
    }
    emit('save', record)
    return
  }

  const record = {
    siteName: props.siteName,
    totalBoxes: totalCount.value,
    arrivedCount: arrivedCount.value,
    transitCount: transitCount.value,
    pendingCount: pendingCount.value,
    supplementCount: supplementCount.value,
    highRiskCount: highRiskCount.value,
    responsibleDistribution: responsibleDistribution.value,
    supplementBoxes: supplementBoxes.value.map(b => ({ boxNumber: b.boxNumber, summary: b.summary })),
    anomalyItems: anomalyItems.value,
    boxIds: activeBoxes.value.map(b => b.id).filter(Boolean),
    boxes: activeBoxes.value.map(b => ({
      id: b.id,
      boxNumber: b.boxNumber,
      summary: b.summary,
      timeSlot: b.timeSlot,
      riskLevel: b.riskLevel,
      status: b.status,
      responsible: b.responsible,
      checkNote: b.checkNote,
      remark: b.remark,
      orderIndex: b.orderIndex
    })),
    handoverPerson: handoverData.value.handoverPerson.trim(),
    receiverPerson: handoverData.value.receiverPerson.trim(),
    handoverTime: handoverData.value.handoverTime,
    siteNote: handoverData.value.siteNote.trim()
  }
  emit('save', record)
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.handover-modal {
  width: 100%;
  max-width: 1100px;
  max-height: 92vh;
}

.modal-panel {
  background: #fff;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.handover-header {
  background: linear-gradient(135deg, #1e40af, #2563eb);
  color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-header {
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.header-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.snapshot-banner {
  padding: 10px 16px;
  background: linear-gradient(90deg, #fef3c7, #fde68a);
  color: #92400e;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #fcd34d;
}

.handover-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.summary-section {
  background: #f8fafc;
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.summary-card {
  text-align: center;
  padding: 12px 8px;
  border-radius: var(--radius-sm);
  background: #fff;
  border: 1px solid #e2e8f0;
}

.sc-value {
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}

.sc-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-top: 4px;
  letter-spacing: 0.3px;
}

.sc-arrived .sc-value { color: var(--color-success); }
.sc-transit .sc-value { color: var(--color-info); }
.sc-pending .sc-value { color: #4b5563; }
.sc-supplement .sc-value { color: var(--color-warning); }
.sc-risk .sc-value.has-risk { color: var(--color-danger); }

.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-item {
  flex: 1;
  min-width: 200px;
}

.info-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}

.info-value {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
}

.supplement-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.supplement-tag {
  display: inline-flex;
  flex-direction: column;
  padding: 5px 10px;
  background: var(--color-warning-light);
  color: var(--color-warning);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  gap: 2px;
}

.sup-boxno {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.sup-detail {
  font-weight: 400;
  color: #78350f;
  font-size: 10px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anomaly-item {
  flex: 1;
  min-width: 100%;
}

.anomaly-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.anomaly-tag {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.anomaly-tag.danger {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.anomaly-tag.warning {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.anomaly-tag.info {
  background: var(--color-info-light);
  color: var(--color-info);
}

.anomaly-closed-loop {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.closed-loop-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
}

.closed-loop-badge.closed {
  color: var(--color-success);
  background: var(--color-success-light);
}

.closed-loop-badge.open {
  color: var(--color-danger);
  background: var(--color-danger-light);
}

.detail-section {
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.detail-title {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  letter-spacing: 0.3px;
}

.detail-table-wrap {
  overflow-x: auto;
  max-height: 320px;
  overflow-y: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.detail-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.detail-table th {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  text-align: left;
  letter-spacing: 0.3px;
}

.detail-table td {
  padding: 9px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #374151;
  vertical-align: middle;
}

.detail-table tr:last-child td {
  border-bottom: none;
}

.detail-table tr:hover {
  background: #f8fafc;
}

.detail-table tr.row-risk {
  background: #fef2f2;
}

.detail-table tr.row-supplement {
  background: #fffbeb;
}

.td-boxno {
  font-weight: 600;
}

.boxno-code {
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 11px;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

.row-risk .boxno-code {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.row-supplement .boxno-code {
  background: var(--color-warning-light);
  color: var(--color-warning);
}

.td-summary {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-checknote,
.td-remark {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.handover-fields {
  background: #f8fafc;
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.fields-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 14px;
  letter-spacing: 0.3px;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.form-item input,
.form-item textarea {
  width: 100%;
}

.form-item textarea {
  resize: vertical;
  min-height: 48px;
}

.handover-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .handover-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
