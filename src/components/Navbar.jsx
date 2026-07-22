import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Search, MapPin } from 'lucide-react';
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
        typingSpeed = 30; // faster delete
      } else {
        currentText = fullText.substring(0, currentText.length + 1);
        typingSpeed = 60 + Math.random() * 40; // slightly random typing speed
      }
      
      // Update refs directly for performance (no re-renders)
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

    // start typing after a short initial delay
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

  // active check — handle query-param links too
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
    <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparent ? 'bg-transparent border-transparent' : 'bg-white shadow-sm border-b border-[#ebebeb]'}`}>
      <div className="w-full px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-[64px] md:h-20">
          
          {/* Left - Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/nexttour.jpeg"
                alt="NextTour Logo"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Center - Premium Search Pill */}
          <div className="flex-1 mx-4 hidden md:block" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full h-[48px] rounded-full bg-white border border-[#dddddd] shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-shadow duration-200 pl-5 pr-2 py-2 cursor-text focus-within:bg-[#f7f7f7]">
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
                className="flex-1 w-full bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-[#222222] placeholder:text-[#717171] font-medium"
              />
              <button type="submit" className="bg-[#D2E823] p-2 rounded-full ml-2 flex-shrink-0 flex items-center justify-center hover:bg-[#c4db1c] transition-colors">
                <Search size={16} className="text-[#111111]" strokeWidth={3} />
              </button>

              {/* Suggestions Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.15)] border border-[#ebebeb] overflow-hidden z-[100] py-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(trip => (
                      <Link 
                        key={trip.id}
                        to={`/trip/${trip.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-[#f7f7f7] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                          <img src={trip.images?.[0] || '/placeholder.jpg'} alt={trip.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#222222] truncate">{trip.title}</h4>
                          <p className="text-xs text-[#717171] truncate flex items-center gap-1 mt-0.5">
                            <MapPin size={10} className="flex-shrink-0" /> <span className="truncate">{trip.location}</span>
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-5 py-4 text-sm text-[#717171] text-center">
                      No matching trips found
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right - Mobile Menu Button */}
          <div className="flex items-center justify-end flex-shrink-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              }}
              className={`md:hidden p-2 transition-colors rounded-lg ${isTransparent ? 'text-white hover:bg-white/10' : 'text-[#222222] hover:bg-gray-100'}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Persistent Mobile Search Bar */}
        <div ref={mobileSearchContainerRef} className="px-4 pb-3 pt-1 block md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="border w-full border-gray-300 shadow-sm rounded-full bg-white">
            <div className="flex items-center gap-2 px-2 py-2 w-[95%] mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search text-[#717171]">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              <input 
                ref={mobileInputRef}
                id="searchInput" 
                className="border-none bg-transparent focus:outline-none w-full text-sm text-[#222222]" 
                placeholder="Search destinations, treks..." 
                type="text" 
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
              />
            </div>
          </form>

          {/* Mobile Search Suggestions */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-[calc(100%+4px)] left-4 right-4 bg-white rounded-xl border border-[#ebebeb] shadow-lg overflow-hidden z-[100]">
              {searchResults.length > 0 ? (
                searchResults.map(trip => (
                  <Link 
                    key={trip.id}
                    to={`/trip/${trip.id}`}
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-[#f7f7f7] transition-colors border-b border-[#f0f0f0] last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={trip.images?.[0] || '/placeholder.jpg'} alt={trip.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#222222] truncate">{trip.title}</h4>
                      <p className="text-xs text-[#717171] truncate flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="flex-shrink-0" /> <span className="truncate">{trip.location}</span>
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-[#717171] text-center">
                  No matching trips found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`absolute top-full right-4 sm:right-6 md:right-8 w-64 bg-white rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.15)] border border-[#ebebeb] overflow-hidden transition-all duration-200 origin-top-right ${
          isMobileMenuOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="py-2">
          {navLinks.map((link, index) => (
            <div key={link.path}>
              <Link
                to={link.path}
                className={`block px-4 py-3 text-sm font-medium transition-colors hover:bg-[#f7f7f7] ${
                  isActive(link.path) ? 'text-[#222222] font-semibold' : 'text-[#717171]'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
