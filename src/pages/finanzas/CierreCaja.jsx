import React, {useEffect, useMemo, useState} from "react";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Toast from "../../components/Toast";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (value) => {
  const n = toNumber(value);
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
    minimumFractionDigits: 2,
  }).format(n);
};

export default function CierreCaja() {
  const [loading, setLoading] = useState(false);
  const [sesionAbierta, setSesionAbierta] = useState(null);
  const [resumen, setResumen] = useState(null);

  const [montoApertura, setMontoApertura] = useState("");
  const [montoReal, setMontoReal] = useState("");

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const cargarResumen = async () => {
    setLoading(true);
    try {
      const res = await api.get(services.finanzasCajaResumen);
      if (res.data?.abierta) {
        setSesionAbierta(res.data.sesion);
        setResumen(res.data);
      } else {
        setSesionAbierta(null);
        setResumen(null);
      }
    } catch (err) {
      console.error("Error cargando resumen de caja:", err);
      showToast(
        err.response?.data?.error || "Error al cargar el resumen de caja.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarResumen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const esperadoEfectivo = useMemo(() => {
    return toNumber(resumen?.total_esperado_efectivo);
  }, [resumen]);

  const diferencia = useMemo(() => {
    return toNumber(montoReal) - esperadoEfectivo;
  }, [montoReal, esperadoEfectivo]);

  const diferenciaColor = diferencia >= 0 ? "text-emerald-400" : "text-red-400";

  const abrirCaja = async () => {
    const n = Number(montoApertura);
    if (!Number.isFinite(n) || n < 0) {
      return showToast("Monto de apertura inválido.", "warning");
    }

    setLoading(true);
    try {
      await api.post(services.finanzasCajaAbrir, {monto_apertura: n});
      showToast("Caja abierta correctamente.", "success");
      setMontoApertura("");
      await cargarResumen();
    } catch (err) {
      console.error("Error abriendo caja:", err);
      showToast(err.response?.data?.error || "Error al abrir caja.", "error");
    } finally {
      setLoading(false);
    }
  };

  const cerrarCaja = async () => {
    const n = Number(montoReal);
    if (!Number.isFinite(n) || n < 0) {
      return showToast("Monto real inválido.", "warning");
    }

    setLoading(true);
    try {
      const res = await api.post(services.finanzasCajaCerrar, {monto_real: n});
      showToast(res.data?.message || "Caja cerrada.", "success");
      setMontoReal("");
      await cargarResumen();
    } catch (err) {
      console.error("Error cerrando caja:", err);
      showToast(err.response?.data?.error || "Error al cerrar caja.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700/50 rounded-lg shadow-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Cierre de Caja</h2>
          <p className="text-sm text-gray-400">
            Reconciliación de efectivo: sistema vs conteo real.
          </p>
        </div>
        <button
          type="button"
          onClick={cargarResumen}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700 disabled:opacity-50"
        >
          Recargar
        </button>
      </div>

      {!sesionAbierta ? (
        <div className="space-y-4">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Abrir Caja</h3>
            <p className="text-sm text-gray-400 mb-4">
              Ingresa el monto inicial de efectivo (base).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-300 mb-1">
                  Monto de apertura
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <button
                type="button"
                onClick={abrirCaja}
                disabled={loading}
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Abrir Caja
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            Si esperas ver pagos aquí, asegúrate de ejecutar el script
            setup_caja.sql para agregar el vínculo de sesión a los pagos.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="text-white font-semibold">Caja Abierta</h3>
                <p className="text-sm text-gray-400">
                  Sesión #{sesionAbierta.id_sesion} · Apertura:{" "}
                  {formatMoney(sesionAbierta.monto_apertura)}
                </p>
              </div>
              <div className="text-sm text-gray-400">
                Estado:{" "}
                <span className="text-amber-300 font-semibold">
                  {sesionAbierta.estado}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sistema */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">
                Sistema (Esperado)
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Base (Apertura)</span>
                  <span className="font-semibold">
                    {formatMoney(sesionAbierta.monto_apertura)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-300">
                  <span>Ventas en Efectivo</span>
                  <span className="font-semibold">
                    {formatMoney(resumen?.pagos?.total_efectivo)}
                  </span>
                </div>

                <div className="border-t border-gray-700 my-2" />

                <div className="flex justify-between text-white">
                  <span className="font-semibold">
                    Total Esperado en Efectivo
                  </span>
                  <span className="font-bold">
                    {formatMoney(esperadoEfectivo)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-400">
                  <span>Pagos Digitales</span>
                  <span className="font-semibold">
                    {formatMoney(resumen?.pagos?.total_digital)}
                  </span>
                </div>
              </div>
            </div>

            {/* Real */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Real (Conteo)</h4>

              <label className="block text-sm text-gray-300 mb-1">
                Efectivo contado
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={montoReal}
                onChange={(e) => setMontoReal(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />

              <div className="mt-4 p-3 rounded-lg bg-gray-900 border border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Diferencia</span>
                  <span className={`font-bold ${diferenciaColor}`}>
                    {formatMoney(diferencia)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Diferencia = Real - Esperado
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarCaja}
                disabled={loading}
                className="mt-4 w-full px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Ejecutar Cierre
              </button>
            </div>
          </div>

          <div className="bg-gray-800/40 border border-gray-700/50 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">
              Pagos de la sesión (por método)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {(resumen?.pagos?.por_metodo || []).length === 0 ? (
                <div className="text-gray-500">
                  Sin pagos asociados a esta sesión.
                </div>
              ) : (
                (resumen?.pagos?.por_metodo || []).map((r) => (
                  <div
                    key={r.metodo_pago}
                    className="flex justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
                  >
                    <span className="text-gray-300">
                      {r.metodo_pago || "(sin método)"}
                    </span>
                    <span className="text-gray-100 font-semibold">
                      {formatMoney(r.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((p) => ({...p, show: false}))}
        />
      )}
    </div>
  );
}
