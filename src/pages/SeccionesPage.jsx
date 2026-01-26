import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import Toast from "../components/Toast";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  Squares2X2Icon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";

function SeccionesPage() {
  // Estados principales
  const [secciones, setSecciones] = useState([]);
  const [grados, setGrados] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [escuela, setEscuela] = useState(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    id_grado: "",
    id_profesor_guia: "",
  });
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [seccionesDelGrado, setSeccionesDelGrado] = useState([]);
  const [sugerenciasNombres, setSugerenciasNombres] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("groups");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchSecciones(), fetchUser()]);
    } catch (error) {
      console.error("Error inicializando datos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos complementarios cuando se abre el modal
  useEffect(() => {
    if (showModal) {
      fetchGrados();
      fetchProfesores();
    }
    // eslint-disable-next-line
  }, [showModal]);

  // Cargar secciones existentes cuando se selecciona un grado
  useEffect(() => {
    if (formData.id_grado && showModal && !editId) {
      fetchSeccionesDelGrado(formData.id_grado);
    }
    // eslint-disable-next-line
  }, [formData.id_grado, showModal, editId]);

  const fetchGrados = async () => {
    try {
      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });
      // El backend puede devolver {success: true, data: [...]} o directamente [...]
      const data = res.data?.data || res.data || [];
      const gradosArray = Array.isArray(data) ? data : [];
      setGrados(gradosArray);
      if (gradosArray.length > 0 && !formData.id_grado) {
        setFormData((prev) => ({...prev, id_grado: gradosArray[0].id_grado}));
      }
    } catch (error) {
      console.error("Error al cargar grados:", error);
      showToast("Error al cargar grados", "error");
      setGrados([]);
    }
  };

  const fetchProfesores = async () => {
    try {
      const res = await api.get(services.profesores, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = res.data?.data || res.data || [];
      setProfesores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar profesores:", error);
      showToast("Error al cargar profesores", "error");
      setProfesores([]);
    }
  };

  const fetchSeccionesDelGrado = async (gradoId) => {
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      // Filtrar por grado en el frontend
      const seccionesFiltradas = (res.data?.data || res.data || []).filter(
        (s) => s.id_grado === parseInt(gradoId)
      );
      setSeccionesDelGrado(seccionesFiltradas);

      // Generar sugerencias de nombres
      const nombresUsados = seccionesFiltradas.map((s) =>
        s.nombre?.toUpperCase().trim()
      );
      const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
      const sugerencias = letras.filter(
        (letra) => !nombresUsados.includes(letra)
      );
      setSugerenciasNombres(sugerencias);
    } catch (error) {
      console.error("Error al cargar secciones del grado:", error);
      setSeccionesDelGrado([]);
      setSugerenciasNombres(["A", "B", "C", "D", "E"]);
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
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      // El backend puede devolver {success: true, data: [...]} o directamente [...]
      const data = res.data?.data || res.data || [];
      setSecciones(data);
    } catch (err) {
      console.error("Error al cargar secciones:", err);
      showToast("Error al cargar secciones", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.id_grado) {
      showToast("Por favor completa todos los campos requeridos", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        id_grado: parseInt(formData.id_grado),
        id_profesor_guia: formData.id_profesor_guia || null,
      };

      if (editId) {
        await api.put(`${services.secciones}/${editId}`, payload, {
          headers: {Authorization: `Bearer ${token}`},
        });
        showToast("✅ Sección actualizada correctamente", "success");
      } else {
        await api.post(services.secciones, payload, {
          headers: {Authorization: `Bearer ${token}`},
        });
        showToast("✅ Sección creada correctamente", "success");
      }

      limpiarFormulario();
      setShowModal(false);
      fetchSecciones();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.mensaje ||
        err.response?.data?.error ||
        `Error al ${editId ? "actualizar" : "crear"} sección`;
      showToast(errorMsg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: "",
      id_grado: "",
      id_profesor_guia: "",
    });
    setEditId(null);
    setSeccionesDelGrado([]);
    setSugerenciasNombres([]);
  };

  const handleEdit = (seccion) => {
    setEditId(seccion.id_seccion);
    setFormData({
      nombre: seccion.nombre || "",
      id_grado: seccion.id_grado || "",
      id_profesor_guia: seccion.id_profesor_guia || "",
    });
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar esta sección? Esta acción no se puede deshacer."
      )
    )
      return;
    try {
      await api.delete(`${services.secciones}/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      showToast("✅ Sección eliminada correctamente", "success");
      fetchSecciones();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error al eliminar sección";
      showToast(errorMsg, "error");
    }
  };

  // Filtros y búsqueda
  const seccionesFiltradas = secciones.filter((seccion) => {
    const matchesSearch =
      (seccion.nombre &&
        seccion.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (seccion.grado_nombre &&
        seccion.grado_nombre
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (seccion.profesor_guia_nombre &&
        seccion.profesor_guia_nombre
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
        nombre_grado: seccion.grado_nombre || "Sin grado",
        secciones: [],
      };
    }
    acc[key].secciones.push(seccion);
    return acc;
  }, {});

  // Estadísticas
  const estadisticas = {
    total: secciones.length,
    estudiantes: secciones.reduce((sum, s) => {
      const valor = s.estudiantes_inscritos ?? 0;
      const numero = Number(valor);
      return sum + (Number.isNaN(numero) ? 0 : numero);
    }, 0),
    grados: [...new Set(secciones.map((s) => s.id_grado).filter(Boolean))]
      .length,
    grupos: Object.keys(seccionesPorGrado).length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
            "Total Estudiantes": estadisticas.estudiantes,
            Grados: estadisticas.grados,
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
                    {(Array.isArray(grados) ? grados : []).map((grado) => (
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
                        {grupo.secciones.reduce(
                          (sum, s) => sum + (s.estudiantes_inscritos || 0),
                          0
                        )}{" "}
                        estudiantes inscritos
                      </p>
                    </div>

                    {/* Lista de secciones */}
                    <div className="p-6">
                      <div className="space-y-3">
                        {grupo.secciones.map((seccion) => (
                          <div
                            key={seccion.id_seccion}
                            className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors duration-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                                  <span className="text-teal-400 font-bold">
                                    {seccion.nombre}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-semibold">
                                    Sección {seccion.nombre}
                                  </p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                                    <UsersIcon className="w-3 h-3" />
                                    <span>
                                      {seccion.estudiantes_inscritos || 0}{" "}
                                      estudiante
                                      {seccion.estudiantes_inscritos !== 1
                                        ? "s"
                                        : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEdit(seccion)}
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
                            {/* Profesor guía */}
                            {seccion.profesor_guia_nombre &&
                              seccion.profesor_guia_nombre !==
                                "No asignado" && (
                                <div className="flex items-center space-x-2 text-sm text-gray-300 bg-gray-600/50 p-2 rounded">
                                  <UserIcon className="w-4 h-4 text-emerald-400" />
                                  <span className="text-gray-400">
                                    Profesor Guía:
                                  </span>
                                  <span className="font-medium">
                                    {seccion.profesor_guia_nombre}
                                  </span>
                                </div>
                              )}
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
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-5 relative">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                      <div className="flex items-center justify-between mb-3">
                        <UserGroupIcon className="w-7 h-7 text-white" />
                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-medium">
                          <UsersIcon className="w-3 h-3 inline mr-1" />
                          {seccion.estudiantes_inscritos || 0}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Sección {seccion.nombre}
                      </h3>
                      <p className="text-cyan-100 text-sm">
                        {seccion.grado_nombre || "Sin grado"}
                      </p>
                    </div>

                    {/* Contenido de la tarjeta */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <AcademicCapIcon className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs">Grado</p>
                          <p className="text-white text-sm font-semibold">
                            {seccion.grado_nombre || "Sin grado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-emerald-500/20 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs">Profesor Guía</p>
                          <p className="text-white text-sm font-semibold line-clamp-1">
                            {seccion.profesor_guia_nombre || "No asignado"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-9 h-9 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs">Estudiantes</p>
                          <p className="text-white text-sm font-semibold">
                            {seccion.estudiantes_inscritos || 0} inscritos
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="bg-gray-700 px-4 py-3 flex justify-between items-center">
                      <button
                        onClick={() => handleEdit(seccion)}
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

              <form onSubmit={handleSubmit} className="p-8 space-y-8">
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
                  <div className="space-y-4">
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
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({...formData, nombre: e.target.value})
                        }
                        required
                      />

                      {/* Sugerencias de nombres disponibles */}
                      {!editId && sugerenciasNombres.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-400 mb-2">
                            Nombres disponibles (clic para usar):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {sugerenciasNombres.slice(0, 5).map((letra) => (
                              <button
                                key={letra}
                                type="button"
                                onClick={() =>
                                  setFormData({...formData, nombre: letra})
                                }
                                className="px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 rounded-lg text-sm font-medium transition-all duration-200 border border-teal-500/30"
                              >
                                {letra}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Advertencia si no hay sugerencias */}
                      {!editId &&
                        sugerenciasNombres.length === 0 &&
                        seccionesDelGrado.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                            <p className="text-xs text-yellow-300">
                              ⚠️ Ya se usaron las letras A-J. Considera usar
                              números (1, 2, 3) o combinaciones (A1, B1).
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </section>

                {/* Información Académica */}
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
                        value={formData.id_grado}
                        onChange={(e) =>
                          setFormData({...formData, id_grado: e.target.value})
                        }
                        required
                        disabled={editId}
                      >
                        <option value="">Seleccionar grado</option>
                        {(Array.isArray(grados) ? grados : []).map((g) => (
                          <option key={g.id_grado} value={g.id_grado}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                      {editId && (
                        <p className="text-xs text-gray-400 mt-1">
                          El grado no se puede cambiar después de crear la
                          sección
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profesor Guía (opcional)
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        value={formData.id_profesor_guia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_profesor_guia: e.target.value,
                          })
                        }
                      >
                        <option value="">Sin profesor guía</option>
                        {profesores.map((p) => (
                          <option
                            key={p.id_profesor || p.id_usuario}
                            value={p.id_profesor || p.id_usuario}
                          >
                            {p.nombre} {p.apellido}
                            {p.especialidad && ` - ${p.especialidad}`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        El profesor guía será el tutor principal de esta sección
                      </p>
                    </div>

                    {/* Mostrar secciones existentes del grado */}
                    {!editId && seccionesDelGrado.length > 0 && (
                      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <p className="text-sm font-semibold text-blue-300 mb-2">
                          📋 Secciones ya registradas en este grado:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {seccionesDelGrado.map((seccion) => (
                            <span
                              key={seccion.id_seccion}
                              className="px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-sm font-medium border border-blue-500/40"
                            >
                              {seccion.nombre}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          Asegúrate de no duplicar nombres de secciones
                        </p>
                      </div>
                    )}
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
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        {editId ? "Actualizar Sección" : "Crear Sección"}
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast de notificaciones */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToast({show: false, message: "", type: "success"})
            }
          />
        )}
      </div>
    </div>
  );
}

export default SeccionesPage;
