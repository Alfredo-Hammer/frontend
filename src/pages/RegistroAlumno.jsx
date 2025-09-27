import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {useNavigate} from "react-router-dom";
import {
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

function RegistroAlumno() {
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [direccion_exacta, setDireccionExacta] = useState("");
  const [fecha_nacimiento, setFechaNacimiento] = useState("");
  const [codigo_mined, setCodigoMined] = useState("");
  const [genero, setGenero] = useState("");
  const [nombre_padre, setNombrePadre] = useState("");
  const [correo_padre, setCorreoPadre] = useState("");
  const [telefono_padre, setTelefonoPadre] = useState("");
  const [movil_alumno, setMovilAlumno] = useState("");
  const [turno, setTurno] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [nivel_educativo, setNivelEducativo] = useState("");
  const [escuelaId, setEscuelaId] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [imagen, setImagen] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [escRes, gradRes, secRes] = await Promise.all([
          api.get(services.obtenerEscuelas, {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("http://localhost:4000/api/grados", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("http://localhost:4000/api/secciones", {
            headers: {Authorization: `Bearer ${token}`},
          }),
        ]);
        setEscuelas(escRes.data);
        setGrados(gradRes.data);
        setSecciones(secRes.data);
      } catch (err) {
        setMensaje("Error al cargar datos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Cargar grados cuando cambia escuela
  useEffect(() => {
    if (escuelaId && grados.length > 0) {
      const gradosFiltrados = grados.filter(
        (g) => String(g.id_escuela) === String(escuelaId)
      );
      // Reset grado y sección cuando cambia escuela
      setGradoId("");
      setSeccionId("");
    }
  }, [escuelaId, grados]);

  // Cargar secciones cuando cambia grado
  useEffect(() => {
    if (gradoId && secciones.length > 0) {
      const seccionesFiltradas = secciones.filter(
        (s) => String(s.id_grado) === String(gradoId)
      );
      // Reset sección cuando cambia grado
      setSeccionId("");
    }
  }, [gradoId, secciones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !nombre ||
      !apellido ||
      !email ||
      !escuelaId ||
      !gradoId ||
      !seccionId
    ) {
      setMensaje("Complete todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(
        "http://localhost:4000/api/alumnos",
        {
          nombre,
          apellido,
          email,
          direccion_exacta,
          fecha_nacimiento,
          codigo_mined,
          genero,
          nombre_padre,
          correo_padre,
          telefono_padre,
          movil_alumno,
          turno,
          municipio,
          departamento,
          nivel_educativo,
          escuelaId,
          gradoId,
          seccionId,
          imagen,
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setMensaje("Alumno registrado correctamente");
      setTimeout(() => navigate("/alumnos"), 2000);
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar alumno");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setDireccionExacta("");
    setFechaNacimiento("");
    setCodigoMined("");
    setGenero("");
    setNombrePadre("");
    setCorreoPadre("");
    setTelefonoPadre("");
    setMovilAlumno("");
    setTurno("");
    setMunicipio("");
    setDepartamento("");
    setNivelEducativo("");
    setEscuelaId("");
    setGradoId("");
    setSeccionId("");
    setImagen("");
  };

  // Obtener grados filtrados por escuela seleccionada
  const gradosFiltrados = grados.filter(
    (g) => String(g.id_escuela) === String(escuelaId)
  );

  // Obtener secciones filtradas por grado seleccionado
  const seccionesFiltradas = secciones.filter(
    (s) => String(s.id_grado) === String(gradoId)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white mb-4 backdrop-blur-sm">
                <UserIcon className="w-4 h-4 mr-2" />
                Nuevo Registro
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                Registro de
                <span className="block bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
                  Alumno
                </span>
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-2xl">
                Complete la información del estudiante para registrarlo en el
                sistema educativo.
              </p>
              <button
                onClick={() => navigate("/alumnos")}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold backdrop-blur-sm hover:bg-white/20 transform transition-all duration-300 flex items-center"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Volver a Lista de Alumnos
              </button>
            </div>

            <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Progreso del Registro
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-white">
                      <span>Información Personal</span>
                      <span
                        className={`font-bold ${
                          nombre && apellido
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {nombre && apellido ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Información Académica</span>
                      <span
                        className={`font-bold ${
                          escuelaId && gradoId && seccionId
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {escuelaId && gradoId && seccionId ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Información de Contacto</span>
                      <span
                        className={`font-bold ${
                          email ? "text-green-400" : "text-gray-400"
                        }`}
                      >
                        {email ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (((nombre && apellido ? 1 : 0) +
                              (escuelaId && gradoId && seccionId ? 1 : 0) +
                              (email ? 1 : 0)) /
                              3) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 -mt-16 relative z-10">
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-2xl text-center backdrop-blur-sm border ${
              mensaje.includes("correctamente")
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Formulario Principal */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Formulario de Registro
                </h2>
                <p className="text-green-100 text-sm">
                  Complete toda la información requerida
                </p>
              </div>
              {isLoading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Información Personal */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                  <UserIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información Personal
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el apellido"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={fecha_nacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Género
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                  >
                    <option value="">Seleccionar género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código MINED
                  </label>
                  <input
                    type="text"
                    placeholder="Código asignado por MINED"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={codigo_mined}
                    onChange={(e) => setCodigoMined(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Información Académica */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <AcademicCapIcon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información Académica
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Escuela *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={escuelaId}
                    onChange={(e) => setEscuelaId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar escuela</option>
                    {escuelas.map((esc) => (
                      <option key={esc.id_escuela} value={esc.id_escuela}>
                        {esc.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Grado *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={gradoId}
                    onChange={(e) => setGradoId(e.target.value)}
                    required
                    disabled={!gradosFiltrados.length}
                  >
                    <option value="">Seleccionar grado</option>
                    {gradosFiltrados.map((g) => (
                      <option key={g.id_grado} value={g.id_grado}>
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sección *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={seccionId}
                    onChange={(e) => setSeccionId(e.target.value)}
                    required
                    disabled={!seccionesFiltradas.length}
                  >
                    <option value="">Seleccionar sección</option>
                    {seccionesFiltradas.map((s) => (
                      <option key={s.id_seccion} value={s.id_seccion}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Turno
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                  >
                    <option value="">Seleccionar turno</option>
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Nocturno">Nocturno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nivel Educativo
                  </label>
                  <input
                    type="text"
                    placeholder="Nivel educativo"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={nivel_educativo}
                    onChange={(e) => setNivelEducativo(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Información de Contacto */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información de Contacto y Ubicación
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Dirección completa"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={direccion_exacta}
                    onChange={(e) => setDireccionExacta(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Municipio
                  </label>
                  <input
                    type="text"
                    placeholder="Municipio de residencia"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={municipio}
                    onChange={(e) => setMunicipio(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    placeholder="Departamento"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono del Alumno
                  </label>
                  <input
                    type="text"
                    placeholder="Número de contacto"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={movil_alumno}
                    onChange={(e) => setMovilAlumno(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Información del Tutor */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información del Tutor/Padre
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Tutor
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo del padre/tutor"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={nombre_padre}
                    onChange={(e) => setNombrePadre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono del Tutor
                  </label>
                  <input
                    type="text"
                    placeholder="Número de contacto del tutor"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={telefono_padre}
                    onChange={(e) => setTelefonoPadre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email del Tutor
                  </label>
                  <input
                    type="email"
                    placeholder="correo@tutor.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={correo_padre}
                    onChange={(e) => setCorreoPadre(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-700 space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/alumnos")}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium transition-colors duration-200"
                >
                  Limpiar Formulario
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Registrar Alumno
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistroAlumno;
