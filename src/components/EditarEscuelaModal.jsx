import {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  XMarkIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  DocumentTextIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";

export default function EditarEscuelaModal({
  open,
  onClose,
  escuela,
  onSuccess,
  setToken,
}) {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [isClosing, setIsClosing] = useState(false);

  // Este useEffect actualiza el formulario cada vez que cambia la escuela a editar
  useEffect(() => {
    if (escuela) {
      setForm(escuela);
      // Si hay logo existente, establecer preview
      if (escuela.logo) {
        setPreviewImage(
          `${api.defaults.baseURL}/uploads/logos/${escuela.logo}`
        );
      }
    }
  }, [escuela]);

  // Limpiar estados al cerrar
  useEffect(() => {
    if (!open) {
      setError("");
      setPreviewImage(null);
      setDragActive(false);
      setIsClosing(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleChange = (e) => {
    const {name, value, files} = e.target;
    if (files && files[0]) {
      handleFileChange(files[0]);
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (file) => {
    setError("");

    // Validar tipo y tamaño
    if (
      !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(
        file.type
      )
    ) {
      setError("Formato de imagen no válido (Solo JPG, PNG, GIF, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar 5MB.");
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    // Actualizar form
    setForm((prev) => ({
      ...prev,
      logo: file,
    }));
  };

  // Funciones drag and drop
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
      handleFileChange(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      await api.put(services.editarEscuela(escuela.id_escuela), data);

      onSuccess && onSuccess();
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || "Error al editar escuela");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 transform transition-all duration-300 ${
          isClosing
            ? "scale-95 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-t-3xl p-6 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <BuildingLibraryIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Editar Escuela
                </h2>
                <p className="text-blue-100 text-sm">
                  Actualizar información de la institución
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6 text-white group-hover:text-red-200 transition-colors" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            encType="multipart/form-data"
          >
            {/* Logo Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Logo de la Escuela
              </label>
              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {previewImage ? (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <img
                        src={previewImage}
                        alt="Preview del logo"
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-blue-200 shadow-lg"
                      />
                      <div className="absolute -top-2 -right-2 p-1 bg-green-500 rounded-full">
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Logo cargado
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewImage(null);
                          setForm((prev) => ({...prev, logo: null}));
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
                      >
                        Eliminar imagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div>
                      <label className="cursor-pointer">
                        <span className="text-blue-600 font-medium hover:text-blue-700">
                          Sube el logo de la escuela
                        </span>
                        <span className="text-gray-500"> o arrastra aquí</span>
                        <input
                          type="file"
                          name="logo"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, WEBP hasta 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Escuela *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BuildingLibraryIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="nombre"
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Ingresa el nombre de la escuela"
                    value={form.nombre || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Código de Escuela */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Escuela *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="codigo_escuela"
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Código único de la escuela"
                    value={form.codigo_escuela || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Código de Establecimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Establecimiento *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="codigo_establecimiento"
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Código del establecimiento"
                    value={form.codigo_establecimiento || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Nombre del Director */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Director *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="nombre_director"
                    type="text"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Nombre completo del director"
                    value={form.nombre_director || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="telefono"
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Número de teléfono"
                    value={form.telefono || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Municipio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Municipio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="municipio"
                    type="text"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder="Municipio donde se ubica"
                    value={form.municipio || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Dirección - Full Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="direccion"
                  type="text"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Dirección completa de la escuela"
                  value={form.direccion || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 rounded-b-3xl px-6 py-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
