import React, {useState, useEffect} from "react";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusCircleIcon,
  BookOpenIcon,
} from "@heroicons/react/24/solid";
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import Toast from "../components/Toast";

// Estados de asistencia
const ESTADOS_ASISTENCIA = {
  presente: {
    label: "Presente",
    color: "#10b981",
    bgColor: "#ecfdf5",
    textColor: "#065f46",
    icon: CheckCircleIcon,
  },
  ausente: {
    label: "Ausente",
    color: "#ef4444",
    bgColor: "#fef2f2",
    textColor: "#991b1b",
    icon: XCircleIcon,
  },
  tarde: {
    label: "Tarde",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    textColor: "#92400e",
    icon: ExclamationTriangleIcon,
  },
  justificado: {
    label: "Justificado",
    color: "#8b5cf6",
    bgColor: "#f3e8ff",
    textColor: "#6b21a8",
    icon: ExclamationCircleIcon,
  },
};

// Datos mock para desarrollo
const MOCK_ESTUDIANTES = [
  {
    id: 1,
    nombre: "Ana García",
    grado: "10mo A",
    codigo: "EST001",
    foto: null,
    telefono: "+1234567890",
    email: "ana.garcia@estudiante.com",
  },
  {
    id: 2,
    nombre: "Carlos López",
    grado: "10mo A",
    codigo: "EST002",
    foto: null,
    telefono: "+1234567891",
    email: "carlos.lopez@estudiante.com",
  },
  {
    id: 3,
    nombre: "María Rodríguez",
    grado: "10mo A",
    codigo: "EST003",
    foto: null,
    telefono: "+1234567892",
    email: "maria.rodriguez@estudiante.com",
  },
  {
    id: 4,
    nombre: "José Martínez",
    grado: "10mo A",
    codigo: "EST004",
    foto: null,
    telefono: "+1234567893",
    email: "jose.martinez@estudiante.com",
  },
  {
    id: 5,
    nombre: "Laura Hernández",
    grado: "11mo B",
    codigo: "EST005",
    foto: null,
    telefono: "+1234567894",
    email: "laura.hernandez@estudiante.com",
  },
];

const MOCK_ASISTENCIAS = [
  {
    id: 1,
    estudianteId: 1,
    fecha: "2024-01-15",
    estado: "presente",
    hora: "08:00",
    materia: "Matemáticas",
    profesor: "Dr. Juan Pérez",
    observaciones: "",
  },
  {
    id: 2,
    estudianteId: 2,
    fecha: "2024-01-15",
    estado: "ausente",
    hora: "08:00",
    materia: "Matemáticas",
    profesor: "Dr. Juan Pérez",
    observaciones: "Sin justificación",
  },
  {
    id: 3,
    estudianteId: 3,
    fecha: "2024-01-15",
    estado: "tarde",
    hora: "08:15",
    materia: "Matemáticas",
    profesor: "Dr. Juan Pérez",
    observaciones: "Llegó 15 minutos tarde",
  },
  {
    id: 4,
    estudianteId: 4,
    fecha: "2024-01-15",
    estado: "presente",
    hora: "08:00",
    materia: "Matemáticas",
    profesor: "Dr. Juan Pérez",
    observaciones: "",
  },
  {
    id: 5,
    estudianteId: 1,
    fecha: "2024-01-14",
    estado: "justificado",
    hora: "08:00",
    materia: "Historia",
    profesor: "Lic. María González",
    observaciones: "Cita médica",
  },
];

const MOCK_GRADOS = [
  {id: 1, nombre: "10mo A"},
  {id: 2, nombre: "10mo B"},
  {id: 3, nombre: "11mo A"},
  {id: 4, nombre: "11mo B"},
];

const MOCK_MATERIAS = [
  {id: 1, nombre: "Matemáticas"},
  {id: 2, nombre: "Historia"},
  {id: 3, nombre: "Física"},
  {id: 4, nombre: "Inglés"},
  {id: 5, nombre: "Educación Física"},
];

function Asistencia() {
  const API_BASE_URL = "http://localhost:4000";
  const [asistencias, setAsistencias] = useState([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState([]);
  const [estudiantesSinRegistro, setEstudiantesSinRegistro] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState("calendario"); // 'calendario', 'hoy', 'historica', 'estadisticas', 'registro'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [mesActual, setMesActual] = useState(new Date());
  const [asistenciasPorFecha, setAsistenciasPorFecha] = useState({});
  const [cargasAcademicas, setCargasAcademicas] = useState([]);
  const [cargaSeleccionadaId, setCargaSeleccionadaId] = useState("");
  const [filtros, setFiltros] = useState({
    grado: "",
    materia: "",
    estado: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalAsistencia, setModalAsistencia] = useState(false);
  const [asistenciaSeleccionada, setAsistenciaSeleccionada] = useState(null);
  const [modalEditarAsistencia, setModalEditarAsistencia] = useState(false);
  const [asistenciaEditar, setAsistenciaEditar] = useState(null);
  const [estadoEditado, setEstadoEditado] = useState("");
  const [observacionesEditadas, setObservacionesEditadas] = useState("");
  const [estadisticas, setEstadisticas] = useState({
    totalPresentes: 0,
    totalAusentes: 0,
    totalTardes: 0,
    totalJustificados: 0,
    porcentajeAsistencia: 0,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const mapEstadoBackendToUi = (estado) => {
    const map = {
      P: "presente",
      A: "ausente",
      T: "tarde",
      J: "justificado",
    };
    return map[estado] || estado;
  };

  const mapEstadoUiToBackend = (estado) => {
    const map = {
      presente: "P",
      ausente: "A",
      tarde: "T",
      justificado: "J",
    };
    return map[estado] || estado;
  };

  const cargaSeleccionada =
    cargasAcademicas.find(
      (c) => String(c.id_carga) === String(cargaSeleccionadaId)
    ) || null;

  // Para el selector de "Grado y sección" queremos una opción única por sección,
  // aunque internamente sigamos usando una carga académica (id_carga) como clave.
  const seccionesUnicas = [];
  const seccionesVistas = new Set();
  for (const carga of cargasAcademicas) {
    if (!carga.id_seccion) continue;
    if (seccionesVistas.has(carga.id_seccion)) continue;
    seccionesVistas.add(carga.id_seccion);
    seccionesUnicas.push(carga);
  }

  const buildLabelCarga = (carga) => {
    if (!carga) return "";
    // Mostrar principalmente Grado + Sección (sin resaltar la materia)
    const partes = [];
    if (carga.grado_nombre) partes.push(carga.grado_nombre);
    if (carga.seccion_nombre) partes.push(carga.seccion_nombre);
    return partes.join(" ");
  };

  // Cargar lista de clases (carga académica) al montar
  useEffect(() => {
    const cargarCargasAcademicas = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API_BASE_URL}/api/carga-academica`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        const data = response.data?.data || response.data || [];
        if (Array.isArray(data)) {
          setCargasAcademicas(data);
          // Si solo hay una clase, seleccionarla automáticamente
          if (data.length === 1) {
            setCargaSeleccionadaId(String(data[0].id_carga));
          }
        }
      } catch (error) {
        console.error("Error al cargar clases (carga académica):", error);
        showToast("No se pudieron cargar las clases para asistencia.", "error");
      }
    };

    cargarCargasAcademicas();
  }, []);

  // Cargar asistencias del día
  const cargarAsistencias = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({fecha: fechaSeleccionada});
      if (cargaSeleccionadaId) {
        params.append("id_carga", cargaSeleccionadaId);
      }
      const response = await axios.get(
        `${API_BASE_URL}/api/asistencia?${params.toString()}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      const normalizadas = (response.data || []).map((a) => {
        const nombreCompleto = a.est_nombre
          ? `${a.est_nombre} ${a.est_apellido || ""}`.trim()
          : a.estudiante || "";

        return {
          ...a,
          // Normalizar estado a clave de UI
          estado: mapEstadoBackendToUi(a.estado),
          // ID y datos de estudiante para las vistas de tarjetas/tablas
          id: a.id_asistencia,
          estudianteId: a.id_matricula || a.id_estudiante,
          estudiante: nombreCompleto,
          grado: a.seccion_nombre || a.grado,
          materia: a.materia_nombre || a.materia,
          hora: a.hora_registro || a.hora,
          observaciones: a.observacion ?? a.observaciones ?? a.observaciones,
        };
      });
      setAsistencias(normalizadas);
    } catch (error) {
      console.error("Error al cargar asistencias:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los estudiantes del profesor
  const cargarTodosEstudiantes = async () => {
    if (!cargaSeleccionada) {
      setTodosEstudiantes([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/calificaciones/alumnos-lista?id_seccion=${cargaSeleccionada.id_seccion}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setTodosEstudiantes(response.data);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    }
  };

  // Cargar estudiantes sin registro (para tomar lista)
  const cargarEstudiantesSinRegistro = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/asistencia/estudiantes-sin-registro?fecha=${fechaSeleccionada}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setEstudiantesSinRegistro(response.data);
    } catch (error) {
      console.error("Error al cargar estudiantes:", error);
    } finally {
      setLoading(false);
    }
  };

  // Verificar si una asistencia es editable (dentro de 24 horas)
  const esAsistenciaEditable = (fechaAsistencia) => {
    const ahora = new Date();
    const fechaAsist = new Date(fechaAsistencia);
    const diferenciaHoras = (ahora - fechaAsist) / (1000 * 60 * 60);
    return diferenciaHoras <= 24;
  };

  // Registrar asistencia
  const registrarAsistenciaEstudiante = async (
    estudiante,
    estado,
    observaciones = ""
  ) => {
    if (!cargaSeleccionada) {
      showToast(
        "Debe seleccionar una clase (carga académica) para tomar asistencia.",
        "warning"
      );
      return;
    }
    if (!estudiante || !estudiante.id_matricula) {
      showToast(
        "No se encontró la matrícula activa del estudiante en esta clase.",
        "error"
      );
      return;
    }

    const estadoBackend = mapEstadoUiToBackend(estado);

    console.log("📝 Registrando asistencia:", {
      id_carga: cargaSeleccionada.id_carga,
      id_matricula: estudiante.id_matricula,
      estado: estadoBackend,
      fecha: fechaSeleccionada,
    });
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/api/asistencia`,
        {
          id_carga: cargaSeleccionada.id_carga,
          id_matricula: estudiante.id_matricula,
          fecha: fechaSeleccionada,
          estado: estadoBackend,
          observacion: observaciones,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      console.log("✅ Asistencia registrada:", response.data);
      // Recargar datos
      await cargarAsistencias();
      await cargarTodosEstudiantes();
    } catch (error) {
      console.error("❌ Error al registrar asistencia:", error);
      console.error("Detalles:", error.response?.data);
      showToast(
        `Error al registrar asistencia: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );
    }
  };

  // Abrir modal para editar asistencia
  const abrirModalEditar = (asistencia) => {
    if (!esAsistenciaEditable(asistencia.fecha)) {
      showToast(
        "Esta asistencia ya no puede ser editada. Han pasado más de 24 horas desde su registro.",
        "warning"
      );
      return;
    }
    setAsistenciaEditar(asistencia);
    setEstadoEditado(asistencia.estado);
    setObservacionesEditadas(asistencia.observaciones || "");
    setModalEditarAsistencia(true);
  };

  // Actualizar asistencia existente
  const actualizarAsistencia = async () => {
    if (!asistenciaEditar) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${API_BASE_URL}/api/asistencia/${asistenciaEditar.id_asistencia}`,
        {
          estado: estadoEditado,
          observaciones: observacionesEditadas,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      console.log("✅ Asistencia actualizada:", response.data);
      setModalEditarAsistencia(false);
      setAsistenciaEditar(null);
      // Recargar datos
      await cargarAsistencias();
      await cargarTodosEstudiantes();
      if (vistaActual === "calendario") {
        await cargarAsistenciasMes();
      }
    } catch (error) {
      console.error("❌ Error al actualizar asistencia:", error);
      showToast(
        `Error al actualizar asistencia: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );
    }
  };

  // Eliminar asistencia
  const eliminarAsistencia = async (id_asistencia, fecha) => {
    if (!esAsistenciaEditable(fecha)) {
      showToast(
        "Esta asistencia ya no puede ser eliminada. Han pasado más de 24 horas desde su registro.",
        "warning"
      );
      return;
    }

    if (
      !window.confirm("¿Está seguro de eliminar este registro de asistencia?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/asistencia/${id_asistencia}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log("✅ Asistencia eliminada");
      // Recargar datos
      await cargarAsistencias();
      await cargarTodosEstudiantes();
      if (vistaActual === "calendario") {
        await cargarAsistenciasMes();
      }
    } catch (error) {
      console.error("❌ Error al eliminar asistencia:", error);
      showToast(
        `Error al eliminar asistencia: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );
    }
  };

  // Cargar datos al montar, cuando cambie la fecha, la vista o la clase seleccionada
  useEffect(() => {
    cargarAsistencias();
    cargarTodosEstudiantes();
    if (vistaActual === "registro") {
      cargarEstudiantesSinRegistro();
    }
    if (vistaActual === "calendario") {
      cargarAsistenciasMes();
    }
  }, [fechaSeleccionada, vistaActual, cargaSeleccionadaId]);

  // Funciones para el calendario
  const cargarAsistenciasMes = async () => {
    try {
      const token = localStorage.getItem("token");
      const primerDia = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth(),
        1
      );
      const ultimoDia = new Date(
        mesActual.getFullYear(),
        mesActual.getMonth() + 1,
        0
      );

      const params = new URLSearchParams({
        fecha_inicio: primerDia.toISOString().split("T")[0],
        fecha_fin: ultimoDia.toISOString().split("T")[0],
      });
      if (cargaSeleccionadaId) {
        params.append("id_carga", cargaSeleccionadaId);
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/asistencia/mes?${params.toString()}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      // Organizar asistencias por fecha
      const asistenciasPorFecha = {};
      (response.data || []).forEach((asistenciaRaw) => {
        const asistencia = {
          ...asistenciaRaw,
          estado: mapEstadoBackendToUi(asistenciaRaw.estado),
        };
        const fecha = asistencia.fecha.split("T")[0];
        if (!asistenciasPorFecha[fecha]) {
          asistenciasPorFecha[fecha] = {
            presentes: 0,
            ausentes: 0,
            tardes: 0,
            justificados: 0,
            total: 0,
          };
        }
        asistenciasPorFecha[fecha][asistencia.estado]++;
        asistenciasPorFecha[fecha].total++;
      });

      setAsistenciasPorFecha(asistenciasPorFecha);
    } catch (error) {
      console.error("Error al cargar asistencias del mes:", error);
    }
  };

  const getDiasDelMes = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias = [];
    // Días del mes anterior para completar la primera semana
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    // Días del mes actual
    for (let i = 1; i <= diasMes; i++) {
      dias.push(new Date(año, mes, i));
    }

    return dias;
  };

  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(nuevoMes.getMonth() + direccion);
    setMesActual(nuevoMes);
  };

  const seleccionarFecha = (fecha) => {
    if (fecha) {
      setFechaSeleccionada(fecha.toISOString().split("T")[0]);
      setVistaActual("hoy");
    }
  };

  const esHoy = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  const esFechaSeleccionada = (fecha) => {
    if (!fecha) return false;
    return fecha.toISOString().split("T")[0] === fechaSeleccionada;
  };

  // Calcular estadísticas desde los datos
  useEffect(() => {
    const presentes = asistencias.filter((a) => a.estado === "presente").length;
    const ausentes = asistencias.filter((a) => a.estado === "ausente").length;
    const tardes = asistencias.filter((a) => a.estado === "tarde").length;
    const justificados = asistencias.filter(
      (a) => a.estado === "justificado"
    ).length;
    const total = asistencias.length;

    setEstadisticas({
      totalPresentes: presentes,
      totalAusentes: ausentes,
      totalTardes: tardes,
      totalJustificados: justificados,
      porcentajeAsistencia:
        total > 0 ? Math.round(((presentes + tardes) / total) * 100) : 0,
    });
  }, [asistencias]);

  // Filtrar asistencias
  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    const matchBusqueda =
      busqueda === "" ||
      asistencia.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
      (asistencia.codigo_estudiante &&
        asistencia.codigo_estudiante
          .toLowerCase()
          .includes(busqueda.toLowerCase())) ||
      (asistencia.materia &&
        asistencia.materia.toLowerCase().includes(busqueda.toLowerCase()));

    const matchFiltros =
      (filtros.grado === "" || asistencia.grado === filtros.grado) &&
      (filtros.materia === "" || asistencia.materia === filtros.materia) &&
      (filtros.estado === "" || asistencia.estado === filtros.estado);

    return matchBusqueda && matchFiltros;
  });

  // Obtener asistencias de hoy
  const asistenciasHoy = asistenciasFiltradas;

  // Para compatibilidad con código legacy que busca estudiantes por ID
  const estudiantes = asistencias.map((a) => ({
    id: a.estudianteId,
    nombre: a.estudiante,
    codigo: a.codigo_estudiante,
    grado: a.grado,
    foto: a.imagen,
  }));

  const obtenerEstudiante = (estudianteId) => {
    return estudiantes.find((e) => e.id === estudianteId);
  };

  const EstadisticaCard = ({
    titulo,
    valor,
    porcentaje,
    icono: Icono,
    color,
    trend,
  }) => (
    <div className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-xl`}
            style={{backgroundColor: color + "20"}}
          >
            <Icono className="h-6 w-6" style={{color}} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-300">{titulo}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-white">{valor}</p>
              {porcentaje !== undefined && (
                <span className="text-sm text-gray-400">({porcentaje}%)</span>
              )}
            </div>
          </div>
        </div>
        {trend && (
          <div
            className={`flex items-center ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend > 0 ? (
              <ArrowTrendingUpIcon className="h-4 w-4" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );

  const AsistenciaCard = ({asistencia, estudiante}) => {
    const estadoConfig = ESTADOS_ASISTENCIA[asistencia.estado];
    const IconoEstado = estadoConfig.icon;

    return (
      <div
        className="bg-gray-800 rounded-xl p-4 shadow-md border border-gray-700 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
        onClick={() => setAsistenciaSeleccionada(asistencia)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {estudiante.nombre
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div>
              <h4 className="font-semibold text-white">{estudiante.nombre}</h4>
              <p className="text-sm text-gray-400">
                {estudiante.codigo} - {estudiante.grado}
              </p>
              <p className="text-xs text-gray-400">{asistencia.materia}</p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <div
              className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: estadoConfig.bgColor,
                color: estadoConfig.textColor,
              }}
            >
              <IconoEstado className="h-4 w-4" />
              <span>{estadoConfig.label}</span>
            </div>
            <span className="text-xs text-gray-500">{asistencia.hora}</span>
          </div>
        </div>
      </div>
    );
  };

  const VistaHoy = () => (
    <div className="space-y-6">
      {/* Estadísticas del día */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EstadisticaCard
          titulo="Presentes"
          valor={estadisticas.totalPresentes}
          porcentaje={
            asistenciasHoy.length > 0
              ? Math.round(
                  (estadisticas.totalPresentes / asistenciasHoy.length) * 100
                )
              : 0
          }
          icono={CheckCircleIcon}
          color={ESTADOS_ASISTENCIA.presente.color}
          trend={2}
        />
        <EstadisticaCard
          titulo="Ausentes"
          valor={estadisticas.totalAusentes}
          porcentaje={
            asistenciasHoy.length > 0
              ? Math.round(
                  (estadisticas.totalAusentes / asistenciasHoy.length) * 100
                )
              : 0
          }
          icono={XCircleIcon}
          color={ESTADOS_ASISTENCIA.ausente.color}
          trend={-1}
        />
        <EstadisticaCard
          titulo="Tardanzas"
          valor={estadisticas.totalTardes}
          porcentaje={
            asistenciasHoy.length > 0
              ? Math.round(
                  (estadisticas.totalTardes / asistenciasHoy.length) * 100
                )
              : 0
          }
          icono={ExclamationTriangleIcon}
          color={ESTADOS_ASISTENCIA.tarde.color}
        />
        <EstadisticaCard
          titulo="Justificados"
          valor={estadisticas.totalJustificados}
          porcentaje={
            asistenciasHoy.length > 0
              ? Math.round(
                  (estadisticas.totalJustificados / asistenciasHoy.length) * 100
                )
              : 0
          }
          icono={ExclamationCircleIcon}
          color={ESTADOS_ASISTENCIA.justificado.color}
        />
      </div>

      {/* Lista de asistencias de hoy */}
      <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Asistencia de Hoy</h3>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors flex items-center space-x-2">
              <PlusIcon className="h-4 w-4" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {asistenciasHoy.map((asistencia) => {
            const estudiante = obtenerEstudiante(asistencia.estudianteId);
            return estudiante ? (
              <AsistenciaCard
                key={asistencia.id || asistencia.id_asistencia}
                asistencia={asistencia}
                estudiante={estudiante}
              />
            ) : null;
          })}
        </div>

        {asistenciasHoy.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              No hay registros de asistencia
            </h3>
            <p className="text-gray-400">
              No se han registrado asistencias para esta fecha.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const VistaHistorica = () => (
    <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Observaciones
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {asistenciasFiltradas.map((asistencia, index) => {
              const estudiante = obtenerEstudiante(asistencia.estudianteId);
              const estadoConfig = ESTADOS_ASISTENCIA[asistencia.estado];
              const IconoEstado = estadoConfig.icon;

              return estudiante ? (
                <tr
                  key={asistencia.id || asistencia.id_asistencia}
                  className="hover:bg-gray-700 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          {estudiante.nombre
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          {estudiante.nombre}
                        </div>
                        <div className="text-sm text-gray-400">
                          {estudiante.codigo} - {estudiante.grado}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(asistencia.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {asistencia.materia}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div
                      className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium w-fit"
                      style={{
                        backgroundColor: estadoConfig.bgColor,
                        color: estadoConfig.textColor,
                      }}
                    >
                      <IconoEstado className="h-4 w-4" />
                      <span>{estadoConfig.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {asistencia.hora}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                    {asistencia.observaciones || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                        onClick={() => setAsistenciaSeleccionada(asistencia)}
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {esAsistenciaEditable(asistencia.fecha) ? (
                        <>
                          <button
                            className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                            onClick={() => abrirModalEditar(asistencia)}
                            title="Editar asistencia"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                            onClick={() =>
                              eliminarAsistencia(
                                asistencia.id_asistencia || asistencia.id,
                                asistencia.fecha
                              )
                            }
                            title="Eliminar asistencia"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic px-2 py-1">
                          No editable
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ) : null;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const VistaEstadisticas = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Resumen general */}
      <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Resumen General</h3>
        <div className="space-y-4">
          {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => {
            const total = asistenciasFiltradas.filter(
              (a) => a.estado === key
            ).length;
            const porcentaje =
              asistenciasFiltradas.length > 0
                ? (total / asistenciasFiltradas.length) * 100
                : 0;
            const Icono = config.icon;

            return (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{backgroundColor: config.bgColor}}
              >
                <div className="flex items-center space-x-3">
                  <Icono className="h-6 w-6" style={{color: config.color}} />
                  <span
                    className="font-medium"
                    style={{color: config.textColor}}
                  >
                    {config.label}
                  </span>
                </div>
                <div className="text-right">
                  <p
                    className="text-lg font-bold"
                    style={{color: config.textColor}}
                  >
                    {total}
                  </p>
                  <p
                    className="text-sm opacity-75"
                    style={{color: config.textColor}}
                  >
                    {porcentaje.toFixed(1)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tendencia por día */}
      <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">Tendencia Semanal</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-600" />
            <p>Gráfico de tendencias</p>
            <p className="text-sm">Próximamente disponible</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando asistencias...</p>
        </div>
      </div>
    );
  }

  const headerStats = [
    {
      label: "Tasa de Asistencia",
      value: `${estadisticas.porcentajeAsistencia}%`,
      color: "from-emerald-500 to-teal-600",
      icon: ChartBarIcon,
    },
    {
      label: "Estudiantes Presentes",
      value: estadisticas.totalPresentes,
      color: "from-blue-500 to-indigo-600",
      icon: CheckCircleIcon,
    },
    {
      label: "Ausencias Totales",
      value: estadisticas.totalAusentes,
      color: "from-red-500 to-rose-600",
      icon: XCircleIcon,
    },
    {
      label: "Llegadas Tardías",
      value: estadisticas.totalTardes,
      color: "from-amber-500 to-orange-600",
      icon: ExclamationTriangleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Control de Asistencia"
          subtitle="Sistema de registro y seguimiento estudiantil"
          icon={ClockIcon}
          stats={headerStats}
          actions={
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex flex-col mr-2">
                <span className="text-xs text-gray-400 mb-1">
                  Grado y sección seleccionados
                </span>
                <select
                  value={cargaSeleccionadaId}
                  onChange={(e) => setCargaSeleccionadaId(e.target.value)}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos los grados y secciones</option>
                  {seccionesUnicas.map((carga) => (
                    <option key={carga.id_carga} value={carga.id_carga}>
                      {buildLabelCarga(carga)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  if (!cargaSeleccionada) {
                    showToast(
                      "Debe seleccionar una clase (grado/sección/materia) para tomar lista.",
                      "warning"
                    );
                    return;
                  }
                  setModalAsistencia(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-emerald-500/30"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Registrar</span>
              </button>

              <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-200 border border-gray-600">
                <PrinterIcon className="h-5 w-5" />
              </button>

              <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-lg transition-all duration-200 border border-gray-600">
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
          }
        />
      </div>

      {/* Controles y Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar estudiante, código, materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>

            {/* Selector de Vista */}
            <div className="flex bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setVistaActual("calendario")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "calendario"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Calendario
              </button>
              <button
                onClick={() => setVistaActual("hoy")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "hoy"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Hoy
              </button>
              <button
                onClick={() => setVistaActual("historica")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "historica"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Histórica
              </button>
              <button
                onClick={() => setVistaActual("estadisticas")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "estadisticas"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Estadísticas
              </button>
            </div>

            {/* Botón Filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                mostrarFiltros
                  ? "bg-emerald-600 text-white border border-emerald-500"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grado
                </label>
                <select
                  value={filtros.grado}
                  onChange={(e) =>
                    setFiltros({...filtros, grado: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos los grados</option>
                  {MOCK_GRADOS.map((grado) => (
                    <option key={grado.id} value={grado.nombre}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Materia
                </label>
                <select
                  value={filtros.materia}
                  onChange={(e) =>
                    setFiltros({...filtros, materia: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas las materias</option>
                  {MOCK_MATERIAS.map((materia) => (
                    <option key={materia.id} value={materia.nombre}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={filtros.estado}
                  onChange={(e) =>
                    setFiltros({...filtros, estado: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) =>
                    setFiltros({...filtros, fechaInicio: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) =>
                    setFiltros({...filtros, fechaFin: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        {vistaActual === "calendario" && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-700">
            {/* Header del Calendario */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => cambiarMes(-1)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {mesActual.toLocaleDateString("es-NI", {
                    month: "long",
                    year: "numeric",
                  })}
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Control de Asistencias
                </p>
              </div>

              <button
                onClick={() => cambiarMes(1)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((dia) => (
                <div
                  key={dia}
                  className="text-center font-semibold text-gray-600 text-sm py-2"
                >
                  {dia}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-3">
              {getDiasDelMes().map((fecha, index) => {
                if (!fecha) {
                  return (
                    <div key={`empty-${index}`} className="aspect-square" />
                  );
                }

                const fechaStr = fecha.toISOString().split("T")[0];
                const datosAsistencia = asistenciasPorFecha[fechaStr];
                const porcentaje = datosAsistencia
                  ? Math.round(
                      (datosAsistencia.presentes / datosAsistencia.total) * 100
                    )
                  : null;

                // Determinar color de fondo según porcentaje
                const getBackgroundColor = () => {
                  if (!datosAsistencia) return "bg-gray-50 border-gray-200";
                  if (porcentaje >= 90)
                    return "bg-gradient-to-br from-green-50 to-emerald-100 border-green-300";
                  if (porcentaje >= 75)
                    return "bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-300";
                  if (porcentaje >= 60)
                    return "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300";
                  return "bg-gradient-to-br from-red-50 to-rose-100 border-red-300";
                };

                return (
                  <button
                    key={index}
                    onClick={() => seleccionarFecha(fecha)}
                    className={`aspect-square p-3 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-xl relative overflow-hidden ${getBackgroundColor()} ${
                      esHoy(fecha)
                        ? "ring-4 ring-emerald-400 ring-opacity-50"
                        : ""
                    } ${
                      esFechaSeleccionada(fecha)
                        ? "ring-4 ring-blue-500 ring-opacity-50"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col h-full justify-between">
                      {/* Número del día */}
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-lg font-bold ${
                            esHoy(fecha) ? "text-emerald-700" : "text-gray-800"
                          }`}
                        >
                          {fecha.getDate()}
                        </span>
                        {esHoy(fecha) && (
                          <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                            HOY
                          </span>
                        )}
                      </div>

                      {/* Detalles de asistencia */}
                      {datosAsistencia ? (
                        <div className="space-y-1">
                          {/* Porcentaje destacado */}
                          <div
                            className={`text-center py-1 px-2 rounded-lg font-bold text-sm ${
                              porcentaje >= 90
                                ? "bg-green-500 text-white"
                                : porcentaje >= 75
                                ? "bg-blue-500 text-white"
                                : porcentaje >= 60
                                ? "bg-yellow-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {porcentaje}%
                          </div>

                          {/* Grid de estadísticas con colores */}
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {datosAsistencia.presentes > 0 && (
                              <div className="bg-green-500 text-white rounded px-1 py-0.5 text-center font-semibold">
                                ✓ {datosAsistencia.presentes}
                              </div>
                            )}
                            {datosAsistencia.ausentes > 0 && (
                              <div className="bg-red-500 text-white rounded px-1 py-0.5 text-center font-semibold">
                                ✗ {datosAsistencia.ausentes}
                              </div>
                            )}
                            {datosAsistencia.tardes > 0 && (
                              <div className="bg-yellow-500 text-white rounded px-1 py-0.5 text-center font-semibold">
                                ⏰ {datosAsistencia.tardes}
                              </div>
                            )}
                            {datosAsistencia.justificados > 0 && (
                              <div className="bg-purple-500 text-white rounded px-1 py-0.5 text-center font-semibold">
                                📝 {datosAsistencia.justificados}
                              </div>
                            )}
                          </div>

                          {/* Total de registros */}
                          <div className="text-center text-xs font-semibold text-gray-700 bg-white bg-opacity-70 rounded px-1 py-0.5">
                            Total: {datosAsistencia.total}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 italic">
                          Sin registros
                        </div>
                      )}
                    </div>

                    {/* Barra decorativa inferior según estado */}
                    {datosAsistencia && (
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-1.5 ${
                          porcentaje >= 90
                            ? "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"
                            : porcentaje >= 75
                            ? "bg-gradient-to-r from-blue-400 via-cyan-500 to-sky-500"
                            : porcentaje >= 60
                            ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500"
                            : "bg-gradient-to-r from-red-400 via-rose-500 to-pink-500"
                        }`}
                      />
                    )}

                    {/* Indicador de día actual extra */}
                    {esHoy(fecha) && (
                      <div className="absolute top-0 right-0 w-3 h-3">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
                        <div className="absolute inset-0 bg-emerald-500 rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Leyenda Mejorada */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Sección: Estados de Asistencia */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Estados de Asistencia
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Presentes
                        </div>
                        <div className="text-xs text-gray-600">
                          Asistió a clase
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="w-4 h-4 rounded bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                        ✗
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Ausentes
                        </div>
                        <div className="text-xs text-gray-600">No asistió</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="w-4 h-4 rounded bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                        ⏰
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Tardes
                        </div>
                        <div className="text-xs text-gray-600">Llegó tarde</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="w-4 h-4 rounded bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        📝
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Justificados
                        </div>
                        <div className="text-xs text-gray-600">
                          Ausencia justificada
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Niveles de Asistencia */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
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
                    Niveles de Asistencia
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
                      <div className="text-2xl font-bold text-green-600">
                        ≥90%
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Excelente
                        </div>
                        <div className="text-xs text-gray-600">
                          Asistencia óptima
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500">
                      <div className="text-2xl font-bold text-blue-600">
                        75-89%
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Buena
                        </div>
                        <div className="text-xs text-gray-600">
                          Asistencia aceptable
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500">
                      <div className="text-2xl font-bold text-yellow-600">
                        60-74%
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Regular
                        </div>
                        <div className="text-xs text-gray-600">
                          Requiere atención
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500">
                      <div className="text-2xl font-bold text-red-600">
                        &lt;60%
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-800">
                          Crítica
                        </div>
                        <div className="text-xs text-gray-600">
                          Requiere intervención
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instrucciones */}
              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Cómo usar el calendario
                </h4>
                <ul className="space-y-1 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      Haz <strong>clic en cualquier día</strong> para ver el
                      detalle completo de asistencias
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      El <strong>porcentaje</strong> indica la tasa de
                      asistencia del día (presentes / total)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      Los <strong>números en las tarjetas</strong> muestran la
                      cantidad de cada tipo de asistencia
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>
                      La <strong>barra inferior</strong> cambia de color según
                      el nivel de asistencia del día
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {vistaActual === "hoy" && <VistaHoy />}
        {vistaActual === "historica" && <VistaHistorica />}
        {vistaActual === "estadisticas" && <VistaEstadisticas />}

        {/* Mensaje cuando no hay resultados */}
        {asistenciasFiltradas.length === 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-700">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron registros
            </h3>
            <p className="text-gray-400 mb-6">
              No hay registros de asistencia que coincidan con los filtros
              seleccionados.
            </p>
            <button
              onClick={() => {
                setBusqueda("");
                setFiltros({
                  grado: "",
                  materia: "",
                  estado: "",
                  fechaInicio: "",
                  fechaFin: "",
                });
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalles de asistencia */}
      {asistenciaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAsistenciaSeleccionada(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    Detalle de Asistencia
                  </h3>
                  <p className="text-emerald-100">
                    {
                      obtenerEstudiante(asistenciaSeleccionada.estudianteId)
                        ?.nombre
                    }
                  </p>
                </div>
                <button
                  onClick={() => setAsistenciaSeleccionada(null)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Fecha</span>
                  </div>
                  <p className="font-semibold">
                    {new Date(
                      asistenciaSeleccionada.fecha
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Hora</span>
                  </div>
                  <p className="font-semibold">{asistenciaSeleccionada.hora}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <BookOpenIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Materia</span>
                  </div>
                  <p className="font-semibold">
                    {asistenciaSeleccionada.materia}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Profesor</span>
                  </div>
                  <p className="font-semibold text-sm">
                    {asistenciaSeleccionada.profesor}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center text-gray-600 mb-2">
                  <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Estado</span>
                </div>
                <div className="flex items-center space-x-2">
                  {(() => {
                    const estadoConfig =
                      ESTADOS_ASISTENCIA[asistenciaSeleccionada.estado];
                    const IconoEstado = estadoConfig.icon;
                    return (
                      <div
                        className="flex items-center space-x-2 px-3 py-2 rounded-lg font-medium"
                        style={{
                          backgroundColor: estadoConfig.bgColor,
                          color: estadoConfig.textColor,
                        }}
                      >
                        <IconoEstado className="h-5 w-5" />
                        <span>{estadoConfig.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {asistenciaSeleccionada.observaciones && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <ClipboardDocumentListIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Observaciones</span>
                  </div>
                  <p className="text-gray-900">
                    {asistenciaSeleccionada.observaciones}
                  </p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tomar Lista */}
      {modalAsistencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setModalAsistencia(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">Tomar Lista</h3>
                  <p className="text-emerald-100">
                    {new Date(fechaSeleccionada).toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setModalAsistencia(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

            {/* Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando estudiantes...</p>
                </div>
              ) : todosEstudiantes.length === 0 ? (
                <div className="text-center py-12">
                  <UserGroupIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    No hay estudiantes
                  </h3>
                  <p className="text-gray-600">
                    No tienes estudiantes asignados en tus grados.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-4">
                    {todosEstudiantes.length} estudiante(s) en total
                  </p>
                  {todosEstudiantes.map((estudiante) => {
                    const asistenciaHoy = asistencias.find(
                      (a) => a.id_matricula === estudiante.id_matricula
                    );

                    return (
                      <div
                        key={estudiante.id_alumno}
                        className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Info Estudiante */}
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                              {estudiante.imagen ? (
                                <img
                                  src={`${API_BASE_URL}${estudiante.imagen}`}
                                  alt={estudiante.alumno}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <UserIcon className="h-6 w-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {estudiante.alumno}
                              </p>
                              <p className="text-sm text-gray-500">
                                {estudiante.grado} - {estudiante.seccion}
                              </p>
                            </div>
                          </div>

                          {/* Estado o Botones */}
                          {asistenciaHoy ? (
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm"
                                style={{
                                  backgroundColor:
                                    ESTADOS_ASISTENCIA[asistenciaHoy.estado]
                                      .bgColor,
                                  color:
                                    ESTADOS_ASISTENCIA[asistenciaHoy.estado]
                                      .textColor,
                                }}
                              >
                                {(() => {
                                  const IconoEstado =
                                    ESTADOS_ASISTENCIA[asistenciaHoy.estado]
                                      .icon;
                                  return <IconoEstado className="h-4 w-4" />;
                                })()}
                                <span>
                                  {
                                    ESTADOS_ASISTENCIA[asistenciaHoy.estado]
                                      .label
                                  }
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  registrarAsistenciaEstudiante(
                                    estudiante,
                                    "presente"
                                  )
                                }
                                className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                                title="Presente"
                              >
                                <CheckCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  registrarAsistenciaEstudiante(
                                    estudiante,
                                    "tarde"
                                  )
                                }
                                className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg transition-colors"
                                title="Tarde"
                              >
                                <ExclamationTriangleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  registrarAsistenciaEstudiante(
                                    estudiante,
                                    "ausente"
                                  )
                                }
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                                title="Ausente"
                              >
                                <XCircleIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() =>
                                  registrarAsistenciaEstudiante(
                                    estudiante,
                                    "justificado"
                                  )
                                }
                                className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors"
                                title="Justificado"
                              >
                                <ExclamationCircleIcon className="h-5 w-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <button
                onClick={() => setModalAsistencia(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Asistencia */}
      {modalEditarAsistencia && asistenciaEditar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <PencilIcon className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Editar Asistencia</h2>
                    <p className="text-indigo-100 text-sm">
                      {new Date(asistenciaEditar.fecha).toLocaleDateString(
                        "es-NI",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalEditarAsistencia(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Información del estudiante */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">
                      {asistenciaEditar.nombre_completo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {asistenciaEditar.codigo_mined || "Sin código"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alerta de tiempo editable */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold">Tiempo de edición limitado</p>
                    <p className="text-xs mt-1">
                      Esta asistencia solo puede editarse dentro de las 24 horas
                      posteriores a su registro.
                    </p>
                  </div>
                </div>
              </div>

              {/* Selector de estado */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Estado de Asistencia
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ESTADOS_ASISTENCIA).map(([key, config]) => {
                    const Icono = config.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setEstadoEditado(key)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          estadoEditado === key
                            ? "border-indigo-500 shadow-lg scale-105"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{
                          backgroundColor:
                            estadoEditado === key ? config.bgColor : "white",
                        }}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Icono
                            className="h-8 w-8"
                            style={{color: config.color}}
                          />
                          <span
                            className="text-sm font-semibold"
                            style={{
                              color:
                                estadoEditado === key
                                  ? config.textColor
                                  : "#6B7280",
                            }}
                          >
                            {config.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={observacionesEditadas}
                  onChange={(e) => setObservacionesEditadas(e.target.value)}
                  placeholder="Agregar comentarios o notas adicionales..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setModalEditarAsistencia(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={actualizarAsistencia}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({show: false, message: "", type: "success"})}
        />
      )}
    </div>
  );
}

export default Asistencia;
