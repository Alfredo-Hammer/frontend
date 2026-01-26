import api from "./axiosConfig";
import services from "./services";

// API para Modelo de Evaluación (configuracion_evaluaciones)
const evaluacionesApi = {
  getEvaluacionesPorCiclo: (token, id_ciclo) =>
    api.get(services.evaluacionesPorCiclo(id_ciclo), {
      headers: { Authorization: `Bearer ${token}` },
    }),

  aplicarPlantilla: (token, { id_ciclo, tipo_plantilla }) =>
    api.post(
      "/api/evaluaciones/plantilla",
      { id_ciclo, tipo_plantilla },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  actualizarEvaluacion: (token, id_evaluacion, patch) =>
    api.patch(`/api/evaluaciones/${id_evaluacion}`, patch, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default evaluacionesApi;
