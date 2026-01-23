/**
 * Auth Token Manager
 *
 * This module acts as a simple, decoupled store for the JWT token.
 * It allows other parts of the application (like firebase) to set the token,
 * and the api client (axios) to get the token, without them needing to know about each other.
 * This breaks the circular dependency between the api client and the auth provider.
 */

let authToken: string | null = null;

/**
 * Sets the current authentication token.
 * @param token The JWT token, or null if logged out.
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * Retrieves the current authentication token.
 * @returns The JWT token, or null if not available.
 */
export function getAuthToken(): string | null {
  return authToken;
}
