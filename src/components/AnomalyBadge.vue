<template>
  <span
    v-if="status !== 'none'"
    class="anomaly-badge"
    :class="[status, size]"
    :title="title"
    @click.stop="$emit('click', $event)"
  >
    <svg v-if="status === 'has-danger'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
    </svg>
    <svg v-else-if="status === 'has-warning'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
    </svg>
    <svg v-else-if="status === 'has-info'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <svg v-else-if="status === 'all-closed'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
    <span v-if="count !== undefined && count !== null" class="badge-count">{{ count }}</span>
  </span>
</template>

<script setup>
defineProps({
  status: {
    type: String,
    default: 'none',
    validator: (v) => ['none', 'has-danger', 'has-warning', 'has-info', 'all-closed'].includes(v)
  },
  count: {
    type: Number,
    default: null
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

defineEmits(['click'])
</script>

<style scoped>
.anomaly-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 4px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.anomaly-badge.sm {
  width: 18px;
  height: 18px;
  font-size: 10px;
}

.anomaly-badge.md {
  width: 22px;
  height: 22px;
  font-size: 11px;
}

.anomaly-badge.lg {
  width: 26px;
  height: 26px;
  font-size: 12px;
}

.anomaly-badge.has-danger {
  background: var(--color-danger);
  color: #fff;
  animation: pulse-danger 2s ease-in-out infinite;
}

.anomaly-badge.has-warning {
  background: var(--color-warning);
  color: #fff;
}

.anomaly-badge.has-info {
  background: var(--color-info);
  color: #fff;
}

.anomaly-badge.all-closed {
  background: var(--color-success);
  color: #fff;
}

.anomaly-badge:hover {
  transform: scale(1.1);
}

.badge-count {
  line-height: 1;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
}
</style>
