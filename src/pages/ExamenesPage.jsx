import React, {useEffect, useState, useMemo} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import evaluacionesApi from "../api/evaluaciones";
import ciclosApi from "../api/ciclos";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  EyeIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ExclamationTriangleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

function ExamenesPage() {
  const token = localStorage.getItem("token");

  // --- HELPERS ---
  const normalizeArray = (value) =>
    Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
  const toIntOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // --- ESTADOS DE DATOS ---
  const [examenes, setExamenes] = useState([]);
  const [evaluacionesDisponibles, setEvaluacionesDisponibles] = useState([]);
  const [cicloActivo, setCicloActivo] = useState(null);
  const [cerrarExamen, setCerrarExamen] = useState(false);

  const [combos, setCombos] = useState({
    grados: [],
    secciones: [],
    materias: [],
    profesores: [],
  });

  // --- ESTADOS UI ---
  const [showModal, setShowModal] = useState(false);
  const [showEvaluarModal, setShowEvaluarModal] = useState(false);
  const [showVerModal, setShowVerModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // --- EDICIÓN / SELECCIÓN ---
  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [examenDetalle, setExamenDetalle] = useState(null);
  const [alumnosExamen, setAlumnosExamen] = useState([]);
  const [editId, setEditId] = useState(null);

  // --- FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    tipo: "",
    estado: "",
    evaluacion: "",
  });

  // --- USER CONTEXT ---
  const [user, setUser] = useState(null);
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmModal, setConfirmModal] = useState({open: false});

  // --- FORM DATA ---
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
    id_evaluacion: "",
  });

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      setLoadingData(true);
      const userRes = await api.get("/api/usuarios/perfil");
      const usuario = userRes.data.usuario || userRes.data;
      setUser(usuario);

      const ciclosRes = await ciclosApi.getCiclosSetup(token);
      const actual = ciclosRes.data?.actual
        ? ciclosRes.data.ciclos.find(
            (c) => c.id_ciclo === ciclosRes.data.actual
          )
        : ciclosRes.data?.ciclos[0];

      setCicloActivo(actual);

      if (actual) {
        const evalsRes = await evaluacionesApi.getEvaluacionesPorCiclo(
          token,
          actual.id_ciclo
        );
        setEvaluacionesDisponibles(
          normalizeArray(evalsRes.data).sort((a, b) => a.orden - b.orden)
        );
      }

      const [gradosRes, seccionesRes, materiasRes, profesoresRes] =
        await Promise.all([
          api.get("/api/grados"),
          api.get("/api/secciones"),
          api.get("/api/materias"),
          api.get("/api/profesores"),
        ]);

      setCombos({
        grados: normalizeArray(gradosRes.data),
        secciones: normalizeArray(seccionesRes.data),
        materias: normalizeArray(materiasRes.data),
        profesores: normalizeArray(profesoresRes.data),
      });

      let infoAlumnoLocal = null;
      if (usuario?.rol?.toLowerCase() === "alumno") {
        try {
          const infoRes = await api.get(
            `/api/calificaciones/alumno-info/${usuario.id_usuario}`
          );
          setAlumnoInfo(infoRes.data);
          infoAlumnoLocal = infoRes.data;
        } catch (e) {
          console.error("Info alumno error", e);
        }
      }

      fetchExamenes(usuario, infoAlumnoLocal);
    } catch (error) {
      console.error("Error inicial:", error);
      showToast("Error al cargar datos del sistema", "error");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!showModal) return;
    const {id_grado, id_seccion} = formData;

    if (!id_grado || !id_seccion) return;

    const fetchMateriasFiltradas = async () => {
      try {
        const res = await api.get("/api/materias", {
          params: {id_grado, id_seccion},
        });
        const mats = normalizeArray(res.data);
        setCombos((prev) => ({...prev, materias: mats}));

        if (
          formData.id_materia &&
          !mats.find(
            (m) => String(m.id_materia) === String(formData.id_materia)
          )
        ) {
          setFormData((prev) => ({...prev, id_materia: ""}));
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchMateriasFiltradas();
  }, [showModal, formData.id_grado, formData.id_seccion]);

  // ========== GESTIÓN ==========

  const fetchExamenes = async (usr = user, aluInfo = alumnoInfo) => {
    try {
      const res = await api.get("/api/examenes", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const lista = normalizeArray(res.data);

      if (usr?.rol?.toLowerCase() === "alumno") {
        const propios = filtrarExamenesPorAlumno(lista, aluInfo);
        setExamenes(ordenarExamenes(propios));
      } else {
        setExamenes(lista);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filtrarExamenesPorAlumno = (lista, info) => {
    if (!info) return [];
    return lista.filter(
      (e) =>
        String(e.id_grado) === String(info.id_grado) &&
        String(e.id_seccion) === String(info.id_seccion)
    );
  };

  const ordenarExamenes = (lista) => {
    return lista.sort(
      (a, b) => new Date(b.fecha_examen) - new Date(a.fecha_examen)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // VALIDACIÓN DE SEMÁFORO
    const evalSelected = evaluacionesDisponibles.find(
      (ev) => String(ev.id_evaluacion) === String(formData.id_evaluacion)
    );
    if (evalSelected && !evalSelected.activo_captura && user?.rol !== "admin") {
      showToast(
        `El periodo "${evalSelected.nombre_corto}" está cerrado por dirección.`,
        "error"
      );
      return;
    }

    // Validación de Profesor (para Admin)
    if (user?.rol !== "profesor" && !formData.id_profesor) {
      showToast("Debes seleccionar un profesor responsable.", "warning");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        id_materia: toIntOrNull(formData.id_materia),
        id_grado: toIntOrNull(formData.id_grado),
        id_seccion: toIntOrNull(formData.id_seccion),
        id_profesor: toIntOrNull(formData.id_profesor) || user.id_profesor,
        duracion_minutos: toIntOrNull(formData.duracion_minutos),
        puntaje_total: toIntOrNull(formData.puntaje_total),
        id_evaluacion: toIntOrNull(formData.id_evaluacion),
        bimestre: null,
      };

      if (editId) {
        await api.put(`/api/examenes/${editId}`, payload);
        showToast("Examen actualizado", "success");
      } else {
        await api.post("/api/examenes", payload);
        showToast("Examen programado", "success");
      }
      fetchExamenes();
      closeModal();
    } catch (error) {
      showToast(error.response?.data?.message || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      title: "Eliminar Examen",
      message: "Se eliminarán también las notas asociadas. ¿Continuar?",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(`/api/examenes/${id}`);
          fetchExamenes();
          showToast("Examen eliminado", "success");
        } catch (e) {
          showToast("Error al eliminar", "error");
        }
        setConfirmModal({open: false});
      },
    });
  };

  // ========== EVALUACIÓN (CON CÁLCULO DE ACUMULADO) ==========

  const abrirEvaluacion = async (examen) => {
    setExamenSeleccionado(examen);
    setCerrarExamen(false);
    setShowEvaluarModal(true);
    try {
      const res = await api.get(`/api/examenes/${examen.id_examen}/alumnos`);
      // IMPORTANTE: El backend debe enviar 'acumulado_previo' para que esto funcione
      setAlumnosExamen(
        res.data.map((a) => ({
          ...a,
          puntaje_obtenido: a.puntaje_obtenido || 0,
          acumulado_previo: a.acumulado_previo || 0,
        }))
      );
    } catch (error) {
      showToast("Error al cargar lista de alumnos", "error");
      setShowEvaluarModal(false);
    }
  };

  const handleGuardarNotas = async () => {
    const maxExamen = Number(examenSeleccionado.puntaje_total) || 100;

    // VALIDACIÓN PREVIA EN FRONTEND: ¿Alguien se pasa de 100?
    const hayErrores = alumnosExamen.some((a) => {
      const nota = parseFloat(a.puntaje_obtenido) || 0;
      const total = (parseFloat(a.acumulado_previo) || 0) + nota;
      return nota > maxExamen || total > 100;
    });

    if (hayErrores) {
      showToast(
        "Error: Hay notas inválidas (marcadas en rojo). Revise los totales.",
        "warning"
      );
      return; // BLOQUEAMOS EL GUARDADO
    }

    setSaving(true);
    try {
      const payload = {
        notas: alumnosExamen.map((a) => ({
          id_estudiante: a.id_estudiante,
          puntaje: parseFloat(a.puntaje_obtenido) || 0,
          observaciones: a.observaciones,
        })),
        actualizar_boleta: true,
        id_evaluacion: examenSeleccionado.id_evaluacion,
        cambiar_estado: cerrarExamen ? "finalizado" : "activo",
      };

      await api.post(
        `/api/examenes/${examenSeleccionado.id_examen}/calificar`,
        payload
      );

      showToast(
        cerrarExamen ? "Examen finalizado exitosamente." : "Avance guardado.",
        "success"
      );
      setShowEvaluarModal(false);
      fetchExamenes();
    } catch (error) {
      const msg = error.response?.data?.error || "Error al guardar notas";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  // --- HELPERS VISUALES ---

  const getNombreEvaluacion = (idEval, bimestreLegacy) => {
    if (idEval) {
      const ev = evaluacionesDisponibles.find(
        (e) => Number(e.id_evaluacion) === Number(idEval)
      );
      return ev ? ev.nombre_corto : "Periodo Desconocido";
    }
    if (bimestreLegacy) return `Bimestre ${bimestreLegacy}`;
    return "Sin Periodo";
  };

  const showToast = (msg, type) => {
    setToast({show: true, message: msg, type});
    setTimeout(() => setToast((prev) => ({...prev, show: false})), 3000);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
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
      id_evaluacion: "",
    });
  };

  const examenesFiltrados = examenes.filter((ex) => {
    const matchSearch = ex.titulo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchTipo = filtros.tipo ? ex.tipo_examen === filtros.tipo : true;
    const matchEval = filtros.evaluacion
      ? String(ex.id_evaluacion) === filtros.evaluacion
      : true;
    return matchSearch && matchTipo && matchEval;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-10 font-sans">
      {/* HEADER */}
      <PageHeader
        title="Evaluaciones Académicas"
        subtitle="Programa exámenes, registra notas y cierra actas de evaluación."
        icon={ClipboardDocumentCheckIcon}
        actions={
          (user?.rol === "admin" || user?.rol === "profesor") && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all font-semibold active:scale-95"
            >
              <PlusIcon className="w-5 h-5" /> Crear Examen
            </button>
          )
        }
      />

      {/* TOAST & MODALS */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({open: false})}
        type={confirmModal.type}
      />

      {/* FILTROS */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-md">
        <div className="relative flex-1 w-full group">
          <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por título o materia..."
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 text-sm outline-none focus:border-indigo-500 min-w-[160px]"
            value={filtros.evaluacion}
            onChange={(e) =>
              setFiltros({...filtros, evaluacion: e.target.value})
            }
          >
            <option value="">Todos los Periodos</option>
            {evaluacionesDisponibles.map((ev) => (
              <option key={ev.id_evaluacion} value={ev.id_evaluacion}>
                {ev.nombre_corto}
              </option>
            ))}
          </select>
          <select
            className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-gray-300 text-sm outline-none focus:border-indigo-500"
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
          >
            <option value="">Tipo de Prueba</option>
            <option value="parcial">Parcial</option>
            <option value="sistematico">Sistemático</option>
            <option value="acumulativo">Acumulativo</option>
          </select>
        </div>
      </div>

      {/* GRID DE CARDS */}
      {loadingData ? (
        <div className="text-center py-24 text-gray-500 animate-pulse">
          Cargando evaluaciones...
        </div>
      ) : examenesFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <BeakerIcon className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-white font-medium text-lg">
            No hay exámenes encontrados
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            Intenta ajustar los filtros o crea una nueva evaluación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {examenesFiltrados.map((ex) => {
            const nombreEval = getNombreEvaluacion(
              ex.id_evaluacion,
              ex.bimestre
            );
            const isActivo = ex.estado === "activo";
            const isFinalizado = ex.estado === "finalizado";

            return (
              <div
                key={ex.id_examen}
                className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-300 flex flex-col"
              >
                <div
                  className={`h-2 w-full ${
                    ex.tipo_examen === "parcial"
                      ? "bg-gradient-to-r from-purple-500 to-indigo-500"
                      : ex.tipo_examen === "acumulativo"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : "bg-gradient-to-r from-blue-500 to-cyan-500"
                  }`}
                />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-800 px-2 py-1 rounded-md border border-gray-700/50">
                      {ex.tipo_examen}
                    </span>
                    <span
                      className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        isActivo
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : isFinalizado
                          ? "bg-gray-800 text-gray-400 border border-gray-700"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActivo
                            ? "bg-green-500 animate-pulse"
                            : isFinalizado
                            ? "bg-gray-500"
                            : "bg-yellow-500"
                        }`}
                      />
                      {ex.estado}
                    </span>
                  </div>

                  <h3
                    className="text-white font-bold text-lg leading-snug mb-1 group-hover:text-indigo-400 transition-colors line-clamp-2"
                    title={ex.titulo}
                  >
                    {ex.titulo}
                  </h3>
                  <p className="text-gray-400 text-sm font-medium mb-4">
                    {ex.nombre_materia}
                  </p>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BuildingLibraryIcon className="w-3.5 h-3.5" />
                      <span className="truncate">
                        {user?.escuela_nombre || "Escuela"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-800/50 p-2 rounded-lg border border-gray-800">
                      <AcademicCapIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>
                        {ex.nombre_grado} • {ex.nombre_seccion}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(ex.fecha_examen).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                        {nombreEval}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-950 border-t border-gray-800 flex items-center gap-2">
                  {user?.rol !== "alumno" ? (
                    <>
                      <button
                        onClick={() => abrirEvaluacion(ex)}
                        className={`flex-1 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                          isFinalizado
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                            : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                        }`}
                      >
                        <BeakerIcon className="w-3.5 h-3.5" />{" "}
                        {isFinalizado ? "Ver Notas" : "Calificar"}
                      </button>
                      <button
                        onClick={() => {
                          setEditId(ex.id_examen);
                          setFormData({...ex});
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:bg-gray-800 rounded-lg hover:text-white transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id_examen)}
                        className="p-2 text-gray-400 hover:bg-red-900/20 rounded-lg hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setExamenDetalle(ex);
                        setShowVerModal(true);
                      }}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-xs font-medium border border-gray-700"
                    >
                      Ver Detalles
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL CREAR / EDITAR --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 rounded-2xl w-full max-w-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editId ? "Editar Evaluación" : "Nueva Evaluación"}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  Complete los detalles de la prueba.
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-6 overflow-y-auto custom-scrollbar"
            >
              {/* Básico */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Título
                    </label>
                    <input
                      required
                      value={formData.titulo}
                      onChange={(e) =>
                        setFormData({...formData, titulo: e.target.value})
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600"
                      placeholder="Ej: Examen Parcial de Álgebra"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                      <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />{" "}
                      Periodo / Corte
                    </label>
                    <select
                      required
                      value={formData.id_evaluacion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          id_evaluacion: e.target.value,
                        })
                      }
                      className="w-full bg-gray-950 border border-emerald-500/30 rounded-xl p-3 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">Seleccione Corte...</option>
                      {evaluacionesDisponibles.map((ev) => {
                        const isLocked = !ev.activo_captura;
                        const isCurrent =
                          String(formData.id_evaluacion) ===
                          String(ev.id_evaluacion);
                        const shouldDisable =
                          isLocked && !isCurrent && user?.rol !== "admin";

                        return (
                          <option
                            key={ev.id_evaluacion}
                            value={ev.id_evaluacion}
                            disabled={shouldDisable}
                            className={
                              shouldDisable
                                ? "text-gray-600 italic bg-gray-900"
                                : "text-white"
                            }
                          >
                            {ev.nombre_corto} {isLocked ? "(Cerrado 🔒)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Tipo
                    </label>
                    <select
                      required
                      value={formData.tipo_examen}
                      onChange={(e) =>
                        setFormData({...formData, tipo_examen: e.target.value})
                      }
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                    >
                      <option value="parcial">Parcial</option>
                      <option value="sistematico">Sistemático</option>
                      <option value="acumulativo">Acumulativo</option>
                      <option value="reparacion">Reparación</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Académico */}
              <div className="bg-gray-800/30 p-5 rounded-2xl border border-gray-800 space-y-4">
                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
                  <AcademicCapIcon className="w-4 h-4 text-indigo-400" />{" "}
                  Configuración Académica
                </h4>

                {/* Selector de Profesor (Admin Only) */}
                {user?.rol !== "profesor" && (
                  <div className="mb-2">
                    <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1">
                      <UserIcon className="w-3 h-3" /> Asignar Docente
                    </label>
                    <select
                      required
                      value={formData.id_profesor}
                      onChange={(e) =>
                        setFormData({...formData, id_profesor: e.target.value})
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="">Seleccione un docente...</option>
                      {normalizeArray(combos.profesores).map((p) => (
                        <option key={p.id_profesor} value={p.id_profesor}>
                          {p.nombre} {p.apellido}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Grado
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
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="">...</option>
                      {combos.grados.map((g) => (
                        <option key={g.id_grado} value={g.id_grado}>
                          {g.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Sección
                    </label>
                    <select
                      required
                      value={formData.id_seccion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          id_seccion: e.target.value,
                          id_materia: "",
                        })
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="">...</option>
                      {combos.secciones
                        .filter(
                          (s) =>
                            String(s.id_grado) === String(formData.id_grado)
                        )
                        .map((s) => (
                          <option key={s.id_seccion} value={s.id_seccion}>
                            {s.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      Materia
                    </label>
                    <select
                      required
                      value={formData.id_materia}
                      onChange={(e) =>
                        setFormData({...formData, id_materia: e.target.value})
                      }
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                    >
                      <option value="">...</option>
                      {combos.materias.map((m) => (
                        <option key={m.id_materia} value={m.id_materia}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Logística */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Fecha
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_examen}
                    onChange={(e) =>
                      setFormData({...formData, fecha_examen: e.target.value})
                    }
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
                    Puntaje Máx.
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.puntaje_total}
                    onChange={(e) =>
                      setFormData({...formData, puntaje_total: e.target.value})
                    }
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-gray-400 hover:text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95"
                >
                  {saving ? "Guardando..." : "Guardar Evaluación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EVALUAR (CON VALIDACIÓN 100 PTS Y ACUMULADO) --- */}
      {showEvaluarModal && examenSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 rounded-2xl w-full max-w-5xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BeakerIcon className="w-6 h-6 text-emerald-400" />
                  Calificar: {examenSeleccionado.titulo}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Alimenta al periodo{" "}
                  <span className="text-emerald-400 font-bold">
                    {getNombreEvaluacion(
                      examenSeleccionado.id_evaluacion,
                      examenSeleccionado.bimestre
                    )}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowEvaluarModal(false)}
                className="text-gray-500 hover:text-white"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <table className="w-full text-left text-sm text-gray-300 border-collapse">
                <thead className="bg-gray-950 text-gray-500 uppercase text-xs font-bold sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 border-b border-gray-800">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-center border-b border-gray-800 w-32">
                      Acumulado
                    </th>
                    <th className="px-4 py-3 text-center border-b border-gray-800 w-32">
                      Nota Examen
                    </th>
                    <th className="px-4 py-3 text-center border-b border-gray-800 w-32">
                      Total Proy.
                    </th>
                    <th className="px-4 py-3 border-b border-gray-800">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {alumnosExamen.map((alumno, idx) => {
                    const notaInput = parseFloat(alumno.puntaje_obtenido) || 0;
                    const acumulado = parseFloat(alumno.acumulado_previo) || 0;
                    const totalProyectado = acumulado + notaInput;

                    const maxExamen =
                      Number(examenSeleccionado.puntaje_total) || 100;
                    const excede100 = totalProyectado > 100;
                    const excedeMax = notaInput > maxExamen;
                    const isError = excede100 || excedeMax;

                    return (
                      <tr
                        key={alumno.id_estudiante}
                        className={`hover:bg-gray-800/50 transition-colors ${
                          isError ? "bg-red-900/10" : ""
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                          {alumno.nombre} {alumno.apellido}
                          {isError && (
                            <ExclamationTriangleIcon
                              className="w-4 h-4 text-red-500"
                              title="Error en nota"
                            />
                          )}
                        </td>

                        <td className="px-4 py-3 text-center text-gray-500 font-mono text-xs">
                          {acumulado.toFixed(2)} pts
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max={examenSeleccionado.puntaje_total}
                            value={alumno.puntaje_obtenido}
                            onChange={(e) => {
                              const list = [...alumnosExamen];
                              list[idx].puntaje_obtenido = e.target.value;
                              setAlumnosExamen(list);
                            }}
                            className={`w-full border rounded-lg p-2 text-center font-bold focus:outline-none transition-all
                                                    ${
                                                      isError
                                                        ? "bg-red-900/20 border-red-500 text-red-400 focus:ring-1 focus:ring-red-500"
                                                        : "bg-gray-950 border-gray-700 text-white focus:border-emerald-500"
                                                    }
                                                `}
                          />
                        </td>

                        <td className="px-4 py-3 text-center font-bold">
                          <span
                            className={`${
                              excede100 ? "text-red-500" : "text-emerald-400"
                            }`}
                          >
                            {totalProyectado.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-600 block">
                            / 100
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={alumno.observaciones || ""}
                            onChange={(e) => {
                              const list = [...alumnosExamen];
                              list[idx].observaciones = e.target.value;
                              setAlumnosExamen(list);
                            }}
                            className="w-full bg-transparent border-b border-transparent hover:border-gray-700 focus:border-gray-500 outline-none text-gray-400 focus:text-white transition-colors"
                            placeholder="..."
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-5 bg-gray-950 border-t border-gray-800 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={cerrarExamen}
                    onChange={(e) => setCerrarExamen(e.target.checked)}
                  />
                  <div className="w-10 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-bold ${
                      cerrarExamen ? "text-emerald-400" : "text-gray-400"
                    }`}
                  >
                    {cerrarExamen ? "Cerrar Acta" : "Guardar Borrador"}
                  </span>
                </div>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEvaluarModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarNotas}
                  disabled={saving}
                  className={`px-6 py-2 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                    cerrarExamen
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/30"
                  }`}
                >
                  {saving ? "Procesando..." : "Guardar Notas"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamenesPage;
