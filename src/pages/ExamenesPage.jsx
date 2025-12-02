import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";

function ExamenesPage() {
  const [examenes, setExamenes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEvaluarModal, setShowEvaluarModal] = useState(false);
  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [alumnosExamen, setAlumnosExamen] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [editId, setEditId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterMateria, setFilterMateria] = useState("");
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total_examenes: 0,
    activos: 0,
    finalizados: 0,
    parciales: 0,
    finales: 0,
    materias_con_examenes: 0,
  });

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    id_materia: "",
    id_grado: "",
    id_seccion: "",
    id_profesor: "",
    fecha_examen: "",
    duracion_minutos: 60,
    puntaje_total: 100,
    tipo_examen: "parcial",
    estado: "borrador",
    bimestre: "",
  });

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const canEdit =
    user &&
    ["admin", "administrador", "director", "profesor"].includes(
      user.rol?.toLowerCase()
    );

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchGrados();
      fetchMaterias();
      fetchProfesores();
      fetchExamenes();
      fetchEstadisticas();
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor,
      });

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

  const fetchExamenes = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/examenes", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setExamenes(res.data);
    } catch (error) {
      console.error("Error al cargar exámenes:", error);
      setMensaje("Error al cargar exámenes");
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const res = await api.get("/api/examenes/estadisticas/general", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setEstadisticas(res.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const fetchGrados = async () => {
    try {
      const esProfesor = user?.rol?.toLowerCase() === "profesor";

      if (esProfesor && user?.id_profesor) {
        // Si es profesor, cargar sus grados y secciones asignadas
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/asignaciones`,
          {headers: {Authorization: `Bearer ${token}`}}
        );

        const asignacionesData = asignacionesRes.data.asignaciones || [];

        // Extraer grados únicos con su información completa
        const gradosUnicos = [];
        const gradosIds = new Set();

        asignacionesData.forEach((asig) => {
          if (!gradosIds.has(asig.id_grado)) {
            gradosIds.add(asig.id_grado);
            gradosUnicos.push({
              id_grado: asig.id_grado,
              nombre: asig.nombre_grado || `Grado ${asig.id_grado}`,
            });
          }
        });

        setGrados(gradosUnicos);

        // Extraer todas las secciones asignadas
        const seccionesAsignadas = asignacionesData.map((asig) => ({
          id_seccion: asig.id_seccion,
          nombre: asig.nombre_seccion || `Sección ${asig.id_seccion}`,
          id_grado: asig.id_grado,
        }));

        setSecciones(seccionesAsignadas);
      } else {
        // Para admin/director, cargar todos los grados y secciones
        const gradosRes = await api.get("/api/grados", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setGrados(gradosRes.data);

        const seccionesRes = await api.get("/api/secciones", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setSecciones(seccionesRes.data);
      }
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  };

  const fetchMaterias = async () => {
    try {
      const res = await api.get("/api/materias", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMaterias(res.data);
    } catch (error) {
      console.error("Error al cargar materias:", error);
    }
  };

  const fetchProfesores = async () => {
    try {
      const res = await api.get("/api/profesores", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setProfesores(res.data);
    } catch (error) {
      console.error("Error al cargar profesores:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Si es profesor, asignar automáticamente su id_profesor
      const dataToSend = {...formData};
      if (user?.rol?.toLowerCase() === "profesor" && user?.id_profesor) {
        dataToSend.id_profesor = user.id_profesor;
      }

      if (editId) {
        await api.put(`/api/examenes/${editId}`, dataToSend, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setMensaje("Examen actualizado correctamente");
      } else {
        await api.post("/api/examenes", dataToSend, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setMensaje("Examen creado correctamente");
      }

      fetchExamenes();
      fetchEstadisticas();
      setShowModal(false);
      resetForm();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al guardar examen:", error);
      setMensaje("Error al guardar examen");
    }
  };

  const handleEdit = (examen) => {
    setEditId(examen.id_examen);
    setFormData({
      titulo: examen.titulo,
      descripcion: examen.descripcion || "",
      id_materia: examen.id_materia,
      id_grado: examen.id_grado,
      id_seccion: examen.id_seccion || "",
      id_profesor: examen.id_profesor || "",
      fecha_examen: examen.fecha_examen
        ? examen.fecha_examen.substring(0, 16)
        : "",
      duracion_minutos: examen.duracion_minutos,
      puntaje_total: examen.puntaje_total,
      tipo_examen: examen.tipo_examen,
      estado: examen.estado,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este examen?")) return;

    try {
      await api.delete(`/api/examenes/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Examen eliminado correctamente");
      fetchExamenes();
      fetchEstadisticas();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al eliminar examen:", error);
      setMensaje("Error al eliminar examen");
    }
  };

  const handleEvaluar = async (examen) => {
    setExamenSeleccionado(examen);
    setShowEvaluarModal(true);
    setLoadingAlumnos(true);

    try {
      const res = await api.get(`/api/examenes/${examen.id_examen}/alumnos`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAlumnosExamen(res.data);
    } catch (error) {
      console.error("Error al cargar alumnos:", error);
      setMensaje("Error al cargar alumnos del examen");
    } finally {
      setLoadingAlumnos(false);
    }
  };

  const handleGuardarNotas = async () => {
    try {
      const notas = alumnosExamen.map((alumno) => ({
        id_estudiante: alumno.id_estudiante,
        puntaje_obtenido: alumno.puntaje_obtenido || 0,
        observaciones: alumno.observaciones || "",
      }));

      await api.post(
        `/api/examenes/${examenSeleccionado.id_examen}/evaluar`,
        {notas},
        {headers: {Authorization: `Bearer ${token}`}}
      );

      setMensaje("Notas guardadas correctamente");
      setShowEvaluarModal(false);
      setExamenSeleccionado(null);
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al guardar notas:", error);
      setMensaje("Error al guardar notas");
    }
  };

  const handleNotaChange = (index, valor) => {
    const nuevosAlumnos = [...alumnosExamen];
    let puntaje = parseFloat(valor) || 0;

    // Validar rango 0-100 (sin mínimo de 40 porque son notas acumulativas)
    if (puntaje < 0) {
      puntaje = 0;
    }

    if (puntaje > 100) {
      puntaje = 100;
    }

    if (puntaje > examenSeleccionado.puntaje_total) {
      return;
    }

    nuevosAlumnos[index].puntaje_obtenido = puntaje;
    setAlumnosExamen(nuevosAlumnos);
  };

  const handleObservacionChange = (index, valor) => {
    const nuevosAlumnos = [...alumnosExamen];
    nuevosAlumnos[index].observaciones = valor;
    setAlumnosExamen(nuevosAlumnos);
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      id_materia: "",
      id_grado: "",
      id_seccion: "",
      id_profesor: "",
      fecha_examen: "",
      duracion_minutos: 60,
      puntaje_total: 100,
      tipo_examen: "parcial",
      estado: "borrador",
    });
    setEditId(null);
  };

  const examenesFiltrados = examenes.filter((examen) => {
    const matchSearch =
      examen.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      examen.nombre_materia?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = !filterTipo || examen.tipo_examen === filterTipo;
    const matchEstado = !filterEstado || examen.estado === filterEstado;
    const matchMateria =
      !filterMateria || examen.id_materia === parseInt(filterMateria);

    return matchSearch && matchTipo && matchEstado && matchMateria;
  });

  const getTipoColor = (tipo) => {
    const colores = {
      diagnostico: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      parcial: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      final: "bg-red-500/20 text-red-300 border-red-500/30",
      recuperacion: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      extraordinario: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    };
    return colores[tipo] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  const getEstadoColor = (estado) => {
    const colores = {
      borrador: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      activo: "bg-green-500/20 text-green-300 border-green-500/30",
      en_progreso: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      finalizado: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      cancelado: "bg-red-500/20 text-red-300 border-red-500/30",
    };
    return colores[estado] || "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto px-6">
        <PageHeader
          title="Gestión de Exámenes"
          subtitle="Administra y organiza los exámenes del sistema educativo"
          icon={DocumentTextIcon}
          gradientFrom="cyan-600"
          gradientTo="blue-600"
          badge="Evaluaciones"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={{
            "Total Exámenes": estadisticas.total_examenes,
            Activos: estadisticas.activos,
            Finalizados: estadisticas.finalizados,
            Materias: estadisticas.materias_con_examenes,
          }}
          actions={
            canEdit && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-white text-cyan-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Crear Examen</span>
              </button>
            )
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

        {/* Filtros y búsqueda */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar exámenes..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todos los tipos</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="parcial">Parcial</option>
              <option value="final">Final</option>
              <option value="recuperacion">Recuperación</option>
              <option value="extraordinario">Extraordinario</option>
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="en_progreso">En Progreso</option>
              <option value="finalizado">Finalizado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={filterMateria}
              onChange={(e) => setFilterMateria(e.target.value)}
              className="px-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Todas las materias</option>
              {materias.map((materia) => (
                <option key={materia.id_materia} value={materia.id_materia}>
                  {materia.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de exámenes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            <p className="text-gray-400 mt-4">Cargando exámenes...</p>
          </div>
        ) : examenesFiltrados.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-700">
            <DocumentTextIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No hay exámenes
            </h3>
            <p className="text-gray-400">
              {searchTerm || filterTipo || filterEstado || filterMateria
                ? "No se encontraron exámenes con los filtros aplicados"
                : "Comienza creando tu primer examen"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {examenesFiltrados.map((examen) => (
              <div
                key={examen.id_examen}
                className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 hover:border-cyan-500 transition-all duration-300 overflow-hidden group"
              >
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">
                        {examen.titulo}
                      </h3>
                      <p className="text-cyan-100 text-sm">
                        {examen.nombre_materia}
                      </p>
                    </div>
                    <DocumentTextIcon className="w-8 h-8 text-white/50" />
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Badges de tipo y estado */}
                  <div className="flex gap-2 flex-wrap">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${getTipoColor(
                        examen.tipo_examen
                      )}`}
                    >
                      {examen.tipo_examen}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium border ${getEstadoColor(
                        examen.estado
                      )}`}
                    >
                      {examen.estado}
                    </span>
                  </div>

                  {/* Información */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-300">
                      <AcademicCapIcon className="w-4 h-4 mr-2 text-cyan-400" />
                      <span>
                        {examen.nombre_grado} -{" "}
                        {examen.nombre_seccion || "Todas"}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <CalendarIcon className="w-4 h-4 mr-2 text-cyan-400" />
                      <span>
                        {new Date(examen.fecha_examen).toLocaleDateString(
                          "es-ES",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <ClockIcon className="w-4 h-4 mr-2 text-cyan-400" />
                      <span>{examen.duracion_minutos} minutos</span>
                    </div>
                    <div className="flex items-center text-gray-300">
                      <CheckCircleIcon className="w-4 h-4 mr-2 text-cyan-400" />
                      <span>Puntaje: {examen.puntaje_total} pts</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  {examen.descripcion && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {examen.descripcion}
                    </p>
                  )}

                  {/* Acciones */}
                  {canEdit && (
                    <div className="flex gap-2 pt-3 border-t border-gray-700">
                      {(examen.estado === "activo" ||
                        examen.estado === "finalizado") && (
                        <button
                          onClick={() => handleEvaluar(examen)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="text-sm">Evaluar</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(examen)}
                        className="flex-1 px-3 py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        <span className="text-sm">Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(examen.id_examen)}
                        className="px-3 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de crear/editar */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-3xl">
                <h2 className="text-2xl font-bold text-white">
                  {editId ? "Editar Examen" : "Crear Nuevo Examen"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Título del Examen *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({...formData, titulo: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows="3"
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({...formData, descripcion: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Grado *
                    </label>
                    <select
                      required
                      value={formData.id_grado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          id_grado: e.target.value,
                          id_seccion: "",
                          id_materia: "",
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Seleccionar grado</option>
                      {grados.map((grado) => (
                        <option key={grado.id_grado} value={grado.id_grado}>
                          {grado.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sección *
                    </label>
                    <select
                      required
                      value={formData.id_seccion}
                      onChange={(e) =>
                        setFormData({...formData, id_seccion: e.target.value})
                      }
                      disabled={!formData.id_grado}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar sección</option>
                      {secciones
                        .filter(
                          (seccion) =>
                            seccion.id_grado === parseInt(formData.id_grado)
                        )
                        .map((seccion) => (
                          <option
                            key={seccion.id_seccion}
                            value={seccion.id_seccion}
                          >
                            {seccion.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Materia *
                    </label>
                    <select
                      required
                      value={formData.id_materia}
                      onChange={(e) =>
                        setFormData({...formData, id_materia: e.target.value})
                      }
                      disabled={!formData.id_grado}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccionar materia</option>
                      {materias
                        .filter(
                          (materia) =>
                            !formData.id_grado ||
                            (materia.grados_ids &&
                              materia.grados_ids.includes(
                                parseInt(formData.id_grado)
                              ))
                        )
                        .map((materia) => (
                          <option
                            key={materia.id_materia}
                            value={materia.id_materia}
                          >
                            {materia.nombre}
                          </option>
                        ))}
                    </select>
                  </div>

                  {user?.rol?.toLowerCase() !== "profesor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profesor *
                      </label>
                      <select
                        required
                        value={formData.id_profesor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            id_profesor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Seleccionar profesor</option>
                        {profesores.map((profesor) => (
                          <option
                            key={profesor.id_profesor}
                            value={profesor.id_profesor}
                          >
                            {profesor.nombre} {profesor.apellido}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha y Hora *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.fecha_examen}
                      onChange={(e) =>
                        setFormData({...formData, fecha_examen: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Duración (minutos) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duracion_minutos}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duracion_minutos: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bimestre *
                    </label>
                    <select
                      required
                      value={formData.bimestre}
                      onChange={(e) =>
                        setFormData({...formData, bimestre: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Seleccionar bimestre</option>
                      <option value="1">I Bimestre</option>
                      <option value="2">II Bimestre</option>
                      <option value="3">III Bimestre</option>
                      <option value="4">IV Bimestre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Puntaje Total *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.puntaje_total}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          puntaje_total: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Examen *
                    </label>
                    <select
                      required
                      value={formData.tipo_examen}
                      onChange={(e) =>
                        setFormData({...formData, tipo_examen: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="diagnostico">Diagnóstico</option>
                      <option value="parcial">Parcial</option>
                      <option value="final">Final</option>
                      <option value="recuperacion">Recuperación</option>
                      <option value="extraordinario">Extraordinario</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Estado *
                    </label>
                    <select
                      required
                      value={formData.estado}
                      onChange={(e) =>
                        setFormData({...formData, estado: e.target.value})
                      }
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="activo">Activo</option>
                      <option value="en_progreso">En Progreso</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors font-semibold"
                  >
                    {editId ? "Actualizar" : "Crear"} Examen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Evaluación */}
        {showEvaluarModal && examenSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
              {/* Header del Modal */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Evaluar Examen
                  </h2>
                  <p className="text-green-100 text-sm mt-1">
                    {examenSeleccionado.titulo}
                  </p>
                  <p className="text-green-100 text-xs mt-1">
                    {examenSeleccionado.nombre_grado} -{" "}
                    {examenSeleccionado.nombre_seccion} | Puntaje Total:{" "}
                    {examenSeleccionado.puntaje_total} pts
                  </p>
                  <div className="mt-2 flex gap-2 flex-wrap text-xs">
                    <span className="bg-green-800 px-2 py-1 rounded">
                      AI: 40-59
                    </span>
                    <span className="bg-yellow-600 px-2 py-1 rounded">
                      AF: 60-75
                    </span>
                    <span className="bg-blue-600 px-2 py-1 rounded">
                      AS: 76-89
                    </span>
                    <span className="bg-purple-600 px-2 py-1 rounded">
                      AA: 90-100
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEvaluarModal(false);
                    setExamenSeleccionado(null);
                  }}
                  className="text-white hover:text-gray-200"
                >
                  <XCircleIcon className="w-8 h-8" />
                </button>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto p-6">
                {loadingAlumnos ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                    <p className="text-gray-400 mt-4">Cargando alumnos...</p>
                  </div>
                ) : alumnosExamen.length === 0 ? (
                  <div className="text-center py-12">
                    <AcademicCapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      No hay alumnos inscritos en este grado y sección
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Tabla de alumnos */}
                    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                      <table className="w-full">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                              Alumno
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300 w-32">
                              Nota (0-100)
                            </th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                              Observaciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {alumnosExamen.map((alumno, index) => (
                            <tr
                              key={alumno.id_estudiante}
                              className="hover:bg-gray-750"
                            >
                              <td className="px-4 py-3 text-gray-300">
                                <div>
                                  <div className="font-medium">
                                    {alumno.nombre} {alumno.apellido}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {alumno.email}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.1"
                                  value={alumno.puntaje_obtenido || ""}
                                  onChange={(e) =>
                                    handleNotaChange(index, e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center focus:ring-2 focus:ring-green-500"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={alumno.observaciones || ""}
                                  onChange={(e) =>
                                    handleObservacionChange(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500"
                                  placeholder="Opcional"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loadingAlumnos && alumnosExamen.length > 0 && (
                <div className="p-6 border-t border-gray-700 flex gap-4">
                  <button
                    onClick={() => {
                      setShowEvaluarModal(false);
                      setExamenSeleccionado(null);
                    }}
                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarNotas}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold"
                  >
                    Guardar Notas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamenesPage;
