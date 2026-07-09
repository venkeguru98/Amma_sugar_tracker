import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity } from 'lucide-react';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { user, login, signup, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Protected route guard redirect if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple clicks
    setError(null);
    setLoading(true);
    
    try {
      if (isRegister) {
        if (!name) throw new Error('Name is required');
        await signup(name, email, password);
      } else {
        await login(email, password, rememberMe);
      }
      // Successful auth updates context which triggers useEffect redirect
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  // If validation check in progress or user authenticated, display loading state to prevent flash
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading Medical Portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-slate-950/20 border border-slate-100 dark:border-slate-800 transition-colors">
        
        {/* App Title Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Heart className="w-8 h-8 fill-white" />
          </div>
          <h2 className="mt-4 text-3xl font-heading font-extrabold text-slate-805 dark:text-white">
            {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRegister ? t('auth.registerSub') : t('auth.loginSub')}
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-455 rounded-lg text-sm border border-rose-100 dark:border-rose-900">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('auth.name')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans text-base"
                  placeholder="Enter name"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans text-base"
                placeholder="email@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans text-base"
                placeholder="••••••••"
              />
            </div>
          </div>

          {!isRegister && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-slate-300 dark:border-slate-700 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">{t('auth.rememberMe')}</span>
              </label>
              
              <a href="#" onClick={(e) => { e.preventDefault(); alert("Feature coming soon!"); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                {t('auth.forgotPassword')}
              </a>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold shadow-md shadow-emerald-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all flex items-center justify-center gap-2 text-base min-h-[48px]"
            >
              {loading && <Activity className="w-5 h-5 animate-spin" />}
              {loading 
                ? (isRegister ? "Creating Account..." : "Signing in...") 
                : (isRegister ? t('auth.registerBtn') : t('auth.loginBtn'))}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(null); }}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
            <span className="text-emerald-600 font-semibold underline">
              {isRegister ? t('auth.loginBtn') : t('auth.registerBtn')}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
export default Login;
