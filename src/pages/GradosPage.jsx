import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

function GradosPage() {
  const [grados, setGrados] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [idMaterias, setIdMaterias] = useState([]);
  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editMaterias, setEditMaterias] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Nuevos estados para funcionalidades adicionales
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);

  const token = localStorage.getItem("token");
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
      fetchGrados();
    }
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    if (showModal) {
      fetchMaterias();
    }
    // eslint-disable-next-line
  }, [showModal]);

  useEffect(() => {
    if (showEditModal) {
      fetchMaterias();
    }
    // eslint-disable-next-line
  }, [showEditModal]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
        id_escuela: res.data.usuario?.id_escuela || res.data.id_escuela,
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
    try {
      const res = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMaterias(res.data);
    } catch (err) {
      setMensaje("Error al cargar materias");
    }
  };

  const fetchGrados = async () => {
    setIsLoading(true);
    try {
      const esProfesor = user?.rol?.toLowerCase() === "profesor";

      if (esProfesor && user?.id_profesor) {
        // Si es profesor, cargar sus grados asignados
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/asignaciones`,
          {headers: {Authorization: `Bearer ${token}`}}
        );

        const asignacionesData = asignacionesRes.data.asignaciones || [];

        // Cargar información de escuela usando id_escuela del usuario
        let nombreEscuela = "Sin escuela";
        if (user.id_escuela) {
          try {
            const escuelaRes = await api.get(
              `/api/escuelas/${user.id_escuela}`,
              {
                headers: {Authorization: `Bearer ${token}`},
              }
            );
            nombreEscuela = escuelaRes.data?.nombre || "Sin escuela";
          } catch (error) {
            console.error("Error al cargar escuela:", error);
          }
        }

        // Cargar todas las materias de la escuela (con timestamp para evitar caché)
        const materiasRes = await api.get("/api/materias", {
          headers: {Authorization: `Bearer ${token}`},
          params: {_t: new Date().getTime()},
        });
        const todasMaterias = materiasRes.data || [];

        console.log("📚 Materias cargadas del servidor:", todasMaterias);
        console.log("🎓 Procesando grados del profesor...");

        // Transformar asignaciones a formato de grados únicos
        const gradosUnicos = [
          ...new Map(
            asignacionesData.map((a) => {
              // Filtrar materias que pertenecen a este grado
              const materiasDelGrado = todasMaterias
                .filter(
                  (m) => m.grados_ids && m.grados_ids.includes(a.id_grado)
                )
                .map((m) => m.nombre);

              console.log(`📖 Grado ${a.nombre_grado} (ID: ${a.id_grado}):`, {
                materias_encontradas: materiasDelGrado,
                total_materias_sistema: todasMaterias.length,
              });

              return [
                a.id_grado,
                {
                  id_grado: a.id_grado,
                  nombre: a.nombre_grado,
                  nivel: a.nivel,
                  nombre_escuela: nombreEscuela,
                  materias: materiasDelGrado,
                  secciones: asignacionesData
                    .filter(
                      (asig) => asig.id_grado === a.id_grado && asig.id_seccion
                    )
                    .map((asig) => ({
                      id_seccion: asig.id_seccion,
                      nombre: asig.nombre_seccion,
                    })),
                },
              ];
            })
          ).values(),
        ];

        console.log("📊 Grados procesados para profesor:", gradosUnicos);
        setGrados(gradosUnicos);
      } else {
        // Si es admin/director/secretaria, cargar todos los grados
        const res = await api.get(services.grados, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setGrados(res.data);
      }
    } catch (err) {
      console.error("Error al cargar grados:", err);
      setMensaje("Error al cargar grados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSubmitting(true);
    try {
      const idMateriasInt = idMaterias.map(Number);
      await api.post(
        services.grados,
        {nombre, id_materias: idMateriasInt},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      limpiarFormulario();
      setMensaje("Grado creado correctamente");
      setShowModal(false);
      fetchGrados();
    } catch (err) {
      setMensaje("Error al crear grado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditar = async (id) => {
    setIsSubmitting(true);
    try {
      const idMateriasInt = editMaterias.map(Number);
      await api.put(
        services.grados + `/${id}`,
        {
          nombre: editNombre,
          id_materias: idMateriasInt,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setEditId(null);
      setEditNombre("");
      setEditMaterias([]);
      setMensaje("Grado editado correctamente");
      setShowEditModal(false);
      fetchGrados();
    } catch (err) {
      setMensaje("Error al editar grado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setIdMaterias([]);
  };

  // Filtros y búsqueda
  const gradosFiltrados = grados.filter((grado) => {
    return grado.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este grado?")) return;
    try {
      await api.delete(services.grados + `/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Grado eliminado correctamente");
      fetchGrados();
    } catch (err) {
      setMensaje("Error al eliminar grado");
    }
  };

  // Abrir modal de edición y cargar datos del grado
  const startEdit = (grado) => {
    setEditId(grado.id_grado);
    setEditNombre(grado.nombre);
    setEditMaterias(grado.materias_ids ? grado.materias_ids.map(Number) : []);
    setShowEditModal(true);
  };

  // Checkbox handler para materias en edición
  const handleEditMateriaCheck = (id) => {
    setEditMaterias((prev) =>
      prev.includes(Number(id))
        ? prev.filter((mid) => mid !== Number(id))
        : [...prev, Number(id)]
    );
  };

  function SortableCard({
    grado,
    listeners,
    attributes,
    setNodeRef,
    style,
    ...props
  }) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-indigo-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group cursor-move"
      >
        {/* Header de la tarjeta */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between">
            <AcademicCapIcon className="w-8 h-8 text-white" />
            <ArrowsUpDownIcon className="w-5 h-5 text-white/60" />
          </div>
          <h3 className="text-xl font-bold text-white mt-3 line-clamp-1">
            {grado.nombre}
          </h3>
          <p className="text-indigo-100 text-sm">
            {grado.nombre_escuela || "Sin escuela"}
          </p>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
              <BookOpenIcon className="w-4 h-4 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs">Materias Asignadas</p>
              <p className="text-white text-sm font-medium">
                {grado.materias && grado.materias.length > 0
                  ? `${grado.materias.length} materia${
                      grado.materias.length !== 1 ? "s" : ""
                    }`
                  : "Sin materias"}
              </p>
            </div>
          </div>

          {grado.materias && grado.materias.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Lista de materias:</p>
              <div className="flex flex-wrap gap-1">
                {grado.materias.slice(0, 3).map((materia, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs"
                  >
                    {materia}
                  </span>
                ))}
                {grado.materias.length > 3 && (
                  <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded-full text-xs">
                    +{grado.materias.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {grado.secciones && grado.secciones.length > 0 && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-sm">📚</span>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Secciones</p>
                <p className="text-white text-sm font-medium">
                  {grado.secciones.map((s) => s.nombre).join(", ")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
          {props.canEdit ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  props.startEdit(grado);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  props.handleEliminar(grado.id_grado);
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
            </>
          ) : (
            <div className="w-full text-center py-2 text-gray-400 text-sm">
              Solo lectura
            </div>
          )}
        </div>
      </div>
    );
  }

  function DraggableCard(props) {
    const {grado, startEdit, handleEliminar, canEdit} = props;
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({id: grado.id_grado});
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : "auto",
    };
    return (
      <SortableCard
        grado={grado}
        startEdit={startEdit}
        handleEliminar={handleEliminar}
        canEdit={canEdit}
        setNodeRef={setNodeRef}
        listeners={listeners}
        attributes={attributes}
        style={style}
      />
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}})
  );

  const guardarOrdenGrados = async (nuevoOrden) => {
    try {
      await api.put(
        services.gradosOrdenar,
        {orden: nuevoOrden},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setMensaje("¡Orden guardado!");
    } catch (err) {
      setMensaje("Error al guardar el orden");
      console.error("Error al guardar el orden:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Moderno y Compacto */}
        <PageHeader
          title="Gestión de Grados"
          subtitle="Organiza y administra los grados académicos con sus materias correspondientes"
          icon={AcademicCapIcon}
          gradientFrom="indigo-600"
          gradientTo="purple-600"
          badge="Organización Académica"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          actions={
            <>
              {canEdit && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center space-x-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span>Crear Grado</span>
                </button>
              )}
              <button
                onClick={fetchGrados}
                disabled={isLoading}
                className="px-4 py-2 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
              >
                <svg
                  className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>{isLoading ? "Actualizando..." : "Actualizar"}</span>
              </button>
            </>
          }
        />
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-2xl text-center backdrop-blur-sm border ${
              mensaje.includes("correctamente") || mensaje.includes("guardado")
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
                placeholder="Buscar grados por nombre..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-700 rounded-xl">
                <ArrowsUpDownIcon className="w-5 h-5 text-gray-300" />
                <span className="text-gray-300 text-sm">
                  Arrastra para ordenar
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando grados...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && gradosFiltrados.length === 0 && grados.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">🎓</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              No hay grados registrados
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Comienza creando el primer grado para organizar tu sistema
              académico.
            </p>
            {canEdit && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2 inline" />
                Crear Primer Grado
              </button>
            )}
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoading && gradosFiltrados.length === 0 && grados.length > 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No se encontraron grados
            </h3>
            <p className="text-gray-400">
              Intenta modificar los filtros de búsqueda
            </p>
          </div>
        )}

        {/* Cards de grados con Drag & Drop */}
        {!isLoading && gradosFiltrados.length > 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <AcademicCapIcon className="w-6 h-6 mr-2 text-indigo-400" />
                Lista de Grados
              </h3>
              <div className="text-sm text-gray-400">
                {gradosFiltrados.length} grado
                {gradosFiltrados.length !== 1 ? "s" : ""}
              </div>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={({active, over}) => {
                setIsDragging(false);
                if (active.id !== over?.id) {
                  const oldIndex = grados.findIndex(
                    (g) => g.id_grado === active.id
                  );
                  const newIndex = grados.findIndex(
                    (g) => g.id_grado === over.id
                  );
                  const nuevosGrados = arrayMove(grados, oldIndex, newIndex);
                  setGrados(nuevosGrados);
                  guardarOrdenGrados(nuevosGrados.map((g) => g.id_grado));
                }
              }}
            >
              <SortableContext
                items={gradosFiltrados.map((g) => g.id_grado)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {gradosFiltrados.map((grado) => (
                    <DraggableCard
                      key={grado.id_grado}
                      grado={grado}
                      startEdit={startEdit}
                      handleEliminar={handleEliminar}
                      canEdit={canEdit}
                      isDragging={isDragging}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className="mt-6 pt-6 border-t border-gray-700 text-center">
              <p className="text-sm text-gray-400 flex items-center justify-center">
                <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
                Arrastra las tarjetas para cambiar el orden de los grados
              </p>
            </div>
          </div>
        )}

        {/* Modal para crear grado */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Crear Nuevo Grado
                    </h3>
                    <p className="text-indigo-100 text-sm">
                      Agrega un nuevo grado académico al sistema
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

              <form onSubmit={handleCrear} className="p-8 space-y-8">
                {/* Información Básica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Información del Grado
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre del Grado *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Primer Grado, Segundo Año, etc."
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </section>

                {/* Materias */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                      <BookOpenIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Materias del Grado
                    </h4>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
                    <p className="text-sm text-gray-400 mb-4">
                      Selecciona las materias que pertenecen a este grado:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {materias.map((m) => (
                        <label
                          key={m.id_materia}
                          className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors duration-200"
                        >
                          <input
                            type="checkbox"
                            value={m.id_materia}
                            checked={idMaterias.includes(String(m.id_materia))}
                            onChange={(e) => {
                              const val = String(m.id_materia);
                              setIdMaterias((prev) =>
                                prev.includes(val)
                                  ? prev.filter((id) => id !== val)
                                  : [...prev, val]
                              );
                            }}
                            className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-600 rounded focus:ring-indigo-500 mr-3"
                          />
                          <div>
                            <p className="text-white font-medium">{m.nombre}</p>
                            {m.descripcion && (
                              <p className="text-gray-400 text-xs">
                                {m.descripcion}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                    {materias.length === 0 && (
                      <p className="text-gray-400 text-center py-8">
                        No hay materias disponibles
                      </p>
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
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !nombre.trim()}
                    className={`px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                      isSubmitting || !nombre.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creando...
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
                        Crear Grado
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para editar grado */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gradient-to-r from-yellow-600 to-orange-600 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Editar Grado
                    </h3>
                    <p className="text-yellow-100 text-sm">
                      Modifica la información del grado
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setEditNombre("");
                      setEditMaterias([]);
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
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditar(editId);
                }}
                className="p-8 space-y-8"
              >
                {/* Información Básica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Información del Grado
                    </h4>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre del Grado *
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del grado"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      required
                    />
                  </div>
                </section>

                {/* Materias */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center mr-3">
                      <BookOpenIcon className="w-5 h-5 text-orange-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      Materias del Grado
                    </h4>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-600">
                    <p className="text-sm text-gray-400 mb-4">
                      Selecciona las materias que pertenecen a este grado:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {materias.map((m) => (
                        <label
                          key={m.id_materia}
                          className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors duration-200"
                        >
                          <input
                            type="checkbox"
                            value={m.id_materia}
                            checked={editMaterias.includes(
                              Number(m.id_materia)
                            )}
                            onChange={() =>
                              handleEditMateriaCheck(m.id_materia)
                            }
                            className="w-4 h-4 text-yellow-600 bg-gray-800 border-gray-600 rounded focus:ring-yellow-500 mr-3"
                          />
                          <div>
                            <p className="text-white font-medium">{m.nombre}</p>
                            {m.descripcion && (
                              <p className="text-gray-400 text-xs">
                                {m.descripcion}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Botones */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditId(null);
                      setEditNombre("");
                      setEditMaterias([]);
                    }}
                    className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !editNombre.trim()}
                    className={`px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                      isSubmitting || !editNombre.trim()
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105 hover:shadow-xl"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Guardando...
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
                        Guardar Cambios
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

export default GradosPage;
