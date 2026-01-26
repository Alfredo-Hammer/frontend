import React, {useCallback, useEffect, useMemo, useState} from "react";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import ciclosApi from "../api/ciclos";
import evaluacionesApi from "../api/evaluaciones";
import {
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

// --- COMPONENTES UI ---

const ToggleSwitch = ({enabled, onChange, isLoading, labelOff, labelOn}) => (
  <div className="flex flex-col items-center gap-1">
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) onChange(!enabled);
      }}
      disabled={isLoading}
      className={`${
        enabled ? "bg-emerald-500" : "bg-gray-600"
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50`}
    >
      <span
        className={`${
          enabled ? "translate-x-5" : "translate-x-0"
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
    <span
      className={`text-[10px] font-medium uppercase tracking-wider ${
        enabled ? "text-emerald-400" : "text-gray-500"
      }`}
    >
      {enabled ? labelOn : labelOff}
    </span>
  </div>
);

// --- CONSTANTES ---
// Actualizadas para reflejar nombres cortos limpios por defecto
const PLANTILLAS = [
  {
    label: "MINED Estándar (4 Cortes)",
    value: "MINED_4_CORTES",
    recomendada: true,
    preview: ["I Corte", "II Corte", "III Corte", "IV Corte"],
  },
  {
    label: "Trimestral (3 Periodos)",
    value: "TRIMESTRAL_3_PERIODOS",
    preview: ["Trimestre I", "Trimestre II", "Trimestre III"],
  },
  {
    label: "Semestral Simple",
    value: "BASICO_2_SEMESTRES",
    preview: ["Semestre I", "Semestre II"],
  },
];

function PeriodosEvaluacionPage() {
  const token = localStorage.getItem("token");

  // Estados
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState("");
  const [evaluaciones, setEvaluaciones] = useState([]);

  const [tipoPlantilla, setTipoPlantilla] = useState("MINED_4_CORTES");
  const [aplicando, setAplicando] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  // Helper Toast
  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast((prev) => ({...prev, show: false})), 4000);
  };

  // --- API ---

  const fetchCiclos = useCallback(async () => {
    try {
      const res = await ciclosApi.getCiclosSetup(token);
      const list = res.data?.ciclos || [];
      setCiclos(list);
      if (res.data?.actual) setCicloSeleccionado(String(res.data.actual));
      else if (list.length > 0) setCicloSeleccionado(String(list[0].id_ciclo));
    } catch (e) {
      showToast("Error al cargar ciclos", "error");
    }
  }, [token]);

  const cargarEvaluaciones = useCallback(async () => {
    if (!cicloSeleccionado) return;
    setLoading(true);
    try {
      const res = await evaluacionesApi.getEvaluacionesPorCiclo(
        token,
        cicloSeleccionado
      );
      const data = Array.isArray(res.data) ? res.data : [];
      // Ordenar por 'orden'
      setEvaluaciones(data.sort((a, b) => a.orden - b.orden));

      // Inicializar edición
      const initialEdits = {};
      data.forEach((ev) => {
        initialEdits[ev.id_evaluacion] = {
          nombre: ev.nombre,
          nombre_corto: ev.nombre_corto,
          agrupador: ev.agrupador, // Permitir editar el grupo también
        };
      });
      setEditValues(initialEdits);
    } catch (e) {
      showToast("Error al cargar configuración", "error");
      setEvaluaciones([]);
    } finally {
      setLoading(false);
    }
  }, [token, cicloSeleccionado]);

  const aplicarPlantilla = async () => {
    if (!cicloSeleccionado) return;
    if (
      !window.confirm(
        "⚠️ ADVERTENCIA: Esto borrará la configuración actual y creará los periodos desde cero. ¿Continuar?"
      )
    )
      return;

    setAplicando(true);
    try {
      await evaluacionesApi.aplicarPlantilla(token, {
        id_ciclo: cicloSeleccionado,
        tipo_plantilla: tipoPlantilla,
      });
      showToast("Plantilla aplicada con éxito", "success");
      await cargarEvaluaciones();
    } catch (e) {
      showToast(
        e.response?.data?.message || "Error al aplicar plantilla",
        "error"
      );
    } finally {
      setAplicando(false);
    }
  };

  const updateEvaluacion = async (id, patch) => {
    setSavingId(id);
    try {
      // Optimistic update
      setEvaluaciones((prev) =>
        prev.map((ev) => (ev.id_evaluacion === id ? {...ev, ...patch} : ev))
      );
      await evaluacionesApi.actualizarEvaluacion(token, id, patch);
      showToast("Guardado correctamente", "success");
    } catch (e) {
      showToast("Error al guardar", "error");
      cargarEvaluaciones(); // Revertir
    } finally {
      setSavingId(null);
    }
  };

  const handleTextChange = (id, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [id]: {...prev[id], [field]: value},
    }));
  };

  useEffect(() => {
    fetchCiclos();
  }, [fetchCiclos]);
  useEffect(() => {
    cargarEvaluaciones();
  }, [cicloSeleccionado, cargarEvaluaciones]);

  // --- AGRUPACIÓN PARA RENDERIZADO ---
  // Agrupamos visualmente por 'agrupador' para que el Admin vea la estructura real
  const evaluacionesAgrupadas = useMemo(() => {
    const grupos = {};
    const ordenGrupos = [];

    evaluaciones.forEach((ev) => {
      const g = ev.agrupador || "General";
      if (!grupos[g]) {
        grupos[g] = [];
        ordenGrupos.push(g);
      }
      grupos[g].push(ev);
    });

    return ordenGrupos.map((g) => ({nombre: g, items: grupos[g]}));
  }, [evaluaciones]);

  const hasConfig = evaluaciones.length > 0;

  return (
    <div className="space-y-8 pb-20">
      <PageHeader
        title="Gestión de Evaluaciones"
        subtitle="Configura los periodos (Cortes) y controla el semáforo de captura de notas."
        icon={ClipboardDocumentCheckIcon}
      />

      {/* SELECTOR DE CICLO */}
      <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">
            Ciclo Escolar
          </label>
          <select
            value={cicloSeleccionado}
            onChange={(e) => setCicloSeleccionado(e.target.value)}
            className="w-full bg-gray-900 border border-white/20 text-white rounded-xl px-4 py-2.5 appearance-none focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {ciclos.map((c) => (
              <option key={c.id_ciclo} value={c.id_ciclo}>
                {c.nombre}
              </option>
            ))}
          </select>
          <CalendarDaysIcon className="w-5 h-5 text-gray-500 absolute right-3 top-8 pointer-events-none" />
        </div>

        <div
          className={`px-4 py-2 rounded-lg border text-sm font-medium ${
            hasConfig
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-400"
          }`}
        >
          {hasConfig ? "Configuración Activa" : "Sin Configuración"}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* PANEL IZQUIERDO: REINICIO / PLANTILLAS */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-800/40 border border-white/10 rounded-2xl p-6 sticky top-6">
            <h3 className="text-white font-bold text-lg mb-2">Plantillas</h3>
            <p className="text-xs text-gray-400 mb-6">
              Selecciona una estructura base para generar los cortes
              automáticamente.
              <br />
              <span className="text-red-400 font-semibold">
                Nota: Aplicar una plantilla borrará la configuración actual.
              </span>
            </p>

            <div className="space-y-3">
              {PLANTILLAS.map((p) => (
                <label
                  key={p.value}
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    tipoPlantilla === p.value
                      ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="plantilla"
                      value={p.value}
                      checked={tipoPlantilla === p.value}
                      onChange={(e) => setTipoPlantilla(e.target.value)}
                      className="mt-1 text-indigo-500 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="block text-white font-medium text-sm">
                        {p.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 block">
                        Ej: {p.preview.join(", ")}...
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={aplicarPlantilla}
              disabled={aplicando || !cicloSeleccionado}
              className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aplicando ? "Aplicando..." : "Aplicar Plantilla"}
            </button>
          </div>
        </div>

        {/* PANEL DERECHO: EDICIÓN Y SEMÁFORO */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 border border-white/10 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gray-800">
              <div>
                <h3 className="text-white font-bold text-lg">
                  Semáforo de Notas
                </h3>
                <p className="text-xs text-gray-400">
                  Edita nombres y controla la apertura de cortes.
                </p>
              </div>
              <button
                onClick={cargarEvaluaciones}
                className="text-xs text-gray-300 hover:text-white underline"
              >
                Refrescar
              </button>
            </div>

            {!hasConfig ? (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-50">
                <ExclamationTriangleIcon className="w-12 h-12 text-gray-500 mb-4" />
                <p className="text-gray-400">
                  Selecciona una plantilla para comenzar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-950 text-gray-500 border-b border-white/10 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 w-16">Ord.</th>
                      <th className="px-6 py-3">Corte Evaluativo</th>
                      <th className="px-6 py-3 text-center">Captura (Prof)</th>
                      <th className="px-6 py-3 text-center">Boleta (Padres)</th>
                      <th className="px-6 py-3 text-right">Guardar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {evaluacionesAgrupadas.map((grupo) => (
                      <React.Fragment key={grupo.nombre}>
                        {/* ENCABEZADO DE GRUPO (SEMESTRE) */}
                        <tr className="bg-gray-800/60 border-y border-white/5">
                          <td
                            colSpan="5"
                            className="px-6 py-2 text-xs font-bold text-indigo-400 uppercase tracking-widest"
                          >
                            {grupo.nombre}
                          </td>
                        </tr>

                        {/* FILAS DE CORTES */}
                        {grupo.items.map((ev) => {
                          const edits = editValues[ev.id_evaluacion] || {};
                          const isSavingThis = savingId === ev.id_evaluacion;
                          const hasChanges =
                            edits.nombre !== ev.nombre ||
                            edits.nombre_corto !== ev.nombre_corto ||
                            edits.agrupador !== ev.agrupador;

                          return (
                            <tr
                              key={ev.id_evaluacion}
                              className="hover:bg-white/5 transition-colors group"
                            >
                              <td className="px-6 py-4 text-gray-500 font-mono">
                                {ev.orden}
                              </td>

                              {/* EDICIÓN DE TEXTO */}
                              <td className="px-6 py-4">
                                <div className="space-y-2">
                                  {/* Nombre Largo */}
                                  <input
                                    type="text"
                                    value={edits.nombre || ""}
                                    onChange={(e) =>
                                      handleTextChange(
                                        ev.id_evaluacion,
                                        "nombre",
                                        e.target.value
                                      )
                                    }
                                    className="block w-full bg-transparent border-b border-transparent hover:border-white/20 focus:border-indigo-500 text-white font-medium focus:outline-none transition-colors px-0 py-1 placeholder-gray-600"
                                    placeholder="Nombre Oficial"
                                  />
                                  {/* Nombre Corto y Grupo */}
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={edits.nombre_corto || ""}
                                      onChange={(e) =>
                                        handleTextChange(
                                          ev.id_evaluacion,
                                          "nombre_corto",
                                          e.target.value
                                        )
                                      }
                                      className="w-24 bg-gray-800 border border-transparent hover:border-gray-600 focus:border-indigo-500 rounded px-2 py-0.5 text-xs text-gray-300 focus:outline-none"
                                      placeholder="Corto"
                                      title="Nombre para columnas de boleta"
                                    />
                                    <input
                                      type="text"
                                      value={edits.agrupador || ""}
                                      onChange={(e) =>
                                        handleTextChange(
                                          ev.id_evaluacion,
                                          "agrupador",
                                          e.target.value
                                        )
                                      }
                                      className="w-32 bg-gray-800 border border-transparent hover:border-gray-600 focus:border-indigo-500 rounded px-2 py-0.5 text-xs text-gray-400 focus:outline-none"
                                      placeholder="Grupo/Semestre"
                                      title="Agrupador (Ej: I Semestre)"
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* SEMÁFOROS */}
                              <td className="px-6 py-4 text-center">
                                <ToggleSwitch
                                  enabled={ev.activo_captura}
                                  onChange={(val) =>
                                    updateEvaluacion(ev.id_evaluacion, {
                                      activo_captura: val,
                                    })
                                  }
                                  isLoading={isSavingThis}
                                  labelOn="Abierto"
                                  labelOff="Cerrado"
                                />
                              </td>
                              <td className="px-6 py-4 text-center">
                                <ToggleSwitch
                                  enabled={ev.visible_boleta}
                                  onChange={(val) =>
                                    updateEvaluacion(ev.id_evaluacion, {
                                      visible_boleta: val,
                                    })
                                  }
                                  isLoading={isSavingThis}
                                  labelOn="Visible"
                                  labelOff="Oculto"
                                />
                              </td>

                              {/* BOTÓN GUARDAR (SOLO SI CAMBIA TEXTO) */}
                              <td className="px-6 py-4 text-right h-full align-middle">
                                {hasChanges && (
                                  <button
                                    onClick={() =>
                                      updateEvaluacion(ev.id_evaluacion, {
                                        nombre: edits.nombre,
                                        nombre_corto: edits.nombre_corto,
                                        agrupador: edits.agrupador,
                                      })
                                    }
                                    disabled={isSavingThis}
                                    className="text-indigo-400 hover:text-white p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 transition-all"
                                    title="Guardar cambios de texto"
                                  >
                                    <PencilSquareIcon className="w-5 h-5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
}

export default PeriodosEvaluacionPage;
