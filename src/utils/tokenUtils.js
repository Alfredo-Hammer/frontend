// Utilidades para manejo de token con expiración
const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hora en milisegundos

const _decodeJwtExpMs = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Pad base64
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const payload = JSON.parse(jsonPayload);
    if (!payload || typeof payload.exp !== 'number') return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
};

export const setTokenWithExpiration = (token) => {
  const now = new Date().getTime();
  const jwtExpMs = _decodeJwtExpMs(token);
  // Si el JWT trae exp, usarlo; si no, fallback a 1 hora desde ahora.
  const expiry = jwtExpMs && jwtExpMs > now ? jwtExpMs : now + TOKEN_EXPIRATION_TIME;
  localStorage.setItem('token', token);
  localStorage.setItem('tokenExpiry', expiry.toString());
};

export const getTokenIfValid = () => {
  const token = localStorage.getItem('token');
  const expiry = localStorage.getItem('tokenExpiry');

  if (!token || !expiry) {
    return null;
  }

  const now = new Date().getTime();
  if (now > parseInt(expiry)) {
    // Token expirado, limpiar
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    return null;
  }

  return token;
};

export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('tokenExpiry');
};

export const isTokenExpired = () => {
  const expiry = localStorage.getItem('tokenExpiry');
  if (!expiry) return true;

  const now = new Date().getTime();
  return now > parseInt(expiry);
};
