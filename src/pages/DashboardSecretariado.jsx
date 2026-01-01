import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
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
  UserCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function DashboardSecretariado({ user }) {
  const [loading, setLoading] = useState(true);
  const [escuela, setEscuela] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalAlumnos: 0,
    totalProfesores: 0,
    totalMaterias: 0,
    totalGrados: 0,
    totalSecciones: 0,
    nuevasInscripciones: 0,
  });
  const [alumnos, setAlumnos] = useState([]);
  const [grados, setGrados] = useState([]);
  const token = localStorage.getItem("token");

  // Calcular distribución por grados con datos reales
  const distribucionGrados = grados.map((grado, index) => {
    const colores = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#f97316",
    ];
    const estudiantesEnGrado = alumnos.filter(
      (a) => a.gradoid === grado.id_grado
    ).length;
    return {
      grado: grado.nombre,
      estudiantes: estudiantesEnGrado,
      color: colores[index % colores.length],
    };
  });

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
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar datos en paralelo
      const [
        escuelaRes,
        dashboardRes,
        alumnosRes, // Necesario para el gráfico
        gradosRes, // Necesario para el gráfico
      ] = await Promise.all([
        user?.id_escuela
          ? api.get(`/api/escuelas/${user.id_escuela}`, { headers })
          : Promise.resolve({ data: null }),
        api.get("/api/dashboard/admin", { headers }),
        api.get("/api/alumnos", { headers }),
        api.get("/api/grados", { headers }),
      ]);

      setEscuela(escuelaRes.data);
      setAlumnos(alumnosRes.data);
      setGrados(gradosRes.data);

      // Calcular nuevas inscripciones del lado del cliente
      const nuevasInscripciones = alumnosRes.data.filter((a) => {
        const fechaRegistro = new Date(a.fecha_registro || a.createdAt);
        const hace30dias = new Date();
        hace30dias.setDate(hace30dias.getDate() - 30);
        return fechaRegistro > hace30dias;
      }).length;

      setEstadisticas({ ...dashboardRes.data, nuevasInscripciones });

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

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
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-300/10 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10">
            {/* Fila superior: Logo y nombre de escuela */}
            {(escuela?.logo || escuela?.nombre) && (
              <div className="flex items-center justify-end gap-4 mb-6 pb-4 border-b border-white/20">
                {escuela?.nombre && (
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {escuela.nombre}
                    </p>
                    <p className="text-sm text-purple-100">
                      Sistema de Gestión Educativa
                    </p>
                  </div>
                )}
                {escuela?.logo && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl"></div>
                    <img
                      src={`http://localhost:4000${escuela.logo}`}
                      alt={escuela.nombre}
                      className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover border-4 border-white/40 shadow-2xl"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white">
                      ¡Bienvenido/a, {user.nombre}!
                    </h1>
                    <p className="text-purple-100 text-base lg:text-lg">
                      Panel de Gestión Administrativa
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 hover:scale-105 transition-all duration-200 text-white border border-white/30 rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg">
                  <UserPlus className="h-5 w-5" />
                  <span className="font-semibold">Nuevo Estudiante</span>
                </button>
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 hover:scale-105 transition-all duration-200 text-white border border-white/30 rounded-xl px-5 py-3 flex items-center gap-2 shadow-lg">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">Emitir Constancia</span>
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
          <div
            className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => (window.location.href = "/alumnos")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-500/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.totalAlumnos}
            </h3>
            <p className="text-blue-200 text-sm">Estudiantes Activos</p>
          </div>

          {/* Profesores */}
          <div
            className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => (window.location.href = "/profesores")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-500/30 rounded-lg">
                <UserCheck className="h-6 w-6 text-green-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.totalProfesores}
            </h3>
            <p className="text-green-200 text-sm">Profesores</p>
          </div>

          {/* Grados */}
          <div
            className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-md border border-yellow-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => (window.location.href = "/grados")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-yellow-500/30 rounded-lg">
                <Award className="h-6 w-6 text-yellow-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.totalGrados}
            </h3>
            <p className="text-yellow-200 text-sm">Grados</p>
          </div>

          {/* Secciones */}
          <div
            className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => (window.location.href = "/secciones")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-500/30 rounded-lg">
                <Users className="h-6 w-6 text-purple-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.totalSecciones}
            </h3>
            <p className="text-purple-200 text-sm">Secciones</p>
          </div>

          {/* Materias */}
          <div
            className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300 cursor-pointer"
            onClick={() => (window.location.href = "/materias")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-cyan-500/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-cyan-300" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.totalMaterias}
            </h3>
            <p className="text-cyan-200 text-sm">Materias</p>
          </div>

          {/* Nuevas Inscripciones */}
          <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-md border border-pink-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-pink-500/30 rounded-lg">
                <UserPlus className="h-6 w-6 text-pink-300" />
              </div>
              <TrendingUp className="h-4 w-4 text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {estadisticas.nuevasInscripciones}
            </h3>
            <p className="text-pink-200 text-sm">Nuevos este mes</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Grados */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Estudiantes por Grado
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionGrados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="grado"
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
                <Bar dataKey="estudiantes" radius={[8, 8, 0, 0]}>
                  {distribucionGrados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
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