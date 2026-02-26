import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

const navLinks = [
  { to: '/chat', label: 'नागरिक', labelEn: 'Citizens' },
  { to: '/panchayat', label: 'पंचायत', labelEn: 'Panchayat' },
  { to: '/schemes', label: 'योजनाएं', labelEn: 'Schemes' },
  { to: '/about', label: 'हमारे बारे में', labelEn: 'About' },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, toggleLanguage } = useLanguage();

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
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 lg:px-8 transition-all duration-200 ${
          scrolled
            ? 'bg-navy/[0.92] backdrop-blur-[12px]'
            : 'bg-navy'
        } border-b border-navy-light/30`}
      >
        {/* Left — Logo */}
        <Link to="/" className="flex flex-col leading-tight shrink-0">
          <span className="font-display text-2xl text-saffron leading-none">
            सारथी
          </span>
          <span className="font-body text-xs text-gray-300 leading-tight">
            Sarathi
          </span>
        </Link>

        {/* Center — Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `font-body text-sm tracking-[0.5px] uppercase pb-1 transition-colors duration-200 ${
                  isActive
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
            className="relative w-20 h-8 rounded-full border border-navy-light flex items-center overflow-hidden shrink-0"
            aria-label="Toggle language"
          >
            <span
              className={`absolute top-0 h-full w-1/2 rounded-full bg-saffron transition-transform duration-200 ease-in-out ${
                language === 'hi' ? 'translate-x-0' : 'translate-x-full'
              }`}
            />
            <span
              className={`relative z-10 flex-1 text-center text-xs font-body font-medium transition-colors duration-200 ${
                language === 'hi' ? 'text-white' : 'text-gray-500'
              }`}
            >
              हिं
            </span>
            <span
              className={`relative z-10 flex-1 text-center text-xs font-body font-medium transition-colors duration-200 ${
                language === 'en' ? 'text-white' : 'text-gray-500'
              }`}
            >
              EN
            </span>
          </button>

          {/* Desktop-only Buttons */}
          <Link
            to="/panchayat"
            className="hidden lg:inline-flex items-center h-9 px-4 rounded-md border border-saffron text-saffron font-body text-sm font-medium hover:bg-saffron/10 transition-colors duration-200"
          >
            पंचायत लॉगिन
          </Link>
          <Link
            to="/chat"
            className="hidden lg:inline-flex items-center h-9 px-4 rounded-md bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-200"
          >
            शुरू करें
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden flex flex-col items-center justify-center w-10 h-10 gap-1.5 relative"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${
                mobileOpen ? 'rotate-45 translate-y-[4px]' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${
                mobileOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 origin-center ${
                mobileOpen ? '-rotate-45 -translate-y-[4px]' : ''
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
        className={`fixed top-16 right-0 bottom-0 z-40 w-72 bg-navy transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col p-6 gap-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center h-12 px-4 rounded-lg font-body text-base transition-colors duration-200 ${
                  isActive
                    ? 'text-saffron bg-navy-mid'
                    : 'text-gray-300 hover:text-white hover:bg-navy-mid/50'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <hr className="border-navy-light/30 my-3" />

          <Link
            to="/panchayat"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center h-12 rounded-lg border border-saffron text-saffron font-body text-sm font-medium hover:bg-saffron/10 transition-colors duration-200"
          >
            पंचायत लॉगिन
          </Link>
          <Link
            to="/chat"
            onClick={() => setMobileOpen(false)}
            className="flex items-center justify-center h-12 rounded-lg bg-saffron text-white font-body text-sm font-medium hover:bg-saffron-light transition-colors duration-200"
          >
            शुरू करें
          </Link>
        </div>
      </div>

      {/* Spacer so page content sits below the fixed navbar */}
      <div className="h-16" />
    </>
  );
}

export default Navbar;
