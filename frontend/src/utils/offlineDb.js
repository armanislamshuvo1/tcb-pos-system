import Dexie from 'dexie';

// Use 'TCB_POS_OfflineDB_v2' with clean primary keys (_id) to avoid IndexedDB UpgradeError
// (IndexedDB does not support changing primary key 'id' -> '_id' on existing stores).
export const offlineDb = new Dexie('TCB_POS_OfflineDB_v2');

offlineDb.version(1).stores({
  categories: '_id, slug, name, displayOrder',
  products: '_id, sku, name, categoryId, categoryNameSnapshot',
  discounts: '_id, name, isPresetButton',
  staff: '_id, employeeCode, fullName',
  offlineQueue: '++localId, clientTxnUuid, timestamp, status'
});

// Clean up legacy v1 database to eliminate UpgradeError / DatabaseClosedError in the browser
if (typeof window !== 'undefined' && window.indexedDB) {
  Dexie.delete('TCB_POS_OfflineDB').catch(() => {});
}
