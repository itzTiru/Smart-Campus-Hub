import { useAuthStore } from '../store/authStore';
import DashboardPage from './DashboardPage';
import AdminDashboard from './AdminDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import ManagerDashboard from './ManagerDashboard';

const RoleDashboardPage = () => {
  const { user } = useAuthStore();

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TECHNICIAN':
      return <TechnicianDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    default:
      return <DashboardPage />;
  }
};

export default RoleDashboardPage;
