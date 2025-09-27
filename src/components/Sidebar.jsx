import React, {useState} from "react";
import {
  HomeIcon,
  BuildingLibraryIcon,
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
  CreditCardIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  ShieldCheckIcon,
  UserIcon,
  CameraIcon,
  PrinterIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  TrophyIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import {useNavigate, useLocation} from "react-router-dom";
import ConfirmModal from "./ConfirmModal";
import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";

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
        key: "notifications",
        label: "Notificaciones",
        icon: <BellIcon className="h-5 w-5" />,
        path: "/notificaciones",
        color: "text-red-400",
        badge: "3",
      },
    ],
  },
  {
    title: "Gestión Académica",
    items: [
      {
        key: "escuelas",
        label: "Escuelas",
        icon: <BuildingLibraryIcon className="h-5 w-5" />,
        path: "/escuelas",
        color: "text-blue-400",
      },
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
    ],
  },
  {
    title: "Gestión de Personas",
    items: [
      {
        key: "alumnos",
        label: "Estudiantes",
        icon: <UserIcon className="h-5 w-5" />,
        path: "/alumnos",
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
        path: "/padres",
        color: "text-orange-400",
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
        key: "tareas",
        label: "Tareas",
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        path: "/tareas",
        color: "text-blue-300",
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
      {
        key: "eventos",
        label: "Eventos",
        icon: <StarIcon className="h-5 w-5" />,
        path: "/eventos",
        color: "text-amber-400",
      },
      {
        key: "calendario",
        label: "Calendario",
        icon: <CalendarDaysIcon className="h-5 w-5" />,
        path: "/calendario",
        color: "text-rose-400",
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        key: "pagos",
        label: "Pagos",
        icon: <CreditCardIcon className="h-5 w-5" />,
        path: "/pagos",
        color: "text-green-500",
      },
      {
        key: "becas",
        label: "Becas",
        icon: <TrophyIcon className="h-5 w-5" />,
        path: "/becas",
        color: "text-gold-400",
      },
      {
        key: "facturas",
        label: "Facturas",
        icon: <DocumentTextIcon className="h-5 w-5" />,
        path: "/facturas",
        color: "text-slate-400",
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
        badge: "2",
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
        key: "soporte",
        label: "Soporte Técnico",
        icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
        path: "/soporte",
        color: "text-blue-400",
      },
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
    ],
  },
];

function Sidebar({setToken}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    Principal: true,
    "Gestión Académica": true,
  });

  const navigate = useNavigate();
  const location = useLocation();

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
      className={`min-h-screen ${
        collapsed ? "w-20" : "w-80"
      } bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl transition-all duration-500 ease-in-out border-r border-gray-700`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gradient-to-r from-cyan-900/50 to-blue-900/50">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="block text-xl font-extrabold tracking-wide">
                <span className="text-white">Sistema</span>
                <span className="text-cyan-400 ml-1">AOC</span>
              </span>
              <span className="block text-xs text-gray-400 font-medium">
                Gestión Escolar
              </span>
            </div>
          </div>
        )}
        <button
          className="p-2 rounded-xl hover:bg-gray-700 transition-all duration-300 ring-1 ring-gray-600 hover:ring-cyan-400"
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? (
            <Bars3Icon className="h-6 w-6 text-cyan-400" />
          ) : (
            <ChevronDoubleLeftIcon className="h-6 w-6 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <div className="p-2">
          {menuSections.map((section, sectionIndex) => (
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
                      onClick={() => navigate(item.path)}
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
                          {item.badge && (
                            <span className="flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full min-w-[1.25rem] h-5 animate-pulse">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Badge for collapsed mode */}
                      {collapsed && item.badge && (
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
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gradient-to-r from-gray-700/50 to-gray-600/50 ring-1 ring-gray-600">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                Administrador
              </p>
              <p className="text-xs text-gray-400 truncate">Sistema AOC</p>
            </div>
          </div>
        )}

        <button
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 text-red-400 hover:text-white hover:bg-gradient-to-r hover:from-red-600/20 hover:to-pink-600/20 ring-1 ring-transparent hover:ring-red-500/50 group ${
            collapsed ? "justify-center" : ""
          }`}
          onClick={() => setShowLogoutModal(true)}
          title={collapsed ? "Cerrar sesión" : undefined}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
          {!collapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutModal}
        title="¿Cerrar sesión?"
        message="¿Seguro que deseas cerrar sesión?"
        confirmText="Cerrar sesión"
        cancelText="Cancelar"
        icon={
          <ArrowLeftOnRectangleIcon className="h-12 w-12 text-red-500 mx-auto" />
        }
        onConfirm={() => {
          setShowLogoutModal(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
}

export default Sidebar;
