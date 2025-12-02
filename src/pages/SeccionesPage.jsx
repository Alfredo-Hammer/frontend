import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";

function SeccionesPage() {
  const [secciones, setSecciones] = useState([]);
  const [grados, setGrados] = useState([]);
  const [id_grado, setIdGrado] = useState("");
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Nuevos estados para funcionalidades adicionales
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("groups"); // "groups" o "cards"
  const [escuela, setEscuela] = useState(null);

  const token = localStorage.getItem("token");
  let id_profesor = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      id_profesor = payload.id_usuario;
    } catch {}
  }

  useEffect(() => {
    fetchSecciones();
    fetchUser();
    // eslint-disable-next-line
  }, []);

  // Cargar grados cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      fetchGrados();
    }
    // eslint-disable-next-line
  }, [showModal]);

  const fetchGrados = async () => {
    try {
      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(res.data);
      if (res.data.length > 0) setIdGrado(res.data[0].id_grado);
    } catch {
      setMensaje("Error al cargar grados");
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar datos de escuela:", error);
    }
  };

  const fetchSecciones = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setSecciones(res.data);
    } catch (err) {
      setMensaje("Error al cargar secciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !id_grado) return;

    setIsSubmitting(true);
    try {
      await api.post(
        services.secciones,
        {nombre, id_profesor, id_grado},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setMensaje("Sección creada correctamente");
      setShowModal(false);
      fetchSecciones();
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al crear sección");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditar = async (id) => {
    setIsSubmitting(true);
    try {
      await api.put(
        services.secciones + `/${id}`,
        {nombre: editNombre},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setEditId(null);
      setEditNombre("");
      setMensaje("Sección editada correctamente");
      setShowModal(false);
      fetchSecciones();
    } catch (err) {
      setMensaje("Error al editar sección");
    } finally {
      setIsSubmitting(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setEditId(null);
    setEditNombre("");
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta sección?")) return;
    try {
      await api.delete(services.secciones + `/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Sección eliminada correctamente");
      fetchSecciones();
    } catch (err) {
      setMensaje("Error al eliminar sección");
    }
  };

  // Filtros y búsqueda
  const seccionesFiltradas = secciones.filter((seccion) => {
    const matchesSearch =
      (seccion.nombre_seccion &&
        seccion.nombre_seccion
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (seccion.nombre_grado &&
        seccion.nombre_grado
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (seccion.nombre_escuela &&
        seccion.nombre_escuela
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesGrado =
      filterGrado === "" || seccion.id_grado === parseInt(filterGrado);
    return matchesSearch && matchesGrado;
  });

  // Agrupa las secciones filtradas por grado
  const seccionesPorGrado = seccionesFiltradas.reduce((acc, seccion) => {
    const key = seccion.id_grado;
    if (!acc[key]) {
      acc[key] = {
        id_grado: seccion.id_grado,
        nombre_grado: seccion.nombre_grado,
        nombre_escuela: seccion.nombre_escuela,
        secciones: [],
      };
    }
    acc[key].secciones.push(seccion);
    return acc;
  }, {});

  // Estadísticas
  const estadisticas = {
    total: secciones.length,
    grados: [...new Set(secciones.map((s) => s.id_grado).filter(Boolean))]
      .length,
    grupos: Object.keys(seccionesPorGrado).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header Moderno y Compacto */}
      <PageHeader
        title="Gestión de Secciones"
        subtitle="Organiza y administra las secciones académicas por grado y escuela"
        icon={UserGroupIcon}
        gradientFrom="cyan-600"
        gradientTo="teal-600"
        badge="Organización Estudiantil"
        schoolLogo={
          escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
        }
        schoolName={escuela?.nombre}
        stats={{
          "Total Secciones": estadisticas.total,
          Grados: estadisticas.grados,
          Grupos: estadisticas.grupos,
        }}
        actions={
          <>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-white text-cyan-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nueva Sección</span>
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-white/10 text-white rounded-xl font-semibold backdrop-blur-sm hover:bg-white/20 transition-all duration-200 flex items-center space-x-2"
            >
              <Squares2X2Icon className="w-5 h-5" />
              <span>{showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}</span>
            </button>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-6">
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
                placeholder="Buscar secciones por nombre o grado..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex bg-gray-700 rounded-xl p-1">
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "groups"
                      ? "bg-teal-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("groups")}
                  title="Vista por grupos"
                >
                  <UserGroupIcon className="w-5 h-5" />
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "cards"
                      ? "bg-teal-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("cards")}
                  title="Vista de tarjetas"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Filtrar por Grado
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-700 text-white"
                    value={filterGrado}
                    onChange={(e) => setFilterGrado(e.target.value)}
                  >
                    <option value="">Todos los grados</option>
                    {grados.map((grado) => (
                      <option key={grado.id_grado} value={grado.id_grado}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                Mostrando {seccionesFiltradas.length} de {secciones.length}{" "}
                secciones
              </div>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando secciones...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          seccionesFiltradas.length === 0 &&
          secciones.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">👥</div>
              <h2 className="text-2xl font-bold text-gray-300 mb-4">
                No hay secciones registradas
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Comienza creando la primera sección para organizar tus grupos de
                estudiantes.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2 inline" />
                Crear Primera Sección
              </button>
            </div>
          )}

        {/* Filtered empty state */}
        {!isLoading &&
          seccionesFiltradas.length === 0 &&
          secciones.length > 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No se encontraron secciones
              </h3>
              <p className="text-gray-400">
                Intenta modificar los filtros de búsqueda
              </p>
            </div>
          )}

        {/* Vista por grupos */}
        {!isLoading &&
          seccionesFiltradas.length > 0 &&
          viewMode === "groups" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-2 text-teal-400" />
                  Secciones por Grado
                </h3>
                <div className="text-sm text-gray-400">
                  {Object.keys(seccionesPorGrado).length} grupo
                  {Object.keys(seccionesPorGrado).length !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.values(seccionesPorGrado).map((grupo) => (
                  <div
                    key={grupo.id_grado}
                    className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 hover:border-teal-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                  >
                    {/* Header del grupo */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 relative">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                      <div className="flex items-center justify-between">
                        <AcademicCapIcon className="w-8 h-8 text-white" />
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                          {grupo.secciones.length} sección
                          {grupo.secciones.length !== 1 ? "es" : ""}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-white mt-3">
                        {grupo.nombre_grado}
                      </h4>
                      <p className="text-teal-100 text-sm">
                        {grupo.nombre_escuela}
                      </p>
                    </div>

                    {/* Lista de secciones */}
                    <div className="p-6">
                      <div className="space-y-3">
                        {grupo.secciones.map((seccion) => (
                          <div
                            key={seccion.id_seccion}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                                <span className="text-teal-400 font-bold text-sm">
                                  {seccion.nombre_seccion}
                                </span>
                              </div>
                              <div>
                                <p className="text-white font-medium">
                                  Sección {seccion.nombre_seccion}
                                </p>
                                <p className="text-gray-400 text-xs">
                                  ID: {seccion.id_seccion}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setEditId(seccion.id_seccion);
                                  setEditNombre(seccion.nombre_seccion);
                                  setShowModal(true);
                                }}
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
                                  handleEliminar(seccion.id_seccion)
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
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Vista de tarjetas individuales */}
        {!isLoading &&
          seccionesFiltradas.length > 0 &&
          viewMode === "cards" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Squares2X2Icon className="w-6 h-6 mr-2 text-teal-400" />
                  Todas las Secciones
                </h3>
                <div className="text-sm text-gray-400">
                  {seccionesFiltradas.length} sección
                  {seccionesFiltradas.length !== 1 ? "es" : ""}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {seccionesFiltradas.map((seccion) => (
                  <div
                    key={seccion.id_seccion}
                    className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-teal-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
                  >
                    {/* Header de la tarjeta */}
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-4 relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                      <div className="flex items-center justify-between">
                        <UserGroupIcon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Sección {seccion.nombre_seccion}
                      </h3>
                    </div>

                    {/* Contenido de la tarjeta */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <AcademicCapIcon className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Grado</p>
                          <p className="text-white text-sm font-medium">
                            {seccion.nombre_grado || "Sin grado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <BuildingOfficeIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Escuela</p>
                          <p className="text-white text-sm font-medium line-clamp-1">
                            {seccion.nombre_escuela || "Sin escuela"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="bg-gray-700 px-4 py-3 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setEditId(seccion.id_seccion);
                          setEditNombre(seccion.nombre_seccion);
                          setShowModal(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
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
                        <span className="text-sm">Editar</span>
                      </button>
                      <button
                        onClick={() => handleEliminar(seccion.id_seccion)}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Modal para crear/editar sección */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div
                className={`sticky top-0 px-8 py-6 rounded-t-3xl ${
                  editId
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editId ? "Editar Sección" : "Crear Nueva Sección"}
                    </h3>
                    <p
                      className={`text-sm ${
                        editId ? "text-yellow-100" : "text-teal-100"
                      }`}
                    >
                      {editId
                        ? "Modifica la información de la sección"
                        : "Agrega una nueva sección al grado"}
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
                onSubmit={
                  editId
                    ? (e) => {
                        e.preventDefault();
                        handleEditar(editId);
                      }
                    : handleCrear
                }
                className="p-8 space-y-8"
              >
                {/* Información Básica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                        editId ? "bg-yellow-500/20" : "bg-teal-500/20"
                      }`}
                    >
                      <UserGroupIcon
                        className={`w-5 h-5 ${
                          editId ? "text-yellow-400" : "text-teal-400"
                        }`}
                      />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Información de la Sección
                    </h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre de la Sección *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: A, B, 1, 2, etc."
                      className={`w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                        editId
                          ? "focus:ring-yellow-500 focus:border-yellow-500"
                          : "focus:ring-teal-500 focus:border-teal-500"
                      }`}
                      value={editId ? editNombre : nombre}
                      onChange={(e) =>
                        editId
                          ? setEditNombre(e.target.value)
                          : setNombre(e.target.value)
                      }
                      required
                    />
                  </div>
                </section>

                {/* Información Académica - Solo para crear */}
                {!editId && (
                  <section>
                    <div className="flex items-center mb-6">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3">
                        <AcademicCapIcon className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h4 className="text-xl font-bold text-white">
                        Ubicación Académica
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Grado *
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          value={id_grado}
                          onChange={(e) => setIdGrado(e.target.value)}
                          required
                        >
                          <option value="">Seleccionar grado</option>
                          {grados.map((g) => (
                            <option key={g.id_grado} value={g.id_grado}>
                              {g.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </section>
                )}

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
                    className={`px-6 py-3 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                      isSubmitting
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105 hover:shadow-xl"
                    } ${
                      editId
                        ? "bg-gradient-to-r from-yellow-600 to-orange-600"
                        : "bg-gradient-to-r from-teal-600 to-emerald-600"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {editId ? "Guardando..." : "Creando..."}
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
                        {editId ? "Guardar Cambios" : "Crear Sección"}
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

export default SeccionesPage;
