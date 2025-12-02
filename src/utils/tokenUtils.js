// Utilidades para manejo de token con expiración
const TOKEN_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hora en milisegundos

export const setTokenWithExpiration = (token) => {
  const now = new Date().getTime();
  const expiry = now + TOKEN_EXPIRATION_TIME;
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
