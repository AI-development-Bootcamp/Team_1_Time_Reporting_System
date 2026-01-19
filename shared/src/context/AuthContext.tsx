import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { decodeJwtToken } from '../utils/JwtDecoder';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'token';

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Decode user data from JWT token
  const decodeToken = (authToken: string): User | null => {
    try {
      const decodedUser = decodeJwtToken(authToken);
      return decodedUser;
    } catch (error) {
      // Invalid token format
      return null;
    }
  };

  // Load token from localStorage and decode user data on mount
  useEffect(() => {
    // Clean up any old 'user' key from localStorage (legacy code)
    localStorage.removeItem('user');
    
    const storedToken = localStorage.getItem(TOKEN_KEY);
    
    if (storedToken) {
      setToken(storedToken);
      const decodedUser = decodeToken(storedToken);
      
      if (decodedUser) {
        setUser(decodedUser);
      } else {
        // Invalid token, clear it
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem(TOKEN_KEY, newToken);
    
    // Decode user data from token
    const decodedUser = decodeToken(newToken);
    if (decodedUser) {
      setUser(decodedUser);
    } else {
      // Invalid token, clear it
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    // Clean up any old 'user' key from localStorage (legacy code)
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};
