import React, {useState, useEffect} from "react";
import {
  CurrencyDollarIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Loader from "../Loader";
import {format} from "date-fns";
import {es} from "date-fns/locale";

const DashboardFinanzas = () => {
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState(null);
  const [error, setError] = useState(null);
  const [periodo, setPeriodo] = useState("mes"); // 'mes' o 'año'

  useEffect(() => {
    cargarEstadisticas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo]);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      console.log("Cargando estadísticas con periodo:", periodo);
      console.log(
        "URL:",
        `${services.finanzasEstadisticas}?periodo=${periodo}`
      );

      const response = await api.get(
        `${services.finanzasEstadisticas}?periodo=${periodo}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      console.log("Respuesta del servidor:", response.data);
      setEstadisticas(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      console.error("Detalles del error:", error.response?.data);
      setError(error.response?.data?.error || "Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-6 text-center">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-300 mb-2">
          Error al cargar estadísticas
        </h3>
        <p className="text-red-200">{error}</p>
      </div>
    );
  }

  if (!estadisticas) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400">No hay datos disponibles</p>
      </div>
    );
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Filtro de Periodo */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
        <div className="flex items-center gap-4">
          <CalendarIcon className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-200">Periodo:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodo("mes")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                periodo === "mes"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setPeriodo("año")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                periodo === "año"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600"
              }`}
            >
              Este Año
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Recaudado */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/20 backdrop-blur-sm rounded-xl shadow-xl border border-green-500/30 p-6 group hover:shadow-green-500/20 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl group-hover:bg-green-500/20 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-300 mb-1">
                Total Recaudado
              </p>
              <p className="text-3xl font-bold text-green-100 mt-2">
                {formatCurrency(estadisticas.totalRecaudado)}
              </p>
              <p className="text-xs text-green-400 mt-2">
                💰 Ingresos del período
              </p>
            </div>
            <div className="bg-green-500/20 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
              <CurrencyDollarIcon className="h-10 w-10 text-green-300" />
            </div>
          </div>
        </div>

        {/* Total Pendiente */}
        <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 backdrop-blur-sm rounded-xl shadow-xl border border-yellow-500/30 p-6 group hover:shadow-yellow-500/20 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-300 mb-1">
                Total Pendiente
              </p>
              <p className="text-3xl font-bold text-yellow-100 mt-2">
                {formatCurrency(estadisticas.totalPendiente)}
              </p>
              <p className="text-xs text-yellow-400 mt-2">⏳ Por cobrar</p>
            </div>
            <div className="bg-yellow-500/20 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
              <BanknotesIcon className="h-10 w-10 text-yellow-300" />
            </div>
          </div>
        </div>

        {/* Total Vencido */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-500/20 via-rose-500/10 to-pink-500/20 backdrop-blur-sm rounded-xl shadow-xl border border-red-500/30 p-6 group hover:shadow-red-500/20 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-300"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-300 mb-1">
                Total Vencido
              </p>
              <p className="text-3xl font-bold text-red-100 mt-2">
                {formatCurrency(estadisticas.totalVencido)}
              </p>
              <p className="text-xs text-red-400 mt-2">⚠️ Requiere atención</p>
            </div>
            <div className="bg-red-500/20 rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
              <ExclamationCircleIcon className="h-10 w-10 text-red-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Ingresos por Concepto */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Ingresos por Concepto
        </h3>
        <div className="space-y-3">
          {estadisticas.ingresosPorConcepto &&
          estadisticas.ingresosPorConcepto.length > 0 ? (
            estadisticas.ingresosPorConcepto.map((concepto) => (
              <div
                key={concepto.concepto}
                className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-0"
              >
                <span className="text-sm font-medium text-gray-300">
                  {concepto.concepto}
                </span>
                <span className="text-sm font-semibold text-gray-100">
                  {formatCurrency(concepto.total)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No hay ingresos registrados en este período
            </p>
          )}
        </div>
      </div>

      {/* Métodos de Pago */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          Métodos de Pago Utilizados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {estadisticas.metodosPago && estadisticas.metodosPago.length > 0 ? (
            estadisticas.metodosPago.map((metodo, index) => {
              const gradientes = [
                "from-blue-500/20 via-blue-600/10 to-cyan-500/20 border-blue-500/30",
                "from-purple-500/20 via-purple-600/10 to-pink-500/20 border-purple-500/30",
                "from-orange-500/20 via-amber-600/10 to-yellow-500/20 border-orange-500/30",
                "from-teal-500/20 via-emerald-600/10 to-green-500/20 border-teal-500/30",
              ];
              const colores = [
                "text-blue-300",
                "text-purple-300",
                "text-orange-300",
                "text-teal-300",
              ];
              const iconos = ["💳", "🏦", "💰", "📝"];

              return (
                <div
                  key={metodo.metodo}
                  className={`bg-gradient-to-br ${
                    gradientes[index % 4]
                  } rounded-lg p-4 text-center border backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                >
                  <div className="text-2xl mb-2">{iconos[index % 4]}</div>
                  <p
                    className={`text-xs ${
                      colores[index % 4]
                    } uppercase mb-1 font-medium`}
                  >
                    {metodo.metodo}
                  </p>
                  <p className="text-lg font-bold text-gray-100">
                    {formatCurrency(metodo.total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {metodo.cantidad} pago{metodo.cantidad !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="col-span-full text-sm text-gray-400 text-center py-4">
              No hay métodos de pago registrados
            </p>
          )}
        </div>
      </div>

      {/* Pagos Recientes */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-gray-100">
            Pagos Recientes
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Estudiante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/30 divide-y divide-gray-700">
              {estadisticas.pagosRecientes &&
              estadisticas.pagosRecientes.length > 0 ? (
                estadisticas.pagosRecientes.map((pago) => (
                  <tr key={pago.id_pago} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                      {pago.numero_recibo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                      {pago.estudiante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {pago.concepto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-100">
                      {formatCurrency(pago.monto_total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-300">
                        {pago.metodo_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {format(new Date(pago.fecha_pago), "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No hay pagos recientes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardFinanzas;
