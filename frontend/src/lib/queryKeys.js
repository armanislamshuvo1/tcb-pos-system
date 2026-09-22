/**
 * Centralized Query Key Factory
 * Ensures 100% consistent query keys across all components and enables surgical cache invalidation.
 */
export const queryKeys = {
  catalog: {
    all: ['catalog'],
    categories: () => [...queryKeys.catalog.all, 'categories'],
    products: (activeOnly = true) => [...queryKeys.catalog.all, 'products', { activeOnly }],
    staff: () => [...queryKeys.catalog.all, 'staff'],
    presetDiscounts: () => [...queryKeys.catalog.all, 'discounts', 'presets'],
    customers: () => [...queryKeys.catalog.all, 'customers'],
  },

  tabs: {
    all: ['tabs'],
    allBills: (search = '', billType = 'ALL') => [...queryKeys.tabs.all, 'all-bills', { search, billType }],
    customers: (search = '') => [...queryKeys.tabs.all, 'customers', { search }],
    rooms: (search = '') => [...queryKeys.tabs.all, 'rooms', { search }],
    consolidated: () => [...queryKeys.tabs.all, 'consolidated'],
    byProduct: (search = '') => [...queryKeys.tabs.all, 'by-product', { search }],
    settled: (search = '', limit = 50) => [...queryKeys.tabs.all, 'settled', { search, limit }],
    staffTransactions: (staffId) => [...queryKeys.tabs.all, 'staff-transactions', staffId],
    roomTransactions: (roomNumber) => [...queryKeys.tabs.all, 'room-transactions', roomNumber],
    customerTransactions: (customerName) => [...queryKeys.tabs.all, 'customer-transactions', customerName],
  },

  ledger: {
    all: ['ledger'],
    list: (params = {}) => [...queryKeys.ledger.all, 'list', params],
  },

  reports: {
    all: ['reports'],
    summary: (params = {}) => [...queryKeys.reports.all, 'summary', params],
    staffConsumption: (params = {}) => [...queryKeys.reports.all, 'staff-consumption', params],
    products: (params = {}) => [...queryKeys.reports.all, 'products', params],
  },

  admin: {
    all: ['admin'],
    users: () => [...queryKeys.admin.all, 'users'],
    companies: () => [...queryKeys.admin.all, 'companies'],
    discounts: () => [...queryKeys.admin.all, 'discounts'],
  },
};
