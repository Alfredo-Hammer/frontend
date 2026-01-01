import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import {
  PlusIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
  UserCircleIcon,
  BookOpenIcon,
  FunnelIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

function CargaAcademica() {
  // ========== Estados ==========
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [cargasAcademicas, setCargasAcademicas] = useState([]);
  const [cargasFiltradas, setCargasFiltradas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);

  // Filtros de visualización (opcionales)
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");

  // Estados del modal de creación
  const [gradoModal, setGradoModal] = useState("");
  const [seccionModal, setSeccionModal] = useState("");
  const [seccionesFiltradas, setSeccionesFiltradas] = useState([]);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCarga, setEditingCarga] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmModal, setConfirmModal] = useState({show: false});

  // Formulario
  const [formData, setFormData] = useState({
    id_materia: "",
    id_profesor: "",
    dia_semana: "",
    hora_inicio: "",
    hora_fin: "",
  });

  const token = localStorage.getItem("token");

  // ========== Efectos ==========

  // 1. Cargar todos los datos al iniciar
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setIsLoading(true);

        // Cargar Grados, Secciones y TODAS las Cargas Académicas
        const [resGrados, resSecciones, resCargasAcademicas] =
          await Promise.all([
            api.get(services.grados, {
              headers: {Authorization: `Bearer ${token}`},
            }),
            api.get(services.secciones, {
              headers: {Authorization: `Bearer ${token}`},
            }),
            api.get(services.cargaAcademica, {
              headers: {Authorization: `Bearer ${token}`},
            }),
          ]);

        const gradosData = resGrados.data?.data || resGrados.data || [];
        const seccionesData =
          resSecciones.data?.data || resSecciones.data || [];
        const cargasData =
          resCargasAcademicas.data?.data || resCargasAcademicas.data || [];

        setGrados(Array.isArray(gradosData) ? gradosData : []);
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
        setCargasAcademicas(Array.isArray(cargasData) ? cargasData : []);
        setCargasFiltradas(Array.isArray(cargasData) ? cargasData : []);
      } catch (error) {
        console.error(error);
        showToast("Error cargando datos iniciales", "error");
      } finally {
        setIsLoading(false);
      }
    };
    cargarDatosIniciales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Aplicar filtros de visualización
  useEffect(() => {
    let resultado = [...cargasAcademicas];

    if (filtroGrado) {
      resultado = resultado.filter(
        (c) => String(c.id_grado) === String(filtroGrado)
      );
    }

    if (filtroSeccion) {
      resultado = resultado.filter(
        (c) => String(c.id_seccion) === String(filtroSeccion)
      );
    }

    setCargasFiltradas(resultado);
  }, [filtroGrado, filtroSeccion, cargasAcademicas]);

  // 3. Filtrar secciones en el modal cuando cambia el grado
  useEffect(() => {
    if (gradoModal) {
      const filtradas = secciones.filter(
        (s) => String(s.id_grado) === String(gradoModal)
      );
      setSeccionesFiltradas(filtradas);
    } else {
      setSeccionesFiltradas([]);
    }
    setSeccionModal("");
  }, [gradoModal, secciones]);

  // ========== Funciones de Datos ==========

  const recargarCargasAcademicas = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(services.cargaAcademica, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const cargasData = res.data?.data || res.data || [];
      setCargasAcademicas(Array.isArray(cargasData) ? cargasData : []);
      setCargasFiltradas(Array.isArray(cargasData) ? cargasData : []);
    } catch (error) {
      console.error(error);
      showToast("Error recargando cargas académicas", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    // Cargar materias y profesores solo cuando se abre el modal (Optimización)
    if (materias.length > 0 && profesores.length > 0) return;

    try {
      const [resMaterias, resProfes] = await Promise.all([
        api.get(services.materias, {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get(services.profesores, {
          headers: {Authorization: `Bearer ${token}`},
        }),
      ]);
      // Backend devuelve { success: true, data: [...] }
      const materiasData = resMaterias.data?.data || resMaterias.data || [];
      const profesoresData = resProfes.data?.data || resProfes.data || [];
      setMaterias(Array.isArray(materiasData) ? materiasData : []);
      setProfesores(Array.isArray(profesoresData) ? profesoresData : []);
    } catch (error) {
      showToast("Error cargando catálogos", "error");
    }
  };

  // ========== Handlers ==========

  const handleOpenModal = async () => {
    await cargarCatalogos();
    // Resetear valores del modal
    setGradoModal("");
    setSeccionModal("");
    setFormData({
      id_materia: "",
      id_profesor: "",
      dia_semana: "",
      hora_inicio: "",
      hora_fin: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que se haya seleccionado grado y sección
    if (!gradoModal || !seccionModal) {
      showToast("Debes seleccionar grado y sección", "warning");
      return;
    }

    // Validar horario si se proporciona algún campo
    if (formData.dia_semana || formData.hora_inicio || formData.hora_fin) {
      if (!formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
        showToast(
          "Si asignas horario, completa día, hora inicio y hora fin",
          "error"
        );
        return;
      }

      if (formData.hora_fin <= formData.hora_inicio) {
        showToast("La hora fin debe ser mayor a la hora inicio", "error");
        return;
      }
    }

    try {
      await api.post(
        services.cargaAcademica,
        {
          id_seccion: Number(seccionModal),
          id_materia: Number(formData.id_materia),
          id_profesor: Number(formData.id_profesor),
          dia_semana: formData.dia_semana ? Number(formData.dia_semana) : null,
          hora_inicio: formData.hora_inicio || null,
          hora_fin: formData.hora_fin || null,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      showToast("Asignación creada correctamente", "success");
      setShowModal(false);
      setGradoModal("");
      setSeccionModal("");
      setFormData({
        id_materia: "",
        id_profesor: "",
        dia_semana: "",
        hora_inicio: "",
        hora_fin: "",
      });
      recargarCargasAcademicas();
    } catch (error) {
      const msg = error.response?.data?.message || "Error al asignar";
      showToast(msg, "error");
    }
  };

  const handleEdit = async (carga) => {
    await cargarCatalogos();
    setEditingCarga(carga);
    setFormData({
      id_materia: carga.id_materia,
      id_profesor: carga.id_profesor,
      dia_semana: carga.dia_semana || "",
      hora_inicio: carga.hora_inicio || "",
      hora_fin: carga.hora_fin || "",
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Validar horario si se proporciona
    if (formData.dia_semana || formData.hora_inicio || formData.hora_fin) {
      if (!formData.dia_semana || !formData.hora_inicio || !formData.hora_fin) {
        showToast(
          "Si actualizas el horario, completa día, hora inicio y hora fin",
          "error"
        );
        return;
      }

      if (formData.hora_fin <= formData.hora_inicio) {
        showToast("La hora fin debe ser mayor a la hora inicio", "error");
        return;
      }
    }

    try {
      const response = await api.put(
        services.cargaAcademicaPorId(editingCarga.id_carga),
        {
          id_materia: Number(formData.id_materia),
          id_profesor: Number(formData.id_profesor),
          dia_semana: formData.dia_semana ? Number(formData.dia_semana) : null,
          hora_inicio: formData.hora_inicio || null,
          hora_fin: formData.hora_fin || null,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      console.log("Respuesta del backend:", response.data);

      // Cerrar modal y limpiar formulario
      setShowEditModal(false);
      setEditingCarga(null);
      setFormData({
        id_materia: "",
        id_profesor: "",
        dia_semana: "",
        hora_inicio: "",
        hora_fin: "",
      });

      // Recargar datos
      await recargarCargasAcademicas();

      // Mostrar mensaje de éxito
      showToast("Carga académica actualizada correctamente", "success");
    } catch (error) {
      console.error("Error al actualizar:", error);
      const msg = error.response?.data?.message || "Error al actualizar";
      showToast(msg, "error");
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({
      show: true,
      title: "Eliminar Asignación",
      message:
        "¿Estás seguro? El profesor dejará de tener acceso a esta clase.",
      type: "danger",
      onConfirm: async () => {
        try {
          await api.delete(services.cargaAcademicaPorId(id), {
            headers: {Authorization: `Bearer ${token}`},
          });
          showToast("Eliminado correctamente", "success");
          setConfirmModal({show: false});
          recargarCargasAcademicas();
        } catch (error) {
          showToast("Error al eliminar", "error");
        }
      },
    });
  };

  const showToast = (msg, type) => {
    setToast({show: true, message: msg, type});
    setTimeout(() => setToast({...toast, show: false}), 3000);
  };

  // ========== Renderizado ==========
  const totalProfesoresAsignados = new Set(
    cargasAcademicas.map((c) => c.id_profesor)
  ).size;
  const totalSeccionesAsignadas = new Set(
    cargasAcademicas.map((c) => c.id_seccion)
  ).size;

  const headerStats = {
    "Total Asignaciones": cargasAcademicas.length,
    Profesores: totalProfesoresAsignados,
    Secciones: totalSeccionesAsignadas,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title="Carga Académica"
          subtitle="Gestiona profesores, materias y horarios por sección."
          icon={BookOpenIcon}
          gradientFrom="yellow-500"
          gradientTo="orange-500"
          badge="Gestión de carga por escuela"
          stats={headerStats}
        />

        {/* TOOLBAR CON FILTROS Y BOTÓN CREAR */}
        <div className="flex items-center justify-between mb-6">
          {/* Filtros Opcionales */}
          <div className="flex items-center gap-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filtroGrado}
              onChange={(e) => setFiltroGrado(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Todos los Grados</option>
              {grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>
                  {g.nombre_grado || g.nombre}
                </option>
              ))}
            </select>

            <select
              value={filtroSeccion}
              onChange={(e) => {
                console.log("🔍 Cambiando filtro sección:", e.target.value);
                setFiltroSeccion(e.target.value);
              }}
              disabled={!filtroGrado}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Todas las Secciones</option>
              {(() => {
                const seccionesFiltradas = secciones.filter(
                  (s) =>
                    !filtroGrado || String(s.id_grado) === String(filtroGrado)
                );
                console.log(
                  "📚 Secciones disponibles para grado",
                  filtroGrado,
                  ":",
                  seccionesFiltradas
                );
                return seccionesFiltradas.map((s) => (
                  <option key={s.id_seccion} value={s.id_seccion}>
                    {s.nombre_seccion || s.nombre || `Sección ${s.id_seccion}`}
                  </option>
                ));
              })()}
            </select>

            <span className="text-sm text-gray-400">
              {cargasFiltradas.length} de {cargasAcademicas.length}
            </span>

            {isLoading && (
              <span className="text-sm text-yellow-500 animate-pulse font-medium">
                Actualizando...
              </span>
            )}
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-yellow-500/30 transition-all active:scale-95 font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Nueva Asignación
          </button>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-gray-800 rounded-2xl shadow-xl shadow-black/50 overflow-hidden border border-gray-700">
          {cargasAcademicas.length === 0 ? (
            <div className="p-16 flex flex-col items-center text-center">
              <ExclamationCircleIcon className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-lg font-medium text-white">
                Esta sección está vacía.
              </p>
              <p className="text-gray-400">
                Agrega la primera materia para comenzar el año escolar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700 text-xs uppercase tracking-wider text-gray-400 font-bold">
                    <th className="px-6 py-4">Materia</th>
                    <th className="px-6 py-4">Profesor</th>
                    <th className="px-6 py-4">Horario</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {Array.isArray(cargasAcademicas) &&
                    cargasAcademicas.map((item) => (
                      <tr
                        key={item.id_carga}
                        className="hover:bg-gray-700/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-900/40 text-purple-400 rounded-lg group-hover:bg-purple-800/50 transition-colors">
                              <BookOpenIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <span className="block font-semibold text-white">
                                {item.materia_nombre}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.materia_descripcion || "General"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                              <UserCircleIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {item.profesor_nombre}
                              </p>
                              <p className="text-xs text-yellow-500 font-medium">
                                {item.profesor_especialidad || "Docente"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {item.dia_nombre && item.horario_formato ? (
                            <div className="flex items-center gap-2 text-sm text-white bg-gradient-to-r from-green-900/40 to-emerald-900/40 px-3 py-2 rounded-lg w-fit border border-green-700">
                              <CalendarDaysIcon className="h-4 w-4 text-green-400" />
                              <span className="font-semibold text-green-300">
                                {item.dia_nombre}
                              </span>
                              <ClockIcon className="h-4 w-4 text-emerald-400" />
                              <span className="font-medium text-emerald-300">
                                {item.horario_formato}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              Sin horario asignado
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 text-gray-500 hover:text-yellow-400 hover:bg-yellow-900/20 rounded-lg transition-all"
                              title="Editar asignación"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id_carga)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all"
                              title="Eliminar asignación"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE CREACIÓN --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200 border border-gray-700">
            {/* Header Modal */}
            <div className="px-6 py-5 bg-gradient-to-r from-yellow-600 to-orange-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckBadgeIcon className="h-6 w-6 text-yellow-300" />
                Nueva Asignación de Carga Académica
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Grado
                  </label>
                  <select
                    required
                    className="w-full rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white"
                    value={gradoModal}
                    onChange={(e) => setGradoModal(e.target.value)}
                  >
                    <option value="">Seleccione grado...</option>
                    {grados.map((g) => (
                      <option key={g.id_grado} value={g.id_grado}>
                        {g.nombre_grado || g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                    Sección
                  </label>
                  <select
                    required
                    disabled={!gradoModal}
                    className="w-full rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white disabled:opacity-50"
                    value={seccionModal}
                    onChange={(e) => setSeccionModal(e.target.value)}
                  >
                    <option value="">Seleccione sección...</option>
                    {seccionesFiltradas.map((s) => (
                      <option key={s.id_seccion} value={s.id_seccion}>
                        {s.nombre_seccion || s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Materia
                </label>
                <select
                  required
                  className="w-full rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white"
                  value={formData.id_materia}
                  onChange={(e) =>
                    setFormData({...formData, id_materia: e.target.value})
                  }
                >
                  <option value="">Seleccione materia...</option>
                  {Array.isArray(materias) &&
                    materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                  Profesor Responsable
                </label>
                <div className="relative">
                  <UserCircleIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <select
                    required
                    className="w-full pl-10 rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white"
                    value={formData.id_profesor}
                    onChange={(e) =>
                      setFormData({...formData, id_profesor: e.target.value})
                    }
                  >
                    <option value="">Seleccione profesor...</option>
                    {Array.isArray(profesores) &&
                      profesores
                        .filter((p) => p.id_profesor)
                        .map((p) => (
                          <option key={p.id_usuario} value={p.id_profesor}>
                            {p.nombre} {p.apellido}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {/* Día de la Semana */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-2">
                  <CalendarDaysIcon className="h-4 w-4 text-indigo-600" />
                  Día de la Semana (opcional)
                </label>
                <select
                  className="w-full rounded-xl border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 py-2.5 bg-gray-50"
                  value={formData.dia_semana}
                  onChange={(e) =>
                    setFormData({...formData, dia_semana: e.target.value})
                  }
                >
                  <option value="">Seleccionar día</option>
                  <option value="1">Lunes</option>
                  <option value="2">Martes</option>
                  <option value="3">Miércoles</option>
                  <option value="4">Jueves</option>
                  <option value="5">Viernes</option>
                  <option value="6">Sábado</option>
                  <option value="7">Domingo</option>
                </select>
              </div>

              {/* Hora Inicio */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-green-500" />
                  Hora Inicio
                </label>
                <input
                  type="time"
                  className="w-full rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white"
                  value={formData.hora_inicio}
                  onChange={(e) =>
                    setFormData({...formData, hora_inicio: e.target.value})
                  }
                  placeholder="08:00"
                />
              </div>

              {/* Hora Fin */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5 flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-red-500" />
                  Hora Fin
                </label>
                <input
                  type="time"
                  className="w-full rounded-xl border-gray-600 focus:border-yellow-500 focus:ring-yellow-500 py-2.5 bg-gray-700 text-white"
                  value={formData.hora_fin}
                  onChange={(e) =>
                    setFormData({...formData, hora_fin: e.target.value})
                  }
                  placeholder="09:30"
                />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-gray-300 bg-gray-700 border border-gray-600 rounded-xl hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:from-yellow-600 hover:to-orange-600 font-medium shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border-2 border-gray-700">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-6 rounded-t-2xl">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <PencilIcon className="w-7 h-7" />
                Editar Carga Académica
              </h3>
              <p className="text-yellow-50 text-sm mt-1">
                Modifica la asignación de profesor y materia
              </p>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Materia */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <BookOpenIcon className="w-4 h-4 text-purple-400" />
                    Materia
                  </label>
                  <select
                    value={formData.id_materia}
                    onChange={(e) =>
                      setFormData({...formData, id_materia: e.target.value})
                    }
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all bg-gray-700 text-white"
                    required
                  >
                    <option value="">Selecciona una materia</option>
                    {materias.map((m) => (
                      <option key={m.id_materia} value={m.id_materia}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profesor */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <UserCircleIcon className="w-4 h-4 text-yellow-500" />
                    Profesor
                  </label>
                  <select
                    value={formData.id_profesor}
                    onChange={(e) =>
                      setFormData({...formData, id_profesor: e.target.value})
                    }
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all bg-gray-700 text-white"
                    required
                  >
                    <option value="">Selecciona un profesor</option>
                    {Array.isArray(profesores) &&
                      profesores
                        .filter((p) => p.id_profesor)
                        .map((p) => (
                          <option key={p.id_usuario} value={p.id_profesor}>
                            {p.nombre} {p.apellido}
                            {p.especialidad && ` - ${p.especialidad}`}
                          </option>
                        ))}
                  </select>
                </div>

                {/* Día de la Semana */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <CalendarDaysIcon className="w-4 h-4 text-orange-400" />
                    Día de la Semana
                  </label>
                  <select
                    value={formData.dia_semana}
                    onChange={(e) =>
                      setFormData({...formData, dia_semana: e.target.value})
                    }
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all bg-gray-700 text-white"
                  >
                    <option value="">Seleccionar día</option>
                    <option value="1">Lunes</option>
                    <option value="2">Martes</option>
                    <option value="3">Miércoles</option>
                    <option value="4">Jueves</option>
                    <option value="5">Viernes</option>
                    <option value="6">Sábado</option>
                    <option value="7">Domingo</option>
                  </select>
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-green-400" />
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) =>
                      setFormData({...formData, hora_inicio: e.target.value})
                    }
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all bg-gray-700 text-white"
                  />
                </div>

                {/* Hora Fin */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-red-400" />
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) =>
                      setFormData({...formData, hora_fin: e.target.value})
                    }
                    className="w-full px-4 py-3 border-2 border-gray-600 rounded-xl focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all bg-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCarga(null);
                    setFormData({
                      id_materia: "",
                      id_profesor: "",
                      dia_semana: "",
                      hora_inicio: "",
                      hora_fin: "",
                    });
                  }}
                  className="flex-1 px-4 py-2.5 text-gray-300 bg-gray-700 border border-gray-600 rounded-xl hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl hover:from-yellow-600 hover:to-orange-600 font-medium shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02]"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Componentes Globales */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}

      {confirmModal.show && (
        <ConfirmModal
          open={confirmModal.show}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText="Eliminar"
          cancelText="Cancelar"
          icon={<TrashIcon className="h-12 w-12 text-red-500 mx-auto" />}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({show: false})}
        />
      )}
    </div>
  );
}

export default CargaAcademica;
