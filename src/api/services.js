// Este archivo define las rutas de la API que se utilizarán en el frontend.

const API_BASE = "http://localhost:4000/api";

const services = {
  ciclosEscolares: `${API_BASE}/ciclos-escolares`,
  API_BASE,
  // Rutas de la API
  login: `${API_BASE}/auth/login`,
  register: `${API_BASE}/auth/register`,
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
  calificacionesAlumnoInfo: `${API_BASE}/calificaciones/alumno-info`,
  evaluacionesPorCiclo: (idCiclo) => `${API_BASE}/evaluaciones/ciclo/${idCiclo}`,
  notasAlumno: (idAlumno) => `${API_BASE}/notas/alumno/${idAlumno}`,
  notasGuardar: `${API_BASE}/notas/guardar`,
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

  // Caja (Cierre de Caja)
  finanzasCajaAbrir: `${API_BASE}/finanzas/caja/abrir`,
  finanzasCajaResumen: `${API_BASE}/finanzas/caja/resumen`,
  finanzasCajaCerrar: `${API_BASE}/finanzas/caja/cerrar`,

  // Dashboard
  dashboardAdmin: `${API_BASE}/dashboard/admin`,
  dashboardActividadReciente: `${API_BASE}/dashboard/actividad-reciente`,
  dashboardProfesor: `${API_BASE}/dashboard/profesor`,
  dashboardEstudiante: `${API_BASE}/dashboard/estudiante`,

  // Padres
  padresMisHijos: `${API_BASE}/padres/mis-hijos`,
  padresMisEventosHijo: (idUsuarioAlumno) => `${API_BASE}/padres/mis-eventos/${idUsuarioAlumno}`,

  // Asistencia
  asistenciaEstudiante: (idEstudiante) => `${API_BASE}/asistencia/estudiante/${idEstudiante}`,

  // Carga Académica
  cargaAcademica: `${API_BASE}/carga-academica`,
  cargaAcademicaSeccion: (idSeccion) => `${API_BASE}/carga-academica/seccion/${idSeccion}`,
  cargaAcademicaProfesor: (idProfesor) => `${API_BASE}/carga-academica/profesor/${idProfesor}`,
  cargaAcademicaMateria: (idMateria) => `${API_BASE}/carga-academica/materia/${idMateria}`,
  cargaAcademicaGrado: (idGrado) => `${API_BASE}/carga-academica/grado/${idGrado}`,
  cargaAcademicaPorId: (id) => `${API_BASE}/carga-academica/${id}`,
  cargaAcademicaEstadisticas: `${API_BASE}/carga-academica/estadisticas`,

  // Horarios
  horarios: `${API_BASE}/horarios`,
  horariosPorId: (id) => `${API_BASE}/horarios/${id}`,
  horariosEstadisticas: `${API_BASE}/horarios/estadisticas`,

  // Logs de Seguridad
  logsSistema: `${API_BASE}/logs/sistema`,
  logsIntentosLogin: `${API_BASE}/logs/intentos-login`,
  logsEstadisticas: `${API_BASE}/logs/estadisticas`,
  logsTiposAccion: `${API_BASE}/logs/tipos-accion`,

  // Auditoría del Sistema
  auditoria: `${API_BASE}/auditoria`,
  auditoriaHistorial: (tabla, id) => `${API_BASE}/auditoria/historial/${tabla}/${id}`,
  auditoriaEstadisticas: `${API_BASE}/auditoria/estadisticas`,
  auditoriaActividadSospechosa: `${API_BASE}/auditoria/actividad-sospechosa`,
  auditoriaTablas: `${API_BASE}/auditoria/tablas`,
  auditoriaExportar: `${API_BASE}/auditoria/exportar`,

  // Traslado de Estudiantes
  trasladoBuscarEstudiante: `${API_BASE}/traslados/buscar-estudiante`,
  trasladoEscuelasDisponibles: `${API_BASE}/traslados/escuelas-disponibles`,
  trasladoRealizar: `${API_BASE}/traslados/realizar`,
  trasladoHistorial: `${API_BASE}/traslados/historial`,
};

export default services;