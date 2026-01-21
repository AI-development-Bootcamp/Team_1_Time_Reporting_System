import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useAuth, AuthContextProvider } from '../context/AuthContext';

// Mock JWT decoder to return a valid user
vi.mock('../utils/JwtDecoder', () => ({
  decodeJwtToken: vi.fn((token: string) => {
    if (!token) return null;
    // Return null for invalid tokens (like 'invalid-token')
    if (token === 'invalid-token' || !token.includes('.')) return null;
    // Return a mock user when token is valid (has proper JWT structure)
    return {
      id: 1,
      name: 'Test User',
      mail: 'test@example.com',
      userType: 'admin',
      active: true,
    };
  }),
  isTokenExpired: vi.fn(() => false),
}));

describe('useAuth', () => {
  // Create a mock valid token (not expired for 1 hour)
  const createMockToken = () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    const signature = 'mock-signature';
    return `${header}.${payload}.${signature}`;
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContextProvider>{children}</AuthContextProvider>
  );

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when no token in localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('returns user object when valid token exists in localStorage', async () => {
    const mockToken = createMockToken();
    localStorage.setItem('token', mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles invalid token gracefully', async () => {
    localStorage.setItem('token', 'invalid-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Wait for state to settle after token clearing
    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    }, { timeout: 2000 });

    // Invalid token should be cleared
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('login function sets token and decodes user', async () => {
    const mockToken = createMockToken();
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      result.current.login(mockToken);
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toBeTruthy();
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('logout function clears token and user', async () => {
    const mockToken = createMockToken();
    localStorage.setItem('token', mockToken);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
  });
});
