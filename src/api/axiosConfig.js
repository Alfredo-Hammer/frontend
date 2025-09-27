import axios from "axios";

// Configuración limpia sin duplicación
const api = axios.create({
  baseURL: "http://localhost:4000", // URL base corregida al puerto 4000
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para manejo de errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;