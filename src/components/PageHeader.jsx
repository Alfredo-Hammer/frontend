import PropTypes from "prop-types";

/**
 * PageHeader - Componente reutilizable para headers de páginas
 *
 * @param {string} title - Título principal de la página
 * @param {string} subtitle - Subtítulo o descripción
 * @param {ReactNode} icon - Ícono a mostrar (componente de Heroicons)
 * @param {string} gradientFrom - Color inicial del gradiente (ej: "blue-600")
 * @param {string} gradientTo - Color final del gradiente (ej: "indigo-600")
 * @param {ReactNode} actions - Botones o acciones del header
 * @param {Object} stats - Objeto con estadísticas a mostrar {label: value}
 * @param {string} badge - Texto para el badge opcional
 * @param {string} schoolLogo - URL del logo de la escuela
 * @param {string} schoolName - Nombre de la escuela
 */
function PageHeader({
  title,
  subtitle,
  icon: Icon,
  gradientFrom = "blue-600",
  gradientTo = "indigo-600",
  actions,
  stats,
  badge,
  schoolLogo,
  schoolName,
}) {
  return (
    <div className="w-full mb-6">
      <div
        className={`bg-gradient-to-r from-${gradientFrom} to-${gradientTo} rounded-2xl shadow-xl p-6 border border-white/10 relative overflow-hidden`}
      >
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -ml-24 -mb-24"></div>

        <div className="relative z-10">
          {/* Logo y nombre de escuela en fila superior */}
          {(schoolLogo || schoolName) && (
            <div className="flex items-center justify-end gap-3 mb-4 pb-4 border-b border-white/10">
              {schoolName && (
                <span className="text-lg font-semibold text-white/90">
                  {schoolName}
                </span>
              )}
              {schoolLogo && (
                <img
                  src={schoolLogo}
                  alt={schoolName || "Logo Escuela"}
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl object-cover border-3 border-white/30 shadow-lg backdrop-blur-sm bg-white/10"
                  onError={(e) => {
                    console.error("Error al cargar logo:", schoolLogo);
                    e.target.style.display = "none";
                  }}
                />
              )}
            </div>
          )}

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Título y descripción */}
            <div className="flex items-start space-x-4 flex-1">
              {Icon && (
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {badge && (
                  <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full text-xs text-white mb-2 backdrop-blur-sm">
                    {badge}
                  </div>
                )}
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 truncate">
                  {title}
                </h1>
                <p className="text-sm lg:text-base text-white/80">{subtitle}</p>
              </div>
            </div>

            {/* Acciones */}
            {actions && (
              <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                {actions}
              </div>
            )}
          </div>

          {/* Estadísticas */}
          {stats && Object.keys(stats).length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats).map(([label, value], index) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                  >
                    <p className="text-xs text-white/70 mb-1">{label}</p>
                    <p className="text-xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  gradientFrom: PropTypes.string,
  gradientTo: PropTypes.string,
  actions: PropTypes.node,
  stats: PropTypes.object,
  badge: PropTypes.string,
  schoolLogo: PropTypes.string,
  schoolName: PropTypes.string,
};

export default PageHeader;
