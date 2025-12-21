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
  const [conceptos, setConceptos] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [pagoRegistrado, setPagoRegistrado] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
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
    cargarConceptos();
  }, []);

  useEffect(() => {
    if (busquedaEstudiante.length >= 3) {
      buscarEstudiantes();
    } else {
      setEstudiantes([]);
      setMostrarResultados(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaEstudiante]);

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

  const cargarConceptos = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(services.finanzasConceptos, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setConceptos(response.data.filter((c) => c.activo));
    } catch (error) {
      console.error("Error cargando conceptos:", error);
    }
  };

  const buscarEstudiantes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(services.alumnos, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const filtrados = response.data.filter(
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

      setEstudiantes(filtrados);
      setMostrarResultados(true);
    } catch (error) {
      console.error("Error buscando estudiantes:", error);
    }
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

      const pagoData = {
        id_estudiante: estudianteSeleccionado.id_estudiante,
        id_concepto: parseInt(formData.id_concepto),
        monto_original: parseFloat(formData.monto_original),
        descuento_porcentaje: parseFloat(formData.descuento_porcentaje) || 0,
        descuento_monto: parseFloat(formData.descuento_monto) || 0,
        monto_total: parseFloat(formData.monto_total),
        metodo_pago: formData.metodo_pago,
        numero_referencia: formData.numero_referencia || null,
        observaciones: formData.observaciones || null,
      };

      const response = await api.post(services.finanzasPagos, pagoData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setPagoRegistrado(response.data);

      // Resetear formulario
      setEstudianteSeleccionado(null);
      setBusquedaEstudiante("");
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
      console.error("Error registrando pago:", error);
      showToast(
        error.response?.data?.message || "Error al registrar el pago",
        "error"
      );
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
                  placeholder="Nombre, apellido o número de identificación..."
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

              {/* Resultados de búsqueda */}
              {mostrarResultados && estudiantes.length > 0 && (
                <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {estudiantes.map((est) => (
                    <button
                      key={est.id_estudiante}
                      type="button"
                      onClick={() => seleccionarEstudiante(est)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-600 border-b border-gray-600 last:border-0"
                    >
                      <div className="font-medium text-gray-100">
                        {est.nombre} {est.apellido}
                      </div>
                      <div className="text-sm text-gray-400">
                        {est.codigo_mined || "Sin código"} - Grado{" "}
                        {est.gradoid || "N/A"}
                      </div>
                    </button>
                  ))}
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
