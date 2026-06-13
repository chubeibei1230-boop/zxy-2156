const DB_NAME = 'ExhibitionMaterialDB'
const DB_VERSION = 1
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
      }

      if (!db.objectStoreNames.contains(STORE_SITES)) {
        const siteStore = db.createObjectStore(STORE_SITES, {
          keyPath: 'id',
          autoIncrement: true
        })
        siteStore.createIndex('orderIndex', 'orderIndex', { unique: false })
      }
    }
  })
}

function withTx(storeName, mode, callback) {
  return new Promise(async (resolve, reject) => {
    const db = await openDB()
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const result = callback(store, tx)

    tx.oncomplete = () => resolve(result instanceof IDBRequest ? result.result : result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

export const BoxDB = {
  async getAll() {
    return withTx(STORE_BOXES, 'readonly', (store) => {
      const req = store.getAll()
      req.onsuccess = () => req.result
      return new Promise(res => { req.onsuccess = () => res(req.result) })
    })
  },

  async add(box) {
    const timestamp = Date.now()
    const data = { ...box, createdAt: timestamp, updatedAt: timestamp }
    return withTx(STORE_BOXES, 'readwrite', (store) => {
      const req = store.add(data)
      return new Promise(res => { req.onsuccess = () => res(req.result) })
    })
  },

  async bulkAdd(boxes) {
    const timestamp = Date.now()
    const results = []
    await withTx(STORE_BOXES, 'readwrite', (store) => {
      boxes.forEach(box => {
        const data = { ...box, createdAt: timestamp, updatedAt: timestamp }
        const req = store.add(data)
        req.onsuccess = () => results.push(req.result)
      })
      return new Promise(res => setTimeout(res, 0))
    })
    return results
  },

  async update(id, updates) {
    return withTx(STORE_BOXES, 'readwrite', (store) => {
      const getReq = store.get(id)
      return new Promise((res, rej) => {
        getReq.onsuccess = () => {
          const existing = getReq.result
          if (!existing) { rej(new Error('Record not found')); return }
          const updated = { ...existing, ...updates, updatedAt: Date.now() }
          const putReq = store.put(updated)
          putReq.onsuccess = () => res(updated)
        }
      })
    })
  },

  async bulkUpdate(ids, updates) {
    const updatedAt = Date.now()
    await withTx(STORE_BOXES, 'readwrite', (store) => {
      ids.forEach(id => {
        const getReq = store.get(id)
        getReq.onsuccess = () => {
          const existing = getReq.result
          if (existing) {
            store.put({ ...existing, ...updates, updatedAt })
          }
        }
      })
      return new Promise(res => setTimeout(res, 0))
    })
  },

  async remove(id) {
    return withTx(STORE_BOXES, 'readwrite', (store) => {
      const req = store.delete(id)
      return new Promise(res => { req.onsuccess = () => res() })
    })
  },

  async clear() {
    return withTx(STORE_BOXES, 'readwrite', (store) => {
      const req = store.clear()
      return new Promise(res => { req.onsuccess = () => res() })
    })
  }
}

export const SiteDB = {
  async getAll() {
    return withTx(STORE_SITES, 'readonly', (store) => {
      const req = store.getAll()
      return new Promise(res => { req.onsuccess = () => res(req.result) })
    })
  },

  async add(site) {
    const timestamp = Date.now()
    const data = { ...site, createdAt: timestamp, updatedAt: timestamp }
    return withTx(STORE_SITES, 'readwrite', (store) => {
      const req = store.add(data)
      return new Promise(res => { req.onsuccess = () => res(req.result) })
    })
  },

  async update(id, updates) {
    return withTx(STORE_SITES, 'readwrite', (store) => {
      const getReq = store.get(id)
      return new Promise((res, rej) => {
        getReq.onsuccess = () => {
          const existing = getReq.result
          if (!existing) { rej(new Error('Record not found')); return }
          const updated = { ...existing, ...updates, updatedAt: Date.now() }
          const putReq = store.put(updated)
          putReq.onsuccess = () => res(updated)
        }
      })
    })
  },

  async remove(id) {
    return withTx(STORE_SITES, 'readwrite', (store) => {
      const req = store.delete(id)
      return new Promise(res => { req.onsuccess = () => res() })
    })
  },

  async clear() {
    return withTx(STORE_SITES, 'readwrite', (store) => {
      const req = store.clear()
      return new Promise(res => { req.onsuccess = () => res() })
    })
  }
}
