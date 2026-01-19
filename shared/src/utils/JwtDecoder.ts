import { User } from '../types/User';

/**
 * Decode JWT token payload to extract user data
 * Note: This only decodes the payload (no secret needed)
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
    const decoded = JSON.parse(atob(payload));

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
