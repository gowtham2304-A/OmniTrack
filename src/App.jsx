import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ParticleBackground from './components/particles/ParticleBackground';
import { ToastProvider } from './components/ui/Toast';
import Overview from './pages/Overview';
import Platforms from './pages/Platforms';
import Products from './pages/Products';
import PnL from './pages/PnL';
import Stock from './pages/Stock';
import Orders from './pages/Orders';
import CsvUpload from './pages/CsvUpload';
import Integrations from './pages/Integrations';
import Login from './pages/Login';
import SettingsPage from './pages/Settings';
import Signup from './pages/Signup';

const ProtectedRoute = () => {
  const token = localStorage.getItem('sellerverse_auth');
  const isAuth = !!token;
  return isAuth ? (
    <Layout>
      <Outlet />
    </Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default function App() {
  return (
    <ToastProvider>
      <Router>
        <div className="relative min-h-screen gradient-mesh">
          <ParticleBackground />
          <div className="relative z-10">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Overview />} />
                <Route path="/platforms" element={<Platforms />} />
                <Route path="/products" element={<Products />} />
                <Route path="/pnl" element={<PnL />} />
                <Route path="/stock" element={<Stock />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/integrations" element={<Integrations />} />
                <Route path="/upload" element={<CsvUpload />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </ToastProvider>
  );
}
