import React, {useState, useRef, useEffect} from "react";

function Header({user}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [notifications] = useState([
    {
      id: 1,
      title: "Nueva escuela registrada",
      message: "Escuela San José ha sido agregada",
      time: "Hace 5 min",
      unread: true,
    },
    {
      id: 2,
      title: "Perfil actualizado",
      message: "Tu información de perfil fue modificada",
      time: "Hace 1 hora",
      unread: true,
    },
    {
      id: 3,
      title: "Respaldo completado",
      message: "Base de datos respaldada exitosamente",
      time: "Hace 2 horas",
      unread: false,
    },
  ]);

  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Construye el nombre para el avatar si no hay imagen
  const avatarName = user?.nombre
    ? encodeURIComponent(`${user.nombre} ${user.apellido || ""}`.trim())
    : "Usuario";
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleLogout = () => {
    if (window.confirm("¿Estás seguro que deseas cerrar sesión?")) {
      localStorage.removeItem("token");
      window.location.href = "/login"; // Mejor que reload()
    }
  };

  // Debug: Log user data to console
  console.log("Usuario en Header:", user);

  return (
    <header className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b border-gray-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Búsqueda global */}
          <div className="hidden md:flex flex-1 max-lg-md mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar escuelas, estudiantes, profesores..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Herramientas y usuario */}
          <div className="flex items-center space-x-3">
            {/* Botón de búsqueda móvil */}
            <button className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Notificaciones */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown de notificaciones */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-[9999] max-h-96 overflow-y-auto">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Notificaciones
                      </h3>
                      <span className="text-xs text-gray-400">
                        {unreadCount} sin leer
                      </span>
                    </div>
                  </div>
                  <div className="py-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-700 border-l-4 ${
                          notification.unread
                            ? "border-blue-500 bg-gray-750"
                            : "border-transparent"
                        } transition-colors duration-200`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-2 h-2 rounded-full mt-2 ${
                              notification.unread
                                ? "bg-blue-500"
                                : "bg-gray-600"
                            }`}
                          ></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-300 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-700 text-center">
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Configuración rápida */}
            <button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Configuración"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-transparent hover:border-gray-600"
              >
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-white text-sm">
                    {user
                      ? `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
                        "Usuario"
                      : "Cargando..."}
                  </div>
                  <div className="text-xs text-gray-400">
                    {user?.rol || "Cargando rol..."}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={
                      user?.imagen ||
                      `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff`
                    }
                    alt="Perfil"
                    className="h-10 w-10 rounded-full border-2 border-blue-500 shadow-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown del usuario */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-[9999]">
                  <div className="p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          user?.imagen ||
                          `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff`
                        }
                        alt="Perfil"
                        className="h-12 w-12 rounded-full border-2 border-blue-500"
                      />
                      <div>
                        <p className="font-semibold text-white">
                          {user
                            ? `${user.nombre || ""} ${
                                user.apellido || ""
                              }`.trim() || "Usuario"
                            : "Cargando..."}
                        </p>
                        <p className="text-sm text-gray-400">
                          {user?.email || "Cargando email..."}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-600 text-white rounded-full mt-1">
                          {user?.rol || "Cargando..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="py-2">
                    <button className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span className="text-gray-300">Mi Perfil</span>
                    </button>

                    <button className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-gray-300">Configuración</span>
                    </button>

                    <button className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-gray-300">Ayuda y Soporte</span>
                    </button>

                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <button className="w-full px-4 py-3 text-left hover:bg-gray-700 flex items-center space-x-3 transition-colors duration-200">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                          />
                        </svg>
                        <span className="text-gray-300">Modo Claro</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left hover:bg-red-600 hover:bg-opacity-20 flex items-center space-x-3 transition-colors duration-200 text-red-400 hover:text-red-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
