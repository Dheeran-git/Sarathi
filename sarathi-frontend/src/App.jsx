import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/ui/Navbar';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import TwinPage from './pages/TwinPage';
import PanchayatDashboard from './pages/PanchayatDashboard';
import SchemesPage from './pages/SchemesPage';
import SchemeDetailPage from './pages/SchemeDetailPage';
import ApplyPage from './pages/ApplyPage';
import AboutPage from './pages/AboutPage';

/**
 * Page transition wrapper — fades pages in/out on route change.
 * Spec §12: "Fade out current page (150ms) → fade in new page (200ms)"
 */
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
            <Route path="/chat" element={<PageTransition><ChatPage /></PageTransition>} />
            <Route path="/twin" element={<PageTransition><TwinPage /></PageTransition>} />
            <Route path="/panchayat" element={<PageTransition><PanchayatDashboard /></PageTransition>} />
            <Route path="/schemes" element={<PageTransition><SchemesPage /></PageTransition>} />
            <Route path="/schemes/:schemeId" element={<PageTransition><SchemeDetailPage /></PageTransition>} />
            <Route path="/apply/:schemeId" element={<PageTransition><ApplyPage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            {/* 404 catch-all — prevents blank screen on unknown routes */}
            <Route path="*" element={
              <PageTransition>
                <div className="min-h-screen bg-off-white flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-display text-6xl text-gray-200 mb-4">404</p>
                    <p className="font-body text-gray-500 mb-6">This page could not be found.</p>
                    <Link to="/" className="text-saffron font-body hover:underline">← Go Home</Link>
                  </div>
                </div>
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>
    </>
  );
}

export default App;
