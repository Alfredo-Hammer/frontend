import React, {useState, useEffect} from "react";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  CheckCircle,
  Star,
  FileText,
  Activity,
  Bell,
  MessageCircle,
  Heart,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  Cell,
} from "recharts";

function DashboardPadre({user}) {
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState(0);
  const [escuela, setEscuela] = useState(null);
  const token = localStorage.getItem("token");

  // Datos simulados de los hijos
  const hijos = [
    {
      id: 1,
      nombre: "María González",
      grado: "5to Grado",
      seccion: "A",
      promedio: 87.5,
      asistencia: 95,
      imagen: null,
      materias: [
        {nombre: "Matemáticas", calificacion: 85, profesor: "Prof. García"},
        {nombre: "Español", calificacion: 92, profesor: "Prof. Martínez"},
        {nombre: "Ciencias", calificacion: 88, profesor: "Prof. López"},
        {nombre: "Historia", calificacion: 86, profesor: "Prof. Rodríguez"},
        {nombre: "Inglés", calificacion: 90, profesor: "Prof. Fernández"},
      ],
      proximosEventos: [
        {
          tipo: "examen",
          titulo: "Examen de Matemáticas",
          fecha: "2025-11-28",
          materia: "Matemáticas",
        },
        {
          tipo: "tarea",
          titulo: "Ensayo de Historia",
          fecha: "2025-11-26",
          materia: "Historia",
        },
      ],
      comportamiento: "Excelente",
      notasProfesor: [
        {
          profesor: "Prof. García",
          comentario: "Excelente participación en clase",
          fecha: "Hace 2 días",
        },
        {
          profesor: "Prof. Martínez",
          comentario: "Muy buena redacción en sus trabajos",
          fecha: "Hace 5 días",
        },
      ],
    },
  ];

  // Datos de progreso mensual del hijo seleccionado
  const progresoMensual = [
    {mes: "Ene", promedio: 82, asistencia: 90},
    {mes: "Feb", promedio: 85, asistencia: 92},
    {mes: "Mar", promedio: 87, asistencia: 94},
    {mes: "Abr", promedio: 86, asistencia: 93},
    {mes: "May", promedio: 88, asistencia: 95},
    {mes: "Jun", promedio: 87.5, asistencia: 95},
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
    cargarEscuela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEscuela = async () => {
    try {
      if (user?.id_escuela) {
        const res = await fetch(
          `http://localhost:4000/api/escuelas/${user.id_escuela}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        const data = await res.json();
        setEscuela(data);
      }
    } catch (error) {
      console.error("Error al cargar escuela:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando información...</p>
        </div>
      </div>
    );
  }

  const hijoActual = hijos[selectedChild];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-300/10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2">
                  <Heart className="h-8 w-8" />
                  ¡Hola, {user.nombre}!
                </h1>
                <p className="text-purple-100 text-lg">
                  Seguimiento del progreso académico de tus hijos
                </p>
              </div>

              {/* Selector de hijos */}
              <div className="mt-4 md:mt-0 flex items-center gap-4">
                {hijos.length > 1 && (
                  <select
                    value={selectedChild}
                    onChange={(e) => setSelectedChild(Number(e.target.value))}
                    className="bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    {hijos.map((hijo, index) => (
                      <option
                        key={hijo.id}
                        value={index}
                        className="bg-gray-800"
                      >
                        {hijo.nombre}
                      </option>
                    ))}
                  </select>
                )}
                {escuela?.logo && (
                  <img
                    src={`http://localhost:4000${escuela.logo}`}
                    alt={escuela.nombre}
                    className="w-20 h-20 rounded-lg object-cover border-4 border-white shadow-lg"
                  />
                )}
              </div>
            </div>

            {/* Info del hijo seleccionado */}
            <div className="mt-6 flex items-center gap-6">
              <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">
                    {hijoActual.nombre}
                  </div>
                  <div className="text-purple-100 text-sm">
                    {hijoActual.grado} - Sección {hijoActual.seccion}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Promedio General */}
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-md border border-blue-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-300" />
              </div>
              <Award className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {hijoActual.promedio}
            </h3>
            <p className="text-blue-200 text-sm">Promedio General</p>
            <div className="mt-2 text-xs text-green-300 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>+5% este mes</span>
            </div>
          </div>

          {/* Asistencia */}
          <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-300" />
              </div>
              <Trophy className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {hijoActual.asistencia}%
            </h3>
            <p className="text-green-200 text-sm">Asistencia</p>
            <div className="mt-2 text-xs text-yellow-300 flex items-center gap-1">
              <Star className="h-3 w-3" />
              <span>Excelente asistencia</span>
            </div>
          </div>

          {/* Materias */}
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-300" />
              </div>
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {hijoActual.materias.length}
            </h3>
            <p className="text-purple-200 text-sm">Materias Activas</p>
            <div className="mt-2 text-xs text-purple-300 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>Todas al día</span>
            </div>
          </div>

          {/* Comportamiento */}
          <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 backdrop-blur-md border border-rose-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-500/30 rounded-lg">
                <Heart className="h-6 w-6 text-rose-300" />
              </div>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {hijoActual.comportamiento}
            </h3>
            <p className="text-rose-200 text-sm">Comportamiento</p>
            <div className="mt-2 text-xs text-yellow-300 flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>Sin incidentes</span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calificaciones por Materia */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <BookOpen className="h-5 w-5 text-cyan-400" />
              Calificaciones por Materia
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hijoActual.materias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="nombre"
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af", fontSize: 11}}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af"}}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="calificacion" radius={[8, 8, 0, 0]}>
                  {hijoActual.materias.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.calificacion >= 90
                          ? "#10b981"
                          : entry.calificacion >= 80
                          ? "#3b82f6"
                          : entry.calificacion >= 70
                          ? "#f59e0b"
                          : "#ef4444"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Progreso Mensual */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Progreso Mensual
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progresoMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="mes"
                  stroke="#9ca3af"
                  tick={{fill: "#9ca3af"}}
                />
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
                <Legend />
                <Line
                  type="monotone"
                  dataKey="promedio"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  name="Promedio"
                />
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Asistencia"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detalle de materias y eventos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Materias con Profesores */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-purple-400" />
              Materias y Profesores
            </h2>
            <div className="space-y-3">
              {hijoActual.materias.map((materia, index) => (
                <div
                  key={index}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-purple-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">
                      {materia.nombre}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        materia.calificacion >= 90
                          ? "bg-green-500/20 text-green-300"
                          : materia.calificacion >= 80
                          ? "bg-blue-500/20 text-blue-300"
                          : materia.calificacion >= 70
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {materia.calificacion}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{materia.profesor}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-blue-400" />
              Próximos Eventos
            </h2>
            <div className="space-y-4">
              {hijoActual.proximosEventos.map((evento, index) => (
                <div
                  key={index}
                  className={`${
                    evento.tipo === "examen"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-blue-500/10 border-blue-500/30"
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 bg-gray-800/50 rounded-lg ${
                        evento.tipo === "examen"
                          ? "text-red-400"
                          : "text-blue-400"
                      }`}
                    >
                      {evento.tipo === "examen" ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <BookOpen className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">
                        {evento.titulo}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {evento.materia}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(evento.fecha).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Recordatorio */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-semibold text-sm">Recordatorio</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Tu hijo tiene un examen de Matemáticas en 3 días. Recuerda
                  ayudarle a repasar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Comentarios de Profesores */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <MessageCircle className="h-5 w-5 text-cyan-400" />
            Comentarios de Profesores
          </h2>
          <div className="space-y-4">
            {hijoActual.notasProfesor.map((nota, index) => (
              <div
                key={index}
                className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">
                        {nota.profesor}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {nota.fecha}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{nota.comentario}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje motivacional */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/30 rounded-lg">
              <Heart className="h-8 w-8 text-purple-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                ¡Excelente progreso! 🎉
              </h3>
              <p className="text-purple-100">
                {hijoActual.nombre} ha mejorado su promedio un 5% este mes. Tu
                apoyo es fundamental para su éxito académico.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPadre;
