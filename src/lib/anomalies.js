import { ANOMALY_LEVEL_MAP } from './constants.js'
import { checkAlerts } from './alerts.js'

export function generateAnomaliesFromBoxes(boxes, source = 'check') {
  const anomalies = []
  const timestamp = Date.now()

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
      group.forEach(box => {
        anomalies.push({
          type: 'duplicate-box',
          level: ANOMALY_LEVEL_MAP['duplicate-box'],
          title: '箱号重复',
          description: `箱号「${box.boxNumber}」在本系统中出现 ${group.length} 次`,
          boxId: box.id,
          boxNumber: box.boxNumber,
          siteName: box.siteName,
          responsible: box.responsible || '',
          source: source,
          status: 'pending',
          handler: '',
          processNote: '',
          planDate: '',
          result: '',
          createdAt: timestamp,
          updatedAt: timestamp,
          history: []
        })
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

  const HIGH_RISK_THRESHOLD = 3
  sitesWithBoxes.forEach((siteBoxes, siteName) => {
    const highRiskCount = siteBoxes.filter(b => b.riskLevel === 'high').length
    if (highRiskCount >= HIGH_RISK_THRESHOLD) {
      siteBoxes.filter(b => b.riskLevel === 'high').forEach(box => {
        anomalies.push({
          type: 'high-risk-too-many',
          level: ANOMALY_LEVEL_MAP['high-risk-too-many'],
          title: '高风险箱过多',
          description: `站点「${siteName}」高风险箱达 ${highRiskCount} 个（阈值 ${HIGH_RISK_THRESHOLD}）`,
          boxId: box.id,
          boxNumber: box.boxNumber,
          siteName: siteName,
          responsible: box.responsible || '',
          source: source,
          status: 'pending',
          handler: '',
          processNote: '',
          planDate: '',
          result: '',
          createdAt: timestamp,
          updatedAt: timestamp,
          history: []
        })
      })
    }
  })

  boxes.forEach(box => {
    if (box.riskLevel === 'high') {
      anomalies.push({
        type: 'high-risk',
        level: ANOMALY_LEVEL_MAP['high-risk'],
        title: '高风险箱',
        description: `箱号「${box.boxNumber || '未填写'}」为高风险物料箱`,
        boxId: box.id,
        boxNumber: box.boxNumber,
        siteName: box.siteName,
        responsible: box.responsible || '',
        source: source,
        status: 'pending',
        handler: '',
        processNote: '',
        planDate: '',
        result: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: []
      })
    }

    if (box.status === 'supplement') {
      anomalies.push({
        type: 'supplement',
        level: ANOMALY_LEVEL_MAP['supplement'],
        title: '需补充物料',
        description: `箱号「${box.boxNumber || '未填写'}」需补充物料：${box.remark || box.summary || ''}`,
        boxId: box.id,
        boxNumber: box.boxNumber,
        siteName: box.siteName,
        responsible: box.responsible || '',
        source: source,
        status: 'pending',
        handler: '',
        processNote: '',
        planDate: '',
        result: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: []
      })
    }

    if (!box.responsible || !box.responsible.trim()) {
      anomalies.push({
        type: 'missing-responsible',
        level: ANOMALY_LEVEL_MAP['missing-responsible'],
        title: '责任人未填写',
        description: `箱号「${box.boxNumber || '未填写'}」未指定责任人`,
        boxId: box.id,
        boxNumber: box.boxNumber,
        siteName: box.siteName,
        responsible: '',
        source: source,
        status: 'pending',
        handler: '',
        processNote: '',
        planDate: '',
        result: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: []
      })
    }

    if (box.status === 'arrived' && (!box.checkNote || !box.checkNote.trim())) {
      anomalies.push({
        type: 'missing-check-note',
        level: ANOMALY_LEVEL_MAP['missing-check-note'],
        title: '已到达缺核对说明',
        description: `箱号「${box.boxNumber || '未填写'}」已到达但缺少核对说明`,
        boxId: box.id,
        boxNumber: box.boxNumber,
        siteName: box.siteName,
        responsible: box.responsible || '',
        source: source,
        status: 'pending',
        handler: '',
        processNote: '',
        planDate: '',
        result: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: []
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
      relatedIds.forEach(boxId => {
        const box = boxes.find(b => b.id === boxId)
        if (box) {
          anomalies.push({
            type: 'site-order-gap',
            level: ANOMALY_LEVEL_MAP['site-order-gap'],
            title: '站点顺序断档',
            description: `到达顺序缺号：${gapStr}`,
            boxId: box.id,
            boxNumber: box.boxNumber,
            siteName: box.siteName,
            responsible: box.responsible || '',
            source: source,
            status: 'pending',
            handler: '',
            processNote: '',
            planDate: '',
            result: '',
            createdAt: timestamp,
            updatedAt: timestamp,
            history: []
          })
        }
      })
    }
  }

  return anomalies
}

export function generateAnomaliesFromAlerts(alerts, boxes) {
  const anomalies = []
  const timestamp = Date.now()

  alerts.forEach(alert => {
    if (!alert.recordIds || alert.recordIds.length === 0) return

    alert.recordIds.forEach(boxId => {
      const box = boxes.find(b => b.id === boxId)
      if (!box) return

      anomalies.push({
        type: alert.type,
        level: alert.level === 'danger' ? 'danger' : (alert.level === 'warning' ? 'warning' : 'info'),
        title: alert.title,
        description: alert.message,
        boxId: box.id,
        boxNumber: box.boxNumber,
        siteName: box.siteName,
        responsible: box.responsible || '',
        source: 'alert',
        status: 'pending',
        handler: '',
        processNote: '',
        planDate: '',
        result: '',
        createdAt: timestamp,
        updatedAt: timestamp,
        history: []
      })
    })
  })

  return anomalies
}

export function filterAnomalies(anomalies, filters) {
  let result = [...anomalies]

  if (filters.siteName) {
    result = result.filter(a => a.siteName === filters.siteName)
  }
  if (filters.responsible) {
    result = result.filter(a => a.responsible === filters.responsible)
  }
  if (filters.handler) {
    result = result.filter(a => a.handler === filters.handler)
  }
  if (filters.type) {
    result = result.filter(a => a.type === filters.type)
  }
  if (filters.status) {
    result = result.filter(a => a.status === filters.status)
  }
  if (filters.level) {
    result = result.filter(a => a.level === filters.level)
  }
  if (filters.source) {
    result = result.filter(a => a.source === filters.source)
  }
  if (filters.boxId) {
    result = result.filter(a => a.boxId === filters.boxId)
  }
  if (filters.handoverId) {
    result = result.filter(a => a.handoverId === filters.handoverId)
  }

  return result
}

export function getAnomalyStats(anomalies) {
  const stats = {
    total: anomalies.length,
    pending: 0,
    processing: 0,
    resolved: 0,
    ignored: 0,
    danger: 0,
    warning: 0,
    info: 0,
    closed: 0,
    open: 0
  }

  anomalies.forEach(a => {
    if (a.status === 'pending') stats.pending++
    else if (a.status === 'processing') stats.processing++
    else if (a.status === 'resolved') stats.resolved++
    else if (a.status === 'ignored') stats.ignored++

    if (a.level === 'danger') stats.danger++
    else if (a.level === 'warning') stats.warning++
    else if (a.level === 'info') stats.info++

    if (a.status === 'resolved' || a.status === 'ignored') stats.closed++
    else stats.open++
  })

  return stats
}

export function isAnomalyClosed(anomaly) {
  return anomaly.status === 'resolved' || anomaly.status === 'ignored'
}

export function hasOpenAnomaliesForBox(anomalies, boxId) {
  return anomalies.some(a => a.boxId === boxId && !isAnomalyClosed(a))
}

export function hasOpenAnomaliesForSite(anomalies, siteName) {
  return anomalies.some(a => a.siteName === siteName && !isAnomalyClosed(a))
}

export function hasOpenAnomaliesForHandover(anomalies, handoverId) {
  return anomalies.some(a => a.handoverId === handoverId && !isAnomalyClosed(a))
}

export function getBoxAnomalyStatus(anomalies, boxId) {
  const boxAnomalies = anomalies.filter(a => a.boxId === boxId)
  if (boxAnomalies.length === 0) return 'none'

  const hasOpen = boxAnomalies.some(a => !isAnomalyClosed(a))
  if (!hasOpen) return 'all-closed'

  const hasDanger = boxAnomalies.some(a => a.level === 'danger' && !isAnomalyClosed(a))
  if (hasDanger) return 'has-danger'

  const hasWarning = boxAnomalies.some(a => a.level === 'warning' && !isAnomalyClosed(a))
  if (hasWarning) return 'has-warning'

  return 'has-info'
}

export function getSiteAnomalyStatus(anomalies, siteName) {
  const siteAnomalies = anomalies.filter(a => a.siteName === siteName)
  if (siteAnomalies.length === 0) return 'none'

  const hasOpen = siteAnomalies.some(a => !isAnomalyClosed(a))
  if (!hasOpen) return 'all-closed'

  const hasDanger = siteAnomalies.some(a => a.level === 'danger' && !isAnomalyClosed(a))
  if (hasDanger) return 'has-danger'

  const hasWarning = siteAnomalies.some(a => a.level === 'warning' && !isAnomalyClosed(a))
  if (hasWarning) return 'has-warning'

  return 'has-info'
}

export function deduplicateAnomalies(newAnomalies, existingAnomalies) {
  const existingKeys = new Set()
  existingAnomalies.forEach(a => {
    if (!isAnomalyClosed(a)) {
      const key = `${a.type}-${a.boxId}`
      existingKeys.add(key)
    }
  })

  return newAnomalies.filter(a => {
    const key = `${a.type}-${a.boxId}`
    return !existingKeys.has(key)
  })
}

export async function createAnomaliesFromAlert(alert, boxes, AnomalyDB) {
  const anomalies = generateAnomaliesFromAlerts([alert], boxes)
  const existingAnomalies = await AnomalyDB.getAll()
  const newAnomalies = deduplicateAnomalies(anomalies, existingAnomalies)

  if (newAnomalies.length > 0) {
    return AnomalyDB.bulkAdd(newAnomalies)
  }
  return []
}

export async function createAnomaliesForSite(siteName, boxes, source, AnomalyDB) {
  const siteBoxes = boxes.filter(b => b.siteName === siteName)
  const anomalies = generateAnomaliesFromBoxes(siteBoxes, source)
  const existingAnomalies = await AnomalyDB.getAll()
  const newAnomalies = deduplicateAnomalies(anomalies, existingAnomalies)

  if (newAnomalies.length > 0) {
    return AnomalyDB.bulkAdd(newAnomalies)
  }
  return []
}

export async function createAnomaliesForHandover(handoverRecord, boxes, AnomalyDB) {
  const handoverBoxIds = handoverRecord.boxIds || []
  const handoverBoxes = boxes.filter(b => handoverBoxIds.includes(b.id))
  const anomalies = generateAnomaliesFromBoxes(handoverBoxes, 'handover')

  anomalies.forEach(a => {
    a.handoverId = handoverRecord.id
  })

  const existingAnomalies = await AnomalyDB.getAll()
  const existingKeys = new Set()
  existingAnomalies.forEach(a => {
    if (!isAnomalyClosed(a) && a.handoverId === handoverRecord.id) {
      const key = `${a.type}-${a.boxId}-${a.handoverId}`
      existingKeys.add(key)
    }
  })

  const newAnomalies = anomalies.filter(a => {
    const key = `${a.type}-${a.boxId}-${a.handoverId}`
    return !existingKeys.has(key)
  })

  if (newAnomalies.length > 0) {
    return AnomalyDB.bulkAdd(newAnomalies)
  }
  return []
}

export function formatAnomalyType(type, ANOMALY_TYPE_OPTIONS) {
  const option = ANOMALY_TYPE_OPTIONS.find(o => o.value === type)
  return option ? option.label : type
}

export function formatAnomalyStatus(status, ANOMALY_STATUS_OPTIONS) {
  const option = ANOMALY_STATUS_OPTIONS.find(o => o.value === status)
  return option ? option.label : status
}

export function formatAnomalySource(source, ANOMALY_SOURCE_OPTIONS) {
  const option = ANOMALY_SOURCE_OPTIONS.find(o => o.value === source)
  return option ? option.label : source
}
