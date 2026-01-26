import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

// Componente Switch para el Estado Activo/Inactivo
const ToggleSwitch = ({enabled, onChange, isLoading}) => (
  <button
    type="button"
    onClick={onChange}
    disabled={isLoading}
    className={`${
      enabled ? "bg-green-500" : "bg-gray-600"
    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50`}
  >
    <span
      className={`${
        enabled ? "translate-x-5" : "translate-x-0"
      } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
    />
  </button>
);

function UsuariosPage() {
  // ========== ESTADOS ==========
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);

  // UI & Filtros
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [filterEstado, setFilterEstado] = useState(""); // "" | "activos" | "bloqueados"

  // Modales
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [showCredencialesModal, setShowCredencialesModal] = useState(false);
  const [credencialesTemp, setCredencialesTemp] = useState(null); // {email, password, expira?}
  const [credencialesLoading, setCredencialesLoading] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    id_rol: "",
    email_verificado: false, // Solo visible para admins en edición
  });

  const token = localStorage.getItem("token");

  // ========== CARGA DE DATOS ==========
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resUsuarios, resRoles] = await Promise.all([
        api.get("/api/usuarios", {headers: {Authorization: `Bearer ${token}`}}),
        api.get("/api/roles", {headers: {Authorization: `Bearer ${token}`}}),
      ]);
      setUsuarios(resUsuarios.data);
      setRoles(resRoles.data);
    } catch (error) {
      console.error(error);
      showToast("Error cargando usuarios", "error");
    } finally {
      setLoading(false);
    }
  };

  // ========== ACCIONES DE ESTADO (La Torre de Control) ==========

  const handleToggleEstado = async (id, estadoActual) => {
    try {
      // Cambio Optimista (UI primero)
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === id ? {...u, activo: !estadoActual} : u
        )
      );

      await api.put(
        `/api/usuarios/${id}/estado`,
        {activo: !estadoActual},
        {headers: {Authorization: `Bearer ${token}`}}
      );

      showToast(
        `Acceso ${!estadoActual ? "ACTIVADO" : "BLOQUEADO"} correctamente`,
        "success"
      );
    } catch (error) {
      // Revertir si falla
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id_usuario === id ? {...u, activo: estadoActual} : u
        )
      );
      showToast("No se pudo cambiar el estado", "error");
    }
  };

  // ========== CRUD USUARIOS ==========

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modoEdicion) {
        await api.put(`/api/usuarios/${usuarioEditar.id_usuario}`, formData, {
          headers: {Authorization: `Bearer ${token}`},
        });
        showToast("Usuario actualizado correctamente", "success");
      } else {
        // En creación NO enviamos password, el backend la genera
        const res = await api.post("/api/usuarios/register", formData, {
          headers: {Authorization: `Bearer ${token}`},
        });

        const emailEnviado = res.data?.emailEnviado;
        const credenciales = res.data?.credencialesTemporales;

        if (emailEnviado) {
          showToast(
            "Usuario creado. Credenciales enviadas al correo.",
            "success"
          );
        } else {
          showToast(
            "Usuario creado, pero NO se pudo enviar el email. Puedes ver las credenciales temporales.",
            "error"
          );
        }

        if (credenciales?.email && credenciales?.password) {
          setCredencialesTemp(credenciales);
          setShowCredencialesModal(true);
        }
      }
      cargarDatos();
      cerrarModal();
    } catch (error) {
      showToast(error.response?.data?.message || "Error al guardar", "error");
    }
  };

  const handleVerCredencialesTemporales = async (idUsuario) => {
    try {
      setCredencialesLoading(true);
      const res = await api.get(
        `/api/usuarios/${idUsuario}/credenciales-temporales`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setCredencialesTemp(res.data);
      setShowCredencialesModal(true);
    } catch (error) {
      showToast(
        error.response?.data?.message ||
          "No se pudieron obtener las credenciales temporales",
        "error"
      );
    } finally {
      setCredencialesLoading(false);
    }
  };

  // ========== UTILIDADES UI ==========

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast({...toast, show: false}), 3000);
  };

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setModoEdicion(true);
      setUsuarioEditar(usuario);
      setFormData({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        telefono: usuario.telefono || "",
        id_rol: usuario.id_rol,
        email_verificado: usuario.email_verificado,
      });
    } else {
      setModoEdicion(false);
      setUsuarioEditar(null);
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        id_rol: "",
        email_verificado: false,
      });
    }
    setShowModal(true);
  };

  const cerrarModal = () => setShowModal(false);

  // Filtrado
  const usuariosFiltrados = usuarios.filter((u) => {
    const textoBusqueda =
      `${u.nombre} ${u.apellido} ${u.email} ${u.id_usuario}`.toLowerCase();
    const matchSearch = textoBusqueda.includes(searchTerm.toLowerCase());
    const matchRol = filterRol ? u.id_rol === parseInt(filterRol) : true;
    const matchEstado = !filterEstado
      ? true
      : filterEstado === "activos"
      ? u.activo === true
      : u.activo === false;
    return matchSearch && matchRol && matchEstado;
  });

  const headerStats = [
    {
      label: "Total Usuarios",
      value: usuarios.length,
      color: "from-blue-500 to-indigo-600",
      icon: UserGroupIcon,
    },
    {
      label: "Usuarios Activos",
      value: usuarios.filter((u) => u.activo).length,
      color: "from-emerald-500 to-teal-600",
      icon: CheckBadgeIcon,
    },
    {
      label: "Acceso Bloqueado",
      value: usuarios.filter((u) => !u.activo).length,
      color: "from-red-500 to-rose-600",
      icon: ShieldCheckIcon,
    },
    {
      label: "Roles Definidos",
      value: roles.length,
      color: "from-purple-500 to-violet-600",
      icon: FunnelIcon,
    },
  ];

  // ========== RENDERIZADO ==========
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      <PageHeader
        title="Control de Accesos y Usuarios"
        subtitle="Gestione quién puede entrar al sistema. Use el interruptor para bloquear/desbloquear acceso inmediatamente."
        icon={UserGroupIcon}
        stats={headerStats}
      />

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-center bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtro Rol */}
        <div className="relative w-full md:w-56">
          <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <select
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white appearance-none"
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
          >
            <option value="">Todos los Roles</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Estado (Activo / Bloqueado) */}
        <div className="relative w-full md:w-56">
          <FunnelIcon className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <select
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white appearance-none"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="bloqueados">Solo bloqueados</option>
          </select>
        </div>

        {/* Botón Nuevo */}
        <button
          onClick={() => abrirModal()}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/20"
        >
          <PlusIcon className="h-5 w-5" />
          Nuevo Usuario
        </button>
      </div>

      {/* Resumen de resultados */}
      <div className="mb-4 text-xs text-gray-400 flex justify-between items-center">
        <span>
          Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
        </span>
      </div>

      {/* --- TABLA PRINCIPAL --- */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-700">
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">
                  Contacto & Verificación
                </th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold text-center">
                  Acceso al Sistema
                </th>
                <th className="px-6 py-4 font-semibold text-right">Editar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Cargando directorio...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.id_usuario}
                    className="hover:bg-gray-700/30 transition-colors group"
                  >
                    {/* 1. Usuario */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {usuario.foto_url ? (
                          <img
                            src={usuario.foto_url}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover border border-gray-600"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
                            <span className="font-bold text-lg">
                              {usuario.nombre.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {usuario.id_usuario}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. Contacto & Verificación */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-300">
                            {usuario.email}
                          </span>

                          {/* BADGE DE VERIFICACIÓN */}
                          {usuario.email_verificado ? (
                            <div className="group/tooltip relative">
                              <CheckBadgeIcon className="h-5 w-5 text-cyan-400" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                                Verificado
                              </span>
                            </div>
                          ) : (
                            <div className="group/tooltip relative">
                              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-black text-white rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
                                Pendiente
                              </span>
                            </div>
                          )}
                        </div>
                        {usuario.telefono && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <PhoneIcon className="h-3 w-3" />
                            {usuario.telefono}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* 3. Rol */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${
                          usuario.id_rol === 1
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : usuario.id_rol === 2
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        <ShieldCheckIcon className="h-3 w-3" />
                        {usuario.rol || "Usuario"}
                      </span>
                    </td>

                    {/* 4. SWITCH DE ESTADO (Torre de Control) */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <ToggleSwitch
                          enabled={usuario.activo}
                          onChange={() =>
                            handleToggleEstado(
                              usuario.id_usuario,
                              usuario.activo
                            )
                          }
                        />
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${
                            usuario.activo ? "text-green-500" : "text-gray-500"
                          }`}
                        >
                          {usuario.activo ? "Permitido" : "Bloqueado"}
                        </span>
                      </div>
                    </td>

                    {/* 5. Acciones */}
                    <td className="px-6 py-4 text-right">
                      {!usuario.email_verificado && (
                        <button
                          onClick={() =>
                            handleVerCredencialesTemporales(usuario.id_usuario)
                          }
                          disabled={credencialesLoading}
                          className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 mr-2 rounded-lg border border-amber-500/20 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                        >
                          Credenciales
                        </button>
                      )}
                      <button
                        onClick={() => abrirModal(usuario)}
                        className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL DE EDICIÓN --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden transform transition-all">
            {/* Header Modal */}
            <div className="px-6 py-5 border-b border-gray-700 bg-gray-900/50">
              <h3 className="text-xl font-bold text-white">
                {modoEdicion ? "Editar Datos de Acceso" : "Nuevo Usuario"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Nombre
                  </label>
                  <input
                    required
                    name="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({...formData, nombre: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Apellido
                  </label>
                  <input
                    required
                    name="apellido"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({...formData, apellido: e.target.value})
                    }
                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Correo Electrónico (Login)
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({...formData, email: e.target.value})
                    }
                    className="w-full pl-9 bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              {/* OVERRIDE DE VERIFICACIÓN (Solo visible al editar) */}
              {modoEdicion && (
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-300">
                      Estado de Verificación
                    </span>
                    <p className="text-xs text-gray-500">
                      Marcar si validaste el correo manualmente.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.email_verificado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email_verificado: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Rol de Sistema
                </label>
                <select
                  required
                  name="id_rol"
                  value={formData.id_rol}
                  onChange={(e) =>
                    setFormData({...formData, id_rol: e.target.value})
                  }
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white outline-none appearance-none"
                >
                  <option value="">Seleccione un rol...</option>
                  {roles.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* NOTA SOBRE CONTRASEÑA */}
              {!modoEdicion && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 p-3 rounded-lg text-xs text-indigo-200 flex gap-2">
                  <ShieldCheckIcon className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold block mb-1">
                      Auto-provisionamiento de Credenciales
                    </span>
                    El sistema generará una contraseña segura automáticamente y
                    la enviará al correo electrónico ingresado junto con las
                    instrucciones de acceso.
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {modoEdicion ? "Guardar Cambios" : "Crear y Enviar Accesos"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: CREDENCIALES TEMPORALES --- */}
      {showCredencialesModal && credencialesTemp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-700 bg-gray-900/50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">
                Credenciales temporales
              </h3>
              <button
                onClick={() => {
                  setShowCredencialesModal(false);
                  setCredencialesTemp(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Usuario (email)</p>
                <p className="text-white break-all">{credencialesTemp.email}</p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">
                  Contraseña temporal
                </p>
                <p className="text-white break-all font-mono">
                  {credencialesTemp.password}
                </p>
              </div>

              <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-300">
                  Estas credenciales son temporales. Se recomienda cambiar la
                  contraseña tras el primer acceso.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowCredencialesModal(false);
                    setCredencialesTemp(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
}

export default UsuariosPage;
