import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

function MateriasPage() {
  const [materias, setMaterias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("Ciencias Sociales");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);

  // Estados para Toast y ConfirmModal
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning",
    loading: false,
  });

  // Nuevos estados para funcionalidades adicionales
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" o "table"
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState("");

  // Categorías disponibles según MINED Nicaragua
  const CATEGORIAS_MATERIAS = [
    "Ciencias Sociales",
    "Creciendo en Valores",
    "Ciencias de la Vida y el Ambiente",
    "Desarrollo Personal, Social y Emocional",
    "Desarrollo  de las Habilidades de la comunicacion y Talento Artístico",
    "Desarrollo del Pensamiento Logico y Cientifico",
    "Educación Técnica",
    "Educación Física y Práctica Deportiva",
    "Educación para Aprender, Emprender, Prosperar",
    "Formación Ciudadana",
    "Religión",
    "General",
    "Otra",
  ];

  const token = localStorage.getItem("token");

  // Funciones auxiliares para Toast
  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const hideToast = () => {
    setToast({show: false, message: "", type: "success"});
  };

  // Verificar si el usuario puede editar/eliminar (solo admin, director, secretaria)
  const canEdit =
    user &&
    [
      "admin",
      "administrador",
      "director",
      "secretariado",
      "secretaria",
    ].includes(user.rol?.toLowerCase());

  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user) {
      fetchMaterias();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
      });

      // Cargar datos de la escuela
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  };

  const fetchMaterias = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
        params: {_t: new Date().getTime()},
      });

      // Extraer el array de materias del campo data de la respuesta
      setMaterias(res.data.data || res.data || []);
    } catch (error) {
      console.error("Error al cargar materias:", error);
      showToast("Error al cargar materias", "error");
      setMaterias([]); // Asegurar que materias sea siempre un array
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      await api.post(
        services.materias,
        {
          nombre,
          descripcion,
          categoria,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setShowModal(false);
      showToast("Materia creada correctamente", "success");
      fetchMaterias();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear materia",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActualizar = async (id) => {
    setIsSubmitting(true);
    try {
      await api.put(
        services.materias + `/${id}`,
        {
          nombre,
          descripcion,
          categoria,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setShowModal(false);
      showToast("Materia actualizada correctamente", "success");
      fetchMaterias();
    } catch (error) {
      showToast(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al actualizar materia",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = (id, nombreMateria) => {
    setConfirmModal({
      show: true,
      title: "¿Eliminar materia?",
      message: `¿Estás seguro que deseas eliminar la materia "${nombreMateria}"? Esta acción no se puede deshacer.`,
      onConfirm: () => confirmarEliminacion(id),
      type: "danger",
      loading: false,
    });
  };

  const confirmarEliminacion = async (id) => {
    setConfirmModal((prev) => ({...prev, loading: true}));

    try {
      await api.delete(services.materias + `/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      showToast("Materia eliminada correctamente", "success");
      fetchMaterias();
      setConfirmModal({
        show: false,
        title: "",
        message: "",
        onConfirm: null,
        type: "warning",
        loading: false,
      });
    } catch (error) {
      showToast(
        error.response?.data?.message || "Error al eliminar materia",
        "error"
      );
      setConfirmModal((prev) => ({...prev, loading: false}));
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setCategoria("General");
    setEditId(null);
  };

  const handleEditarMateria = (materia) => {
    setEditId(materia.id_materia);
    setNombre(materia.nombre);
    setDescripcion(materia.descripcion || "");
    setCategoria(materia.categoria || "General");
    setShowModal(true);
  };

  // Filtros y búsqueda
  const materiasFiltradas = (Array.isArray(materias) ? materias : []).filter(
    (materia) => {
      const matchesSearch =
        materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (materia.descripcion &&
          materia.descripcion
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (materia.codigo_materia &&
          materia.codigo_materia
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesCategoria =
        filtroCategoria === "" || materia.categoria === filtroCategoria;

      return matchesSearch && matchesCategoria;
    }
  );

  // Ordenamiento
  const materiasOrdenadas = [...materiasFiltradas].sort((a, b) => {
    let aValue = a[sortBy] || "";
    let bValue = b[sortBy] || "";

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Estadísticas
  const estadisticas = {
    total: Array.isArray(materias) ? materias.length : 0,
    conGrados: Array.isArray(materias)
      ? materias.filter((m) => {
          const totalGrados = Number(m.total_grados || 0);
          if (totalGrados > 0) return true;
          // Fallback por compatibilidad si viene string
          const nombres = (m.grados_nombres ?? "").toString().trim();
          return nombres.length > 0;
        }).length
      : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Moderno y Compacto */}
        <PageHeader
          title="Catálogo de Materias"
          subtitle="Administra el catálogo completo de materias, asignaturas y cursos del sistema educativo"
          icon={BookOpenIcon}
          gradientFrom="purple-600"
          gradientTo="indigo-600"
          badge="Gestión Académica"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={{
            "Total de Materias": estadisticas.total,
            "Con Grados Asignados": estadisticas.conGrados,
          }}
          actions={
            <>
              {canEdit && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Nueva Materia</span>
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-white/20 text-white rounded-xl font-semibold backdrop-blur-sm hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
              >
                <FunnelIcon className="w-5 h-5" />
                <span>
                  {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                </span>
              </button>
            </>
          }
        />

        {/* Barra de búsqueda y controles */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar materias por nombre, código o descripción..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {CATEGORIAS_MATERIAS.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="nombre">Ordenar por Nombre</option>
                <option value="categoria">Ordenar por Categoría</option>
                <option value="codigo_materia">Ordenar por Código</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-3 border border-gray-600 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                title={`Orden ${
                  sortOrder === "asc" ? "Ascendente" : "Descendente"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>

              <div className="flex bg-gray-700 rounded-xl p-1">
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "cards"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("cards")}
                >
                  <BookOpenIcon className="w-5 h-5" />
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros avanzados - Eliminados */}

          {materiasOrdenadas.length !== materias.length && (
            <div className="mt-4 text-sm text-gray-400">
              Mostrando {materiasOrdenadas.length} de {materias.length} materias
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando materias...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          materiasOrdenadas.length === 0 &&
          (!Array.isArray(materias) || materias.length === 0) && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">📚</div>
              <h2 className="text-2xl font-bold text-gray-300 mb-4">
                No hay materias registradas
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Comienza creando la primera materia para organizar el catálogo
                académico.
              </p>
              {canEdit && (
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <PlusIcon className="w-5 h-5 mr-2 inline" />
                  Crear Primera Materia
                </button>
              )}
            </div>
          )}

        {/* Filtered empty state */}
        {!isLoading &&
          materiasOrdenadas.length === 0 &&
          Array.isArray(materias) &&
          materias.length > 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No se encontraron materias
              </h3>
              <p className="text-gray-400">
                Intenta modificar los filtros de búsqueda
              </p>
            </div>
          )}

        {/* Vista de Tarjetas */}
        {!isLoading && materiasOrdenadas.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {materiasOrdenadas.map((materia) => (
              <div
                key={materia.id_materia}
                className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-purple-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center justify-between">
                    <BookOpenIcon className="w-8 h-8 text-white" />
                    {materia.codigo_materia && (
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {materia.codigo_materia}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3 line-clamp-2">
                    {materia.nombre}
                  </h3>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full">
                      {materia.categoria || "General"}
                    </span>
                  </div>
                  {materia.descripcion && (
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {materia.descripcion}
                    </p>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                  {canEdit && (
                    <>
                      <button
                        onClick={() => handleEditarMateria(materia)}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
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
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() =>
                          handleEliminar(materia.id_materia, materia.nombre)
                        }
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
                    </>
                  )}
                  {!canEdit && (
                    <div className="w-full text-center py-2 text-gray-400 text-sm">
                      Solo lectura
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vista de Tabla */}
        {!isLoading && materiasOrdenadas.length > 0 && viewMode === "table" && (
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {materiasOrdenadas.map((materia) => (
                    <tr
                      key={materia.id_materia}
                      className="hover:bg-gray-700 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <BookOpenIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white line-clamp-1">
                              {materia.nombre}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 rounded-full">
                          {materia.codigo_materia || "Sin código"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-indigo-500/20 text-indigo-300 rounded-full">
                          {materia.categoria || "General"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-300 max-w-xs">
                          {materia.descripcion || "Sin descripción"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {canEdit ? (
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEditarMateria(materia)}
                              className="p-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors duration-200"
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
                            <button
                              onClick={() =>
                                handleEliminar(
                                  materia.id_materia,
                                  materia.nombre
                                )
                              }
                              className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
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
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            Solo lectura
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal para crear/editar materia */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editId ? "Editar Materia" : "Crear Nueva Materia"}
                    </h3>
                    <p className="text-purple-100 text-sm">
                      {editId
                        ? "Modifica la información de la materia"
                        : "Agrega una nueva materia al catálogo"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      limpiarFormulario();
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (editId) {
                    await handleActualizar(editId);
                  } else {
                    await handleCrear(e);
                  }
                  limpiarFormulario();
                }}
                className="p-8 space-y-8"
              >
                {/* Información Básica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                      <BookOpenIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Información Básica
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de la Materia *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Matemáticas Avanzadas"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        maxLength={255}
                        required
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Categoría *
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        required
                      >
                        {CATEGORIAS_MATERIAS.map((cat) => (
                          <option key={cat} value={cat} className="bg-gray-800">
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Código
                      </label>
                      <div className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-400">
                        Se genera automáticamente
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Descripción detallada de la materia..."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 resize-none"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      limpiarFormulario();
                    }}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {editId ? "Actualizando..." : "Creando..."}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {editId ? "Actualizar Materia" : "Crear Materia"}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toast Component */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          duration={4000}
        />
      )}

      {/* Confirm Modal Component */}
      <ConfirmModal
        open={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal({
            show: false,
            title: "",
            message: "",
            onConfirm: null,
            type: "warning",
            loading: false,
          })
        }
        type={confirmModal.type}
        loading={confirmModal.loading}
      />
    </div>
  );
}

export default MateriasPage;
