// Servicio para ciclos escolares
import api from "../api/axiosConfig";

const ciclosApi = {
  getCiclosMatricula: (token) =>
    api.get("/api/ciclos/setup", { headers: { Authorization: `Bearer ${token}` } }),
};

export default ciclosApi;
