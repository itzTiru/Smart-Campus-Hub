import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { technicianBridge } from '../api/authApi';
import DashboardPage from './DashboardPage';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';

const RoleDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isTechnician = user?.role === 'TECHNICIAN';
  const [redirecting, setRedirecting] = useState(isTechnician);

  useEffect(() => {
    if (!isTechnician) return;

    const techToken = localStorage.getItem('technician_token');
    if (techToken) {
      navigate('/technician/dashboard', { replace: true });
    } else {
      technicianBridge()
        .then((res) => {
          const { token, technician } = res.data;
          localStorage.setItem('technician_token', token);
          localStorage.setItem('technician_user', JSON.stringify(technician));
          navigate('/technician/dashboard', { replace: true });
        })
        .catch(() => setRedirecting(false));
    }
  }, [isTechnician, navigate]);

  if (redirecting) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    default:
      return <DashboardPage />;
  }
};

export default RoleDashboardPage;
