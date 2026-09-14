import Dexie from 'dexie';

export const offlineDb = new Dexie('TCB_POS_OfflineDB');

offlineDb.version(1).stores({
  categories: 'id, slug, name, displayOrder',
  products: 'id, sku, name, categoryId, categoryNameSnapshot',
  discounts: 'id, name, isPresetButton',
  staff: 'id, employeeCode, fullName',
  offlineQueue: '++localId, clientTxnUuid, timestamp, status'
});
