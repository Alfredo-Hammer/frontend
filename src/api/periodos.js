// Servicio para periodos de evaluación (Semáforo de Notas)
import api from "./axiosConfig";

const periodosApi = {
  getPeriodos: (token, id_ciclo) =>
    api.get(`/api/periodos?id_ciclo=${encodeURIComponent(id_ciclo)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updatePeriodo: (token, id_periodo, data) =>
    api.patch(`/api/periodos/${id_periodo}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default periodosApi;
