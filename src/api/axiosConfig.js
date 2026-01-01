import axios from "axios";

// Función para limpiar el token (se importará desde App.js si es necesario)
const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenExpiry");
};

// Configuración limpia sin duplicación
const api = axios.create({
  baseURL: "http://localhost:4000", // URL base corregida al puerto 4000
  timeout: 10000,
  // headers: { "Content-Type": "application/json" } // Eliminado para permitir que axios maneje multipart/form-data correctamente
});

// Interceptor de REQUEST para agregar token automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores y tokens expirados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("🔒 Token inválido o expirado");
      clearToken();
      // Notificar a la app para sincronizar el estado (evita pantallas en blanco por loops de redirección)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: '401' } }));
      }
      // No redirigir aquí, dejar que React Router lo maneje
      // cuando detecte que no hay token en App.js
    }
    return Promise.reject(error);
  }
);

export default api;