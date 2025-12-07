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
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejo de errores y tokens expirados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log("🔒 Token inválido o expirado");
      clearToken();
      // No redirigir aquí, dejar que React Router lo maneje
      // cuando detecte que no hay token en App.js
    }
    return Promise.reject(error);
  }
);

export default api;