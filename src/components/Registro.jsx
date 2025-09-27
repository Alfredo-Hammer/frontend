import {useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {Link} from "react-router-dom";
import Loader from "./Loader";
import {
  EyeIcon,
  EyeSlashIcon,
  AcademicCapIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ArrowRightIcon,
  PhotoIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  StarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

function Registro({setToken}) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    id_rol: "3",
    imagen: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleFileChange = (e) => {
    setError("");
    const file = e.target.files[0];

    // Validar tamaño y formato de imagen antes de subir
    if (file && !["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setError("Formato de imagen no válido (Solo JPG, PNG o GIF).");
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      setError("La imagen no debe superar 2MB.");
      return;
    }

    if (file) {
      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(null);
    }

    setFormData({...formData, imagen: file});
  };

  // Funciones para drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const fakeEvent = {target: {files}};
      handleFileChange(fakeEvent);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      const response = await api.post(services.register, data, {
        headers: {"Content-Type": "multipart/form-data"},
      });

      setToken(response.data.token);
      localStorage.setItem("token", response.data.token);
    } catch (err) {
      // Muestra el mensaje de error más informativo posible
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Error al registrar usuario"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader text="Registrando usuario..." />;

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-16 left-24 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-56 h-56 bg-teal-300/10 rounded-full blur-2xl animate-pulse delay-500"></div>
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
                <span className="text-emerald-200 ml-2">AOC</span>
              </h1>
              <p className="text-xl text-teal-100 mt-2">
                Únete a Nuestra Comunidad
              </p>
            </div>
          </div>

          {/* Registration Benefits */}
          <div className="space-y-6 max-w-md">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <UserIcon className="h-6 w-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Perfil Personalizado</h3>
                <p className="text-emerald-100 text-sm">
                  Crea tu perfil único con foto y datos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <ShieldCheckIcon className="h-6 w-6 text-teal-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Acceso Seguro</h3>
                <p className="text-teal-100 text-sm">
                  Protección avanzada de tus datos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <StarIcon className="h-6 w-6 text-cyan-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Funciones Premium</h3>
                <p className="text-cyan-100 text-sm">
                  Accede a todas las herramientas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <UserGroupIcon className="h-6 w-6 text-indigo-200" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Comunidad Activa</h3>
                <p className="text-indigo-100 text-sm">
                  Conéctate con estudiantes y profesores
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">1000+</div>
              <div className="text-emerald-200 text-sm">Usuarios Activos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">25+</div>
              <div className="text-teal-200 text-sm">Instituciones</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">99%</div>
              <div className="text-cyan-200 text-sm">Satisfacción</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4">
              <AcademicCapIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900">
              Sistema <span className="text-emerald-600">AOC</span>
            </h1>
            <p className="text-gray-600">Registro de Usuario</p>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Crear Cuenta
              </h2>
              <p className="text-gray-600">
                Completa tus datos para registrarte
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

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              encType="multipart/form-data"
            >
              {/* Profile Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Foto de Perfil (Opcional)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
                    dragActive
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {previewImage ? (
                    <div className="space-y-3">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-emerald-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setFormData({...formData, imagen: null});
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-emerald-600 font-medium hover:text-emerald-700">
                            Sube una imagen
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            o arrastra aquí
                          </span>
                          <input
                            type="file"
                            name="imagen"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF hasta 2MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Tu nombre"
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="apellido"
                      placeholder="Tu apellido"
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="tucorreo@ejemplo.com"
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 bg-gray-50 hover:bg-white"
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

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario
                </label>
                <select
                  name="id_rol"
                  onChange={handleChange}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-all duration-200 text-gray-900"
                >
                  <option value="3">👨‍🎓 Estudiante</option>
                  <option value="2">👨‍🏫 Profesor</option>
                  <option value="1">👨‍💼 Administrador</option>
                </select>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-600">
                  Acepto los{" "}
                  <Link
                    to="/terms"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link
                    to="/privacy"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    política de privacidad
                  </Link>
                </span>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                disabled={loading}
                className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
                  loading ? "opacity-75 cursor-not-allowed" : "hover:scale-105"
                } ${isHovered ? "from-emerald-700 to-teal-700" : ""}`}
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
                    Registrando...
                  </>
                ) : (
                  <>
                    Crear Cuenta
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  to="/login"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>© 2024 Sistema AOC. Todos los derechos reservados.</p>
            <p className="mt-1">Registro seguro y protegido</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registro;
