/**
 * Configuración de Roles y Permisos del Sistema
 * 
 * Roles disponibles:
 * - admin: Acceso completo al sistema
 * - director: Gestión de escuela y visualización de todo
 * - profesor: Gestión de sus materias, calificaciones y asistencia
 * - alumno: Visualización de sus propias calificaciones y horarios
 * - padre: Visualización de datos de sus hijos
 */

export const ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  PROFESOR: 'profesor',
  ALUMNO: 'alumno',
  PADRE: 'padre',
  SECRETARIADO: 'secretariado',
};

// Permisos por módulo y acción
export const PERMISSIONS = {
  // Gestión de Escuelas
  escuelas: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR],
    eliminar: [ROLES.ADMIN],
  },

  // Gestión de Materias
  materias: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Gestión de Grados
  grados: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Gestión de Secciones
  secciones: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Gestión de Estudiantes
  alumnos: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    verPropio: [ROLES.ALUMNO], // Ver solo su propia información
    verPropias: [ROLES.ALUMNO], // Alternativa para compatibilidad
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Gestión de Profesores
  profesores: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN],
  },

  // Gestión de Padres de Familia
  padres_familia: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN],
  },

  // Gestión de Usuarios
  usuarios: {
    ver: [ROLES.ADMIN],
    crear: [ROLES.ADMIN],
    editar: [ROLES.ADMIN],
    eliminar: [ROLES.ADMIN],
    cambiarEstado: [ROLES.ADMIN],
    cambiarPassword: [ROLES.ADMIN],
  },

  // Calificaciones
  calificaciones: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    verPropias: [ROLES.ALUMNO], // Ver solo sus propias calificaciones
    verHijos: [ROLES.PADRE], // Ver calificaciones de sus hijos
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
    exportar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
  },

  // Asistencia
  asistencia: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    verPropia: [ROLES.ALUMNO],
    verHijos: [ROLES.PADRE],
    registrar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    exportar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
  },

  // Horarios
  horarios: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Tareas
  tareas: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    entregar: [ROLES.ALUMNO],
  },

  // Exámenes
  examenes: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR],
    realizar: [ROLES.ALUMNO],
  },

  // Eventos
  eventos: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    editar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Pagos
  pagos: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PADRE, ROLES.SECRETARIADO],
    verPropios: [ROLES.ALUMNO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    registrar: [ROLES.PADRE, ROLES.SECRETARIADO],
    exportar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
  },

  // Reportes
  reportes: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    exportar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    academicos: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
    financieros: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.SECRETARIADO],
    personalizados: [ROLES.ADMIN, ROLES.DIRECTOR],
  },

  // Comunicación
  mensajes: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
    enviar: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.PADRE, ROLES.SECRETARIADO],
    eliminar: [ROLES.ADMIN],
  },

  // Notificaciones
  notificaciones: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
    crear: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.SECRETARIADO],
  },

  // Configuración
  configuracion: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR],
    editar: [ROLES.ADMIN],
  },

  // Dashboard/Inicio
  dashboard: {
    ver: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR, ROLES.ALUMNO, ROLES.PADRE, ROLES.SECRETARIADO],
  },

  // Mis Calificaciones (vista específica para alumnos)
  mis_calificaciones: {
    ver: [ROLES.ALUMNO],
  },
};

/**
 * Verifica si un rol tiene permiso para realizar una acción
 * @param {string} userRole - Rol del usuario
 * @param {string} module - Módulo del sistema
 * @param {string} action - Acción a realizar
 * @returns {boolean}
 */
export const hasPermission = (userRole, module, action = 'ver') => {
  if (!userRole || !module) return false;

  const modulePermissions = PERMISSIONS[module];
  if (!modulePermissions) return false;

  const actionPermissions = modulePermissions[action];
  if (!actionPermissions) return false;

  return actionPermissions.includes(userRole);
};

/**
 * Verifica si un usuario puede acceder a una ruta
 * @param {string} userRole - Rol del usuario
 * @param {string} path - Ruta a verificar
 * @returns {boolean}
 */
export const canAccessRoute = (userRole, path) => {
  if (!userRole) return false;

  // Casos especiales para rutas específicas por rol
  if (path === '/mis-calificaciones') {
    // Solo alumnos pueden ver "Mis Calificaciones"
    return userRole === ROLES.ALUMNO;
  }

  if (path === '/calificaciones') {
    // Solo admin, director y profesor pueden ver "Calificaciones" (gestión)
    return [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.PROFESOR].includes(userRole);
  }

  // Mapeo de rutas a módulos
  const routeModuleMap = {
    '/': 'dashboard',
    '/escuelas': 'escuelas',
    '/materias': 'materias',
    '/grados': 'grados',
    '/secciones': 'secciones',
    '/alumnos': 'alumnos',
    '/alumnos/registro': 'alumnos',
    '/alumnos/detalle': 'alumnos',
    '/profesores': 'profesores',
    '/usuarios': 'usuarios',
    '/padres': 'alumnos', // Los padres usan el mismo módulo
    '/padres-familia': 'padres_familia',
    '/asistencia': 'asistencia',
    '/horario-clases': 'horarios',
    '/horario': 'horarios',
    '/tareas': 'tareas',
    '/examenes': 'examenes',
    '/eventos': 'eventos',
    '/calendario': 'eventos',
    '/pagos': 'pagos',
    '/becas': 'pagos',
    '/reportes': 'reportes',
    '/mensajes': 'mensajes',
    '/notificaciones': 'notificaciones',
    '/configuracion': 'configuracion',
    '/perfil': 'dashboard', // Todos pueden ver su perfil
    '/registro': 'configuracion',
  };

  let module = routeModuleMap[path];

  // Si no encuentra la ruta exacta, buscar patrones dinámicos
  if (!module) {
    // Manejar rutas con parámetros dinámicos como /alumnos/detalle/:id
    if (path.startsWith('/alumnos/detalle/')) {
      module = 'alumnos';
    } else if (path.startsWith('/profesores/detalle/')) {
      module = 'profesores';
    }
  }

  if (!module) return false;

  return hasPermission(userRole, module, 'ver') ||
    hasPermission(userRole, module, 'verPropio') ||
    hasPermission(userRole, module, 'verPropias') ||
    hasPermission(userRole, module, 'verHijos');
};

/**
 * Obtiene el conjunto de acciones permitidas para un módulo y rol
 * @param {string} userRole - Rol del usuario
 * @param {string} module - Módulo del sistema
 * @returns {Array<string>}
 */
export const getAllowedActions = (userRole, module) => {
  if (!userRole || !module) return [];

  const modulePermissions = PERMISSIONS[module];
  if (!modulePermissions) return [];

  return Object.keys(modulePermissions).filter(action =>
    modulePermissions[action].includes(userRole)
  );
};

/**
 * Filtra items del menú según los permisos del usuario
 * @param {Array} menuItems - Items del menú
 * @param {string} userRole - Rol del usuario
 * @returns {Array}
 */
export const filterMenuByRole = (menuItems, userRole) => {
  if (!userRole) return [];

  return menuItems
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        canAccessRoute(userRole, item.path)
      ),
    }))
    .filter(section => section.items.length > 0);
};

/**
 * Obtiene la ruta inicial según el rol del usuario
 * @param {string} userRole - Rol del usuario
 * @returns {string}
 */
export const getDefaultRoute = (userRole) => {
  switch (userRole) {
    case ROLES.ADMIN:
    case ROLES.DIRECTOR:
      return '/';
    case ROLES.PROFESOR:
      return '/calificaciones';
    case ROLES.ALUMNO:
      return '/calificaciones';
    case ROLES.PADRE:
      return '/calificaciones';
    default:
      return '/';
  }
};

const rolesConfig = {
  ROLES,
  PERMISSIONS,
  hasPermission,
  canAccessRoute,
  getAllowedActions,
  filterMenuByRole,
  getDefaultRoute,
};

export default rolesConfig;
