import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import {format} from "date-fns";
import {es} from "date-fns/locale";
import {
  ShieldCheckIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

const LogsSeguridadPage = () => {
  const [activeTab, setActiveTab] = useState("sistema");
  const [logs, setLogs] = useState([]);
  const [intentos, setIntentos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [tiposAccion, setTiposAccion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const hideToast = () => {
    setToast({show: false, message: "", type: "success"});
  };

  const [filtros, setFiltros] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    tipo_accion: "",
    email: "",
    exitoso: "",
    page: 1,
    limit: 50,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  useEffect(() => {
    cargarDatos();
  }, [activeTab, filtros]);

  useEffect(() => {
    cargarEstadisticas();
    cargarTiposAccion();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeTab === "sistema") {
        await cargarLogsSistema();
      } else {
        await cargarIntentosLogin();
      }
    } catch (error) {
      showToast("Error al cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarLogsSistema = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio)
        params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);
      if (filtros.tipo_accion)
        params.append("tipo_accion", filtros.tipo_accion);
      params.append("page", filtros.page);
      params.append("limit", filtros.limit);

      const response = await api.get(`/api/logs/sistema?${params.toString()}`);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error al cargar logs del sistema:", error);
      throw error;
    }
  };

  const cargarIntentosLogin = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio)
        params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);
      if (filtros.email) params.append("email", filtros.email);
      if (filtros.exitoso !== "") params.append("exitoso", filtros.exitoso);
      params.append("page", filtros.page);
      params.append("limit", filtros.limit);

      const response = await api.get(
        `/api/logs/intentos-login?${params.toString()}`
      );
      setIntentos(response.data.intentos);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error al cargar intentos de login:", error);
      throw error;
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await api.get("/api/logs/estadisticas");
      setEstadisticas(response.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarTiposAccion = async () => {
    try {
      const response = await api.get("/api/logs/tipos-accion");
      setTiposAccion(response.data.tipos);
    } catch (error) {
      console.error("Error al cargar tipos de acción:", error);
    }
  };

  const handleFiltroChange = (e) => {
    const {name, value} = e.target;
    setFiltros((prev) => ({...prev, [name]: value, page: 1}));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_inicio: "",
      fecha_fin: "",
      tipo_accion: "",
      email: "",
      exitoso: "",
      page: 1,
      limit: 50,
    });
    showToast("Filtros limpiados", "info");
  };

  const exportarCSV = () => {
    const data = activeTab === "sistema" ? logs : intentos;
    if (data.length === 0) {
      showToast("No hay datos para exportar", "warning");
      return;
    }

    let csv = "";
    if (activeTab === "sistema") {
      csv =
        "ID,Tipo de Acción,Descripción,Fecha/Hora,Usuario,Email,IP,User Agent\n";
      data.forEach((log) => {
        csv += `${log.id_log},"${log.tipo_accion}","${
          log.descripcion
        }","${format(new Date(log.fecha_hora), "dd/MM/yyyy HH:mm:ss")}","${
          log.usuario_nombre || ""
        }","${log.usuario_email || ""}","${log.ip_address || ""}","${
          log.user_agent || ""
        }"\n`;
      });
    } else {
      csv = "ID,Email,Exitoso,Motivo,Fecha/Hora,IP,User Agent\n";
      data.forEach((intento) => {
        csv += `${intento.id_intento},"${intento.email}","${
          intento.exitoso ? "Sí" : "No"
        }","${intento.motivo_fallo || "N/A"}","${format(
          new Date(intento.fecha_hora),
          "dd/MM/yyyy HH:mm:ss"
        )}","${intento.ip_address || ""}","${intento.user_agent || ""}"\n`;
      });
    }

    const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `logs_${activeTab}_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Archivo CSV exportado exitosamente", "success");
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros((prev) => ({...prev, page: nuevaPagina}));
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <PageHeader
        title="Logs de Seguridad"
        subtitle="Auditoría completa de actividad del sistema y control de accesos"
        icon={ShieldCheckIcon}
        gradientFrom="red-600"
        gradientTo="orange-600"
        badge="Seguridad"
        actions={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20"
            >
              <FunnelIcon className="w-5 h-5" />
              Filtros
            </button>
            <button
              onClick={exportarCSV}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Exportar CSV
            </button>
          </>
        }
      />

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">
                Acciones Recientes
              </h3>
              <ChartBarIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div className="space-y-2">
              {estadisticas.logsporTipo.slice(0, 3).map((stat) => (
                <div
                  key={stat.tipo_accion}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-slate-300">
                    {stat.tipo_accion}
                  </span>
                  <span className="text-lg font-bold text-blue-400">
                    {stat.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">
                Intentos de Login
              </h3>
              <ShieldCheckIcon className="w-6 h-6 text-green-400" />
            </div>
            <div className="space-y-2">
              {estadisticas.intentosLogin.map((stat) => (
                <div
                  key={stat.exitoso}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-slate-300">
                    {stat.exitoso ? "Exitosos" : "Fallidos"}
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      stat.exitoso ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {stat.cantidad}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">
                Usuarios Activos
              </h3>
              <MagnifyingGlassIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div className="space-y-2">
              {estadisticas.usuariosMasActivos.slice(0, 3).map((user) => (
                <div
                  key={user.email}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-slate-300 truncate">
                    {user.nombre_completo}
                  </span>
                  <span className="text-lg font-bold text-purple-400">
                    {user.acciones}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-white/10 bg-slate-900/50">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("sistema")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "sistema"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Logs del Sistema
            </button>
            <button
              onClick={() => setActiveTab("intentos-login")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "intentos-login"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Intentos de Login
            </button>
          </nav>
        </div>

        {/* Filtros Colapsables */}
        {showFilters && (
          <div className="p-6 border-b border-white/10 bg-slate-900/30">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={filtros.fecha_inicio}
                  onChange={handleFiltroChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={filtros.fecha_fin}
                  onChange={handleFiltroChange}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {activeTab === "sistema" ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Acción
                  </label>
                  <select
                    name="tipo_accion"
                    value={filtros.tipo_accion}
                    onChange={handleFiltroChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    {tiposAccion.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="text"
                      name="email"
                      value={filtros.email}
                      onChange={handleFiltroChange}
                      placeholder="Buscar por email"
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Estado
                    </label>
                    <select
                      name="exitoso"
                      value={filtros.exitoso}
                      onChange={handleFiltroChange}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Todos</option>
                      <option value="true">Exitosos</option>
                      <option value="false">Fallidos</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={limpiarFiltros}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}

        {/* Tabla de Datos */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-slate-400">Cargando...</p>
            </div>
          ) : activeTab === "sistema" ? (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No hay logs registrados
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id_log}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {format(
                          new Date(log.fecha_hora),
                          "dd/MM/yyyy HH:mm:ss",
                          {
                            locale: es,
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {log.tipo_accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-medium text-slate-200">
                          {log.usuario_nombre || "N/A"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.usuario_email || ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 max-w-md truncate">
                        {log.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {log.ip_address || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {intentos.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No hay intentos de login registrados
                    </td>
                  </tr>
                ) : (
                  intentos.map((intento) => (
                    <tr
                      key={intento.id_intento}
                      className="hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {format(
                          new Date(intento.fecha_hora),
                          "dd/MM/yyyy HH:mm:ss",
                          {
                            locale: es,
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                        {intento.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            intento.exitoso
                              ? "bg-green-500/20 text-green-300 border border-green-500/30"
                              : "bg-red-500/20 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {intento.exitoso ? "Exitoso" : "Fallido"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {intento.motivo_fallo || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {intento.ip_address || "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 bg-slate-900/30 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              de {pagination.total} registros
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => cambiarPagina(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-slate-400">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => cambiarPagina(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsSeguridadPage;
