import { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/ui/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './AdminLayout';
import PanchayatSidebar from './components/panchayat/PanchayatSidebar';

// ── Lazy-loaded pages (code-splitting) ──────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const TwinPage = lazy(() => import('./pages/TwinPage'));
const PanchayatDashboard = lazy(() => import('./pages/PanchayatDashboard'));
const SchemesPage = lazy(() => import('./pages/SchemesPage'));
const SchemeDetailPage = lazy(() => import('./pages/SchemeDetailPage'));
const ApplyPage = lazy(() => import('./pages/ApplyPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LocationSetupPage = lazy(() => import('./pages/LocationSetupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EligibleSchemesPage = lazy(() => import('./pages/EligibleSchemesPage'));
const AgentChatPage = lazy(() => import('./pages/AgentChatPage'));
const DocumentUploadPage = lazy(() => import('./pages/DocumentUploadPage'));

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerifyPage = lazy(() => import('./pages/VerifyPage'));
const PanchayatLoginPage = lazy(() => import('./pages/PanchayatLoginPage'));
const PanchayatSignupPage = lazy(() => import('./pages/PanchayatSignupPage'));
const PanchayatVerifyPage = lazy(() => import('./pages/PanchayatVerifyPage'));
const PanchayatForgotPasswordPage = lazy(() => import('./pages/PanchayatForgotPasswordPage'));

// Admin pages
// Admin auth pages removed (direct access enabled)
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminApplicantsPage = lazy(() => import('./pages/AdminApplicantsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage'));
const SchemeEditor = lazy(() => import('./pages/SchemeEditor'));
// admin forgot password removed (not in source)

// Panchayat Portal Pages
const PanchayatCitizenRegistry = lazy(() => import('./pages/panchayat/PanchayatCitizenRegistry'));
const PanchayatAnalytics = lazy(() => import('./pages/panchayat/PanchayatAnalytics'));
const PanchayatApplicationsManager = lazy(() => import('./pages/panchayat/PanchayatApplicationsManager'));
const PanchayatOutreach = lazy(() => import('./pages/panchayat/PanchayatOutreach'));
const PanchayatSettings = lazy(() => import('./pages/panchayat/PanchayatSettings'));
const VillageProfile = lazy(() => import('./pages/panchayat/VillageProfile'));
const WelfareCalendar = lazy(() => import('./pages/panchayat/WelfareCalendar'));
const GrievanceTracker = lazy(() => import('./pages/panchayat/GrievanceTracker'));
const PerformanceReport = lazy(() => import('./pages/panchayat/PerformanceReport'));

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
        <ErrorBoundary>
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-off-white">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-saffron border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500 font-body text-sm">Loading…</p>
              </div>
            </div>
          }>
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

                {/* Admin routes — Directly accessible without login */}
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
                <Route path="/citizen/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />

                {/* Panchayat auth */}
                <Route path="/panchayat/login" element={<PageTransition><PanchayatLoginPage /></PageTransition>} />
                <Route path="/panchayat/signup" element={<PageTransition><PanchayatSignupPage /></PageTransition>} />
                <Route path="/panchayat/verify" element={<PageTransition><PanchayatVerifyPage /></PageTransition>} />
                <Route path="/panchayat/forgot-password" element={<PageTransition><PanchayatForgotPasswordPage /></PageTransition>} />

                {/* Admin auth */}
                {/* Admin auth routes removed */}
                {/* Admin forgot password removed */}

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
          </Suspense>
        </ErrorBoundary>
      </main>
    </>
  );
}

export default App;
