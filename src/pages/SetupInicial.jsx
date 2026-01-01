import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import Toast from "../components/Toast";
import {
  School,
  User,
  Mail,
  Lock,
  Building,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  LogIn,
} from "lucide-react";
import api from "../api/axiosConfig";
import {setTokenWithExpiration} from "../utils/tokenUtils";

function SetupInicial({setToken, setNecesitaSetup}) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  // Datos del administrador
  const [adminData, setAdminData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    contraseña: "",
    confirmarContraseña: "",
  });

  // Datos de la escuela
  const [escuelaData, setEscuelaData] = useState({
    nombre: "",
    direccion: "",
    codigo_escuela: "",
    telefono: "",
    nivel_educativo: "Primaria",
    municipio: "",
    nombre_director: "",
    codigo_establecimiento: "",
  });

  const handleAdminChange = (e) => {
    setAdminData({...adminData, [e.target.name]: e.target.value});
    setError("");
  };

  const handleEscuelaChange = (e) => {
    setEscuelaData({...escuelaData, [e.target.name]: e.target.value});
    setError("");
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setError("Por favor selecciona una imagen válida");
        return;
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("La imagen no debe superar 2MB");
        return;
      }

      setLogoFile(file);

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const validarPaso1 = () => {
    if (
      !adminData.nombre ||
      !adminData.apellido ||
      !adminData.email ||
      !adminData.contraseña
    ) {
      setError("Por favor completa todos los campos obligatorios");
      return false;
    }

    if (adminData.contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }

    if (adminData.contraseña !== adminData.confirmarContraseña) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
      setError("Email inválido");
      return false;
    }

    return true;
  };

  const validarPaso2 = () => {
    if (
      !escuelaData.nombre ||
      !escuelaData.direccion ||
      !escuelaData.municipio ||
      !escuelaData.codigo_escuela ||
      !escuelaData.codigo_establecimiento
    ) {
      setError(
        "Por favor completa todos los campos obligatorios incluyendo los códigos"
      );
      return false;
    }
    return true;
  };

  const handleSiguiente = () => {
    if (step === 1 && validarPaso1()) {
      setStep(2);
      setError("");
    }
  };

  const handleFinalizar = async () => {
    if (!validarPaso2()) return;

    setLoading(true);
    setError("");

    try {
      // Crear FormData para enviar el logo
      const formData = new FormData();
      formData.append("admin", JSON.stringify(adminData));
      formData.append("escuela", JSON.stringify(escuelaData));

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      console.log("📤 Enviando datos de setup...");

      // Registrar el sistema (admin + escuela) en un solo endpoint
      const response = await api.post("/api/auth/setup-inicial", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("✅ Respuesta del servidor:", response.data);

      // Mostrar mensaje de éxito
      showToast(
        `¡Registro exitoso! Se ha enviado un email de verificación a ${adminData.email}. Por favor revisa tu bandeja de entrada.`,
        "success"
      );

      // Redirigir a página de email no verificado después de un momento
      setTimeout(() => {
        navigate("/email-no-verificado", {
          state: {email: adminData.email},
        });
      }, 2000);
    } catch (err) {
      console.error("Error en setup:", err);
      console.error("Error completo:", {
        message: err.message,
        response: err.response,
        request: err.request,
        config: err.config,
      });

      if (err.response) {
        // El servidor respondió con un error
        console.error("Detalles del error:", err.response.data);
        console.error("Status:", err.response.status);
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            err.response.data?.detalles ||
            "Error al configurar el sistema"
        );
      } else if (err.request) {
        // La petición se hizo pero no hubo respuesta
        console.error("No hubo respuesta del servidor");
        setError(
          "No se pudo conectar con el servidor. Verifica que esté en ejecución."
        );
      } else {
        // Algo pasó al configurar la petición
        console.error("Error al configurar la petición:", err.message);
        setError("Error al enviar los datos: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-xl">
            <School className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Configuración Inicial
          </h1>
          <p className="text-blue-200">
            Configura tu escuela y crea la cuenta de administrador
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1
                  ? "bg-gradient-to-r from-blue-500 to-purple-600"
                  : "bg-gray-700"
              } text-white font-bold shadow-lg`}
            >
              {step > 1 ? <CheckCircle className="h-6 w-6" /> : "1"}
            </div>
            <div
              className={`w-32 h-1 mx-2 ${
                step >= 2
                  ? "bg-gradient-to-r from-blue-500 to-purple-600"
                  : "bg-gray-700"
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2
                  ? "bg-gradient-to-r from-blue-500 to-purple-600"
                  : "bg-gray-700"
              } text-white font-bold shadow-lg`}
            >
              2
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Paso 1: Datos del Administrador */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-400" />
                  Datos del Administrador
                </h2>
                <p className="text-gray-400">
                  Esta será la cuenta principal con acceso total al sistema
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Nombre <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="nombre"
                      value={adminData.nombre}
                      onChange={handleAdminChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Juan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Apellido <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="apellido"
                      value={adminData.apellido}
                      onChange={handleAdminChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Pérez"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={adminData.email}
                    onChange={handleAdminChange}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@escuela.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Contraseña <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="contraseña"
                      value={adminData.contraseña}
                      onChange={handleAdminChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Confirmar Contraseña <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      name="confirmarContraseña"
                      value={adminData.confirmarContraseña}
                      onChange={handleAdminChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSiguiente}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
              >
                Siguiente
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Paso 2: Datos de la Escuela */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <School className="h-6 w-6 text-purple-400" />
                  Datos de la Escuela
                </h2>
                <p className="text-gray-400">
                  Información de tu institución educativa
                </p>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Nombre de la Escuela <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nombre"
                    value={escuelaData.nombre}
                    onChange={handleEscuelaChange}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Escuela Nacional Juan José Arévalo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Código de Escuela <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="codigo_escuela"
                      value={escuelaData.codigo_escuela}
                      onChange={handleEscuelaChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="ESC-001"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Código Establecimiento (MINED){" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="codigo_establecimiento"
                      value={escuelaData.codigo_establecimiento}
                      onChange={handleEscuelaChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0001-00000-0"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Dirección <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="direccion"
                    value={escuelaData.direccion}
                    onChange={handleEscuelaChange}
                    rows="2"
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Barrio El Centro, 3 cuadras al norte..."
                  ></textarea>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Municipio <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="municipio"
                      value={escuelaData.municipio}
                      onChange={handleEscuelaChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Managua"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="telefono"
                      value={escuelaData.telefono}
                      onChange={handleEscuelaChange}
                      className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="8888-8888"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2 font-semibold">
                    Nivel Educativo
                  </label>
                  <select
                    name="nivel_educativo"
                    value={escuelaData.nivel_educativo}
                    onChange={handleEscuelaChange}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Preescolar">Preescolar</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                    <option value="Sabatino">Sabatino</option>
                    <option value="Universidad">Universidad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Logo de la Escuela
                </label>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-24 h-24 object-cover rounded-lg border-2 border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setLogoPreview(null);
                          setLogoFile(null);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-gray-600" />
                    </div>
                  )}

                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-3 rounded-lg transition-colors">
                        <Upload className="h-5 w-5" />
                        <span className="font-medium">
                          {logoFile ? "Cambiar Logo" : "Seleccionar Logo"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-gray-400 text-sm mt-2">
                      JPG, PNG o GIF (máximo 2MB)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Nombre del Director
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nombre_director"
                    value={escuelaData.nombre_director}
                    onChange={handleEscuelaChange}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Lic. María Rodríguez"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg transition-all duration-300"
                >
                  Anterior
                </button>
                <button
                  onClick={handleFinalizar}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Configurando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Finalizar Configuración
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm mb-3">
            © 2025 Sistema de Gestión Escolar - Todos los derechos reservados
          </p>
          <button
            onClick={() => navigate("/login")}
            className="text-blue-300 hover:text-blue-200 text-sm underline transition-colors duration-200"
          >
            ¿Ya tienes cuenta? Inicia sesión aquí
          </button>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({show: false, message: "", type: "success"})}
        />
      )}
    </div>
  );
}

export default SetupInicial;
