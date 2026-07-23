import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getTenantPath, getTenantStoragePath } from './config/tenant';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBX19VWQ81SAB5Hy_gkMyV6Dwx9SZgy6iI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "job-portal-85414.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://job-portal-85414-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "job-portal-85414",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "job-portal-85414.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "699831995778",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:699831995778:web:58013241c5fec099d4d39b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-V8GV5BEGR1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

console.log('Firebase initialized successfully');

// Base collection names (without tenant prefix)
const BASE_COLLECTIONS = {
  CATEGORIES: 'categories',
  TRIPS: 'trips',
  BOOKINGS: 'bookings',
  TESTIMONIALS: 'testimonials',
  GALLERY: 'gallery',
  ADDONS: 'addons',
  CONTACTS: 'contacts',
  LEADS: 'leads',
  VEHICLES: 'vehicles',
  DRIVERS: 'drivers',
  SCHEDULES: 'schedules',
  EXPENSES: 'expenses',
  CUSTOMERS: 'customers'
};

// Tenant-aware collections - automatically prefixed with tenant path
export const collections = {
  CATEGORIES: getTenantPath(BASE_COLLECTIONS.CATEGORIES),
  TRIPS: getTenantPath(BASE_COLLECTIONS.TRIPS),
  BOOKINGS: getTenantPath(BASE_COLLECTIONS.BOOKINGS),
  TESTIMONIALS: getTenantPath(BASE_COLLECTIONS.TESTIMONIALS),
  GALLERY: getTenantPath(BASE_COLLECTIONS.GALLERY),
  ADDONS: getTenantPath(BASE_COLLECTIONS.ADDONS),
  CONTACTS: getTenantPath(BASE_COLLECTIONS.CONTACTS),
  LEADS: getTenantPath(BASE_COLLECTIONS.LEADS),
  VEHICLES: getTenantPath(BASE_COLLECTIONS.VEHICLES),
  DRIVERS: getTenantPath(BASE_COLLECTIONS.DRIVERS),
  SCHEDULES: getTenantPath(BASE_COLLECTIONS.SCHEDULES),
  EXPENSES: getTenantPath(BASE_COLLECTIONS.EXPENSES),
  CUSTOMERS: getTenantPath(BASE_COLLECTIONS.CUSTOMERS),
  SETTINGS: getTenantPath('settings')
};

// Real-time data listeners
export const subscribeToCategories = (callback) => {
  console.log('Subscribing to categories...');
  const q = query(collection(db, collections.CATEGORIES), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Categories loaded:', data.length);
    callback(data);
  }, (error) => {
    console.error('Error subscribing to categories:', error);
  });
};

export const subscribeToTrips = (callback, categoryId = null) => {
  console.log('Subscribing to trips, categoryId:', categoryId);
  let q;
  if (categoryId) {
    q = query(collection(db, collections.TRIPS), where('categoryId', '==', categoryId), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, collections.TRIPS), orderBy('createdAt', 'desc'));
  }
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Trips loaded:', data.length, data);
    callback(data);
  }, (error) => {
    console.error('Error subscribing to trips:', error);
  });
};

export const subscribeToBookings = (callback) => {
  console.log('Subscribing to bookings...');
  const q = query(collection(db, collections.BOOKINGS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Bookings loaded:', data.length);
    callback(data);
  }, (error) => {
    console.error('Error subscribing to bookings:', error);
  });
};

export const subscribeToTestimonials = (callback) => {
  console.log('Subscribing to testimonials...');
  const q = query(collection(db, collections.TESTIMONIALS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Testimonials loaded:', data.length);
    callback(data);
  }, (error) => {
    console.error('Error subscribing to testimonials:', error);
  });
};

// Categories CRUD
export const getCategories = async () => {
  console.log('Fetching categories...');
  try {
    const q = query(collection(db, collections.CATEGORIES), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Categories fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const addCategory = async (data) => {
  console.log('Adding category:', data);
  try {
    const result = await addDoc(collection(db, collections.CATEGORIES), { ...data, createdAt: new Date().toISOString() });
    console.log('Category added with ID:', result.id);
    return result;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const updateCategory = async (id, data) => {
  console.log('Updating category:', id, data);
  try {
    await updateDoc(doc(db, collections.CATEGORIES, id), { ...data, updatedAt: new Date().toISOString() });
    console.log('Category updated successfully');
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  console.log('Deleting category:', id);
  try {
    await deleteDoc(doc(db, collections.CATEGORIES, id));
    console.log('Category deleted successfully');
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Trips CRUD
export const getTrips = async (categoryId = null) => {
  console.log('Fetching trips, categoryId:', categoryId);
  try {
    let q;
    if (categoryId) {
      q = query(collection(db, collections.TRIPS), where('categoryId', '==', categoryId), orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, collections.TRIPS), orderBy('createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Trips fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Error fetching trips:', error);
    return [];
  }
};

export const getTripById = async (id) => {
  console.log('Fetching trip by ID:', id);
  try {
    const docRef = doc(db, collections.TRIPS, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      console.log('Trip found:', snapshot.data());
      return { id: snapshot.id, ...snapshot.data() };
    }
    console.log('Trip not found');
    return null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    return null;
  }
};

export const addTrip = async (data) => {
  console.log('Adding trip:', data);
  try {
    const tripData = {
      ...data,
      createdAt: new Date().toISOString()
    };
    const result = await addDoc(collection(db, collections.TRIPS), tripData);
    console.log('Trip added with ID:', result.id);
    return result;
  } catch (error) {
    console.error('Error adding trip:', error);
    throw error;
  }
};

export const updateTrip = async (id, data) => {
  console.log('Updating trip:', id, data);
  try {
    await updateDoc(doc(db, collections.TRIPS, id), { ...data, updatedAt: new Date().toISOString() });
    console.log('Trip updated successfully');
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

export const deleteTrip = async (id) => {
  console.log('Deleting trip:', id);
  try {
    await deleteDoc(doc(db, collections.TRIPS, id));
    console.log('Trip deleted successfully');
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Bookings CRUD
export const getBookings = async () => {
  console.log('Fetching bookings...');
  try {
    const q = query(collection(db, collections.BOOKINGS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Bookings fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

export const addBooking = async (data) => {
  console.log('Adding booking:', data);
  try {
    // Use custom id (e.g. NT-OFF-xxxx / NT-WEB-xxxx) as the Firestore document ID
    // so updateBookingPayments / updateBookingStatus can find the doc by the same id
    const bookingId = data.id || `NT-${Date.now()}`;
    const docRef = doc(db, collections.BOOKINGS, bookingId);

    await setDoc(docRef, {
      ...data,
      id: bookingId,
      status: data.status || 'pending',
      createdAt: data.createdAt || new Date().toISOString()
    });

    // Auto save customer details in customer database
    if (data.phone && data.name) {
      await saveCustomer(data.phone, {
        name: data.name,
        email: data.email || '',
        whatsapp: data.whatsapp || data.phone,
        city: data.city || '',
        updatedAt: new Date().toISOString()
      });
    }

    console.log('Booking added with ID:', bookingId);
    return { id: bookingId };
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const updateBookingStatus = async (id, status) => {
  console.log('Updating booking status:', id, status);
  try {
    await updateDoc(doc(db, collections.BOOKINGS, id), { status, updatedAt: new Date().toISOString() });
    console.log('Booking status updated successfully');
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

// Testimonials CRUD
export const getTestimonials = async () => {
  console.log('Fetching testimonials...');
  try {
    const q = query(collection(db, collections.TESTIMONIALS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Testimonials fetched:', data.length);
    return data;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
};

export const addTestimonial = async (data) => {
  console.log('Adding testimonial:', data);
  try {
    const result = await addDoc(collection(db, collections.TESTIMONIALS), {
      ...data,
      createdAt: new Date().toISOString()
    });
    console.log('Testimonial added with ID:', result.id);
    return result;
  } catch (error) {
    console.error('Error adding testimonial:', error);
    throw error;
  }
};

export const deleteTestimonial = async (id) => {
  console.log('Deleting testimonial:', id);
  try {
    await deleteDoc(doc(db, collections.TESTIMONIALS, id));
    console.log('Testimonial deleted successfully');
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};

export const updateTestimonial = async (id, data) => {
  console.log('Updating testimonial:', id, data);
  try {
    await updateDoc(doc(db, collections.TESTIMONIALS, id), { ...data, updatedAt: new Date().toISOString() });
    console.log('Testimonial updated successfully');
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
};

// Image compression utility - compresses to 100-200KB max
export const compressImage = (file, maxSizeKB = 200, maxWidth = 1920) => {
  return new Promise((resolve) => {
    console.log('Compressing image:', file.name, file.size);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to get under maxSizeKB
        let quality = 0.85;
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Reduce quality until under maxSizeKB
        while (compressedDataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Convert data URL to blob
        const arr = compressedDataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const compressedFile = new File([u8arr], file.name, { type: mime });
        console.log('Image compressed:', file.name, `${file.size} -> ${compressedFile.size} bytes`);
        resolve(compressedFile);
      };
    };
  });
};

// Storage Functions
export const uploadImage = async (file, path) => {
  const tenantPath = getTenantStoragePath(path);
  console.log('Uploading image:', tenantPath, file.size);
  try {
    const storageRef = ref(storage, tenantPath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    console.log('Image uploaded successfully:', url);
    return url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadCompressedImage = async (file, path, maxSizeKB = 150) => {
  console.log('Converting image to secure Base64 format:', file.name);
  try {
    // Compress the image first to keep it compact and well under Firestore's 1MB document limit
    const compressedFile = await compressImage(file, maxSizeKB);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(compressedFile);
    });
  } catch (error) {
    console.warn('Compression failed, converting original file to Base64:', error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
};

export const uploadMultipleImages = async (files, path, maxSizeKB = 200) => {
  console.log('Uploading multiple images:', files.length);
  const urls = [];
  for (const file of files) {
    try {
      const url = await uploadCompressedImage(file, `${path}/${Date.now()}_${file.name}`, maxSizeKB);
      urls.push(url);
    } catch (error) {
      console.error('Error uploading image:', file.name, error);
    }
  }
  console.log('Multiple images uploaded:', urls.length);
  return urls;
};

export const deleteImage = async (path) => {
  const tenantPath = getTenantStoragePath(path);
  console.log('Deleting image:', tenantPath);
  try {
    const storageRef = ref(storage, tenantPath);
    await deleteObject(storageRef);
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Leads CRUD
export const saveLead = async (phone, data) => {
  console.log('Saving lead under phone:', phone, data);
  try {
    const docRef = doc(db, collections.LEADS, phone);
    const docSnap = await getDoc(docRef);
    const timestamp = new Date().toISOString();
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        ...data,
        updatedAt: timestamp
      });
    } else {
      await setDoc(docRef, {
        ...data,
        phone,
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }
    console.log('Lead saved successfully');
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};

export const subscribeToLeads = (callback) => {
  console.log('Subscribing to leads...');
  const q = query(collection(db, collections.LEADS), orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Leads loaded:', data.length);
    callback(data);
  }, (error) => {
    console.error('Error subscribing to leads:', error);
  });
};

export const deleteLead = async (phone) => {
  console.log('Deleting lead:', phone);
  try {
    await deleteDoc(doc(db, collections.LEADS, phone));
    console.log('Lead deleted');
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
};

// Contacts / Inquiries CRUD
export const subscribeToContacts = (callback) => {
  const q = query(collection(db, collections.CONTACTS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  }, (error) => {
    console.error('Error subscribing to contacts:', error);
    callback([]);
  });
};

export const deleteContact = async (id) => {
  await deleteDoc(doc(db, collections.CONTACTS, id));
};

export const updateContactStatus = async (id, status) => {
  await updateDoc(doc(db, collections.CONTACTS, id), {
    status,
    updatedAt: new Date().toISOString()
  });
};

// Vehicles CRUD
export const getVehicles = async () => {
  try {
    const q = query(collection(db, collections.VEHICLES), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return [];
  }
};

export const subscribeToVehicles = (callback) => {
  const q = query(collection(db, collections.VEHICLES), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => console.error('Error subscribing to vehicles:', error));
};

export const addVehicle = async (data) => {
  return await addDoc(collection(db, collections.VEHICLES), {
    ...data,
    createdAt: new Date().toISOString()
  });
};

export const updateVehicle = async (id, data) => {
  await updateDoc(doc(db, collections.VEHICLES, id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteVehicle = async (id) => {
  await deleteDoc(doc(db, collections.VEHICLES, id));
};

// Drivers CRUD
export const getDrivers = async () => {
  try {
    const q = query(collection(db, collections.DRIVERS), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting drivers:', error);
    return [];
  }
};

export const subscribeToDrivers = (callback) => {
  const q = query(collection(db, collections.DRIVERS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => console.error('Error subscribing to drivers:', error));
};

export const addDriver = async (data) => {
  return await addDoc(collection(db, collections.DRIVERS), {
    ...data,
    createdAt: new Date().toISOString()
  });
};

export const updateDriver = async (id, data) => {
  await updateDoc(doc(db, collections.DRIVERS, id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteDriver = async (id) => {
  await deleteDoc(doc(db, collections.DRIVERS, id));
};

// Schedules CRUD
export const getSchedules = async () => {
  try {
    const q = query(collection(db, collections.SCHEDULES), orderBy('departureDate', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting schedules:', error);
    return [];
  }
};

export const subscribeToSchedules = (callback) => {
  const q = query(collection(db, collections.SCHEDULES), orderBy('departureDate', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => console.error('Error subscribing to schedules:', error));
};

export const addSchedule = async (data) => {
  return await addDoc(collection(db, collections.SCHEDULES), {
    ...data,
    createdAt: new Date().toISOString()
  });
};

export const updateSchedule = async (id, data) => {
  await updateDoc(doc(db, collections.SCHEDULES, id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteSchedule = async (id) => {
  await deleteDoc(doc(db, collections.SCHEDULES, id));
};

// Expenses CRUD
export const getExpenses = async () => {
  try {
    const q = query(collection(db, collections.EXPENSES), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting expenses:', error);
    return [];
  }
};

export const subscribeToExpenses = (callback) => {
  const q = query(collection(db, collections.EXPENSES), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => console.error('Error subscribing to expenses:', error));
};

export const addExpense = async (data) => {
  return await addDoc(collection(db, collections.EXPENSES), {
    ...data,
    createdAt: new Date().toISOString()
  });
};

export const updateExpense = async (id, data) => {
  await updateDoc(doc(db, collections.EXPENSES, id), {
    ...data,
    updatedAt: new Date().toISOString()
  });
};

export const deleteExpense = async (id) => {
  await deleteDoc(doc(db, collections.EXPENSES, id));
};

// Customers CRUD
export const getCustomers = async () => {
  try {
    const q = query(collection(db, collections.CUSTOMERS), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

export const subscribeToCustomers = (callback) => {
  const q = query(collection(db, collections.CUSTOMERS), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }, (error) => console.error('Error subscribing to customers:', error));
};

export async function saveCustomer(phone, data) {
  const docRef = doc(db, collections.CUSTOMERS, phone);
  const docSnap = await getDoc(docRef);
  const timestamp = new Date().toISOString();
  if (docSnap.exists()) {
    await updateDoc(docRef, {
      ...data,
      updatedAt: timestamp
    });
  } else {
    await setDoc(docRef, {
      ...data,
      phone,
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
}

export const deleteCustomer = async (phone) => {
  await deleteDoc(doc(db, collections.CUSTOMERS, phone));
};

// Booking payments updating helper
export const updateBookingPayments = async (bookingId, payments, updatedFields = {}) => {
  if (!bookingId) {
    throw new Error('Booking ID is missing');
  }
  const docRef = doc(db, collections.BOOKINGS, bookingId);

  // Clean undefined values from updatedFields to satisfy Firestore constraint
  const cleanFields = {};
  Object.keys(updatedFields).forEach(key => {
    if (updatedFields[key] !== undefined) {
      cleanFields[key] = updatedFields[key];
    }
  });

  await updateDoc(docRef, {
    payments: payments || [],
    ...cleanFields,
    updatedAt: new Date().toISOString()
  });
};

// Footer Settings
export const DEFAULT_FOOTER_SETTINGS = {
  socialLinks: {
    facebook: 'https://facebook.com',
    instagram: 'https://www.instagram.com/trekpremii?igsh=N3U3ZGVhNmExZDRq&utm_source=qr',
    whatsapp: 'https://wa.me/message/FH3CMQXFFIY2H1',
    youtube: 'https://youtube.com'
  },
  contactUs: {
    address: 'Sai Vihar Colony, Near Sai Mandir, MIDC, Ranjangaon Shenpunji, Waluj, Wadgaon Kolhati, Maharashtra 431001',
    phone1: '+91 9156434444',
    phone2: '+91 7758998055',
    email: 'trekpremi01@gmail.com'
  },
  copyrightLine: '© 2026 NextTour. All rights reserved.'
};

export const subscribeToFooterSettings = (callback) => {
  const docRef = doc(db, collections.SETTINGS, 'footer');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_FOOTER_SETTINGS, ...snapshot.data() });
    } else {
      callback(DEFAULT_FOOTER_SETTINGS);
    }
  }, (error) => {
    console.error('Error subscribing to footer settings:', error);
    callback(DEFAULT_FOOTER_SETTINGS);
  });
};

export const saveFooterSettings = async (data) => {
  const docRef = doc(db, collections.SETTINGS, 'footer');
  await setDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};

// About Page Settings
export const DEFAULT_ABOUT_SETTINGS = {
  heroTitle: 'Our Story',
  heroSubtitle: 'Your trusted partner for extraordinary mountain adventures since 2014.',
  heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=2000&q=80',
  storyBadge: 'Who We Are',
  storyTitle: 'Where Adventure Meets Excellence',
  storyParagraph1: "NextTour was born from a simple belief: everyone deserves to experience the transformative power of mountain adventures. Founded by seasoned mountaineers, we've grown from a small group of passionate trekkers to one of India's most trusted adventure travel companies.",
  storyParagraph2: 'Our mission is to create unforgettable journeys that push boundaries while maintaining the highest standards of safety, sustainability, and customer satisfaction.',
  storyImage: '/about.png',
  stats: [
    { value: '8+', label: 'Years Experience' },
    { value: '500+', label: 'Treks Completed' },
    { value: '10k+', label: 'Happy Trekkers' },
    { value: '50+', label: 'Destinations' }
  ],
  values: [
    { title: 'Safety First', description: 'Your safety is our top priority. We maintain the highest safety standards with certified guides and comprehensive protocols.' },
    { title: 'Premium Quality', description: 'From accommodations to equipment, we ensure premium quality at every step of your journey.' },
    { title: 'Expert Team', description: 'Our team of certified mountaineers and local guides bring years of experience and deep regional knowledge.' },
    { title: 'Sustainable Travel', description: 'We are committed to eco-friendly practices and supporting local communities in the mountains.' }
  ],
  leadershipTitle: 'Meet Our Leadership',
  leadershipSubtitle: "The experienced team driving NextTour's vision and ensuring excellence in every journey.",
  teamMembers: [
    { name: 'Akash Jalatkar', role: 'Founder & Lead Guide', image: '/male.jpeg' },
    { name: 'Swapnali Annadate', role: 'Head Of Operations', image: '/female.png' }
  ]
};

export const subscribeToAboutSettings = (callback) => {
  const docRef = doc(db, collections.SETTINGS, 'aboutPage');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_ABOUT_SETTINGS, ...snapshot.data() });
    } else {
      callback(DEFAULT_ABOUT_SETTINGS);
    }
  }, (err) => {
    console.error('Error subscribing to about settings:', err);
    callback(DEFAULT_ABOUT_SETTINGS);
  });
};

export const saveAboutSettings = async (data) => {
  const docRef = doc(db, collections.SETTINGS, 'aboutPage');
  await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
};

// Contact Page Settings
export const DEFAULT_CONTACT_SETTINGS = {
  heroTitle: "Let's Talk Adventure",
  heroSubtitle: 'Got a trek in mind? We are here to guide you every step of the way. Reach out to our experts.',
  heroImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000',
  address: 'Sai Vihar Colony, Near Sai Mandir, MIDC, Ranjangaon Shenpunji, Waluj, Wadgaon Kolhati, Maharashtra 431001',
  phone1: '+91 9156434444',
  phone2: '+91 7758998055',
  email: 'trekpremi01@gmail.com',
  workingHours: 'Mon - Sat: 9AM - 8PM\nSunday: 10AM - 6PM',
  mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3753.308738363711!2d75.2155458!3d19.8268884!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDQ5JzM2LjgiTiA3NcKwMTInNTU.fIk!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin'
};

export const subscribeToContactSettings = (callback) => {
  const docRef = doc(db, collections.SETTINGS, 'contactPage');
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...DEFAULT_CONTACT_SETTINGS, ...snapshot.data() });
    } else {
      callback(DEFAULT_CONTACT_SETTINGS);
    }
  }, (err) => {
    console.error('Error subscribing to contact settings:', err);
    callback(DEFAULT_CONTACT_SETTINGS);
  });
};

export const saveContactSettings = async (data) => {
  const docRef = doc(db, collections.SETTINGS, 'contactPage');
  await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
};

export default app;
