import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, MapPin, Phone } from 'lucide-react';
import { useCachedTrips } from '../firebaseCache';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
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
      
      const fullText = trips[currentIndex]?.title || '';
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
      
      if (desktopInputRef.current) desktopInputRef.current.placeholder = currentText;
      if (mobileInputRef.current) mobileInputRef.current.placeholder = currentText;
      
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
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    setIsScrolled(window.scrollY > 10);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !isScrolled;

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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent border-transparent' : 'bg-white shadow-sm border-b border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/nexttour.jpeg"
                alt="NextTour Logo"
                className={`h-9 md:h-11 w-auto object-contain bg-white rounded-xl p-1.5 transition-all duration-300 ${
                  isTransparent ? 'shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-white/20' : 'border border-gray-200'
                }`}
              />
            </Link>
          </div>

          {/* Desktop Search Bar */}
          <div className="hidden lg:block flex-1 max-w-md mx-4" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-11 rounded-full bg-white border border-gray-300 shadow-sm hover:shadow-md transition-shadow pl-4 pr-1.5 focus-within:ring-2 focus-within:ring-[#00C9B7] focus-within:border-transparent">
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
              <button type="submit" className="bg-[#00C9B7] p-2 rounded-full ml-2 flex-shrink-0 flex items-center justify-center hover:bg-[#00b5a3] transition-colors">
                <Search size={15} className="text-white" strokeWidth={2.5} />
              </button>

              {/* Suggestions Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100] py-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(trip => (
                      <Link 
                        key={trip.id}
                        to={`/trip/${trip.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
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
            </form>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm transition-colors duration-200 ${
                  isActive(link.path)
                    ? isTransparent
                      ? 'text-white font-extrabold'
                      : 'text-[#00C9B7] font-extrabold'
                    : isTransparent
                      ? 'text-white/80 hover:text-white font-semibold'
                      : 'text-gray-700 hover:text-[#00C9B7] font-semibold'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action / Contact CTA + Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold shadow-sm transition-all duration-200 ${
                isTransparent
                  ? 'bg-white text-[#00C9B7] hover:bg-gray-100 shadow-md'
                  : 'bg-[#00C9B7] text-white hover:bg-[#00b3a2] shadow-[#00C9B7]/20 hover:shadow-md'
              }`}
            >
              <Phone size={14} />
              <span>Contact Us</span>
            </Link>

            {/* Mobile Hamburger / Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`md:hidden p-2 rounded-xl border transition-colors ${
                isTransparent 
                  ? 'text-white border-white/30 bg-black/20 hover:bg-black/40' 
                  : 'text-gray-700 border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar (under logo on mobile) */}
        <div ref={mobileSearchContainerRef} className="pb-3 pt-1 block lg:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-10 rounded-full bg-white border border-gray-300 shadow-sm pl-4 pr-1.5">
            <input 
              ref={mobileInputRef}
              id="searchInput" 
              className="flex-1 w-full bg-transparent border-none focus:outline-none text-xs text-gray-900 placeholder:text-gray-400 font-medium" 
              placeholder="Search destinations, treks..." 
              type="text" 
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchFocused(true);
              }}
            />
            <button type="submit" className="bg-[#00C9B7] p-1.5 rounded-full ml-1 flex-shrink-0 flex items-center justify-center">
              <Search size={14} className="text-white" strokeWidth={2.5} />
            </button>
          </form>

          {/* Mobile Search Suggestions */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-[100] py-2">
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

      {/* Mobile Menu Drawer / Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-xl px-4 py-4 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isActive(link.path) 
                  ? 'text-[#00C9B7] font-extrabold' 
                  : 'text-gray-700 hover:text-[#00C9B7]'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#00C9B7] text-white text-sm font-bold shadow-md hover:bg-[#00b5a3] transition-colors"
            >
              <Phone size={16} />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
