import {useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import Loader from "./Loader";
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const start = Date.now();

    try {
      const response = await api.post(services.login, {email, password});
      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Error al iniciar sesión"
      );
    } finally {
      // Asegura que el loader se muestre al menos 1 segundo
      const elapsed = Date.now() - start;
      const minTime = 1000;
      if (elapsed < minTime) {
        setTimeout(() => setLoading(false), minTime - elapsed);
      } else {
        setLoading(false);
      }
    }
  };

  if (loading) return <Loader text="Iniciando sesión..." />;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-300/10 rounded-full blur-2xl animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="p-4 bg-white/10 backdrop-blur-md rounded-2xl mr-4">
              <AcademicCapIcon className="h-16 w-16 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold tracking-tight">
                <span className="text-white">Sistema</span>
                <span className="text-cyan-200 ml-2">AOC</span>
              </h1>
              <p className="text-xl text-cyan-100 mt-2">
                Gestión Escolar Inteligente
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <UserIcon className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Gestión de Estudiantes
                </h3>
                <p className="text-cyan-100 text-sm">
                  Control completo de alumnos y profesores
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <ShieldCheckIcon className="h-6 w-6 text-blue-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Seguridad Avanzada</h3>
                <p className="text-blue-100 text-sm">
                  Protección de datos y acceso seguro
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <StarIcon className="h-6 w-6 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Experiencia Premium</h3>
                <p className="text-indigo-100 text-sm">
                  Interfaz moderna y fácil de usar
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-cyan-200 text-sm">Estudiantes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-blue-200 text-sm">Profesores</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">10+</div>
              <div className="text-indigo-200 text-sm">Escuelas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center p-3 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl mb-4">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Sistema <span className="text-cyan-600">AOC</span>
            </h1>
            <p className="text-gray-600">Gestión Escolar</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido
              </h2>
              <p className="text-gray-600">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-medium flex items-center">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Recordarme</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
                  loading ? "opacity-75 cursor-not-allowed" : "hover:scale-105"
                } ${isHovered ? "from-cyan-700 to-blue-700" : ""}`}
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
            <p>© 2024 Sistema AOC. Todos los derechos reservados.</p>
            <p className="mt-1">Versión 2.0 - Gestión Escolar Inteligente</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
