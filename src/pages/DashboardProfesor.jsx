import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

/**
 * Dashboard para Profesores
 * Muestra sus materias, estudiantes y accesos rápidos
 */
function DashboardProfesor({user}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    materiasAsignadas: 0,
    totalEstudiantes: 0,
    tareasCreadas: 0,
    calificacionesPendientes: 0,
  });
  const [misMaterias, setMisMaterias] = useState([]);
  const [proximasClases, setProximasClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarDatosProfesor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosProfesor = async () => {
    try {
      setLoading(true);

      // Cargar materias del profesor
      const materiasRes = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // TODO: Filtrar solo las materias asignadas al profesor actual
      // Por ahora mostramos todas
      setMisMaterias(materiasRes.data?.slice(0, 4) || []);

      setStats({
        materiasAsignadas: 5,
        totalEstudiantes: 120,
        tareasCreadas: 15,
        calificacionesPendientes: 8,
      });

      setProximasClases([
        {
          materia: "Matemáticas",
          grado: "10°A",
          hora: "08:00 AM",
          salon: "Aula 101",
        },
        {
          materia: "Física",
          grado: "11°B",
          hora: "10:00 AM",
          salon: "Lab. Ciencias",
        },
        {
          materia: "Matemáticas",
          grado: "9°C",
          hora: "02:00 PM",
          salon: "Aula 205",
        },
      ]);
    } catch (error) {
      console.error("Error al cargar datos del profesor:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Bienvenido, Profesor {user?.nombre} 👋
              </h1>
              <p className="text-purple-100">
                Panel del Docente - Gestiona tus clases y estudiantes
              </p>
            </div>
            <div className="text-right">
              <p className="text-purple-100 text-sm">
                {new Date().toLocaleDateString("es-ES", {weekday: "long"})}
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <BookOpenIcon className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Materias Asignadas
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.materiasAsignadas}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <UserGroupIcon className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Total Estudiantes
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.totalEstudiantes}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DocumentTextIcon className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Tareas Creadas
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.tareasCreadas}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">
              Calificaciones Pendientes
            </h3>
            <p className="text-3xl font-bold text-white">
              {stats.calificacionesPendientes}
            </p>
          </div>
        </div>

        {/* Accesos Rápidos y Próximas Clases */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accesos Rápidos */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AcademicCapIcon className="w-6 h-6 text-purple-400" />
              Accesos Rápidos
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/calificaciones")}
                className="w-full p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChartBarIcon className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">
                        Gestionar Calificaciones
                      </p>
                      <p className="text-gray-400 text-sm">
                        Ingresa y edita calificaciones
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/asistencia")}
                className="w-full p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClockIcon className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Pasar Asistencia</p>
                      <p className="text-gray-400 text-sm">
                        Registra asistencia diaria
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/horario-clases")}
                className="w-full p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarDaysIcon className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Mi Horario</p>
                      <p className="text-gray-400 text-sm">
                        Ver horario de clases
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>

              <button
                onClick={() => navigate("/alumnos")}
                className="w-full p-4 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 rounded-lg hover:scale-105 transition-transform text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserGroupIcon className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="text-white font-medium">Mis Estudiantes</p>
                      <p className="text-gray-400 text-sm">
                        Ver lista de estudiantes
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            </div>
          </div>

          {/* Próximas Clases */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CalendarDaysIcon className="w-6 h-6 text-cyan-400" />
              Próximas Clases de Hoy
            </h2>
            <div className="space-y-3">
              {proximasClases.map((clase, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-lg border border-gray-600 hover:border-cyan-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        {clase.materia}
                      </h3>
                      <p className="text-gray-400 text-sm">{clase.grado}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-semibold">
                        {clase.hora}
                      </p>
                      <p className="text-gray-400 text-sm">{clase.salon}</p>
                    </div>
                  </div>
                </div>
              ))}

              {proximasClases.length === 0 && (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">
                    No hay clases programadas para hoy
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mis Materias */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpenIcon className="w-6 h-6 text-purple-400" />
            Mis Materias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {misMaterias.map((materia, idx) => (
              <div
                key={materia.id_materia || idx}
                className="p-4 bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={() => navigate("/calificaciones")}
              >
                <BookOpenIcon className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="text-white font-semibold mb-1">
                  {materia.nombre || materia.materia}
                </h3>
                <p className="text-gray-400 text-sm">Ver detalles →</p>
              </div>
            ))}

            {misMaterias.length === 0 && (
              <div className="col-span-4 text-center py-8">
                <BookOpenIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No tienes materias asignadas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardProfesor;
