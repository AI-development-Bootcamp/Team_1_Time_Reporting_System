import { useState, useEffect } from 'react';
import { validateToken } from '@shared/utils/jwt';

/**
 * User interface matching the backend API response
 * 
 * Note: Backend uses BigInt in database but converts to number in API responses
 * to match JavaScript's number type. This is consistent with Project and Client types.
 * If IDs exceed JavaScript's safe integer range (2^53 - 1), consider changing to string.
 */
export interface User {
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
 * - Validates JWT token expiration on mount and when token changes
 * - Listens for storage changes to update across tabs
 * - Returns user object or null if not authenticated
 * 
 * Note: Currently reads user from localStorage. Future: will extract user from JWT token.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    // Validate token first - if expired, clear everything
    if (!validateToken()) {
      return null;
    }

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
    // Validate token on mount and periodically check for expiration
    const checkTokenValidity = () => {
      if (!validateToken()) {
        setUser(null);
      }
    };

    // Check immediately
    checkTokenValidity();

    // Check every minute for token expiration
    const interval = setInterval(checkTokenValidity, 60000);

    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            // Validate token before setting user
            if (validateToken()) {
              setUser(JSON.parse(e.newValue));
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error('Failed to parse user from storage event:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else if (e.key === 'token') {
        // If token changes, validate it
        checkTokenValidity();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return { user };
}
