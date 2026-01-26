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
  ClockIcon,
  UserIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

const AuditoriaPage = () => {
  const [auditorias, setAuditorias] = useState([]);
  const [tablas, setTablas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [actividadSospechosa, setActividadSospechosa] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState(null);

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
    tabla: "",
    operacion: "",
    usuario_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    limite: 50,
  });

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      await Promise.all([
        cargarAuditorias(),
        cargarTablas(),
        cargarEstadisticas(),
        cargarActividadSospechosa(),
      ]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showToast("Error al cargar datos de auditoría", "error");
    } finally {
      setLoading(false);
    }
  };

  const cargarAuditorias = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.tabla) params.append("tabla", filtros.tabla);
      if (filtros.operacion) params.append("operacion", filtros.operacion);
      if (filtros.usuario_id) params.append("usuario_id", filtros.usuario_id);
      if (filtros.fecha_inicio)
        params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);
      if (filtros.limite) params.append("limite", filtros.limite);

      const response = await api.get(`/api/auditoria?${params.toString()}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setAuditorias(response.data.auditoria || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error("Error al cargar auditorías:", error);
      throw error;
    }
  };

  const cargarTablas = async () => {
    try {
      const response = await api.get("/api/auditoria/tablas", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setTablas(response.data.tablas || []);
    } catch (error) {
      console.error("Error al cargar tablas:", error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.fecha_inicio)
        params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);

      const response = await api.get(
        `/api/auditoria/estadisticas?${params.toString()}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setEstadisticas(response.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const cargarActividadSospechosa = async () => {
    try {
      const response = await api.get("/api/auditoria/actividad-sospechosa", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setActividadSospechosa(response.data);
    } catch (error) {
      console.error("Error al cargar actividad sospechosa:", error);
    }
  };

  const exportarCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append("formato", "csv");
      if (filtros.fecha_inicio)
        params.append("fecha_inicio", filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append("fecha_fin", filtros.fecha_fin);

      const response = await api.get(
        `/api/auditoria/exportar?${params.toString()}`,
        {
          headers: {Authorization: `Bearer ${token}`},
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `auditoria_${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast("Auditoría exportada correctamente", "success");
    } catch (error) {
      console.error("Error al exportar:", error);
      showToast("Error al exportar auditoría", "error");
    }
  };

  const verDetalle = (auditoria) => {
    setSelectedAuditoria(auditoria);
    setShowDetailModal(true);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tabla: "",
      operacion: "",
      usuario_id: "",
      fecha_inicio: "",
      fecha_fin: "",
      limite: 50,
    });
  };

  const getOperacionColor = (operacion) => {
    switch (operacion) {
      case "INSERT":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "UPDATE":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "DELETE":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "-";
    return format(new Date(fecha), "dd/MM/yyyy HH:mm:ss", {locale: es});
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <PageHeader
        title="Auditoría del Sistema"
        subtitle="Registro completo de cambios y actividad"
        icon={ShieldCheckIcon}
        gradientFrom="purple-600"
        gradientTo="pink-600"
      />

      {/* Toast */}
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      {/* Estadísticas */}
      {estadisticas && estadisticas.length > 0 && (
        <div className="px-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {estadisticas.slice(0, 4).map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50 hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <TableCellsIcon className="w-8 h-8 text-purple-400" />
                  <span className="text-slate-400 text-sm">
                    {stat.total_acciones} acciones
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-1 capitalize">
                  {stat.tabla_nombre}
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-green-400">
                    +{stat.inserciones || 0}
                  </span>
                  <span className="text-blue-400">
                    ↻{stat.actualizaciones || 0}
                  </span>
                  <span className="text-red-400">
                    -{stat.eliminaciones || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alertas de Actividad Sospechosa */}
      {actividadSospechosa && actividadSospechosa.length > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              <h3 className="text-red-400 font-semibold">
                Actividad Sospechosa Detectada
              </h3>
            </div>
            <div className="space-y-2">
              {actividadSospechosa.slice(0, 3).map((alerta, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-3 text-sm"
                >
                  <p className="text-white">
                    <span className="text-red-400 font-semibold">
                      {alerta.usuario_email || "Usuario desconocido"}
                    </span>{" "}
                    - {alerta.tipo_alerta}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    {alerta.detalles}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Acciones */}
      <div className="px-6 mb-6">
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <FunnelIcon className="w-5 h-5" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={exportarCSV}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Exportar CSV
              </button>
              <button
                onClick={cargarDatos}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
                {loading ? "Cargando..." : "Actualizar"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t border-slate-700">
              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Tabla
                </label>
                <select
                  value={filtros.tabla}
                  onChange={(e) =>
                    setFiltros({...filtros, tabla: e.target.value})
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Todas las tablas</option>
                  {tablas.map((tabla) => (
                    <option key={tabla.tabla_nombre} value={tabla.tabla_nombre}>
                      {tabla.tabla_nombre} ({tabla.total_registros})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Operación
                </label>
                <select
                  value={filtros.operacion}
                  onChange={(e) =>
                    setFiltros({...filtros, operacion: e.target.value})
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Todas</option>
                  <option value="INSERT">Creación</option>
                  <option value="UPDATE">Modificación</option>
                  <option value="DELETE">Eliminación</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filtros.fecha_inicio}
                  onChange={(e) =>
                    setFiltros({...filtros, fecha_inicio: e.target.value})
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filtros.fecha_fin}
                  onChange={(e) =>
                    setFiltros({...filtros, fecha_fin: e.target.value})
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm mb-2">
                  Límite
                </label>
                <select
                  value={filtros.limite}
                  onChange={(e) =>
                    setFiltros({...filtros, limite: e.target.value})
                  }
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="25">25 registros</option>
                  <option value="50">50 registros</option>
                  <option value="100">100 registros</option>
                  <option value="200">200 registros</option>
                </select>
              </div>

              <div className="md:col-span-3 lg:col-span-5 flex justify-end">
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                  Limpiar Filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Auditorías */}
      <div className="px-6 pb-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Tabla
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Operación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Registro ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Campos Modificados
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span>Cargando auditorías...</span>
                      </div>
                    </td>
                  </tr>
                ) : auditorias.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                      <p>No hay registros de auditoría</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Los cambios comenzarán a registrarse automáticamente
                      </p>
                    </td>
                  </tr>
                ) : (
                  auditorias.map((auditoria) => (
                    <tr
                      key={auditoria.id_auditoria}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-300">
                          <ClockIcon className="w-4 h-4 text-slate-500" />
                          <span className="text-sm">
                            {formatFecha(auditoria.fecha_hora)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-purple-400" />
                          <span className="text-white text-sm">
                            {auditoria.usuario_email || "Sistema"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-medium">
                          {auditoria.tabla_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getOperacionColor(
                            auditoria.operacion
                          )}`}
                        >
                          {auditoria.operacion}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 font-mono text-xs">
                          {auditoria.registro_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {auditoria.campos_modificados &&
                        auditoria.campos_modificados.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {auditoria.campos_modificados
                              .slice(0, 3)
                              .map((campo, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs"
                                >
                                  {campo}
                                </span>
                              ))}
                            {auditoria.campos_modificados.length > 3 && (
                              <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs">
                                +{auditoria.campos_modificados.length - 3}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 font-mono text-xs">
                          {auditoria.ip_address || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => verDetalle(auditoria)}
                          className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Detalle */}
      {showDetailModal && selectedAuditoria && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
                  Detalle de Auditoría
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedAuditoria.tabla_nombre} • ID:{" "}
                  {selectedAuditoria.registro_id}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Usuario</p>
                  <p className="text-white font-semibold">
                    {selectedAuditoria.usuario_email || "Sistema"}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Fecha y Hora</p>
                  <p className="text-white font-semibold">
                    {formatFecha(selectedAuditoria.fecha_hora)}
                  </p>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Operación</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getOperacionColor(
                      selectedAuditoria.operacion
                    )}`}
                  >
                    {selectedAuditoria.operacion}
                  </span>
                </div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">IP Address</p>
                  <p className="text-white font-mono text-sm">
                    {selectedAuditoria.ip_address || "-"}
                  </p>
                </div>
              </div>

              {/* User Agent */}
              {selectedAuditoria.user_agent && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-2">
                    Navegador / Dispositivo
                  </p>
                  <p className="text-slate-300 text-sm break-all">
                    {selectedAuditoria.user_agent}
                  </p>
                </div>
              )}

              {/* Campos Modificados */}
              {selectedAuditoria.campos_modificados &&
                selectedAuditoria.campos_modificados.length > 0 && (
                  <div className="bg-slate-900 rounded-lg p-4">
                    <p className="text-slate-400 text-xs mb-3">
                      Campos Modificados
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAuditoria.campos_modificados.map(
                        (campo, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm"
                          >
                            {campo}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Datos Anteriores */}
              {selectedAuditoria.datos_anteriores && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Datos Anteriores (Before)
                  </p>
                  <pre className="bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {JSON.stringify(
                      selectedAuditoria.datos_anteriores,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}

              {/* Datos Nuevos */}
              {selectedAuditoria.datos_nuevos && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Datos Nuevos (After)
                  </p>
                  <pre className="bg-slate-950 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {JSON.stringify(selectedAuditoria.datos_nuevos, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaPage;
