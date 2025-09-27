import React, {useState, useEffect} from "react";
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
  const [asistencias, setAsistencias] = useState(MOCK_ASISTENCIAS);
  const [estudiantes, setEstudiantes] = useState(MOCK_ESTUDIANTES);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState("hoy"); // 'hoy', 'historica', 'estadisticas', 'registro'
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
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
  const [estadisticas, setEstadisticas] = useState({
    totalPresentes: 0,
    totalAusentes: 0,
    totalTardes: 0,
    totalJustificados: 0,
    porcentajeAsistencia: 0,
  });

  // Calcular estadísticas
  useEffect(() => {
    const asistenciasHoy = asistencias.filter(
      (a) => a.fecha === fechaSeleccionada
    );
    const presentes = asistenciasHoy.filter(
      (a) => a.estado === "presente"
    ).length;
    const ausentes = asistenciasHoy.filter(
      (a) => a.estado === "ausente"
    ).length;
    const tardes = asistenciasHoy.filter((a) => a.estado === "tarde").length;
    const justificados = asistenciasHoy.filter(
      (a) => a.estado === "justificado"
    ).length;
    const total = asistenciasHoy.length;

    setEstadisticas({
      totalPresentes: presentes,
      totalAusentes: ausentes,
      totalTardes: tardes,
      totalJustificados: justificados,
      porcentajeAsistencia:
        total > 0 ? Math.round(((presentes + tardes) / total) * 100) : 0,
    });
  }, [asistencias, fechaSeleccionada]);

  // Obtener estudiante por ID
  const obtenerEstudiante = (estudianteId) => {
    return estudiantes.find((e) => e.id === estudianteId);
  };

  // Filtrar asistencias
  const asistenciasFiltradas = asistencias.filter((asistencia) => {
    const estudiante = obtenerEstudiante(asistencia.estudianteId);
    if (!estudiante) return false;

    const matchBusqueda =
      busqueda === "" ||
      estudiante.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      estudiante.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      asistencia.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      asistencia.profesor.toLowerCase().includes(busqueda.toLowerCase());

    const matchFiltros =
      (filtros.grado === "" || estudiante.grado === filtros.grado) &&
      (filtros.materia === "" || asistencia.materia === filtros.materia) &&
      (filtros.estado === "" || asistencia.estado === filtros.estado) &&
      (filtros.fechaInicio === "" || asistencia.fecha >= filtros.fechaInicio) &&
      (filtros.fechaFin === "" || asistencia.fecha <= filtros.fechaFin);

    return matchBusqueda && matchFiltros;
  });

  // Obtener asistencias de hoy
  const asistenciasHoy = asistenciasFiltradas.filter(
    (a) => a.fecha === fechaSeleccionada
  );

  const EstadisticaCard = ({
    titulo,
    valor,
    porcentaje,
    icono: Icono,
    color,
    trend,
  }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-3 rounded-xl`}
            style={{backgroundColor: color + "20"}}
          >
            <Icono className="h-6 w-6" style={{color}} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{titulo}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">{valor}</p>
              {porcentaje !== undefined && (
                <span className="text-sm text-gray-500">({porcentaje}%)</span>
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
        className="bg-white rounded-xl p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
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
              <h4 className="font-semibold text-gray-900">
                {estudiante.nombre}
              </h4>
              <p className="text-sm text-gray-500">
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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Asistencia de Hoy</h3>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                key={asistencia.id}
                asistencia={asistencia}
                estudiante={estudiante}
              />
            ) : null;
          })}
        </div>

        {asistenciasHoy.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentCheckIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay registros de asistencia
            </h3>
            <p className="text-gray-600">
              No se han registrado asistencias para esta fecha.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const VistaHistorica = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hora
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observaciones
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {asistenciasFiltradas.map((asistencia, index) => {
              const estudiante = obtenerEstudiante(asistencia.estudianteId);
              const estadoConfig = ESTADOS_ASISTENCIA[asistencia.estado];
              const IconoEstado = estadoConfig.icon;

              return estudiante ? (
                <tr
                  key={asistencia.id}
                  className="hover:bg-gray-50 transition-colors"
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
                        <div className="text-sm font-medium text-gray-900">
                          {estudiante.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {estudiante.codigo} - {estudiante.grado}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(asistencia.fecha).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {asistencia.hora}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {asistencia.observaciones || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all"
                        onClick={() => setAsistenciaSeleccionada(asistencia)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all">
                        <TrashIcon className="h-4 w-4" />
                      </button>
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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Resumen General
        </h3>
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
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Tendencia Semanal
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>Gráfico de tendencias</p>
            <p className="text-sm">Próximamente disponible</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando asistencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <ClockIcon className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Control de Asistencia
                </h1>
                <p className="text-xl text-emerald-100">
                  Sistema de registro y seguimiento estudiantil
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setModalAsistencia(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border border-white/20"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Registrar Asistencia</span>
              </button>

              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl transition-all duration-200 border border-white/20">
                <PrinterIcon className="h-5 w-5" />
              </button>

              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl transition-all duration-200 border border-white/20">
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick stats en hero */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl font-bold">
                {estadisticas.porcentajeAsistencia}%
              </p>
              <p className="text-emerald-100 text-sm">Asistencia General</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl font-bold">
                {estadisticas.totalPresentes}
              </p>
              <p className="text-emerald-100 text-sm">Presentes Hoy</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl font-bold">{estadisticas.totalAusentes}</p>
              <p className="text-emerald-100 text-sm">Ausentes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl font-bold">{estadisticas.totalTardes}</p>
              <p className="text-emerald-100 text-sm">Tardanzas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-2xl font-bold">{estudiantes.length}</p>
              <p className="text-emerald-100 text-sm">Total Estudiantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar estudiante, código, materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Selector de Vista */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setVistaActual("hoy")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "hoy"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Hoy
              </button>
              <button
                onClick={() => setVistaActual("historica")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "historica"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Histórica
              </button>
              <button
                onClick={() => setVistaActual("estadisticas")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "estadisticas"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
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
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grado
                </label>
                <select
                  value={filtros.grado}
                  onChange={(e) =>
                    setFiltros({...filtros, grado: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materia
                </label>
                <select
                  value={filtros.materia}
                  onChange={(e) =>
                    setFiltros({...filtros, materia: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filtros.estado}
                  onChange={(e) =>
                    setFiltros({...filtros, estado: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fechaInicio}
                  onChange={(e) =>
                    setFiltros({...filtros, fechaInicio: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fechaFin}
                  onChange={(e) =>
                    setFiltros({...filtros, fechaFin: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        {vistaActual === "hoy" && <VistaHoy />}
        {vistaActual === "historica" && <VistaHistorica />}
        {vistaActual === "estadisticas" && <VistaEstadisticas />}

        {/* Mensaje cuando no hay resultados */}
        {asistenciasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron registros
            </h3>
            <p className="text-gray-600 mb-6">
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
    </div>
  );
}

export default Asistencia;
