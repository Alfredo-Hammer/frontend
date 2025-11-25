import React, {useState, useEffect} from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  School,
  Users,
  BookOpen,
  UserCheck,
  TrendingUp,
  Calendar,
  Bell,
  Award,
  Activity,
  Target,
} from "lucide-react";
import DashboardAdmin from "./DashboardAdmin";
import DashboardProfesor from "./DashboardProfesor";
import DashboardEstudiante from "./DashboardEstudiante";
import DashboardPadre from "./DashboardPadre";
import api from "../api/axiosConfig";

// Datos simulados más realistas
const data = [
  {name: "Alumnos", value: 1247, growth: "+12%", color: "#3b82f6"},
  {name: "Profesores", value: 89, growth: "+5%", color: "#10b981"},
  {name: "Escuelas", value: 15, growth: "+2%", color: "#f59e0b"},
  {name: "Materias", value: 42, growth: "+8%", color: "#ef4444"},
];

const monthlyData = [
  {month: "Ene", estudiantes: 1100, profesores: 78},
  {month: "Feb", estudiantes: 1150, profesores: 80},
  {month: "Mar", estudiantes: 1180, profesores: 82},
  {month: "Abr", estudiantes: 1200, profesores: 85},
  {month: "May", estudiantes: 1220, profesores: 87},
  {month: "Jun", estudiantes: 1247, profesores: 89},
];

const schoolPerformance = [
  {name: "Escuela A", score: 95},
  {name: "Escuela B", score: 88},
  {name: "Escuela C", score: 92},
  {name: "Escuela D", score: 85},
  {name: "Escuela E", score: 90},
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const quickActions = [
  {
    label: "Gestionar Escuelas",
    href: "/escuelas",
    icon: <School className="w-6 h-6" />,
    description: "Administrar instituciones educativas",
    color: "from-blue-500 to-blue-700",
    bgColor: "bg-blue-500/10 border-blue-500/20",
    textColor: "text-blue-300",
  },
  {
    label: "Ver Estudiantes",
    href: "/alumnos",
    icon: <Users className="w-6 h-6" />,
    description: "Lista completa de alumnos",
    color: "from-green-500 to-green-700",
    bgColor: "bg-green-500/10 border-green-500/20",
    textColor: "text-green-300",
  },
  {
    label: "Profesores",
    href: "/profesores",
    icon: <UserCheck className="w-6 h-6" />,
    description: "Gestión del personal docente",
    color: "from-yellow-500 to-yellow-700",
    bgColor: "bg-yellow-500/10 border-yellow-500/20",
    textColor: "text-yellow-300",
  },
  {
    label: "Materias",
    href: "/materias",
    icon: <BookOpen className="w-6 h-6" />,
    description: "Catálogo de asignaturas",
    color: "from-purple-500 to-purple-700",
    bgColor: "bg-purple-500/10 border-purple-500/20",
    textColor: "text-purple-300",
  },
  {
    label: "Reportes",
    href: "/reportes",
    icon: <TrendingUp className="w-6 h-6" />,
    description: "Análisis y estadísticas",
    color: "from-indigo-500 to-indigo-700",
    bgColor: "bg-indigo-500/10 border-indigo-500/20",
    textColor: "text-indigo-300",
  },
  {
    label: "Calendario",
    href: "/calendario",
    icon: <Calendar className="w-6 h-6" />,
    description: "Eventos y actividades",
    color: "from-pink-500 to-pink-700",
    bgColor: "bg-pink-500/10 border-pink-500/20",
    textColor: "text-pink-300",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Nueva escuela registrada",
    detail: "Instituto San José",
    time: "Hace 2 horas",
    icon: <School className="w-4 h-4" />,
    color: "text-blue-400",
  },
  {
    id: 2,
    action: "Alumno matriculado",
    detail: "María González - 3° Grado",
    time: "Hace 4 horas",
    icon: <Users className="w-4 h-4" />,
    color: "text-green-400",
  },
  {
    id: 3,
    action: "Profesor asignado",
    detail: "Juan Pérez - Matemáticas",
    time: "Hace 6 horas",
    icon: <UserCheck className="w-4 h-4" />,
    color: "text-yellow-400",
  },
  {
    id: 4,
    action: "Materia actualizada",
    detail: "Ciencias Naturales",
    time: "Hace 1 día",
    icon: <BookOpen className="w-4 h-4" />,
    color: "text-purple-400",
  },
];

function HomePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState(data.map(() => 0));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValues(data.map((item) => item.value));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Obtener información del usuario
  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const res = await api.get("/api/usuarios/perfil", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setUser({
          nombre: res.data.usuario?.nombre || res.data.nombre,
          apellido: res.data.usuario?.apellido || res.data.apellido,
          rol: res.data.usuario?.rol || res.data.rol,
          email: res.data.usuario?.email || res.data.email,
        });
      } catch (error) {
        console.error("Error al obtener usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      obtenerUsuario();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Mostrar loader mientras carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirigir a dashboard específico según el rol
  if (user && user.rol) {
    console.log("🔍 Debug - Rol del usuario:", user.rol);
    console.log("🔍 Debug - Usuario completo:", user);

    // Normalizar el rol si viene del backend sin normalizar
    const normalizedRole =
      user.rol.toLowerCase() === "estudiante"
        ? "alumno"
        : user.rol.toLowerCase();
    console.log("🔄 Rol normalizado:", normalizedRole);

    switch (normalizedRole) {
      case "admin":
      case "administrador":
      case "director":
        return <DashboardAdmin user={user} />;
      case "profesor":
        return <DashboardProfesor user={user} />;
      case "alumno":
      case "estudiante":
        return <DashboardEstudiante user={user} />;
      case "padre":
        return <DashboardPadre user={user} />;
      default:
        // Si no tiene rol definido, mostrar dashboard genérico
        break;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white mb-4 backdrop-blur-sm">
                <Activity className="w-4 h-4 mr-2" />
                Sistema en línea
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4">
                Sistema
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  AOC
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-6 max-w-2xl">
                Plataforma integral para la gestión educativa moderna.
                Administra escuelas, estudiantes y profesores de manera
                eficiente.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Panel de Control
                </button>
                <button className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold backdrop-blur-sm hover:bg-white/20 transform transition-all duration-300 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Ver Estadísticas
                </button>
              </div>
            </div>

            <div className="flex-1 mt-12 lg:mt-0">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Estado del Sistema
                    </h3>
                    <div className="flex items-center text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      Activo
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-white">
                      <span>Usuarios conectados</span>
                      <span className="font-semibold">47</span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Rendimiento</span>
                      <span className="font-semibold text-green-400">
                        Excelente
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Última actualización</span>
                      <span className="font-semibold">
                        {currentTime.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-16 mb-12 relative z-10">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 hover:scale-105 transform transition-all duration-300 hover:shadow-blue-500/25"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {index === 0 && (
                    <Users className="w-8 h-8 text-blue-400 mr-3" />
                  )}
                  {index === 1 && (
                    <UserCheck className="w-8 h-8 text-green-400 mr-3" />
                  )}
                  {index === 2 && (
                    <School className="w-8 h-8 text-yellow-400 mr-3" />
                  )}
                  {index === 3 && (
                    <BookOpen className="w-8 h-8 text-red-400 mr-3" />
                  )}
                  <div>
                    <p className="text-gray-400 text-sm">{item.name}</p>
                    <p
                      className="text-2xl font-bold text-white"
                      style={{color: item.color}}
                    >
                      {animatedValues[index].toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center bg-green-500/10 px-2 py-1 rounded-full">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm font-medium">
                    {item.growth}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    backgroundColor: item.color,
                    width: `${
                      (animatedValues[index] /
                        Math.max(...data.map((d) => d.value))) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Pie Chart */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Target className="w-6 h-6 text-purple-400 mr-2" />
                Distribución
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                  }}
                />
                <Legend wrapperStyle={{color: "#9CA3AF"}} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Growth Chart */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-400 mr-2" />
                Crecimiento Mensual
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-gray-400 text-sm">Estudiantes</span>
                <div className="w-3 h-3 bg-green-400 rounded-full ml-4"></div>
                <span className="text-gray-400 text-sm">Profesores</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="estudiantes"
                  stroke="#3B82F6"
                  fill="url(#colorStudents)"
                />
                <Area
                  type="monotone"
                  dataKey="profesores"
                  stroke="#10B981"
                  fill="url(#colorTeachers)"
                />
                <defs>
                  <linearGradient
                    id="colorStudents"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="colorTeachers"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Chart */}
          <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Award className="w-6 h-6 text-yellow-400 mr-2" />
                Rendimiento por Escuela
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={schoolPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "12px",
                    color: "#F3F4F6",
                  }}
                />
                <Bar dataKey="score" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Target className="w-7 h-7 text-blue-400 mr-3" />
              Acciones Rápidas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <a
                  key={action.href}
                  href={action.href}
                  className={`group ${action.bgColor} border rounded-2xl p-6 hover:scale-105 transform transition-all duration-300 hover:shadow-xl`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {action.icon}
                  </div>
                  <h4
                    className={`text-lg font-semibold ${action.textColor} mb-2`}
                  >
                    {action.label}
                  </h4>
                  <p className="text-gray-400 text-sm">{action.description}</p>
                  <div className="flex items-center mt-4 text-gray-400 group-hover:text-white transition-colors duration-300">
                    <span className="text-sm">Acceder</span>
                    <svg
                      className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
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
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Bell className="w-7 h-7 text-green-400 mr-3" />
              Actividad Reciente
            </h3>
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 hover:bg-gray-700 rounded-xl transition-colors duration-200"
                  >
                    <div className={`flex-shrink-0 ${activity.color} mt-1`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {activity.action}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {activity.detail}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200">
                  Ver todas las actividades →
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-6 mt-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Activity className="w-5 h-5 text-green-400 mr-2" />
                Estado del Sistema
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Servidor</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">
                      Operativo
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Base de Datos</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-green-400 text-sm font-medium">
                      Conectada
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Respaldo</span>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    <span className="text-yellow-400 text-sm font-medium">
                      Programado
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center border-t border-gray-700 pt-8">
          <p className="text-gray-400 mb-2">
            &copy; {new Date().getFullYear()} Sistema AOC. Todos los derechos
            reservados.
          </p>
          <p className="text-gray-500 text-sm">
            Desarrollado con ❤️ por Alfredo Hammer
          </p>
        </footer>
      </div>
    </div>
  );
}

export default HomePage;
