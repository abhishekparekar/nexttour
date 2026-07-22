# New Tenant Deployment Checklist

Use this checklist when deploying the application for a new client/tenant.

## Pre-Deployment

### 1. Tenant Information
- [ ] Tenant ID decided (lowercase, no spaces, use hyphens)
  - Example: `adventure-tours`, `mountain-expeditions`, `beach-travels`
- [ ] Tenant display name decided
  - Example: "Adventure Tours", "Mountain Expeditions"
- [ ] Domain/subdomain decided
  - Example: `adventuretours.com`, `client.yourplatform.com`

### 2. Firebase Setup
- [ ] Firebase project exists
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Firebase config obtained (API keys, etc.)

## Configuration Steps

### Step 1: Update Tenant Configuration
- [ ] Open `src/config/tenant.js`
- [ ] Update `TENANT_ID` to new tenant ID
- [ ] Update `TENANT_NAME` to new tenant display name
- [ ] Save file

```javascript
const TENANT_CONFIG = {
  TENANT_ID: 'new-client-id',      // ← Update this
  TENANT_NAME: 'New Client Name',   // ← Update this
};
```

### Step 2: Update Firebase Configuration (if different project)
- [ ] Open `src/firebase.js`
- [ ] Update Firebase config with new project credentials
- [ ] Save file

```javascript
const firebaseConfig = {
  apiKey: "new-api-key",
  authDomain: "new-project.firebaseapp.com",
  projectId: "new-project-id",
  storageBucket: "new-project.appspot.com",
  messagingSenderId: "new-sender-id",
  appId: "new-app-id",
  measurementId: "new-measurement-id"
};
```

### Step 3: Update Branding (Optional)
- [ ] Update logo in `public/` folder
- [ ] Update favicon in `public/favicon.svg`
- [ ] Update site title in `index.html`
- [ ] Update colors in `tailwind.config.js` (if needed)
- [ ] Update company name in footer

### Step 4: Build Application
- [ ] Run `npm install` (if first time)
- [ ] Run `npm run build`
- [ ] Verify build completes successfully
- [ ] Check `dist/` folder created

```bash
npm install
npm run build
```

## Firebase Security Rules

### Step 5: Update Firestore Rules
- [ ] Open Firebase Console → Firestore → Rules
- [ ] Update rules to include new tenant path
- [ ] Publish rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow access to tenant-specific data
    match /tenants/{tenantId}/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 6: Update Storage Rules
- [ ] Open Firebase Console → Storage → Rules
- [ ] Update rules to include new tenant path
- [ ] Publish rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow access to tenant-specific storage
    match /tenants/{tenantId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Testing

### Step 7: Local Testing
- [ ] Run `npm run dev`
- [ ] Open browser to `http://localhost:5173`
- [ ] Verify application loads
- [ ] Check browser console for errors
- [ ] Verify tenant ID in console logs

### Step 8: Admin Panel Testing
- [ ] Navigate to `/admin`
- [ ] Test Categories:
  - [ ] Add new category
  - [ ] Edit category
  - [ ] Delete category
- [ ] Test Trips:
  - [ ] Add new trip
  - [ ] Upload images
  - [ ] Edit trip
  - [ ] Delete trip
- [ ] Test Gallery:
  - [ ] Upload images
  - [ ] Delete images
  - [ ] Toggle featured
- [ ] Test Testimonials:
  - [ ] Add testimonial
  - [ ] Edit testimonial
  - [ ] Delete testimonial

### Step 9: User Pages Testing
- [ ] Test Home page loads
- [ ] Test Trips page shows data
- [ ] Test Trip detail page
- [ ] Test Booking form
- [ ] Test About page
- [ ] Test Contact page
- [ ] Test Gallery page
- [ ] Test Testimonials page

### Step 10: Firebase Verification
- [ ] Open Firebase Console
- [ ] Navigate to Firestore
- [ ] Verify data exists at: `tenants/{new-tenant-id}/`
- [ ] Check collections:
  - [ ] `tenants/{tenant-id}/categories`
  - [ ] `tenants/{tenant-id}/trips`
  - [ ] `tenants/{tenant-id}/bookings`
  - [ ] `tenants/{tenant-id}/testimonials`
  - [ ] `tenants/{tenant-id}/gallery`
- [ ] Navigate to Storage
- [ ] Verify images at: `tenants/{new-tenant-id}/`

## Deployment

### Step 11: Deploy to Hosting
Choose your deployment method:

#### Option A: Firebase Hosting
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Login: `firebase login`
- [ ] Initialize: `firebase init hosting`
- [ ] Deploy: `firebase deploy --only hosting`

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

#### Option B: Vercel
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Deploy: `vercel --prod`

```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option C: Netlify
- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Login: `netlify login`
- [ ] Deploy: `netlify deploy --prod`

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

### Step 12: Domain Configuration
- [ ] Point domain to hosting provider
- [ ] Configure DNS records
- [ ] Enable SSL/HTTPS
- [ ] Verify domain works

### Step 13: Post-Deployment Testing
- [ ] Visit production URL
- [ ] Test all pages load
- [ ] Test admin panel
- [ ] Test image uploads
- [ ] Test booking form
- [ ] Check mobile responsiveness
- [ ] Test on different browsers

## Data Population

### Step 14: Add Initial Data
- [ ] Add categories (at least 3-5)
- [ ] Add trips (at least 5-10)
- [ ] Add testimonials (at least 3-5)
- [ ] Add gallery images (at least 10-15)
- [ ] Set featured trips
- [ ] Set featured gallery images

### Step 15: Content Review
- [ ] Review all text content
- [ ] Check for placeholder text
- [ ] Verify images load correctly
- [ ] Check pricing is correct
- [ ] Verify contact information
- [ ] Check social media links

## Documentation

### Step 16: Client Handover
- [ ] Provide admin credentials
- [ ] Share admin panel URL
- [ ] Provide user guide
- [ ] Share Firebase console access (if needed)
- [ ] Document any customizations

### Step 17: Create Client Documentation
- [ ] How to add trips
- [ ] How to manage bookings
- [ ] How to update content
- [ ] How to upload images
- [ ] Contact for support

## Monitoring

### Step 18: Setup Monitoring
- [ ] Enable Firebase Analytics
- [ ] Setup error tracking
- [ ] Configure performance monitoring
- [ ] Setup uptime monitoring
- [ ] Configure backup strategy

### Step 19: Performance Check
- [ ] Run Lighthouse audit
- [ ] Check page load times
- [ ] Verify image optimization
- [ ] Test on slow connections
- [ ] Check mobile performance

## Final Verification

### Step 20: Complete Checklist
- [ ] All features working
- [ ] All pages accessible
- [ ] Data isolated to tenant path
- [ ] Images uploading correctly
- [ ] Forms submitting correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser compatible
- [ ] SSL enabled
- [ ] Domain configured
- [ ] Client trained
- [ ] Documentation provided

## Rollback Plan

### If Issues Occur
1. **Revert Configuration**
   - [ ] Restore previous `tenant.js`
   - [ ] Rebuild application
   - [ ] Redeploy

2. **Check Logs**
   - [ ] Browser console
   - [ ] Firebase console
   - [ ] Hosting provider logs

3. **Contact Support**
   - [ ] Document the issue
   - [ ] Provide error messages
   - [ ] Share screenshots

## Success Criteria

### Deployment Successful When:
- ✅ Application loads without errors
- ✅ All pages accessible
- ✅ Admin panel functional
- ✅ Data saving to correct tenant path
- ✅ Images uploading to correct tenant storage
- ✅ Forms working correctly
- ✅ Mobile responsive
- ✅ SSL enabled
- ✅ Client satisfied

## Notes

### Tenant ID: _______________
### Deployment Date: _______________
### Domain: _______________
### Firebase Project: _______________
### Deployed By: _______________

### Issues Encountered:
```
[Document any issues and resolutions here]
```

### Custom Modifications:
```
[Document any client-specific customizations here]
```

---

**Checklist Version:** 1.0  
**Last Updated:** [Date]  
**Status:** [ ] In Progress  [ ] Complete  [ ] Issues
