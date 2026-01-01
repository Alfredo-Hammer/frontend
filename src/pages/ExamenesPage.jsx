import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
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
} from "@heroicons/react/24/outline";

function ExamenesPage() {
  const token = localStorage.getItem("token");
  const normalizeArray = (value) => {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    return [];
  };

  const toIntOrNull = (value) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  };

  // ========== ESTADOS ==========
  const [examenes, setExamenes] = useState([]);
  const [examenDetalle, setExamenDetalle] = useState(null);
  const [combos, setCombos] = useState({
    grados: [],
    secciones: [],
    materias: [],
    profesores: [],
  });
  const [saving, setSaving] = useState(false);

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [showEvaluarModal, setShowEvaluarModal] = useState(false);
  const [showVerModal, setShowVerModal] = useState(false);

  // Datos de Edición/Evaluación
  const [examenSeleccionado, setExamenSeleccionado] = useState(null);
  const [alumnosExamen, setAlumnosExamen] = useState([]);
  const [editId, setEditId] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({tipo: "", estado: "", materia: ""});

  // User Context
  const [user, setUser] = useState(null);
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
    duration: 4000,
  });

  const showToast = (message, type = "success", duration = 4000) => {
    setToast({show: true, message, type, duration});
  };

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    type: "warning",
    loading: false,
    onConfirm: null,
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
    tipo_examen: "parcial", // Default
    estado: "borrador",
    bimestre: "1",
  });

  // ========== CARGA INICIAL ==========
  useEffect(() => {
    fetchUserAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showModal) return;

    const id_grado = formData.id_grado;
    const id_seccion = formData.id_seccion;

    // Para evitar lista generalizada: si no hay grado/sección, no mostramos materias.
    if (!id_grado || !id_seccion) {
      setCombos((prev) => ({...prev, materias: []}));
      return;
    }

    const fetchMateriasPorClase = async () => {
      try {
        const res = await api.get("/api/materias", {
          params: {
            id_grado,
            id_seccion,
          },
        });
        const materias = normalizeArray(res.data);
        setCombos((prev) => ({...prev, materias}));

        // Si la materia seleccionada ya no está disponible, la limpiamos.
        if (
          formData.id_materia &&
          !materias.some(
            (m) => String(m.id_materia) === String(formData.id_materia)
          )
        ) {
          setFormData((prev) => ({...prev, id_materia: ""}));
        }
      } catch (error) {
        console.error("Error cargando materias filtradas", error);
        setCombos((prev) => ({...prev, materias: []}));
      }
    };

    fetchMateriasPorClase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, formData.id_grado, formData.id_seccion]);

  const fetchUserAndData = async () => {
    try {
      const userRes = await api.get("/api/usuarios/perfil");
      const usuario = userRes.data.usuario || userRes.data;
      setUser(usuario);

      // Si es alumno, obtener su contexto (grado/sección actual)
      let alumnoDataLocal = null;
      if (usuario?.rol?.toLowerCase() === "alumno") {
        try {
          const infoRes = await api.get(
            `/api/calificaciones/alumno-info/${usuario.id_usuario}`
          );
          setAlumnoInfo(infoRes.data);
          alumnoDataLocal = infoRes.data;
        } catch (e) {
          console.error("Error obteniendo info del alumno", e);
        }
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

      fetchExamenes(usuario, alumnoDataLocal);
    } catch (error) {
      console.error("Error cargando datos iniciales", error);
    }
  };

  // Filtrar lista de exámenes por grado(s) y sección(es) del alumno
  const filtrarExamenesPorAlumno = (lista, info) => {
    if (!info) return [];
    const gradeIds = [];
    const sectionIds = [];

    if (info.id_grado) gradeIds.push(String(info.id_grado));
    if (Array.isArray(info.grados)) {
      info.grados.forEach((g) => gradeIds.push(String(g.id_grado || g)));
    }
    if (info.id_seccion) sectionIds.push(String(info.id_seccion));
    if (Array.isArray(info.secciones)) {
      info.secciones.forEach((s) => sectionIds.push(String(s.id_seccion || s)));
    }

    const uniqueGrades = [...new Set(gradeIds)].filter(Boolean);
    const uniqueSections = [...new Set(sectionIds)].filter(Boolean);

    const coincideGrado = (e) =>
      uniqueGrades.length === 0 || uniqueGrades.includes(String(e.id_grado));
    const coincideSeccion = (e) =>
      uniqueSections.length === 0 ||
      uniqueSections.includes(String(e.id_seccion));

    // Mostrar todos los exámenes del/los grado(s) y sección(es) del alumno
    return lista.filter((e) => coincideGrado(e) && coincideSeccion(e));
  };

  // Ordenar exámenes: primero activos y próximos, luego por fecha ascendente
  const ordenarExamenesParaAlumno = (lista) => {
    const ahora = new Date();
    const toDate = (d) => (d ? new Date(d) : new Date(0));
    return [...lista].sort((a, b) => {
      const aFecha = toDate(a.fecha_examen);
      const bFecha = toDate(b.fecha_examen);
      const aActivo = String(a.estado).toLowerCase() === "activo";
      const bActivo = String(b.estado).toLowerCase() === "activo";
      const aProximo = aActivo && aFecha >= ahora;
      const bProximo = bActivo && bFecha >= ahora;

      // Prioridad: próximos activos > activos pasados > otros estados
      if (aProximo !== bProximo) return bProximo - aProximo;
      if (aActivo !== bActivo) return bActivo - aActivo;

      // Luego ordenar por fecha ascendente
      return aFecha - bFecha;
    });
  };

  const fetchExamenes = async (usuarioCtx = user, alumnoCtx = alumnoInfo) => {
    try {
      const res = await api.get("/api/examenes", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const lista = normalizeArray(res.data);
      if (usuarioCtx?.rol?.toLowerCase() === "alumno") {
        const propios = filtrarExamenesPorAlumno(lista, alumnoCtx);
        const ordenados = ordenarExamenesParaAlumno(propios);
        setExamenes(ordenados);
      } else {
        setExamenes(lista);
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error cargando exámenes");
    }
  };

  // Reconsultar exámenes cuando el contexto del alumno esté disponible
  useEffect(() => {
    if (user?.rol?.toLowerCase() === "alumno" && alumnoInfo) {
      fetchExamenes(user, alumnoInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoInfo]);

  // ========== LÓGICA DE GESTIÓN ==========

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        id_materia: toIntOrNull(formData.id_materia),
        id_grado: toIntOrNull(formData.id_grado),
        id_seccion: toIntOrNull(formData.id_seccion),
        id_profesor: toIntOrNull(formData.id_profesor),
        duracion_minutos: toIntOrNull(formData.duracion_minutos),
        puntaje_total: toIntOrNull(formData.puntaje_total),
        bimestre: toIntOrNull(formData.bimestre),
      };

      if (user?.rol?.toLowerCase() === "profesor") {
        payload.id_profesor = user.id_profesor;
      } else {
        if (!payload.id_profesor) {
          setMensaje("Debe seleccionar un profesor");
          setSaving(false);
          return;
        }
      }

      if (editId) {
        await api.put(`/api/examenes/${editId}`, payload);
        setMensaje("Examen actualizado exitosamente");
      } else {
        await api.post("/api/examenes", payload);
        setMensaje("Examen creado exitosamente");
      }

      fetchExamenes();
      closeModal();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Error al guardar el examen";
      setMensaje(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      open: true,
      title: "Eliminar examen",
      message:
        "¿Seguro que deseas eliminar este examen? Se perderán las notas asociadas.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger",
      loading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({...prev, loading: true}));
        try {
          await api.delete(`/api/examenes/${id}`);
          fetchExamenes();
          setMensaje("Examen eliminado");
          setConfirmModal((prev) => ({...prev, open: false, loading: false}));
        } catch (error) {
          setMensaje("Error eliminando examen");
          setConfirmModal((prev) => ({...prev, loading: false}));
        }
      },
    });
  };

  // ========== LÓGICA DE EVALUACIÓN ==========

  const abrirEvaluacion = async (examen) => {
    setExamenSeleccionado(examen);
    setShowEvaluarModal(true);
    try {
      const res = await api.get(`/api/examenes/${examen.id_examen}/alumnos`);
      // El backend ya devuelve acumulado_previo correctamente calculado
      const alumnosProcesados = res.data.map((a) => ({
        ...a,
        puntaje_obtenido: a.puntaje_obtenido || 0,
      }));
      setAlumnosExamen(alumnosProcesados);
    } catch (error) {
      setMensaje("Error cargando lista de estudiantes");
      setShowEvaluarModal(false);
    }
  };

  const abrirVerExamen = async (examen) => {
    try {
      const res = await api.get(`/api/examenes/${examen.id_examen}`);
      setExamenDetalle(res.data);
      setShowVerModal(true);
    } catch (error) {
      const msg = error.response?.data?.error || "Error cargando examen";
      setMensaje(msg);
      showToast(msg, "error");
    }
  };

  const handleGuardarNotas = async () => {
    const maxExamenRaw = Number(examenSeleccionado?.puntaje_total);
    const maxExamen = Number.isFinite(maxExamenRaw) ? maxExamenRaw : 100;

    // Validación Global antes de enviar: ¿Alguien supera 100?
    const excedeBimestre = alumnosExamen.some(
      (a) => a.acumulado_previo + parseFloat(a.puntaje_obtenido || 0) > 100
    );

    const excedeExamen = alumnosExamen.some(
      (a) => parseFloat(a.puntaje_obtenido || 0) > maxExamen
    );

    if (excedeExamen) {
      showToast(
        `Uno o más estudiantes exceden el puntaje máximo del examen (${maxExamen}).`,
        "warning"
      );
      return;
    }

    if (excedeBimestre) {
      showToast(
        "Uno o más estudiantes superan los 100 puntos totales. Verifique las notas en rojo.",
        "warning"
      );
      return;
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
        bimestre_objetivo: examenSeleccionado.bimestre,
      };

      await api.post(
        `/api/examenes/${examenSeleccionado.id_examen}/calificar`,
        payload
      );

      setMensaje(
        `Notas guardadas y sincronizadas con el Bimestre ${examenSeleccionado.bimestre}`
      );
      setShowEvaluarModal(false);
      fetchExamenes();
    } catch (error) {
      setMensaje("Error guardando notas");
    } finally {
      setSaving(false);
    }
  };

  // ========== UTILIDADES UI ==========
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
      bimestre: "1",
    });
  };

  const handleNotaChange = (index, val) => {
    const nuevos = [...alumnosExamen];
    let v = parseFloat(val);

    const maxExamenRaw = Number(examenSeleccionado?.puntaje_total);
    const maxExamen = Number.isFinite(maxExamenRaw) ? maxExamenRaw : 100;

    // Validación 1: No NaN
    if (isNaN(v)) v = 0;

    // Validación 2: Rango Físico (Input)
    if (v > maxExamen) v = maxExamen;
    if (v < 0) v = 0;

    nuevos[index].puntaje_obtenido = v;
    setAlumnosExamen(nuevos);
  };

  // Filtrado
  const examenesFiltrados = examenes.filter((ex) => {
    const matchText = ex.titulo
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchTipo = filtros.tipo ? ex.tipo_examen === filtros.tipo : true;
    const matchEstado = filtros.estado ? ex.estado === filtros.estado : true;
    return matchText && matchTipo && matchEstado;
  });

  const headerStats = [
    {
      label: "Total Evaluaciones",
      value: examenes.length,
      color: "from-blue-500 to-indigo-600",
      icon: ClipboardDocumentCheckIcon,
    },
    {
      label: "Borradores",
      value: examenes.filter((e) => e.estado === "borrador").length,
      color: "from-amber-500 to-orange-600",
      icon: PencilSquareIcon,
    },
    {
      label: "Tipos de Examen",
      value: [...new Set(examenes.map((e) => e.tipo_examen))].length,
      color: "from-purple-500 to-violet-600",
      icon: BeakerIcon,
    },
    {
      label: "Materias Evaluadas",
      value: [...new Set(examenes.map((e) => e.id_materia))].length,
      color: "from-emerald-500 to-teal-600",
      icon: CheckCircleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast((prev) => ({...prev, show: false}))}
        />
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() =>
          setConfirmModal((prev) => ({
            ...prev,
            open: false,
            loading: false,
            onConfirm: null,
          }))
        }
      />

      <PageHeader
        title="Gestión de Evaluaciones"
        subtitle="Control de notas y exámenes"
        icon={ClipboardDocumentCheckIcon}
        stats={headerStats}
        actions={
          (user?.rol === "admin" || user?.rol === "profesor") && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium rounded-xl shadow-lg transition-transform hover:scale-105"
            >
              <PlusIcon className="w-5 h-5" />
              Nuevo Examen
            </button>
          )
        }
      />

      {/* --- MENSAJES --- */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-pulse ${
            mensaje.includes("Error")
              ? "bg-red-900/50 text-red-200 border border-red-700"
              : "bg-green-900/50 text-green-200 border border-green-700"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* --- FILTROS --- */}
      {user?.rol !== "alumno" && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
            />
          </div>

          <select
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
            value={filtros.tipo}
            onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
          >
            <option value="">Todos los Tipos</option>
            <option value="acumulativo">Acumulativo</option>
            <option value="sistematico">Sistemático</option>
            <option value="parcial">Parcial</option>
            <option value="rescate">Rescate</option>
            <option value="especial">Especial</option>
            <option value="reparacion">Reparación</option>
          </select>

          <select
            className="bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white"
            value={filtros.estado}
            onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
          >
            <option value="">Todos los Estados</option>
            <option value="borrador">Borrador</option>
            <option value="activo">Activo</option>
            <option value="finalizado">Finalizado</option>
          </select>
        </div>
      )}

      {/* --- GRID DE EXAMENES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examenesFiltrados.map((examen) => {
          const ahora = new Date();
          const fecha = new Date(examen.fecha_examen);
          const soon =
            String(examen.estado).toLowerCase() === "activo" &&
            fecha - ahora >= 0 &&
            fecha - ahora <= 24 * 60 * 60 * 1000;
          return (
            <div
              key={examen.id_examen}
              className={`bg-gray-800 border ${
                soon ? "border-orange-500/60" : "border-gray-700"
              } rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all group shadow-lg`}
            >
              {/* Header Card con Colores según tipo examen */}
              <div
                className={`p-4 ${
                  examen.tipo_examen === "rescate" ||
                  examen.tipo_examen === "reparacion"
                    ? "bg-red-900/20 border-b border-red-800"
                    : "bg-gray-800 border-b border-gray-700"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                      examen.tipo_examen === "parcial"
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : examen.tipo_examen === "acumulativo"
                        ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {examen.tipo_examen}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-mono bg-gray-900 px-2 py-1 rounded">
                      Bimestre {examen.bimestre}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                        String(examen.estado).toLowerCase() === "activo"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : String(examen.estado).toLowerCase() === "finalizado"
                          ? "bg-gray-500/10 text-gray-300 border-gray-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      }`}
                    >
                      {examen.estado}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mt-2 truncate">
                  {examen.titulo}
                </h3>
                <p className="text-sm text-cyan-400 font-medium">
                  {examen.nombre_materia}
                </p>
              </div>

              {/* Body Card */}
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" /> {examen.duracion_minutos}{" "}
                    min
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="w-4 h-4" />{" "}
                    {examen.puntaje_total} pts
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    {new Date(examen.fecha_examen).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    {new Date(examen.fecha_examen).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
                <div className="text-xs text-gray-500 bg-gray-900/50 p-2 rounded">
                  {examen.nombre_grado} - {examen.nombre_seccion}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 flex gap-2">
                {user?.rol !== "alumno" ? (
                  <>
                    <button
                      onClick={() => abrirEvaluacion(examen)}
                      className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 
                        ${
                          examen.estado !== "finalizado"
                            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                            : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                    >
                      <BeakerIcon className="w-4 h-4" />{" "}
                      {examen.estado !== "finalizado" ? "Evaluar" : "Ver Notas"}
                    </button>
                    {(user?.rol === "admin" || user?.rol === "profesor") && (
                      <>
                        <button
                          onClick={() => {
                            setEditId(examen.id_examen);
                            setFormData({...examen});
                            setShowModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(examen.id_examen)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => abrirVerExamen(examen)}
                    className="flex-1 py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    <EyeIcon className="w-4 h-4" /> Ver Examen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL CREAR/EDITAR --- */}
      {showModal && user?.rol !== "alumno" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 bg-gray-900/50">
              <h2 className="text-xl font-bold text-white">
                {editId ? "Editar Evaluación" : "Programar Nueva Evaluación"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Campos comunes Título, Grado, Sección... se mantienen igual que tu código original */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">
                    Título
                  </label>
                  <input
                    required
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({...formData, titulo: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none"
                    placeholder="Ej: Prueba Sistemática #1"
                  />
                </div>
                {/* ... (Aquí van Grado, Sección, Materia y Bimestre igual que antes) ... */}

                {/* Selector TIPO DE EXAMEN (NICARAGUA) */}
                <div className="col-span-1">
                  <label className="text-xs text-cyan-400 font-bold mb-1 block">
                    Tipo de Evaluación
                  </label>
                  <select
                    required
                    value={formData.tipo_examen}
                    onChange={(e) =>
                      setFormData({...formData, tipo_examen: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-white font-medium"
                  >
                    <option value="acumulativo">
                      Acumulativo (Tarea/Trabajo)
                    </option>
                    <option value="sistematico">Prueba Sistemática</option>
                    <option value="parcial">Examen Parcial</option>
                    <option value="rescate">Examen de Rescate</option>
                    <option value="especial">Examen Especial</option>
                    <option value="reparacion">Examen de Reparación</option>
                  </select>
                </div>

                {/* ... (Fecha y Estado igual que antes) ... */}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Grado
                  </label>
                  <select
                    required
                    value={formData.id_grado}
                    onChange={(e) => {
                      const nuevoGrado = e.target.value;
                      setFormData({
                        ...formData,
                        id_grado: nuevoGrado,
                        id_seccion: "",
                        id_materia: "",
                      });
                    }}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccione...</option>
                    {combos.grados.map((g) => (
                      <option key={g.id_grado} value={g.id_grado}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Sección
                  </label>
                  <select
                    required
                    value={formData.id_seccion}
                    onChange={(e) => {
                      const nuevaSeccion = e.target.value;
                      setFormData({
                        ...formData,
                        id_seccion: nuevaSeccion,
                        id_materia: "",
                      });
                    }}
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccione...</option>
                    {normalizeArray(combos.secciones)
                      .filter(
                        (s) => String(s.id_grado) === String(formData.id_grado)
                      )
                      .map((s) => (
                        <option key={s.id_seccion} value={s.id_seccion}>
                          {s.nombre}
                        </option>
                      ))}
                  </select>
                </div>

                {user?.rol?.toLowerCase() !== "profesor" && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">
                      Profesor
                    </label>
                    <select
                      required
                      value={formData.id_profesor}
                      onChange={(e) =>
                        setFormData({...formData, id_profesor: e.target.value})
                      }
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Seleccione...</option>
                      {normalizeArray(combos.profesores)
                        .filter((p) => p?.id_profesor)
                        .map((p) => (
                          <option key={p.id_profesor} value={p.id_profesor}>
                            {(p.nombre || "") + " " + (p.apellido || "")}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Materia
                  </label>
                  <select
                    required
                    value={formData.id_materia}
                    onChange={(e) =>
                      setFormData({...formData, id_materia: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="">Seleccione...</option>
                    {normalizeArray(combos.materias).map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Puntaje total del examen
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={formData.puntaje_total}
                    onChange={(e) =>
                      setFormData({...formData, puntaje_total: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Ej: 100"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.duracion_minutos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duracion_minutos: e.target.value,
                      })
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="Ej: 60"
                  />
                </div>
                <div>
                  <label className="text-xs text-cyan-400 font-bold mb-1 block">
                    Bimestre
                  </label>
                  <select
                    required
                    value={formData.bimestre}
                    onChange={(e) =>
                      setFormData({...formData, bimestre: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-white font-medium"
                  >
                    <option value="1">I Bimestre</option>
                    <option value="2">II Bimestre</option>
                    <option value="3">III Bimestre</option>
                    <option value="4">IV Bimestre</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Fecha
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.fecha_examen}
                    onChange={(e) =>
                      setFormData({...formData, fecha_examen: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Estado
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) =>
                      setFormData({...formData, estado: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="activo">Activo</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-400 hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  disabled={saving}
                  type="submit"
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EVALUAR (CON VALIDACIONES) --- */}
      {showEvaluarModal && examenSeleccionado && user?.rol !== "alumno" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-5xl border border-gray-700 shadow-2xl flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-900 to-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BeakerIcon className="w-8 h-8 text-cyan-400" />
                  Evaluación de Examen
                </h2>
                <div className="flex gap-4 text-sm mt-2">
                  <span className="px-3 py-1 bg-cyan-600/20 text-cyan-300 rounded-lg font-bold border border-cyan-600/30">
                    {examenSeleccionado.bimestre === 1 && "I Bimestre"}
                    {examenSeleccionado.bimestre === 2 && "II Bimestre"}
                    {examenSeleccionado.bimestre === 3 && "III Bimestre"}
                    {examenSeleccionado.bimestre === 4 && "IV Bimestre"}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300">
                    {examenSeleccionado.titulo}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-400">
                    Puntaje máximo: {examenSeleccionado.puntaje_total} pts
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  <span className="text-gray-300 font-medium">
                    {user?.escuela_nombre || ""}
                  </span>
                  <span className="mx-2 text-gray-600">|</span>
                  <span>
                    {examenSeleccionado.nombre_grado} -{" "}
                    {examenSeleccionado.nombre_seccion}
                  </span>
                  <span className="mx-2 text-gray-600">|</span>
                  <span>{examenSeleccionado.nombre_materia || "Materia"}</span>
                  <span className="mx-2 text-gray-600">|</span>
                  <span>
                    Año lectivo{" "}
                    {new Date(examenSeleccionado.fecha_examen).getFullYear()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowEvaluarModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Alerta informativa */}
              <div className="mb-4 bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 flex items-start gap-3">
                <div className="text-blue-400 mt-0.5">ℹ️</div>
                <div className="text-sm text-blue-200">
                  <strong>
                    Captura rápida para{" "}
                    {examenSeleccionado.bimestre === 1 && "I Bimestre"}
                    {examenSeleccionado.bimestre === 2 && "II Bimestre"}
                    {examenSeleccionado.bimestre === 3 && "III Bimestre"}
                    {examenSeleccionado.bimestre === 4 && "IV Bimestre"}:
                  </strong>{" "}
                  El "Acumulado Previo" muestra los puntos que el estudiante ya
                  tiene en este bimestre. El sistema no permitirá que el total
                  exceda 100 puntos.
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full">
                  <thead className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        Estudiante
                      </th>
                      <th className="px-4 py-4 text-center font-semibold">
                        Acumulado Previo
                        <br />
                        <span className="text-[10px] text-gray-500 normal-case">
                          (Bimestre {examenSeleccionado.bimestre})
                        </span>
                      </th>
                      <th className="px-4 py-4 text-center w-32 font-semibold">
                        Calificación
                        <br />
                        <span className="text-[10px] text-gray-500 normal-case">
                          (Este examen)
                        </span>
                      </th>
                      <th className="px-4 py-4 text-center font-semibold">
                        Total Proyectado
                        <br />
                        <span className="text-[10px] text-gray-500 normal-case">
                          (Acum. + Nueva)
                        </span>
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Observaciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {alumnosExamen.map((alumno, idx) => {
                      const nota = parseFloat(alumno.puntaje_obtenido) || 0;
                      const maxExamenRaw = Number(
                        examenSeleccionado?.puntaje_total
                      );
                      const maxExamen = Number.isFinite(maxExamenRaw)
                        ? maxExamenRaw
                        : 100;
                      const acumuladoPrevio =
                        parseFloat(alumno.acumulado_previo) || 0;
                      const totalProyectado = acumuladoPrevio + nota;
                      const excedeExamen = nota > maxExamen;
                      const excedeBimestre = totalProyectado > 100;
                      const esError = excedeExamen || excedeBimestre;

                      // Determinar estado del acumulado previo
                      const estadoAcumulado =
                        acumuladoPrevio >= 60 ? "aprobado" : "riesgo";

                      return (
                        <tr
                          key={alumno.id_estudiante}
                          className={`hover:bg-gray-800/50 transition-colors ${
                            esError
                              ? "bg-red-900/10 border-l-4 border-red-600"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white text-sm">
                              {alumno.nombre} {alumno.apellido}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div
                              className={`text-lg font-bold ${
                                estadoAcumulado === "aprobado"
                                  ? "text-emerald-400"
                                  : "text-yellow-500"
                              }`}
                            >
                              {acumuladoPrevio.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-1">
                              de 100 pts
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min={0}
                              max={maxExamen}
                              step="0.01"
                              value={alumno.puntaje_obtenido}
                              onChange={(e) =>
                                handleNotaChange(idx, e.target.value)
                              }
                              placeholder="0.00"
                              className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 transition-all
                              ${
                                excedeExamen
                                  ? "border-red-500 text-red-400 focus:ring-red-500"
                                  : "border-gray-600 text-cyan-400 focus:ring-cyan-500"
                              }
                              ${
                                esError
                                  ? "ring-2 ring-red-600 animate-pulse"
                                  : ""
                              }
                            `}
                            />
                            <div className="mt-1 text-[10px] text-gray-500 text-center">
                              Máx. {maxExamen} pts
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div
                              className={`text-2xl font-bold ${
                                excedeBimestre
                                  ? "text-red-500"
                                  : totalProyectado >= 60
                                  ? "text-green-400"
                                  : "text-red-500"
                              }`}
                            >
                              {totalProyectado.toFixed(2)}
                            </div>
                            <div className="text-[10px] mt-1">
                              {excedeBimestre ? (
                                <span className="text-red-400 font-semibold">
                                  ⚠️ Excede 100 pts
                                </span>
                              ) : excedeExamen ? (
                                <span className="text-red-400 font-semibold">
                                  ⚠️ Excede máx. examen
                                </span>
                              ) : totalProyectado >= 60 ? (
                                <span className="text-green-400">
                                  ✓ Aprobado
                                </span>
                              ) : (
                                <span className="text-red-500">
                                  Reprobado (&lt;60)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              value={alumno.observaciones || ""}
                              onChange={(e) => {
                                const n = [...alumnosExamen];
                                n[idx].observaciones = e.target.value;
                                setAlumnosExamen(n);
                              }}
                              placeholder="Comentarios opcionales..."
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 bg-gray-900/50 flex justify-end gap-3">
              <button
                onClick={() => setShowEvaluarModal(false)}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarNotas}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20"
              >
                {saving ? "Procesando..." : "Guardar Notas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL VER EXAMEN (ALUMNO SOLO LECTURA) --- */}
      {showVerModal && examenDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl w-full max-w-3xl border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {examenDetalle.titulo}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {examenDetalle.materia_nombre} •{" "}
                  {examenDetalle.seccion_nombre}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(examenDetalle.fecha_examen).toLocaleString()} •{" "}
                  {examenDetalle.duracion_minutos} min • Máx{" "}
                  {examenDetalle.puntaje_total} pts
                </p>
              </div>
              <button
                onClick={() => setShowVerModal(false)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
              >
                <XCircleIcon className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {examenDetalle.descripcion && (
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-300">
                  {examenDetalle.descripcion}
                </div>
              )}
              <div className="bg-gray-900 border border-gray-700 rounded-lg">
                <div className="p-4 border-b border-gray-700 text-gray-400 text-sm">
                  Preguntas
                </div>
                <ul className="divide-y divide-gray-800">
                  {(examenDetalle.preguntas || []).map((p, idx) => (
                    <li key={idx} className="p-4">
                      <div className="text-white font-medium">
                        {idx + 1}. {p.enunciado}
                      </div>
                      {Array.isArray(p.opciones) && p.opciones.length > 0 && (
                        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.opciones.map((op, i) => (
                            <li
                              key={i}
                              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-300"
                            >
                              {op}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-xs text-gray-500">
                Nota: Esta vista es solo de lectura. No puedes editar ni
                eliminar el examen.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamenesPage;
