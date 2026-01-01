import React, {useState, useEffect} from "react";
import {
  MagnifyingGlassIcon,
  PrinterIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Toast from "../Toast";

const RegistrarPagoTab = () => {
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [todosEstudiantes, setTodosEstudiantes] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [pagoRegistrado, setPagoRegistrado] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Filtros avanzados
  const [filtros, setFiltros] = useState({
    id_grado: "",
    id_seccion: "",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const [formData, setFormData] = useState({
    id_concepto: "",
    monto_original: "",
    descuento_porcentaje: 0,
    descuento_monto: 0,
    monto_total: "",
    metodo_pago: "efectivo",
    numero_referencia: "",
    observaciones: "",
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    aplicarFiltros();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaEstudiante, filtros.id_grado, filtros.id_seccion]);

  useEffect(() => {
    if (filtros.id_grado) {
      cargarSeccionesPorGrado(filtros.id_grado);
    } else {
      setSecciones([]);
      setFiltros((prev) => ({...prev, id_seccion: ""}));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.id_grado]);

  useEffect(() => {
    if (formData.id_concepto) {
      const concepto = conceptos.find(
        (c) => c.id_concepto === parseInt(formData.id_concepto)
      );
      if (concepto) {
        calcularMontoTotal(concepto.monto_base);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formData.id_concepto,
    formData.descuento_porcentaje,
    formData.descuento_monto,
  ]);

  const cargarDatosIniciales = async () => {
    try {
      const token = localStorage.getItem("token");

      const [conceptosRes, estudiantesRes, gradosRes] = await Promise.all([
        api.get(services.finanzasConceptos, {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get(services.alumnos, {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get(services.grados, {
          headers: {Authorization: `Bearer ${token}`},
        }),
      ]);

      // Normalizar formatos de respuesta
      const conceptosData = Array.isArray(conceptosRes.data?.conceptos)
        ? conceptosRes.data.conceptos
        : Array.isArray(conceptosRes.data?.data)
        ? conceptosRes.data.data
        : Array.isArray(conceptosRes.data)
        ? conceptosRes.data
        : [];

      const estudiantesData = Array.isArray(estudiantesRes.data?.data)
        ? estudiantesRes.data.data
        : Array.isArray(estudiantesRes.data)
        ? estudiantesRes.data
        : [];

      const gradosData = Array.isArray(gradosRes.data?.data)
        ? gradosRes.data.data
        : Array.isArray(gradosRes.data)
        ? gradosRes.data
        : [];

      console.log("✅ Datos finanzas - conceptos:", conceptosData.length);
      console.log("✅ Datos finanzas - estudiantes:", estudiantesData.length);
      console.log("✅ Datos finanzas - grados:", gradosData.length);

      setConceptos(conceptosData.filter((c) => c.activo !== false));
      setTodosEstudiantes(estudiantesData);
      setGrados(gradosData);
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      showToast(
        "Error al cargar datos iniciales de finanzas. Revisa la consola.",
        "error"
      );
    }
  };

  const cargarSeccionesPorGrado = async (idGrado) => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
        params: {id_grado: idGrado},
      });

      console.log("Secciones recibidas:", response.data); // Debug

      // El backend responde como { success: true, data: [...] }
      const seccionesData = Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      console.log("Secciones filtradas:", seccionesData); // Debug
      setSecciones(seccionesData);
    } catch (error) {
      console.error("Error cargando secciones:", error);
      setSecciones([]);
    }
  };

  const aplicarFiltros = () => {
    let resultados = [...todosEstudiantes];

    // Filtro por texto de búsqueda
    if (busquedaEstudiante.length >= 2) {
      resultados = resultados.filter(
        (est) =>
          est.nombre
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase()) ||
          est.apellido
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase()) ||
          est.codigo_mined
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase())
      );
    }

    // Filtro por grado
    if (filtros.id_grado) {
      resultados = resultados.filter((est) => {
        // Verificar si el estudiante tiene matrícula en el grado seleccionado
        return est.matricula_actual?.id_grado === parseInt(filtros.id_grado);
      });
    }

    // Filtro por sección
    if (filtros.id_seccion) {
      resultados = resultados.filter((est) => {
        return (
          est.matricula_actual?.id_seccion === parseInt(filtros.id_seccion)
        );
      });
    }

    setEstudiantes(resultados);
    setMostrarResultados(
      resultados.length > 0 &&
        (busquedaEstudiante.length >= 2 ||
          filtros.id_grado ||
          filtros.id_seccion)
    );
  };

  const seleccionarEstudiante = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setBusquedaEstudiante(`${estudiante.nombre} ${estudiante.apellido}`);
    setMostrarResultados(false);
  };

  const calcularMontoTotal = (montoBase) => {
    let monto = parseFloat(montoBase);
    const descPorcentaje = parseFloat(formData.descuento_porcentaje) || 0;
    const descMonto = parseFloat(formData.descuento_monto) || 0;

    // Aplicar descuento porcentual
    if (descPorcentaje > 0) {
      monto = monto - (monto * descPorcentaje) / 100;
    }

    // Aplicar descuento fijo
    monto = monto - descMonto;

    // No permitir montos negativos
    monto = Math.max(0, monto);

    setFormData((prev) => ({
      ...prev,
      monto_original: montoBase,
      monto_total: monto.toFixed(2),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!estudianteSeleccionado) {
      showToast("Por favor seleccione un estudiante", "error");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const now = new Date();
      const descuentoTotal = parseFloat(formData.descuento_monto) || 0;
      const montoOriginal = parseFloat(formData.monto_original);
      const montoFinal = parseFloat(formData.monto_total);

      // Paso 1: Crear la cuenta por cobrar
      console.log(
        "📝 Estudiante seleccionado completo:",
        estudianteSeleccionado
      );

      const cuentaData = {
        id_estudiante: estudianteSeleccionado.id_estudiante,
        id_concepto: parseInt(formData.id_concepto),
        monto_original: montoOriginal,
        descuento_aplicado: descuentoTotal,
        fecha_vencimiento: now.toISOString().split("T")[0], // Fecha actual
        mes_aplicado: now.getMonth() + 1,
        año_aplicado: now.getFullYear(),
        observaciones: formData.observaciones || null,
      };

      console.log("📤 Enviando cuentaData:", cuentaData);

      const cuentaResponse = await api.post(
        `${services.API_BASE}/finanzas/cuentas-por-cobrar`,
        cuentaData,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      const id_cuenta = cuentaResponse.data.cuenta.id_cuenta;

      // Paso 2: Registrar el pago contra esa cuenta
      const pagoData = {
        metodo_pago:
          formData.metodo_pago === "efectivo"
            ? "Efectivo"
            : formData.metodo_pago === "transferencia"
            ? "Transferencia"
            : formData.metodo_pago === "tarjeta"
            ? "Tarjeta"
            : "Cheque",
        monto_total_recibido: montoFinal,
        referencia: formData.numero_referencia || null,
        observaciones: formData.observaciones || null,
        cuentas_a_pagar: [
          {
            id_cuenta: id_cuenta,
            monto_a_pagar: montoFinal,
          },
        ],
      };

      const response = await api.post(services.finanzasPagos, pagoData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setPagoRegistrado(response.data);

      // Resetear formulario
      setEstudianteSeleccionado(null);
      setBusquedaEstudiante("");
      setFiltros({
        id_grado: "",
        id_seccion: "",
      });
      setFormData({
        id_concepto: "",
        monto_original: "",
        descuento_porcentaje: 0,
        descuento_monto: 0,
        monto_total: "",
        metodo_pago: "efectivo",
        numero_referencia: "",
        observaciones: "",
      });

      showToast("Pago registrado exitosamente", "success");
    } catch (error) {
      console.error("❌ Error registrando pago:", error);
      console.error("❌ Respuesta del servidor:", error.response?.data);
      const errorMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Error al registrar el pago";
      showToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const imprimirRecibo = () => {
    if (!pagoRegistrado) return;

    // TODO: Implementar impresión de recibo con jsPDF
    showToast("Funcionalidad de impresión en desarrollo", "info");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount || 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Formulario de Registro */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-6">
            Registrar Nuevo Pago
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Filtros Avanzados */}
            <div className="bg-gray-900/30 border border-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Filtros de Búsqueda
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro por Grado */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Filtrar por Grado
                  </label>
                  <select
                    value={filtros.id_grado}
                    onChange={(e) =>
                      setFiltros({...filtros, id_grado: e.target.value})
                    }
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los grados</option>
                    {grados.map((grado) => (
                      <option key={grado.id_grado} value={grado.id_grado}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Sección */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Filtrar por Sección
                  </label>
                  <select
                    value={filtros.id_seccion}
                    onChange={(e) =>
                      setFiltros({...filtros, id_seccion: e.target.value})
                    }
                    disabled={!filtros.id_grado}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!filtros.id_grado
                        ? "Selecciona un grado primero"
                        : secciones.length === 0
                        ? "No hay secciones disponibles"
                        : "Todas las secciones"}
                    </option>
                    {secciones.map((seccion) => (
                      <option
                        key={seccion.id_seccion}
                        value={seccion.id_seccion}
                      >
                        Sección{" "}
                        {seccion.nombre || seccion.letra || seccion.id_seccion}
                        {seccion.cupo_maximo
                          ? ` (Cupo: ${seccion.cupo_maximo})`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {filtros.id_grado && secciones.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {secciones.length} sección
                      {secciones.length !== 1 ? "es" : ""} disponible
                      {secciones.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Búsqueda de Estudiante */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buscar Estudiante *
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={busquedaEstudiante}
                  onChange={(e) => setBusquedaEstudiante(e.target.value)}
                  placeholder="Nombre, apellido o código MINED..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {estudianteSeleccionado && (
                  <button
                    type="button"
                    onClick={() => {
                      setEstudianteSeleccionado(null);
                      setBusquedaEstudiante("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500 hover:text-gray-300" />
                  </button>
                )}
              </div>

              {/* Contador de resultados */}
              {(busquedaEstudiante.length >= 2 || filtros.id_grado) && (
                <div className="mt-2 text-sm text-gray-400">
                  {estudiantes.length} estudiante
                  {estudiantes.length !== 1 ? "s" : ""} encontrado
                  {estudiantes.length !== 1 ? "s" : ""}
                </div>
              )}

              {/* Resultados de búsqueda */}
              {mostrarResultados && estudiantes.length > 0 && (
                <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  {estudiantes.slice(0, 50).map((est) => (
                    <button
                      key={est.id_estudiante}
                      type="button"
                      onClick={() => seleccionarEstudiante(est)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 border-b border-gray-600 last:border-0 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-100">
                            {est.nombre} {est.apellido}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            <span className="inline-flex items-center gap-2 flex-wrap">
                              {est.codigo_mined && (
                                <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded text-xs font-mono">
                                  {est.codigo_mined}
                                </span>
                              )}
                              {est.matricula_actual?.seccion_nombre && (
                                <span className="bg-gray-600 px-2 py-0.5 rounded text-xs">
                                  {est.matricula_actual.seccion_nombre}
                                </span>
                              )}
                              {!est.matricula_actual && (
                                <span className="text-yellow-400 text-xs italic">
                                  Sin matrícula activa
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                  {estudiantes.length > 50 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center bg-gray-800">
                      Mostrando 50 de {estudiantes.length} resultados. Refina tu
                      búsqueda.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Concepto de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Concepto de Pago *
              </label>
              <select
                required
                value={formData.id_concepto}
                onChange={(e) =>
                  setFormData({...formData, id_concepto: e.target.value})
                }
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccione un concepto</option>
                {conceptos.map((concepto) => (
                  <option
                    key={concepto.id_concepto}
                    value={concepto.id_concepto}
                  >
                    {concepto.nombre} - {formatCurrency(concepto.monto_base)}
                  </option>
                ))}
              </select>
            </div>

            {/* Monto Original */}
            {formData.monto_original && (
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-300">
                    Monto Original:
                  </span>
                  <span className="text-lg font-bold text-gray-100">
                    {formatCurrency(formData.monto_original)}
                  </span>
                </div>
              </div>
            )}

            {/* Descuentos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descuento (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.descuento_porcentaje}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descuento_porcentaje: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descuento Fijo (C$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.descuento_monto}
                  onChange={(e) =>
                    setFormData({...formData, descuento_monto: e.target.value})
                  }
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Monto Total */}
            {formData.monto_total && (
              <div className="bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-lg p-4 border-2 border-blue-500/30 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-300">
                    Monto Total a Pagar:
                  </span>
                  <span className="text-2xl font-bold text-blue-200">
                    {formatCurrency(formData.monto_total)}
                  </span>
                </div>
              </div>
            )}

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Método de Pago *
              </label>
              <select
                required
                value={formData.metodo_pago}
                onChange={(e) =>
                  setFormData({...formData, metodo_pago: e.target.value})
                }
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* Número de Referencia (opcional para algunos métodos) */}
            {formData.metodo_pago !== "efectivo" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Número de Referencia
                </label>
                <input
                  type="text"
                  value={formData.numero_referencia}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numero_referencia: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Número de transacción, cheque, etc."
                />
              </div>
            )}

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Observaciones
              </label>
              <textarea
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({...formData, observaciones: e.target.value})
                }
                rows={3}
                className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Notas adicionales sobre el pago..."
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEstudianteSeleccionado(null);
                  setBusquedaEstudiante("");
                  setFormData({
                    id_concepto_pago: "",
                    monto_original: "",
                    descuento_porcentaje: 0,
                    descuento_monto: 0,
                    monto_total: "",
                    metodo_pago: "efectivo",
                    numero_referencia: "",
                    observaciones: "",
                  });
                }}
                className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
              >
                Limpiar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registrando..." : "Registrar Pago"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Panel Lateral - Último Recibo */}
      <div className="lg:col-span-1">
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6 sticky top-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Último Recibo Generado
          </h3>

          {pagoRegistrado ? (
            <div className="space-y-4">
              <div className="text-center py-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-lg border border-blue-500/30">
                <div className="text-sm text-gray-400 mb-1">
                  Número de Recibo
                </div>
                <div className="text-2xl font-bold text-blue-300">
                  {pagoRegistrado.numero_recibo}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estudiante:</span>
                  <span className="font-medium text-gray-100">
                    {pagoRegistrado.estudiante}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Concepto:</span>
                  <span className="font-medium text-gray-100">
                    {pagoRegistrado.concepto}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Monto:</span>
                  <span className="font-bold text-gray-100">
                    {formatCurrency(pagoRegistrado.monto_total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Método:</span>
                  <span className="font-medium text-gray-100 capitalize">
                    {pagoRegistrado.metodo_pago}
                  </span>
                </div>
              </div>

              <button
                onClick={imprimirRecibo}
                className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-colors flex items-center justify-center gap-2 border border-gray-600"
              >
                <PrinterIcon className="h-5 w-5" />
                Imprimir Recibo
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <PrinterIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                No hay recibos recientes.
                <br />
                Registre un pago para generar un recibo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
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

export default RegistrarPagoTab;
