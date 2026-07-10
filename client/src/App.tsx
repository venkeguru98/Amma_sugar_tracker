import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AddReading } from './pages/AddReading';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { HealthHub } from './pages/HealthHub';
import { CalendarView } from './pages/CalendarView';

import { useTheme } from './contexts/ThemeContext';

// Route Redirect Guard for Amma View
const CaregiverRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { familyView } = useTheme();
  if (familyView === 'amma') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-105 transition-colors duration-200 flex flex-col font-sans">
            
            <Navbar />

            <main className="flex-1 flex flex-col">
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Shared Accessible Routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/add" element={
                  <ProtectedRoute>
                    <AddReading />
                  </ProtectedRoute>
                } />
                <Route path="/edit/:id" element={
                  <ProtectedRoute>
                    <AddReading />
                  </ProtectedRoute>
                } />
                <Route path="/history" element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                {/* Unlocked Caregiver-Only Routes */}
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <CaregiverRoute>
                      <Analytics />
                    </CaregiverRoute>
                  </ProtectedRoute>
                } />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <CaregiverRoute>
                      <CalendarView />
                    </CaregiverRoute>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <CaregiverRoute>
                      <Reports />
                    </CaregiverRoute>
                  </ProtectedRoute>
                } />
                <Route path="/hub" element={
                  <ProtectedRoute>
                    <CaregiverRoute>
                      <HealthHub />
                    </CaregiverRoute>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <footer className="py-6 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-slate-900 text-center text-xs font-semibold text-slate-400 select-none pb-24 lg:pb-6 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4">
                © {new Date().getFullYear()} Diabetes Health Tracker. Built with care for Amma's records.
              </div>
            </footer>

          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
