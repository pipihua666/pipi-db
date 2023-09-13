## Installation

### Using npm

> npm install promise-db

Then, assuming you're using a module-compatible system (like webpack, Rollup etc):

```typescript
import PromiseDB from 'promise-db'

function init() {
  const dbName = 'promise-db'
  const tableName = 'promise-db-table'
  const db = PromiseDB.getInstance<DbTableType>(dbName)
  db.createTable(tableName, [])
}
```

## API

### `getInstance`

This method opens a database and returns a globally unique promise of an enhanced IDBDatabase.

```typescript
static getInstance<I extends Record<string, unknown>>(dbName: string, dbVersion?: number): PromiseDB<I>;
```

### `createTable`

Create an indexedDB table and use the field with index 0 in tableFields as the primary key

```typescript
createTable(tableName?: string, tableFields?: string[]): Promise<IDBDatabase>;
```

### `table`

How to operate tables exposed to the outside world

```typescript
table(tableName: string): {
	add: (data: T) => Promise<unknown>;
	read: (key: IDBValidKey) => Promise<unknown>;
	each: (cb: (data: T | IDBCursorWithValue) => void) => Promise<unknown>;
	update: (data: T) => Promise<unknown>;
	remove: (keys: IDBValidKey) => Promise<unknown>;
};
```

#### `add`

Add data to table

```typescript
db.table(tableName)
  .add(data)
  .then(
    data => {
      console.log('Data added successfully:', data)
    },
    error => {
      console.error('Data addition failed:', error)
    }
  )
```

#### `read`

Query table data by primary key

```typescript
db.table(tableName)
  .read(primaryKey)
  .then(
    data => {
      console.log('Data read successfully:', data)
    },
    error => {
      console.error('Data reading failed:', error)
    }
  )
```

#### `each`

Traverse table data

```typescript
db.table(tableName)
  .each((data: DbTableType) => {
    console.log('data', data)
  })
  .catch(error => {
    console.log('Traversal error:', error)
  })
```

#### `update`

Update table data

```typescript
db.table(tableName)
  .update(data)
  .then(data => {
    console.log('Update data successfully:', data)
  })
  .catch(error => {
    console.log('Failed to update data:', error)
  })
```

#### `remove`

Update table data

```typescript
const ids = []
db.table(tableName)
  .remove(ids)
  .then(data => {
    console.log('Data deleted successfully:', data)
  })
  .catch(error => {
    console.log('Failed to delete data:', error)
  })
```
