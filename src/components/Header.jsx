import React, {useState, useRef, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useMensajes} from "../context/MensajesContext";
import {
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import api from "../api/axiosConfig";
import ConfirmModal from "./ConfirmModal";

function Header({user, onMenuClick, sidebarCollapsed}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [cicloActivo, setCicloActivo] = useState(null);
  const navigate = useNavigate();
  const {contadorNoLeidos} = useMensajes();

  const userMenuRef = useRef(null);

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtener ciclo escolar activo
  useEffect(() => {
    const fetchCicloActivo = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await api.get("/api/ciclos/activo", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setCicloActivo(response.data);
      } catch (error) {
        console.error("Error al obtener ciclo activo:", error);
      }
    };

    if (user) {
      fetchCicloActivo();
    }
  }, [user]);

  // Construye el nombre para el avatar si no hay imagen
  const avatarName = user?.nombre
    ? encodeURIComponent(`${user.nombre} ${user.apellido || ""}`.trim())
    : "Usuario";

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <header
      className={`bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-2xl border-b border-gray-700 backdrop-blur-sm sticky top-0 z-40 transition-all duration-300`}
    >
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Botón hamburguesa para móvil/tablet */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
              aria-label="Abrir menú"
            >
              <Bars3Icon className="h-6 w-6 text-cyan-400" />
            </button>

            {/* Ciclo Escolar Activo */}
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-medium text-white hidden sm:inline">
                {cicloActivo ? cicloActivo.nombre : "Sin ciclo activo"}
              </span>
            </div>
          </div>

          {/* Herramientas y usuario */}
          <div className="flex items-center space-x-3">
            {/* Mensajes */}
            <button
              onClick={() => navigate("/mensajes")}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-200"
              title="Mensajes"
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              {contadorNoLeidos > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse shadow-lg">
                  {contadorNoLeidos}
                </span>
              )}
            </button>

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-transparent hover:border-cyan-500/30"
              >
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-white text-sm">
                    {user
                      ? `${user.nombre || ""} ${user.apellido || ""}`.trim() ||
                        "Usuario"
                      : "Cargando..."}
                  </div>
                  <div className="text-xs text-cyan-400 capitalize">
                    {user?.rol || "Cargando rol..."}
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={
                      user?.imagen ||
                      `https://ui-avatars.com/api/?name=${avatarName}&background=06b6d4&color=fff`
                    }
                    alt="Perfil"
                    className="h-10 w-10 rounded-full border-2 border-cyan-500 shadow-lg object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-gray-800 rounded-full"></div>
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

              {/* Dropdown del usuario mejorado */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden z-[9999]">
                  {/* Header del menú con gradiente */}
                  <div className="p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={
                            user?.imagen ||
                            `https://ui-avatars.com/api/?name=${avatarName}&background=06b6d4&color=fff`
                          }
                          alt="Perfil"
                          className="h-14 w-14 rounded-full border-2 border-cyan-500 object-cover shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user
                            ? `${user.nombre || ""} ${
                                user.apellido || ""
                              }`.trim() || "Usuario"
                            : "Cargando..."}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {user?.email || "Cargando email..."}
                        </p>
                        <span className="inline-block px-2 py-1 text-xs bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full mt-1 capitalize">
                          {user?.rol || "Cargando..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Opciones del menú */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate("/perfil");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center space-x-3 transition-all duration-200 group"
                    >
                      <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-cyan-600 transition-colors duration-200">
                        <UserCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </div>
                      <div>
                        <span className="text-gray-300 group-hover:text-white font-medium">
                          Mi Perfil
                        </span>
                        <p className="text-xs text-gray-500">
                          Ver y editar información
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/configuracion");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center space-x-3 transition-all duration-200 group"
                    >
                      <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-blue-600 transition-colors duration-200">
                        <Cog6ToothIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </div>
                      <div>
                        <span className="text-gray-300 group-hover:text-white font-medium">
                          Configuración
                        </span>
                        <p className="text-xs text-gray-500">
                          Ajustes del sistema
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        navigate("/soporte");
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-700/50 flex items-center space-x-3 transition-all duration-200 group"
                    >
                      <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-purple-600 transition-colors duration-200">
                        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </div>
                      <div>
                        <span className="text-gray-300 group-hover:text-white font-medium">
                          Ayuda y Soporte
                        </span>
                        <p className="text-xs text-gray-500">Centro de ayuda</p>
                      </div>
                    </button>

                    <div className="border-t border-gray-700 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-red-600/20 flex items-center space-x-3 transition-all duration-200 group"
                      >
                        <div className="p-2 bg-gray-700 rounded-lg group-hover:bg-red-600 transition-colors duration-200">
                          <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-400 group-hover:text-white" />
                        </div>
                        <div>
                          <span className="text-red-400 group-hover:text-red-300 font-medium">
                            Cerrar Sesión
                          </span>
                          <p className="text-xs text-gray-500">
                            Salir del sistema
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación de logout */}
      <ConfirmModal
        open={showLogoutModal}
        title="¿Cerrar sesión?"
        message="¿Estás seguro que deseas salir del sistema?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        icon={
          <ArrowRightOnRectangleIcon className="h-12 w-12 text-red-500 mx-auto" />
        }
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </header>
  );
}

export default Header;
