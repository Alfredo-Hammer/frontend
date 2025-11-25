import React, {useState, useEffect} from "react";
import {
  BookOpen,
  Award,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Star,
  CheckCircle,
  AlertCircle,
  Activity,
  FileText,
  Users,
  Trophy,
  Zap,
  Brain,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Cell,
} from "recharts";

function DashboardEstudiante({user}) {
  const [loading, setLoading] = useState(true);
  const [promedio, setPromedio] = useState(0);
  const asistencia = 92;
  const tareasCompletadas = 15;
  const tareasPendientes = 3;

  // Datos de progreso por materia
  const materiasData = [
    {materia: "Matemáticas", calificacion: 85, color: "#3b82f6"},
    {materia: "Español", calificacion: 92, color: "#10b981"},
    {materia: "Ciencias", calificacion: 88, color: "#f59e0b"},
    {materia: "Historia", calificacion: 78, color: "#ef4444"},
    {materia: "Inglés", calificacion: 90, color: "#8b5cf6"},
    {materia: "Educación Física", calificacion: 95, color: "#06b6d4"},
  ];

  // Datos de rendimiento mensual
  const rendimientoMensual = [
    {mes: "Ene", promedio: 82},
    {mes: "Feb", promedio: 85},
    {mes: "Mar", promedio: 87},
    {mes: "Abr", promedio: 86},
    {mes: "May", promedio: 88},
    {mes: "Jun", promedio: 87},
  ];

  // Datos de habilidades (para gráfico radar)
  const habilidadesData = [
    {habilidad: "Matemáticas", valor: 85},
    {habilidad: "Comunicación", valor: 90},
    {habilidad: "Ciencias", valor: 88},
    {habilidad: "Creatividad", valor: 92},
    {habilidad: "Trabajo en Equipo", valor: 95},
    {habilidad: "Liderazgo", valor: 80},
  ];

  // Próximas tareas y exámenes
  const proximosEventos = [
    {
      tipo: "examen",
      titulo: "Examen de Matemáticas",
      fecha: "2025-11-28",
      hora: "10:00 AM",
      materia: "Matemáticas",
      icon: FileText,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      tipo: "tarea",
      titulo: "Ensayo de Historia",
      fecha: "2025-11-26",
      hora: "Antes de clase",
      materia: "Historia",
      icon: BookOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      tipo: "proyecto",
      titulo: "Proyecto de Ciencias",
      fecha: "2025-11-30",
      hora: "Todo el día",
      materia: "Ciencias",
      icon: Brain,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  // Logros recientes
  const logros = [
    {
      titulo: "Mejor Promedio del Mes",
      descripcion: "Obtuviste el promedio más alto en Mayo",
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      fecha: "Hace 2 días",
    },
    {
      titulo: "100% Asistencia",
      descripcion: "No faltaste ningún día este mes",
      icon: CheckCircle,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
      fecha: "Hace 5 días",
    },
    {
      titulo: "Tarea Destacada",
      descripcion: "Tu ensayo fue elegido como ejemplo",
      icon: Star,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      fecha: "Hace 1 semana",
    },
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setPromedio(87.3);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando tu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con saludo personalizado */}
        <div className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  ¡Hola, {user.nombre}! 👋
                </h1>
                <p className="text-cyan-100 text-lg">
                  Aquí está tu progreso académico actualizado
                </p>
              </div>

              <div className="mt-4 md:mt-0 flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {promedio.toFixed(1)}
                  </div>
                  <div className="text-cyan-100 text-sm">Promedio General</div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {asistencia}%
                  </div>
                  <div className="text-cyan-100 text-sm">Asistencia</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total de Materias */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-300" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {materiasData.length}
            </h3>
            <p className="text-blue-200 text-sm">Materias Activas</p>
            <div className="mt-2 text-xs text-green-300 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Todas al día</span>
            </div>
          </div>

          {/* Tareas Completadas */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-300" />
              </div>
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {tareasCompletadas}
            </h3>
            <p className="text-green-200 text-sm">Tareas Completadas</p>
            <div className="mt-2 text-xs text-yellow-300 flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>¡Excelente trabajo!</span>
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-md border border-orange-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/30 rounded-lg">
                <Clock className="h-6 w-6 text-orange-300" />
              </div>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {tareasPendientes}
            </h3>
            <p className="text-orange-200 text-sm">Tareas Pendientes</p>
            <div className="mt-2 text-xs text-orange-300 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Por completar pronto</span>
            </div>
          </div>

          {/* Próximo Evento */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/30 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-300" />
              </div>
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {new Date(proximosEventos[0].fecha).getDate()}
            </h3>
            <p className="text-purple-200 text-sm">Próximo Examen</p>
            <div className="mt-2 text-xs text-purple-300 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{proximosEventos[0].titulo}</span>
            </div>
          </div>
        </div>

        {/* Gráficos y datos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rendimiento por Materia */}
          <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                Calificaciones por Materia
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materiasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="materia"
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af"}}
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
                <Bar dataKey="calificacion" radius={[8, 8, 0, 0]}>
                  {materiasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Radar - Habilidades */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Target className="h-5 w-5 text-purple-400" />
              Perfil de Habilidades
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={habilidadesData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis
                  dataKey="habilidad"
                  tick={{fill: "#9ca3af", fontSize: 10}}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{fill: "#9ca3af"}}
                />
                <Radar
                  name="Habilidades"
                  dataKey="valor"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Progreso mensual */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Progreso Mensual
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={rendimientoMensual}>
              <defs>
                <linearGradient id="colorPromedio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="mes" stroke="#9ca3af" tick={{fill: "#9ca3af"}} />
              <YAxis
                stroke="#9ca3af"
                tick={{fill: "#9ca3af"}}
                domain={[70, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Area
                type="monotone"
                dataKey="promedio"
                stroke="#06b6d4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPromedio)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Próximos eventos y logros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos Eventos */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-blue-400" />
              Próximos Eventos
            </h2>
            <div className="space-y-4">
              {proximosEventos.map((evento, index) => {
                const Icon = evento.icon;
                return (
                  <div
                    key={index}
                    className={`${evento.bgColor} border border-gray-700 rounded-lg p-4 hover:scale-102 transition-transform duration-200`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 bg-gray-800/50 rounded-lg ${evento.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {evento.titulo}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {evento.materia}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(evento.fecha).toLocaleDateString(
                              "es-ES",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {evento.hora}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logros Recientes */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-yellow-400" />
              Logros Recientes
            </h2>
            <div className="space-y-4">
              {logros.map((logro, index) => {
                const Icon = logro.icon;
                return (
                  <div
                    key={index}
                    className={`${logro.bgColor} border border-gray-700 rounded-lg p-4 hover:scale-102 transition-transform duration-200`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-2 bg-gray-800/50 rounded-lg ${logro.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">
                          {logro.titulo}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          {logro.descripcion}
                        </p>
                        <p className="text-xs text-gray-500">{logro.fecha}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-md border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/30 rounded-lg">
              <Zap className="h-8 w-8 text-cyan-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                ¡Sigue así! 🎯
              </h3>
              <p className="text-cyan-100">
                Tu promedio ha mejorado un 5% este mes. Continúa con ese
                excelente trabajo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardEstudiante;
