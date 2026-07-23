import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import ScrollProgress from './components/ScrollProgress';
import Home from './pages/Home';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import CategoryDetail from './pages/CategoryDetail';
import Booking from './pages/Booking';
import About from './pages/About';
import Contact from './pages/Contact';
import GalleryPage from './pages/GalleryPage';
import TestimonialsPage from './pages/TestimonialsPage';

import AdminLayout from './pages/admin/Layout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTrips from './pages/admin/Trips';
import AdminBookings from './pages/admin/Bookings';
import AdminTestimonials from './pages/admin/Testimonials';
import AdminCategories from './pages/admin/Categories';
import AdminGallery from './pages/admin/Gallery';
import AdminLeads from './pages/admin/Leads';

// New Admin imports
import AdminVehicles from './pages/admin/Vehicles';
import AdminDrivers from './pages/admin/Drivers';
import AdminSchedules from './pages/admin/Schedules';
import AdminExpenses from './pages/admin/Expenses';
import AdminPayments from './pages/admin/Payments';
import AdminReports from './pages/admin/Reports';
import AdminFooterSettings from './pages/admin/FooterSettings';
import AdminAboutSettings from './pages/admin/AboutSettings';
import AdminContactSettings from './pages/admin/ContactSettings';
import AdminInquiries from './pages/admin/Inquiries';

function App() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <>
      <ScrollProgress />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="trips" element={<Trips />} />
          <Route path="trip/:id" element={<TripDetail />} />
          <Route path="trips/:id" element={<TripDetail />} />
          <Route path="category/:id" element={<CategoryDetail />} />
          <Route path="booking/:tripId" element={<Booking />} />

          <Route path="contact" element={<Contact />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="trips" element={<AdminTrips />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="leads" element={<AdminLeads />} />
          <Route path="inquiries" element={<AdminInquiries />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="testimonials" element={<AdminTestimonials />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="drivers" element={<AdminDrivers />} />
          <Route path="schedules" element={<AdminSchedules />} />
          <Route path="expenses" element={<AdminExpenses />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="footer" element={<AdminFooterSettings />} />
          <Route path="about" element={<AdminAboutSettings />} />
          <Route path="contact" element={<AdminContactSettings />} />
        </Route>
        {/* Default fallback: Redirect any unmapped or missing route to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </>
  );
}

export default App;
