# Multi-Tenant White Label System

This application has been configured as a white-label multi-tenant system. Each tenant has completely isolated data in Firebase Firestore and Firebase Storage.

## How It Works

### Tenant Isolation
All data is stored under a tenant-specific path structure:
- **Firestore Collections**: `tenants/{tenantId}/{collectionName}`
- **Storage Paths**: `tenants/{tenantId}/{storagePath}`

### Current Tenant Configuration
The current tenant is: **trek-premi**

## Changing Tenant ID

To switch to a different tenant or deploy for a new client:

1. Open `src/config/tenant.js`
2. Change the `TENANT_ID` value:

```javascript
const TENANT_CONFIG = {
  TENANT_ID: 'your-new-tenant-id',  // Change this
  TENANT_NAME: 'Your Company Name',  // Optional display name
};
```

3. Save the file
4. Restart your development server or rebuild for production

That's it! The entire application will now use the new tenant's data.

## Tenant Path Structure

### Firestore Collections
All collections are automatically prefixed with the tenant path:

- Categories: `tenants/trek-premi/categories`
- Trips: `tenants/trek-premi/trips`
- Bookings: `tenants/trek-premi/bookings`
- Testimonials: `tenants/trek-premi/testimonials`
- Gallery: `tenants/trek-premi/gallery`
- Addons: `tenants/trek-premi/addons`

### Storage Paths
All uploaded files are stored under tenant-specific paths:

- Category Images: `tenants/trek-premi/categories/{filename}`
- Trip Images: `tenants/trek-premi/trips/{filename}`
- Gallery Images: `tenants/trek-premi/gallery/{filename}`
- Testimonial Avatars: `tenants/trek-premi/testimonials/{filename}`

## Benefits

1. **Complete Data Isolation**: Each tenant's data is completely separate
2. **Easy Deployment**: Change one config value to deploy for a new client
3. **Scalable**: Add unlimited tenants without code changes
4. **Secure**: No risk of data leakage between tenants
5. **Maintainable**: Single codebase for all tenants

## Implementation Details

### Core Files Modified

1. **src/config/tenant.js** - Tenant configuration and utility functions
2. **src/firebase.js** - Updated all collection paths and storage paths
3. **src/firebaseCache.js** - Updated cached subscriptions
4. **src/pages/admin/Gallery.jsx** - Updated gallery operations

### Utility Functions

```javascript
import { getTenantPath, getTenantStoragePath } from './config/tenant';

// Get tenant-prefixed collection path
const categoriesPath = getTenantPath('categories');
// Returns: "tenants/trek-premi/categories"

// Get tenant-prefixed storage path
const imagePath = getTenantStoragePath('trips/image.jpg');
// Returns: "tenants/trek-premi/trips/image.jpg"
```

## Firebase Security Rules

Update your Firebase Security Rules to enforce tenant isolation:

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tenant-based access control
    match /tenants/{tenantId}/{document=**} {
      // Allow read/write for authenticated users of the same tenant
      allow read, write: if request.auth != null && 
                           request.auth.token.tenantId == tenantId;
    }
  }
}
```

### Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Tenant-based access control
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null && 
                     request.auth.token.tenantId == tenantId;
    }
  }
}
```

## Testing Different Tenants

To test with multiple tenants:

1. Create test data for tenant 1:
   - Set `TENANT_ID: 'tenant-1'`
   - Add some trips, categories, etc.

2. Switch to tenant 2:
   - Set `TENANT_ID: 'tenant-2'`
   - Verify you see no data (isolated)
   - Add different data

3. Switch back to tenant 1:
   - Set `TENANT_ID: 'tenant-1'`
   - Verify original data is still there

## Production Deployment

For production deployments:

1. **Option 1: Separate Builds**
   - Create separate builds for each tenant
   - Each build has its own `TENANT_ID` hardcoded
   - Deploy to different domains/subdomains

2. **Option 2: Environment Variables**
   - Use environment variables for `TENANT_ID`
   - Configure during build/deployment
   - Example: `VITE_TENANT_ID=trek-premi npm run build`

3. **Option 3: Subdomain Detection**
   - Detect tenant from subdomain
   - Example: `trek-premi.yourdomain.com` → tenant: `trek-premi`
   - Requires additional routing logic

## Migration from Non-Tenant Setup

If you have existing data without tenant prefixes:

1. **Backup your data** using Firebase Console
2. **Export collections** to JSON
3. **Re-import under tenant path**: `tenants/trek-premi/{collection}`
4. Use Firebase Admin SDK or console for bulk operations

## Support

For questions or issues with the tenant system:
- Check Firebase Console to verify data paths
- Ensure `src/config/tenant.js` is properly configured
- Verify all imports use the tenant utility functions

## Notes

- All database operations automatically use tenant paths
- No need to manually add tenant prefixes in your code
- The system is designed to be transparent to developers
- Changing tenant ID requires app restart/rebuild
