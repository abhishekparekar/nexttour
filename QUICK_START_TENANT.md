# Quick Start: Multi-Tenant Setup

## ✅ What's Been Done

Your application has been successfully converted to a white-label multi-tenant system. Here's what was implemented:

### 1. Tenant Configuration System
- ✅ Created `src/config/tenant.js` - Central tenant configuration
- ✅ Set default tenant ID to `trek-premi`
- ✅ Added utility functions for path generation

### 2. Firebase Integration
- ✅ Updated `src/firebase.js` to use tenant-prefixed paths
- ✅ All Firestore collections now use: `tenants/{tenantId}/{collection}`
- ✅ All Storage paths now use: `tenants/{tenantId}/{path}`

### 3. Admin Pages Updated
- ✅ Categories - Uses tenant paths
- ✅ Trips - Uses tenant paths
- ✅ Bookings - Uses tenant paths
- ✅ Testimonials - Uses tenant paths
- ✅ Gallery - Uses tenant paths
- ✅ Dashboard - Uses tenant paths

### 4. User-Facing Pages
- ✅ All pages use cached Firebase hooks
- ✅ Hooks automatically use tenant paths
- ✅ No changes needed when switching tenants

### 5. Documentation
- ✅ `TENANT_SETUP.md` - Complete setup guide
- ✅ `TENANT_ARCHITECTURE.md` - Architecture overview
- ✅ `QUICK_START_TENANT.md` - This file

## 🚀 How to Use

### Current Setup
Your app is currently configured for tenant: **trek-premi**

All data will be stored at:
- Firestore: `tenants/trek-premi/*`
- Storage: `tenants/trek-premi/*`

### To Switch Tenants

**Step 1:** Open `src/config/tenant.js`

**Step 2:** Change the tenant ID:
```javascript
const TENANT_CONFIG = {
  TENANT_ID: 'your-new-tenant-id',  // ← Change this
  TENANT_NAME: 'Your Company Name',
};
```

**Step 3:** Restart your dev server:
```bash
npm run dev
```

That's it! Your app now uses the new tenant's data.

## 📊 Data Structure

### Before (Old Structure)
```
Firestore:
├── categories/
├── trips/
├── bookings/
└── testimonials/

Storage:
├── categories/
├── trips/
└── gallery/
```

### After (New Multi-Tenant Structure)
```
Firestore:
└── tenants/
    ├── trek-premi/
    │   ├── categories/
    │   ├── trips/
    │   ├── bookings/
    │   └── testimonials/
    │
    └── another-client/
        ├── categories/
        ├── trips/
        └── ...

Storage:
└── tenants/
    ├── trek-premi/
    │   ├── categories/
    │   ├── trips/
    │   └── gallery/
    │
    └── another-client/
        └── ...
```

## 🧪 Testing the Setup

### Test 1: Verify Current Tenant
1. Run the app: `npm run dev`
2. Open browser console
3. Look for: "Firebase initialized successfully"
4. Check that data loads from `tenants/trek-premi/*`

### Test 2: Add Test Data
1. Go to Admin → Categories
2. Add a new category
3. Check Firebase Console
4. Verify it's saved at: `tenants/trek-premi/categories/`

### Test 3: Switch Tenants
1. Change `TENANT_ID` to `test-tenant`
2. Restart dev server
3. Verify you see no data (empty state)
4. Add new data
5. Check Firebase - should be at `tenants/test-tenant/*`
6. Switch back to `trek-premi`
7. Verify original data is still there

## 🔒 Security (Important!)

### Update Firebase Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tenants/{tenantId}/{document=**} {
      // Public read for now - update based on your needs
      allow read: if true;
      
      // Write requires authentication
      allow write: if request.auth != null;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tenants/{tenantId}/{allPaths=**} {
      // Public read
      allow read: if true;
      
      // Write requires authentication
      allow write: if request.auth != null;
    }
  }
}
```

## 📦 Deploying for New Clients

### Option 1: Separate Builds (Recommended)
```bash
# For Client 1
# Edit src/config/tenant.js → TENANT_ID: 'client-1'
npm run build
# Deploy to client1.com

# For Client 2
# Edit src/config/tenant.js → TENANT_ID: 'client-2'
npm run build
# Deploy to client2.com
```

### Option 2: Environment Variables
```bash
# Add to src/config/tenant.js:
TENANT_ID: import.meta.env.VITE_TENANT_ID || 'trek-premi',

# Build with different tenants:
VITE_TENANT_ID=client-1 npm run build
VITE_TENANT_ID=client-2 npm run build
```

## 🔄 Migrating Existing Data

If you have existing data without tenant prefixes:

### Using Firebase Console:
1. Go to Firestore Database
2. Export your collections
3. Create new collections under `tenants/trek-premi/`
4. Import the data

### Using Firebase Admin SDK:
```javascript
// migration-script.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrate() {
  const collections = ['categories', 'trips', 'bookings', 'testimonials', 'gallery'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    
    for (const doc of snapshot.docs) {
      await db
        .collection(`tenants/trek-premi/${collectionName}`)
        .doc(doc.id)
        .set(doc.data());
    }
  }
}

migrate();
```

## ✨ Key Features

1. **Complete Isolation**: Each tenant's data is 100% separate
2. **Zero Code Changes**: Switch tenants by changing one config value
3. **Automatic Path Management**: All paths are handled automatically
4. **Scalable**: Add unlimited tenants without code changes
5. **Maintainable**: Single codebase for all clients

## 🆘 Troubleshooting

### Issue: No data showing
**Solution:** Check that `TENANT_ID` in `src/config/tenant.js` matches your Firebase data path

### Issue: Data saving to wrong location
**Solution:** Verify all imports use functions from `src/firebase.js`, not direct Firestore calls

### Issue: Images not uploading
**Solution:** Check Firebase Storage rules allow writes to `tenants/{tenantId}/*`

### Issue: Changes not reflecting
**Solution:** Restart dev server after changing `tenant.js`

## 📞 Support

For detailed information, see:
- `TENANT_SETUP.md` - Complete setup guide
- `TENANT_ARCHITECTURE.md` - Architecture diagrams
- Firebase Console - Verify data structure

## ✅ Checklist for New Tenant

- [ ] Update `TENANT_ID` in `src/config/tenant.js`
- [ ] Update `TENANT_NAME` (optional)
- [ ] Restart development server
- [ ] Test admin pages (add/edit/delete)
- [ ] Test user pages (view data)
- [ ] Verify Firebase Console shows correct paths
- [ ] Update Firebase Security Rules
- [ ] Deploy to production

## 🎉 You're All Set!

Your application is now a fully functional multi-tenant white-label system. Change the tenant ID in one place, and the entire app adapts automatically.

**Current Tenant:** trek-premi  
**Data Location:** `tenants/trek-premi/*`  
**Ready to Deploy:** ✅
