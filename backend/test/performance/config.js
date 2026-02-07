export const BASE_URL =
  __ENV.BASE_URL || 'http://localhost:3001/api/v1';

export function getAuthHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}
