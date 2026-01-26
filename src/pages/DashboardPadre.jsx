import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
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
  const [hijos, setHijos] = useState([]);
  const [progresoMensual, setProgresoMensual] = useState([]);
  const [detallePorHijo, setDetallePorHijo] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        await Promise.all([cargarEscuela(), cargarHijos()]);
      } catch (err) {
        console.error("Error inicializando dashboard padre:", err);
        setErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "No se pudo cargar la información del dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hijo = hijos?.[selectedChild];
    if (!hijo) return;
    cargarDetalleHijo(hijo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChild, hijos?.length]);

  const cargarEscuela = async () => {
    try {
      if (user?.id_escuela) {
        const res = await api.get(`${services.escuelas}/${user.id_escuela}`);
        setEscuela(res.data);
      }
    } catch (error) {
      console.error("Error al cargar escuela:", error);
    }
  };

  const cargarHijos = async () => {
    const res = await api.get(services.padresMisHijos);
    const lista = res?.data?.hijos || [];
    setHijos(lista);
    setSelectedChild(0);
  };

  const _promedioBimestres = (row) => {
    const valores = [
      Number(row?.bimestre_1 || 0),
      Number(row?.bimestre_2 || 0),
      Number(row?.bimestre_3 || 0),
      Number(row?.bimestre_4 || 0),
    ].filter((v) => Number.isFinite(v) && v > 0);

    if (!valores.length) return 0;
    const sum = valores.reduce((acc, v) => acc + v, 0);
    return Math.round(sum / valores.length);
  };

  const _mesLabel = (dateObj) => {
    const labels = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];
    return labels[dateObj.getMonth()];
  };

  const _buildProgresoMensual = ({asistencias = [], promedio = 0}) => {
    const hoy = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        mes: _mesLabel(d),
        y: d.getFullYear(),
        m: d.getMonth(),
      });
    }

    const byMonth = new Map(
      months.map((m) => [m.key, {total: 0, presentes: 0, tardanzas: 0}])
    );

    for (const a of asistencias) {
      const fecha = a?.fecha ? new Date(a.fecha) : null;
      if (!fecha || Number.isNaN(fecha.getTime())) continue;
      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;
      const bucket = byMonth.get(key);
      if (!bucket) continue;

      bucket.total += 1;
      if (a.estado === "P") bucket.presentes += 1;
      else if (a.estado === "T") bucket.tardanzas += 1;
    }

    return months.map((m) => {
      const bucket = byMonth.get(m.key) || {
        total: 0,
        presentes: 0,
        tardanzas: 0,
      };
      const asistencia = bucket.total
        ? Math.round(
            ((bucket.presentes + bucket.tardanzas) / bucket.total) * 100
          )
        : 0;

      return {
        mes: m.mes,
        promedio: Number(promedio) || 0,
        asistencia,
      };
    });
  };

  const cargarDetalleHijo = async (hijo) => {
    const key = String(hijo?.id_usuario_alumno || "");
    if (!key) return;

    // Cache: si ya lo cargamos, solo reflejamos progreso.
    if (detallePorHijo[key]) {
      setProgresoMensual(detallePorHijo[key].progresoMensual || []);
      return;
    }

    try {
      const promCalifReq = api.get(
        `${services.calificacionesMateriasAlumno}/${hijo.id_usuario_alumno}`
      );
      const asistenciaReq = hijo?.id_estudiante
        ? api.get(services.asistenciaEstudiante(hijo.id_estudiante))
        : Promise.resolve({
            data: {asistencias: [], estadisticas: {porcentaje_asistencia: 0}},
          });

      const eventosReq = api.get(
        services.padresMisEventosHijo(hijo.id_usuario_alumno)
      );

      const [materiasRes, asistenciaRes] = await Promise.all([
        promCalifReq,
        asistenciaReq,
      ]);

      const eventosRes = await eventosReq.catch(() => ({data: {eventos: []}}));

      const materiasRaw = Array.isArray(materiasRes?.data)
        ? materiasRes.data
        : [];
      const materias = materiasRaw.map((m) => ({
        nombre: m?.materia || m?.nombre || "Materia",
        calificacion: _promedioBimestres(m),
        profesor: m?.profesor_nombre || m?.profesor || "—",
      }));

      const eventosRaw = Array.isArray(eventosRes?.data?.eventos)
        ? eventosRes.data.eventos
        : [];
      const proximosEventos = eventosRaw
        .filter((e) => e?.fecha)
        .map((e) => {
          const tipoEvaluacion = String(e?.tipo_evaluacion || "").toLowerCase();
          const tipo =
            tipoEvaluacion === "parcial" ||
            tipoEvaluacion === "examen" ||
            tipoEvaluacion === "final"
              ? "examen"
              : "tarea";

          return {
            tipo,
            titulo: e?.titulo || "Evaluación",
            materia: e?.materia || "Materia",
            fecha: e.fecha,
          };
        });

      const califs = materias
        .map((m) => Number(m.calificacion || 0))
        .filter((v) => v > 0);
      const promedio = califs.length
        ? Math.round(
            (califs.reduce((acc, v) => acc + v, 0) / califs.length) * 10
          ) / 10
        : 0;

      const asistenciaPct =
        Number(asistenciaRes?.data?.estadisticas?.porcentaje_asistencia) || 0;

      const asistenciasList = Array.isArray(asistenciaRes?.data?.asistencias)
        ? asistenciaRes.data.asistencias
        : [];

      const progreso = _buildProgresoMensual({
        asistencias: asistenciasList,
        promedio,
      });

      const nuevoDetalle = {
        promedio,
        asistencia: asistenciaPct,
        materias,
        progresoMensual: progreso,
        proximosEventos,
        notasProfesor: [],
        comportamiento: "N/D",
      };

      setDetallePorHijo((prev) => ({...prev, [key]: nuevoDetalle}));
      setProgresoMensual(progreso);
    } catch (err) {
      console.error("Error cargando detalle del hijo:", err);
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

  const hijoBase = hijos[selectedChild];
  const hijoDetalle = hijoBase
    ? detallePorHijo[String(hijoBase.id_usuario_alumno)]
    : null;

  const hijoActual = hijoBase
    ? {
        id: hijoBase.id_usuario_alumno,
        nombre: `${hijoBase.nombre} ${hijoBase.apellido}`.trim(),
        grado: hijoBase.grado || "—",
        seccion: hijoBase.seccion || "—",
        promedio: hijoDetalle?.promedio ?? 0,
        asistencia: hijoDetalle?.asistencia ?? 0,
        materias: hijoDetalle?.materias ?? [],
        proximosEventos: hijoDetalle?.proximosEventos ?? [],
        notasProfesor: hijoDetalle?.notasProfesor ?? [],
        comportamiento: hijoDetalle?.comportamiento ?? "N/D",
      }
    : null;

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
                {errorMsg && (
                  <p className="text-rose-100 text-sm mt-2">{errorMsg}</p>
                )}
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
                        key={hijo.id_usuario_alumno || index}
                        value={index}
                        className="bg-gray-800"
                      >
                        {`${hijo.nombre} ${hijo.apellido}`.trim()}
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
                    {hijoActual?.nombre || "Sin hijos vinculados"}
                  </div>
                  <div className="text-purple-100 text-sm">
                    {hijoActual
                      ? `${hijoActual.grado} - Sección ${hijoActual.seccion}`
                      : ""}
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
              {hijoActual?.promedio ?? 0}
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
              {(hijoActual?.asistencia ?? 0) + "%"}
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
              {hijoActual?.materias?.length || 0}
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
              {hijoActual?.comportamiento || "N/D"}
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
              <BarChart data={hijoActual?.materias || []}>
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
                  {(hijoActual?.materias || []).map((entry, index) => (
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
              {(hijoActual?.materias || []).length === 0 ? (
                <div className="text-gray-400 text-sm">
                  No hay calificaciones disponibles.
                </div>
              ) : (
                (hijoActual?.materias || []).map((materia, index) => (
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
                ))
              )}
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <Calendar className="h-5 w-5 text-blue-400" />
              Próximos Eventos
            </h2>
            <div className="space-y-4">
              {(hijoActual?.proximosEventos || []).length === 0 ? (
                <div className="text-gray-400 text-sm">
                  No hay eventos registrados.
                </div>
              ) : (
                (hijoActual?.proximosEventos || []).map((evento, index) => (
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
                ))
              )}

              {/* Recordatorio */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400 mb-2">
                  <Bell className="h-4 w-4" />
                  <span className="font-semibold text-sm">Recordatorio</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Mantente atento a las comunicaciones de la escuela.
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
            {(hijoActual?.notasProfesor || []).length === 0 ? (
              <div className="text-gray-400 text-sm">
                No hay comentarios registrados.
              </div>
            ) : (
              (hijoActual?.notasProfesor || []).map((nota, index) => (
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
              ))
            )}
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
                {(hijoActual?.nombre || "Tu hijo") +
                  " está avanzando en su proceso académico. Tu apoyo es fundamental para su éxito."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPadre;
