declare global {
  interface Window {
    webkitIndexedDB: IDBFactory
    mozIndexedDB: IDBFactory
    msIndexedDB: IDBFactory
  }
}

class PromiseDB<T extends Record<string, unknown>> {
  dbName: string
  dbVersion?: number
  db!: IDBDatabase
  tableName: string
  tableFields: string[]
  indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB
  static instance: PromiseDB<any>

  constructor(dbName: string, dbVersion?: number) {
    this.dbName = dbName
    this.dbVersion = dbVersion
    this.tableName = ''
    this.tableFields = []
  }

  table(tableName: string) {
    return {
      add: (data: T) => this.add(tableName, data),
      read: (key: IDBValidKey) => this.read(tableName, key),
      each: (cb: (data: T | IDBCursorWithValue) => void) =>
        this.each(tableName, cb),
      update: (data: T) => this.update(tableName, data),
      remove: (keys: IDBValidKey) => this.remove(tableName, keys)
    }
  }

  /**
   * 创建indexedDB存储的单例
   * @param {string} dbName 库名
   * @param {number} dbVersion 库版本
   */
  static getInstance<I extends Record<string, unknown>>(
    dbName: string,
    dbVersion?: number
  ) {
    if (!this.instance) {
      this.instance = new PromiseDB<I>(dbName, dbVersion)
    }
    return this.instance as PromiseDB<I>
  }

  /**
   * 不能创建多个仓库，现在需要手动升级indexedDB version才能创建仓库
   * @param {string} tableName 表名
   * @param {string[]} tableFields 表字段
   */
  createTable(tableName = this.tableName, tableFields = this.tableFields) {
    return new Promise<IDBDatabase>((resolve, reject) => {
      if (!this.indexedDB) {
        reject('Browser does not support indexedDB')
      }
      const request = this.indexedDB.open(this.dbName, this.dbVersion)
      this.tableName = tableName
      this.tableFields = tableFields
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(tableName)) {
          const mainKey = tableFields.shift()
          const objectStore = db.createObjectStore(tableName, {
            keyPath: mainKey
          })
          tableFields?.forEach(field => {
            objectStore.createIndex(field, field)
          })
        }
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  private add(tableName: string, data: T) {
    return new Promise((resolve, reject) => {
      this.createTable()
        .then(db => {
          const transaction = db.transaction(tableName, 'readwrite')
          const objectStore = transaction.objectStore(tableName)
          const request = objectStore.add(data)
          request.onerror = () => {
            reject(request.error)
          }

          request.onsuccess = () => {
            resolve(request.result)
          }
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  private read(tableName: string, key: IDBValidKey) {
    return new Promise((resolve, reject) => {
      this.createTable()
        .then(db => {
          const transaction = db.transaction(tableName)
          const objectStore = transaction.objectStore(tableName)
          const request = objectStore.get(key)

          request.onerror = () => {
            reject(request.error)
          }

          request.onsuccess = () => {
            resolve(request.result)
          }
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  private each(tableName: string, cb: (data: T | IDBCursorWithValue) => void) {
    return new Promise((resolve, reject) => {
      this.createTable()
        .then(db => {
          const transaction = db.transaction(tableName, 'readwrite')
          const objectStore = transaction.objectStore(tableName)
          const request = objectStore.openCursor()
          request.onsuccess = () => {
            const cursor = request.result
            if (cursor) {
              cb(cursor.value)
              cursor.continue()
            } else {
              resolve(request.result)
            }
          }
          request.onerror = () => {
            reject(request.error)
          }
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  // 更新data中id相同的项目，如果项目不存在会自动创建
  private update(tableName: string, data: T) {
    return new Promise((resolve, reject) => {
      this.createTable()
        .then(db => {
          const transaction = db.transaction(tableName, 'readwrite')
          const objectStore = transaction.objectStore(tableName)
          const request = objectStore.put(data)

          request.onerror = () => {
            reject(request.error)
          }

          request.onsuccess = () => {
            resolve(request.result)
          }
        })
        .catch(e => {
          reject(e)
        })
    })
  }

  private remove(tableName: string, keys: IDBValidKey) {
    return new Promise((resolve, reject) => {
      this.createTable()
        .then(db => {
          const transaction = db.transaction(tableName, 'readwrite')
          const objectStore = transaction.objectStore(tableName)
          if (Array.isArray(keys)) {
            keys.forEach(key => {
              objectStore.delete(key)
            })
            transaction.oncomplete = () => {
              resolve(keys)
            }
            transaction.onerror = () => {
              reject(transaction.error)
            }
            transaction.onabort = () => {
              reject(transaction.error)
            }
          } else {
            const request = objectStore.delete(keys)
            request.onerror = () => {
              reject(request.error)
            }
            request.onsuccess = () => {
              resolve(request.result)
            }
          }
        })
        .catch(e => {
          reject(e)
        })
    })
  }
}

export default PromiseDB
