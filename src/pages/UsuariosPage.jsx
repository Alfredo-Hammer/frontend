import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";

const API_BASE_URL = "http://localhost:4000";

function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [passwordData, setPasswordData] = useState({
    usuarioId: null,
    nuevaPassword: "",
    confirmarPassword: "",
  });
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    id_rol: "",
    activo: true,
  });
  const [escuela, setEscuela] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarDatos();
    fetchUser();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        api.get("/api/usuarios/lista", {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get("/api/roles", {headers: {Authorization: `Bearer ${token}`}}),
      ]);

      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar datos de escuela:", error);
    }
  };

  const handleInputChange = (e) => {
    const {name, value, type, checked} = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/api/usuarios/${usuarioEditar.id_usuario}`, formData, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setMensaje("Usuario actualizado correctamente");
      } else {
        await api.post("/api/usuarios/register", formData, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setMensaje("Usuario creado correctamente");
      }

      cargarDatos();
      cerrarModal();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      setError(error.response?.data?.error || "Error al guardar el usuario");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCambiarEstado = async (id_usuario, activo) => {
    try {
      await api.put(
        `/api/usuarios/${id_usuario}/estado`,
        {activo: !activo},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setMensaje(
        `Usuario ${!activo ? "activado" : "desactivado"} correctamente`
      );
      cargarDatos();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      setError("Error al cambiar el estado del usuario");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      setError("Las contraseñas no coinciden");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (passwordData.nuevaPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      await api.put(
        `/api/usuarios/${passwordData.usuarioId}/password`,
        {password: passwordData.nuevaPassword},
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setMensaje("Contraseña actualizada correctamente");
      setShowPasswordModal(false);
      setPasswordData({
        usuarioId: null,
        nuevaPassword: "",
        confirmarPassword: "",
      });
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      setError("Error al cambiar la contraseña");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleEliminarUsuario = async (id_usuario) => {
    if (
      !window.confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/usuarios/${id_usuario}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Usuario eliminado correctamente");
      cargarDatos();
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setError("Error al eliminar el usuario");
      setTimeout(() => setError(""), 3000);
    }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setUsuarioEditar(null);
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      telefono: "",
      id_rol: "",
      activo: true,
    });
    setShowModal(true);
  };

  const abrirModalEditar = (usuario) => {
    setModoEdicion(true);
    setUsuarioEditar(usuario);
    setFormData({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: "", // No mostramos la password
      telefono: usuario.telefono || "",
      id_rol: usuario.id_rol,
      activo: usuario.activo,
    });
    setShowModal(true);
  };

  const abrirModalPassword = (usuario) => {
    setPasswordData({
      usuarioId: usuario.id_usuario,
      nuevaPassword: "",
      confirmarPassword: "",
    });
    setShowPasswordModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setModoEdicion(false);
    setUsuarioEditar(null);
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      telefono: "",
      id_rol: "",
      activo: true,
    });
  };

  const getRolNombre = (id_rol) => {
    const rol = roles.find((r) => r.id_rol === id_rol);
    return rol?.nombre || "Sin rol";
  };

  const getRolColor = (id_rol) => {
    const colores = {
      1: "bg-red-500/10 text-red-400 border-red-500/20",
      2: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      3: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      4: "bg-green-500/10 text-green-400 border-green-500/20",
      5: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    };
    return colores[id_rol] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const matchSearch =
      usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRol = filterRol === "" || usuario.id_rol === parseInt(filterRol);

    const matchEstado =
      filterEstado === "" ||
      (filterEstado === "activo" && usuario.activo) ||
      (filterEstado === "inactivo" && !usuario.activo);

    return matchSearch && matchRol && matchEstado;
  });

  // Estadísticas
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter((u) => u.activo).length,
    inactivos: usuarios.filter((u) => !u.activo).length,
    porRol: roles.map((rol) => ({
      nombre: rol.nombre,
      cantidad: usuarios.filter((u) => u.id_rol === rol.id_rol).length,
    })),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Moderno y Compacto */}
        <PageHeader
          title="Gestión de Usuarios"
          subtitle="Administra usuarios del sistema y sus permisos"
          icon={UserGroupIcon}
          gradientFrom="indigo-600"
          gradientTo="purple-600"
          badge="Administración"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={{
            "Total Usuarios": usuarios.length,
            Activos: usuarios.filter((u) => u.activo).length,
            Inactivos: usuarios.filter((u) => !u.activo).length,
          }}
          actions={
            <button
              onClick={abrirModalCrear}
              className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Crear Usuario</span>
            </button>
          }
        />

        {/* Mensajes */}
        {mensaje && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-6 py-4 rounded-xl">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Usuarios</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <UsersIcon className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Activos</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats.activos}
                </p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Inactivos</p>
                <p className="text-3xl font-bold text-red-400">
                  {stats.inactivos}
                </p>
              </div>
              <XCircleIcon className="w-12 h-12 text-red-400" />
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Roles</p>
                <p className="text-3xl font-bold text-purple-400">
                  {roles.length}
                </p>
              </div>
              <ShieldCheckIcon className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filtro por Rol */}
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filterRol}
                onChange={(e) => setFilterRol(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="">Todos los roles</option>
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activos</option>
                <option value="inactivo">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Teléfono
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Rol
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-400"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.id_usuario}
                      className="hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {usuario.imagen ? (
                            <img
                              src={`${API_BASE_URL}${usuario.imagen}`}
                              alt={usuario.nombre}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {usuario.nombre} {usuario.apellido}
                            </p>
                            <p className="text-gray-400 text-sm">
                              ID: {usuario.id_usuario}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                          {usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-300">
                          <PhoneIcon className="w-4 h-4 text-gray-400" />
                          {usuario.telefono || "No registrado"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getRolColor(
                            usuario.id_rol
                          )}`}
                        >
                          {getRolNombre(usuario.id_rol)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            handleCambiarEstado(
                              usuario.id_usuario,
                              usuario.activo
                            )
                          }
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                            usuario.activo
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {usuario.activo ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-4 h-4" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirModalEditar(usuario)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <PencilSquareIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => abrirModalPassword(usuario)}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                            title="Cambiar contraseña"
                          >
                            <KeyIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleEliminarUsuario(usuario.id_usuario)
                            }
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resultados */}
        <div className="text-center text-gray-400">
          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
        </div>
      </div>

      {/* Modal Crear/Editar Usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {modoEdicion ? "Editar Usuario" : "Crear Nuevo Usuario"}
            </h3>

            <form onSubmit={handleCrearUsuario} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-2">
                    Rol *
                  </label>
                  <select
                    name="id_rol"
                    value={formData.id_rol}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccionar rol</option>
                    {roles.map((rol) => (
                      <option key={rol.id_rol} value={rol.id_rol}>
                        {rol.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Password (solo al crear) */}
                {!modoEdicion && (
                  <div>
                    <label className="block text-gray-400 text-sm font-medium mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={!modoEdicion}
                      minLength="6"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {/* Estado */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded"
                  />
                  <label className="text-gray-400 text-sm font-medium">
                    Usuario activo
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  {modoEdicion ? "Actualizar" : "Crear Usuario"}
                </button>
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <KeyIcon className="w-7 h-7 text-yellow-400" />
              Cambiar Contraseña
            </h3>

            <form onSubmit={handleCambiarPassword} className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.nuevaPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      nuevaPassword: e.target.value,
                    })
                  }
                  required
                  minLength="6"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  value={passwordData.confirmarPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmarPassword: e.target.value,
                    })
                  }
                  required
                  minLength="6"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Confirma la contraseña"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-semibold hover:scale-105 transition-transform"
                >
                  Actualizar Contraseña
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      usuarioId: null,
                      nuevaPassword: "",
                      confirmarPassword: "",
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsuariosPage;
