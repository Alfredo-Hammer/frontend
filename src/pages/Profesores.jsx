import {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  IdentificationIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";

function Profesores() {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profesorEditar, setProfesorEditar] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState({
    email: "",
    password: "",
  });
  const [escuela, setEscuela] = useState(null);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [contacto, setContacto] = useState("");
  const [numero_cedula, setNumeroCedula] = useState("");
  const [direccion, setDireccion] = useState("");
  const [fecha_nacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState("");
  const [imagen, setImagen] = useState(null);
  const [titulo_academico, setTituloAcademico] = useState("");
  const [años_experiencia, setAñosExperiencia] = useState("");

  // Estados para asignaciones
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [gradosSeleccionados, setGradosSeleccionados] = useState([]);
  const [seccionesSeleccionadas, setSeccionesSeleccionadas] = useState({});

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfesores();
    fetchGrados();
    fetchSecciones();
    fetchUser();
  }, []);

  const fetchGrados = async () => {
    try {
      const response = await api.get("/api/grados", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(response.data);
    } catch (err) {
      console.error("Error al cargar grados:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar datos de escuela:", error);
    }
  };

  const fetchSecciones = async () => {
    try {
      const response = await api.get("/api/secciones", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setSecciones(response.data);
    } catch (err) {
      console.error("Error al cargar secciones:", err);
    }
  };

  const fetchProfesores = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/profesores", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setProfesores(response.data);
    } catch (err) {
      setMensaje("Error al cargar profesores");
    } finally {
      setIsLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setPassword("");
    setEspecialidad("");
    setContacto("");
    setNumeroCedula("");
    setDireccion("");
    setFechaNacimiento("");
    setGenero("");
    setImagen(null);
    setTituloAcademico("");
    setAñosExperiencia("");
    setGradosSeleccionados([]);
    setSeccionesSeleccionadas({});
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !password || !numero_cedula) {
      setMensaje("Complete todos los campos obligatorios");
      return;
    }

    if (gradosSeleccionados.length === 0) {
      setMensaje("Debe asignar al menos un grado al profesor");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("especialidad", especialidad);
      formData.append("contacto", contacto);
      formData.append("numero_cedula", numero_cedula);
      formData.append("direccion", direccion);
      formData.append("fecha_nacimiento", fecha_nacimiento);
      formData.append("genero", genero);
      formData.append("titulo_academico", titulo_academico);
      formData.append("años_experiencia", años_experiencia);
      formData.append("grados", JSON.stringify(gradosSeleccionados));
      formData.append("secciones", JSON.stringify(seccionesSeleccionadas));
      if (imagen) formData.append("imagen", imagen);

      // Guardar credenciales antes de limpiar el formulario
      const credencialesTemp = {email, password};

      const response = await api.post("/api/profesores", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMensaje("Profesor registrado correctamente");
      setShowModal(false);

      // Mostrar modal con credenciales
      setNewCredentials(credencialesTemp);
      setShowCredentialsModal(true);

      limpiarFormulario();
      fetchProfesores();
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar profesor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este profesor?")) return;
    try {
      await api.delete(`/api/profesores/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Profesor eliminado correctamente");
      fetchProfesores();
    } catch (err) {
      setMensaje("Error al eliminar profesor");
    }
  };

  const handleVerDetalle = (profesor) => {
    navigate(`/profesores/detalle/${profesor.id_profesor}`);
  };

  const handleEditar = async (profesor) => {
    try {
      // Cargar datos del profesor
      setProfesorEditar(profesor);
      setNombre(profesor.nombre || "");
      setApellido(profesor.apellido || "");
      setEmail(profesor.email || "");
      setEspecialidad(profesor.especialidad || "");
      setContacto(profesor.contacto || "");
      setNumeroCedula(profesor.numero_cedula || "");
      setDireccion(profesor.direccion || "");
      setFechaNacimiento(profesor.fecha_nacimiento || "");
      setGenero(profesor.genero || "");
      setTituloAcademico(profesor.titulo_academico || "");
      setAñosExperiencia(profesor.años_experiencia || "");

      // Cargar asignaciones del profesor
      const asignacionesRes = await api.get(
        `/api/profesores/${profesor.id_profesor}/asignaciones`,
        {headers: {Authorization: `Bearer ${token}`}}
      );

      const asignaciones = asignacionesRes.data.asignaciones || [];
      const gradosIds = [...new Set(asignaciones.map((a) => a.id_grado))];
      setGradosSeleccionados(gradosIds);

      // Mapear secciones por grado
      const seccionesPorGrado = {};
      asignaciones.forEach((a) => {
        if (!seccionesPorGrado[a.id_grado]) {
          seccionesPorGrado[a.id_grado] = [];
        }
        if (
          a.id_seccion &&
          !seccionesPorGrado[a.id_grado].includes(a.id_seccion)
        ) {
          seccionesPorGrado[a.id_grado].push(a.id_seccion);
        }
      });
      setSeccionesSeleccionadas(seccionesPorGrado);

      setShowEditModal(true);
    } catch (err) {
      console.error("Error al cargar datos del profesor:", err);
      setMensaje("Error al cargar datos del profesor");
    }
  };

  const handleActualizar = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !numero_cedula) {
      setMensaje("Complete todos los campos obligatorios");
      return;
    }

    if (gradosSeleccionados.length === 0) {
      setMensaje("Debe asignar al menos un grado al profesor");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("email", email);
      if (password) formData.append("password", password);
      formData.append("especialidad", especialidad);
      formData.append("contacto", contacto);
      formData.append("numero_cedula", numero_cedula);
      formData.append("direccion", direccion);
      formData.append("fecha_nacimiento", fecha_nacimiento);
      formData.append("genero", genero);
      formData.append("titulo_academico", titulo_academico);
      formData.append("años_experiencia", años_experiencia);
      formData.append("grados", JSON.stringify(gradosSeleccionados));
      formData.append("secciones", JSON.stringify(seccionesSeleccionadas));
      if (imagen) formData.append("imagen", imagen);

      await api.put(`/api/profesores/${profesorEditar.id_profesor}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMensaje("Profesor actualizado correctamente");
      setShowEditModal(false);
      limpiarFormulario();
      setProfesorEditar(null);
      fetchProfesores();
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al actualizar profesor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const profesoresFiltrados = profesores.filter(
    (prof) =>
      prof.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prof.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Header Moderno y Compacto */}
      <PageHeader
        title="Gestión de Profesores"
        subtitle="Administra el personal docente de tu institución"
        icon={AcademicCapIcon}
        gradientFrom="purple-600"
        gradientTo="blue-600"
        badge="Personal Docente"
        schoolLogo={
          escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
        }
        schoolName={escuela?.nombre}
        stats={{
          "Total Profesores": profesores.length,
          Activos: profesores.filter((p) => p.activo !== false).length,
        }}
        actions={
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Agregar Profesor</span>
          </button>
        }
      />

      {/* Mensaje */}
      {mensaje && (
        <div className="max-w-7xl mx-auto mb-6">
          <div
            className={`p-4 rounded-xl ${
              mensaje.includes("Error")
                ? "bg-red-500/10 border border-red-500/20 text-red-300"
                : "bg-green-500/10 border border-green-500/20 text-green-300"
            }`}
          >
            {mensaje}
          </div>
        </div>
      )}

      {/* Búsqueda y Filtros */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o especialidad..."
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Profesores */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando profesores...</p>
          </div>
        ) : profesoresFiltrados.length === 0 ? (
          <div className="bg-gray-800 rounded-2xl shadow-xl p-12 text-center border border-gray-700">
            <AcademicCapIcon className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">
              No hay profesores registrados
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profesoresFiltrados.map((profesor) => (
              <div
                key={profesor.id_profesor}
                className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Header con imagen */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 relative">
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        profesor.imagen
                          ? `http://localhost:4000${profesor.imagen}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              profesor.nombre + " " + profesor.apellido
                            )}&background=8B5CF6&color=fff&size=128`
                      }
                      alt={`${profesor.nombre} ${profesor.apellido}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">
                        {profesor.nombre} {profesor.apellido}
                      </h3>
                      <p className="text-purple-100 text-sm">
                        {profesor.especialidad || "Sin especialidad"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-6 space-y-3">
                  <div className="flex items-center space-x-3 text-gray-300">
                    <PhoneIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">
                      {profesor.contacto || "Sin contacto"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <IdentificationIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm">
                      {profesor.numero_cedula || "Sin cédula"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-300">
                    <UserIcon className="w-5 h-5 text-green-400" />
                    <span className="text-sm">
                      {profesor.email || "Sin email"}
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-between">
                  <button
                    onClick={() => handleVerDetalle(profesor)}
                    className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                    title="Ver detalles"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditar(profesor)}
                    className="p-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEliminar(profesor.id_profesor)}
                    className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Agregar Profesor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl my-8 border border-gray-700">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Registrar Nuevo Profesor
                  </h3>
                  <p className="text-purple-100 text-sm">
                    Complete la información del docente
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    limpiarFormulario();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleRegistrar}
              className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              {/* Información Personal */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Información Personal
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cédula de Identidad *
                    </label>
                    <input
                      type="text"
                      value={numero_cedula}
                      onChange={(e) => setNumeroCedula(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={fecha_nacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Género
                    </label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fotografía (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagen(e.target.files[0])}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                    />
                  </div>
                </div>
              </section>

              {/* Información Académica */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                    <AcademicCapIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Información Académica y Profesional
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Especialidad/Materia
                    </label>
                    <input
                      type="text"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Ej: Matemáticas, Lenguaje, Ciencias..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Título Académico
                    </label>
                    <input
                      type="text"
                      value={titulo_academico}
                      onChange={(e) => setTituloAcademico(e.target.value)}
                      placeholder="Ej: Licenciado en Educación"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      value={años_experiencia}
                      onChange={(e) => setAñosExperiencia(e.target.value)}
                      min="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Credenciales de Acceso */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Credenciales de Acceso al Sistema
                  </h2>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Importante:</strong> Estas credenciales permitirán
                    al profesor acceder al sistema. Asegúrese de comunicarlas de
                    forma segura.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email de Acceso *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="profesor@escuela.com"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength="6"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Asignación de Grados y Materias */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Asignación de Grados y Materias
                  </h2>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                  <p className="text-blue-300 text-sm">
                    <strong>Importante:</strong> Debe seleccionar al menos un
                    grado. El profesor solo tendrá acceso a los grados y
                    materias asignados.
                  </p>
                </div>

                {/* Selección de Grados */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Grados Asignados *
                  </label>
                  <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {grados.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">
                        No hay grados disponibles
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {grados.map((grado) => (
                          <label
                            key={grado.id_grado}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={gradosSeleccionados.includes(
                                grado.id_grado
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGradosSeleccionados([
                                    ...gradosSeleccionados,
                                    grado.id_grado,
                                  ]);
                                } else {
                                  setGradosSeleccionados(
                                    gradosSeleccionados.filter(
                                      (id) => id !== grado.id_grado
                                    )
                                  );
                                }
                              }}
                              className="w-5 h-5 text-indigo-500 border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-white">
                              {grado.nombre ||
                                grado.nombre_grado ||
                                "Sin nombre"}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {gradosSeleccionados.length} grado(s) seleccionado(s)
                  </p>
                </div>

                {/* Selección de Secciones por Grado */}
                {gradosSeleccionados.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Secciones Asignadas (Opcional)
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Selecciona las secciones específicas para cada grado. Si
                      no seleccionas ninguna, el profesor tendrá acceso a todas
                      las secciones del grado.
                    </p>
                    <div className="space-y-4">
                      {gradosSeleccionados.map((gradoId) => {
                        const grado = grados.find(
                          (g) => g.id_grado === gradoId
                        );
                        const seccionesDelGrado = secciones.filter(
                          (s) => s.id_grado === gradoId
                        );

                        return (
                          <div
                            key={gradoId}
                            className="bg-gray-800 border border-gray-600 rounded-xl p-4"
                          >
                            <h4 className="text-white font-semibold mb-3">
                              {grado?.nombre ||
                                grado?.nombre_grado ||
                                "Grado sin nombre"}
                            </h4>
                            {seccionesDelGrado.length === 0 ? (
                              <p className="text-gray-400 text-sm">
                                No hay secciones disponibles para este grado
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {seccionesDelGrado.map((seccion) => (
                                  <label
                                    key={seccion.id_seccion}
                                    className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        seccionesSeleccionadas[
                                          gradoId
                                        ]?.includes(seccion.id_seccion) || false
                                      }
                                      onChange={(e) => {
                                        const newSecciones = {
                                          ...seccionesSeleccionadas,
                                        };
                                        if (!newSecciones[gradoId]) {
                                          newSecciones[gradoId] = [];
                                        }
                                        if (e.target.checked) {
                                          newSecciones[gradoId] = [
                                            ...newSecciones[gradoId],
                                            seccion.id_seccion,
                                          ];
                                        } else {
                                          newSecciones[gradoId] = newSecciones[
                                            gradoId
                                          ].filter(
                                            (id) => id !== seccion.id_seccion
                                          );
                                        }
                                        setSeccionesSeleccionadas(newSecciones);
                                      }}
                                      className="w-4 h-4 text-indigo-500 border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-white text-sm">
                                      {seccion.nombre_seccion ||
                                        seccion.nombre ||
                                        "Sección sin nombre"}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Botones */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-700 sticky bottom-0 bg-gray-900 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    limpiarFormulario();
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
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
                    "Registrar Profesor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Profesor */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl my-8 border border-gray-700">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-600 to-orange-600 px-8 py-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Editar Profesor
                  </h3>
                  <p className="text-yellow-100 text-sm">
                    Actualice la información del docente
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    limpiarFormulario();
                    setProfesorEditar(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleActualizar}
              className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              {/* Información Personal */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Información Personal
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={apellido}
                      onChange={(e) => setApellido(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Cédula de Identidad *
                    </label>
                    <input
                      type="text"
                      value={numero_cedula}
                      onChange={(e) => setNumeroCedula(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={fecha_nacimiento}
                      onChange={(e) => setFechaNacimiento(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Género
                    </label>
                    <select
                      value={genero}
                      onChange={(e) => setGenero(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value="">Seleccionar</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fotografía (Opcional)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImagen(e.target.files[0])}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-500 file:text-white hover:file:bg-yellow-600"
                    />
                  </div>
                </div>
              </section>

              {/* Información Académica */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                    <AcademicCapIcon className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Información Académica y Profesional
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Especialidad/Materia
                    </label>
                    <input
                      type="text"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Ej: Matemáticas, Lenguaje, Ciencias..."
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Título Académico
                    </label>
                    <input
                      type="text"
                      value={titulo_academico}
                      onChange={(e) => setTituloAcademico(e.target.value)}
                      placeholder="Ej: Licenciado en Educación"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      value={años_experiencia}
                      onChange={(e) => setAñosExperiencia(e.target.value)}
                      min="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </section>

              {/* Credenciales de Acceso */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Credenciales de Acceso al Sistema
                  </h2>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
                  <p className="text-yellow-300 text-sm">
                    <strong>Importante:</strong> Deja la contraseña vacía si no
                    deseas cambiarla.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email de Acceso *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="profesor@escuela.com"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nueva Contraseña (Opcional)
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Dejar vacío para no cambiar"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </section>

              {/* Asignación de Grados y Secciones */}
              <section>
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Asignación de Grados y Secciones
                  </h2>
                </div>

                {/* Selección de Grados */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Grados Asignados *
                  </label>
                  <div className="bg-gray-800 border border-gray-600 rounded-xl p-4 max-h-60 overflow-y-auto">
                    {grados.length === 0 ? (
                      <p className="text-gray-400 text-center py-4">
                        No hay grados disponibles
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {grados.map((grado) => (
                          <label
                            key={grado.id_grado}
                            className="flex items-center p-3 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={gradosSeleccionados.includes(
                                grado.id_grado
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGradosSeleccionados([
                                    ...gradosSeleccionados,
                                    grado.id_grado,
                                  ]);
                                } else {
                                  setGradosSeleccionados(
                                    gradosSeleccionados.filter(
                                      (id) => id !== grado.id_grado
                                    )
                                  );
                                }
                              }}
                              className="w-5 h-5 text-indigo-500 border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-white">
                              {grado.nombre ||
                                grado.nombre_grado ||
                                "Sin nombre"}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    {gradosSeleccionados.length} grado(s) seleccionado(s)
                  </p>
                </div>

                {/* Selección de Secciones por Grado */}
                {gradosSeleccionados.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Secciones Asignadas (Opcional)
                    </label>
                    <p className="text-gray-400 text-sm mb-3">
                      Selecciona las secciones específicas para cada grado. Si
                      no seleccionas ninguna, el profesor tendrá acceso a todas
                      las secciones del grado.
                    </p>
                    <div className="space-y-4">
                      {gradosSeleccionados.map((gradoId) => {
                        const grado = grados.find(
                          (g) => g.id_grado === gradoId
                        );
                        const seccionesDelGrado = secciones.filter(
                          (s) => s.id_grado === gradoId
                        );

                        return (
                          <div
                            key={gradoId}
                            className="bg-gray-800 border border-gray-600 rounded-xl p-4"
                          >
                            <h4 className="text-white font-semibold mb-3">
                              {grado?.nombre ||
                                grado?.nombre_grado ||
                                "Grado sin nombre"}
                            </h4>
                            {seccionesDelGrado.length === 0 ? (
                              <p className="text-gray-400 text-sm">
                                No hay secciones disponibles para este grado
                              </p>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {seccionesDelGrado.map((seccion) => (
                                  <label
                                    key={seccion.id_seccion}
                                    className="flex items-center p-2 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        seccionesSeleccionadas[
                                          gradoId
                                        ]?.includes(seccion.id_seccion) || false
                                      }
                                      onChange={(e) => {
                                        const newSecciones = {
                                          ...seccionesSeleccionadas,
                                        };
                                        if (!newSecciones[gradoId]) {
                                          newSecciones[gradoId] = [];
                                        }
                                        if (e.target.checked) {
                                          newSecciones[gradoId] = [
                                            ...newSecciones[gradoId],
                                            seccion.id_seccion,
                                          ];
                                        } else {
                                          newSecciones[gradoId] = newSecciones[
                                            gradoId
                                          ].filter(
                                            (id) => id !== seccion.id_seccion
                                          );
                                        }
                                        setSeccionesSeleccionadas(newSecciones);
                                      }}
                                      className="w-4 h-4 text-indigo-500 border-gray-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="ml-2 text-white text-sm">
                                      {seccion.nombre_seccion ||
                                        seccion.nombre ||
                                        "Sección sin nombre"}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Botones */}
              <div className="flex justify-between items-center pt-6 border-t border-gray-700 sticky bottom-0 bg-gray-900 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    limpiarFormulario();
                    setProfesorEditar(null);
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Actualizando...
                    </div>
                  ) : (
                    "Actualizar Profesor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Credenciales */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md border border-green-500/30">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white text-center mt-4">
                ¡Profesor Registrado!
              </h3>
              <p className="text-green-100 text-center text-sm mt-2">
                Credenciales de acceso generadas
              </p>
            </div>

            <div className="p-8 space-y-6">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-300 text-sm text-center">
                  <strong>⚠️ Importante:</strong> Guarde estas credenciales de
                  forma segura. El profesor las necesitará para acceder al
                  sistema.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    EMAIL DE ACCESO
                  </label>
                  <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <span className="text-white font-mono text-sm">
                      {newCredentials.email}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCredentials.email);
                        setMensaje("Email copiado al portapapeles");
                      }}
                      className="ml-2 p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Copiar email"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                  <label className="block text-xs font-medium text-gray-400 mb-2">
                    CONTRASEÑA
                  </label>
                  <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <span className="text-white font-mono text-sm">
                      {newCredentials.password}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(newCredentials.password);
                        setMensaje("Contraseña copiada al portapapeles");
                      }}
                      className="ml-2 p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title="Copiar contraseña"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <p className="text-blue-300 text-xs text-center">
                  💡 El profesor puede cambiar su contraseña después de iniciar
                  sesión
                </p>
              </div>

              <button
                onClick={() => setShowCredentialsModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profesores;
