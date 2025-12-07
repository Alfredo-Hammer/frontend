import {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/solid";
import api from "../api/axiosConfig";
import services from "../api/services";
import Loader from "../components/Loader";

function RestablecerPassword() {
  const {token} = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [validando, setValidando] = useState(true);
  const [tokenValido, setTokenValido] = useState(false);
  const [usuario, setUsuario] = useState(null);

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [procesando, setProcesando] = useState(false);

  // Validar token al cargar
  useEffect(() => {
    validarToken();
  }, [token]);

  const validarToken = async () => {
    try {
      const response = await api.get(services.validarTokenRecuperacion(token));

      if (response.data.valido) {
        setTokenValido(true);
        setUsuario(response.data.usuario);
      } else {
        setTokenValido(false);
        setError(response.data.error || "Token inválido");
      }
    } catch (err) {
      setTokenValido(false);
      setError(
        err.response?.data?.error ||
          "El enlace de recuperación es inválido o ha expirado"
      );
    } finally {
      setValidando(false);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setProcesando(true);

    try {
      const response = await api.post(services.restablecerPassword, {
        token,
        nuevaPassword,
      });

      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Error al restablecer la contraseña. Por favor, intenta de nuevo."
      );
    } finally {
      setProcesando(false);
    }
  };

  if (loading || validando) {
    return <Loader text="Validando enlace..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-32 right-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
          style={{animationDelay: "1s"}}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-2xl">
            <AcademicCapIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Sistema de Gestión Escolar
          </h1>
        </div>

        <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
          {!tokenValido ? (
            // Token Inválido
            <div className="text-center py-8">
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">
                Enlace Inválido
              </h2>
              <p className="text-gray-400 mb-6">
                {error ||
                  "Este enlace de recuperación no es válido o ha expirado."}
              </p>
              <button
                onClick={() => navigate("/login")}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Volver al Login
              </button>
            </div>
          ) : success ? (
            // Éxito
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-3">
                ¡Contraseña Restablecida!
              </h2>
              <p className="text-gray-400 mb-4">
                Tu contraseña ha sido actualizada exitosamente.
              </p>
              <p className="text-sm text-gray-500">
                Redirigiendo al login en 3 segundos...
              </p>
            </div>
          ) : (
            // Formulario de Restablecimiento
            <>
              <div className="text-center mb-6">
                <LockClosedIcon className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h2 className="text-2xl font-bold text-white mb-2">
                  Restablecer Contraseña
                </h2>
                {usuario && (
                  <p className="text-gray-400 text-sm">
                    {usuario.nombre} {usuario.apellido} ({usuario.email})
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm flex items-center">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-12 pr-12 py-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 bg-gray-800 hover:bg-gray-750"
                      disabled={procesando}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repite tu contraseña"
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      required
                      className="w-full pl-12 pr-12 py-3 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 bg-gray-800 hover:bg-gray-750"
                      disabled={procesando}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-300 transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Indicador de fortaleza */}
                {nuevaPassword && (
                  <div className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400">Fortaleza:</span>
                      <span
                        className={`font-medium ${
                          nuevaPassword.length < 6
                            ? "text-red-400"
                            : nuevaPassword.length < 8
                            ? "text-yellow-400"
                            : nuevaPassword.length < 12
                            ? "text-blue-400"
                            : "text-green-400"
                        }`}
                      >
                        {nuevaPassword.length < 6
                          ? "Muy débil"
                          : nuevaPassword.length < 8
                          ? "Débil"
                          : nuevaPassword.length < 12
                          ? "Buena"
                          : "Fuerte"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          nuevaPassword.length < 6
                            ? "bg-red-500 w-1/4"
                            : nuevaPassword.length < 8
                            ? "bg-yellow-500 w-1/2"
                            : nuevaPassword.length < 12
                            ? "bg-blue-500 w-3/4"
                            : "bg-green-500 w-full"
                        }`}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="flex-1 px-4 py-3 border border-gray-700 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors font-medium"
                    disabled={procesando}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    disabled={procesando}
                  >
                    {procesando ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Procesando...
                      </>
                    ) : (
                      "Restablecer Contraseña"
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© 2025 Sistema AOC. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default RestablecerPassword;
