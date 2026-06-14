<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-panel anomaly-modal">
      <div class="modal-header anomaly-header" :class="anomalyData.level">
        <div class="header-left">
          <div class="header-icon">
            <svg v-if="anomalyData.level === 'danger'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <svg v-else-if="anomalyData.level === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <h3>{{ mode === 'create' ? '创建异常项' : '处理异常项' }}</h3>
            <p class="header-sub">{{ anomalyData.typeLabel }} · {{ anomalyData.boxNumber || '关联箱体' }}</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="modal-body anomaly-body">
        <div class="anomaly-info-card" :class="anomalyData.level">
          <div class="info-row">
            <span class="info-label">异常标题</span>
            <span class="info-value">{{ anomalyData.title }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">详细描述</span>
            <span class="info-value">{{ anomalyData.description }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">关联站点</span>
            <span class="info-value">{{ anomalyData.siteName }}</span>
          </div>
          <div class="info-row" v-if="anomalyData.responsible">
            <span class="info-label">原始责任人</span>
            <span class="info-value">{{ anomalyData.responsible }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">来源</span>
            <span class="info-value">{{ anomalyData.sourceLabel }}</span>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            处理信息
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label>处理人 <span class="required">*</span></label>
              <input
                v-model="formData.handler"
                type="text"
                placeholder="请填写处理人姓名"
                :disabled="isReadOnly"
              />
            </div>

            <div class="form-item">
              <label>处理状态 <span class="required">*</span></label>
              <select v-model="formData.status" :disabled="isReadOnly">
                <option v-for="s in statusOptions" :key="s.value" :value="s.value">
                  {{ s.label }}
                </option>
              </select>
            </div>

            <div class="form-item">
              <label>计划完成时间</label>
              <input
                v-model="formData.planDate"
                type="datetime-local"
                :disabled="isReadOnly"
              />
            </div>

            <div class="form-item full">
              <label>处理说明</label>
              <textarea
                v-model="formData.processNote"
                rows="3"
                placeholder="请填写处理过程说明"
                :disabled="isReadOnly"
              ></textarea>
            </div>

            <div class="form-item full" v-if="formData.status === 'resolved' || formData.status === 'ignored'">
              <label>处理结果 <span class="required" v-if="formData.status === 'resolved'">*</span></label>
              <textarea
                v-model="formData.result"
                rows="3"
                placeholder="请填写最终处理结果"
                :disabled="isReadOnly"
              ></textarea>
            </div>
          </div>
        </div>

        <div class="form-section" v-if="anomalyData.history && anomalyData.history.length > 0">
          <div class="section-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            历史处理记录
          </div>

          <div class="history-list">
            <div
              v-for="(entry, idx) in sortedHistory"
              :key="idx"
              class="history-item"
            >
              <div class="history-time">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ formatTime(entry.timestamp) }}
              </div>
              <div class="history-content">
                <div class="history-remark">{{ entry.remark }}</div>
                <div class="history-changes">
                  <span v-if="entry.oldStatus !== entry.newStatus" class="change-tag">
                    状态: {{ getStatusLabel(entry.oldStatus) }} → {{ getStatusLabel(entry.newStatus) }}
                  </span>
                  <span v-if="entry.oldHandler !== entry.newHandler" class="change-tag">
                    处理人: {{ entry.oldHandler || '未设置' }} → {{ entry.newHandler || '未设置' }}
                  </span>
                  <span v-if="entry.oldPlanDate !== entry.newPlanDate" class="change-tag">
                    计划时间: {{ entry.oldPlanDate || '未设置' }} → {{ entry.newPlanDate || '未设置' }}
                  </span>
                </div>
                <div class="history-details" v-if="entry.newProcessNote">
                  <span class="detail-label">处理说明:</span>
                  <span class="detail-value">{{ entry.newProcessNote }}</span>
                </div>
                <div class="history-details" v-if="entry.newResult">
                  <span class="detail-label">处理结果:</span>
                  <span class="detail-value">{{ entry.newResult }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer anomaly-footer">
        <button class="btn btn-secondary" @click="$emit('close')">
          {{ isReadOnly ? '关闭' : '取消' }}
        </button>
        <button
          v-if="!isReadOnly"
          class="btn btn-primary"
          :disabled="!canSubmit"
          @click="handleSave"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          {{ mode === 'create' ? '创建异常项' : '保存处理记录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  ANOMALY_STATUS_OPTIONS,
  ANOMALY_TYPE_OPTIONS,
  ANOMALY_SOURCE_OPTIONS
} from '../lib/constants.js'

const props = defineProps({
  mode: { type: String, default: 'edit' },
  anomalyData: { type: Object, required: true },
  isReadOnly: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'save'])

const statusOptions = ANOMALY_STATUS_OPTIONS

const formData = ref({
  handler: props.anomalyData.handler || '',
  status: props.anomalyData.status || 'pending',
  planDate: props.anomalyData.planDate || '',
  processNote: props.anomalyData.processNote || '',
  result: props.anomalyData.result || ''
})

const anomalyData = computed(() => ({
  ...props.anomalyData,
  typeLabel: ANOMALY_TYPE_OPTIONS.find(o => o.value === props.anomalyData.type)?.label || props.anomalyData.type,
  sourceLabel: ANOMALY_SOURCE_OPTIONS.find(o => o.value === props.anomalyData.source)?.label || props.anomalyData.source
}))

const sortedHistory = computed(() => {
  if (!anomalyData.value.history) return []
  return [...anomalyData.value.history].sort((a, b) => b.timestamp - a.timestamp)
})

const canSubmit = computed(() => {
  if (props.isReadOnly) return false
  if (!formData.value.handler.trim()) return false
  if (formData.value.status === 'resolved' && !formData.value.result?.trim()) return false
  return true
})

function getStatusLabel(status) {
  const opt = ANOMALY_STATUS_OPTIONS.find(o => o.value === status)
  return opt ? opt.label : status
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function handleSave() {
  if (!canSubmit.value) return

  const updates = {
    handler: formData.value.handler.trim(),
    status: formData.value.status,
    planDate: formData.value.planDate,
    processNote: formData.value.processNote.trim(),
    result: formData.value.result.trim(),
    historyRemark: props.mode === 'create' ? '创建异常项' : '更新处理记录'
  }

  emit('save', updates)
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

.anomaly-modal {
  width: 100%;
  max-width: 720px;
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

.anomaly-header.danger {
  background: linear-gradient(135deg, #991b1b, #dc2626);
  color: #fff;
}

.anomaly-header.warning {
  background: linear-gradient(135deg, #92400e, #d97706);
  color: #fff;
}

.anomaly-header.info {
  background: linear-gradient(135deg, #155e75, #0891b2);
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

.anomaly-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.anomaly-info-card {
  background: #f8fafc;
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid #e2e8f0;
}

.anomaly-info-card.danger {
  background: #fef2f2;
  border-color: #fecaca;
}

.anomaly-info-card.warning {
  background: #fffbeb;
  border-color: #fde68a;
}

.anomaly-info-card.info {
  background: #f0fdfa;
  border-color: #99f6e4;
}

.info-row {
  display: flex;
  gap: 12px;
  padding: 6px 0;
  font-size: 13px;
}

.info-label {
  min-width: 80px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.info-value {
  flex: 1;
  color: #374151;
  line-height: 1.5;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.required {
  color: var(--color-danger);
  margin-left: 2px;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: var(--radius-sm);
  background: #fff;
  transition: all 0.15s;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-item textarea {
  resize: vertical;
  min-height: 60px;
}

.form-item input:disabled,
.form-item select:disabled,
.form-item textarea:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 12px 14px;
  background: #fafafa;
  border-radius: var(--radius-sm);
  border: 1px solid #e5e7eb;
}

.history-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 6px;
}

.history-remark {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}

.history-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.change-tag {
  padding: 2px 8px;
  background: #eff6ff;
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.history-details {
  display: flex;
  gap: 6px;
  font-size: 12px;
  margin-top: 2px;
}

.detail-label {
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
}

.detail-value {
  color: #374151;
  line-height: 1.5;
}

.anomaly-footer {
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .anomaly-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
