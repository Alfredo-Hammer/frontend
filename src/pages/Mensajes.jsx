import React, {useState, useEffect, useRef} from "react";
import axios from "axios";
import {
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  XMarkIcon,
  UserCircleIcon,
  FunnelIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {ChatBubbleLeftRightIcon} from "@heroicons/react/24/solid";
import Loader from "../components/Loader";
import PageHeader from "../components/PageHeader";
import {useMensajes} from "../context/MensajesContext";
import Toast from "../components/Toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const Mensajes = () => {
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarNuevaConversacion, setMostrarNuevaConversacion] =
    useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]); // Todos los usuarios de la escuela
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [mensajeInicial, setMensajeInicial] = useState("");
  const [busquedaContacto, setBusquedaContacto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos, noLeidos, leidos
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [escuelaInfo, setEscuelaInfo] = useState(null);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const mensajesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const {cargarContador} = useMensajes();

  useEffect(() => {
    // Cargar usuario actual
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUsuarioActual(JSON.parse(userStr));
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }

    cargarConversaciones();
    cargarTodosUsuarios();
    cargarInfoEscuela();
  }, []);

  // Actualizar actividad del usuario para mostrar estado en línea
  useEffect(() => {
    const actualizarActividad = async () => {
      try {
        await axios.put(
          `${API_URL}/mensajes/actividad`,
          {},
          {headers: {Authorization: `Bearer ${token}`}}
        );
      } catch (error) {
        console.error("Error al actualizar actividad:", error);
      }
    };

    // Actualizar inmediatamente
    actualizarActividad();

    // Actualizar cada 2 minutos
    const interval = setInterval(actualizarActividad, 120000);

    return () => clearInterval(interval);
  }, []);

  const cargarInfoEscuela = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.id_escuela) {
        const response = await axios.get(
          `${API_URL}/escuelas/${user.id_escuela}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        setEscuelaInfo(response.data.data);
      }
    } catch (error) {
      console.error("Error al cargar info escuela:", error);
    }
  };

  useEffect(() => {
    if (conversacionActiva && conversacionActiva.id_conversacion) {
      cargarMensajes(conversacionActiva.id_conversacion);
    }
  }, [conversacionActiva]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    mensajesEndRef.current?.scrollIntoView({behavior: "smooth"});
  };

  const cargarConversaciones = async () => {
    try {
      const response = await axios.get(`${API_URL}/mensajes/conversaciones`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setConversaciones(response.data.data);
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    }
  };

  const cargarMensajes = async (idConversacion) => {
    try {
      const response = await axios.get(
        `${API_URL}/mensajes/${idConversacion}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setMensajes(response.data.data);

      // Actualizar contador después de marcar como leídos
      cargarContador();
    } catch (error) {
      console.error("Error al cargar mensajes:", error);
    }
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !conversacionActiva) return;

    setEnviando(true);
    try {
      await axios.post(
        `${API_URL}/mensajes`,
        {
          id_conversacion: conversacionActiva.id_conversacion,
          mensaje: nuevoMensaje,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      setNuevoMensaje("");
      cargarMensajes(conversacionActiva.id_conversacion);
      cargarConversaciones();

      // Actualizar contador después de enviar mensaje
      cargarContador();
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setEnviando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const response = await axios.get(`${API_URL}/mensajes/usuarios`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUsuarios(response.data.data);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
    }
  };

  const cargarTodosUsuarios = async () => {
    console.log("🚀 INICIO cargarTodosUsuarios");
    try {
      console.log("🔍 Cargando usuarios...");
      const userFromStorage = localStorage.getItem("user");
      console.log("Usuario del localStorage (raw):", userFromStorage);
      const parsedUser = JSON.parse(userFromStorage);
      console.log("Usuario parseado:", parsedUser);
      console.log(
        "Token:",
        token ? `Existe (length: ${token.length})` : "No existe"
      );
      console.log("API_URL:", API_URL);

      const url = `${API_URL}/mensajes/usuarios`;
      console.log("🌐 URL completa:", url);

      const response = await axios.get(url, {
        headers: {Authorization: `Bearer ${token}`},
      });

      console.log("✅ Respuesta de usuarios:", response.data);
      console.log("📊 Cantidad de usuarios:", response.data.data?.length || 0);
      console.log("📋 Usuarios recibidos:", response.data.data);

      setTodosUsuarios(response.data.data || []);
    } catch (error) {
      console.error("❌ ERROR COMPLETO al cargar todos los usuarios:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error config:", error.config);
      setTodosUsuarios([]);
    } finally {
      console.log("🏁 FIN cargarTodosUsuarios");
      setLoading(false);
    }
  };

  const crearNuevaConversacion = async () => {
    if (!usuarioSeleccionado || !mensajeInicial.trim()) {
      showToast("Selecciona un usuario y escribe un mensaje", "warning");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/mensajes/conversacion`,
        {
          participantes: [usuarioSeleccionado.id_usuario],
          titulo: `Chat con ${usuarioSeleccionado.nombre} ${usuarioSeleccionado.apellido}`,
          tipo: "directa",
          mensaje_inicial: mensajeInicial,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      setMostrarNuevaConversacion(false);
      setUsuarioSeleccionado(null);
      setMensajeInicial("");
      cargarConversaciones();

      // Abrir conversación recién creada
      const nuevaConv = conversaciones.find(
        (c) => c.id_conversacion === response.data.data.id_conversacion
      );
      if (nuevaConv) setConversacionActiva(nuevaConv);
    } catch (error) {
      console.error("Error al crear conversación:", error);
    }
  };

  // Combinar usuarios con conversaciones existentes
  const obtenerListaCompleta = () => {
    console.log("📋 obtenerListaCompleta llamado");
    console.log("👥 todosUsuarios:", todosUsuarios);
    console.log("💬 conversaciones:", conversaciones);

    // Crear mapa de conversaciones por id_usuario del otro participante
    const conversacionesPorUsuario = {};
    conversaciones.forEach((conv) => {
      const otroParticipante = conv.otros_participantes?.[0];
      if (otroParticipante) {
        // Usar id_usuario para usuarios normales o id_estudiante para padres
        const userId =
          otroParticipante.id_usuario || otroParticipante.id_estudiante;
        if (userId) {
          conversacionesPorUsuario[userId] = conv;
        }
      }
    });

    console.log("🗺️ Conversaciones mapeadas:", conversacionesPorUsuario);

    // Combinar usuarios con sus conversaciones (sin duplicados)
    const listaCompleta = todosUsuarios
      .filter((usuario) => usuario.id_usuario) // Filtrar usuarios sin ID
      .map((usuario) => {
        const conversacionExistente =
          conversacionesPorUsuario[usuario.id_usuario];

        if (conversacionExistente) {
          // Usuario con conversación existente
          return {
            ...conversacionExistente,
            tipo: "conversacion",
            usuario_info: usuario,
          };
        } else {
          // Usuario sin conversación
          return {
            id_usuario: usuario.id_usuario,
            tipo: "usuario",
            titulo: `${usuario.nombre} ${usuario.apellido || ""}`,
            otros_participantes: [usuario],
            usuario_info: usuario,
            no_leidos: 0,
          };
        }
      });

    console.log("📝 Lista completa generada:", listaCompleta);
    return listaCompleta;
  };

  const conversacionesFiltradas = obtenerListaCompleta().filter((item) => {
    // Filtro por búsqueda
    if (busqueda) {
      const titulo = item.titulo?.toLowerCase() || "";
      const nombreUsuario = `${item.usuario_info?.nombre || ""} ${
        item.usuario_info?.apellido || ""
      }`.toLowerCase();
      const ultimoMensaje = item.ultimo_mensaje?.mensaje?.toLowerCase() || "";

      if (
        !titulo.includes(busqueda.toLowerCase()) &&
        !nombreUsuario.includes(busqueda.toLowerCase()) &&
        !ultimoMensaje.includes(busqueda.toLowerCase())
      ) {
        return false;
      }
    }

    // Filtro por estado (solo aplica a conversaciones existentes)
    if (item.tipo === "conversacion") {
      if (filtroEstado === "noLeidos" && item.no_leidos === 0) {
        return false;
      }
      if (filtroEstado === "leidos" && item.no_leidos > 0) {
        return false;
      }
    } else if (filtroEstado !== "todos") {
      // Si está filtrando por leídos/no leídos, no mostrar usuarios sin conversación
      return false;
    }

    return true;
  });

  if (loading) return <Loader />;

  // Componente Badge de Estado en Línea
  const EstadoEnLinea = ({enLinea, size = "small"}) => {
    const sizeClasses = {
      small: "h-3 w-3",
      medium: "h-4 w-4",
      large: "h-5 w-5",
    };

    if (!enLinea) return null;

    return (
      <span
        className={`absolute bottom-0 right-0 ${sizeClasses[size]} bg-green-500 border-2 border-slate-900 rounded-full animate-pulse`}
        title="En línea"
      ></span>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header Mejorado de Mensajería */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo y Título */}
            <div className="flex items-center gap-4">
              {escuelaInfo?.logo ? (
                <img
                  src={`${API_URL.replace("/api", "")}${escuelaInfo.logo}`}
                  alt="Logo"
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-lg"
                />
              ) : (
                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Centro de Mensajes
                  <span className="text-sm font-normal text-cyan-400">
                    {escuelaInfo?.nombre_escuela || ""}
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Comunicación en tiempo real • {todosUsuarios.length} usuarios
                  disponibles
                </p>
              </div>
            </div>

            {/* Estadísticas y Acciones */}
            <div className="flex items-center gap-3">
              {/* Estadísticas */}
              <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                    <span className="text-lg font-bold">
                      {conversaciones.filter((c) => c.no_leidos > 0).length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">No leídos</p>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="text-lg font-bold">
                      {conversaciones.filter((c) => c.no_leidos === 0).length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Leídos</p>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-blue-400">
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-lg font-bold">
                      {todosUsuarios.length}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Usuarios</p>
                </div>
              </div>

              {/* Filtro */}
              <div className="relative">
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer"
                >
                  <option value="todos">Todos</option>
                  <option value="noLeidos">No leídos</option>
                  <option value="leidos">Leídos</option>
                </select>
                <FunnelIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>

              {/* Botón Info */}
              <button
                onClick={() => setMostrarInfo(!mostrarInfo)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Información"
              >
                <InformationCircleIcon className="h-6 w-6" />
              </button>

              {/* Botón Configuración */}
              <button
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Configuración"
              >
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Panel de Información (expandible) */}
          {mostrarInfo && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Usuario Actual</p>
                  <p className="text-white font-semibold mt-1">
                    {JSON.parse(localStorage.getItem("user"))?.nombre ||
                      "Usuario"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Rol</p>
                  <p className="text-white font-semibold mt-1 capitalize">
                    {JSON.parse(localStorage.getItem("user"))?.rol || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Última Actualización</p>
                  <p className="text-white font-semibold mt-1">
                    {new Date().toLocaleTimeString("es-SV", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar conversaciones */}
        <div className="w-1/3 bg-slate-900 border-r border-slate-700 flex flex-col">
          {/* Header sidebar */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button
                onClick={() => {
                  setMostrarNuevaConversacion(true);
                  cargarUsuarios();
                }}
                className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition"
              >
                <PlusCircleIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>

          {/* Lista conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <UserCircleIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg font-semibold">
                  No hay usuarios disponibles
                </p>
                <p className="text-sm mt-2">
                  {busqueda
                    ? "No se encontraron resultados"
                    : "No hay usuarios en la escuela"}
                </p>
              </div>
            ) : (
              conversacionesFiltradas.map((item) => {
                const usuario =
                  item.otros_participantes?.[0] || item.usuario_info;
                const esConversacion = item.tipo === "conversacion";

                // Determinar si este item está activo
                let estaActivo = false;
                if (conversacionActiva) {
                  if (esConversacion && conversacionActiva.id_conversacion) {
                    // Comparar por id_conversacion si ambos son conversaciones
                    estaActivo =
                      conversacionActiva.id_conversacion ===
                      item.id_conversacion;
                  } else if (!esConversacion && item.id_usuario) {
                    // Comparar por id_usuario si es un usuario sin conversación
                    estaActivo =
                      conversacionActiva.otros_participantes?.[0]
                        ?.id_usuario === item.id_usuario;
                  }
                }

                return (
                  <div
                    key={
                      esConversacion
                        ? `conv-${item.id_conversacion}`
                        : `user-${item.id_usuario}`
                    }
                    onClick={async () => {
                      if (esConversacion) {
                        setConversacionActiva(item);
                      } else {
                        // Iniciar nueva conversación automáticamente
                        try {
                          const response = await axios.post(
                            `${API_URL}/mensajes/conversacion`,
                            {
                              participantes: [item.id_usuario],
                              titulo: `Chat con ${usuario.nombre} ${usuario.apellido}`,
                              tipo: "directa",
                            },
                            {headers: {Authorization: `Bearer ${token}`}}
                          );

                          // Recargar conversaciones
                          await cargarConversaciones();

                          // Buscar la conversación recién creada en la lista actualizada
                          const conversacionesActualizadas = await axios.get(
                            `${API_URL}/mensajes/conversaciones`,
                            {headers: {Authorization: `Bearer ${token}`}}
                          );

                          const nuevaConv =
                            conversacionesActualizadas.data.data.find(
                              (c) =>
                                c.id_conversacion ===
                                response.data.data.id_conversacion
                            );

                          console.log("🔍 Conversación encontrada:", nuevaConv);
                          console.log(
                            "👥 Otros participantes:",
                            nuevaConv?.otros_participantes
                          );

                          if (nuevaConv) {
                            setConversacionActiva(nuevaConv);
                          } else {
                            console.log(
                              "⚠️ No se encontró la conversación, usando fallback"
                            );
                            // Fallback: crear objeto temporal con datos mínimos
                            setConversacionActiva({
                              id_conversacion:
                                response.data.data.id_conversacion,
                              titulo: `Chat con ${usuario.nombre} ${usuario.apellido}`,
                              otros_participantes: [usuario],
                              no_leidos: 0,
                              tipo: "conversacion",
                            });
                          }
                        } catch (error) {
                          console.error("Error al crear conversación:", error);
                          showToast(
                            "Error al iniciar la conversación",
                            "error"
                          );
                        }
                      }
                    }}
                    className={`p-4 border-b border-slate-700 cursor-pointer transition ${
                      estaActivo ? "bg-slate-800" : "hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 relative">
                        {usuario?.imagen ? (
                          <img
                            src={`${API_URL.replace("/api", "")}${
                              usuario.imagen
                            }`}
                            alt=""
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-12 w-12 text-slate-400" />
                        )}
                        {/* Badge de estado en línea */}
                        <EstadoEnLinea
                          enLinea={usuario?.en_linea}
                          size="medium"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white truncate">
                              {usuario?.nombre} {usuario?.apellido}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {usuario?.rol}
                            </p>
                          </div>
                          {esConversacion && item.no_leidos > 0 && (
                            <span className="ml-2 px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                              {item.no_leidos}
                            </span>
                          )}
                        </div>
                        {esConversacion ? (
                          <>
                            <p className="text-sm text-slate-400 truncate mt-1">
                              {item.ultimo_mensaje?.mensaje || "Sin mensajes"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {item.ultimo_mensaje?.fecha
                                ? new Date(
                                    item.ultimo_mensaje.fecha
                                  ).toLocaleString("es-SV", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : ""}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-slate-500 italic mt-1">
                            Iniciar conversación
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel mensajes */}
        <div className="flex-1 flex flex-col">
          {conversacionActiva ? (
            <>
              {/* Header chat */}
              <div className="p-4 bg-slate-900 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conversacionActiva.otros_participantes?.[0]?.imagen ? (
                      <img
                        src={`${API_URL.replace("/api", "")}${
                          conversacionActiva.otros_participantes[0].imagen
                        }`}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-10 w-10 text-slate-400" />
                    )}
                    {/* Badge de estado en línea */}
                    <EstadoEnLinea
                      enLinea={
                        conversacionActiva.otros_participantes?.[0]?.en_linea
                      }
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-white">
                        {conversacionActiva.titulo ||
                          (conversacionActiva.otros_participantes &&
                          conversacionActiva.otros_participantes.length > 0
                            ? conversacionActiva.otros_participantes
                                .map((p) => `${p.nombre} ${p.apellido}`)
                                .join(", ")
                            : "Chat")}
                      </h2>
                      {conversacionActiva.otros_participantes?.[0]
                        ?.en_linea && (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                          En línea
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {conversacionActiva.otros_participantes &&
                      conversacionActiva.otros_participantes.length > 0
                        ? conversacionActiva.otros_participantes
                            .map((p) => p.rol)
                            .join(", ")
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {mensajes.map((msg) => {
                  const esMio = usuarioActual
                    ? msg.id_remitente === usuarioActual.id_usuario
                    : false;

                  return (
                    <div
                      key={msg.id_mensaje}
                      className={`flex ${
                        esMio ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-md ${esMio ? "order-2" : "order-1"}`}
                      >
                        {!esMio && (
                          <p className="text-xs text-slate-400 mb-1 ml-2">
                            {msg.nombre} {msg.apellido}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            esMio
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-800 text-slate-100"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">
                            {msg.mensaje}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 ml-2">
                          {new Date(msg.fecha_envio).toLocaleTimeString(
                            "es-SV",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                          {msg.editado && " (editado)"}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={mensajesEndRef} />
              </div>

              {/* Input mensaje */}
              <form
                onSubmit={enviarMensaje}
                className="p-4 bg-slate-900 border-t border-slate-700"
              >
                <div className="flex gap-2">
                  <textarea
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        enviarMensaje(e);
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows="2"
                    className="flex-1 px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={enviando || !nuevoMensaje.trim()}
                    className="px-6 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition"
                  >
                    <PaperAirplaneIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-lg">Selecciona una conversación</p>
                <p className="text-sm mt-2">o inicia una nueva</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nueva conversación */}
      {mostrarNuevaConversacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                Nueva Conversación
              </h3>
              <button
                onClick={() => {
                  setMostrarNuevaConversacion(false);
                  setUsuarioSeleccionado(null);
                  setMensajeInicial("");
                  setBusquedaContacto("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Buscador de contactos */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Buscar contacto
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email..."
                    value={busquedaContacto}
                    onChange={(e) => setBusquedaContacto(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Seleccionar contacto
                </label>
                <select
                  value={usuarioSeleccionado?.id_usuario || ""}
                  onChange={(e) => {
                    const usuario = usuarios.find(
                      (u) => u.id_usuario === parseInt(e.target.value)
                    );
                    setUsuarioSeleccionado(usuario);
                  }}
                  className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">-- Seleccionar --</option>

                  {/* Usuarios del sistema filtrados */}
                  {usuarios.filter(
                    (u) =>
                      u.tipo_contacto === "usuario" &&
                      (!busquedaContacto ||
                        u.nombre
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.apellido
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.email
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.rol
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()))
                  ).length > 0 && (
                    <optgroup label="📋 Usuarios del Sistema">
                      {usuarios
                        .filter(
                          (u) =>
                            u.tipo_contacto === "usuario" &&
                            (!busquedaContacto ||
                              u.nombre
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.apellido
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.email
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.rol
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()))
                        )
                        .map((u) => (
                          <option
                            key={`usuario-${u.id_usuario}`}
                            value={u.id_usuario}
                          >
                            {u.en_linea ? "🟢 " : ""}
                            {u.nombre} {u.apellido} - {u.rol}
                          </option>
                        ))}
                    </optgroup>
                  )}

                  {/* Padres de familia filtrados */}
                  {usuarios.filter(
                    (u) =>
                      u.tipo_contacto === "padre" &&
                      (!busquedaContacto ||
                        u.nombre
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.apellido
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.email
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()) ||
                        u.nombre_estudiante
                          .toLowerCase()
                          .includes(busquedaContacto.toLowerCase()))
                  ).length > 0 && (
                    <optgroup label="👨‍👩‍👧 Padres de Familia">
                      {usuarios
                        .filter(
                          (u) =>
                            u.tipo_contacto === "padre" &&
                            (!busquedaContacto ||
                              u.nombre
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.apellido
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.email
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()) ||
                              u.nombre_estudiante
                                .toLowerCase()
                                .includes(busquedaContacto.toLowerCase()))
                        )
                        .map((u) => (
                          <option
                            key={`padre-${u.id_usuario}`}
                            value={u.id_usuario}
                          >
                            {u.nombre} {u.apellido} (Padre de{" "}
                            {u.nombre_estudiante})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>

                {/* Información adicional del contacto seleccionado */}
                {usuarioSeleccionado && (
                  <div className="mt-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {usuarioSeleccionado.tipo_contacto === "usuario" && (
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              usuarioSeleccionado.en_linea
                                ? "bg-green-500/20 border-2 border-green-500"
                                : "bg-slate-700"
                            }`}
                          >
                            <UserCircleIcon
                              className={`h-8 w-8 ${
                                usuarioSeleccionado.en_linea
                                  ? "text-green-400"
                                  : "text-slate-400"
                              }`}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-300 font-semibold">
                            {usuarioSeleccionado.nombre}{" "}
                            {usuarioSeleccionado.apellido}
                          </p>
                          {usuarioSeleccionado.tipo_contacto === "usuario" &&
                            usuarioSeleccionado.en_linea && (
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                                En línea
                              </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold">Email:</span>{" "}
                          {usuarioSeleccionado.email}
                        </p>
                        {usuarioSeleccionado.tipo_contacto === "padre" && (
                          <p className="text-xs text-cyan-400 mt-1">
                            <span className="font-semibold">Estudiante:</span>{" "}
                            {usuarioSeleccionado.nombre_estudiante}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mensaje inicial
                </label>
                <textarea
                  value={mensajeInicial}
                  onChange={(e) => setMensajeInicial(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  rows="4"
                  className="w-full px-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                />
              </div>

              <button
                onClick={crearNuevaConversacion}
                disabled={!usuarioSeleccionado || !mensajeInicial.trim()}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
              >
                Crear Conversación
              </button>
            </div>
          </div>
        </div>
      )}

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
};

export default Mensajes;
