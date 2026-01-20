import { User } from '../types/User';

/**
 * Decode JWT token payload to extract user data
 * Note: This decodes the payload AND validates expiration
 * The backend still verifies the signature for security
 */
export const decodeJwtToken = (token: string): User | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Normalize Base64URL to Base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));

    const decoded = JSON.parse(atob(base64 + padding));

    // Check token expiration (exp is in seconds, Date.now() is in milliseconds)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.warn('JWT token has expired');
      return null;
    }

    // Extract user data from token payload
    if (decoded.user && typeof decoded.user === 'object') {
      return decoded.user as User;
    }

    return null;
  } catch (error) {
    // Invalid token format
    return null;
  }
};

/**
 * Check if a JWT token is expired without decoding user data
 * Useful for checking token validity before making API calls
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true; // Invalid format, consider expired
    }

    const payload = parts[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const decoded = JSON.parse(atob(base64 + padding));

    if (!decoded.exp) {
      return false; // No expiration claim
    }

    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch (error) {
    return true; // Error decoding, consider expired
  }
};
