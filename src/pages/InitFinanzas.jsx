import React, {useState} from "react";
import api from "../api/axiosConfig";

const InitFinanzas = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inicializarFinanzas = async () => {
    try {
      setLoading(true);
      setMessage("");
      setError("");

      const response = await api.get("/setup/init-finanzas");

      setMessage(response.data.message);
      console.log("✅ Finanzas inicializadas:", response.data);
    } catch (err) {
      setError(err.response?.data?.details || "Error al inicializar finanzas");
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-100 mb-6 text-center">
          Inicializar Sistema de Finanzas
        </h1>

        <p className="text-gray-300 mb-6 text-sm">
          Este proceso creará todas las tablas necesarias para el módulo de
          finanzas: conceptos de pago, pagos, cuentas por cobrar, becas y
          configuración.
        </p>

        <button
          onClick={inicializarFinanzas}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Inicializando..." : "Inicializar Base de Datos"}
        </button>

        {message && (
          <div className="mt-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-300 text-sm">✅ {message}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-300 text-sm">❌ {error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InitFinanzas;
