const DB_NAME = 'ExhibitionMaterialDB'
const DB_VERSION = 2
const STORE_BOXES = 'boxes'
const STORE_SITES = 'sites'

let dbInstance = null

function openDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance)
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains(STORE_BOXES)) {
        const boxStore = db.createObjectStore(STORE_BOXES, {
          keyPath: 'id',
          autoIncrement: true
        })
        boxStore.createIndex('siteName', 'siteName', { unique: false })
        boxStore.createIndex('boxNumber', 'boxNumber', { unique: false })
        boxStore.createIndex('status', 'status', { unique: false })
        boxStore.createIndex('responsible', 'responsible', { unique: false })
        boxStore.createIndex('riskLevel', 'riskLevel', { unique: false })
        boxStore.createIndex('orderIndex', 'orderIndex', { unique: false })
      } else {
        const txn = event.target.transaction
        const boxStore = txn.objectStore(STORE_BOXES)
        if (!boxStore.indexNames.contains('orderIndex')) {
          boxStore.createIndex('orderIndex', 'orderIndex', { unique: false })
        }
      }

      if (!db.objectStoreNames.contains(STORE_SITES)) {
        const siteStore = db.createObjectStore(STORE_SITES, {
          keyPath: 'id',
          autoIncrement: true
        })
        siteStore.createIndex('orderIndex', 'orderIndex', { unique: false })
        siteStore.createIndex('name', 'name', { unique: true })
      }
    }
  })
}

function promisifyReq(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const BoxDB = {
  async getAll() {
    const db = await openDB()
    const tx = db.transaction(STORE_BOXES, 'readonly')
    const store = tx.objectStore(STORE_BOXES)
    return promisifyReq(store.getAll())
  },

  async add(box) {
    const db = await openDB()
    const tx = db.transaction(STORE_BOXES, 'readwrite')
    const store = tx.objectStore(STORE_BOXES)
    const timestamp = Date.now()
    const data = { ...box, createdAt: timestamp, updatedAt: timestamp }
    const id = await promisifyReq(store.add(data))
    return { ...data, id }
  },

  async bulkAdd(boxes) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOXES, 'readwrite')
      const store = tx.objectStore(STORE_BOXES)
      const timestamp = Date.now()
      const results = []
      let completed = 0
      let hasError = false

      boxes.forEach((box, index) => {
        if (hasError) return
        const data = { ...box, createdAt: timestamp, updatedAt: timestamp }
        const req = store.add(data)
        req.onsuccess = () => {
          if (hasError) return
          results.push({ ...data, id: req.result })
          completed++
          if (completed === boxes.length) {
            resolve(results)
          }
        }
        req.onerror = () => {
          hasError = true
          reject(req.error)
        }
      })

      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  },

  async update(id, updates) {
    const db = await openDB()
    const tx = db.transaction(STORE_BOXES, 'readwrite')
    const store = tx.objectStore(STORE_BOXES)
    const existing = await promisifyReq(store.get(id))
    if (!existing) throw new Error('Record not found')
    const updated = { ...existing, ...updates, updatedAt: Date.now() }
    await promisifyReq(store.put(updated))
    return updated
  },

  async bulkUpdate(ids, updates) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_BOXES, 'readwrite')
      const store = tx.objectStore(STORE_BOXES)
      const updatedAt = Date.now()
      const results = []
      let pending = ids.length
      let hasError = false

      if (pending === 0) {
        resolve([])
        return
      }

      ids.forEach(id => {
        if (hasError) return
        const getReq = store.get(id)
        getReq.onsuccess = () => {
          if (hasError) return
          const existing = getReq.result
          if (existing) {
            const updated = { ...existing, ...updates, updatedAt }
            const putReq = store.put(updated)
            putReq.onsuccess = () => {
              if (hasError) return
              results.push(updated)
              pending--
              if (pending === 0) resolve(results)
            }
            putReq.onerror = () => {
              hasError = true
              reject(putReq.error)
            }
          } else {
            pending--
            if (pending === 0) resolve(results)
          }
        }
        getReq.onerror = () => {
          hasError = true
          reject(getReq.error)
        }
      })

      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
  },

  async remove(id) {
    const db = await openDB()
    const tx = db.transaction(STORE_BOXES, 'readwrite')
    const store = tx.objectStore(STORE_BOXES)
    await promisifyReq(store.delete(id))
  },

  async clear() {
    const db = await openDB()
    const tx = db.transaction(STORE_BOXES, 'readwrite')
    const store = tx.objectStore(STORE_BOXES)
    await promisifyReq(store.clear())
  }
}

export const SiteDB = {
  async getAll() {
    const db = await openDB()
    const tx = db.transaction(STORE_SITES, 'readonly')
    const store = tx.objectStore(STORE_SITES)
    return promisifyReq(store.getAll())
  },

  async add(site) {
    const db = await openDB()
    const tx = db.transaction(STORE_SITES, 'readwrite')
    const store = tx.objectStore(STORE_SITES)
    const timestamp = Date.now()
    const data = { ...site, createdAt: timestamp, updatedAt: timestamp }
    const id = await promisifyReq(store.add(data))
    return { ...data, id }
  },

  async update(id, updates) {
    const db = await openDB()
    const tx = db.transaction(STORE_SITES, 'readwrite')
    const store = tx.objectStore(STORE_SITES)
    const existing = await promisifyReq(store.get(id))
    if (!existing) throw new Error('Record not found')
    const updated = { ...existing, ...updates, updatedAt: Date.now() }
    await promisifyReq(store.put(updated))
    return updated
  },

  async remove(id) {
    const db = await openDB()
    const tx = db.transaction(STORE_SITES, 'readwrite')
    const store = tx.objectStore(STORE_SITES)
    await promisifyReq(store.delete(id))
  },

  async clear() {
    const db = await openDB()
    const tx = db.transaction(STORE_SITES, 'readwrite')
    const store = tx.objectStore(STORE_SITES)
    await promisifyReq(store.clear())
  }
}
