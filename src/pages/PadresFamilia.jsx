import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig"; // Usamos la instancia configurada
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import {hasPermission} from "../config/roles";
import {
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  BellAlertIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  Squares2X2Icon,
  TableCellsIcon,
  UsersIcon,
  AcademicCapIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

// --- COMPONENTES AUXILIARES ---

const StatCard = ({title, value, icon: Icon, colorClass}) => (
  <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg flex items-center justify-between">
    <div>
      <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    <div
      className={`p-3 rounded-lg bg-opacity-10 ${colorClass.replace(
        "text-",
        "bg-"
      )}`}
    >
      <Icon className={`w-8 h-8 ${colorClass}`} />
    </div>
  </div>
);

export default function PadresFamilia() {
  // ========== ESTADOS ==========
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filtroGrado, setFiltroGrado] = useState("");

  // Selección y Notificaciones
  const [selectedPadres, setSelectedPadres] = useState([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notificacion, setNotificacion] = useState({asunto: "", mensaje: ""});

  // Detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedPadre, setSelectedPadre] = useState(null);
  // Vinculación Padre-Estudiante
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState("");
  const [tipoParentesco, setTipoParentesco] = useState("Tutor");
  // Usuario actual (para permisos)
  const [user, setUser] = useState(null);

  // UI Feedback
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [estadisticas, setEstadisticas] = useState({total: 0, estudiantes: 0});

  // ========== EFECTOS ==========
  useEffect(() => {
    fetchPadres();
    // Cargar usuario para evaluar permisos
    const token = localStorage.getItem("token");
    const cargarUsuario = async () => {
      try {
        const res = await api.get("/api/usuarios/perfil", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setUser({
          id_usuario: res.data.usuario?.id_usuario,
          nombre: res.data.usuario?.nombre || res.data.nombre,
          apellido: res.data.usuario?.apellido || res.data.apellido,
          rol: (res.data.usuario?.rol || res.data.rol)?.toLowerCase(),
          id_escuela: res.data.usuario?.id_escuela,
          id_profesor: res.data.usuario?.id_profesor,
        });
      } catch (err) {
        console.error("Error al cargar usuario:", err);
      }
    };
    if (token) cargarUsuario();
  }, []);

  // Cargar estudiantes cuando se abre detalle
  useEffect(() => {
    if (showDetalleModal) {
      fetchEstudiantes();
    }
  }, [showDetalleModal]);

  // ========== API CALLS ==========
  const fetchPadres = async () => {
    setLoading(true);
    try {
      // Asumimos que el endpoint trae usuarios con rol 'Familiar' y sus hijos vinculados
      const res = await api.get("/api/padres");
      setPadres(res.data.data || []);
      setEstadisticas(res.data.estadisticas || {total: 0, estudiantes: 0});
    } catch (error) {
      console.error(error);
      showToast("Error al cargar la lista de padres", "error");
    } finally {
      setLoading(false);
    }
  };

  const enviarNotificacionMasiva = async () => {
    if (!notificacion.asunto || !notificacion.mensaje) {
      return showToast("Complete el asunto y el mensaje", "warning");
    }

    try {
      await api.post("/api/comunicaciones/email-masivo", {
        destinatarios: selectedPadres, // Array de IDs o Emails
        asunto: notificacion.asunto,
        mensaje: notificacion.mensaje,
        rol_objetivo: "Familiar",
      });

      showToast(
        `Notificación enviada a ${selectedPadres.length} padres`,
        "success"
      );
      setShowNotifModal(false);
      setSelectedPadres([]);
      setNotificacion({asunto: "", mensaje: ""});
    } catch (error) {
      showToast("Error al enviar notificaciones", "error");
    }
  };

  const fetchEstudiantes = async () => {
    try {
      const res = await api.get("/api/alumnos");
      // API devuelve objetos con id_usuario, nombre, apellido; usar id_usuario para vinculación
      const lista = (res.data?.data || res.data || []).map((e) => ({
        id_usuario: e.id_usuario ?? e.id, // fallback
        nombre: e.nombre,
        apellido: e.apellido,
        email: e.email,
      }));
      setEstudiantes(lista);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    }
  };

  const vincularPadreConEstudiante = async () => {
    const puedeVincular =
      user &&
      (hasPermission(user.rol, "padres_familia", "crear") ||
        hasPermission(user.rol, "padres_familia", "editar"));
    if (!puedeVincular) {
      return showToast(
        "No tienes permisos para vincular familiares con estudiantes",
        "error"
      );
    }
    if (!selectedPadre?.id_usuario || !selectedEstudianteId) {
      return showToast("Selecciona un estudiante para vincular", "warning");
    }
    try {
      const res = await api.post("/api/padres/vincular", {
        id_familiar: selectedPadre.id_usuario,
        id_estudiante: Number(selectedEstudianteId),
        tipo_parentesco: tipoParentesco,
      });
      showToast("Vínculo creado/actualizado correctamente", "success");
      // Refrescar datos del padre para mostrar hijos
      await fetchPadres();
      // Actualizar modal seleccionado
      const actualizado = (padres || []).find(
        (p) => p.id_usuario === selectedPadre.id_usuario
      );
      if (actualizado) setSelectedPadre(actualizado);
      setSelectedEstudianteId("");
    } catch (error) {
      console.error("Error al vincular:", error);
      const msg =
        error.response?.data?.message ||
        "Error al vincular padre con estudiante";
      showToast(msg, "error");
    }
  };

  // ========== HANDLERS ==========
  const showToast = (msg, type) => {
    setToast({show: true, message: msg, type});
    setTimeout(() => setToast({...toast, show: false}), 3000);
  };

  const toggleSeleccion = (email) => {
    setSelectedPadres((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const seleccionarTodos = () => {
    if (selectedPadres.length === padresFiltrados.length) {
      setSelectedPadres([]);
    } else {
      setSelectedPadres(padresFiltrados.map((p) => p.email));
    }
  };

  // ========== FILTROS LÓGICOS ==========
  const padresFiltrados = padres.filter((padre) => {
    const matchSearch = (padre.nombre + padre.email + padre.telefono)
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // Lógica para filtrar por grado de los hijos (si el backend devuelve esa info anidada)
    const matchGrado = filtroGrado
      ? padre.hijos?.some((h) => h.grado === filtroGrado)
      : true;

    return matchSearch && matchGrado;
  });

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      <PageHeader
        title="Padres de Familia"
        subtitle="Gestión de tutores, comunicación y vinculación con estudiantes."
        icon={UserGroupIcon}
        stats={{
          "Total Padres": estadisticas.total,
          "Estudiantes Vinculados": estadisticas.estudiantes,
        }}
        actions={
          <button
            onClick={() => setShowNotifModal(true)}
            disabled={selectedPadres.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            <span>Notificar ({selectedPadres.length})</span>
          </button>
        }
      />

      {/* --- ESTADÍSTICAS RÁPIDAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Padres Registrados"
          value={padres.length}
          icon={UsersIcon}
          colorClass="text-cyan-400"
        />
        <StatCard
          title="Con Email Verificado"
          value={padres.filter((p) => p.email_verificado).length}
          icon={CheckIcon}
          colorClass="text-green-400"
        />
        <StatCard
          title="Hijos Promedio"
          value={estadisticas.promedio || "1.2"}
          icon={AcademicCapIcon}
          colorClass="text-purple-400"
        />
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6 shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar padre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-500"
          />
        </div>

        {/* Controles Derecha */}
        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 transition-colors ${
              showFilters
                ? "bg-cyan-900/50 border-cyan-500 text-cyan-400"
                : "bg-gray-700 border-gray-600 text-gray-300"
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
            <span className="hidden md:inline">Filtros</span>
          </button>

          <div className="flex bg-gray-700 rounded-lg p-1 border border-gray-600">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded transition-all ${
                viewMode === "table"
                  ? "bg-gray-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <TableCellsIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded transition-all ${
                viewMode === "cards"
                  ? "bg-gray-600 text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* --- PANEL FILTROS --- */}
      {showFilters && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">
                Filtrar por Grado de Hijos
              </label>
              <select
                value={filtroGrado}
                onChange={(e) => setFiltroGrado(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
              >
                <option value="">Todos los grados</option>
                <option value="1ro">Primer Grado</option>
                <option value="2do">Segundo Grado</option>
                {/* Mapear grados dinámicamente si los tienes */}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --- VISTA: TABLA --- */}
      {viewMode === "table" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-900/50 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      onChange={seleccionarTodos}
                      checked={
                        padresFiltrados.length > 0 &&
                        selectedPadres.length === padresFiltrados.length
                      }
                      className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">
                    Padre / Tutor
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase">
                    Estudiantes a Cargo
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {padresFiltrados.map((padre) => (
                  <tr
                    key={padre.id_usuario}
                    className="hover:bg-gray-700/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPadres.includes(padre.email)}
                        onChange={() => toggleSeleccion(padre.email)}
                        className="rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                          {padre.nombre.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {padre.nombre} {padre.apellido}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {padre.id_usuario}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                          {padre.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <PhoneIcon className="w-4 h-4 text-gray-500" />
                          {padre.telefono || "No registrado"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {padre.hijos && padre.hijos.length > 0 ? (
                          padre.hijos.map((hijo, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            >
                              {hijo.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs italic">
                            Sin estudiantes vinculados
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedPadre(padre);
                          setShowDetalleModal(true);
                        }}
                        className="text-gray-400 hover:text-cyan-400 transition-colors p-2 hover:bg-gray-700 rounded-lg"
                        title="Ver detalle"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {padresFiltrados.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No se encontraron padres que coincidan con la búsqueda.
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- VISTA: CARDS --- */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {padresFiltrados.map((padre) => (
            <div
              key={padre.id_usuario}
              className={`bg-gray-800 border ${
                selectedPadres.includes(padre.email)
                  ? "border-cyan-500 ring-1 ring-cyan-500"
                  : "border-gray-700"
              } rounded-xl p-6 hover:shadow-xl transition-all relative group`}
            >
              <div className="absolute top-4 right-4">
                <input
                  type="checkbox"
                  checked={selectedPadres.includes(padre.email)}
                  onChange={() => toggleSeleccion(padre.email)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-gray-700 p-1 mb-3">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                    {padre.nombre.charAt(0)}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white">
                  {padre.nombre} {padre.apellido}
                </h3>
                <p className="text-sm text-gray-400">{padre.email}</p>
              </div>

              <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Estudiantes
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {padre.hijos?.slice(0, 3).map((h, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                    >
                      {h.nombre}
                    </span>
                  ))}
                  {padre.hijos?.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{padre.hijos.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPadre(padre);
                  setShowDetalleModal(true);
                }}
                className="w-full mt-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Ver Perfil Completo
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL NOTIFICACIÓN --- */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BellAlertIcon className="w-5 h-5 text-cyan-400" />
                Enviar Notificación
              </h3>
              <button
                onClick={() => setShowNotifModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-cyan-900/20 border border-cyan-500/20 p-3 rounded-lg">
                <p className="text-sm text-cyan-200">
                  Enviando a{" "}
                  <span className="font-bold">{selectedPadres.length}</span>{" "}
                  destinatarios seleccionados.
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Asunto
                </label>
                <input
                  value={notificacion.asunto}
                  onChange={(e) =>
                    setNotificacion({...notificacion, asunto: e.target.value})
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                  placeholder="Ej: Reunión de Padres - Mensual"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">
                  Mensaje
                </label>
                <textarea
                  rows="4"
                  value={notificacion.mensaje}
                  onChange={(e) =>
                    setNotificacion({...notificacion, mensaje: e.target.value})
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none resize-none"
                  placeholder="Escriba el comunicado aquí..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowNotifModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarNotificacionMasiva}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-900/20"
                >
                  Enviar Ahora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DETALLE --- */}
      {showDetalleModal && selectedPadre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="relative h-24 bg-gradient-to-r from-cyan-600 to-blue-600">
              <button
                onClick={() => setShowDetalleModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 p-1 rounded-full"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="px-8 pb-8">
              <div className="relative -mt-12 mb-4 flex justify-between items-end">
                <div className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-700 flex items-center justify-center text-3xl font-bold text-white">
                  {selectedPadre.nombre.charAt(0)}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white">
                {selectedPadre.nombre} {selectedPadre.apellido}
              </h2>
              <div className="flex gap-4 text-sm text-gray-400 mt-1 mb-6">
                <span className="flex items-center gap-1">
                  <EnvelopeIcon className="w-4 h-4" /> {selectedPadre.email}
                </span>
                <span className="flex items-center gap-1">
                  <PhoneIcon className="w-4 h-4" /> {selectedPadre.telefono}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <AcademicCapIcon className="w-5 h-5 text-cyan-400" />{" "}
                Estudiantes Vinculados
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPadre.hijos?.map((hijo, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                      {hijo.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {hijo.nombre}
                      </p>
                      <p className="text-xs text-gray-400">
                        {hijo.grado} - Sección {hijo.seccion}
                      </p>
                    </div>
                  </div>
                ))}
                {(!selectedPadre.hijos || selectedPadre.hijos.length === 0) && (
                  <p className="text-gray-500 italic text-sm">
                    No tiene estudiantes asignados.
                  </p>
                )}
              </div>

              {/* Vinculación Padre ↔ Estudiante */}
              {user &&
                (hasPermission(user.rol, "padres_familia", "crear") ||
                  hasPermission(user.rol, "padres_familia", "editar")) && (
                  <div className="mt-6 bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-3">
                      Vincular con Estudiante
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          Estudiante
                        </label>
                        <select
                          value={selectedEstudianteId}
                          onChange={(e) =>
                            setSelectedEstudianteId(e.target.value)
                          }
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="">Selecciona estudiante...</option>
                          {estudiantes.map((e) => (
                            <option key={e.id_usuario} value={e.id_usuario}>
                              {e.nombre} {e.apellido} ({e.email})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">
                          Parentesco
                        </label>
                        <select
                          value={tipoParentesco}
                          onChange={(e) => setTipoParentesco(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm"
                        >
                          <option value="Padre">Padre</option>
                          <option value="Madre">Madre</option>
                          <option value="Tutor">Tutor</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={vincularPadreConEstudiante}
                          className="w-full md:w-auto px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
                        >
                          Vincular
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Requiere permisos de administración
                      (admin/director/secretariado).
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Componente Toast Global */}
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
