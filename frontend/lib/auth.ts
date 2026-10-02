export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('zapcart_token');
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('zapcart_token', token);
  } else {
    localStorage.removeItem('zapcart_token');
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function logout() {
  setStoredToken(null);
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
