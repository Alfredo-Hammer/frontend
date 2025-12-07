import {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import CrearEscuelaModal from "./CrearEscuelaModal";
import EditarEscuelaModal from "./EditarEscuelaModal";
import ConfirmModal from "./ConfirmModal";
import {useNavigate} from "react-router-dom";
import Toast from "./Toast";

function EscuelasList({setToken}) {
  const [escuelas, setEscuelas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [escuelaEditar, setEscuelaEditar] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [escuelaEliminar, setEscuelaEliminar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMunicipio, setFilterMunicipio] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  // Verificar permisos de admin
  let esAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      esAdmin = payload.id_rol === 1 || payload.id_rol === 2; // 1: Admin, 2: Profesor
    } catch (err) {
      console.error("Error al decodificar token:", err);
    }
  }

  const fetchEscuelas = async () => {
    if (!token) {
      setError("No se encontró token de autenticación");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Obteniendo escuelas...");
      const response = await api.get("/api/escuelas", {
        headers: {Authorization: `Bearer ${token}`},
      });

      console.log("Escuelas obtenidas:", response.data);

      if (Array.isArray(response.data)) {
        setEscuelas(response.data);
      } else {
        setError("Formato de datos incorrecto recibido del servidor");
        setEscuelas([]);
      }
    } catch (error) {
      console.error("Error al obtener escuelas:", error);

      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message ||
          error.response.data?.error ||
          "Error desconocido";

        switch (status) {
          case 401:
            setError("Token de autenticación inválido o expirado");
            localStorage.removeItem("token");
            setTimeout(() => navigate("/login"), 2000);
            break;
          case 403:
            setError("No tienes permisos para acceder a esta información");
            break;
          case 404:
            setError(
              "Endpoint no encontrado. Verifica la configuración del servidor"
            );
            break;
          case 500:
            setError(`Error interno del servidor: ${message}`);
            break;
          default:
            setError(`Error del servidor (${status}): ${message}`);
        }
      } else if (error.request) {
        setError(
          "No se pudo conectar con el servidor. Verifica tu conexión a internet"
        );
      } else {
        setError(`Error en la petición: ${error.message}`);
      }

      setEscuelas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminar = async () => {
    if (!escuelaEliminar || !token) return;

    try {
      await api.delete(`/api/escuelas/${escuelaEliminar.id_escuela}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setConfirmOpen(false);
      setEscuelaEliminar(null);
      fetchEscuelas();
    } catch (err) {
      console.error("Error al eliminar escuela:", err);
      if (err.response && err.response.status === 403) {
        showToast("No tienes permisos para eliminar esta escuela.", "error");
      } else {
        showToast("Error al eliminar la escuela", "error");
      }
    }
  };

  useEffect(() => {
    fetchEscuelas();
    // eslint-disable-next-line
  }, []);

  // Filtrar escuelas basado en búsqueda y filtros
  const escuelasFiltradas = escuelas.filter((escuela) => {
    const matchesSearch =
      escuela.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      escuela.nombre_director
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      escuela.codigo_escuela.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMunicipio =
      filterMunicipio === "" || escuela.municipio === filterMunicipio;
    return matchesSearch && matchesMunicipio;
  });

  // Obtener lista única de municipios para el filtro
  const municipios = [
    ...new Set(escuelas.map((escuela) => escuela.municipio)),
  ].sort();

  // Si hay error, mostrar pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-red-500/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-4">
              Error al Cargar Escuelas
            </h2>
            <p className="text-red-300 text-sm mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError("");
                  fetchEscuelas();
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors duration-200"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header with animated background */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                🏫 Gestión de Escuelas
              </h1>
              <p className="text-blue-100 text-lg">
                Administra todas tus instituciones educativas
              </p>
            </div>
            <button
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 py-3 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-blue-200"
              onClick={() => setShowModal(true)}
            >
              <span className="mr-2">➕</span>
              Registrar Escuela
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando escuelas...
            </span>
          </div>
        )}

        {/* Search and Filter Bar */}
        {!isLoading && escuelas.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre, director o código..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl leading-5 bg-gray-700 placeholder-gray-400 text-white focus:outline-none focus:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3 items-center">
                <select
                  className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                  value={filterMunicipio}
                  onChange={(e) => setFilterMunicipio(e.target.value)}
                >
                  <option value="">Todos los municipios</option>
                  {municipios.map((municipio) => (
                    <option key={municipio} value={municipio}>
                      {municipio}
                    </option>
                  ))}
                </select>
                <div className="flex bg-gray-700 rounded-xl p-1">
                  <button
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setViewMode("grid")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                  </button>
                  <button
                    className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-300 hover:bg-gray-600"
                    }`}
                    onClick={() => setViewMode("list")}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 10h16M4 14h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            {escuelasFiltradas.length !== escuelas.length && (
              <div className="mt-4 text-sm text-gray-400">
                Mostrando {escuelasFiltradas.length} de {escuelas.length}{" "}
                escuelas
              </div>
            )}
          </div>
        )}

        {/* Statistics cards */}
        {!isLoading && escuelas.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">🏫</div>
                <div>
                  <div className="text-2xl font-bold">{escuelas.length}</div>
                  <div className="text-blue-100">Total Escuelas</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">📍</div>
                <div>
                  <div className="text-2xl font-bold">{municipios.length}</div>
                  <div className="text-green-100">Municipios</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center">
                <div className="text-3xl mr-4">👨‍🏫</div>
                <div>
                  <div className="text-2xl font-bold">
                    {new Set(escuelas.map((e) => e.nombre_director)).size}
                  </div>
                  <div className="text-purple-100">Directores</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <CrearEscuelaModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={fetchEscuelas}
          setToken={setToken}
        />

        <EditarEscuelaModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          escuela={escuelaEditar}
          onSuccess={fetchEscuelas}
          setToken={setToken}
        />

        {/* Empty State */}
        {!isLoading && escuelas.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🏫</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              No hay escuelas registradas
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Comienza registrando tu primera escuela para gestionar la
              información educativa de manera eficiente.
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              onClick={() => setShowModal(true)}
            >
              <span className="mr-2">➕</span>
              Registrar Primera Escuela
            </button>
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoading &&
          escuelas.length > 0 &&
          escuelasFiltradas.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-400">
                Intenta modificar los filtros de búsqueda
              </p>
            </div>
          )}

        {/* Single School Special Design */}
        {!isLoading &&
          escuelasFiltradas.length === 1 &&
          escuelas.length === 1 && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                <h2 className="text-3xl font-bold text-white text-center">
                  Escuela Principal
                </h2>
              </div>
              <div className="p-8">
                <div className="flex flex-col lg:flex-row items-center gap-8">
                  {escuelasFiltradas[0].logo && (
                    <div className="flex-shrink-0">
                      <img
                        src={`http://localhost:4000${escuelasFiltradas[0].logo}`}
                        alt="Logo de la escuela"
                        className="w-48 h-48 object-contain rounded-2xl border-4 border-blue-400 bg-white shadow-xl"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-4xl font-bold text-white mb-6">
                      {escuelasFiltradas[0].nombre}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Director
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].nombre_director}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Municipio
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].municipio}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Código Escuela
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].codigo_escuela}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Código Establecimiento
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].codigo_establecimiento}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Dirección
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].direccion}
                        </div>
                      </div>
                      <div className="bg-gray-700 rounded-xl p-4 shadow-sm border border-gray-600">
                        <div className="text-gray-400 text-sm uppercase tracking-wide font-semibold mb-1">
                          Teléfono
                        </div>
                        <div className="text-lg text-gray-100 font-medium">
                          {escuelasFiltradas[0].telefono}
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 flex gap-4 justify-end">
                      <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200">
                        📊 Ver Detalles
                      </button>
                      <button
                        className="px-6 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setEscuelaEditar(escuelasFiltradas[0]);
                          setEditModalOpen(true);
                        }}
                      >
                        ✏️ Editar
                      </button>
                      {esAdmin && (
                        <button
                          className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                          onClick={() => {
                            setEscuelaEliminar(escuelasFiltradas[0]);
                            setConfirmOpen(true);
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Grid/List View para múltiples escuelas */}

        {/* Grid/List View para múltiples escuelas */}
        {!isLoading && escuelasFiltradas.length > 1 && (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {escuelasFiltradas.map((escuela) => (
                  <div
                    key={escuela.id_escuela}
                    className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-blue-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Header card con gradiente */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>
                      {escuela.logo && (
                        <div className="flex justify-center mb-4">
                          <img
                            src={`http://localhost:4000${escuela.logo}`}
                            alt="Logo"
                            className="w-20 h-20 object-contain rounded-full border-4 border-white bg-white shadow-lg"
                          />
                        </div>
                      )}
                      <h3 className="text-xl font-bold text-white text-center line-clamp-2">
                        {escuela.nombre}
                      </h3>
                    </div>

                    {/* Contenido de la card */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                          <span className="text-blue-400 font-semibold">
                            👨‍💼
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Director</p>
                          <p className="font-semibold text-gray-200 truncate">
                            {escuela.nombre_director}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-900 rounded-full flex items-center justify-center">
                          <span className="text-green-400 font-semibold">
                            📍
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Municipio</p>
                          <p className="font-semibold text-gray-200">
                            {escuela.municipio}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-900 rounded-full flex items-center justify-center">
                          <span className="text-purple-400 font-semibold">
                            #
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Código</p>
                          <p className="font-semibold text-gray-200">
                            {escuela.codigo_escuela}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-900 rounded-full flex items-center justify-center">
                          <span className="text-orange-400 font-semibold">
                            📞
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Teléfono</p>
                          <p className="font-semibold text-gray-200">
                            {escuela.telefono}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                      <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transform hover:scale-105 transition-all duration-200">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>Ver</span>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEscuelaEditar(escuela);
                            setEditModalOpen(true);
                          }}
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 shadow-sm transform hover:scale-105 transition-all duration-200"
                          title="Editar"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {esAdmin && (
                          <button
                            onClick={() => {
                              setEscuelaEliminar(escuela);
                              setConfirmOpen(true);
                            }}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm transform hover:scale-105 transition-all duration-200"
                            title="Eliminar"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                  <h3 className="text-lg font-semibold text-white">
                    Lista de Escuelas
                  </h3>
                </div>
                <div className="divide-y divide-gray-700">
                  {escuelasFiltradas.map((escuela) => (
                    <div
                      key={escuela.id_escuela}
                      className="p-6 hover:bg-gray-700 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {escuela.logo && (
                            <img
                              src={`http://localhost:4000${escuela.logo}`}
                              alt="Logo"
                              className="w-16 h-16 object-contain rounded-lg border-2 border-gray-600 bg-white"
                            />
                          )}
                          <div>
                            <h4 className="text-xl font-bold text-gray-100">
                              {escuela.nombre}
                            </h4>
                            <p className="text-gray-300">
                              {escuela.nombre_director} • {escuela.municipio}
                            </p>
                            <div className="flex space-x-4 mt-2 text-sm text-gray-400">
                              <span>📞 {escuela.telefono}</span>
                              <span># {escuela.codigo_escuela}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transform hover:scale-105 transition-all duration-200">
                            Ver Detalles
                          </button>
                          <button
                            onClick={() => {
                              setEscuelaEditar(escuela);
                              setEditModalOpen(true);
                            }}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
                          >
                            Editar
                          </button>
                          {esAdmin && (
                            <button
                              onClick={() => {
                                setEscuelaEliminar(escuela);
                                setConfirmOpen(true);
                              }}
                              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar escuela"
        message="¿Estás seguro de que deseas eliminar esta escuela? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleEliminar}
      />

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({show: false, message: "", type: "success"})}
        />
      )}
    </div>
  );
}

export default EscuelasList;
