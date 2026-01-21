/**
 * JWT token utilities
 * 
 * Helper functions for working with JWT tokens in the frontend
 */

/**
 * Decode JWT token payload without verification
 * This is safe for checking expiration on the client side
 * 
 * @param token - JWT token string
 * @returns Decoded payload or null if token is invalid
 */
export function decodeJWT(token: string): { exp?: number; [key: string]: any } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * 
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false if valid
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return true; // Invalid token or no expiration = consider expired
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();

  // Add 5 second buffer to account for clock skew
  return currentTime >= expirationTime - 5000;
}

/**
 * Validate token and clear auth data if expired
 * 
 * @returns true if token is valid, false if expired/invalid
 */
export function validateToken(): boolean {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  if (isTokenExpired(token)) {
    // Token expired, clear auth data
    localStorage.removeItem('token');
    return false;
  }

  return true;
}
