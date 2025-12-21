// Este archivo define las rutas de la API que se utilizarán en el frontend.

const API_BASE = "http://localhost:4000/api";

const services = {
  API_BASE,
  // Rutas de la API
  login: `${API_BASE}/usuarios/login`,
  register: `${API_BASE}/usuarios/register`,
  grados: `${API_BASE}/grados`,
  gradosOrdenar: `${API_BASE}/grados/ordenar`,
  escuelas: `${API_BASE}/escuelas`,
  crearEscuela: `${API_BASE}/escuelas`,
  editarEscuela: (id) => `${API_BASE}/escuelas/${id}`,
  eliminarEscuela: (id) => `${API_BASE}/escuelas/${id}`,
  obtenerEscuelas: `${API_BASE}/escuelas`,
  alumnos: `${API_BASE}/alumnos`,
  profesores: `${API_BASE}/profesores`,
  secciones: `${API_BASE}/secciones`,
  materias: `${API_BASE}/materias`,
  calificaciones: `${API_BASE}/calificaciones`,
  calificacionesAlumnosLista: `${API_BASE}/calificaciones/alumnos-lista`,
  calificacionesMateriasAlumno: `${API_BASE}/calificaciones/materias-alumno`,
  reportes: `${API_BASE}/reportes`,
  reportesConsolidado: `${API_BASE}/reportes/consolidado`,
  // Datos de Nicaragua
  nicaraguaDepartamentos: `${API_BASE}/nicaragua/departamentos`,
  nicaraguaMunicipios: (departamento) => `${API_BASE}/nicaragua/municipios/${departamento}`,
  nicaraguaTodos: `${API_BASE}/nicaragua/todos`,
  // Recuperación de contraseña
  solicitarRecuperacion: `${API_BASE}/auth/solicitar-recuperacion`,
  validarTokenRecuperacion: (token) => `${API_BASE}/auth/validar-token-recuperacion/${token}`,
  restablecerPassword: `${API_BASE}/auth/restablecer-password`,

  // Finanzas
  finanzasConceptos: `${API_BASE}/finanzas/conceptos`,
  finanzasConcepto: (id) => `${API_BASE}/finanzas/conceptos/${id}`,
  finanzasPagos: `${API_BASE}/finanzas/pagos`,
  finanzasPagoAnular: (id) => `${API_BASE}/finanzas/pagos/${id}/anular`,
  finanzasEstadoCuenta: (idEstudiante) => `${API_BASE}/finanzas/estado-cuenta/${idEstudiante}`,
  finanzasBecas: `${API_BASE}/finanzas/becas`,
  finanzasBeca: (id) => `${API_BASE}/finanzas/becas/${id}`,
  finanzasEstadisticas: `${API_BASE}/finanzas/estadisticas`,
  finanzasMorosidad: `${API_BASE}/finanzas/morosidad`,
};

export default services;