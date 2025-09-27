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
};

export default services;