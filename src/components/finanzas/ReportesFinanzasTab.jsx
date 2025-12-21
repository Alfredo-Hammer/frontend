import React, {useState, useEffect} from "react";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Loader from "../Loader";
import Toast from "../Toast";
import {format} from "date-fns";

const ReportesFinanzasTab = () => {
  const [loading, setLoading] = useState(true);
  const [morosidad, setMorosidad] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [morosidadRes, estadisticasRes] = await Promise.all([
        api.get(services.finanzasMorosidad, {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get(`${services.finanzasEstadisticas}?periodo=año`, {
          headers: {Authorization: `Bearer ${token}`},
        }),
      ]);

      setMorosidad(morosidadRes.data);
      setEstadisticas(estadisticasRes.data);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportarMorosidadCSV = () => {
    if (morosidad.length === 0) {
      showToast("No hay datos para exportar", "info");
      return;
    }

    const headers = [
      "Estudiante",
      "Identificación",
      "Grado",
      "Conceptos Vencidos",
      "Total Vencido",
      "Días de Retraso",
      "Teléfono",
      "Email",
    ];

    const rows = morosidad.map((est) => [
      `"${est.estudiante}"`,
      `"${est.numero_identificacion || ""}"`,
      `"${est.grado || ""}"`,
      est.conceptos_vencidos,
      est.total_vencido,
      est.dias_retraso_promedio,
      `"${est.telefono || ""}"`,
      `"${est.email || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `reporte-morosidad-${format(new Date(), "yyyyMMdd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount || 0);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Estadísticas Anuales */}
      {estadisticas && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-100">
              Estadísticas del Año
            </h3>
            <ChartBarIcon className="h-6 w-6 text-gray-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/20 rounded-lg p-4 border border-green-500/30 backdrop-blur-sm">
              <div className="text-sm text-green-300 mb-1">Total Recaudado</div>
              <div className="text-2xl font-bold text-green-200">
                {formatCurrency(estadisticas.totalRecaudado)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 rounded-lg p-4 border border-yellow-500/30 backdrop-blur-sm">
              <div className="text-sm text-yellow-300 mb-1">
                Total Pendiente
              </div>
              <div className="text-2xl font-bold text-yellow-200">
                {formatCurrency(estadisticas.totalPendiente)}
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 via-rose-500/10 to-pink-500/20 rounded-lg p-4 border border-red-500/30 backdrop-blur-sm">
              <div className="text-sm text-red-300 mb-1">Total Vencido</div>
              <div className="text-2xl font-bold text-red-200">
                {formatCurrency(estadisticas.totalVencido)}
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-md font-semibold text-gray-100 mb-4">
              Distribución por Método de Pago
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {estadisticas.metodosPago.map((metodo) => (
                <div
                  key={metodo.metodo}
                  className="bg-gray-700/50 rounded-lg p-4 text-center border border-gray-600"
                >
                  <div className="text-xs text-gray-400 uppercase mb-1">
                    {metodo.metodo}
                  </div>
                  <div className="text-lg font-bold text-gray-100">
                    {formatCurrency(metodo.total)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {metodo.cantidad} pago{metodo.cantidad !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ingresos por Concepto */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <h4 className="text-md font-semibold text-gray-100 mb-4">
              Ingresos por Concepto
            </h4>
            <div className="space-y-2">
              {estadisticas.ingresosPorConcepto.map((concepto) => {
                const porcentaje =
                  (concepto.total / estadisticas.totalRecaudado) * 100;
                return (
                  <div key={concepto.concepto} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-300">
                        {concepto.concepto}
                      </span>
                      <span className="font-semibold text-gray-100">
                        {formatCurrency(concepto.total)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                        style={{width: `${porcentaje}%`}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reporte de Morosidad */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 bg-red-500/10 border-b border-red-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            <h3 className="text-lg font-semibold text-red-300">
              Reporte de Morosidad
            </h3>
          </div>
          <button
            onClick={exportarMorosidadCSV}
            disabled={morosidad.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-500 hover:to-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Exportar CSV
          </button>
        </div>

        {morosidad.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Identificación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Grado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Conceptos Vencidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Total Vencido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Días de Retraso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Contacto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                {morosidad.map((estudiante, index) => (
                  <tr key={index} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-100">
                        {estudiante.estudiante}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {estudiante.numero_identificacion || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {estudiante.grado || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300">
                        {estudiante.conceptos_vencidos}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-300">
                      {formatCurrency(estudiante.total_vencido)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-500/20 text-orange-300">
                        {Math.round(estudiante.dias_retraso_promedio)} días
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {estudiante.telefono && (
                        <div className="text-gray-100">
                          📞 {estudiante.telefono}
                        </div>
                      )}
                      {estudiante.email && (
                        <div className="text-gray-400 text-xs">
                          ✉️ {estudiante.email}
                        </div>
                      )}
                      {!estudiante.telefono && !estudiante.email && (
                        <span className="text-gray-500">Sin contacto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-100 mb-2">
              No hay estudiantes en mora
            </h3>
            <p className="text-gray-400">
              Todos los estudiantes están al día con sus pagos
            </p>
          </div>
        )}
      </div>

      {/* Resumen de Morosidad */}
      {morosidad.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Resumen de Morosidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-300">
                {morosidad.length}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Estudiantes en mora
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-300">
                {morosidad.reduce(
                  (sum, est) => sum + parseInt(est.conceptos_vencidos),
                  0
                )}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Total conceptos vencidos
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-300">
                {formatCurrency(
                  morosidad.reduce(
                    (sum, est) => sum + parseFloat(est.total_vencido),
                    0
                  )
                )}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Monto total adeudado
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Component */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
};

export default ReportesFinanzasTab;
