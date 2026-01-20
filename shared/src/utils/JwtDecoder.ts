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
    // Decode the payload (second part)
    const payload = parts[1];

    // Normalize Base64URL to Base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));

    const decoded = JSON.parse(atob(base64 + padding));

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
