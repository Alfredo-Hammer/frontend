import React, {useState, useEffect, useMemo} from "react";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import {
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";

// Configuración visual de estados
const ESTADOS_CONFIG = {
  Presente: {
    color: "text-emerald-600",
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    icon: CheckCircleIcon,
    next: "Ausente",
  },
  Ausente: {
    color: "text-red-600",
    bg: "bg-red-100",
    border: "border-red-200",
    icon: XCircleIcon,
    next: "Tarde",
  },
  Tarde: {
    color: "text-amber-600",
    bg: "bg-amber-100",
    border: "border-amber-200",
    icon: ExclamationTriangleIcon,
    next: "Justificado",
  },
  Justificado: {
    color: "text-blue-600",
    bg: "bg-blue-100",
    border: "border-blue-200",
    icon: ExclamationCircleIcon,
    next: "Presente",
  },
};

function Asistencia() {
  const API_BASE_URL = "http://localhost:4000"; // Ajusta según tu env
  const token = localStorage.getItem("token");

  // --- ESTADOS DE DATOS ---
  const [cargas, setCargas] = useState([]);
  const [cargaSeleccionadaId, setCargaSeleccionadaId] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [sesionActual, setSesionActual] = useState(null); // Datos de la cabecera (id_sesion, estado)
  const [estudiantes, setEstudiantes] = useState([]); // Lista de alumnos con su estado
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // --- ESTADOS UI ---
  const [filtroNombre, setFiltroNombre] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    type: "warning",
    onConfirm: null,
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast((prev) => ({...prev, show: false})), 3000);
  };

  const showConfirm = ({
    title,
    message,
    confirmText,
    type = "warning",
    onConfirm,
  }) => {
    setConfirmModal({
      show: true,
      title,
      message,
      confirmText: confirmText || "Confirmar",
      type,
      onConfirm,
    });
  };

  // 1. Cargar Cargas Académicas (Clases del profesor/admin)
  useEffect(() => {
    const fetchCargas = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/carga-academica`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        const data = res.data?.data || res.data || [];
        setCargas(data);
        if (data.length > 0) setCargaSeleccionadaId(data[0].id_carga);
      } catch (error) {
        console.error("Error cargas:", error);
        showToast("Error al cargar las clases.", "error");
      }
    };
    fetchCargas();
  }, []);

  // 2. Cargar Asistencia (Sesión) al cambiar fecha o clase
  useEffect(() => {
    if (!cargaSeleccionadaId) return;
    fetchAsistenciaSesion();
  }, [cargaSeleccionadaId, fechaSeleccionada]);

  const fetchAsistenciaSesion = async () => {
    setLoading(true);
    setHasChanges(false);
    try {
      // Necesitamos id_materia e id_seccion de la carga seleccionada
      const carga = cargas.find(
        (c) => String(c.id_carga) === String(cargaSeleccionadaId)
      );
      if (!carga) return;

      console.log("Enviando Params:", {
        fecha: fechaSeleccionada,
        id_materia: carga.id_materia,
        id_seccion: carga.id_seccion,
      });

      const params = new URLSearchParams({
        fecha: fechaSeleccionada,
        id_materia: carga.id_materia,
        id_seccion: carga.id_seccion,
      });

      const res = await axios.get(
        `${API_BASE_URL}/api/asistencia?${params.toString()}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      const {existe, estado_sesion, estudiantes} = res.data;

      setSesionActual({existe, estado: estado_sesion});
      setEstudiantes(
        estudiantes.map((e) => ({
          ...e,
          // Asegurar valores por defecto para UI
          estado: e.estado || "Presente",
          observacion: e.observacion || "",
        }))
      );
    } catch (error) {
      console.error("Error asistencia:", error);
      showToast("Error al cargar la lista de asistencia.", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADORES DE ACCIÓN ---

  const handleEstadoClick = (index) => {
    const nuevos = [...estudiantes];
    const estadoActual = nuevos[index].estado;
    const siguienteEstado = ESTADOS_CONFIG[estadoActual]?.next || "Presente";

    nuevos[index].estado = siguienteEstado;
    setEstudiantes(nuevos);
    setHasChanges(true);
  };

  const handleObservacionChange = (index, valor) => {
    const nuevos = [...estudiantes];
    nuevos[index].observacion = valor;
    setEstudiantes(nuevos);
    setHasChanges(true); // Opcional: si quieres guardar solo por cambiar texto
  };

  const marcarTodos = (estado) => {
    showConfirm({
      title: "Confirmar",
      message: `¿Marcar a TODOS como ${estado}?`,
      confirmText: "Marcar",
      type: "warning",
      onConfirm: () => {
        const nuevos = estudiantes.map((e) => ({...e, estado}));
        setEstudiantes(nuevos);
        setHasChanges(true);
        setConfirmModal({show: false});
        showToast(`Marcados todos como ${estado}.`, "success");
      },
    });
  };

  const guardarCambios = async () => {
    setSaving(true);
    try {
      const carga = cargas.find(
        (c) => String(c.id_carga) === String(cargaSeleccionadaId)
      );

      const payload = {
        fecha: fechaSeleccionada,
        id_materia: carga.id_materia,
        id_seccion: carga.id_seccion,
        estudiantes: estudiantes.map((e) => ({
          id_estudiante: e.id_estudiante,
          estado: e.estado,
          observacion: e.observacion,
        })),
      };

      await axios.post(`${API_BASE_URL}/api/asistencia`, payload, {
        headers: {Authorization: `Bearer ${token}`},
      });

      showToast("Asistencia guardada correctamente.", "success");
      setHasChanges(false);
      // Recargar para confirmar datos (opcional, pero seguro)
      fetchAsistenciaSesion();
    } catch (error) {
      console.error("Error guardando:", error);
      showToast(error.response?.data?.error || "Error al guardar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const cambiarFecha = (dias) => {
    const nueva = new Date(fechaSeleccionada);
    nueva.setDate(nueva.getDate() + dias);
    setFechaSeleccionada(nueva.toISOString().split("T")[0]);
  };

  // --- FILTRADO VISUAL ---
  const estudiantesFiltrados = useMemo(() => {
    return estudiantes.filter((e) =>
      (e.nombre + " " + e.apellido)
        .toLowerCase()
        .includes(filtroNombre.toLowerCase())
    );
  }, [estudiantes, filtroNombre]);

  // --- ESTADÍSTICAS RÁPIDAS ---
  const stats = useMemo(() => {
    const s = {
      Presente: 0,
      Ausente: 0,
      Tarde: 0,
      Justificado: 0,
      Total: estudiantes.length,
    };
    estudiantes.forEach((e) => {
      if (s[e.estado] !== undefined) s[e.estado]++;
    });
    return s;
  }, [estudiantes]);

  // --- RENDER ---

  // Helpers UI
  const cargaInfo = cargas.find(
    (c) => String(c.id_carga) === String(cargaSeleccionadaId)
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      {/* HEADER PRINCIPAL */}
      <PageHeader
        title="Registro de Asistencia"
        subtitle="Control diario de asistencia por sesión."
        icon={ClockIcon}
      />

      {/* BARRA DE CONTROL SUPERIOR */}
      <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-lg border border-gray-700 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
        {/* Selector de Clase */}
        <div className="w-full md:w-1/3">
          <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
            Clase / Sección
          </label>
          <div className="relative">
            <UserGroupIcon className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <select
              value={cargaSeleccionadaId}
              onChange={(e) => setCargaSeleccionadaId(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
            >
              {cargas.map((c) => (
                <option key={c.id_carga} value={c.id_carga}>
                  {c.grado_nombre} - {c.seccion_nombre} • {c.materia_nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div className="w-full md:w-auto flex items-center gap-3 bg-gray-900 p-2 rounded-xl border border-gray-700">
          <button
            onClick={() => cambiarFecha(-1)}
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center px-2">
            <span className="text-xs text-gray-500 uppercase font-bold">
              Fecha de Clase
            </span>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="bg-transparent text-white font-bold outline-none text-center w-36 cursor-pointer"
            />
          </div>
          <button
            onClick={() => cambiarFecha(1)}
            disabled={
              fechaSeleccionada >= new Date().toISOString().split("T")[0]
            }
            className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition disabled:opacity-30"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Botón Guardar */}
        <div className="w-full md:w-auto">
          <button
            onClick={guardarCambios}
            disabled={saving || !hasChanges || loading}
            className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
              hasChanges
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20 transform hover:-translate-y-1"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            {saving
              ? "Guardando..."
              : hasChanges
              ? "Guardar Cambios"
              : "Al día"}
          </button>
        </div>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS (BARRA) */}
      {!loading && estudiantes.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {Object.entries(ESTADOS_CONFIG).map(([key, conf]) => (
            <div
              key={key}
              className={`hidden md:flex items-center justify-between p-3 rounded-xl border ${conf.bg} ${conf.border} bg-opacity-10 border-opacity-20`}
            >
              <span className={`text-sm font-bold ${conf.color}`}>{key}s</span>
              <span className={`text-xl font-bold ${conf.color}`}>
                {stats[key]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* TABLA DE ASISTENCIA */}
      <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col">
        {/* Toolbar de Tabla */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
          <div className="relative w-64">
            <FunnelIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-2">
            <span className="hidden sm:inline">Acciones rápidas:</span>
            <button
              onClick={() => marcarTodos("Presente")}
              className="hover:text-emerald-400 font-bold transition"
            >
              Todos P
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => marcarTodos("Ausente")}
              className="hover:text-red-400 font-bold transition"
            >
              Todos A
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ArrowPathIcon className="w-8 h-8 animate-spin mb-2" />
              Cargando lista...
            </div>
          ) : estudiantesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <UserGroupIcon className="w-12 h-12 mb-2 opacity-50" />
              <p>No se encontraron estudiantes para esta clase.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b border-gray-700">
                    Estudiante
                  </th>
                  <th className="p-4 font-semibold border-b border-gray-700 text-center w-40">
                    Estado
                  </th>
                  <th className="p-4 font-semibold border-b border-gray-700 w-1/3">
                    Observación
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {estudiantesFiltrados.map((est, idx) => {
                  const conf =
                    ESTADOS_CONFIG[est.estado] || ESTADOS_CONFIG["Presente"];
                  const Icon = conf.icon;

                  return (
                    <tr
                      key={est.id_estudiante}
                      className="hover:bg-gray-700/30 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-gray-200">
                          {est.nombre} {est.apellido}
                        </div>
                        <div className="text-xs text-gray-500">
                          {est.codigo_estudiante || "Sin código"}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleEstadoClick(idx)}
                          className={`
                                                relative w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all
                                                ${conf.bg} ${conf.border} bg-opacity-10 border-opacity-50 hover:bg-opacity-20
                                            `}
                        >
                          <Icon className={`w-5 h-5 ${conf.color}`} />
                          <span className={`text-sm font-bold ${conf.color}`}>
                            {est.estado}
                          </span>
                        </button>
                      </td>

                      <td className="p-4">
                        <input
                          type="text"
                          value={est.observacion}
                          onChange={(e) =>
                            handleObservacionChange(idx, e.target.value)
                          }
                          placeholder="Añadir nota..."
                          className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 focus:border-emerald-500 outline-none text-sm text-gray-300 placeholder-gray-600 transition-colors py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Status */}
        <div className="p-3 bg-gray-900 border-t border-gray-700 text-xs text-gray-500 flex justify-between px-6">
          <span>
            Sesión:{" "}
            {sesionActual?.existe ? (
              <span className="text-emerald-500 font-bold">
                Registrada ({sesionActual.estado})
              </span>
            ) : (
              <span className="text-blue-400">Nueva (Sin guardar)</span>
            )}
          </span>
          <span>Total: {estudiantes.length} alumnos</span>
        </div>
      </div>

      {/* TOAST NOTIFICATIONS */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}

      {confirmModal.show && (
        <ConfirmModal
          open={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText="Cancelar"
          type={confirmModal.type}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({show: false})}
        />
      )}
    </div>
  );
}

export default Asistencia;
