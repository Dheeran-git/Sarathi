import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
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
import ProfilePage from './pages/ProfilePage';
import LocationSetupPage from './pages/LocationSetupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ApplicationsPage from './pages/ApplicationsPage';
// Admin Pages
import AdminLayout from './AdminLayout';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSignupPage from './pages/AdminSignupPage';
import AdminVerifyPage from './pages/AdminVerifyPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminApplicantsPage from './pages/AdminApplicantsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import SchemeEditor from './pages/SchemeEditor';

// Auth & Dashboard Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyPage from './pages/VerifyPage';
import PanchayatLoginPage from './pages/PanchayatLoginPage';
import PanchayatSignupPage from './pages/PanchayatSignupPage';
import PanchayatVerifyPage from './pages/PanchayatVerifyPage';
import PanchayatForgotPasswordPage from './pages/PanchayatForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import EligibleSchemesPage from './pages/EligibleSchemesPage';
import AgentChatPage from './pages/AgentChatPage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import PrivateRoute from './components/auth/PrivateRoute';

// Panchayat Portal Pages
import PanchayatCitizenRegistry from './pages/panchayat/PanchayatCitizenRegistry';
import PanchayatAnalytics from './pages/panchayat/PanchayatAnalytics';
import PanchayatApplicationsManager from './pages/panchayat/PanchayatApplicationsManager';
import PanchayatOutreach from './pages/panchayat/PanchayatOutreach';
import PanchayatSettings from './pages/panchayat/PanchayatSettings';
import VillageProfile from './pages/panchayat/VillageProfile';
import WelfareCalendar from './pages/panchayat/WelfareCalendar';
import GrievanceTracker from './pages/panchayat/GrievanceTracker';
import PerformanceReport from './pages/panchayat/PerformanceReport';
import PanchayatSidebar from './components/panchayat/PanchayatSidebar';

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

/** Wraps panchayat pages in the sidebar layout */
function PanchayatLayout({ children }) {
  return (
    <PanchayatSidebar>
      <PageTransition>{children}</PageTransition>
    </PanchayatSidebar>
  );
}

function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Navbar />}
      <main className={isAdminRoute ? "" : "pt-16"}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />

            {/* Citizen-only routes */}
            <Route path="/chat" element={<PrivateRoute requiredRole="citizen"><PageTransition><ChatPage /></PageTransition></PrivateRoute>} />
            <Route path="/twin" element={<PrivateRoute requiredRole="citizen"><PageTransition><TwinPage /></PageTransition></PrivateRoute>} />
            <Route path="/dashboard" element={<PrivateRoute requiredRole="citizen"><PageTransition><DashboardPage /></PageTransition></PrivateRoute>} />
            <Route path="/setup-location" element={<PrivateRoute requiredRole="citizen"><PageTransition><LocationSetupPage /></PageTransition></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute requiredRole="citizen"><PageTransition><ProfilePage /></PageTransition></PrivateRoute>} />
            <Route path="/schemes" element={<PrivateRoute requiredRole="citizen"><PageTransition><SchemesPage /></PageTransition></PrivateRoute>} />
            <Route path="/schemes/:schemeId" element={<PrivateRoute requiredRole="citizen"><PageTransition><SchemeDetailPage /></PageTransition></PrivateRoute>} />
            <Route path="/apply/:schemeId" element={<PrivateRoute requiredRole="citizen"><PageTransition><ApplyPage /></PageTransition></PrivateRoute>} />
            <Route path="/my-schemes" element={<PrivateRoute requiredRole="citizen"><PageTransition><EligibleSchemesPage /></PageTransition></PrivateRoute>} />
            <Route path="/applications" element={<PrivateRoute requiredRole="citizen"><PageTransition><ApplicationsPage /></PageTransition></PrivateRoute>} />
            <Route path="/agent" element={<PrivateRoute requiredRole="citizen"><PageTransition><AgentChatPage /></PageTransition></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute requiredRole="citizen"><PageTransition><DocumentUploadPage /></PageTransition></PrivateRoute>} />

            {/* Panchayat-only routes — wrapped in sidebar layout */}
            <Route path="/panchayat" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatDashboard /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/citizens" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatCitizenRegistry /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/analytics" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatAnalytics /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/applications" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatApplicationsManager /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/outreach" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatOutreach /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/village" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><VillageProfile /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/calendar" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><WelfareCalendar /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/grievances" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><GrievanceTracker /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/report" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PerformanceReport /></PanchayatLayout></PrivateRoute>} />
            <Route path="/panchayat/settings" element={<PrivateRoute requiredRole="panchayat"><PanchayatLayout><PanchayatSettings /></PanchayatLayout></PrivateRoute>} />

            {/* Admin routes (Authentication temporarily disabled for testing) */}
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<PageTransition><AdminDashboard /></PageTransition>} />
              <Route path="/admin/applicants" element={<PageTransition><AdminApplicantsPage /></PageTransition>} />
              <Route path="/admin/schemes/new" element={<PageTransition><SchemeEditor /></PageTransition>} />
              <Route path="/admin/analytics" element={<PageTransition><AdminAnalyticsPage /></PageTransition>} />
              <Route path="/admin/settings" element={<PageTransition><div className="p-8"><h1 className="text-3xl font-display text-navy text-center mt-20">Settings <span className="text-saffron">(Coming Soon)</span></h1></div></PageTransition>} />
            </Route>

            {/* Citizen auth */}
            <Route path="/citizen/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/citizen/signup" element={<PageTransition><SignupPage /></PageTransition>} />
            <Route path="/citizen/verify" element={<PageTransition><VerifyPage /></PageTransition>} />

            {/* Panchayat auth */}
            <Route path="/panchayat/login" element={<PageTransition><PanchayatLoginPage /></PageTransition>} />
            <Route path="/panchayat/signup" element={<PageTransition><PanchayatSignupPage /></PageTransition>} />
            <Route path="/panchayat/verify" element={<PageTransition><PanchayatVerifyPage /></PageTransition>} />
            <Route path="/panchayat/forgot-password" element={<PageTransition><PanchayatForgotPasswordPage /></PageTransition>} />

            {/* Admin auth */}
            <Route path="/admin/login" element={<PageTransition><AdminLoginPage /></PageTransition>} />
            <Route path="/admin/signup" element={<PageTransition><AdminSignupPage /></PageTransition>} />
            <Route path="/admin/verify" element={<PageTransition><AdminVerifyPage /></PageTransition>} />

            {/* Redirects for removed/moved routes */}
            <Route path="/smart-assistant" element={<Navigate to="/agent" replace />} />

            {/* Legacy redirects */}
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/signup" element={<PageTransition><SignupPage /></PageTransition>} />
            <Route path="/verify" element={<PageTransition><VerifyPage /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />

            {/* 404 catch-all */}
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
