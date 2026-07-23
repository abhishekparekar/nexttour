// In-memory + LocalStorage cache for Firebase data
// Persists across page refreshes and navigations for instant loading (0ms)

const loadFromLocalStorage = (key) => {
  try {
    const data = localStorage.getItem(`nt_${key}`);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

const cache = {
  trips: loadFromLocalStorage('trips'),
  categories: loadFromLocalStorage('categories'),
  testimonials: loadFromLocalStorage('testimonials'),
  gallery: loadFromLocalStorage('gallery'),
};

const listeners = {
  trips: [],
  categories: [],
  testimonials: [],
  gallery: [],
};

// Notify all listeners for a key
const notify = (key, data) => {
  if (listeners[key]) {
    listeners[key].forEach(cb => cb(data));
  }
};

// Set cache and notify
export const setCache = (key, data) => {
  cache[key] = data;
  try {
    localStorage.setItem(`nt_${key}`, JSON.stringify(data));
  } catch (e) {
    // Ignore quota or serialization errors
  }
  notify(key, data);
};

// Get cached data
export const getCache = (key) => cache[key];

// Subscribe to cache updates — returns unsubscribe fn
export const subscribeCache = (key, callback) => {
  // Immediately call with cached data if available
  if (cache[key] !== null && cache[key] !== undefined) {
    callback(cache[key]);
  }
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};
