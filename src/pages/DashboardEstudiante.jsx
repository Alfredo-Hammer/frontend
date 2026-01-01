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
  Activity,
  Trophy,
  Zap,
  Users,
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
  Cell,
} from "recharts";

import api from "../api/axiosConfig";
import {useNavigate} from "react-router-dom";
import services from "../api/services";
//JkWzR#PnEx
function DashboardEstudiante({user}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nextExam, setNextExam] = useState(null);
  const [promedio, setPromedio] = useState(0);
  const [proximaClase, setProximaClase] = useState(null);
  const [stats, setStats] = useState({
    totalMaterias: 0,
    asistenciaPromedio: 0,
    proximasEvaluaciones: 0,
  });
  const token = localStorage.getItem("token");

  // Calificaciones reales del alumno para gráficos y conteos
  const [calificacionesAlumno, setCalificacionesAlumno] = useState([]);
  // Datos de rendimiento mensual
  const rendimientoMensual = [
    {mes: "Ene", promedio: 82},
    {mes: "Feb", promedio: 85},
    {mes: "Mar", promedio: 87},
    {mes: "Abr", promedio: 86},
    {mes: "May", promedio: 88},
    {mes: "Jun", promedio: 87},
  ];

  // Habilidades derivadas de datos reales (calificaciones y asistencia)

  // Próximas tareas y exámenes
  const proximosEventos = [];

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

  const cargarDatosEstudiante = async () => {
    try {
      // Cargar estadísticas del estudiante
      const statsRes = await api.get(services.dashboardEstudiante, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setStats({
        totalMaterias: statsRes.data.totalMaterias || 0,
        asistenciaPromedio: parseFloat(statsRes.data.asistenciaPromedio) || 0,
        proximasEvaluaciones: statsRes.data.proximasEvaluaciones || 0,
      });
      // El promedio general se calculará desde las calificaciones del alumno
    } catch (error) {
      console.error("Error al cargar estadísticas del estudiante:", error);
      setStats({
        totalMaterias: 6,
        asistenciaPromedio: 92,
        proximasEvaluaciones: 2,
      });
    } finally {
      setLoading(false);
    }
  };

  const cargarPromedioDesdeCalificaciones = async () => {
    try {
      const perfilRes = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const perfil = perfilRes.data?.usuario || perfilRes.data || {};
      const alumnoId = perfil.id_usuario || perfilRes.data?.id_usuario;

      if (!alumnoId) {
        setPromedio(0);
        return;
      }

      const calRes = await api.get(
        `${services.calificacionesMateriasAlumno}/${alumnoId}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );

      const calificaciones = Array.isArray(calRes.data) ? calRes.data : [];
      setCalificacionesAlumno(calificaciones);
      if (calificaciones.length === 0) {
        setPromedio(0);
        return;
      }

      const acumulado = calificaciones.reduce(
        (acc, cal) => {
          const b1 = parseFloat(cal.bimestre_1) || 0;
          const b2 = parseFloat(cal.bimestre_2) || 0;
          const b3 = parseFloat(cal.bimestre_3) || 0;
          const b4 = parseFloat(cal.bimestre_4) || 0;
          const final = (b1 + b2 + b3 + b4) / 4;
          if (final > 0) {
            acc.suma += final;
            acc.count += 1;
          }
          return acc;
        },
        {suma: 0, count: 0}
      );

      const promedioCalc =
        acumulado.count > 0 ? acumulado.suma / acumulado.count : 0;
      setPromedio(promedioCalc);
    } catch (e) {
      console.error("No se pudo calcular el promedio desde calificaciones:", e);
      setPromedio(0);
    }
  };

  const cargarProximoExamen = async () => {
    try {
      // Obtener perfil y contexto del alumno
      const perfilRes = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const usuario = perfilRes.data?.usuario || perfilRes.data || {};
      if (String(usuario?.rol).toLowerCase() !== "alumno") {
        setNextExam(null);
        return;
      }
      const infoRes = await api.get(
        `/api/calificaciones/alumno-info/${usuario.id_usuario}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      const info = infoRes.data || null;

      // Cargar exámenes y filtrar por grado/sección del alumno
      const exRes = await api.get("/api/examenes", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const lista = Array.isArray(exRes.data)
        ? exRes.data
        : exRes.data?.data || [];

      const gradeIds = [];
      const sectionIds = [];
      if (info?.id_grado) gradeIds.push(String(info.id_grado));
      if (Array.isArray(info?.grados)) {
        info.grados.forEach((g) => gradeIds.push(String(g.id_grado || g)));
      }
      if (info?.id_seccion) sectionIds.push(String(info.id_seccion));
      if (Array.isArray(info?.secciones)) {
        info.secciones.forEach((s) =>
          sectionIds.push(String(s.id_seccion || s))
        );
      }
      const uniqueGrades = [...new Set(gradeIds)].filter(Boolean);
      const uniqueSections = [...new Set(sectionIds)].filter(Boolean);

      const coincideGrado = (e) =>
        uniqueGrades.length === 0 || uniqueGrades.includes(String(e.id_grado));
      const coincideSeccion = (e) =>
        uniqueSections.length === 0 ||
        uniqueSections.includes(String(e.id_seccion));

      const ahora = new Date();
      const proximosActivos = lista
        .filter(
          (e) =>
            coincideGrado(e) &&
            coincideSeccion(e) &&
            String(e.estado).toLowerCase() === "activo" &&
            new Date(e.fecha_examen) >= ahora
        )
        .sort((a, b) => new Date(a.fecha_examen) - new Date(b.fecha_examen));

      setNextExam(proximosActivos[0] || null);
    } catch (error) {
      console.error("Error al cargar próximo examen:", error);
      setNextExam(null);
    }
  };

  // Utilidades para mostrar estado y hora con zona horaria
  const isNextExamSoon = (exam) => {
    if (!exam) return false;
    const fecha = new Date(exam.fecha_examen);
    const ahora = new Date();
    const diff = fecha - ahora;
    return (
      String(exam.estado).toLowerCase() === "activo" &&
      diff >= 0 &&
      diff <= 24 * 60 * 60 * 1000
    );
  };

  const getNextExamBadgeClass = (exam) => {
    if (!exam) return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    if (isNextExamSoon(exam))
      return "bg-orange-500/10 text-orange-300 border-orange-500/20";
    const estado = String(exam.estado).toLowerCase();
    if (estado === "activo")
      return "bg-green-500/10 text-green-400 border-green-500/20";
    if (estado === "finalizado")
      return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  };

  const formatTimeAMPM = (dateStr) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // Próxima clase del alumno desde horarios
  const DIAS_SEMANA = [
    {id: 1, short: "LUN", label: "Lunes"},
    {id: 2, short: "MAR", label: "Martes"},
    {id: 3, short: "MIE", label: "Miércoles"},
    {id: 4, short: "JUE", label: "Jueves"},
    {id: 5, short: "VIE", label: "Viernes"},
    {id: 6, short: "SAB", label: "Sábado"},
  ];

  const toMinutes = (h) => {
    if (!h) return 0;
    const hhmm = h.substring(0, 5);
    const [hh, mm] = hhmm.split(":");
    return parseInt(hh || "0", 10) * 60 + parseInt(mm || "0", 10);
  };

  const formatHourLabel = (h) => {
    if (!h) return "--:--";
    const hhmm = h.substring(0, 5);
    const [hh, mm] = hhmm.split(":");
    const hour = parseInt(hh, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12.toString().padStart(2, "0")}:${mm} ${ampm}`;
  };

  const cargarProximaClase = async () => {
    try {
      const perfilRes = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const usuario = perfilRes.data?.usuario || perfilRes.data || {};
      if (String(usuario?.rol).toLowerCase() !== "alumno") {
        setProximaClase(null);
        return;
      }

      const infoRes = await api.get(
        `/api/calificaciones/alumno-info/${usuario.id_usuario}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      const info = infoRes.data || null;

      // Usar carga académica por sección para asegurar clases del alumno
      if (!info?.id_seccion) {
        setProximaClase(null);
        return;
      }
      const caRes = await api.get(
        services.cargaAcademicaSeccion(info.id_seccion),
        {headers: {Authorization: `Bearer ${token}`}}
      );
      const cargas = Array.isArray(caRes.data?.data)
        ? caRes.data.data
        : Array.isArray(caRes.data)
        ? caRes.data
        : [];

      // Filtrar solo las asignaciones con horario
      const relevantes = cargas
        .filter((c) => c.dia_semana && c.hora_inicio && c.hora_fin)
        .map((c) => ({
          dia_semana: Number(c.dia_semana),
          hora_inicio: c.hora_inicio,
          hora_fin: c.hora_fin,
          materia_nombre: c.materia_nombre || c.materia,
          profesor_nombre: c.profesor_nombre || c.profesor,
        }))
        .sort((a, b) => {
          if (a.dia_semana === b.dia_semana)
            return toMinutes(a.hora_inicio) - toMinutes(b.hora_inicio);
          return a.dia_semana - b.dia_semana;
        });

      if (relevantes.length === 0) {
        setProximaClase(null);
        return;
      }

      const now = new Date();
      const jsDay = now.getDay(); // 0..6 (Domingo=0)
      const hoyId = jsDay === 0 ? 7 : jsDay; // Mapear domingo a 7 para ordenar
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // Buscar próxima clase hoy
      let candidata = null;
      candidata = relevantes.find(
        (h) => h.dia_semana === hoyId && toMinutes(h.hora_inicio) > nowMinutes
      );

      // Si no hay hoy, buscar la primera del siguiente día disponible
      if (!candidata) {
        const siguientesDias = relevantes
          .map((h) => h.dia_semana)
          .filter((d) => d > hoyId);
        const proximoDia = siguientesDias.length
          ? Math.min(...siguientesDias)
          : Math.min(...relevantes.map((h) => h.dia_semana));
        candidata = relevantes.find((h) => h.dia_semana === proximoDia);
      }

      setProximaClase(candidata || relevantes[0] || null);
    } catch (error) {
      console.error("Error al cargar próxima clase:", error);
      setProximaClase(null);
    }
  };

  // Preparar datos para gráfico de barras desde calificaciones reales
  const colorPalette = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#22c55e",
    "#eab308",
  ];
  const materiasChartData = calificacionesAlumno.map((cal, idx) => {
    const b1 = parseFloat(cal.bimestre_1) || 0;
    const b2 = parseFloat(cal.bimestre_2) || 0;
    const b3 = parseFloat(cal.bimestre_3) || 0;
    const b4 = parseFloat(cal.bimestre_4) || 0;
    const final = (b1 + b2 + b3 + b4) / 4;
    return {
      materia: cal.materia,
      calificacion: final,
      color: colorPalette[idx % colorPalette.length],
    };
  });

  // Calcular perfil de habilidades desde materias y asistencia
  const normalizar = (txt) =>
    (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const habilidadDefs = [
    {nombre: "Matemáticas", keywords: ["matematica"]},
    {nombre: "Comunicación", keywords: ["espanol", "lengua", "comunicacion"]},
    {
      nombre: "Ciencias",
      keywords: ["ciencia", "biologia", "fisica", "quimica"],
    },
    {nombre: "Idiomas", keywords: ["ingles", "frances"]},
    {nombre: "Creatividad", keywords: ["arte", "musica", "artistica"]},
    {nombre: "Educación Física", keywords: ["educacion fisica", "deporte"]},
    {
      nombre: "Tecnología",
      keywords: ["tecnologia", "informatica", "computacion", "tic"],
    },
    {
      nombre: "Valores",
      keywords: ["valores", "formacion", "civica", "orientacion"],
    },
    {nombre: "Proyecto", keywords: ["proyecto", "investigacion", "seminario"]},
  ];

  const habilidadesChartData = (() => {
    const data = [];
    // Derivar desde calificaciones por materia
    habilidadDefs.forEach((hab) => {
      const finales = calificacionesAlumno
        .filter((cal) => {
          const m = normalizar(cal.materia);
          return hab.keywords.some((kw) => m.includes(kw));
        })
        .map((cal) => {
          const b1 = parseFloat(cal.bimestre_1) || 0;
          const b2 = parseFloat(cal.bimestre_2) || 0;
          const b3 = parseFloat(cal.bimestre_3) || 0;
          const b4 = parseFloat(cal.bimestre_4) || 0;
          return (b1 + b2 + b3 + b4) / 4;
        })
        .filter((v) => v > 0);

      if (finales.length > 0) {
        const avg = finales.reduce((a, b) => a + b, 0) / finales.length;
        data.push({habilidad: hab.nombre, valor: avg});
      }
    });

    // Añadir responsabilidad desde asistencia si disponible
    if (stats?.asistenciaPromedio) {
      data.push({
        habilidad: "Responsabilidad",
        valor: stats.asistenciaPromedio,
      });
    }

    return data;
  })();

  useEffect(() => {
    cargarDatosEstudiante();
    cargarPromedioDesdeCalificaciones();
    cargarProximoExamen();
    cargarProximaClase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

              <div className="mt-4 md:mt-0 grid grid-cols-2 gap-3 sm:gap-4 md:flex md:items-center md:gap-4">
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center w-full md:w-36 h-24 flex flex-col justify-center">
                  <div className="text-3xl md:text-4xl font-bold text-white leading-none">
                    {promedio.toFixed(1)}
                  </div>
                  <div className="text-cyan-100 text-sm">Promedio General</div>
                  <div
                    className={`mt-1 text-xs font-medium ${
                      promedio >= 70 ? "text-green-300" : "text-red-300"
                    }`}
                  >
                    Estado: {promedio >= 70 ? "Aprobado" : "Reprobado"}
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-center w-full md:w-36 h-24 flex flex-col justify-center">
                  <div className="text-3xl md:text-4xl font-bold text-white leading-none">
                    {stats.asistenciaPromedio.toFixed(1)}%
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
              {stats.totalMaterias || calificacionesAlumno.length}
            </h3>
            <p className="text-blue-200 text-sm">Materias Activas</p>
            <div className="mt-2 text-xs text-green-300 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Todas al día</span>
            </div>
          </div>

          {/* Próxima Clase del Alumno */}
          <div
            onClick={() => navigate("/horario-clases")}
            className="cursor-pointer bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-md border border-emerald-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/30 rounded-lg">
                <Clock className="h-6 w-6 text-emerald-300" />
              </div>
              {proximaClase && (
                <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border bg-emerald-500/10 text-emerald-300 border-emerald-500/20">
                  {DIAS_SEMANA.find((d) => d.id === proximaClase.dia_semana)
                    ?.short || ""}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1 truncate">
              {proximaClase
                ? proximaClase.materia_nombre || proximaClase.materia
                : "Sin clase próxima"}
            </h3>
            <p className="text-emerald-200 text-sm">Próxima Clase</p>
            <div className="mt-2 text-xs text-emerald-300 flex flex-wrap items-center gap-3">
              {proximaClase && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {formatHourLabel(proximaClase.hora_inicio)} -{" "}
                    {formatHourLabel(proximaClase.hora_fin)}
                  </span>
                </span>
              )}
              {proximaClase &&
                (proximaClase.profesor_nombre || proximaClase.profesor) && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>
                      {proximaClase.profesor_nombre || proximaClase.profesor}
                    </span>
                  </span>
                )}
            </div>
          </div>

          {/* Ver mis Calificaciones */}
          <div
            onClick={() => navigate("/mis-calificaciones")}
            className="cursor-pointer bg-gradient-to-br from-indigo-500/20 to-blue-600/20 backdrop-blur-md border border-indigo-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-500/30 rounded-lg">
                <Award className="h-6 w-6 text-indigo-300" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              Ver mis calificaciones
            </h3>
            <p className="text-indigo-200 text-sm">
              Consulta tu detalle por materia y notas finales
            </p>
            <div className="mt-3 text-sm text-white/80">
              Promedio actual:{" "}
              <span className="font-bold text-white">
                {promedio.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Próximo Examen (real) */}
          <div
            onClick={() => navigate("/examenes")}
            className="cursor-pointer bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 hover:scale-105 transition-transform duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/30 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-300" />
              </div>
              {nextExam && (
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${getNextExamBadgeClass(
                    nextExam
                  )}`}
                >
                  {nextExam.estado}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {nextExam ? new Date(nextExam.fecha_examen).getDate() : "-"}
            </h3>
            <p className="text-purple-200 text-sm">Próximo Examen</p>
            <div className="mt-2 text-xs text-purple-300 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {nextExam ? nextExam.titulo : "Sin exámenes próximos"}
                </span>
              </span>
              {nextExam && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAMPM(nextExam.fecha_examen)}</span>
                </span>
              )}
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
              <BarChart data={materiasChartData}>
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
                  {materiasChartData.map((entry, index) => (
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
              <RadarChart data={habilidadesChartData}>
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
