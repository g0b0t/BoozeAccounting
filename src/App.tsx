import React, { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider } from './lib/store';
import { applyTelegramTheme } from './lib/telegram';
import GatePage from './pages/GatePage';
import ProfilePage from './pages/ProfilePage';
import CrewChoosePage from './pages/CrewChoosePage';
import MainDrinkPage from './pages/MainDrinkPage';
import StatsPage from './pages/StatsPage';
import CrewPage from './pages/CrewPage';
import ProductsAdminPage from './pages/ProductsAdminPage';
import SuggestionsPage from './pages/SuggestionsPage';

function AppRoutes() {
  const navigate = useNavigate();
  useEffect(() => {
    applyTelegramTheme();
  }, []);
  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/gate');
    }
  }, [navigate]);
  return (
    <Routes>
      <Route path="/gate" element={<GatePage />} />
      <Route path="/onboarding/profile" element={<ProfilePage />} />
      <Route path="/crew/choose" element={<CrewChoosePage />} />
      <Route path="/main" element={<MainDrinkPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/crew" element={<CrewPage />} />
      <Route path="/crew/products" element={<ProductsAdminPage />} />
      <Route path="/crew/suggestions" element={<SuggestionsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
