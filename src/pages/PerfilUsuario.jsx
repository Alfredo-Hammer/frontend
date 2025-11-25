import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  CameraIcon,
} from "@heroicons/react/24/solid";

/**
 * Página de Perfil de Usuario
 * Permite ver y editar información personal
 */
function PerfilUsuario() {
  const [user, setUser] = useState(null);
  const [editando, setEditando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarPerfil();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });

      const userData = {
        nombre: res.data.usuario?.nombre || res.data.nombre,
        apellido: res.data.usuario?.apellido || res.data.apellido,
        email: res.data.usuario?.email || res.data.email,
        rol: res.data.usuario?.rol || res.data.rol,
        telefono: res.data.usuario?.telefono || res.data.telefono || "",
        fecha_registro:
          res.data.usuario?.fecha_registro || res.data.fecha_registro,
      };

      setUser(userData);
      setFormData({
        nombre: userData.nombre || "",
        apellido: userData.apellido || "",
        email: userData.email || "",
        telefono: userData.telefono || "",
      });
    } catch (error) {
      console.error("Error al cargar perfil:", error);
      setMensaje("Error al cargar el perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGuardar = async () => {
    try {
      await api.put("/api/usuarios/perfil", formData, {
        headers: {Authorization: `Bearer ${token}`},
      });

      setMensaje("Perfil actualizado correctamente");
      setEditando(false);
      cargarPerfil();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMensaje("Error al actualizar el perfil");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const getRolNombre = (rol) => {
    const roles = {
      admin: "Administrador",
      director: "Director",
      profesor: "Profesor",
      alumno: "Estudiante",
      padre: "Padre de Familia",
    };
    return roles[rol] || rol;
  };

  const getRolColor = (rol) => {
    const colores = {
      admin: "from-red-500 to-pink-500",
      director: "from-orange-500 to-yellow-500",
      profesor: "from-purple-500 to-indigo-500",
      alumno: "from-blue-500 to-cyan-500",
      padre: "from-green-500 to-emerald-500",
    };
    return colores[rol] || "from-gray-500 to-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl p-6 mb-6 shadow-xl">
          <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
          <p className="text-cyan-100">Administra tu información personal</p>
        </div>

        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-xl ${
              mensaje.includes("correctamente")
                ? "bg-green-500/10 border border-green-500/20 text-green-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Card Principal */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden shadow-xl">
          {/* Portada */}
          <div
            className={`h-32 bg-gradient-to-r ${getRolColor(user?.rol)}`}
          ></div>

          {/* Información del Usuario */}
          <div className="px-8 pb-8">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center border-4 border-gray-800 shadow-xl">
                  <UserIcon className="w-16 h-16 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors shadow-lg">
                  <CameraIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              {!editando && (
                <button
                  onClick={() => setEditando(true)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                  Editar Perfil
                </button>
              )}
            </div>

            {/* Nombre y Rol */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                {user?.nombre} {user?.apellido}
              </h2>
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-medium capitalize">
                  {getRolNombre(user?.rol)}
                </span>
              </div>
            </div>

            {/* Formulario de Información */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Nombre
                </label>
                {editando ? (
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user?.nombre}</span>
                  </div>
                )}
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Apellido
                </label>
                {editando ? (
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                    <UserIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user?.apellido}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Correo Electrónico
                </label>
                {editando ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user?.email}</span>
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Teléfono
                </label>
                {editando ? (
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Ingresa tu teléfono"
                  />
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-white">
                      {user?.telefono || "No registrado"}
                    </span>
                  </div>
                )}
              </div>

              {/* Rol (no editable) */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Rol en el Sistema
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                  <AcademicCapIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-white capitalize">
                    {getRolNombre(user?.rol)}
                  </span>
                </div>
              </div>

              {/* Fecha de Registro */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Fecha de Registro
                </label>
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-700/50 rounded-xl">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-white">
                    {user?.fecha_registro
                      ? new Date(user.fecha_registro).toLocaleDateString(
                          "es-ES"
                        )
                      : "No disponible"}
                  </span>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            {editando && (
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleGuardar}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => {
                    setEditando(false);
                    setFormData({
                      nombre: user?.nombre || "",
                      apellido: user?.apellido || "",
                      email: user?.email || "",
                      telefono: user?.telefono || "",
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Seguridad */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mt-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-4">Seguridad</h3>
          <button className="w-full px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform">
            Cambiar Contraseña
          </button>
        </div>
      </div>
    </div>
  );
}

export default PerfilUsuario;
