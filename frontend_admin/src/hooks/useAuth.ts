import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  mail: string;
  userType: string;
  active: boolean;
}

/**
 * Custom hook to get authenticated user information from localStorage
 * 
 * Features:
 * - Reads user data from localStorage
 * - Listens for storage changes to update across tabs
 * - Returns user object or null if not authenticated
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  });

  useEffect(() => {
    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (error) {
            console.error('Failed to parse user from storage event:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { user };
}
