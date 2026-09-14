import Dexie from 'dexie';

export const offlineDb = new Dexie('TCB_POS_OfflineDB');

offlineDb.version(2).stores({
  categories: '_id, slug, name, displayOrder',
  products: '_id, sku, name, categoryId, categoryNameSnapshot',
  discounts: '_id, name, isPresetButton',
  staff: '_id, employeeCode, fullName',
  offlineQueue: '++localId, clientTxnUuid, timestamp, status'
});
