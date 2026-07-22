// Tenant Configuration
// Change this value to switch between different tenants
// Each tenant will have isolated data in Firebase

const TENANT_CONFIG = {
  // Current tenant ID - change this to switch tenants
  TENANT_ID: import.meta.env.VITE_TENANT_ID || 'trek-premi',
  
  // Tenant display name (optional, for UI purposes)
  TENANT_NAME: import.meta.env.VITE_TENANT_NAME || 'Trek Premi',
};

/**
 * Get the current tenant ID
 * @returns {string} The tenant ID
 */
export const getTenantId = () => {
  return TENANT_CONFIG.TENANT_ID;
};

/**
 * Get tenant-prefixed collection path
 * @param {string} collectionName - Base collection name
 * @returns {string} Tenant-prefixed collection path
 */
export const getTenantPath = (collectionName) => {
  const tenantId = getTenantId();
  return `tenants/${tenantId}/${collectionName}`;
};

/**
 * Get tenant-prefixed storage path
 * @param {string} storagePath - Base storage path
 * @returns {string} Tenant-prefixed storage path
 */
export const getTenantStoragePath = (storagePath) => {
  const tenantId = getTenantId();
  return `tenants/${tenantId}/${storagePath}`;
};

/**
 * Get tenant display name
 * @returns {string} The tenant display name
 */
export const getTenantName = () => {
  return TENANT_CONFIG.TENANT_NAME;
};

export default TENANT_CONFIG;
