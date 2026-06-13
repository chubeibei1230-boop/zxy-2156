<template>
  <div class="modal-mask" @click.self="$emit('close')">
    <div class="modal-panel">
      <div class="modal-header">
        <h3>{{ mode === 'add' ? '新增物料箱' : '编辑物料箱' }}</h3>
        <button class="close-btn" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <form class="modal-body" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <div class="form-item">
            <label>箱号 <span class="req">*</span></label>
            <input v-model="form.boxNumber" type="text" placeholder="如：BX-A001" required />
          </div>

          <div class="form-item">
            <label>站点 <span class="req">*</span></label>
            <input v-model="form.siteName" type="text" placeholder="如：北京站" list="siteList" required />
            <datalist id="siteList">
              <option v-for="s in existingSites" :key="s" :value="s"></option>
            </datalist>
          </div>

          <div class="form-item">
            <label>到达时段</label>
            <select v-model="form.timeSlot">
              <option value="">请选择</option>
              <option v-for="t in timeSlots" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <div class="form-item">
            <label>到达顺序</label>
            <input v-model.number="form.orderIndex" type="number" min="1" />
          </div>

          <div class="form-item">
            <label>风险等级</label>
            <select v-model="form.riskLevel">
              <option v-for="r in riskOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>

          <div class="form-item">
            <label>状态</label>
            <select v-model="form.status">
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>

          <div class="form-item">
            <label>责任人</label>
            <input v-model="form.responsible" type="text" placeholder="责任人姓名" />
          </div>

          <div class="form-item full">
            <label>箱内摘要</label>
            <textarea v-model="form.summary" rows="2" placeholder="简要描述箱内物品，如：主背板、易拉宝 3 个"></textarea>
          </div>

          <div v-if="form.status === 'arrived'" class="form-item full">
            <label>核对说明</label>
            <textarea v-model="form.checkNote" rows="2" placeholder="到达核对时的备注信息"></textarea>
          </div>

          <div class="form-item full">
            <label>补充说明</label>
            <textarea v-model="form.remark" rows="2" placeholder="其他需要备注的信息"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">取消</button>
          <button type="submit" class="btn btn-primary">{{ mode === 'add' ? '添加' : '保存' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { STATUS_OPTIONS, RISK_OPTIONS, TIME_SLOT_OPTIONS } from '../lib/constants.js'

const props = defineProps({
  mode: { type: String, required: true },
  initialData: { type: Object, required: true },
  sites: { type: Array, default: () => [] },
  maxOrder: { type: Number, default: 0 }
})

const emit = defineEmits(['submit', 'close'])

const statusOptions = STATUS_OPTIONS
const riskOptions = RISK_OPTIONS
const timeSlots = TIME_SLOT_OPTIONS

const existingSites = computed(() => props.sites)

const form = ref({ ...props.initialData })

watch(() => props.initialData, (v) => {
  form.value = { ...v }
}, { deep: true })

function handleSubmit() {
  if (!form.value.boxNumber.trim() || !form.value.siteName.trim()) {
    alert('请填写必填项：箱号和站点')
    return
  }
  if (mode.value === 'add' && !form.value.orderIndex) {
    form.value.orderIndex = props.maxOrder + 1
  }
  emit('submit', { ...form.value }, props.mode)
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

.modal-panel {
  background: #fff;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
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

.modal-header {
  padding: 18px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.15s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
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

.req {
  color: var(--color-danger);
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
}

.form-item textarea {
  resize: vertical;
  min-height: 48px;
}

.modal-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
