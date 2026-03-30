import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';

const AppInit = () => {
  const { initTheme } = useThemeStore();
  useEffect(() => { initTheme(); }, []);
  useAuth();
  useWebSocket();
  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AppInit />
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}

export default App;
