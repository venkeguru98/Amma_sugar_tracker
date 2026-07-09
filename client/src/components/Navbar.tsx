import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, Home, PlusCircle, History, BarChart3, Calendar, FileText, Activity, Settings, LogOut, Type
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    largeTextMode, highContrastMode, darkMode,
    toggleLargeTextMode, toggleHighContrastMode, toggleDarkMode 
  } = useTheme();

  // Family View state: 'amma' or 'caregiver'
  const [familyView, setFamilyView] = useState(() => {
    return localStorage.getItem('family_view') || 'amma';
  });

  // Elder Mode state
  const [elderMode, setElderMode] = useState(() => {
    return localStorage.getItem('theme-elder-mode') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (elderMode) {
      root.classList.add('accessibility-elder-mode');
      localStorage.setItem('theme-elder-mode', 'true');
    } else {
      root.classList.remove('accessibility-elder-mode');
      localStorage.setItem('theme-elder-mode', 'false');
    }
  }, [elderMode]);

  const toggleFamilyView = () => {
    const nextView = familyView === 'amma' ? 'caregiver' : 'amma';
    setFamilyView(nextView);
    localStorage.setItem('family_view', nextView);
    window.location.reload(); // Reload to refresh widgets and routes cleanly
  };

  const toggleElderMode = () => {
    setElderMode(!elderMode);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Define navigation tabs dynamically based on view mode
  const menuItems = [
    { label: t('nav.dashboard'), path: '/', icon: <Home className="w-5.5 h-5.5" /> },
    { label: t('nav.addReading'), path: '/add', icon: <PlusCircle className="w-5.5 h-5.5" /> },
    { label: t('nav.history'), path: '/history', icon: <History className="w-5.5 h-5.5" /> }
  ];

  // Caregiver features
  if (familyView === 'caregiver') {
    menuItems.push(
      { label: t('nav.analytics'), path: '/analytics', icon: <BarChart3 className="w-5.5 h-5.5" /> },
      { label: t('nav.calendar'), path: '/calendar', icon: <Calendar className="w-5.5 h-5.5" /> },
      { label: t('nav.reports'), path: '/reports', icon: <FileText className="w-5.5 h-5.5" /> },
      { label: t('nav.healthHub'), path: '/hub', icon: <Activity className="w-5.5 h-5.5" /> }
    );
  }

  // Settings
  menuItems.push(
    { label: t('nav.settings'), path: '/settings', icon: <Settings className="w-5.5 h-5.5" /> }
  );

  if (!user) return null;

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:block sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <Heart className="w-5.5 h-5.5 fill-white" />
            </div>
            <span className="font-heading font-extrabold text-xl tracking-tight text-slate-800 dark:text-white">
              {familyView === 'amma' ? 'Amma Tracker' : 'Venkat View'}
            </span>
          </Link>

          {/* Dynamic tabs */}
          <div className="flex items-center gap-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Toggle mode pill */}
            <button
              onClick={toggleFamilyView}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition-all border ${familyView === 'caregiver' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20' : 'bg-emerald-50 border-emerald-205 text-emerald-650 dark:bg-emerald-950/20'}`}
            >
              {familyView === 'caregiver' ? '👨 Caregiver View' : '👩 Amma View'}
            </button>

            {/* Language switches */}
            <div className="flex bg-slate-50 dark:bg-slate-800 border p-0.5 rounded-lg">
              <button onClick={() => changeLanguage('en')} className={`px-2.5 py-1 rounded text-xxs font-bold ${i18n.language.startsWith('en') ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>en</button>
              <button onClick={() => changeLanguage('ta')} className={`px-2.5 py-1 rounded text-xxs font-bold ${i18n.language.startsWith('ta') ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500'}`}>தமிழ்</button>
            </div>

            {/* Elder mode icon toggle */}
            <button
              onClick={toggleElderMode}
              className={`p-2 rounded-xl border transition-colors ${elderMode ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <Type className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </nav>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm p-4 flex justify-between items-center transition-colors">
        <Link to="/" className="flex items-center gap-1.5">
          <Heart className="w-5 h-5 fill-emerald-500 text-emerald-500" />
          <span className="font-heading font-extrabold text-base text-slate-805 dark:text-white">
            {familyView === 'amma' ? 'Amma Health' : 'Caregiver Console'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleFamilyView} 
            className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border rounded-lg font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {familyView === 'caregiver' ? '👨 Caregiver' : '👩 Amma'}
          </button>
          <button 
            onClick={() => changeLanguage(i18n.language.startsWith('ta') ? 'en' : 'ta')} 
            className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 border rounded-lg font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            {i18n.language.startsWith('ta') ? 'EN' : 'தமிழ்'}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800/80 shadow-lg px-1 py-1.5 flex items-center justify-around pb-safe-bottom transition-colors">
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all min-h-[48px] justify-center ${active ? 'text-emerald-500 font-bold' : 'text-slate-400 dark:text-slate-500'}`}
            >
              {item.icon}
              <span className="text-[9px] uppercase tracking-widest font-black">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};
export default Navbar;
