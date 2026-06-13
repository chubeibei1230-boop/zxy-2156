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
