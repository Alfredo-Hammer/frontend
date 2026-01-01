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
  const [todosUsuarios, setTodosUsuarios] = useState([]); // Todos los usuarios de la escuela
  const [contactosPadres, setContactosPadres] = useState([]); // Contactos de padres para profesor
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos, noLeidos, leidos
  const [selectedTab, setSelectedTab] = useState("conversaciones"); // conversaciones | personal | padres
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
  const mensajesContainerRef = useRef(null);
  const token = localStorage.getItem("token");
  const {cargarContador} = useMensajes();

  useEffect(() => {
    // Cargar usuario actual
    const userStr = localStorage.getItem("user");
    let parsed = null;
    if (userStr) {
      try {
        parsed = JSON.parse(userStr);
        setUsuarioActual(parsed);
        // Ajustar tab por defecto para profesor
        if (parsed?.rol === "profesor") {
          setSelectedTab("personal");
        }
      } catch (e) {
        console.error("Error al parsear usuario:", e);
      }
    }

    cargarConversaciones();
    cargarTodosUsuarios();
    cargarInfoEscuela();

    // Si es profesor, cargar contactos de padres desde la vista
    if (parsed?.rol === "profesor") {
      cargarContactosPadres(parsed.id_profesor);
    }
    // Cargar contactos de padres para profesor desde la vista
    const cargarContactosPadres = async (id_profesor) => {
      try {
        const response = await axios.get(
          `${API_URL}/profesores/${id_profesor}/contactos`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        setContactosPadres(response.data.data || []);
      } catch (error) {
        setContactosPadres([]);
        console.error("Error al cargar contactos de padres:", error);
      }
    };

    // Polling para actualizar lista de conversaciones cada 15 segundos
    const intervalConversaciones = setInterval(() => {
      cargarConversaciones();
    }, 15000);

    return () => clearInterval(intervalConversaciones);
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
    let intervalMensajes;
    if (conversacionActiva && conversacionActiva.id_conversacion) {
      cargarMensajes(conversacionActiva.id_conversacion);

      // Polling para mensajes nuevos cada 3 segundos
      intervalMensajes = setInterval(() => {
        cargarMensajes(conversacionActiva.id_conversacion);
      }, 3000);
    }
    return () => {
      if (intervalMensajes) clearInterval(intervalMensajes);
    };
  }, [conversacionActiva]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    if (mensajesContainerRef.current) {
      const {scrollHeight, clientHeight} = mensajesContainerRef.current;
      mensajesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: "smooth",
      });
    }
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

    const mensajeTemp = nuevoMensaje;
    setNuevoMensaje(""); // Limpiar input inmediatamente

    // Optimistic update: Agregar mensaje temporalmente a la lista
    const tempId = Date.now();
    const nuevoMensajeObj = {
      id_mensaje: tempId,
      contenido: mensajeTemp,
      fecha_envio: new Date().toISOString(),
      remitente: usuarioActual?.nombre || "Yo",
      id_usuario_remitente: usuarioActual?.id_usuario,
      enviando: true,
    };

    setMensajes((prev) => [...prev, nuevoMensajeObj]);
    // Scroll inmediato
    setTimeout(() => scrollToBottom(), 100);

    setEnviando(true);
    try {
      await axios.post(
        `${API_URL}/mensajes`,
        {
          id_conversacion: conversacionActiva.id_conversacion,
          mensaje: mensajeTemp,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      // Recargar mensajes reales para confirmar
      cargarMensajes(conversacionActiva.id_conversacion);
      cargarConversaciones();
      cargarContador();
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      showToast("Error al enviar mensaje", "error");
      setNuevoMensaje(mensajeTemp); // Restaurar mensaje en caso de error
    } finally {
      setEnviando(false);
    }
  };

  // Eliminado: cargarUsuarios (se usa todosUsuarios)

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

  // Eliminado: crearNuevaConversacion (ahora se inicia con clic en lista)

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

    // Si el usuario es profesor y está en la pestaña "padres", usar contactosPadres
    if (usuarioActual?.rol === "profesor" && selectedTab === "padres") {
      return contactosPadres.map((contacto) => ({
        id_usuario: contacto.id_padre,
        tipo: "usuario",
        titulo: `${contacto.nombre_padre}`,
        otros_participantes: [
          {
            id_usuario: contacto.id_padre,
            nombre: contacto.nombre_padre,
            foto: contacto.foto_padre,
            email: contacto.email_padre,
            rol: "Padre",
            contexto: `Padre de ${contacto.nombre_estudiante} - ${contacto.nombre_seccion}`,
          },
        ],
        usuario_info: {
          id_usuario: contacto.id_padre,
          nombre: contacto.nombre_padre,
          foto: contacto.foto_padre,
          email: contacto.email_padre,
          rol: "Padre",
          contexto: `Padre de ${contacto.nombre_estudiante} - ${contacto.nombre_seccion}`,
        },
        no_leidos: 0,
      }));
    }

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

  const conversacionesFiltradas = (() => {
    const lista = obtenerListaCompleta();
    const q = busqueda?.toLowerCase() || "";

    const porBusqueda = (item) => {
      if (!q) return true;
      const titulo = item.titulo?.toLowerCase() || "";
      const nombreUsuario = `${item.usuario_info?.nombre || ""} ${
        item.usuario_info?.apellido || ""
      }`.toLowerCase();
      const ultimoMensaje = item.ultimo_mensaje?.mensaje?.toLowerCase() || "";
      return (
        titulo.includes(q) ||
        nombreUsuario.includes(q) ||
        ultimoMensaje.includes(q)
      );
    };

    let filtrada = lista.filter((item) => porBusqueda(item));

    if (selectedTab === "conversaciones") {
      filtrada = filtrada.filter((item) => item.tipo === "conversacion");
      if (filtroEstado === "noLeidos") {
        filtrada = filtrada.filter((item) => item.no_leidos > 0);
      } else if (filtroEstado === "leidos") {
        filtrada = filtrada.filter((item) => (item.no_leidos || 0) === 0);
      }
    } else if (selectedTab === "personal") {
      filtrada = filtrada.filter(
        (item) => item.usuario_info?.tipo_contacto === "usuario"
      );
    } else if (selectedTab === "padres") {
      filtrada = filtrada.filter(
        (item) => item.usuario_info?.tipo_contacto === "padre"
      );
    }

    return filtrada;
  })();

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
          {/* Header sidebar con búsqueda y tabs */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    selectedTab === "conversaciones"
                      ? "Buscar conversación..."
                      : selectedTab === "personal"
                      ? "Buscar personal..."
                      : "Buscar padres..."
                  }
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                {key: "conversaciones", label: "Conversaciones"},
                {key: "personal", label: "Personal"},
                {key: "padres", label: "Padres de Familia"},
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-3 py-1 rounded-md text-sm transition border ${
                    selectedTab === tab.key
                      ? "bg-cyan-600 text-white border-cyan-500"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {conversacionesFiltradas.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <UserCircleIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <p className="text-lg font-semibold">
                  {selectedTab === "conversaciones"
                    ? "No hay conversaciones"
                    : selectedTab === "personal"
                    ? "No hay personal disponible"
                    : "No hay padres vinculados"}
                </p>
                <p className="text-sm mt-2">
                  {busqueda
                    ? "No se encontraron resultados"
                    : selectedTab === "conversaciones"
                    ? "Aún no has iniciado chats. Selecciona un contacto para empezar."
                    : selectedTab === "personal"
                    ? "Verifica que existan usuarios con roles admin/director/profesor/secretariado en tu escuela activa."
                    : "Verifica que tus estudiantes estén matriculados y vinculados con sus padres."}
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
                              titulo: `Chat con ${
                                item.usuario_info?.nombre || "Padre"
                              }`,
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

                          if (nuevaConv) {
                            setConversacionActiva(nuevaConv);
                          } else {
                            setConversacionActiva({
                              id_conversacion:
                                response.data.data.id_conversacion,
                              titulo: `Chat con ${
                                item.usuario_info?.nombre || "Padre"
                              }`,
                              otros_participantes: [item.usuario_info],
                              no_leidos: 0,
                              tipo: "conversacion",
                            });
                          }
                        } catch (error) {
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
                        {item.usuario_info?.foto ? (
                          <img
                            src={item.usuario_info.foto}
                            alt="Foto padre"
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <UserCircleIcon className="h-12 w-12 text-slate-400" />
                        )}
                        {/* Badge de estado en línea */}
                        <EstadoEnLinea
                          enLinea={item.usuario_info?.en_linea}
                          size="medium"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white truncate">
                              {item.usuario_info?.nombre}
                            </h3>
                            <p className="text-xs text-slate-500">
                              {item.usuario_info?.rol}
                            </p>
                            {item.usuario_info?.contexto && (
                              <p className="text-xs text-cyan-400 mt-1">
                                {item.usuario_info.contexto}
                              </p>
                            )}
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
              <div
                ref={mensajesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-950/50 scroll-smooth"
              >
                {mensajes.map((msg) => {
                  const esMio = usuarioActual
                    ? msg.id_remitente === usuarioActual.id_usuario ||
                      msg.id_usuario_remitente === usuarioActual.id_usuario
                    : false;

                  return (
                    <div
                      key={msg.id_mensaje}
                      className={`flex ${
                        esMio ? "justify-end" : "justify-start"
                      } animate-fade-in-up`}
                    >
                      <div
                        className={`max-w-[75%] flex flex-col ${
                          esMio ? "items-end" : "items-start"
                        }`}
                      >
                        {!esMio && (
                          <span className="text-xs text-slate-400 mb-1 ml-2 font-medium">
                            {msg.nombre} {msg.apellido}
                          </span>
                        )}

                        <div
                          className={`relative px-5 py-3 shadow-md transition-all duration-200 hover:shadow-lg ${
                            esMio
                              ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-2xl rounded-tr-sm"
                              : "bg-gradient-to-r from-slate-800 to-slate-700 text-slate-100 rounded-2xl rounded-tl-sm border border-slate-700"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                            {msg.contenido || msg.mensaje}
                          </p>

                          {/* Triángulo decorativo (cola del globo) */}
                          <div
                            className={`absolute top-0 w-0 h-0 border-[6px] border-transparent ${
                              esMio
                                ? "-right-[6px] border-t-pink-600"
                                : "-left-[6px] border-t-slate-800"
                            }`}
                          />
                        </div>

                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            esMio ? "mr-1" : "ml-1"
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(msg.fecha_envio).toLocaleTimeString(
                              "es-SV",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                          {esMio && (
                            <CheckCircleIcon
                              className={`h-3 w-3 ${
                                msg.leido_por_mi
                                  ? "text-blue-400"
                                  : "text-slate-500"
                              }`}
                            />
                          )}
                        </div>
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

      {/* Modal de nueva conversación eliminado: usar tabs y clic directo en lista */}

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
