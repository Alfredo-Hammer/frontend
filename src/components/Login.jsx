import {useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import services from "../api/services";
import Loader from "./Loader";
import RecuperarPasswordModal from "./RecuperarPasswordModal";
import {setTokenWithExpiration} from "../utils/tokenUtils";
import {
  EyeIcon,
  EyeSlashIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  UserIcon,
  ShieldCheckIcon,
  StarIcon,
} from "@heroicons/react/24/solid";

function Login({setToken}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const start = Date.now();

    try {
      const response = await api.post(services.login, {email, password});
      setTokenWithExpiration(response.data.token);
      setToken(response.data.token);

      // Guardar tiempo de expiración del token (1 hora)
      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("tokenExpiry", expiryTime.toString());

      // Redirigir al dashboard principal después del login exitoso
      setTimeout(() => {
        navigate("/");
      }, 100);
    } catch (err) {
      // Manejar email no verificado
      if (err.response?.data?.requiereVerificacion) {
        navigate("/email-no-verificado", {
          state: {email: err.response.data.email},
        });
        return;
      }

      // Manejar cuenta bloqueada por intentos fallidos
      if (err.response?.status === 403 && err.response?.data?.bloqueado) {
        setError(
          "🔒 Cuenta bloqueada temporalmente por demasiados intentos fallidos. Por seguridad, espera 1 hora antes de intentar nuevamente."
        );
      }
      // Manejar contraseña incorrecta con contador de intentos (401 o 400)
      else if (
        (err.response?.status === 401 || err.response?.status === 400) &&
        err.response?.data?.intentosRestantes !== undefined
      ) {
        const intentosRestantes = err.response.data.intentosRestantes;
        if (intentosRestantes > 0) {
          setError(
            `❌ Credenciales inválidas. Te quedan ${intentosRestantes} intento${
              intentosRestantes !== 1 ? "s" : ""
            } antes del bloqueo temporal.`
          );
        } else {
          setError(
            "⚠️ Credenciales inválidas. Próximo intento fallido bloqueará tu cuenta por 1 hora."
          );
        }
      }
      // Manejar cuenta inactiva
      else if (err.response?.data?.error === "CUENTA_INACTIVA") {
        setError(
          "⚠️ Tu cuenta ha sido desactivada. Contacta al administrador del sistema."
        );
      }
      // Error genérico
      else {
        setError(
          err.response?.data?.mensaje ||
            err.response?.data?.message ||
            err.response?.data?.error ||
            "Error al iniciar sesión"
        );
      }
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Iniciando sesión..." />;

  return (
    <div className="min-h-screen flex bg-gray-950">
      {/* Left Side - Branding (Dark Theme) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden border-r border-gray-800">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-32 right-16 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"
            style={{animationDelay: "1s"}}
          ></div>
          <div
            className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl animate-pulse"
            style={{animationDelay: "0.5s"}}
          ></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          {/* Logo */}
          <div className="flex items-center mb-12">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mr-4 shadow-2xl">
              <AcademicCapIcon className="h-16 w-16 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="text-white">Sistema</span>
                <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent ml-2">
                  AOC
                </span>
              </h1>
              <p className="text-xl text-gray-400 mt-2 font-medium">
                Gestión Escolar Inteligente
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">
                  Gestión de Estudiantes
                </h3>
                <p className="text-gray-400 text-sm">
                  Control completo de alumnos y profesores
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-lg">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">
                  Seguridad Avanzada
                </h3>
                <p className="text-gray-400 text-sm">
                  Protección de datos y acceso seguro
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-gray-800/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300">
              <div className="p-3 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-xl shadow-lg">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">
                  Experiencia Premium
                </h3>
                <p className="text-gray-400 text-sm">
                  Interfaz moderna y fácil de usar
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                500+
              </div>
              <div className="text-gray-400 text-sm mt-1">Estudiantes</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                50+
              </div>
              <div className="text-gray-400 text-sm mt-1">Profesores</div>
            </div>
            <div className="bg-gray-800/30 backdrop-blur-sm p-4 rounded-2xl border border-gray-700/50">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                10+
              </div>
              <div className="text-gray-400 text-sm mt-1">Escuelas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Dark Theme) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-2xl">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              Sistema{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                AOC
              </span>
            </h1>
            <p className="text-gray-400">Gestión Escolar</p>
          </div>

          {/* Login Card */}
          <div className="bg-gray-900 rounded-3xl shadow-2xl p-8 border border-gray-800">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-gray-400">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                <p className="text-red-400 text-sm font-medium flex items-center">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 bg-gray-800 hover:bg-gray-750"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-white placeholder-gray-500 bg-gray-800 hover:bg-gray-750"
                    disabled={loading}
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

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-800"
                  />
                  <span className="ml-2 text-sm text-gray-400">Recordarme</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarRecuperacion(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-blue-500/25 transform transition-all duration-300 flex items-center justify-center ${
                  loading
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700"
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    Iniciar Sesión
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2025 Sistema AOC. Todos los derechos reservados.</p>
            <p className="mt-1">Gestión Escolar</p>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      <RecuperarPasswordModal
        isOpen={mostrarRecuperacion}
        onClose={() => setMostrarRecuperacion(false)}
      />
    </div>
  );
}

export default Login;
