<template>
  <div class="app-root">
    <header class="app-header">
      <div class="header-inner">
        <div class="brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h1 class="brand-title">巡展物料箱路线核对</h1>
            <p class="brand-sub">Exhibition Material Route Tracker</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" :class="{ active: anomalyView }" @click="anomalyView ? closeAnomalyList() : openAnomalyList()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
            </svg>
            {{ anomalyView ? '返回主视图' : '异常处理' }}
            <span v-if="openAnomalyCount > 0" class="anomaly-count">{{ openAnomalyCount }}</span>
          </button>
          <button class="btn btn-secondary" :class="{ active: reviewView }" @click="reviewView ? closeReview() : openReviewDashboard()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M7 14l4-4 4 4 5-5"/>
            </svg>
            {{ reviewView ? '返回主视图' : '站点复盘看板' }}
          </button>
          <button class="btn btn-secondary" @click="toggleCheckMode">
            {{ checkMode ? '退出核对模式' : '进入站点核对模式' }}
          </button>
          <button class="btn btn-secondary" @click="toggleHandoverHistory" :class="{ active: showHandoverHistory }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            交接记录
            <span v-if="handoverRecords.length > 0" class="handover-count">{{ handoverRecords.length }}</span>
          </button>
          <button class="btn btn-secondary" @click="loadSeedData" title="加载演示数据">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
            演示数据
          </button>
        </div>
      </div>
    </header>

    <RouteProgress
      v-if="!reviewView && !anomalyView"
      :boxes="boxes"
      :anomalies="anomalies"
      :active-site="checkMode ? checkSite : null"
      @select-site="handleSelectSite"
      @handover="openHandoverForm"
      @create-anomalies="handleCreateAnomaliesForSite"
    />

    <div v-if="anomalyView" class="main-content">
      <div class="content-left full">
        <AnomalyList
          :anomalies="anomalies"
          :boxes="boxes"
          :initial-filter="anomalyListFilter"
          @back="closeAnomalyList"
          @refresh="loadAnomalies"
          @update="handleAnomalyUpdate"
          @locate-box="handleLocateBoxFromAnomaly"
        />
      </div>
    </div>

    <div v-else-if="reviewView === 'dashboard'" class="main-content">
      <div class="content-left full">
        <SiteReviewDashboard
          :boxes="filteredBoxesForReview"
          :all-boxes="boxes"
          :anomalies="anomalies"
          :handover-records="handoverRecords"
          :applied-filters="filters"
          @back="closeReview"
          @select-site="openReviewDetail"
          @create-anomalies="handleCreateAnomaliesForSite"
          @open-anomaly-list="openAnomalyListWithFilter"
        />
      </div>
    </div>

    <div v-else-if="reviewView === 'detail'" class="main-content">
      <div class="content-left full">
        <SiteReviewDetail
          :site-name="reviewSiteName"
          :boxes="boxes"
          :filtered-boxes="filteredBoxesForReview"
          :anomalies="anomalies"
          :handover-records="handoverRecords"
          @back="backToReviewDashboard"
          @handover="openHandoverForm"
          @reopen-handover="handleReopenHandover"
          @create-anomalies="handleCreateAnomaliesForSite"
          @open-anomaly-list="openAnomalyListWithFilter"
        />
      </div>
    </div>

    <div v-else class="main-content" :class="{ 'with-side-panel': showAlertPanel || showHandoverHistory }">
      <div class="content-left" :class="{ full: !showAlertPanel && !showHandoverHistory }">
        <FilterBar
          v-model:filters="filters"
          :boxes="boxes"
          :selected-ids="selectedIds"
          :check-mode="checkMode"
          :check-site="checkSite"
          @batch-update="handleBatchUpdate"
          @clear-selection="clearSelection"
          @add-box="openAddForm"
          @copy-last="handleCopyLastSite"
          @toggle-alert="showAlertPanel = !showAlertPanel"
          :alert-count="alerts.length"
          @create-anomalies="handleCreateAnomaliesForCheckSite"
        />

        <SiteCheckHeader
          v-if="checkMode"
          :site-boxes="currentCheckBoxes"
          :site-name="checkSite"
          :anomalies="anomalies"
          @handover="openHandoverForm"
          @create-anomalies="handleCreateAnomaliesForCheckSite"
        />

        <BoxList
          ref="boxListRef"
          :boxes="displayedBoxes"
          :selected-ids="selectedIds"
          :check-mode="checkMode"
          :highlight-ids="highlightIds"
          :anomalies="anomalies"
          @select="toggleSelect"
          @select-all="toggleSelectAll"
          @update="handleUpdateBox"
          @remove="handleRemoveBox"
          @edit="openEditForm"
          @reorder="handleReorder"
          @handover="openHandoverForm"
          @open-anomaly="handleOpenAnomalyForBox"
        />
      </div>

      <AlertPanel
        v-if="showAlertPanel"
        :alerts="alerts"
        :anomalies="anomalies"
        @locate="handleLocateRecord"
        @create-anomaly="handleCreateAnomalyFromAlert"
        @open-anomaly-list="openAnomalyListWithFilter"
        @close="showAlertPanel = false"
      />

      <HandoverHistory
        v-if="showHandoverHistory"
        :records="handoverRecords"
        :anomalies="anomalies"
        @reopen="handleReopenHandover"
        @delete="handleDeleteHandover"
        @close="showHandoverHistory = false"
        @create-anomalies="handleCreateAnomaliesForHandover"
        @open-anomaly-list="openAnomalyListWithFilter"
      />
    </div>

    <BoxFormModal
      v-if="formVisible"
      :mode="formMode"
      :initial-data="formData"
      :sites="siteList"
      :max-order="maxOrderIndex"
      @submit="handleFormSubmit"
      @close="formVisible = false"
    />

    <HandoverForm
      v-if="handoverFormVisible"
      :site-name="handoverSiteName"
      :site-boxes="handoverSiteBoxes"
      :existing-record="handoverExistingRecord"
      :alerts="alerts"
      :anomalies="anomalies"
      @save="handleSaveHandover"
      @close="handoverFormVisible = false"
    />

    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { BoxDB, SiteDB, HandoverDB, AnomalyDB } from './lib/db.js'
import { checkAlerts } from './lib/alerts.js'
import { seedDemoData } from './lib/seed.js'
import {
  createAnomaliesFromAlert,
  createAnomaliesForSite,
  createAnomaliesForHandover,
  getAnomalyStats,
  isAnomalyClosed
} from './lib/anomalies.js'
import RouteProgress from './components/RouteProgress.vue'
import FilterBar from './components/FilterBar.vue'
import BoxList from './components/BoxList.vue'
import AlertPanel from './components/AlertPanel.vue'
import BoxFormModal from './components/BoxFormModal.vue'
import SiteCheckHeader from './components/SiteCheckHeader.vue'
import HandoverForm from './components/HandoverForm.vue'
import HandoverHistory from './components/HandoverHistory.vue'
import SiteReviewDashboard from './components/SiteReviewDashboard.vue'
import SiteReviewDetail from './components/SiteReviewDetail.vue'
import AnomalyList from './components/AnomalyList.vue'
import AnomalyFormModal from './components/AnomalyFormModal.vue'

const loading = ref(false)
const boxes = ref([])
const anomalies = ref([])
const selectedIds = ref(new Set())
const highlightIds = ref([])
const showAlertPanel = ref(true)
const checkMode = ref(false)
const checkSite = ref('')
const boxListRef = ref(null)
const reviewView = ref(null)
const reviewSiteName = ref('')
const anomalyView = ref(false)
const anomalyListFilter = ref({})

const filters = ref({
  siteName: '',
  responsible: '',
  status: '',
  riskLevel: ''
})

const formVisible = ref(false)
const formMode = ref('add')
const formData = ref(null)

const handoverFormVisible = ref(false)
const handoverSiteName = ref('')
const handoverExistingRecord = ref(null)
const showHandoverHistory = ref(false)
const handoverRecords = ref([])

const alerts = computed(() => checkAlerts(boxes.value))

const openAnomalyCount = computed(() => {
  return anomalies.value.filter(a => !isAnomalyClosed(a)).length
})

const anomalyStats = computed(() => getAnomalyStats(anomalies.value))

const siteList = computed(() => {
  const set = new Set()
  boxes.value.forEach(b => b.siteName && set.add(b.siteName))
  return [...set].sort((a, b) => {
    const aBox = boxes.value.find(x => x.siteName === a)
    const bBox = boxes.value.find(x => x.siteName === b)
    return (aBox?.orderIndex || 0) - (bBox?.orderIndex || 0)
  })
})

const maxOrderIndex = computed(() => {
  if (boxes.value.length === 0) return 0
  return Math.max(...boxes.value.map(b => b.orderIndex || 0))
})

const displayedBoxes = computed(() => {
  let list = [...boxes.value]

  if (checkMode.value && checkSite.value) {
    list = list.filter(b => b.siteName === checkSite.value)
  } else {
    if (filters.value.siteName) list = list.filter(b => b.siteName === filters.value.siteName)
    if (filters.value.responsible) list = list.filter(b => b.responsible === filters.value.responsible)
    if (filters.value.status) list = list.filter(b => b.status === filters.value.status)
    if (filters.value.riskLevel) list = list.filter(b => b.riskLevel === filters.value.riskLevel)
  }

  list.sort((a, b) => {
    const sOrder = (a.siteOrder ?? 0) - (b.siteOrder ?? 0)
    if (sOrder !== 0) return sOrder
    return (a.orderIndex || 0) - (b.orderIndex || 0)
  })

  return list
})

const filteredBoxesForReview = computed(() => {
  let list = [...boxes.value]
  if (filters.value.siteName) list = list.filter(b => b.siteName === filters.value.siteName)
  if (filters.value.responsible) list = list.filter(b => b.responsible === filters.value.responsible)
  if (filters.value.status) list = list.filter(b => b.status === filters.value.status)
  if (filters.value.riskLevel) list = list.filter(b => b.riskLevel === filters.value.riskLevel)
  list.sort((a, b) => {
    const sOrder = (a.siteOrder ?? 0) - (b.siteOrder ?? 0)
    if (sOrder !== 0) return sOrder
    return (a.orderIndex || 0) - (b.orderIndex || 0)
  })
  return list
})

const currentCheckBoxes = computed(() => {
  if (!checkMode.value || !checkSite.value) return []
  return boxes.value.filter(b => b.siteName === checkSite.value)
})

const handoverSiteBoxes = computed(() => {
  if (!handoverSiteName.value) return []
  return boxes.value.filter(b => b.siteName === handoverSiteName.value)
})

function assignSiteOrder() {
  const sites = new Map()
  const boxesBySite = new Map()
  boxes.value.forEach(box => {
    if (!boxesBySite.has(box.siteName)) boxesBySite.set(box.siteName, [])
    boxesBySite.get(box.siteName).push(box)
  })
  const sortedSites = [...boxesBySite.entries()].sort((a, b) => {
    return (a[1][0]?.orderIndex || 0) - (b[1][0]?.orderIndex || 0)
  })
  sortedSites.forEach(([site], idx) => {
    sites.set(site, idx + 1)
  })
  boxes.value.forEach(box => {
    box.siteOrder = sites.get(box.siteName) || 0
  })
}

async function loadAll() {
  loading.value = true
  try {
    boxes.value = await BoxDB.getAll()
    assignSiteOrder()
    anomalies.value = await AnomalyDB.getAll()
  } finally {
    loading.value = false
  }
}

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

function toggleSelectAll(ids) {
  const current = selectedIds.value
  const allSelected = ids.length > 0 && ids.every(id => current.has(id))
  const next = new Set(current)
  if (allSelected) {
    ids.forEach(id => next.delete(id))
  } else {
    ids.forEach(id => next.add(id))
  }
  selectedIds.value = next
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function handleUpdateBox(id, updates) {
  await BoxDB.update(id, updates)
  const idx = boxes.value.findIndex(b => b.id === id)
  if (idx > -1) {
    boxes.value[idx] = { ...boxes.value[idx], ...updates, updatedAt: Date.now() }
    assignSiteOrder()
  }
}

async function handleRemoveBox(id) {
  if (!confirm('确认删除这条物料箱记录？')) return
  await BoxDB.remove(id)
  boxes.value = boxes.value.filter(b => b.id !== id)
  const next = new Set(selectedIds.value)
  next.delete(id)
  selectedIds.value = next
  assignSiteOrder()
}

function openAddForm() {
  formMode.value = 'add'
  formData.value = {
    boxNumber: '',
    siteName: filters.value.siteName || checkSite.value || (siteList.value[0] ?? ''),
    orderIndex: maxOrderIndex.value + 1,
    summary: '',
    timeSlot: '',
    riskLevel: 'low',
    responsible: '',
    status: 'pending',
    checkNote: '',
    remark: ''
  }
  formVisible.value = true
}

function openEditForm(box) {
  formMode.value = 'edit'
  formData.value = { ...box }
  formVisible.value = true
}

async function handleFormSubmit(data, mode) {
  if (mode === 'add') {
    const newBox = await BoxDB.add(data)
    boxes.value.push(newBox)
  } else {
    const updated = await BoxDB.update(data.id, data)
    const idx = boxes.value.findIndex(b => b.id === data.id)
    if (idx > -1) {
      boxes.value[idx] = updated
    }
  }
  assignSiteOrder()
  formVisible.value = false
}

async function handleBatchUpdate(status) {
  const ids = [...selectedIds.value]
  if (ids.length === 0) return
  const updatedList = await BoxDB.bulkUpdate(ids, { status })
  updatedList.forEach(updated => {
    const idx = boxes.value.findIndex(b => b.id === updated.id)
    if (idx > -1) {
      boxes.value[idx] = updated
    }
  })
}

async function handleCopyLastSite() {
  const sites = siteList.value
  if (sites.length < 1) {
    alert('暂无站点，无法复制')
    return
  }
  const targetSite = filters.value.siteName || checkSite.value || sites[sites.length - 1]
  const targetIdx = sites.indexOf(targetSite)
  if (targetIdx <= 0) {
    alert('当前站点是第一站，无上一站可复制')
    return
  }
  const lastSite = sites[targetIdx - 1]
  const lastBoxes = boxes.value.filter(b => b.siteName === lastSite)
  if (lastBoxes.length === 0) {
    alert('上一站无物料箱可复制')
    return
  }
  if (!confirm(`将「${lastSite}」的 ${lastBoxes.length} 个物料箱复制到「${targetSite}」，是否继续？`)) return

  const baseOrder = maxOrderIndex.value
  const copies = lastBoxes.map((b, i) => ({
    boxNumber: b.boxNumber,
    siteName: targetSite,
    orderIndex: baseOrder + i + 1,
    summary: b.summary,
    timeSlot: b.timeSlot,
    riskLevel: b.riskLevel,
    responsible: b.responsible,
    status: 'pending',
    checkNote: '',
    remark: b.remark || ''
  }))
  const newBoxes = await BoxDB.bulkAdd(copies)
  boxes.value = [...boxes.value, ...newBoxes]
  assignSiteOrder()
}

async function handleReorder(newBoxes, reorderType) {
  if (reorderType === 'site') {
    // 站点级排序：重新计算每个站点的起始 orderIndex
    const siteOrderMap = new Map()
    newBoxes.forEach((siteName, idx) => {
      siteOrderMap.set(siteName, idx + 1)
    })
    // 重新分配所有箱子的 orderIndex
    const sortedSites = newBoxes
    let globalOrder = 0
    const updates = []
    for (const siteName of sortedSites) {
      const siteBoxes = boxes.value
        .filter(b => b.siteName === siteName)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
      for (const box of siteBoxes) {
        globalOrder += 1
        updates.push({ id: box.id, orderIndex: globalOrder })
      }
    }
    for (const u of updates) {
      await BoxDB.update(u.id, { orderIndex: u.orderIndex })
    }
    await loadAll()
  } else {
    // 箱子级排序（站点内）
    let globalOrder = 0
    const siteNames = [...siteList.value]
    for (const siteName of siteNames) {
      const siteBoxes = newBoxes.filter(b => b.siteName === siteName)
      if (siteBoxes.length === 0) continue
      for (const box of siteBoxes) {
        globalOrder += 1
        await BoxDB.update(box.id, { orderIndex: globalOrder })
      }
    }
    await loadAll()
  }
}

function handleSelectSite(site) {
  if (checkMode.value) {
    checkSite.value = site
  } else {
    filters.value = {
      ...filters.value,
      siteName: filters.value.siteName === site ? '' : site
    }
  }
}

function handleLocateRecord(alert) {
  if (alert.recordIds && alert.recordIds.length > 0) {
    const id = alert.recordIds[0]
    filters.value = {
      siteName: '',
      responsible: '',
      status: '',
      riskLevel: ''
    }
    checkMode.value = false
    highlightIds.value = alert.recordIds
    nextTick(() => {
      boxListRef.value?.scrollTo(id)
      setTimeout(() => { highlightIds.value = [] }, 3000)
    })
  }
}

function toggleCheckMode() {
  if (!checkMode.value) {
    if (siteList.value.length === 0) {
      alert('暂无站点数据')
      return
    }
    checkSite.value = siteList.value[0]
    clearSelection()
  }
  checkMode.value = !checkMode.value
}

async function loadSeedData() {
  if (!confirm('加载演示数据将清空现有数据，是否继续？')) return
  loading.value = true
  try {
    await seedDemoData()
    await AnomalyDB.clear()
    await loadAllData()
  } finally {
    loading.value = false
  }
}

function openHandoverForm(siteName) {
  handoverSiteName.value = siteName
  handoverExistingRecord.value = null
  handoverFormVisible.value = true
}

async function handleSaveHandover(record) {
  if (record.id) {
    await HandoverDB.update(record.id, record)
  } else {
    await HandoverDB.add(record)
  }
  handoverFormVisible.value = false
  await loadHandoverRecords()
}

async function handleReopenHandover(record) {
  handoverSiteName.value = record.siteName
  handoverExistingRecord.value = record
  handoverFormVisible.value = true
}

async function handleDeleteHandover(id) {
  await HandoverDB.remove(id)
  handoverRecords.value = handoverRecords.value.filter(r => r.id !== id)
}

function toggleHandoverHistory() {
  showHandoverHistory.value = !showHandoverHistory.value
  if (showHandoverHistory.value) {
    showAlertPanel.value = false
  }
}

async function loadAnomalies() {
  anomalies.value = await AnomalyDB.getAll()
}

function openAnomalyList() {
  anomalyListFilter.value = {}
  anomalyView.value = true
  reviewView.value = null
  checkMode.value = false
  showAlertPanel.value = false
  showHandoverHistory.value = false
}

function closeAnomalyList() {
  anomalyView.value = false
  anomalyListFilter.value = {}
}

function openAnomalyListWithFilter(filter) {
  anomalyListFilter.value = filter || {}
  anomalyView.value = true
  reviewView.value = null
  checkMode.value = false
  showAlertPanel.value = false
  showHandoverHistory.value = false
}

function handleAnomalyUpdate(anomaly) {
  const idx = anomalies.value.findIndex(a => a.id === anomaly.id)
  if (idx > -1) {
    anomalies.value[idx] = anomaly
  } else {
    anomalies.value.push(anomaly)
  }
}

async function handleCreateAnomalyFromAlert(alertItem) {
  try {
    const newAnomalies = await createAnomaliesFromAlert(alertItem, boxes.value, AnomalyDB)
    if (newAnomalies.length > 0) {
      anomalies.value = [...anomalies.value, ...newAnomalies]
      window.alert(`已创建 ${newAnomalies.length} 条异常项`)
    } else {
      window.alert('相关异常项已存在，无需重复创建')
    }
  } catch (e) {
    console.error('创建异常项失败:', e)
    window.alert('创建异常项失败')
  }
}

async function handleCreateAnomaliesForSite(siteName, source = 'review') {
  try {
    const newAnomalies = await createAnomaliesForSite(siteName, boxes.value, source, AnomalyDB)
    if (newAnomalies.length > 0) {
      anomalies.value = [...anomalies.value, ...newAnomalies]
      window.alert(`已为「${siteName}」创建 ${newAnomalies.length} 条异常项`)
    } else {
      window.alert('没有新的异常项需要创建')
    }
  } catch (e) {
    console.error('创建异常项失败:', e)
    window.alert('创建异常项失败')
  }
}

async function handleCreateAnomaliesForCheckSite() {
  if (!checkMode.value || !checkSite.value) return
  await handleCreateAnomaliesForSite(checkSite.value, 'check')
}

async function handleCreateAnomaliesForHandover(record) {
  try {
    const newAnomalies = await createAnomaliesForHandover(record, boxes.value, AnomalyDB)
    if (newAnomalies.length > 0) {
      anomalies.value = [...anomalies.value, ...newAnomalies]
      window.alert(`已为交接单创建 ${newAnomalies.length} 条异常项`)
    } else {
      window.alert('没有新的异常项需要创建')
    }
  } catch (e) {
    console.error('创建异常项失败:', e)
    window.alert('创建异常项失败')
  }
}

function handleOpenAnomalyForBox(boxId) {
  openAnomalyListWithFilter({ boxId })
}

function handleLocateBoxFromAnomaly(boxId) {
  anomalyView.value = false
  filters.value = {
    siteName: '',
    responsible: '',
    status: '',
    riskLevel: ''
  }
  checkMode.value = false
  highlightIds.value = [boxId]
  nextTick(() => {
    boxListRef.value?.scrollTo(boxId)
    setTimeout(() => { highlightIds.value = [] }, 3000)
  })
}

function openReviewDashboard() {
  reviewView.value = 'dashboard'
  checkMode.value = false
  showAlertPanel.value = false
  showHandoverHistory.value = false
}

function closeReview() {
  reviewView.value = null
  reviewSiteName.value = ''
}

function openReviewDetail(siteName) {
  reviewSiteName.value = siteName
  reviewView.value = 'detail'
}

function backToReviewDashboard() {
  reviewSiteName.value = ''
  reviewView.value = 'dashboard'
}

async function loadHandoverRecords() {
  handoverRecords.value = await HandoverDB.getAll()
}

async function loadAllData() {
  loading.value = true
  try {
    boxes.value = await BoxDB.getAll()
    assignSiteOrder()
    anomalies.value = await AnomalyDB.getAll()
    handoverRecords.value = await HandoverDB.getAll()
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAllData()
})
</script>

<style scoped>
.app-root {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.header-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.brand-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #4f46e5);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
}

.brand-title {
  font-size: 17px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.brand-sub {
  font-size: 11px;
  color: #9ca3af;
  letter-spacing: 0.3px;
  margin-top: 2px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.header-actions .btn.active {
  background: var(--color-primary-light);
  color: var(--color-primary);
  border-color: #bfdbfe;
}

.handover-count {
  margin-left: 4px;
  padding: 0 6px;
  background: var(--color-primary);
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
}

.anomaly-count {
  margin-left: 4px;
  padding: 0 6px;
  background: var(--color-danger);
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  animation: pulse-danger 2s ease-in-out infinite;
}

@keyframes pulse-danger {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(220, 38, 38, 0); }
}

.main-content {
  max-width: 1600px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: grid;
  gap: 20px;
  flex: 1;
  grid-template-columns: 1fr;
}

.main-content.with-side-panel {
  grid-template-columns: 1fr 340px;
}

.content-left {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.content-left.full {
  grid-column: 1 / -1;
}

.loading-mask {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
