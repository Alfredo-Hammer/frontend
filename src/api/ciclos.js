// Servicio para ciclos escolares
import api from "./axiosConfig";


const ciclosApi = {
  getCiclos: (token) =>
    api.get("/api/ciclos", { headers: { Authorization: `Bearer ${token}` } }),
  getCiclosSetup: (token) =>
    api.get("/api/ciclos/setup", { headers: { Authorization: `Bearer ${token}` } }),
  setCiclosMaestros: (token, ids) =>
    api.post("/api/ciclos/maestros", ids, { headers: { Authorization: `Bearer ${token}` } }),
  createCiclo: (token, data) =>
    api.post("/api/ciclos", data, { headers: { Authorization: `Bearer ${token}` } }),
  updateCiclo: (token, id, data) =>
    api.put(`/api/ciclos/${id}`, data, { headers: { Authorization: `Bearer ${token}` } }),
  deleteCiclo: (token, id) =>
    api.delete(`/api/ciclos/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
};

export default ciclosApi;
