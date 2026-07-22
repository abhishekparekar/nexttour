# Trek Premi - Premium Travel Platform (Multi-Tenant White Label)

> **Explore Beyond Limits** - A modern, premium travel and trekking SaaS platform built with React.js, Tailwind CSS, and Firebase. Now configured as a **white-label multi-tenant system** for easy deployment across multiple clients.

## 🎯 Multi-Tenant White Label System

This application is configured as a white-label product with complete tenant isolation. Each tenant (client) has their own isolated data in Firebase.

### ⚡ Quick Tenant Switch
Change one line in `src/config/tenant.js`:
```javascript
const TENANT_CONFIG = {
  TENANT_ID: 'your-client-id',  // Change this to switch tenants
  TENANT_NAME: 'Your Company Name',
};
```

### 📍 Current Tenant
- **Tenant ID:** trek-premi
- **Data Path:** `tenants/trek-premi/*`
- **Storage Path:** `tenants/trek-premi/*`

### 📚 Multi-Tenant Documentation
- 📘 [Quick Start Guide](QUICK_START_TENANT.md) - Get started in 5 minutes
- 📗 [Complete Setup Guide](TENANT_SETUP.md) - Detailed configuration
- 📙 [Architecture Overview](TENANT_ARCHITECTURE.md) - System design & diagrams

### ✨ Multi-Tenant Benefits
- ✅ **Complete Data Isolation** - Each tenant has separate data
- ✅ **Single Codebase** - One codebase for all clients
- ✅ **Easy Deployment** - Change one config value to deploy for new client
- ✅ **Scalable** - Add unlimited tenants without code changes
- ✅ **Secure** - Firebase security rules enforce tenant isolation

## ✨ Features

### Public Website (7 Pages)
- 🏠 **Home** - Hero, search, popular trips, categories, testimonials, gallery
- 🗺️ **Trips** - Searchable/filterable trip catalog with category pills
- 📍 **Trip Detail** - Full details with image slider, tabs (itinerary, inclusions, add-ons, dates, policies)
- 📝 **Booking** - Complete booking form with Firebase integration
- ℹ️ **About** - Company story, values, team
- 📞 **Contact** - Contact form and information

### Admin Dashboard (6 Pages)
- 📊 **Dashboard** - Stats overview, recent bookings
- 🏔️ **Manage Trips** - Add/edit/delete trips with all details
- 📋 **Manage Bookings** - View and filter bookings
- ⭐ **Manage Testimonials** - Customer reviews
- 🏷️ **Manage Categories** - Organize trip categories
- 🖼️ **Manage Gallery** - Upload/manage gallery images

### Premium UI Features
- 🌙 Dark theme with orange (#f97316) accent
- 📱 Fully responsive (mobile-first)
- ✨ Smooth animations and hover effects
- 🎨 Poppins + Inter typography
- 🧭 Glassmorphism navbar
- 📷 Image sliders with auto-play
- ⭐ Ratings and testimonials

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore + Storage)
- **Fonts**: Google Fonts (Poppins, Inter)

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

## 🔥 Firebase Setup

### Multi-Tenant Data Structure

All data is stored under tenant-specific paths for complete isolation:

```
Firestore:
└── tenants/
    └── trek-premi/              ← Current tenant
        ├── categories/
        ├── trips/
        ├── bookings/
        ├── testimonials/
        └── gallery/

Storage:
└── tenants/
    └── trek-premi/              ← Current tenant
        ├── categories/
        ├── trips/
        ├── gallery/
        └── testimonials/
```

### Firestore Collections

```javascript
// trips
{
  id: string,
  title: string,
  location: string,
  categoryId: string,
  categoryName: string,
  price: number,
  nights: number,
  days: number,
  rating: number,
  difficulty: 'Easy' | 'Moderate' | 'Difficult' | 'Expert',
  maxGroupSize: number,
  images: string[],
  description: string,
  highlights: string[],
  itinerary: { day: number, title: string, description: string }[],
  inclusions: string[],
  exclusions: string[],
  addons: { name: string, price: number, description: string }[],
  availableDates: string[],
  thingsToCarry: string[],
  cancellationPolicy: string[],
  rules: string[],
  featured: boolean,
  status: 'active' | 'inactive'
}

// categories
{
  id: string,
  title: string,
  description: string,
  image: string,
  order: number
}

// bookings
{
  id: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  tripId: string,
  trekkers: number,
  date: string,
  status: 'pending' | 'confirmed' | 'cancelled',
  createdAt: string
}

// testimonials
{
  id: string,
  name: string,
  role: string,
  location: string,
  rating: number,
  text: string,
  avatar: string,
  status: 'active' | 'draft'
}
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx      # Glassmorphism navigation
│   ├── Hero.jsx        # Hero with search
│   ├── Footer.jsx      # Site footer
│   ├── TripCard.jsx    # Trip card component
│   ├── ImageSlider.jsx # Image carousel
│   ├── CategoryCard.jsx
│   └── ...
├── pages/             # Page components
│   ├── Home.jsx
│   ├── Trips.jsx
│   ├── TripDetail.jsx
│   ├── Booking.jsx
│   ├── About.jsx
│   ├── Contact.jsx
│   └── admin/         # Admin panel
│       ├── Dashboard.jsx
│       ├── Trips.jsx
│       ├── Bookings.jsx
│       ├── Testimonials.jsx
│       ├── Categories.jsx
│       └── Gallery.jsx
├── firebase.js        # Firebase config & functions
├── App.jsx            # Routes
└── index.css          # Global styles
```

## 🎨 Design System

### Colors
- **Primary**: Orange (#f97316)
- **Dark Background**: #0f172a to #1e293b
- **Accent**: Orange gradient

### Typography
- **Headings**: Poppins (600-800)
- **Body**: Inter (400-500)

### Spacing
- Section: py-20 to py-32
- Container: max-w-7xl
- Cards: rounded-2xl

## 🔗 Routes

| Route | Page |
|-------|------|
| `/` | Home |
| `/trips` | Trips Listing |
| `/trip/:id` | Trip Detail |
| `/booking/:tripId` | Booking Form |
| `/about` | About |
| `/contact` | Contact |
| `/admin` | Admin Dashboard |
| `/admin/trips` | Manage Trips |
| `/admin/bookings` | Manage Bookings |
| `/admin/testimonials` | Manage Testimonials |
| `/admin/categories` | Manage Categories |
| `/admin/gallery` | Manage Gallery |

## 📱 Responsive

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

Built with ❤️ for adventure seekers

