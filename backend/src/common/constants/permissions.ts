export const Permissions = {
  // Items
  ITEMS_VIEW: 'items:view',
  ITEMS_CREATE: 'items:create',
  ITEMS_EDIT: 'items:edit',
  ITEMS_DELETE: 'items:delete',

  // Customers
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_EDIT: 'customers:edit',
  CUSTOMERS_DELETE: 'customers:delete',

  // Vendors
  VENDORS_VIEW: 'vendors:view',
  VENDORS_CREATE: 'vendors:create',
  VENDORS_EDIT: 'vendors:edit',
  VENDORS_DELETE: 'vendors:delete',

  // Sales
  SALES_VIEW: 'sales:view',
  SALES_CREATE: 'sales:create',
  SALES_EDIT: 'sales:edit',
  SALES_DELETE: 'sales:delete',

  // Purchases
  PURCHASES_VIEW: 'purchases:view',
  PURCHASES_CREATE: 'purchases:create',
  PURCHASES_EDIT: 'purchases:edit',
  PURCHASES_DELETE: 'purchases:delete',

  // Inventory
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_CREATE: 'inventory:create',
  INVENTORY_EDIT: 'inventory:edit',
  INVENTORY_DELETE: 'inventory:delete',

  // Warehouses
  WAREHOUSES_VIEW: 'warehouses:view',
  WAREHOUSES_CREATE: 'warehouses:create',
  WAREHOUSES_EDIT: 'warehouses:edit',
  WAREHOUSES_DELETE: 'warehouses:delete',

  // Invoices
  INVOICES_VIEW: 'invoices:view',
  INVOICES_CREATE: 'invoices:create',
  INVOICES_EDIT: 'invoices:edit',
  INVOICES_DELETE: 'invoices:delete',

  // Bills
  BILLS_VIEW: 'bills:view',
  BILLS_CREATE: 'bills:create',
  BILLS_EDIT: 'bills:edit',
  BILLS_DELETE: 'bills:delete',

  // Credit Notes
  CREDIT_NOTES_VIEW: 'credit-notes:view',
  CREDIT_NOTES_CREATE: 'credit-notes:create',
  CREDIT_NOTES_EDIT: 'credit-notes:edit',
  CREDIT_NOTES_DELETE: 'credit-notes:delete',

  // Sales Returns
  SALES_RETURNS_VIEW: 'sales-returns:view',
  SALES_RETURNS_CREATE: 'sales-returns:create',
  SALES_RETURNS_EDIT: 'sales-returns:edit',

  // Reports
  REPORTS_VIEW: 'reports:view',

  // Users
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',

  // Organizations
  ORGANIZATIONS_VIEW: 'organizations:view',
  ORGANIZATIONS_EDIT: 'organizations:edit',

  // Notifications
  NOTIFICATIONS_VIEW: 'notifications:view',
  NOTIFICATIONS_EDIT: 'notifications:edit',

  // Wildcard
  ALL: '*',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
