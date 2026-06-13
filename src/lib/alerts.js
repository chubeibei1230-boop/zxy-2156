import { HIGH_RISK_THRESHOLD } from './constants.js'

export function checkAlerts(boxes) {
  const alerts = []

  const byBoxNumber = new Map()
  boxes.forEach(box => {
    const key = (box.boxNumber || '').trim().toUpperCase()
    if (!key) return
    if (!byBoxNumber.has(key)) {
      byBoxNumber.set(key, [])
    }
    byBoxNumber.get(key).push(box)
  })
  byBoxNumber.forEach((group) => {
    if (group.length > 1) {
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
    if (!site) return
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

  const orderedBoxes = boxes
    .filter(b => typeof b.orderIndex === 'number' && b.orderIndex > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  if (orderedBoxes.length > 1) {
    const gaps = []
    const relatedIds = new Set()
    for (let i = 1; i < orderedBoxes.length; i++) {
      const prev = orderedBoxes[i - 1]
      const curr = orderedBoxes[i]
      if (curr.orderIndex - prev.orderIndex > 1) {
        for (let g = prev.orderIndex + 1; g < curr.orderIndex; g++) {
          gaps.push(g)
        }
        relatedIds.add(prev.id)
        relatedIds.add(curr.id)
      }
    }

    if (gaps.length > 0) {
      const gapStr = gaps.length <= 3
        ? gaps.join('、')
        : `${gaps.slice(0, 3).join('、')} 等 ${gaps.length} 个`
      alerts.push({
        type: 'site-order-gap',
        level: 'info',
        title: '站点顺序断档',
        message: `到达顺序缺号：${gapStr}`,
        recordIds: [...relatedIds]
      })
    }
  }

  return alerts
}
