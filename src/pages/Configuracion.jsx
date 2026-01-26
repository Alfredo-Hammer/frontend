import React, {useEffect, useState} from "react";
import {
  Cog6ToothIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import EditarEscuelaModal from "../components/EditarEscuelaModal";
import {Link} from "react-router-dom";

function Configuracion() {
  const [escuela, setEscuela] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  const token = localStorage.getItem("token");

  const canEditEscuela =
    userRole &&
    ["admin", "administrador", "director"].includes(userRole.toLowerCase());

  useEffect(() => {
    const fetchPerfilYEscuela = async () => {
      try {
        setLoading(true);
        setError("");

        const resPerfil = await api.get("/api/usuarios/perfil", {
          headers: {Authorization: `Bearer ${token}`},
        });

        const rol = resPerfil.data.usuario?.rol || resPerfil.data.rol;
        setUserRole(rol);

        const id_escuela = resPerfil.data.usuario?.id_escuela;
        if (id_escuela) {
          const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          setEscuela(escuelaRes.data);
        } else {
          setError("No se encontró una escuela activa asociada a tu usuario.");
        }
      } catch (err) {
        console.error("Error al cargar configuración:", err);
        setError("No se pudo cargar la configuración de la escuela.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPerfilYEscuela();
    }
  }, [token]);

  const handleEditarSuccess = async () => {
    // Re-cargar datos de la escuela después de una edición exitosa
    try {
      const resPerfil = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const id_escuela = resPerfil.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (err) {
      console.error("Error al recargar escuela tras edición:", err);
    }
  };

  const estadisticasEscuela = {
    codigo_escuela: {
      label: "Código de Escuela",
      value: escuela?.codigo_escuela || "-",
      color:
        "from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30",
    },
    codigo_establecimiento: {
      label: "Código de Establecimiento",
      value: escuela?.codigo_establecimiento || "-",
      color: "from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30",
    },
    nivel_educativo: {
      label: "Nivel Educativo",
      value: escuela?.nivel_educativo || "No especificado",
      color: "from-indigo-500/20 to-indigo-600/20 border border-indigo-500/30",
    },
    municipio: {
      label: "Municipio",
      value: escuela?.municipio || "No especificado",
      color: "from-amber-500/20 to-amber-600/20 border border-amber-500/30",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* --- Header y sección de Identidad de la escuela --- */}

        <PageHeader
          title="Configuración del Sistema"
          subtitle="Administra la identidad de tu escuela y revisa los parámetros clave del sistema SaaS."
          icon={Cog6ToothIcon}
          gradientFrom="emerald-500"
          gradientTo="cyan-600"
          badge="Configuración SaaS por Escuela"
          schoolLogo={
            escuela?.logo ? `${api.defaults.baseURL}${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={estadisticasEscuela}
          actions={
            canEditEscuela && (
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 bg-white text-emerald-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center space-x-2"
              >
                <BuildingLibraryIcon className="w-5 h-5" />
                <span>Editar datos de la escuela</span>
              </button>
            )
          }
        />

        {error && (
          <div className="mb-6 max-w-3xl mx-auto bg-red-900/40 border border-red-500/60 text-red-100 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal: Identidad de la escuela */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-900/20 border border-emerald-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <BuildingLibraryIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Identidad de la Escuela
                    </h2>
                    <p className="text-sm text-gray-300/80">
                      Información base que se usa en reportes, boletas,
                      certificados y encabezados del sistema.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Nombre de la escuela</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.nombre || "Sin definir"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Nombre del director</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.nombre_director || "Sin definir"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Dirección</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.direccion || "Sin definir"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Teléfono</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.telefono || "No registrado"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Correo Electrónico</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.email || "No registrado"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Nivel educativo</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.nivel_educativo || "No especificado"}
                    </dd>
                  </div>
                  <div className="bg-gray-800/70 rounded-xl p-4 border border-gray-700/80">
                    <dt className="text-gray-400">Municipio</dt>
                    <dd className="text-white font-medium mt-1">
                      {escuela?.municipio || "No especificado"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 text-xs text-gray-400">
                  Cualquier cambio que realices aquí se aplicará solo a tu
                  escuela activa, respetando el modelo multi-tenant del sistema.
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-900/20 border border-cyan-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Reglas de Asistencia y Horarios
                    </h2>
                    <p className="text-sm text-gray-300/80">
                      Resumen de cómo el sistema aplica las políticas de
                      asistencia por escuela.
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-gray-300/90 list-disc list-inside">
                  <li>
                    La asistencia solo puede registrarse o editarse durante el
                    horario programado de cada clase.
                  </li>
                  <li>
                    Todas las validaciones se realizan usando la carga académica
                    y el horario estructurado de tu escuela.
                  </li>
                  <li>
                    Cada registro de asistencia se asocia siempre a una sección,
                    materia y estudiante de esta escuela.
                  </li>
                </ul>

                <p className="mt-4 text-xs text-gray-400">
                  Estos parámetros se gestionan desde los módulos de Carga
                  Académica, Horarios y Asistencia. La configuración aquí es
                  solo descriptiva.
                </p>
              </div>
            </div>

            {/* Columna lateral: Ciclos escolares (primera card), Seguridad SaaS y contexto */}
            <div className="space-y-6">
              {/* Ciclos escolares: solo un enlace (sin card grande) */}
              <div className="bg-gray-900/70 border border-gray-700/80 rounded-2xl shadow-lg p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Ciclos Escolares
                    </h2>
                    <p className="text-xs text-gray-300/80">
                      Ir a la página de gestión.
                    </p>
                  </div>
                  <Link
                    to="/ciclosescolares"
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold text-sm"
                  >
                    Abrir
                  </Link>
                </div>
              </div>
              {/* ...resto de las cards laterales... */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-900/20 border border-indigo-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Seguridad y Multi-Tenencia
                    </h2>
                    <p className="text-xs text-gray-300/90">
                      Tu escuela está aislada de otras instalaciones del
                      sistema.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-xs text-gray-300/90 list-disc list-inside">
                  <li>
                    Todas las operaciones se filtran por el{" "}
                    <span className="font-semibold">id_escuela</span> de tu
                    usuario.
                  </li>
                  <li>
                    Los roles y accesos se definen por la tabla{" "}
                    <span className="font-mono">usuarios_escuelas</span>.
                  </li>
                  <li>
                    No es posible acceder ni modificar datos de otras escuelas
                    desde esta instancia.
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-amber-900/20 border border-amber-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <GlobeAltIcon className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Contexto Institucional
                    </h2>
                    <p className="text-xs text-gray-300/90">
                      Datos que se usan para reportes oficiales y MINED.
                    </p>
                  </div>
                </div>
                <dl className="space-y-2 text-xs text-gray-300/90">
                  <div>
                    <dt className="text-gray-400">Nombre oficial</dt>
                    <dd className="text-white font-medium">
                      {escuela?.nombre || "Sin definir"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400">Códigos oficiales</dt>
                    <dd className="text-white font-medium">
                      {escuela?.codigo_escuela || "-"} /{" "}
                      {escuela?.codigo_establecimiento || "-"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-sky-900/20 border border-sky-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-sky-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      Quién puede ver esta pantalla
                    </h2>
                    <p className="text-xs text-gray-300/90">
                      Ajustado a la matriz de roles del sistema.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-300/90">
                  Solo usuarios con rol{" "}
                  <span className="font-semibold">Administrador</span> o{" "}
                  <span className="font-semibold">Director</span> pueden acceder
                  a esta sección. Solo el Administrador puede modificar los
                  datos de la escuela.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {escuela && (
        <EditarEscuelaModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          escuela={escuela}
          onSuccess={handleEditarSuccess}
        />
      )}
    </div>
  );
}

export default Configuracion;
