import React, {useState} from "react";
import {useNavigate, useLocation} from "react-router-dom";
import {Mail, Send, CheckCircle, AlertCircle} from "lucide-react";
import api from "../api/axiosConfig";

function EmailNoVerificado() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailParam = location.state?.email || "";

  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const reenviarVerificacion = async () => {
    if (!email) {
      setError("Por favor ingresa tu email");
      return;
    }

    setLoading(true);
    setError("");
    setMensaje("");

    try {
      const response = await api.post("/api/auth/reenviar-verificacion", {
        email,
      });
      setMensaje(response.data.mensaje);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "No se pudo reenviar el email. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Email No Verificado
            </h1>
            <p className="text-orange-100">Necesitas verificar tu cuenta</p>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Verifica tu email</p>
                  <p>
                    Enviamos un enlace de verificación a tu correo electrónico
                    durante el registro. Por favor revisa tu bandeja de entrada
                    (y spam).
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {mensaje && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-800">{mensaje}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              onClick={reenviarVerificacion}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Reenviar Email de Verificación
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition-all duration-300"
            >
              Volver al Login
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm">
            © 2025 Sistema de Gestión Escolar
          </p>
        </div>
      </div>
    </div>
  );
}

export default EmailNoVerificado;
