import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {CheckCircle, XCircle, Loader, Mail} from "lucide-react";
import api from "../api/axiosConfig";

function VerificarEmail() {
  const {token} = useParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState("verificando"); // 'verificando', 'exito', 'error'
  const [mensaje, setMensaje] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");

  useEffect(() => {
    if (token) {
      verificarToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verificarToken = async () => {
    try {
      console.log('🔍 Verificando token:', token);
      const response = await api.get(`/api/auth/verificar-email/${token}`);

      console.log('✅ Respuesta del servidor:', response.data);
      setEstado("exito");
      setMensaje(response.data.mensaje);
      setNombreUsuario(response.data.nombre);
    } catch (error) {
      console.error('❌ Error al verificar:', error.response?.data || error.message);
      setEstado("error");
      setMensaje(
        error.response?.data?.mensaje ||
          "No se pudo verificar el email. El enlace puede ser inválido o estar expirado."
      );
    }
  };

  const irALogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div
            className={`p-8 text-center ${
              estado === "exito"
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : estado === "error"
                ? "bg-gradient-to-r from-red-500 to-pink-600"
                : "bg-gradient-to-r from-blue-500 to-purple-600"
            }`}
          >
            {estado === "verificando" && (
              <div className="flex flex-col items-center">
                <Loader className="h-16 w-16 text-white animate-spin mb-4" />
                <h1 className="text-3xl font-bold text-white">
                  Verificando...
                </h1>
              </div>
            )}

            {estado === "exito" && (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-white mb-4" />
                <h1 className="text-3xl font-bold text-white">¡Verificado!</h1>
              </div>
            )}

            {estado === "error" && (
              <div className="flex flex-col items-center">
                <XCircle className="h-16 w-16 text-white mb-4" />
                <h1 className="text-3xl font-bold text-white">Error</h1>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8">
            {estado === "verificando" && (
              <div className="text-center text-gray-600">
                <p>Por favor espera mientras verificamos tu cuenta...</p>
              </div>
            )}

            {estado === "exito" && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-800 mb-2">
                    ¡Bienvenido, {nombreUsuario}!
                  </p>
                  <p className="text-gray-600 mb-6">{mensaje}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">
                        Tu cuenta está activa
                      </p>
                      <p>
                        Ahora puedes acceder al sistema con tu email y
                        contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={irALogin}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition-all duration-300 shadow-lg"
                >
                  Ir a Iniciar Sesión
                </button>
              </div>
            )}

            {estado === "error" && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{mensaje}</p>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>
                    Si necesitas un nuevo enlace de verificación, contáctanos o
                    intenta registrarte nuevamente.
                  </p>
                </div>

                <button
                  onClick={irALogin}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all duration-300"
                >
                  Volver al Inicio
                </button>
              </div>
            )}
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

export default VerificarEmail;
