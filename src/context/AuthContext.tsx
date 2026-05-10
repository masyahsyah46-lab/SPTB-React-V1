import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface User {
  name: string;
  email: string;
  role: string;
  color?: string;
  phone?: string;
  imageUrl?: string;
  firebaseCode?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  handleGoogleCredential: (response: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT Decoder as requested
const decodeJwtResponse = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load GIS SDK dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    const storedUser = localStorage.getItem('stb_session');
    const loginDate = localStorage.getItem('stb_login_date');
    const todayStr = new Date().toDateString();

    if (storedUser && loginDate === todayStr) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleGoogleCredential = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const decoded = decodeJwtResponse(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error('Token Google tidak sah.');
      }

      const result = await apiService.checkAuth(decoded.email);
      if (result.authenticated && result.user) {
        const user = {
          ...result.user,
          role: result.user.role?.toUpperCase().trim() || '',
          email: decoded.email.toLowerCase()
        };
        setCurrentUser(user);
        localStorage.setItem('stb_session', JSON.stringify(user));
        localStorage.setItem('stb_login_date', new Date().toDateString());
      } else {
        throw new Error(result.error || 'Akses ditolak: E-mel tidak berdaftar.');
      }
    } catch (err: any) {
      setError(err.message || 'Ralat pengesahan GIS');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('stb_session');
    localStorage.removeItem('stb_login_date');
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, handleGoogleCredential, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
