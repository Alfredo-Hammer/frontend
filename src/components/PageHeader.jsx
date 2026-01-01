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
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-gradient-to-br from-slate-950 via-slate-900 to-black">
        {/* Capa de acento con gradiente suave */}
        <div
          className={`pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-60 bg-gradient-to-br from-${gradientFrom} to-${gradientTo}`}
        ></div>
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-40 bg-cyan-500/40"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 mix-blend-soft-light"></div>

        <div className="relative z-10 px-6 py-5 lg:px-8 lg:py-6">
          <div className="flex flex-col gap-4 lg:gap-6">
            {/* Fila superior: título + acciones */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {Icon && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br from-${gradientFrom} to-${gradientTo} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {badge && (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-emerald-100 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-sm mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2 animate-pulse" />
                      {badge}
                    </div>
                  )}

                  <h1 className="text-2xl lg:text-3xl xl:text-4xl font-semibold lg:font-bold text-white tracking-tight mb-1 lg:mb-1.5">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-sm lg:text-base text-slate-200/80 max-w-2xl leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>

              {actions && (
                <div className="flex flex-wrap gap-2 lg:gap-3 justify-start lg:justify-end">
                  {actions}
                </div>
              )}
            </div>

            {/* Fila escuela + stats */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
              {(schoolLogo || schoolName) && (
                <div className="flex items-center gap-3 lg:gap-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner w-full lg:w-auto">
                  {schoolLogo && (
                    <div className="relative flex-shrink-0">
                      <div className="absolute -inset-1 rounded-2xl bg-white/20 blur-md opacity-60" />
                      <img
                        src={schoolLogo}
                        alt={schoolName || "Logo Escuela"}
                        className="relative w-11 h-11 lg:w-12 lg:h-12 rounded-2xl object-cover border border-white/40 shadow-lg bg-slate-900/40"
                        onError={(e) => {
                          console.error("Error al cargar logo:", schoolLogo);
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300/70">
                      Escuela
                    </p>
                    <p className="text-sm lg:text-base font-semibold text-white truncate">
                      {schoolName || "Sin nombre definido"}
                    </p>
                  </div>
                </div>
              )}

              {stats && Object.keys(stats).length > 0 && (
                <div className="flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                    {Object.values(stats).map((content, index) => {
                      const value =
                        typeof content === "object" && content !== null
                          ? content.value
                          : content;
                      const label =
                        typeof content === "object" && content !== null
                          ? content.label
                          : Object.keys(stats)[index]; // Fallback si no hay label explícito
                      const colorClass =
                        typeof content === "object" &&
                        content !== null &&
                        content.color
                          ? content.color
                          : "from-white/5 via-white/0 to-white/5 border border-white/10";
                      const Icon =
                        typeof content === "object" && content !== null
                          ? content.icon
                          : null;

                      return (
                        <div
                          key={index}
                          className={`relative rounded-2xl bg-gradient-to-br ${colorClass} backdrop-blur-md px-3.5 py-3 shadow-sm transition-colors duration-200 overflow-hidden`}
                        >
                          {Icon && (
                            <Icon className="absolute top-0 right-0 h-12 w-12 text-white opacity-20 -mr-2 -mt-2" />
                          )}
                          <p className="text-[11px] font-medium text-white/80 mb-1 line-clamp-2 relative z-10">
                            {label}
                          </p>
                          <p className="text-lg lg:text-xl font-semibold text-white relative z-10">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
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
