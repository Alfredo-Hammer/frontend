import React, {useState, useEffect} from "react";
import {
  Users,
  UserPlus,
  FileText,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  Bell,
  DollarSign,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Printer,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function DashboardSecretariado({user}) {
  const [loading, setLoading] = useState(true);

  // Datos simulados para el dashboard
  const estadisticas = {
    estudiantesActivos: 1247,
    nuevasInscripciones: 48,
    pendientesPago: 23,
    citasPendientes: 12,
    constanciasEmitidas: 156,
    asistenciaHoy: 94.5,
  };

  const inscripcionesMensuales = [
    {mes: "Ene", inscripciones: 45},
    {mes: "Feb", inscripciones: 38},
    {mes: "Mar", inscripciones: 52},
    {mes: "Abr", inscripciones: 41},
    {mes: "May", aumentó: 35},
    {mes: "Jun", inscripciones: 48},
  ];

  const distribucionGrados = [
    {grado: "1er Grado", estudiantes: 180, color: "#3b82f6"},
    {grado: "2do Grado", estudiantes: 165, color: "#10b981"},
    {grado: "3er Grado", estudiantes: 170, color: "#f59e0b"},
    {grado: "4to Grado", estudiantes: 155, color: "#ef4444"},
    {grado: "5to Grado", estudiantes: 142, color: "#8b5cf6"},
    {grado: "6to Grado", estudiantes: 135, color: "#ec4899"},
  ];

  const tareasPendientes = [
    {
      tipo: "registro",
      titulo: "Completar registro de Juan Pérez",
      prioridad: "alta",
      tiempo: "Hace 30 min",
    },
    {
      tipo: "documento",
      titulo: "Emitir constancia de estudio",
      prioridad: "media",
      tiempo: "Hace 1 hora",
    },
    {
      tipo: "pago",
      titulo: "Verificar pago de María González",
      prioridad: "alta",
      tiempo: "Hace 2 horas",
    },
    {
      tipo: "cita",
      titulo: "Reunión con padres - 3:00 PM",
      prioridad: "media",
      tiempo: "Hoy",
    },
  ];

  const actividadReciente = [
    {
      accion: "Nuevo estudiante registrado",
      detalles: "Carlos Martínez - 5to Grado A",
      tiempo: "Hace 15 min",
      icono: <UserPlus className="h-5 w-5 text-green-400" />,
    },
    {
      accion: "Constancia emitida",
      detalles: "Constancia de estudio para Ana López",
      tiempo: "Hace 30 min",
      icono: <FileText className="h-5 w-5 text-blue-400" />,
    },
    {
      accion: "Pago registrado",
      detalles: "Mensualidad de octubre - Pedro Ruiz",
      tiempo: "Hace 1 hora",
      icono: <DollarSign className="h-5 w-5 text-yellow-400" />,
    },
    {
      accion: "Asistencia registrada",
      detalles: "4to Grado B - 28/30 presentes",
      tiempo: "Hace 2 horas",
      icono: <ClipboardCheck className="h-5 w-5 text-cyan-400" />,
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-300/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                  <FileText className="h-8 w-8" />
                  ¡Bienvenido/a, {user.nombre}!
                </h1>
                <p className="text-purple-100 text-lg">
                  Panel de Gestión Administrativa
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex gap-3">
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Nuevo Estudiante
                </button>
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition-colors text-white border border-white/30 rounded-xl px-6 py-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Emitir Constancia
                </button>
              </div>
            </div>

            {/* Fecha y hora */}
            <div className="mt-6 flex items-center gap-4 text-purple-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date().toLocaleDateString("es-ES", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>
                  {new Date().toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Estudiantes Activos */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.estudiantesActivos}
            </h3>
            <p className="text-blue-200 text-sm">Estudiantes Activos</p>
          </div>

          {/* Nuevas Inscripciones */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/30 rounded-lg">
                <UserPlus className="h-6 w-6 text-green-300" />
              </div>
              <TrendingUp className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.nuevasInscripciones}
            </h3>
            <p className="text-green-200 text-sm">Nuevas este mes</p>
          </div>

          {/* Pendientes de Pago */}
          <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-300" />
              </div>
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.pendientesPago}
            </h3>
            <p className="text-yellow-200 text-sm">Pendientes Pago</p>
          </div>

          {/* Citas Pendientes */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/30 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.citasPendientes}
            </h3>
            <p className="text-purple-200 text-sm">Citas Pendientes</p>
          </div>

          {/* Constancias Emitidas */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-cyan-500/30 rounded-lg">
                <FileText className="h-6 w-6 text-cyan-300" />
              </div>
              <Printer className="h-4 w-4 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.constanciasEmitidas}
            </h3>
            <p className="text-cyan-200 text-sm">Constancias (mes)</p>
          </div>

          {/* Asistencia Hoy */}
          <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 backdrop-blur-md border border-rose-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-rose-500/30 rounded-lg">
                <ClipboardCheck className="h-6 w-6 text-rose-300" />
              </div>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.asistenciaHoy}%
            </h3>
            <p className="text-rose-200 text-sm">Asistencia Hoy</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inscripciones Mensuales */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Inscripciones Mensuales
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inscripcionesMensuales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="mes"
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af"}}
                />
                <YAxis stroke="#9ca3af" tick={{fill: "#9ca3af"}} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="inscripciones"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{fill: "#10b981", r: 5}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Grados */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Distribución por Grados
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionGrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="grado"
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af", fontSize: 11}}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#9ca3af" tick={{fill: "#9ca3af"}} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="estudiantes" radius={[8, 8, 0, 0]}>
                  {distribucionGrados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tareas Pendientes y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tareas Pendientes */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <ClipboardCheck className="h-5 w-5 text-yellow-400" />
              Tareas Pendientes
            </h2>
            <div className="space-y-3">
              {tareasPendientes.map((tarea, index) => (
                <div
                  key={index}
                  className={`${
                    tarea.prioridad === "alta"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  } border rounded-lg p-4 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {tarea.titulo}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tarea.tiempo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full ${
                            tarea.prioridad === "alta"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-yellow-500/20 text-yellow-300"
                          }`}
                        >
                          {tarea.prioridad === "alta" ? "Alta" : "Media"}
                        </span>
                      </div>
                    </div>
                    <button className="text-cyan-400 hover:text-cyan-300 transition-colors">
                      <CheckCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-cyan-400" />
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              {actividadReciente.map((actividad, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-800/50 rounded-lg">
                      {actividad.icono}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {actividad.accion}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {actividad.detalles}
                      </p>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {actividad.tiempo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Award className="h-5 w-5 text-indigo-400" />
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <button className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
              <UserPlus className="h-8 w-8 text-blue-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">
                Registrar Estudiante
              </p>
            </button>
            <button className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
              <FileText className="h-8 w-8 text-green-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">
                Emitir Constancia
              </p>
            </button>
            <button className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
              <DollarSign className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Registrar Pago</p>
            </button>
            <button className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
              <Calendar className="h-8 w-8 text-purple-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">Agendar Cita</p>
            </button>
            <button className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
              <Search className="h-8 w-8 text-cyan-300 mx-auto mb-2" />
              <p className="text-white text-sm font-semibold">
                Buscar Estudiante
              </p>
            </button>
          </div>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-md border border-indigo-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/30 rounded-lg">
              <Bell className="h-8 w-8 text-indigo-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                Panel de Gestión Administrativa
              </h3>
              <p className="text-indigo-100">
                Tienes {tareasPendientes.length} tareas pendientes y{" "}
                {estadisticas.citasPendientes} citas programadas para hoy.
                Mantén el control de todas las actividades administrativas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSecretariado;
