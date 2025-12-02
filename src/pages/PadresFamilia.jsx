import React, {useState, useEffect} from "react";
import axios from "axios";
import {
  UsersIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BellAlertIcon,
  FunnelIcon,
  XMarkIcon,
  CheckIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import ConfirmModal from "../components/ConfirmModal";

const API_URL = "http://localhost:4000/api";

export default function PadresFamilia() {
  const [padres, setPadres] = useState([]);
  const [padresFiltrados, setPadresFiltrados] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPadre, setSelectedPadre] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedPadresNotif, setSelectedPadresNotif] = useState([]);
  const [notification, setNotification] = useState({asunto: "", mensaje: ""});
  const [viewMode, setViewMode] = useState("table");
  const [filtroHijos, setFiltroHijos] = useState("");
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showFilters, setShowFilters] = useState(false);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
  });

  useEffect(() => {
    cargarDatos();
    cargarGrados();
    cargarSecciones();
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [filtroGrado, filtroSeccion, filtroGenero]);

  useEffect(() => {
    aplicarFiltros();
  }, [padres, searchTerm, filtroHijos]);

  const cargarGrados = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/grados`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(response.data);
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  };

  const cargarSecciones = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/secciones`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setSecciones(response.data);
    } catch (error) {
      console.error("Error al cargar secciones:", error);
    }
  };

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = {Authorization: `Bearer ${token}`};

      // Construir parámetros de filtro
      let params = {};
      if (filtroGrado) params.grado = filtroGrado;
      if (filtroSeccion) params.seccion = filtroSeccion;
      if (filtroGenero) params.genero = filtroGenero;

      const [padresRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/padres`, {headers, params}),
        axios.get(`${API_URL}/padres/estadisticas`, {headers}),
      ]);

      setPadres(padresRes.data.data);
      setEstadisticas(statsRes.data.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...padres];

    // Filtro por búsqueda (solo en el cliente)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (padre) =>
          padre.nombre_padre?.toLowerCase().includes(term) ||
          padre.correo_padre?.toLowerCase().includes(term) ||
          padre.telefono_padre?.toLowerCase().includes(term) ||
          padre.nombres_hijos?.toLowerCase().includes(term)
      );
    }

    // Filtro por número de hijos (solo en el cliente)
    if (filtroHijos) {
      if (filtroHijos === "1") {
        resultado = resultado.filter((p) => p.total_hijos === 1);
      } else if (filtroHijos === "2+") {
        resultado = resultado.filter((p) => p.total_hijos >= 2);
      }
    }

    setPadresFiltrados(resultado);
    setCurrentPage(1);
  };

  const verDetalle = async (correo) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_URL}/padres/${correo}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setSelectedPadre(response.data.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar detalle:", error);
    }
  };

  const toggleSeleccionPadre = (correo) => {
    setSelectedPadresNotif((prev) =>
      prev.includes(correo)
        ? prev.filter((c) => c !== correo)
        : [...prev, correo]
    );
  };

  const seleccionarTodos = () => {
    if (selectedPadresNotif.length === currentItems.length) {
      setSelectedPadresNotif([]);
    } else {
      setSelectedPadresNotif(currentItems.map((p) => p.correo_padre));
    }
  };

  const enviarNotificacion = async () => {
    if (!notification.asunto || !notification.mensaje) {
      setConfirmModal({
        open: true,
        title: "Campos incompletos",
        message: "Por favor complete el asunto y mensaje de la notificación.",
        type: "warning",
        confirmText: "Entendido",
        onConfirm: () => setConfirmModal({...confirmModal, open: false}),
        onCancel: () => setConfirmModal({...confirmModal, open: false}),
      });
      return;
    }

    if (selectedPadresNotif.length === 0) {
      setConfirmModal({
        open: true,
        title: "Sin selección",
        message:
          "Debe seleccionar al menos un padre para enviar la notificación.",
        type: "warning",
        confirmText: "Entendido",
        onConfirm: () => setConfirmModal({...confirmModal, open: false}),
        onCancel: () => setConfirmModal({...confirmModal, open: false}),
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/padres/notificaciones`,
        {
          correos: selectedPadresNotif,
          asunto: notification.asunto,
          mensaje: notification.mensaje,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      setShowNotificationModal(false);
      setSelectedPadresNotif([]);
      setNotification({asunto: "", mensaje: ""});

      setConfirmModal({
        open: true,
        title: "Notificación enviada",
        message: `Se ha enviado la notificación a ${response.data.data.exitosos} de ${response.data.data.total} padre(s) exitosamente.`,
        type: "success",
        confirmText: "Aceptar",
        onConfirm: () => setConfirmModal({...confirmModal, open: false}),
        onCancel: () => setConfirmModal({...confirmModal, open: false}),
      });
    } catch (error) {
      console.error("Error:", error);
      setConfirmModal({
        open: true,
        title: "Error al enviar",
        message:
          error.response?.data?.message ||
          "No se pudo enviar la notificación. Por favor intente nuevamente.",
        type: "danger",
        confirmText: "Entendido",
        onConfirm: () => setConfirmModal({...confirmModal, open: false}),
        onCancel: () => setConfirmModal({...confirmModal, open: false}),
      });
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = padresFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(padresFiltrados.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-950/50 via-slate-900 to-blue-950/50 border-b border-gray-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-3xl"></div>
        </div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
                <UserGroupIcon className="w-10 h-10 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Padres de Familia
                </h1>
                <p className="text-cyan-300/80 text-lg">
                  Gestión y comunicación con padres
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium rounded-xl transition-all shadow-lg"
            >
              <BellAlertIcon className="w-5 h-5" />
              Enviar Notificación
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/50 p-6 rounded-2xl border border-cyan-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-300/80 text-sm font-medium mb-1">
                    Total Padres
                  </p>
                  <p className="text-4xl font-bold text-white">
                    {estadisticas.total_padres}
                  </p>
                </div>
                <UsersIcon className="w-12 h-12 text-cyan-400/40" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 p-6 rounded-2xl border border-blue-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300/80 text-sm font-medium mb-1">
                    Estudiantes
                  </p>
                  <p className="text-4xl font-bold text-white">
                    {estadisticas.total_estudiantes_con_padre}
                  </p>
                </div>
                <AcademicCapIcon className="w-12 h-12 text-blue-400/40" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/50 p-6 rounded-2xl border border-indigo-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-300/80 text-sm font-medium mb-1">
                    Promedio Hijos
                  </p>
                  <p className="text-4xl font-bold text-white">
                    {estadisticas.promedio_hijos_por_padre}
                  </p>
                </div>
                <ChartBarIcon className="w-12 h-12 text-indigo-400/40" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 p-6 rounded-2xl border border-purple-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300/80 text-sm font-medium mb-1">
                    Máx. Hijos
                  </p>
                  <p className="text-4xl font-bold text-white">
                    {estadisticas.max_hijos}
                  </p>
                </div>
                <UserGroupIcon className="w-12 h-12 text-purple-400/40" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controles y Filtros */}
      <div className="px-8 py-4 space-y-4">
        {/* Barra de búsqueda principal */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre padre, correo, teléfono o nombre del hijo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 ${
                showFilters ? "bg-cyan-600" : "bg-gray-700"
              } hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2`}
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
            </button>
            <div className="flex gap-2 border-l border-gray-600 pl-4">
              <button
                onClick={() => setViewMode("cards")}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === "cards"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title="Vista de tarjetas"
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-cyan-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title="Vista de tabla"
              >
                <TableCellsIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros expandible */}
        {showFilters && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grado
                </label>
                <select
                  value={filtroGrado}
                  onChange={(e) => setFiltroGrado(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los grados</option>
                  {grados.map((grado) => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sección
                </label>
                <select
                  value={filtroSeccion}
                  onChange={(e) => setFiltroSeccion(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todas las secciones</option>
                  {secciones.map((seccion) => (
                    <option key={seccion.id_seccion} value={seccion.id_seccion}>
                      {seccion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Género del Hijo
                </label>
                <select
                  value={filtroGenero}
                  onChange={(e) => setFiltroGenero(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los géneros</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de Hijos
                </label>
                <select
                  value={filtroHijos}
                  onChange={(e) => setFiltroHijos(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos</option>
                  <option value="1">1 hijo</option>
                  <option value="2+">2 o más hijos</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFiltroHijos("");
                    setFiltroGrado("");
                    setFiltroSeccion("");
                    setFiltroGenero("");
                  }}
                  className="w-full px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información de resultados y selección */}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>
            Mostrando {currentItems.length} de {padresFiltrados.length} padres
          </span>
          {selectedPadresNotif.length > 0 && (
            <span className="text-cyan-400 font-medium">
              {selectedPadresNotif.length} padre(s) seleccionado(s) para
              notificación
            </span>
          )}
        </div>
      </div>

      {/* Vista de Tarjetas */}
      {viewMode === "cards" && (
        <div className="px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">
                No se encontraron padres
              </div>
            ) : (
              currentItems.map((padre, index) => (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all group relative"
                >
                  {/* Checkbox para selección */}
                  <div className="absolute top-4 right-4">
                    <input
                      type="checkbox"
                      checked={selectedPadresNotif.includes(padre.correo_padre)}
                      onChange={() => toggleSeleccionPadre(padre.correo_padre)}
                      className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500 focus:ring-offset-gray-800"
                    />
                  </div>

                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                      {padre.nombre_padre?.charAt(0) || "P"}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {padre.nombre_padre || "Sin nombre"}
                    </h3>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-sm font-medium mb-3">
                      {padre.total_hijos} hijo
                      {padre.total_hijos !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <EnvelopeIcon className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{padre.correo_padre}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <PhoneIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span>{padre.telefono_padre || "N/A"}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3 mb-4">
                    <p className="text-xs text-gray-400 mb-1">Hijos:</p>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {padre.nombres_hijos}
                    </p>
                  </div>

                  <button
                    onClick={() => verDetalle(padre.correo_padre)}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Ver Detalle
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Vista de Tabla */}
      {viewMode === "table" && (
        <div className="px-8 py-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700 border-b border-gray-600">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedPadresNotif.length === currentItems.length &&
                          currentItems.length > 0
                        }
                        onChange={seleccionarTodos}
                        className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Padre
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">
                      Hijos
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">
                      Nombres Hijos
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No se encontraron padres
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((padre, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedPadresNotif.includes(
                              padre.correo_padre
                            )}
                            onChange={() =>
                              toggleSeleccionPadre(padre.correo_padre)
                            }
                            className="w-5 h-5 rounded border-gray-600 text-cyan-600 focus:ring-cyan-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {padre.nombre_padre?.charAt(0) || "P"}
                            </div>
                            <span className="text-white font-medium">
                              {padre.nombre_padre || "Sin nombre"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <EnvelopeIcon className="w-4 h-4 text-cyan-400" />
                              {padre.correo_padre}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                              <PhoneIcon className="w-4 h-4 text-blue-400" />
                              {padre.telefono_padre || "N/A"}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
                            {padre.total_hijos}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          <div
                            className="max-w-xs truncate"
                            title={padre.nombres_hijos}
                          >
                            {padre.nombres_hijos}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => verDetalle(padre.correo_padre)}
                              className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors"
                              title="Ver detalle"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPadresNotif([padre.correo_padre]);
                                setShowNotificationModal(true);
                              }}
                              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                              title="Enviar notificación"
                            >
                              <BellAlertIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="px-8 py-6 flex justify-center items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPage === i + 1
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="p-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Modal de Notificación */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 px-8 py-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellAlertIcon className="w-8 h-8 text-indigo-400" />
                  <h2 className="text-2xl font-bold text-white">
                    Enviar Notificación
                  </h2>
                </div>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <p className="text-gray-300 mb-4">
                  Seleccionados:{" "}
                  <span className="text-cyan-400 font-semibold">
                    {selectedPadresNotif.length} padre(s)
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  value={notification.asunto}
                  onChange={(e) =>
                    setNotification({...notification, asunto: e.target.value})
                  }
                  placeholder="Ej: Reunión de padres"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mensaje
                </label>
                <textarea
                  value={notification.mensaje}
                  onChange={(e) =>
                    setNotification({...notification, mensaje: e.target.value})
                  }
                  placeholder="Escriba su mensaje aquí..."
                  rows="6"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarNotificacion}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />
                  Enviar Notificación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle (existente) */}
      {showModal && selectedPadre && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-8 py-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedPadre.nombre_padre?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {selectedPadre.nombre_padre}
                    </h2>
                    <p className="text-cyan-300">
                      {selectedPadre.correo_padre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="px-8 py-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Información de Contacto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-300">
                  <PhoneIcon className="w-5 h-5 text-cyan-400" />
                  <span>{selectedPadre.telefono_padre || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <EnvelopeIcon className="w-5 h-5 text-cyan-400" />
                  <span>{selectedPadre.correo_padre}</span>
                </div>
              </div>
            </div>

            <div className="px-8 py-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Hijos Registrados ({selectedPadre.hijos?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPadre.hijos?.map((hijo) => (
                  <div
                    key={hijo.id_estudiante}
                    className="bg-gray-700 p-4 rounded-xl border border-gray-600"
                  >
                    <div className="flex items-start gap-3">
                      {hijo.imagen ? (
                        <img
                          src={`http://localhost:4000${hijo.imagen}`}
                          alt={hijo.nombre}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {hijo.nombre?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">
                          {hijo.nombre} {hijo.apellido}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Código: {hijo.codigo_mined}
                        </p>
                        <p className="text-sm text-gray-400">
                          {hijo.nombre_grado} - {hijo.nombre_seccion}
                        </p>
                        <p className="text-sm text-cyan-400">{hijo.email}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-8 py-4 bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText || "Aceptar"}
        cancelText={confirmModal.cancelText || "Cancelar"}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel}
      />
    </div>
  );
}
