import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 ${isHome ? 'mt-0' : 'mt-[48px]'} md:mt-0`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
