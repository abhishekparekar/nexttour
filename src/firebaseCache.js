// Cached Firebase subscriptions
// First call hits Firebase, subsequent calls use in-memory cache
// Cache is cleared on page refresh (session-level)

import { setCache, getCache, subscribeCache } from './cache';
import { subscribeToTrips, subscribeToCategories, subscribeToTestimonials } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { getTenantPath } from './config/tenant';

let tripsUnsub = null;
let categoriesUnsub = null;
let testimonialsUnsub = null;
let galleryUnsub = null;

// Cached trips subscription
export const useCachedTrips = (callback) => {
  const unsub = subscribeCache('trips', callback);

  // Start Firebase listener only once
  if (!tripsUnsub) {
    tripsUnsub = subscribeToTrips((data) => {
      setCache('trips', data);
    });
  } else if (getCache('trips')) {
    // Already have data, callback already called by subscribeCache
  }

  return unsub;
};

// Cached categories subscription
export const useCachedCategories = (callback) => {
  const unsub = subscribeCache('categories', callback);

  if (!categoriesUnsub) {
    categoriesUnsub = subscribeToCategories((data) => {
      setCache('categories', data);
    });
  }

  return unsub;
};

// Cached testimonials subscription
export const useCachedTestimonials = (callback) => {
  const unsub = subscribeCache('testimonials', callback);

  if (!testimonialsUnsub) {
    testimonialsUnsub = subscribeToTestimonials((data) => {
      setCache('testimonials', data);
    });
  }

  return unsub;
};

// Cached gallery subscription with tenant path
export const useCachedGallery = (callback) => {
  const unsub = subscribeCache('gallery', callback);

  if (!galleryUnsub) {
    const galleryPath = getTenantPath('gallery');
    const q = query(collection(db, galleryPath), orderBy('createdAt', 'desc'));
    galleryUnsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(i => i.url);
      setCache('gallery', data);
    }, () => setCache('gallery', []));
  }

  return unsub;
};
