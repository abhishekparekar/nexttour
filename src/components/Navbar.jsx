import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, MapPin, Phone } from 'lucide-react';
import { useCachedTrips } from '../firebaseCache';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [trips, setTrips] = useState([]);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = useCachedTrips((data) => {
      setTrips(data);
    });
    return () => unsubscribe();
  }, []);

  // Typewriter effect for search placeholder
  useEffect(() => {
    if (!trips || trips.length === 0) return;

    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let typingSpeed = 100;
    let timeout;
    let isActive = true;

    const type = () => {
      if (!isActive) return;

      const fullText = trips[currentIndex]?.title || 'Manali Adventure Tour';
      if (!fullText) {
        currentIndex = (currentIndex + 1) % trips.length;
        timeout = setTimeout(type, 100);
        return;
      }

      if (isDeleting) {
        currentText = fullText.substring(0, currentText.length - 1);
        typingSpeed = 30;
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
        typingSpeed = 60 + Math.random() * 40;
      }

      if (desktopInputRef.current) desktopInputRef.current.placeholder = currentText || 'Search destinations, treks...';
      if (mobileInputRef.current) mobileInputRef.current.placeholder = currentText || 'Search destinations, treks...';

      if (!isDeleting && currentText === fullText) {
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === '') {
        isDeleting = false;
        currentIndex = (currentIndex + 1) % trips.length;
        typingSpeed = 500;
      }

      timeout = setTimeout(type, typingSpeed);
    };

    timeout = setTimeout(type, 1000);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [trips]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideDesktop = searchContainerRef.current && !searchContainerRef.current.contains(event.target);
      const isOutsideMobile = mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(event.target);
      if (isOutsideDesktop && isOutsideMobile) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Testimonials', path: '/testimonials' },
  ];

  const isActive = (path) => {
    const [p, q] = path.split('?');
    if (q) {
      return location.pathname === p && location.search === `?${q}`;
    }
    return location.pathname === path;
  };

  const searchResults = searchQuery.trim()
    ? trips.filter(t =>
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.location?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      navigate(`/trip/${searchResults[0].id}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 20) {
        setIsVisible(true);
        setIsScrolled(false);
      } else {
        setIsScrolled(true);
        if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
          setIsVisible(false); // Hide on scroll down
        } else if (currentScrollY < lastScrollY.current) {
          setIsVisible(true);  // Show on scroll up
        }
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shouldShow = isVisible || isMobileMenuOpen || isSearchFocused;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${shouldShow ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } ${isScrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-3 sm:gap-6">

          {/* 3D Transparent Display Logo - No White Box */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/nexttour.jpeg"
                alt="NextTour Logo"
                className="h-9 md:h-11 w-auto object-contain rounded-xl mix-blend-screen drop-shadow-[0_4px_16px_rgba(0,201,183,0.6)] filter brightness-110 group-hover:scale-105 transition-all duration-300"
              />
            </Link>
          </div>

          {/* Search Bar - Glass Pill Desktop */}
          <div className="hidden lg:block flex-1 max-w-md" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-11 rounded-full bg-white/90 backdrop-blur-xl shadow-lg pl-5 pr-1.5 border border-white/40 focus-within:ring-2 focus-within:ring-[#00C9B7] focus-within:bg-white transition-all">
              <input
                ref={desktopInputRef}
                type="text"
                placeholder="Search destinations, treks..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="flex-1 w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 font-medium"
              />
              <button type="submit" className="bg-[#00C9B7] p-2 rounded-full flex-shrink-0 flex items-center justify-center hover:bg-[#00b5a3] transition-colors shadow-md active:scale-95">
                <Search size={16} className="text-white" strokeWidth={2.5} />
              </button>

              {/* Suggestions Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.length > 0 ? (
                    searchResults.map(trip => (
                      <Link
                        key={trip.id}
                        to={`/trip/${trip.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#E6FAF8] transition-colors border-b border-gray-50 last:border-0"
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-inner">
                          <img src={trip.images?.[0] || '/placeholder.jpg'} alt={trip.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 truncate">{trip.title}</h4>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5 font-medium">
                            <MapPin size={11} className="flex-shrink-0 text-[#00C9B7]" /> <span className="truncate">{trip.location}</span>
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center font-medium">
                      No matching trips found
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-4 xl:gap-8">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative text-sm font-bold transition-all duration-200 py-1 drop-shadow-md ${active
                      ? 'text-[#00C9B7] font-extrabold'
                      : 'text-gray-100 hover:text-white'
                    }`}
                >
                  {link.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00C9B7] rounded-full shadow-[0_0_10px_#00C9B7]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Contact Us CTA Button & Modern Glowing Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#00C9B7] text-white text-xs font-black shadow-lg hover:bg-[#00b5a3] hover:shadow-[0_0_20px_rgba(0,199,183,0.5)] transition-all duration-300 active:scale-95"
            >
              <Phone size={14} className="text-white" />
              <span>Contact Us</span>
            </Link>

            {/* Glowing Modern Mobile Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl border border-[#00C9B7]/40 text-[#00C9B7] bg-[#00C9B7]/15 hover:bg-[#00C9B7]/30 backdrop-blur-md shadow-[0_0_15px_rgba(0,199,183,0.3)] transition-all active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar */}
        <div ref={mobileSearchContainerRef} className="pb-3 pt-1 block lg:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-10 rounded-full bg-white shadow-md pl-4 pr-1.5 border border-gray-100">
            <input
              ref={mobileInputRef}
              id="searchInput"
              className="flex-1 w-full bg-transparent border-none focus:outline-none text-xs text-gray-800 placeholder:text-gray-400 font-medium"
              placeholder="Search destinations, treks..."
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
            />
            <button type="submit" className="bg-[#00C9B7] p-1.5 rounded-full ml-1 flex-shrink-0 flex items-center justify-center active:scale-95">
              <Search size={14} className="text-white" strokeWidth={2.5} />
            </button>
          </form>

          {/* Mobile Search Suggestions */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden z-[100] py-2">
              {searchResults.length > 0 ? (
                searchResults.map(trip => (
                  <Link
                    key={trip.id}
                    to={`/trip/${trip.id}`}
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={trip.images?.[0] || '/placeholder.jpg'} alt={trip.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{trip.title}</h4>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="flex-shrink-0 text-[#00C9B7]" /> <span className="truncate">{trip.location}</span>
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No matching trips found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0d1117]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl px-4 py-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm font-bold transition-all ${isActive(link.path)
                  ? 'text-[#00C9B7] bg-white/10 border-l-4 border-[#00C9B7]'
                  : 'text-gray-200 hover:bg-white/5 hover:text-white'
                }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3">
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-[#00C9B7] text-white text-sm font-black shadow-md hover:bg-[#00b5a3] transition-colors"
            >
              <Phone size={16} className="text-white" />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;


