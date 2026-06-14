export const STATUS_OPTIONS = [
  { value: 'pending', label: '待发出', class: 'tag-status-pending' },
  { value: 'transit', label: '在途', class: 'tag-status-transit' },
  { value: 'arrived', label: '已到达', class: 'tag-status-arrived' },
  { value: 'supplement', label: '需补充', class: 'tag-status-supplement' }
]

export const RISK_OPTIONS = [
  { value: 'low', label: '低风险', class: 'tag-risk-low' },
  { value: 'medium', label: '中风险', class: 'tag-risk-medium' },
  { value: 'high', label: '高风险', class: 'tag-risk-high' }
]

export const TIME_SLOT_OPTIONS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
  '20:00-22:00'
]

export const HIGH_RISK_THRESHOLD = 3

export const ANOMALY_TYPE_OPTIONS = [
  { value: 'duplicate-box', label: '箱号重复', class: 'tag-anomaly-danger' },
  { value: 'high-risk', label: '高风险箱', class: 'tag-anomaly-danger' },
  { value: 'missing-responsible', label: '责任人未填写', class: 'tag-anomaly-warning' },
  { value: 'missing-check-note', label: '缺核对说明', class: 'tag-anomaly-warning' },
  { value: 'supplement', label: '需补充物料', class: 'tag-anomaly-warning' },
  { value: 'site-order-gap', label: '站点顺序断档', class: 'tag-anomaly-info' },
  { value: 'high-risk-too-many', label: '高风险箱过多', class: 'tag-anomaly-warning' },
  { value: 'other', label: '其他异常', class: 'tag-anomaly-info' }
]

export const ANOMALY_STATUS_OPTIONS = [
  { value: 'pending', label: '待处理', class: 'tag-status-pending' },
  { value: 'processing', label: '处理中', class: 'tag-status-transit' },
  { value: 'resolved', label: '已解决', class: 'tag-status-arrived' },
  { value: 'ignored', label: '无需处理', class: 'tag-anomaly-ignored' }
]

export const ANOMALY_SOURCE_OPTIONS = [
  { value: 'alert', label: '告警检查' },
  { value: 'check', label: '站点核对' },
  { value: 'review', label: '站点复盘' },
  { value: 'handover', label: '交接场景' },
  { value: 'manual', label: '手动创建' }
]

export const ANOMALY_LEVEL_MAP = {
  'duplicate-box': 'danger',
  'high-risk': 'danger',
  'high-risk-too-many': 'danger',
  'missing-responsible': 'warning',
  'missing-check-note': 'warning',
  'supplement': 'warning',
  'site-order-gap': 'info',
  'other': 'info'
}
