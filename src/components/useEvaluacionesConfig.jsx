import {useState, useCallback, useEffect} from "react";
import evaluacionesApi from "../api/evaluaciones"; // Asegúrate de que la ruta sea correcta

export function useEvaluacionesConfig(id_ciclo, token, onToast) {
  const [loading, setLoading] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [applying, setApplying] = useState(false);

  // Cargar evaluaciones
  const fetchEvaluaciones = useCallback(async () => {
    if (!id_ciclo) return;
    setLoading(true);
    try {
      const res = await evaluacionesApi.getEvaluacionesPorCiclo(
        token,
        id_ciclo
      );
      setEvaluaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      onToast?.("Error al cargar configuración", "error");
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  }, [id_ciclo, token, onToast]);

  // Aplicar plantilla inicial
  const aplicarPlantilla = async (tipoPlantilla) => {
    if (!id_ciclo) return;
    setApplying(true);
    try {
      await evaluacionesApi.aplicarPlantilla(token, {
        id_ciclo,
        tipo_plantilla: tipoPlantilla,
      });
      onToast?.("Plantilla aplicada correctamente", "success");
      await fetchEvaluaciones();
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Error al aplicar plantilla";
      onToast?.(msg, "error");
    } finally {
      setApplying(false);
    }
  };

  // Actualizar una evaluación (PATCH)
  const updateEvaluacion = async (id, data) => {
    try {
      // Optimistic update (actualiza UI antes de confirmar)
      setEvaluaciones((prev) =>
        prev.map((e) => (e.id_evaluacion === id ? {...e, ...data} : e))
      );

      await evaluacionesApi.actualizarEvaluacion(token, id, data);
      onToast?.("Actualizado", "success");
    } catch (error) {
      // Revertir si falla (necesitarías guardar estado previo, por ahora solo avisamos)
      onToast?.("Error al guardar cambios", "error");
      await fetchEvaluaciones(); // Recargar para asegurar consistencia
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, [fetchEvaluaciones]);

  return {
    loading,
    applying,
    evaluaciones,
    fetchEvaluaciones,
    aplicarPlantilla,
    updateEvaluacion,
  };
}
