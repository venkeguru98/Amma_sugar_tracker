import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  age?: number;
  weight?: number;
  height?: number;
  diabetesType?: string;
  medicines?: string[];
  targetMin: number;
  targetMax: number;
  themeSettings?: any;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set default Axios base configuration
axios.defaults.baseURL = (import.meta as any).env?.VITE_API_URL || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('user_profile') || sessionStorage.getItem('user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  });
  const [loading, setLoading] = useState(true);

  // Set Auth token header whenever it changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // If we already have user details, render the app instantly (loading=false)
      // but fetch the fresh profile silently in the background
      if (user) {
        setLoading(false);
        axios.get('/api/auth/profile')
          .then((res) => {
            const userData = res.data.user;
            setUser(userData);
            if (localStorage.getItem('auth_token')) {
              localStorage.setItem('user_profile', JSON.stringify(userData));
            } else {
              sessionStorage.setItem('user_profile', JSON.stringify(userData));
            }
          })
          .catch(() => {
            logout();
          });
        return;
      }

      setLoading(true);
      axios.get('/api/auth/profile')
        .then((res) => {
          const userData = res.data.user;
          setUser(userData);
          if (localStorage.getItem('auth_token')) {
            localStorage.setItem('user_profile', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('user_profile', JSON.stringify(userData));
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      sessionStorage.removeItem('user_profile');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string, rememberMe: boolean) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: userToken, user: userData } = res.data;
    
    if (rememberMe) {
      localStorage.setItem('auth_token', userToken);
      localStorage.setItem('user_profile', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('auth_token', userToken);
      sessionStorage.setItem('user_profile', JSON.stringify(userData));
    }
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setUser(userData);
    setToken(userToken);
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await axios.post('/api/auth/register', { name, email, password });
    const { token: userToken, user: userData } = res.data;
    
    localStorage.setItem('auth_token', userToken);
    localStorage.setItem('user_profile', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    sessionStorage.removeItem('user_profile');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const res = await axios.put('/api/auth/profile', data);
    const userData = res.data.user;
    setUser(userData);
    if (localStorage.getItem('auth_token')) {
      localStorage.setItem('user_profile', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('user_profile', JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      signup,
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
