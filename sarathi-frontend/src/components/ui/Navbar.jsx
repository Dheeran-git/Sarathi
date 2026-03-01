import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';

const navLinks = [
  { to: '/chat', label: 'Citizens' },
  { to: '/panchayat', label: 'Panchayat' },
  { to: '/schemes', label: 'Schemes' },
  { to: '/twin', label: 'Digital Twin' },
  { to: '/about', label: 'About' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const currentNavLinks = [
    { to: '/chat', label: 'Citizens' },
    { to: '/panchayat', label: 'Panchayat' },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    { to: '/schemes', label: 'Schemes' },
    { to: '/twin', label: 'Digital Twin' },
    { to: '/about', label: 'About' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-200 ${scrolled
          ? 'bg-navy/[0.92] backdrop-blur-[12px]'
          : 'bg-navy'
          } border-b border-navy-light/30`}
      >
        {/* Left — Logo */}
        <Link to="/" className="flex flex-col leading-tight shrink-0">
          <span className="font-display text-2xl text-saffron leading-none">
            Sarathi
          </span>
          <span className="font-body text-xs text-gray-300 leading-tight">
            AI Welfare Engine
          </span>
        </Link>

        {/* Center — Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {currentNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-body text-sm tracking-[0.5px] uppercase pb-1 transition-colors duration-200 ${isActive
                  ? 'text-saffron border-b-2 border-saffron'
                  : 'text-gray-300 hover:text-white border-b-2 border-transparent'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right — Actions */}
        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-slate-700 text-slate-300 font-body text-xs font-semibold hover:bg-slate-800 transition-colors duration-200"
            aria-label="Toggle language"
          >
            <Globe size={14} />
            {language === 'hi' ? 'EN' : 'HI'}
          </button>

          {/* Desktop-only Buttons */}
          {isAuthenticated ? (
            <div className="hidden lg:flex items-center gap-4">
              <span className="font-body text-sm text-slate-300">
                Welcome, <span className="font-semibold text-saffron">{user?.email?.split('@')[0] || 'User'}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center h-9 px-4 rounded-md border border-red-500/30 text-red-500 font-body text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden lg:inline-flex items-center h-9 px-4 rounded-md border border-saffron text-saffron font-body text-sm font-medium hover:bg-saffron/10 transition-colors duration-200"
              >
                Panchayat Login
              </Link>
              <Link
                to="/signup"
                className="hidden lg:inline-flex items-center h-9 px-4 rounded-md bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-200"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 relative"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
                }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${mobileOpen ? 'opacity-0 scale-x-0' : ''
                }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
                }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-16 right-0 bottom-0 z-40 w-72 bg-navy transform transition-transform duration-300 ease-in-out lg:hidden ${mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col p-6 gap-2">
          {currentNavLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center h-12 px-4 rounded-lg font-body text-base transition-colors duration-200 ${isActive
                  ? 'text-saffron bg-navy-mid'
                  : 'text-gray-300 hover:text-white hover:bg-navy-mid/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <hr className="border-navy-light/30 my-3" />

          {/* Language Toggle Mobile */}
          <button
            onClick={toggleLanguage}
            className="flex items-center justify-between h-12 px-4 rounded-lg bg-slate-800/30 text-slate-300 font-body text-base hover:bg-slate-800 transition-colors duration-200"
          >
            <span className="flex items-center gap-2">
              <Globe size={18} /> Language
            </span>
            <span className="font-semibold text-saffron uppercase">{language === 'hi' ? 'Hindi' : 'English'}</span>
          </button>

          <hr className="border-navy-light/30 my-3" />

          {isAuthenticated ? (
            <>
              <div className="px-4 py-2 font-body text-sm text-slate-400 mb-2">
                Logged in as <span className="text-white">{user?.email || 'User'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center h-12 rounded-lg border border-red-500/30 text-red-500 font-body text-sm font-medium hover:bg-red-500/10 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-12 rounded-lg border border-saffron text-saffron font-body text-sm font-medium hover:bg-saffron/10 transition-colors duration-200"
              >
                Panchayat Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-12 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-200"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
