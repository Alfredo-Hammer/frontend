import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ArrowsUpDownIcon,
  TagIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
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
  const [nombre, setNombre] = useState("");
  const [nivelEducativo, setNivelEducativo] = useState("Educación Primaria");
  const [orden, setOrden] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editNivelEducativo, setEditNivelEducativo] =
    useState("Educación Primaria");
  const [editOrden, setEditOrden] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [gradoDetalle, setGradoDetalle] = useState(null);

  // Estados adicionales
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Estado para ConfirmModal
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const showConfirmModal = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm,
    });
  };

  const hideConfirmModal = () => {
    setConfirmModal({
      show: false,
      title: "",
      message: "",
      onConfirm: null,
    });
  };

  const token = localStorage.getItem("token");

  const normalizeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

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
    const initializeData = async () => {
      console.log("🚀 Inicializando GradosPage...");
      setIsInitialLoading(true);
      await fetchUser();
      setIsInitialLoading(false);
      console.log("✅ Inicialización de GradosPage completa");
    };
    initializeData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    console.log("🔄 useEffect grados ejecutándose:", {
      user: !!user,
      id_escuela: user?.id_escuela,
      shouldFetch: !!(user && user.id_escuela),
    });

    if (user && user.id_escuela) {
      console.log("✅ Condiciones cumplidas, cargando grados...");
      fetchGrados();
    } else {
      console.log("❌ Condiciones no cumplidas para cargar grados");
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchUser = async () => {
    try {
      console.log("🔄 Cargando usuario...", {
        token: !!token,
        endpoint: "/api/usuarios/perfil",
      });

      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });

      console.log("✅ Respuesta raw del usuario:", res.data);

      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
        id_escuela: res.data.usuario?.id_escuela || res.data.id_escuela,
      });

      console.log("✅ Usuario procesado:", {
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
        id_escuela: res.data.usuario?.id_escuela || res.data.id_escuela,
      });

      // Cargar datos de escuela
      const id_escuela = res.data.usuario?.id_escuela || res.data.id_escuela;
      if (id_escuela) {
        console.log("🏫 Cargando datos de escuela:", id_escuela);
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
        console.log("✅ Escuela cargada:", escuelaRes.data);
      } else {
        console.warn("⚠️ No se encontró id_escuela para el usuario");
      }
    } catch (error) {
      console.error("❌ Error al cargar datos de usuario:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      showToast(
        "Error al cargar datos de usuario: " +
          (error.response?.data?.message || error.message),
        "error"
      );
    }
  };

  const fetchGrados = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Cargando grados...", {
        token: !!token,
        user: user,
        services_grados: services.grados,
      });

      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });

      console.log("✅ Respuesta de grados:", res.data);
      setGrados(normalizeArray(res.data));
    } catch (err) {
      console.error("❌ Error al cargar grados:", err);
      console.error("Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      showToast(
        "Error al cargar grados: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setIsSubmitting(true);
    try {
      const gradoData = {
        nombre: nombre.trim(),
        nivel_educativo: nivelEducativo,
        orden: parseInt(orden) || 0,
      };

      const response = await api.post(services.grados, gradoData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      limpiarFormulario();
      showToast(
        response.data.message || "✅ Grado creado correctamente",
        "success"
      );
      setShowModal(false);
      fetchGrados();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error al crear grado";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditar = async (id) => {
    setIsSubmitting(true);
    try {
      const gradoData = {
        nombre: editNombre.trim(),
        nivel_educativo: editNivelEducativo,
        orden: parseInt(editOrden) || 0,
      };

      await api.put(services.grados + `/${id}`, gradoData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setEditId(null);
      setShowEditModal(false);
      limpiarFormulario();
      showToast("✅ Grado actualizado correctamente", "success");
      fetchGrados();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Error al actualizar grado";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setNivelEducativo("Primaria");
    setOrden("");
    setEditNombre("");
    setEditNivelEducativo("Primaria");
    setEditOrden("");
  };

  // Filtros y búsqueda
  const gradosFiltrados = grados.filter((grado) => {
    return grado.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleEliminar = (grado) => {
    showConfirmModal(
      "Confirmar Eliminación",
      `¿Está seguro de que desea eliminar el grado "${grado.nombre}"? Esta acción no se puede deshacer.`,
      async () => {
        try {
          await api.delete(services.grados + `/${grado.id_grado}`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          showToast("✅ Grado eliminado correctamente", "success");
          fetchGrados();
        } catch (err) {
          showToast("Error al eliminar grado", "error");
        }
        hideConfirmModal();
      }
    );
  };

  // Abrir modal de edición y cargar datos del grado
  const startEdit = (grado) => {
    setEditId(grado.id_grado);
    setEditNombre(grado.nombre);
    setEditNivelEducativo(
      grado.nivel_educativo || "Educación Inicial (Preescolar)"
    );
    setEditOrden(grado.orden?.toString() || "");
    setShowEditModal(true);
  };

  // Abrir modal de detalle
  const verDetalle = (grado) => {
    setGradoDetalle(grado);
    setShowDetailModal(true);
  };

  // Exportar grado a PDF
  const exportarGradoPDF = (grado) => {
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("Detalle del Grado", 14, 20);

    // Línea separadora
    doc.setDrawColor(79, 70, 229);
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);

    // Información básica
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    let yPosition = 35;

    doc.setFont(undefined, "bold");
    doc.text("Información General", 14, yPosition);
    yPosition += 7;

    doc.setFont(undefined, "normal");
    doc.text(`Nombre: ${grado.nombre}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Código: ${grado.codigo_grado || "Sin código"}`, 20, yPosition);
    yPosition += 6;
    doc.text(
      `Nivel Educativo: ${grado.nivel_educativo || "General"}`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(`Orden: ${grado.orden || 0}`, 20, yPosition);
    yPosition += 10;

    // Estadísticas
    doc.setFont(undefined, "bold");
    doc.text("Estadísticas", 14, yPosition);
    yPosition += 7;

    doc.setFont(undefined, "normal");
    doc.text(
      `Total de Secciones: ${grado.total_secciones || 0}`,
      20,
      yPosition
    );
    yPosition += 6;
    doc.text(`Total de Materias: ${grado.total_materias || 0}`, 20, yPosition);
    yPosition += 6;
    doc.text(
      `Total de Estudiantes: ${grado.total_estudiantes || 0}`,
      20,
      yPosition
    );
    yPosition += 10;

    // Materias
    doc.setFont(undefined, "bold");
    doc.text("Materias del Grado", 14, yPosition);
    yPosition += 7;

    doc.setFont(undefined, "normal");
    const listaMaterias = grado.lista_materias || "Sin materias asignadas";
    const materiasSplit = doc.splitTextToSize(listaMaterias, 170);
    doc.text(materiasSplit, 20, yPosition);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString(
          "es-ES"
        )}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Guardar PDF
    doc.save(`Grado_${grado.nombre.replace(/\s+/g, "_")}_${Date.now()}.pdf`);
    showToast("PDF generado exitosamente", "success");
  };

  function SortableCard({
    grado,
    listeners,
    attributes,
    setNodeRef,
    style,
    ...props
  }) {
    const listaMaterias = grado.lista_materias || "Sin materias asignadas";
    const totalMaterias = grado.total_materias || 0;
    const totalSecciones = grado.total_secciones || 0;
    const totalEstudiantes = grado.total_estudiantes || 0;

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
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-white/20 rounded-full text-xs text-white">
                Orden: {grado.orden || 0}
              </span>
              <ArrowsUpDownIcon className="w-5 h-5 text-white/60" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mt-3 line-clamp-1">
            {grado.nombre}
          </h3>
          <p className="text-indigo-100 text-sm">
            {grado.nivel_educativo || "General"}
          </p>
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-6 space-y-4">
          {/* Estadísticas */}
          <div className="flex justify-between items-center text-center">
            {/* Secciones */}
            <div>
              <p className="text-gray-400 text-xs mb-1">Secciones</p>
              <p className="text-white text-sm font-semibold">
                {totalSecciones}
              </p>
            </div>

            {/* Materias */}
            <div>
              <p className="text-gray-400 text-xs mb-1">Materias</p>
              <p className="text-white text-sm font-semibold">
                {totalMaterias}
              </p>
            </div>

            {/* Estudiantes */}
            <div>
              <p className="text-gray-400 text-xs mb-1">Alumnos</p>
              <p className="text-white text-sm font-semibold">
                {totalEstudiantes}
              </p>
            </div>
          </div>

          {/* Código del grado */}
          <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <TagIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs">Código</p>
              <p className="text-white text-sm font-medium">
                {grado.codigo_grado || "Sin código"}
              </p>
            </div>
          </div>

          {/* Lista de Materias */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <BookOpenIcon className="w-4 h-4 text-purple-400" />
              <p className="text-gray-400 text-xs font-medium">
                Materias del Grado
              </p>
            </div>

            <div
              className="bg-gray-700/50 rounded-lg p-3"
              title={listaMaterias}
            >
              {listaMaterias === "Sin materias asignadas" ? (
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <p className="text-yellow-300 text-xs">
                    Sin materias asignadas aún
                  </p>
                </div>
              ) : (
                <p className="text-white text-sm leading-relaxed line-clamp-2">
                  {listaMaterias}
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="bg-gray-700 px-4 py-3 -mx-6 -mb-6 flex justify-between items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.verDetalle(grado);
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="text-sm">Ver</span>
            </button>

            {props.canEdit ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    props.startEdit(grado);
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
                  onClick={(e) => {
                    e.stopPropagation();
                    props.handleEliminar(grado);
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
        verDetalle={verDetalle}
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
      showToast("✅ ¡Orden guardado!", "success");
    } catch (err) {
      showToast("Error al guardar el orden", "error");
      console.error("Error al guardar el orden:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Moderno y Compacto */}
        <PageHeader
          title="Gestión de Grados"
          subtitle="Organiza y administra los grados académicos de tu institución"
          icon={AcademicCapIcon}
          gradientFrom="indigo-600"
          gradientTo="purple-600"
          badge="Organización Académica"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={{
            "Total de Grados": grados.length,
            "Grados Activos": grados.filter((g) => {
              const totalMaterias = Number(g.total_materias || 0);
              const totalSecciones = Number(g.total_secciones || 0);
              return totalMaterias > 0 || totalSecciones > 0;
            }).length,
          }}
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

        {/* Loading state inicial */}
        {isInitialLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Inicializando sistema...
            </span>
          </div>
        )}

        {/* Loading state para grados */}
        {!isInitialLoading && isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando grados...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isInitialLoading &&
          !isLoading &&
          gradosFiltrados.length === 0 &&
          grados.length === 0 && (
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
        {!isInitialLoading &&
          !isLoading &&
          gradosFiltrados.length === 0 &&
          grados.length > 0 && (
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
        {!isInitialLoading && !isLoading && gradosFiltrados.length > 0 && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nivel Educativo *
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        value={nivelEducativo}
                        onChange={(e) => setNivelEducativo(e.target.value)}
                        required
                      >
                        <option value="Preescolar">Educación Inicial</option>
                        <option value="Primaria">Educación Primaria</option>
                        <option value="Secundaria">Educación Secundaria</option>
                        <option value="Sabatino">Sabatino</option>
                        <option value="Tecnológica">Preparatoria</option>
                        <option value="Universidad">Universidad</option>
                        <option value="Profesional">Profesional</option>
                        <option value="Postgrado">Postgrado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Orden (Opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                        value={orden}
                        onChange={(e) => setOrden(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Define el orden de aparición del grado
                      </p>
                    </div>
                  </div>
                </section>

                {/* Nota informativa */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <svg
                      className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h5 className="text-blue-300 font-medium text-sm">
                        Sobre las Materias
                      </h5>
                      <p className="text-blue-200 text-sm mt-1">
                        Las materias se asignan automáticamente cuando los
                        profesores crean su carga académica por sección. No es
                        necesario seleccionarlas al crear el grado.
                      </p>
                    </div>
                  </div>
                </div>

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
              {/* #HbfPFkqPM  hammeralfredo67@gmail.com  profe */}
              {/* sK4PjdwN4d hammeralfredo69@gmail.com profe */}

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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nivel Educativo *
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                        value={editNivelEducativo}
                        onChange={(e) => setEditNivelEducativo(e.target.value)}
                        required
                      >
                        <option value="Preescolar">Educación Inicial</option>
                        <option value="Primaria">Educación Primaria</option>
                        <option value="Secundaria">Educación Secundaria</option>
                        <option value="Sabatino">Sabatino</option>
                        <option value="Tecnológica">Preparatoria</option>
                        <option value="Universidad">Universidad</option>
                        <option value="Profesional">Profesional</option>
                        <option value="Postgrado">Postgrado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Orden (Opcional)
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                        value={editOrden}
                        onChange={(e) => setEditOrden(e.target.value)}
                      />
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
                      limpiarFormulario();
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

        {/* Toast Notifications */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() =>
              setToast({show: false, message: "", type: "success"})
            }
          />
        )}

        {/* Confirm Modal */}
        {confirmModal.show && (
          <ConfirmModal
            title={confirmModal.title}
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={hideConfirmModal}
            confirmText="Eliminar"
            cancelText="Cancelar"
            type="danger"
          />
        )}

        {/* Modal de Detalle del Grado */}
        {showDetailModal && gradoDetalle && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-gray-700">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-2xl z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-full">
                      <AcademicCapIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {gradoDetalle.nombre}
                      </h3>
                      <p className="text-indigo-100 text-sm mt-1">
                        Detalle completo del grado
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {/* Información Básica */}
                <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-indigo-400" />
                    Información General
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Nombre del Grado</p>
                      <p className="text-white font-medium">
                        {gradoDetalle.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Código</p>
                      <p className="text-white font-medium">
                        {gradoDetalle.codigo_grado || "Sin código"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Nivel Educativo</p>
                      <p className="text-white font-medium">
                        {gradoDetalle.nivel_educativo || "General"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Orden</p>
                      <p className="text-white font-medium">
                        {gradoDetalle.orden || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Estadísticas
                  </h4>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <p className="text-blue-400 text-sm mb-2">Secciones</p>
                      <p className="text-white text-3xl font-bold">
                        {gradoDetalle.total_secciones || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                      <p className="text-purple-400 text-sm mb-2">Materias</p>
                      <p className="text-white text-3xl font-bold">
                        {gradoDetalle.total_materias || 0}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                      <p className="text-green-400 text-sm mb-2">Estudiantes</p>
                      <p className="text-white text-3xl font-bold">
                        {gradoDetalle.total_estudiantes || 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Materias */}
                <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                    Materias del Grado
                  </h4>
                  {gradoDetalle.lista_materias === "Sin materias asignadas" ? (
                    <div className="flex items-center justify-center p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-2" />
                      <p className="text-yellow-300">
                        Sin materias asignadas aún
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <p className="text-white leading-relaxed">
                        {gradoDetalle.lista_materias}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer con botones */}
              <div className="sticky bottom-0 bg-gray-700 px-8 py-4 rounded-b-2xl flex justify-between items-center gap-4">
                <button
                  onClick={() => exportarGradoPDF(gradoDetalle)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Exportar PDF
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GradosPage;
