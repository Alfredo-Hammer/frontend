import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import {
  AcademicCapIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  BellIcon,
} from "@heroicons/react/24/solid";

/**
 * Dashboard para Administradores y Directores
 * Muestra estadísticas generales del sistema
 */
function DashboardAdmin({user}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAlumnos: 0,
    totalProfesores: 0,
    totalGrados: 0,
    totalSecciones: 0,
    totalMaterias: 0,
    promedioGeneral: 0,
    asistenciaPromedio: 0,
    alumnosExcelentes: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escuela, setEscuela] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarEstadisticas();
    cargarEscuela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarEscuela = async () => {
    try {
      if (user?.id_escuela) {
        const res = await api.get(`/api/escuelas/${user.id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(res.data);
      }
    } catch (error) {
      console.error("Error al cargar escuela:", error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // Cargar datos en paralelo
      const [alumnosRes, profesoresRes, gradosRes, seccionesRes, materiasRes] =
        await Promise.all([
          api.get("/api/alumnos", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("/api/profesores", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("/api/grados", {headers: {Authorization: `Bearer ${token}`}}),
          api.get("/api/secciones", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("/api/materias", {
            headers: {Authorization: `Bearer ${token}`},
          }),
        ]);

      setStats({
        totalAlumnos: alumnosRes.data?.length || 0,
        totalProfesores: profesoresRes.data?.length || 0,
        totalGrados: gradosRes.data?.length || 0,
        totalSecciones: seccionesRes.data?.length || 0,
        totalMaterias: materiasRes.data?.length || 0,
        promedioGeneral: 85.5, // TODO: Calcular desde API
        asistenciaPromedio: 92.3, // TODO: Calcular desde API
        alumnosExcelentes: 45, // TODO: Calcular desde API
      });

      setRecentActivity([
        {
          tipo: "calificacion",
          mensaje: "Nuevas calificaciones registradas",
          tiempo: "5 min",
        },
        {
          tipo: "alumno",
          mensaje: "3 nuevos estudiantes registrados",
          tiempo: "1 hora",
        },
        {tipo: "profesor", mensaje: "Profesor actualizado", tiempo: "2 horas"},
      ]);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-8 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-300/10 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10">
            {/* Fila superior: Logo y nombre de escuela */}
            {(escuela?.logo || escuela?.nombre) && (
              <div className="flex items-center justify-end gap-4 mb-6 pb-4 border-b border-white/20">
                {escuela?.nombre && (
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">
                      {escuela.nombre}
                    </p>
                    <p className="text-sm text-cyan-100">
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

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  Bienvenido, {user?.nombre} 👋
                </h1>
                <p className="text-cyan-100 text-lg">
                  Panel de Control -{" "}
                  {user?.rol === "admin" ? "Administrador" : "Director"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <p className="text-cyan-100 text-sm">
                    {new Date().toLocaleDateString("es-ES", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-white font-semibold text-lg">
                    {new Date().toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Alumnos */}
          <div
            className="bg-gradient-to-br from-blue-950/50 to-blue-900/50 border border-blue-800/30 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate("/alumnos")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-900/40 rounded-lg">
                <AcademicCapIcon className="w-8 h-8 text-blue-400" />
              </div>
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Total Estudiantes
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalAlumnos}
            </p>
            <p className="text-green-400 text-sm mt-2">+12% este mes</p>
          </div>

          {/* Total Profesores */}
          <div
            className="bg-gradient-to-br from-purple-950/50 to-purple-900/50 border border-purple-800/30 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer"
            onClick={() => navigate("/profesores")}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-900/40 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-purple-400" />
              </div>
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Total Profesores
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalProfesores}
            </p>
            <p className="text-green-400 text-sm mt-2">+3 nuevos</p>
          </div>

          {/* Promedio General */}
          <div className="bg-gradient-to-br from-green-950/50 to-green-900/50 border border-green-800/30 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-900/40 rounded-lg">
                <ChartBarIcon className="w-8 h-8 text-green-400" />
              </div>
              <ArrowTrendingUpIcon className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Promedio General
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.promedioGeneral}
            </p>
            <p className="text-green-400 text-sm mt-2">+2.3 pts</p>
          </div>

          {/* Asistencia */}
          <div className="bg-gradient-to-br from-yellow-950/50 to-yellow-900/50 border border-yellow-800/30 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-900/40 rounded-lg">
                <ClockIcon className="w-8 h-8 text-yellow-400" />
              </div>
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Asistencia Promedio
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.asistenciaPromedio}%
            </p>
            <p className="text-red-400 text-sm mt-2">-1.2% esta semana</p>
          </div>
        </div>

        {/* Estadísticas Secundarias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <BuildingLibraryIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-white font-semibold">Grados</h3>
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalGrados}</p>
          </div>

          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <UserGroupIcon className="w-6 h-6 text-purple-400" />
              <h3 className="text-white font-semibold">Secciones</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalSecciones}
            </p>
          </div>

          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <BookOpenIcon className="w-6 h-6 text-green-400" />
              <h3 className="text-white font-semibold">Materias</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.totalMaterias}
            </p>
          </div>
        </div>

        {/* Sección de Accesos Rápidos y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accesos Rápidos */}
          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <TrophyIcon className="w-6 h-6 text-yellow-400" />
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/calificaciones")}
                className="w-full p-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-700/40 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">
                      Gestionar Calificaciones
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/alumnos/registro")}
                className="w-full p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-700/40 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AcademicCapIcon className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">
                      Registrar Alumno
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/horario-clases")}
                className="w-full p-4 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-700/40 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Ver Horarios</span>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/asistencia")}
                className="w-full p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-700/40 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-medium">
                      Control de Asistencia
                    </span>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className="bg-slate-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BellIcon className="w-6 h-6 text-cyan-400" />
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-900/70 rounded-lg border border-gray-800 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {activity.tipo === "calificacion" && (
                          <ChartBarIcon className="w-5 h-5 text-purple-400" />
                        )}
                        {activity.tipo === "alumno" && (
                          <AcademicCapIcon className="w-5 h-5 text-green-400" />
                        )}
                        {activity.tipo === "profesor" && (
                          <UserGroupIcon className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {activity.mensaje}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          Hace {activity.tiempo}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No hay actividad reciente</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-bold mb-2">
                Recordatorios Importantes
              </h3>
              <ul className="space-y-2 text-gray-300">
                <li>• 5 estudiantes con asistencia menor al 80%</li>
                <li>• 3 profesores pendientes de completar calificaciones</li>
                <li>• Evento escolar programado para el próximo viernes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardAdmin;
