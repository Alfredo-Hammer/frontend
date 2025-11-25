import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PrinterIcon,
} from "@heroicons/react/24/solid";

/**
 * Vista de Calificaciones para Estudiantes
 * Solo muestra las calificaciones del alumno actual
 */
function MisCalificaciones() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarMisCalificaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarMisCalificaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener información del alumno actual
      const perfilRes = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });

      const alumnoId =
        perfilRes.data.id_alumno || perfilRes.data.usuario?.id_alumno;

      if (!alumnoId) {
        setError("No se pudo identificar tu información como estudiante");
        return;
      }

      setAlumnoInfo(perfilRes.data);

      // Obtener calificaciones del alumno
      const calRes = await api.get(
        `${services.calificacionesMateriasAlumno}/${alumnoId}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      setCalificaciones(calRes.data || []);
    } catch (err) {
      console.error("Error al cargar calificaciones:", err);
      setError("Error al cargar tus calificaciones. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = () => {
    if (calificaciones.length === 0) return null;

    const totales = calificaciones.reduce(
      (acc, cal) => {
        const b1 = parseFloat(cal.bimestre_1) || 0;
        const b2 = parseFloat(cal.bimestre_2) || 0;
        const b3 = parseFloat(cal.bimestre_3) || 0;
        const b4 = parseFloat(cal.bimestre_4) || 0;

        const notaFinal = (b1 + b2 + b3 + b4) / 4;

        if (notaFinal >= 90) acc.excelentes++;
        if (notaFinal >= 70 && notaFinal < 90) acc.buenas++;
        if (notaFinal > 0 && notaFinal < 70) acc.reprobadas++;

        acc.suma += notaFinal;
        acc.count++;

        return acc;
      },
      {excelentes: 0, buenas: 0, reprobadas: 0, suma: 0, count: 0}
    );

    return {
      ...totales,
      promedio:
        totales.count > 0 ? (totales.suma / totales.count).toFixed(2) : 0,
    };
  };

  const stats = calcularEstadisticas();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando tus calificaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-red-500/20 p-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={cargarMisCalificaciones}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <AcademicCapIcon className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Mis Calificaciones
                </h1>
                <p className="text-purple-100">
                  {alumnoInfo?.nombre} {alumnoInfo?.apellido}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ChartBarIcon className="w-8 h-8 text-blue-400" />
                <span className="text-blue-400 font-medium">
                  Promedio General
                </span>
              </div>
              <div
                className={`text-3xl font-bold ${
                  parseFloat(stats.promedio) >= 70
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {stats.promedio}
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrophyIcon className="w-8 h-8 text-green-400" />
                <span className="text-green-400 font-medium">Excelentes</span>
              </div>
              <div className="text-3xl font-bold text-green-400">
                {stats.excelentes}
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DocumentTextIcon className="w-8 h-8 text-yellow-400" />
                <span className="text-yellow-400 font-medium">Buenas</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {stats.buenas}
              </div>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
                <span className="text-red-400 font-medium">Reprobadas</span>
              </div>
              <div className="text-3xl font-bold text-red-400">
                {stats.reprobadas}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Calificaciones */}
        <div className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">
              Detalle de Calificaciones
            </h2>
          </div>

          {calificaciones.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Materia
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      I Bim
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      II Bim
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      I Sem
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      III Bim
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      IV Bim
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      II Sem
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-gray-300">
                      Final
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calificaciones.map((cal, idx) => {
                    const b1 = parseFloat(cal.bimestre_1) || 0;
                    const b2 = parseFloat(cal.bimestre_2) || 0;
                    const b3 = parseFloat(cal.bimestre_3) || 0;
                    const b4 = parseFloat(cal.bimestre_4) || 0;

                    const sem1 = b1 > 0 && b2 > 0 ? (b1 + b2) / 2 : 0;
                    const sem2 = b3 > 0 && b4 > 0 ? (b3 + b4) / 2 : 0;
                    const final = (b1 + b2 + b3 + b4) / 4;

                    const getColorClass = (nota) => {
                      if (nota === 0) return "text-gray-500";
                      if (nota < 70) return "text-red-400";
                      if (nota < 90) return "text-yellow-400";
                      return "text-green-400";
                    };

                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          {cal.materia}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            b1
                          )}`}
                        >
                          {b1 > 0 ? b1.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            b2
                          )}`}
                        >
                          {b2 > 0 ? b2.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            sem1
                          )}`}
                        >
                          {sem1 > 0 ? sem1.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            b3
                          )}`}
                        >
                          {b3 > 0 ? b3.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            b4
                          )}`}
                        >
                          {b4 > 0 ? b4.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold ${getColorClass(
                            sem2
                          )}`}
                        >
                          {sem2 > 0 ? sem2.toFixed(1) : "-"}
                        </td>
                        <td
                          className={`px-4 py-4 text-center font-bold text-lg ${getColorClass(
                            final
                          )}`}
                        >
                          {final > 0 ? final.toFixed(1) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">
                No hay calificaciones disponibles
              </h3>
              <p className="text-gray-500">
                Tus calificaciones aparecerán aquí una vez que sean registradas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MisCalificaciones;
