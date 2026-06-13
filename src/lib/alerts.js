import { HIGH_RISK_THRESHOLD } from './constants.js'

export function checkAlerts(boxes) {
  const alerts = []

  const byBoxNumber = new Map()
  boxes.forEach(box => {
    const key = box.boxNumber.trim().toUpperCase()
    if (!byBoxNumber.has(key)) {
      byBoxNumber.set(key, [])
    }
    byBoxNumber.get(key).push(box)
  })
  byBoxNumber.forEach((group) => {
    if (group.length > 1 && group[0].boxNumber.trim()) {
      alerts.push({
        type: 'duplicate-box',
        level: 'danger',
        title: `箱号重复`,
        message: `箱号「${group[0].boxNumber}」出现 ${group.length} 次`,
        recordIds: group.map(b => b.id)
      })
    }
  })

  const sitesWithBoxes = new Map()
  boxes.forEach(box => {
    const site = box.siteName
    if (!sitesWithBoxes.has(site)) {
      sitesWithBoxes.set(site, [])
    }
    sitesWithBoxes.get(site).push(box)
  })

  sitesWithBoxes.forEach((siteBoxes, siteName) => {
    const highRiskCount = siteBoxes.filter(b => b.riskLevel === 'high').length
    if (highRiskCount >= HIGH_RISK_THRESHOLD) {
      alerts.push({
        type: 'high-risk-too-many',
        level: 'warning',
        title: `高风险箱过多`,
        message: `站点「${siteName}」高风险箱达 ${highRiskCount} 个（阈值 ${HIGH_RISK_THRESHOLD}）`,
        recordIds: siteBoxes.filter(b => b.riskLevel === 'high').map(b => b.id)
      })
    }
  })

  boxes.forEach(box => {
    if (!box.responsible || !box.responsible.trim()) {
      alerts.push({
        type: 'missing-responsible',
        level: 'warning',
        title: '责任人未填写',
        message: `箱号「${box.boxNumber || '未填写'}」无责任人`,
        recordIds: [box.id]
      })
    }
  })

  boxes.forEach(box => {
    if (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) {
      alerts.push({
        type: 'missing-check-note',
        level: 'warning',
        title: '已到达缺核对说明',
        message: `箱号「${box.boxNumber || '未填写'}」缺少核对说明`,
        recordIds: [box.id]
      })
    }
  })

  const sortedSites = [...sitesWithBoxes.keys()].filter(s => s && s.trim()).sort((a, b) => {
    const aBoxes = sitesWithBoxes.get(a)[0]
    const bBoxes = sitesWithBoxes.get(b)[0]
    return (aBoxes?.orderIndex || 0) - (bBoxes?.orderIndex || 0)
  })

  const siteOrder = new Map()
  sortedSites.forEach((site, idx) => {
    siteOrder.set(site, idx + 1)
  })

  const foundOrders = new Set()
  boxes.forEach(box => {
    const order = siteOrder.get(box.siteName)
    if (order) foundOrders.add(order)
  })

  if (foundOrders.size > 1) {
    const maxOrder = Math.max(...foundOrders)
    for (let i = 1; i <= maxOrder; i++) {
      if (!foundOrders.has(i)) {
        alerts.push({
          type: 'site-gap',
          level: 'info',
          title: '站点顺序断档',
          message: `第 ${i} 站未发现任何物料箱`,
          recordIds: []
        })
      }
    }
  }

  return alerts
}
