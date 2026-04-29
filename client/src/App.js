import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { useTranslation } from 'react-i18next';

// Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AIChatbot from './components/layout/AIChatbot';
import BottomNav from './components/layout/BottomNav';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import SocialAuthSuccess from './pages/SocialAuthSuccess';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyOTP from './pages/auth/VerifyOTP';

// Job Seeker Pages
import JobSeekerDashboard from './pages/jobseeker/Dashboard';
import JobSearch from './pages/jobs/JobSearch';
import JobDetails from './pages/jobs/JobDetails';
import JobFeed from './pages/JobFeed';
import MyApplications from './pages/jobseeker/MyApplications';
import Profile from './pages/jobseeker/Profile';
import ResumeBuilder from './pages/jobseeker/ResumeBuilder';

// Employer Pages
import EmployerDashboard from './pages/employer/Dashboard';
import PostJob from './pages/employer/PostJob';
import ManageJobs from './pages/employer/ManageJobs';
import JobRequirements from './pages/employer/JobRequirements';
import ViewApplications from './pages/employer/ViewApplications';
import ApplicationDetails from './pages/employer/ApplicationDetails';
import EmployerProfile from './pages/employer/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ManageUsers from './pages/admin/ManageUsers';
import AdminManageJobs from './pages/admin/ManageJobs';
import Analytics from './pages/admin/Analytics';
import SystemSettings from './pages/admin/SystemSettings';
import CustomerSupport from './pages/admin/CustomerSupport';

// Other Pages
import Chat from './pages/Chat';
import Notifications from './pages/Notifications';
import Social from './pages/Social';
import AIAssistant from './pages/AIAssistant';
import VideoInterview from './pages/interview/VideoInterview';
import InterviewFeedback from './pages/interview/InterviewFeedback';
import Unauthorized from './pages/Unauthorized';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Support from './pages/Support';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import PublicProfile from './pages/PublicProfile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && user.role !== 'admin' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    // Redirect based on user role
    switch (user.role) {
      case 'jobseeker':
        return <Navigate to="/dashboard" replace />;
      case 'employer':
      case 'company':
        return <Navigate to="/employer/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

// App Layout Component
const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col mesh-gradient-vibrant bg-pattern-dots relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary-500/10 blur-[120px] pointer-events-none"></div>
      <Navbar />
      <main className="flex-1 page-transition pt-24 pb-16 md:pb-0 relative z-10">
        {children}
      </main>
      <AIChatbot />
      <BottomNav />
      <Footer />
    </div>
  );
};

const LanguageEffect = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = dir;
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(dir);
  }, [i18n.language]);

  return null;
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketProvider>
          <div className="App">
            <LanguageEffect />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <AppLayout>
                  <Home />
                </AppLayout>
              } />
              
              <Route path="/jobs" element={
                <AppLayout>
                  <JobSearch />
                </AppLayout>
              } />
              
              <Route path="/jobs/:id" element={
                <AppLayout>
                  <JobDetails />
                </AppLayout>
              } />

              <Route path="/feed" element={
                <AppLayout>
                  <JobFeed />
                </AppLayout>
              } />

              {/* Auth Routes */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              
              <Route path="/social-auth-success" element={<SocialAuthSuccess />} />
              
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
              
              <Route path="/reset-password/:token" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />

              <Route path="/verify-otp" element={<VerifyOTP />} />

              <Route path="/terms" element={
                <AppLayout>
                  <Terms />
                </AppLayout>
              } />

              <Route path="/privacy" element={
                <AppLayout>
                  <Privacy />
                </AppLayout>
              } />

              {/* Job Seeker Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['jobseeker', 'individual']}>
                  <AppLayout>
                    <JobSeekerDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/my-applications" element={
                <ProtectedRoute allowedRoles={['jobseeker', 'individual']}>
                  <AppLayout>
                    <MyApplications />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/resume-builder" element={
                <ProtectedRoute allowedRoles={['jobseeker', 'individual']}>
                  <AppLayout>
                    <ResumeBuilder />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/profile" element={
                <ProtectedRoute allowedRoles={['jobseeker', 'individual']}>
                  <AppLayout>
                    <Profile />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Employer Routes */}
              <Route path="/employer/dashboard" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <EmployerDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/employer/post-job" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <PostJob />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/employer/jobs/:id/edit" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <PostJob />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/employer/jobs" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <ManageJobs />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/employer/requirements" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <JobRequirements />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/employer/jobs/:id/applications" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <ViewApplications />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/employer/applications" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <ViewApplications />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/employer/applications/:id" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <ApplicationDetails />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* مسار مختصر للتوافق */}
              <Route path="/applications/:id" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <ApplicationDetails />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/employer/profile" element={
                <ProtectedRoute allowedRoles={['employer', 'company']}>
                  <AppLayout>
                    <EmployerProfile />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <ManageUsers />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/jobs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <AdminManageJobs />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <SystemSettings />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/admin/support" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AppLayout>
                    <CustomerSupport />
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Common Protected Routes */}
              <Route path="/smart-interview/:id" element={
                <ProtectedRoute>
                  <VideoInterview />
                </ProtectedRoute>
              } />

              <Route path="/interview/:id" element={
                <ProtectedRoute>
                  <VideoInterview />
                </ProtectedRoute>
              } />

              <Route path="/interview/video" element={
                <ProtectedRoute>
                  <VideoInterview />
                </ProtectedRoute>
              } />

              <Route path="/social" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Social />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />

              <Route path="/notifications" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Notifications />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/interview-feedback/:id" element={
                <ProtectedRoute>
                  <AppLayout>
                    <InterviewFeedback />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/ai-coach" element={
                <ProtectedRoute>
                  <AppLayout>
                    <AIAssistant />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/support" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Support />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="/contact" element={
                <AppLayout>
                  <Contact />
                </AppLayout>
              } />

              <Route path="/faq" element={
                <AppLayout>
                  <FAQ />
                </AppLayout>
              } />

              {/* Error Routes */}
              <Route path="/unauthorized" element={
                <AppLayout>
                  <Unauthorized />
                </AppLayout>
              } />

              <Route path="/profile/:userId" element={
                <ProtectedRoute>
                  <AppLayout>
                    <PublicProfile />
                  </AppLayout>
                </ProtectedRoute>
              } />

              <Route path="*" element={
                <AppLayout>
                  <NotFound />
                </AppLayout>
              } />
            </Routes>
          </div>
        </SocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
