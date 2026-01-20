import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when no user in localStorage', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
  });

  it('returns user object when user exists in localStorage', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      mail: 'test@example.com',
      userType: 'admin',
      active: true,
    };

    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles invalid JSON in localStorage gracefully', () => {
    localStorage.setItem('user', 'invalid json');

    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it('updates when localStorage changes (storage event)', async () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();

    // Simulate storage event
    const newUser = {
      id: 2,
      name: 'New User',
      mail: 'new@example.com',
      userType: 'admin',
      active: true,
    };

    await act(async () => {
      const storageEvent = new StorageEvent('storage', {
        key: 'user',
        newValue: JSON.stringify(newUser),
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(newUser);
    });
  });

  it('sets user to null when localStorage user is removed', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      mail: 'test@example.com',
      userType: 'admin',
      active: true,
    };

    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);

    // Simulate removal
    await act(async () => {
      const storageEvent = new StorageEvent('storage', {
        key: 'user',
        newValue: null,
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('handles invalid JSON in storage event gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const storageEvent = new StorageEvent('storage', {
        key: 'user',
        newValue: 'invalid json',
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('ignores storage events for other keys', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'some value',
        storageArea: localStorage,
      });

      window.dispatchEvent(storageEvent);
    });

    // User should still be null
    expect(result.current.user).toBeNull();
  });
});
