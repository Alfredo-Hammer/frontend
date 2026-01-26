import React, {useState, useEffect} from "react";
import {
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  ChevronDoubleLeftIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  ShieldCheckIcon,
  UserIcon,
  EnvelopeIcon,
  TrophyIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import {useNavigate, useLocation} from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import {filterMenuByRole} from "../config/roles";
import {useMensajes} from "../context/MensajesContext";
import api from "../api/axiosConfig";

const menuSections = [
  {
    title: "Principal",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <HomeIcon className="h-5 w-5" />,
        path: "/",
        color: "text-cyan-400",
      },
      {
        key: "mis_calificaciones",
        label: "Mis Calificaciones",
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        path: "/mis-calificaciones",
        color: "text-emerald-400",
      },
    ],
  },
  {
    title: "Gestión Académica",
    items: [
      {
        key: "materias",
        label: "Materias",
        icon: <BookOpenIcon className="h-5 w-5" />,
        path: "/materias",
        color: "text-purple-400",
      },
      {
        key: "grados",
        label: "Grados",
        icon: <AcademicCapIcon className="h-5 w-5" />,
        path: "/grados",
        color: "text-emerald-400",
      },
      {
        key: "secciones",
        label: "Secciones",
        icon: <UserGroupIcon className="h-5 w-5" />,
        path: "/secciones",
        color: "text-teal-400",
      },
      {
        key: "carga_academica",
        label: "Carga Académica",
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        path: "/carga-academica",
        color: "text-blue-400",
      },
    ],
  },
  {
    title: "Gestión de Personas",
    items: [
      {
        key: "estudiantes",
        label: "Estudiantes",
        icon: <UserIcon className="h-5 w-5" />,
        path: "/estudiantes",
        color: "text-green-400",
      },
      {
        key: "profesores",
        label: "Profesores",
        icon: <AcademicCapIcon className="h-5 w-5" />,
        path: "/profesores",
        color: "text-yellow-400",
      },
      {
        key: "padres",
        label: "Padres de Familia",
        icon: <UserGroupIcon className="h-5 w-5" />,
        path: "/padres-familia",
        color: "text-orange-400",
      },
      {
        key: "usuarios",
        label: "Usuarios",
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        path: "/usuarios",
        color: "text-indigo-400",
      },
      {
        key: "personal",
        label: "Personal Admin.",
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        path: "/personal",
        color: "text-indigo-400",
      },
    ],
  },
  {
    title: "Evaluación y Notas",
    items: [
      {
        key: "calificaciones_hijos",
        label: "Calificaciones de mis hijos",
        icon: <UserGroupIcon className="h-5 w-5" />,
        path: "/calificaciones-hijos",
        color: "text-pink-400",
      },
      {
        key: "calificaciones",
        label: "Calificaciones",
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        path: "/calificaciones",
        color: "text-pink-400",
      },
      {
        key: "examenes",
        label: "Exámenes",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        path: "/examenes",
        color: "text-violet-400",
      },
      {
        key: "reportes",
        label: "Reportes",
        icon: <DocumentChartBarIcon className="h-5 w-5" />,
        path: "/reportes",
        color: "text-orange-400",
      },
      {
        key: "asistencia",
        label: "Asistencia",
        icon: <ClockIcon className="h-5 w-5" />,
        path: "/asistencia",
        color: "text-lime-400",
      },
    ],
  },
  {
    title: "Horarios y Eventos",
    items: [
      {
        key: "horarios",
        label: "Horarios de Clase",
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        path: "/horario-clases",
        color: "text-orange-400",
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        key: "finanzas",
        label: "Finanzas y Pagos",
        icon: <CreditCardIcon className="h-5 w-5" />,
        path: "/finanzas",
        color: "text-green-500",
      },
    ],
  },
  {
    title: "Comunicación",
    items: [
      {
        key: "mensajes",
        label: "Mensajes",
        icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
        path: "/mensajes",
        color: "text-blue-500",
        badgeDynamic: true, // Indica que el badge es dinámico
      },
      {
        key: "anuncios",
        label: "Anuncios",
        icon: <BellIcon className="h-5 w-5" />,
        path: "/anuncios",
        color: "text-purple-500",
      },
      {
        key: "email",
        label: "Correos",
        icon: <EnvelopeIcon className="h-5 w-5" />,
        path: "/correos",
        color: "text-cyan-500",
      },
    ],
  },
  {
    title: "Reportes y Análisis",
    items: [
      {
        key: "reportes",
        label: "Reportes",
        icon: <ChartBarIcon className="h-5 w-5" />,
        path: "/reportes",
        color: "text-teal-400",
      },
      {
        key: "estadisticas",
        label: "Estadísticas",
        icon: <ChartBarIcon className="h-5 w-5" />,
        path: "/estadisticas",
        color: "text-emerald-500",
      },
      {
        key: "certificados",
        label: "Certificados",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        path: "/certificados",
        color: "text-gold-500",
      },
    ],
  },
  {
    title: "Recursos",
    items: [
      {
        key: "biblioteca",
        label: "Biblioteca",
        icon: <FolderIcon className="h-5 w-5" />,
        path: "/biblioteca",
        color: "text-brown-400",
      },
      {
        key: "inventario",
        label: "Inventario",
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        path: "/inventario",
        color: "text-gray-400",
      },
      {
        key: "laboratorios",
        label: "Laboratorios",
        icon: <ComputerDesktopIcon className="h-5 w-5" />,
        path: "/laboratorios",
        color: "text-blue-600",
      },
    ],
  },
  {
    title: "Configuración",
    items: [
      {
        key: "configuracion",
        label: "Configuración",
        icon: <Cog6ToothIcon className="h-5 w-5" />,
        path: "/configuracion",
        color: "text-gray-400",
      },
      {
        key: "ciclos_escolares",
        label: "Ciclos Escolares",
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        path: "/ciclosescolares",
        color: "text-cyan-400",
      },
      {
        key: "periodos_evaluacion",
        label: "Semáforo de Notas",
        icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
        path: "/periodos-evaluacion",
        color: "text-pink-400",
      },
      {
        key: "logs_seguridad",
        label: "Logs de Seguridad",
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        path: "/logs-seguridad",
        color: "text-red-500",
      },
      {
        key: "auditoria",
        label: "Auditoría del Sistema",
        icon: <ShieldCheckIcon className="h-5 w-5" />,
        path: "/auditoria",
        color: "text-purple-500",
      },
      {
        key: "traslado_estudiante",
        label: "Traslado de Estudiantes",
        icon: <UserGroupIcon className="h-5 w-5" />,
        path: "/traslado-estudiante",
        color: "text-blue-500",
      },
      {
        key: "backup",
        label: "Respaldos",
        icon: <FolderIcon className="h-5 w-5" />,
        path: "/backup",
        color: "text-slate-500",
      },
      {
        key: "logs",
        label: "Logs del Sistema",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        path: "/logs",
        color: "text-stone-400",
      },
    ],
  },
  {
    title: "Ayuda",
    items: [
      {
        key: "manual",
        label: "Manual de Usuario",
        icon: <InformationCircleIcon className="h-5 w-5" />,
        path: "/manual",
        color: "text-green-500",
      },
      {
        key: "acerca",
        label: "Acerca de",
        icon: <InformationCircleIcon className="h-5 w-5" />,
        path: "/acerca",
        color: "text-purple-400",
      },
      {
        key: "soporte",
        label: "Contacto o soporte",
        icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
        path: "/soporte",
        color: "text-blue-400",
      },
    ],
  },
];

function Sidebar({setToken, user, onCollapsedChange, isOpen, onClose}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [escuela, setEscuela] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    Principal: true,
    "Gestión Académica": true,
  });
  const [filteredMenu, setFilteredMenu] = useState([]);
  const {contadorNoLeidos} = useMensajes();
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch escuela data
  useEffect(() => {
    const fetchEscuela = async () => {
      if (user?.id_escuela) {
        try {
          const res = await api.get(`/api/escuelas/${user.id_escuela}`);
          setEscuela(res.data);
        } catch (err) {
          console.error("Error fetching school data:", err);
        }
      }
    };
    fetchEscuela();
  }, [user]);

  // Filtrar menú según el rol del usuario
  useEffect(() => {
    if (user && user.rol) {
      const filtered = filterMenuByRole(menuSections, user.rol);
      setFilteredMenu(filtered);
    } else {
      setFilteredMenu([]);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  const toggleSection = (sectionTitle) => {
    if (collapsed) return; // No expandir en modo colapsado
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const isItemActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div
      className={`h-screen w-80 ${
        collapsed ? "lg:w-20" : "lg:w-80"
      } bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transition-all duration-500 ease-in-out border-r border-gray-700 fixed left-0 top-0 z-50
      ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-cyan-900/50 to-blue-900/50 flex-shrink-0">
        <div
          className={`flex items-center gap-3 overflow-hidden ${
            collapsed ? "lg:hidden" : ""
          }`}
        >
          <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex-shrink-0">
            {escuela?.logo ? (
              <img
                src={`${api.defaults.baseURL}${escuela.logo}`}
                alt="Logo"
                className="h-8 w-8 object-cover rounded-lg bg-white"
              />
            ) : (
              <AcademicCapIcon className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xl font-extrabold tracking-wide whitespace-nowrap">
              <span className="text-white">Sistema</span>
              <span className="text-cyan-400 ml-1">AOC</span>
            </span>
            <span
              className="block text-xs text-gray-400 font-medium truncate"
              title={escuela?.nombre || "Gestión Escolar"}
            >
              {escuela?.nombre || "Gestión Escolar"}
            </span>
          </div>
        </div>
        <button
          className="hidden lg:block p-2 rounded-xl hover:bg-gray-700 transition-all duration-300 ring-1 ring-gray-600 hover:ring-cyan-400"
          onClick={() => {
            setCollapsed((prev) => {
              const newValue = !prev;
              onCollapsedChange?.(newValue);
              return newValue;
            });
          }}
        >
          {collapsed ? (
            <Bars3Icon className="h-6 w-6 text-cyan-400" />
          ) : (
            <ChevronDoubleLeftIcon className="h-6 w-6 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation - Scroll independiente */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 custom-scrollbar">
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(17, 24, 39, 0.5);
            border-radius: 10px;
            margin: 8px 0;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #06b6d4 0%, #3b82f6 100%);
            border-radius: 10px;
            transition: all 0.3s ease;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #22d3ee 0%, #60a5fa 100%);
            width: 8px;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #06b6d4 rgba(17, 24, 39, 0.5);
          }
        `}</style>
        {filteredMenu.map((section, sectionIndex) => (
          <div key={section.title} className="mb-4">
            {/* Section Header */}
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                  {section.title}
                </span>
                {expandedSections[section.title] ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Section Items */}
            {(collapsed || expandedSections[section.title]) && (
              <div className="space-y-1 mt-2">
                {section.items.map((item) => (
                  <button
                    key={item.key}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                      isItemActive(item.path)
                        ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white ring-1 ring-cyan-500/50 shadow-lg shadow-cyan-500/25"
                        : "hover:bg-gradient-to-r hover:from-gray-700 hover:to-gray-600 text-gray-300 hover:text-white"
                    }`}
                    onClick={() => {
                      navigate(item.path);
                      onClose?.();
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    {/* Active indicator */}
                    {isItemActive(item.path) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full"></div>
                    )}

                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 ${item.color} ${
                        isItemActive(item.path)
                          ? "transform scale-110"
                          : "group-hover:scale-105"
                      } transition-transform duration-200`}
                    >
                      {item.icon}
                    </div>

                    {/* Label and Badge */}
                    {!collapsed && (
                      <div className="flex items-center justify-between flex-1 min-w-0">
                        <span
                          className={`font-medium truncate ${
                            isItemActive(item.path)
                              ? "text-white"
                              : "group-hover:text-white"
                          }`}
                        >
                          {item.label}
                        </span>
                        {/* Badge dinámico para mensajes */}
                        {item.badgeDynamic && contadorNoLeidos > 0 && (
                          <span className="flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full min-w-[1.25rem] h-5 animate-pulse">
                            {contadorNoLeidos}
                          </span>
                        )}
                        {/* Badge estático para otras notificaciones */}
                        {item.badge && !item.badgeDynamic && (
                          <span className="flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full min-w-[1.25rem] h-5 animate-pulse">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Badge for collapsed mode */}
                    {collapsed && item.badgeDynamic && contadorNoLeidos > 0 && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                        {contadorNoLeidos}
                      </div>
                    )}
                    {collapsed && item.badge && !item.badgeDynamic && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse">
                        {item.badge}
                      </div>
                    )}

                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Profile - Fixed at bottom */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900 flex-shrink-0">
        {!collapsed && user && (
          <button
            onClick={() => navigate("/perfil")}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 ring-1 ring-gray-600 hover:ring-cyan-500/50 hover:from-cyan-900/30 hover:to-blue-900/30 transition-all duration-300 group"
          >
            <div className="flex-shrink-0">
              {user.imagen ? (
                <img
                  src={user.imagen}
                  alt={`${user.nombre} ${user.apellido}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 group-hover:border-cyan-300 group-hover:scale-110 transition-all duration-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors duration-200">
                {user.nombre} {user.apellido}
              </p>
              <p className="text-xs text-gray-400 truncate capitalize">
                {user.rol || "Usuario"}
              </p>
            </div>
          </button>
        )}

        {collapsed && user && (
          <button
            onClick={() => navigate("/perfil")}
            className="w-full flex items-center justify-center p-3 rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 ring-1 ring-gray-600 hover:ring-cyan-500/50 hover:from-cyan-900/30 hover:to-blue-900/30 transition-all duration-300 group"
            title="Perfil"
          >
            <div className="flex-shrink-0">
              {user.imagen ? (
                <img
                  src={user.imagen}
                  alt={`${user.nombre} ${user.apellido}`}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 group-hover:border-cyan-300 group-hover:scale-110 transition-all duration-200"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UserIcon className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
