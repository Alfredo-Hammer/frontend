import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";

function MateriasPage() {
  const [materias, setMaterias] = useState([]);
  const [grados, setGrados] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [gradosSeleccionados, setGradosSeleccionados] = useState([]);
  const [creditos, setCreditos] = useState("");
  const [horasSemanales, setHorasSemanales] = useState("");
  const [categoria, setCategoria] = useState("");
  const [nivel, setNivel] = useState("");
  const [prerequisitos, setPrerequisitos] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);

  // Nuevos estados para funcionalidades adicionales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterNivel, setFilterNivel] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // "cards" o "table"
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);

  const token = localStorage.getItem("token");

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
    fetchGrados();
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

  const fetchGrados = async () => {
    try {
      const res = await api.get("/api/grados", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(res.data);
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  };

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const fetchMaterias = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
        params: {_t: new Date().getTime()},
      });

      let todasMaterias = res.data;

      // Si es profesor, filtrar solo las materias de sus grados asignados
      if (user?.rol?.toLowerCase() === "profesor" && user?.id_profesor) {
        try {
          // Obtener los grados asignados al profesor
          const asignacionesRes = await api.get(
            `/api/profesores/${user.id_profesor}/asignaciones`,
            {headers: {Authorization: `Bearer ${token}`}}
          );

          const asignacionesData = asignacionesRes.data.asignaciones;
          const gradosProfesor = asignacionesData.map((a) => a.id_grado);

          // Crear un mapa de id_grado -> nombre_grado para el profesor
          const gradosProfesorMap = {};
          asignacionesData.forEach((a) => {
            gradosProfesorMap[a.id_grado] = a.nombre_grado;
          });

          // Filtrar materias y sus grados
          todasMaterias = todasMaterias
            .filter((materia) =>
              materia.grados_ids?.some((gradoId) =>
                gradosProfesor.includes(gradoId)
              )
            )
            .map((materia) => {
              // Filtrar solo los grados del profesor en grados_ids y grados_nombres
              const gradosIdsFiltrados = materia.grados_ids?.filter((id) =>
                gradosProfesor.includes(id)
              );
              const gradosNombresFiltrados = gradosIdsFiltrados?.map(
                (id) => gradosProfesorMap[id]
              );

              return {
                ...materia,
                grados_ids: gradosIdsFiltrados,
                grados_nombres: gradosNombresFiltrados,
              };
            });

          console.log("📚 Materias filtradas para profesor:", todasMaterias);
          console.log("🎓 Grados del profesor:", gradosProfesor);
        } catch (error) {
          console.error("Error al filtrar materias del profesor:", error);
        }
      }

      setMaterias(todasMaterias);
    } catch (error) {
      setMensaje("Error al cargar materias");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();

    if (!gradosSeleccionados || gradosSeleccionados.length === 0) {
      setMensaje("Debe seleccionar al menos un grado para la materia");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        services.materias,
        {
          nombre,
          descripcion,
          grados: gradosSeleccionados,
          creditos: creditos || null,
          horas_semanales: horasSemanales || null,
          categoria,
          nivel,
          prerequisitos,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setShowModal(false);
      setMensaje("Materia creada correctamente");
      fetchMaterias();
    } catch (error) {
      setMensaje(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear materia"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActualizar = async (id) => {
    if (!gradosSeleccionados || gradosSeleccionados.length === 0) {
      setMensaje("Debe seleccionar al menos un grado para la materia");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(
        services.materias + `/${id}`,
        {
          nombre,
          descripcion,
          grados: gradosSeleccionados,
          creditos: creditos || null,
          horas_semanales: horasSemanales || null,
          categoria,
          nivel,
          prerequisitos,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setShowModal(false);
      setMensaje("Materia actualizada correctamente");
      fetchMaterias();
    } catch (error) {
      setMensaje(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al actualizar materia"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Está seguro que desea eliminar esta materia?"))
      return;

    try {
      await api.delete(services.materias + `/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Materia eliminada correctamente");
      fetchMaterias();
    } catch (error) {
      setMensaje("Error al eliminar materia");
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setDescripcion("");
    setGradosSeleccionados([]);
    setCreditos("");
    setHorasSemanales("");
    setCategoria("");
    setNivel("");
    setPrerequisitos("");
    setEditId(null);
  };

  const handleEditarMateria = async (materia) => {
    setEditId(materia.id_materia);
    setNombre(materia.nombre);
    setDescripcion(materia.descripcion || "");
    setCreditos(materia.creditos || "");
    setHorasSemanales(materia.horas_semanales || "");
    setCategoria(materia.categoria || "");
    setNivel(materia.nivel || "");
    setPrerequisitos(materia.prerequisitos || "");

    // Usar los grados que ya vienen en el objeto materia desde obtenerMaterias
    if (materia.grados_ids && Array.isArray(materia.grados_ids)) {
      setGradosSeleccionados(materia.grados_ids);
    } else {
      // Si por alguna razón no vienen, cargarlos del endpoint
      try {
        const res = await api.get(
          `/api/materias/${materia.id_materia}/grados`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        const gradosIds = res.data.map((g) => g.id_grado);
        setGradosSeleccionados(gradosIds);
      } catch (error) {
        console.error("Error al cargar grados de la materia:", error);
        setGradosSeleccionados([]);
      }
    }

    setShowModal(true);
  };

  // Filtros y búsqueda
  const materiasFiltradas = materias.filter((materia) => {
    const matchesSearch =
      materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (materia.descripcion &&
        materia.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategoria =
      filterCategoria === "" || materia.categoria === filterCategoria;
    const matchesNivel = filterNivel === "" || materia.nivel === filterNivel;
    return matchesSearch && matchesCategoria && matchesNivel;
  });

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
    total: materias.length,
    categorias: [...new Set(materias.map((m) => m.categoria).filter(Boolean))]
      .length,
    niveles: [...new Set(materias.map((m) => m.nivel).filter(Boolean))].length,
    conPrerequisitos: materias.filter((m) => m.prerequisitos).length,
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
            Categorías: estadisticas.categorias,
            Niveles: estadisticas.niveles,
            "Con Prerequisitos": estadisticas.conPrerequisitos,
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
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-2xl text-center backdrop-blur-sm border ${
              mensaje.includes("correctamente")
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Barra de búsqueda y controles */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar materias por nombre o descripción..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="nombre">Ordenar por Nombre</option>
                <option value="categoria">Ordenar por Categoría</option>
                <option value="nivel">Ordenar por Nivel</option>
                <option value="creditos">Ordenar por Créditos</option>
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

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filtrar por Categoría
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    <option value="Ciencias">Ciencias</option>
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Humanidades">Humanidades</option>
                    <option value="Idiomas">Idiomas</option>
                    <option value="Arte">Arte</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Tecnología">Tecnología</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filtrar por Nivel
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                    value={filterNivel}
                    onChange={(e) => setFilterNivel(e.target.value)}
                  >
                    <option value="">Todos los niveles</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Bachillerato">Bachillerato</option>
                    <option value="Universidad">Universidad</option>
                  </select>
                </div>
              </div>
            </div>
          )}

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
          materias.length === 0 && (
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
                    {materia.categoria && (
                      <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white">
                        {materia.categoria}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-3 line-clamp-2">
                    {materia.nombre}
                  </h3>
                  {materia.grados_nombres &&
                    materia.grados_nombres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {materia.grados_nombres.map((grado, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-white/10 rounded-full text-xs text-white"
                          >
                            {grado}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6 space-y-4">
                  {materia.descripcion && (
                    <p className="text-gray-300 text-sm line-clamp-3">
                      {materia.descripcion}
                    </p>
                  )}

                  <div className="space-y-3">
                    {materia.nivel && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <AcademicCapIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">
                            Nivel Educativo
                          </p>
                          <p className="text-white text-sm font-medium">
                            {materia.nivel}
                          </p>
                        </div>
                      </div>
                    )}

                    {materia.creditos && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <span className="text-yellow-400 text-sm font-bold">
                            C
                          </span>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Créditos</p>
                          <p className="text-white text-sm font-medium">
                            {materia.creditos}
                          </p>
                        </div>
                      </div>
                    )}

                    {materia.horas_semanales && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">
                            Horas Semanales
                          </p>
                          <p className="text-white text-sm font-medium">
                            {materia.horas_semanales}h
                          </p>
                        </div>
                      </div>
                    )}

                    {materia.prerequisitos && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-sm">⚠</span>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Prerequisitos</p>
                          <p className="text-white text-sm font-medium line-clamp-1">
                            {materia.prerequisitos}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
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
                        onClick={() => handleEliminar(materia.id_materia)}
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
                      Categoría
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nivel
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Créditos
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Horas
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
                            <div className="text-sm text-gray-400 line-clamp-1">
                              {materia.descripcion || "Sin descripción"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                          {materia.categoria || "Sin categoría"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
                          {materia.nivel || "Sin nivel"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {materia.creditos || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {materia.horas_semanales
                          ? `${materia.horas_semanales}h`
                          : "-"}
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
                              onClick={() => handleEliminar(materia.id_materia)}
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
                        required
                      />
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Grados donde se imparte *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {grados.map((grado) => (
                          <label
                            key={grado.id_grado}
                            className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors duration-200"
                          >
                            <input
                              type="checkbox"
                              checked={gradosSeleccionados.includes(
                                grado.id_grado
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGradosSeleccionados([
                                    ...gradosSeleccionados,
                                    grado.id_grado,
                                  ]);
                                } else {
                                  setGradosSeleccionados(
                                    gradosSeleccionados.filter(
                                      (id) => id !== grado.id_grado
                                    )
                                  );
                                }
                              }}
                              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                            />
                            <span className="text-white text-sm">
                              {grado.nombre}
                            </span>
                          </label>
                        ))}
                      </div>
                      {gradosSeleccionados.length > 0 && (
                        <p className="text-sm text-purple-400 mt-2">
                          {gradosSeleccionados.length} grado(s) seleccionado(s)
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Categoría
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                      >
                        <option value="">Seleccionar categoría</option>
                        <option value="Ciencias">Ciencias</option>
                        <option value="Matemáticas">Matemáticas</option>
                        <option value="Humanidades">Humanidades</option>
                        <option value="Idiomas">Idiomas</option>
                        <option value="Arte">Arte</option>
                        <option value="Deportes">Deportes</option>
                        <option value="Tecnología">Tecnología</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nivel Educativo
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        value={nivel}
                        onChange={(e) => setNivel(e.target.value)}
                      >
                        <option value="">Seleccionar nivel</option>
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                        <option value="Bachillerato">Bachillerato</option>
                        <option value="Universidad">Universidad</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Información Académica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Información Académica
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Créditos
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 3"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={creditos}
                        onChange={(e) => setCreditos(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Horas Semanales
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Ej: 4"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={horasSemanales}
                        onChange={(e) => setHorasSemanales(e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Prerequisitos
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Álgebra Básica, Geometría"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={prerequisitos}
                        onChange={(e) => setPrerequisitos(e.target.value)}
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
    </div>
  );
}

export default MateriasPage;
