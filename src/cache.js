// In-memory cache for Firebase data
// Persists across page navigations within the same session

const cache = {
  trips: null,
  categories: null,
  testimonials: null,
  gallery: null,
};

const listeners = {
  trips: [],
  categories: [],
  testimonials: [],
  gallery: [],
};

// Notify all listeners for a key
const notify = (key, data) => {
  listeners[key].forEach(cb => cb(data));
};

// Set cache and notify
export const setCache = (key, data) => {
  cache[key] = data;
  notify(key, data);
};

// Get cached data
export const getCache = (key) => cache[key];

// Subscribe to cache updates — returns unsubscribe fn
export const subscribeCache = (key, callback) => {
  // Immediately call with cached data if available
  if (cache[key] !== null) {
    callback(cache[key]);
  }
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};
