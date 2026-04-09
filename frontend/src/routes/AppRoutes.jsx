import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Layout from '../components/common/Layout';

// Lazy-loaded pages
const PendingApprovalPage = React.lazy(() => import('../pages/PendingApprovalPage'));
const RoleDashboardPage = React.lazy(() => import('../pages/RoleDashboardPage'));
const ResourcesPage = React.lazy(() => import('../pages/ResourcesPage'));
const ResourceDetailPage = React.lazy(() => import('../pages/ResourceDetailPage'));
const BookingsPage = React.lazy(() => import('../pages/BookingsPage'));
const NewBookingPage = React.lazy(() => import('../pages/NewBookingPage'));
const BookingDetailPage = React.lazy(() => import('../pages/BookingDetailPage'));
const CheckInPage = React.lazy(() => import('../pages/CheckInPage'));
const TicketsPage = React.lazy(() => import('../pages/TicketsPage'));
const NewTicketPage = React.lazy(() => import('../pages/NewTicketPage'));
const TicketDetailPage = React.lazy(() => import('../pages/TicketDetailPage'));
const AdminDashboard = React.lazy(() => import('../pages/AdminDashboard'));
const UserManagementPage = React.lazy(() => import('../pages/UserManagementPage'));
const LoginPage = React.lazy(() => import('../pages/LoginPage'));
const SignupPage = React.lazy(() => import('../pages/SignupPage'));
const OAuth2RedirectHandler = React.lazy(() => import('../pages/OAuth2RedirectHandler'));
const NotificationPreferences = React.lazy(() => import('../pages/NotificationPreferences'));
const NotFoundPage = React.lazy(() => import('../pages/NotFoundPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Protected routes with layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<RoleDashboardPage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="resources/:id" element={<ResourceDetailPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="bookings/new" element={<NewBookingPage />} />
            <Route path="bookings/:id" element={<BookingDetailPage />} />
            <Route path="bookings/:id/checkin" element={<CheckInPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/new" element={<NewTicketPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="notifications/preferences" element={<NotificationPreferences />} />

            {/* Admin routes */}
            <Route path="admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>

        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />
        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
