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
  const [escuela, setEscuela] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [misGrados, setMisGrados] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarDatosProfesor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosProfesor = async () => {
    try {
      setLoading(true);

      // Cargar datos de la escuela
      if (user?.id_escuela) {
        try {
          const escuelaRes = await api.get(`/api/escuelas/${user.id_escuela}`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          setEscuela(escuelaRes.data);
        } catch (error) {
          console.error("Error al cargar escuela:", error);
        }
      }

      // Cargar asignaciones y materias del profesor
      if (user?.id_profesor) {
        try {
          // Cargar asignaciones (grados y secciones)
          const asignacionesRes = await api.get(
            `/api/profesores/${user.id_profesor}/carga`,
            {headers: {Authorization: `Bearer ${token}`}}
          );

          const rawData = asignacionesRes.data.data || [];

          // Mapear datos del backend al formato esperado por el frontend
          const asignacionesData = rawData.map((item) => ({
            ...item,
            nombre_grado: item.grado_nombre,
            nombre_seccion: item.seccion_nombre,
          }));

          setAsignaciones(asignacionesData);

          const gradosUnicos = [
            ...new Map(
              asignacionesData.map((a) => [
                a.id_grado,
                {
                  id_grado: a.id_grado,
                  nombre_grado: a.nombre_grado,
                  nivel: a.nivel,
                  secciones: [
                    ...new Set(
                      asignacionesData
                        .filter((asig) => asig.id_grado === a.id_grado)
                        .map((asig) => asig.nombre_seccion)
                    ),
                  ],
                },
              ])
            ).values(),
          ];
          setMisGrados(gradosUnicos);

          // Procesar materias únicas desde la carga académica
          const materiasMap = new Map();
          const mapDia = (n) => {
            const d = Number(n);
            return (
              {
                1: "Lunes",
                2: "Martes",
                3: "Miércoles",
                4: "Jueves",
                5: "Viernes",
                6: "Sábado",
                7: "Domingo",
              }[d] || ""
            );
          };
          const toMinutes = (hhmm) => {
            if (!hhmm) return Number.POSITIVE_INFINITY;
            const parts = hhmm.toString().split(":");
            const h = parseInt(parts[0] || "0", 10);
            const m = parseInt(parts[1] || "0", 10);
            return h * 60 + m;
          };
          asignacionesData.forEach((item) => {
            if (!materiasMap.has(item.id_materia)) {
              materiasMap.set(item.id_materia, {
                id_materia: item.id_materia,
                nombre: item.materia_nombre,
                grados: new Set(),
                horarios: new Set(),
                minDia: Number.POSITIVE_INFINITY,
                minHora: Number.POSITIVE_INFINITY,
              });
            }
            const materia = materiasMap.get(item.id_materia);
            materia.grados.add(`${item.nombre_grado} ${item.nombre_seccion}`);
            // Agregar día y hora si existen en la asignación
            if (item.dia_semana && (item.hora_inicio || item.hora_fin)) {
              const dia = mapDia(item.dia_semana);
              const hi = (item.hora_inicio || "").toString().slice(0, 5);
              const hf = (item.hora_fin || "").toString().slice(0, 5);
              const franja = hi && hf ? `${hi}-${hf}` : hi || hf || "";
              if (dia || franja) {
                materia.horarios.add(
                  `${dia}${dia && franja ? " " : ""}${franja}`.trim()
                );
              }
              // Actualizar mínimos para ordenamiento por semana
              const diaNum = parseInt(item.dia_semana, 10);
              if (Number.isFinite(diaNum)) {
                materia.minDia = Math.min(materia.minDia, diaNum);
              }
              const minH = toMinutes(hi);
              materia.minHora = Math.min(materia.minHora, minH);
            }
          });

          const materiasUnicas = Array.from(materiasMap.values())
            .map((m) => ({
              ...m,
              descripcion: Array.from(m.grados).join(", "),
              horariosResumen: Array.from(m.horarios).slice(0, 3),
            }))
            .sort((a, b) => {
              const d = (a.minDia || 99) - (b.minDia || 99);
              if (d !== 0) return d;
              const h =
                (a.minHora || Number.POSITIVE_INFINITY) -
                (b.minHora || Number.POSITIVE_INFINITY);
              if (h !== 0) return h;
              return (a.nombre || "").localeCompare(b.nombre || "");
            });
          setMisMaterias(materiasUnicas);

          // Calcular próximas clases (hoy)
          const fechaHoy = new Date();
          const diaSemanaHoy = fechaHoy.getDay(); // 0-6 (Dom-Sab)
          const diaBackend = diaSemanaHoy === 0 ? 7 : diaSemanaHoy; // 1-7 (Lun-Dom)

          // Hora actual en minutos para filtrar clases pasadas
          const minutosActuales =
            fechaHoy.getHours() * 60 + fechaHoy.getMinutes();

          const clasesHoy = asignacionesData
            .filter((a) => {
              // Filtrar por día (asegurar comparación numérica)
              const diaAsignacion = parseInt(a.dia_semana);
              if (diaAsignacion !== diaBackend) return false;

              // Si no tiene hora fin definida, la mostramos por si acaso
              if (!a.hora_fin) return true;

              // Parsear hora fin (formato HH:MM:SS o HH:MM)
              const [horas, minutos] = a.hora_fin
                .toString()
                .split(":")
                .map(Number);
              const minutosFin = horas * 60 + minutos;

              // Mostrar solo si la clase termina después de ahora (futura o en curso)
              return minutosFin > minutosActuales;
            })
            .sort((a, b) => {
              if (!a.hora_inicio) return 1;
              if (!b.hora_inicio) return -1;
              return a.hora_inicio.localeCompare(b.hora_inicio);
            })
            .map((a) => ({
              materia: a.materia_nombre,
              grado: `${a.nombre_grado} ${a.nombre_seccion}`,
              hora: a.horario_formato || "Hora no definida",
              salon: "Aula asignada",
            }));

          setProximasClases(clasesHoy);

          // Calcular total de estudiantes (suma de matriculados por sección única)
          const seccionesUnicas = new Map();
          asignacionesData.forEach((a) => {
            if (a.id_seccion && !seccionesUnicas.has(a.id_seccion)) {
              seccionesUnicas.set(
                a.id_seccion,
                parseInt(a.estudiantes_matriculados || 0)
              );
            }
          });
          const totalEstudiantes = Array.from(seccionesUnicas.values()).reduce(
            (a, b) => a + b,
            0
          );

          // Cargar estadísticas adicionales del profesor
          try {
            const statsRes = await api.get(services.dashboardProfesor, {
              headers: {Authorization: `Bearer ${token}`},
            });

            setStats({
              materiasAsignadas: materiasUnicas.length,
              totalEstudiantes: totalEstudiantes,
              tareasCreadas: statsRes.data.totalCursos || 0,
              calificacionesPendientes: 0,
            });
            console.log("📈 Stats del profesor cargadas:", statsRes.data);
          } catch (error) {
            console.error("Error al cargar estadísticas del profesor:", error);

            setStats({
              materiasAsignadas: materiasUnicas.length,
              totalEstudiantes: totalEstudiantes,
              tareasCreadas: 0,
              calificacionesPendientes: 0,
            });
          }
        } catch (error) {
          console.error(
            "Error al cargar datos del profesor (asignaciones/materias):",
            error
          );
        }
      }
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
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/10 rounded-full blur-2xl animate-pulse delay-700"></div>
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

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                  Bienvenido, Profesor {user?.nombre} 👋
                </h1>
                <p className="text-purple-100 text-lg">
                  Panel del Docente - Gestiona tus clases y estudiantes
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
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

        {/* Mis Grados Asignados */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AcademicCapIcon className="w-6 h-6 text-cyan-400" />
            Mis Grados Asignados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {misGrados.map((grado, idx) => (
              <div
                key={grado.id_grado || idx}
                className="p-6 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 border border-cyan-500/20 rounded-xl hover:scale-105 transition-transform cursor-pointer"
                onClick={() => navigate(`/estudiantes?grado=${grado.id_grado}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-lg">
                    <AcademicCapIcon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      {grado.nombre_grado}
                    </h3>
                    {grado.nivel && (
                      <p className="text-cyan-300 text-sm">{grado.nivel}</p>
                    )}
                    {grado.secciones && grado.secciones.length > 0 && (
                      <p className="text-purple-300 text-sm mt-1">
                        Secciones: {grado.secciones.join(", ")}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-1">
                      Ver estudiantes →
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {misGrados.length === 0 && (
              <div className="col-span-3 text-center py-8">
                <AcademicCapIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">No tienes grados asignados</p>
              </div>
            )}
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
                onClick={() => navigate("/estudiantes")}
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
            Mis Materias Asignadas
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
                <p className="text-gray-400 text-sm mb-2">
                  {materia.descripcion || "Ver detalles →"}
                </p>
                {Array.isArray(materia.horariosResumen) &&
                  materia.horariosResumen.length > 0 && (
                    <div className="text-xs text-purple-300 flex flex-col gap-1">
                      {materia.horariosResumen.map((h, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-purple-400" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  )}
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
