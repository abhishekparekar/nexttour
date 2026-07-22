# Tenant Architecture Overview

## Data Structure in Firebase

```
Firebase Firestore
│
└── tenants/
    │
    ├── trek-premi/                    ← Current Tenant
    │   ├── categories/
    │   │   ├── {categoryId1}
    │   │   ├── {categoryId2}
    │   │   └── ...
    │   │
    │   ├── trips/
    │   │   ├── {tripId1}
    │   │   ├── {tripId2}
    │   │   └── ...
    │   │
    │   ├── bookings/
    │   │   ├── {bookingId1}
    │   │   ├── {bookingId2}
    │   │   └── ...
    │   │
    │   ├── testimonials/
    │   │   ├── {testimonialId1}
    │   │   ├── {testimonialId2}
    │   │   └── ...
    │   │
    │   ├── gallery/
    │   │   ├── {imageId1}
    │   │   ├── {imageId2}
    │   │   └── ...
    │   │
    │   └── addons/
    │       ├── {addonId1}
    │       └── ...
    │
    ├── another-client/                ← Another Tenant
    │   ├── categories/
    │   ├── trips/
    │   ├── bookings/
    │   └── ...
    │
    └── third-client/                  ← Third Tenant
        ├── categories/
        ├── trips/
        └── ...
```

## Storage Structure in Firebase

```
Firebase Storage
│
└── tenants/
    │
    ├── trek-premi/                    ← Current Tenant
    │   ├── categories/
    │   │   ├── 1234567890_mountain.jpg
    │   │   └── 1234567891_beach.jpg
    │   │
    │   ├── trips/
    │   │   ├── 1234567892_himalaya.jpg
    │   │   ├── 1234567893_valley.jpg
    │   │   └── ...
    │   │
    │   ├── gallery/
    │   │   ├── 1234567894_sunset.jpg
    │   │   ├── 1234567895_camp.jpg
    │   │   └── ...
    │   │
    │   └── testimonials/
    │       ├── 1234567896_avatar1.jpg
    │       └── 1234567897_avatar2.jpg
    │
    ├── another-client/                ← Another Tenant
    │   ├── categories/
    │   ├── trips/
    │   └── ...
    │
    └── third-client/                  ← Third Tenant
        ├── categories/
        └── ...
```

## Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Opens Application                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Load Tenant Config (tenant.js)                  │
│                  TENANT_ID = "trek-premi"                    │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│           Initialize Firebase with Tenant Paths              │
│                                                               │
│  collections.CATEGORIES = "tenants/trek-premi/categories"   │
│  collections.TRIPS = "tenants/trek-premi/trips"             │
│  collections.BOOKINGS = "tenants/trek-premi/bookings"       │
│  etc...                                                       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              All Database Operations Use                     │
│              Tenant-Prefixed Paths Automatically             │
│                                                               │
│  ✓ Read trips from: tenants/trek-premi/trips               │
│  ✓ Write bookings to: tenants/trek-premi/bookings          │
│  ✓ Upload images to: tenants/trek-premi/gallery/           │
└─────────────────────────────────────────────────────────────┘
```

## Code Flow Example

### Before (Non-Tenant)
```javascript
// Direct collection reference
const tripsRef = collection(db, 'trips');
const snapshot = await getDocs(tripsRef);
// Reads from: trips/
```

### After (Multi-Tenant)
```javascript
// Tenant-aware collection reference
import { collections } from './firebase';
const tripsRef = collection(db, collections.TRIPS);
const snapshot = await getDocs(tripsRef);
// Reads from: tenants/trek-premi/trips/
```

## Tenant Switching Process

```
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Open src/config/tenant.js                          │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 2: Change TENANT_ID                                    │
│                                                               │
│  const TENANT_CONFIG = {                                     │
│    TENANT_ID: 'new-client-id',  ← Change this               │
│    TENANT_NAME: 'New Client',                                │
│  };                                                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Restart Development Server                          │
│  or Rebuild for Production                                   │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│  Result: Application now uses new tenant's data              │
│                                                               │
│  All paths automatically updated:                            │
│  • tenants/new-client-id/categories                         │
│  • tenants/new-client-id/trips                              │
│  • tenants/new-client-id/bookings                           │
│  • etc...                                                    │
└──────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Tenant Configuration (`src/config/tenant.js`)
- Central configuration file
- Defines current tenant ID
- Provides utility functions for path generation

### 2. Firebase Module (`src/firebase.js`)
- Imports tenant utilities
- Generates tenant-prefixed collection paths
- Wraps storage operations with tenant paths

### 3. Admin Pages
- Use tenant-aware collections
- All CRUD operations automatically isolated
- No manual path management needed

### 4. User Pages
- Consume data through tenant-aware hooks
- Transparent tenant isolation
- No code changes needed when switching tenants

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Security Rules                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Rule: match /tenants/{tenantId}/{document=**}              │
│                                                               │
│  Check: request.auth.token.tenantId == tenantId             │
│                                                               │
│  Result: Users can only access their tenant's data          │
└─────────────────────────────────────────────────────────────┘
```

## Benefits Visualization

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Client A       │     │   Client B       │     │   Client C       │
│  (trek-premi)    │     │  (adventure-co)  │     │  (mountain-exp)  │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Same Codebase / Application                       │
└─────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ tenants/         │     │ tenants/         │     │ tenants/         │
│ trek-premi/      │     │ adventure-co/    │     │ mountain-exp/    │
│ ├── trips        │     │ ├── trips        │     │ ├── trips        │
│ ├── bookings     │     │ ├── bookings     │     │ ├── bookings     │
│ └── ...          │     │ └── ...          │     │ └── ...          │
└──────────────────┘     └──────────────────┘     └──────────────────┘

✓ Complete Data Isolation
✓ Single Codebase
✓ Easy Maintenance
✓ Scalable Architecture
```

## Deployment Strategies

### Strategy 1: Separate Domains
```
trek-premi.com        → TENANT_ID: trek-premi
adventure-co.com      → TENANT_ID: adventure-co
mountain-exp.com      → TENANT_ID: mountain-exp
```

### Strategy 2: Subdomains
```
trek-premi.yourapp.com    → TENANT_ID: trek-premi
adventure-co.yourapp.com  → TENANT_ID: adventure-co
mountain-exp.yourapp.com  → TENANT_ID: mountain-exp
```

### Strategy 3: Path-Based
```
yourapp.com/trek-premi    → TENANT_ID: trek-premi
yourapp.com/adventure-co  → TENANT_ID: adventure-co
yourapp.com/mountain-exp  → TENANT_ID: mountain-exp
```
