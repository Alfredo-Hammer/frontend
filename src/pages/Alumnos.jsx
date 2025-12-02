import {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import {useNavigate, useSearchParams} from "react-router-dom";
import {departamentos, municipiosPorDepartamento} from "../data/nicaragua";
import PageHeader from "../components/PageHeader";

const API_BASE_URL = "http://localhost:4000";

function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [escuelas, setEscuelas] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  // Nuevos estados para funcionalidades adicionales
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEscuela, setFilterEscuela] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [viewMode, setViewMode] = useState("table"); // "table" or "cards"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isLoading, setIsLoading] = useState(true);

  // Formulario alumno
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
  const [imagenFile, setImagenFile] = useState(null);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [alumnoEditar, setAlumnoEditar] = useState(null);

  // Estados para el reporte
  const [mostrarVistaReporte, setMostrarVistaReporte] = useState(false);
  const [datosEscuela, setDatosEscuela] = useState(null);

  // Estado para usuario
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Cargar alumnos al inicio
  useEffect(() => {
    fetchUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user) {
      fetchAlumnos();
    }
    // eslint-disable-next-line
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
      });

      // Cargar información de la escuela
      if (res.data.usuario?.id_escuela || res.data.id_escuela) {
        const escuelaId = res.data.usuario?.id_escuela || res.data.id_escuela;
        const escuelaRes = await api.get(`/api/escuelas/${escuelaId}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  };

  // Cargar escuelas al abrir modal
  useEffect(() => {
    if (showModal) {
      fetchEscuelas();
    }
    // eslint-disable-next-line
  }, [showModal]);

  // Cargar grados cuando cambia escuela
  useEffect(() => {
    if (escuelaId) {
      fetchGrados(escuelaId);
    } else {
      setGrados([]);
      setGradoId("");
    }
    // eslint-disable-next-line
  }, [escuelaId]);

  // Cargar secciones cuando cambia grado
  useEffect(() => {
    if (gradoId) {
      fetchSecciones(gradoId);
    } else {
      setSecciones([]);
      setSeccionId("");
    }
    // eslint-disable-next-line
  }, [gradoId]);

  // Efecto para cargar datos al editar
  useEffect(() => {
    if (showEditModal && alumnoEditar) {
      // Cargar escuelas si no están cargadas
      if (escuelas.length === 0) fetchEscuelas();
      // Cargar grados y secciones según el alumno a editar
      if (alumnoEditar.escuelaId) fetchGrados(alumnoEditar.escuelaId);
      if (alumnoEditar.gradoId) fetchSecciones(alumnoEditar.gradoId);
    }
    // eslint-disable-next-line
  }, [showEditModal, alumnoEditar]);

  const fetchAlumnos = async () => {
    setIsLoading(true);
    setError(""); // Limpiar errores previos

    // Validar que existe el token
    if (!token) {
      setError(
        "No se encontró token de autenticación. Por favor, inicia sesión nuevamente."
      );
      setIsLoading(false);
      navigate("/login");
      return;
    }

    try {
      const res = await api.get("/api/alumnos", {
        headers: {Authorization: `Bearer ${token}`},
      });

      // Validar que la respuesta sea un array
      if (!Array.isArray(res.data)) {
        setError("Formato de datos incorrecto recibido del servidor.");
        setAlumnos([]);
      } else {
        let alumnosData = res.data;

        // Si es profesor, filtrar solo los alumnos de sus grados asignados
        if (user?.rol?.toLowerCase() === "profesor" && user?.id_profesor) {
          try {
            const asignacionesRes = await api.get(
              `/api/profesores/${user.id_profesor}/asignaciones`,
              {headers: {Authorization: `Bearer ${token}`}}
            );

            const gradosProfesor = asignacionesRes.data.asignaciones.map(
              (a) => a.id_grado
            );

            // Verificar si viene un grado específico desde la URL
            const gradoFromUrl = searchParams.get("grado");

            if (gradoFromUrl) {
              // Filtrar solo por el grado específico
              alumnosData = alumnosData.filter(
                (alumno) => alumno.gradoid === parseInt(gradoFromUrl)
              );
              console.log(`👨‍🎓 Alumnos del grado ${gradoFromUrl}:`, alumnosData);
            } else {
              // Filtrar por todos los grados del profesor
              alumnosData = alumnosData.filter((alumno) =>
                gradosProfesor.includes(alumno.gradoid)
              );
              console.log(
                "👨‍🎓 Alumnos de todos los grados del profesor:",
                alumnosData
              );
            }

            console.log("🎓 Grados del profesor:", gradosProfesor);
          } catch (error) {
            console.error("Error al filtrar alumnos del profesor:", error);
          }
        }

        setAlumnos(alumnosData);
        setError(""); // Limpiar error si todo sale bien
      }
    } catch (err) {
      console.error("Error al obtener alumnos:", err);

      // Manejo más específico de errores
      if (err.response) {
        // Error de respuesta del servidor
        const status = err.response.status;
        const message =
          err.response.data?.message ||
          err.response.data?.error ||
          "Error desconocido";

        switch (status) {
          case 401:
            setError(
              "Token de autenticación inválido o expirado. Por favor, inicia sesión nuevamente."
            );
            localStorage.removeItem("token");
            setTimeout(() => navigate("/login"), 2000);
            break;
          case 403:
            setError("No tienes permisos para acceder a esta información.");
            break;
          case 404:
            setError(
              "Endpoint no encontrado. Verifica la configuración del servidor."
            );
            break;
          case 500:
            setError(`Error interno del servidor: ${message}`);
            break;
          default:
            setError(`Error del servidor (${status}): ${message}`);
        }
      } else if (err.request) {
        // Error de red - no se recibió respuesta
        setError(
          "No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté funcionando."
        );
      } else {
        // Error en la configuración de la petición
        setError(`Error en la petición: ${err.message}`);
      }

      setAlumnos([]); // Asegurar que alumnos esté vacío en caso de error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEscuelas = async () => {
    if (!token) {
      setMensaje("Token de autenticación no válido");
      return;
    }

    try {
      const res = await api.get("/api/escuelas", {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (Array.isArray(res.data)) {
        setEscuelas(res.data);
        if (res.data.length > 0) setEscuelaId(res.data[0].id_escuela);
      } else {
        setMensaje("Error en el formato de datos de escuelas");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Error al cargar escuelas";
      setMensaje(message);
    }
  };

  const fetchGrados = async (id_escuela) => {
    if (!token || !id_escuela) return;

    try {
      const res = await api.get("/api/grados", {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (Array.isArray(res.data)) {
        // Filtra grados por escuela seleccionada
        const gradosFiltrados = res.data.filter(
          (g) => String(g.id_escuela) === String(id_escuela)
        );
        setGrados(gradosFiltrados);
        if (gradosFiltrados.length > 0) setGradoId(gradosFiltrados[0].id_grado);
        else setGradoId("");
      } else {
        setMensaje("Error en el formato de datos de grados");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Error al cargar grados";
      setMensaje(message);
    }
  };

  const fetchSecciones = async (id_grado) => {
    if (!token || !id_grado) return;

    try {
      const res = await api.get("/api/secciones", {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (Array.isArray(res.data)) {
        // Filtra secciones por grado seleccionado
        const seccionesFiltradas = res.data.filter(
          (s) => String(s.id_grado) === String(id_grado)
        );
        setSecciones(seccionesFiltradas);
        if (seccionesFiltradas.length > 0)
          setSeccionId(seccionesFiltradas[0].id_seccion);
        else setSeccionId("");
      } else {
        setMensaje("Error en el formato de datos de secciones");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Error al cargar secciones";
      setMensaje(message);
    }
  };

  const handleRegistrar = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !gradoId || !seccionId) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }
    try {
      // Verificar si el email ya existe
      const verificarEmail = await api.get(`/api/alumnos`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const emailExistente = verificarEmail.data.some(
        (alumno) =>
          alumno.email && alumno.email.toLowerCase() === email.toLowerCase()
      );
      if (emailExistente) {
        setMensaje("El email ya está registrado. Por favor, usa otro.");
        return;
      }

      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("direccion_exacta", direccion_exacta);
      formData.append("email", email);
      formData.append("fecha_nacimiento", fecha_nacimiento);
      formData.append("codigo_mined", codigo_mined);
      formData.append("gradoid", gradoId);
      formData.append("seccionid", seccionId);
      formData.append("genero", genero);
      formData.append("nombre_padre", nombre_padre);
      formData.append("correo_padre", correo_padre);
      formData.append("telefono_padre", telefono_padre);
      formData.append("movil_alumno", movil_alumno);
      formData.append("turno", turno);
      formData.append("municipio", municipio);
      formData.append("departamento", departamento);
      formData.append("nivel_educativo", nivel_educativo);

      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }

      await api.post("/api/alumnos", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMensaje("Alumno registrado correctamente");
      setShowModal(false);
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
      setImagen("");
      setImagenFile(null);
      fetchAlumnos();
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar alumno");
    }
  };

  const handleEliminar = async (id_alumno) => {
    if (!window.confirm("¿Seguro que deseas eliminar este alumno?")) return;
    try {
      await api.delete(`/api/alumnos/${id_alumno}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMensaje("Alumno eliminado correctamente");
      fetchAlumnos();
    } catch (err) {
      setMensaje("Error al eliminar alumno");
    }
  };

  const handleActualizarAlumno = async (e) => {
    e.preventDefault();
    if (!alumnoEditar) return;

    try {
      // Verificar si el email ya existe en otro alumno
      const verificarEmail = await api.get(`/api/alumnos`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const emailExistente = verificarEmail.data.some(
        (alumno) =>
          alumno.email &&
          alumno.email.toLowerCase() === email.toLowerCase() &&
          alumno.id_estudiante !== alumnoEditar.id_estudiante
      );
      if (emailExistente) {
        setMensaje(
          "El email ya está registrado para otro alumno. Por favor, usa otro."
        );
        return;
      }

      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("apellido", apellido);
      formData.append("email", email);
      formData.append("direccion_exacta", direccion_exacta);
      formData.append("fecha_nacimiento", fecha_nacimiento);
      formData.append("codigo_mined", codigo_mined);
      formData.append("genero", genero);
      formData.append("nombre_padre", nombre_padre);
      formData.append("correo_padre", correo_padre);
      formData.append("telefono_padre", telefono_padre);
      formData.append("movil_alumno", movil_alumno);
      formData.append("turno", turno);
      formData.append("municipio", municipio);
      formData.append("departamento", departamento);
      formData.append("nivel_educativo", nivel_educativo);
      formData.append("gradoId", gradoId);
      formData.append("seccionId", seccionId);

      if (imagenFile) {
        formData.append("imagen", imagenFile);
      }

      await api.put(`/api/alumnos/${alumnoEditar.id_estudiante}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMensaje("Alumno actualizado correctamente");
      setShowEditModal(false);
      setAlumnoEditar(null);
      // Limpiar formulario
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
      setGradoId("");
      setSeccionId("");
      setImagen("");
      setImagenFile(null);
      fetchAlumnos();
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al actualizar alumno");
    }
  };

  const handleAbrirEditar = (alumno) => {
    setAlumnoEditar({...alumno});
    // Cargar los valores en los estados del formulario
    setNombre(alumno.nombre || "");
    setApellido(alumno.apellido || "");
    setEmail(alumno.email || "");
    setDireccionExacta(alumno.direccion_exacta || "");
    setFechaNacimiento(alumno.fecha_nacimiento || "");
    setCodigoMined(alumno.codigo_mined || "");
    setGenero(alumno.genero || "");
    setNombrePadre(alumno.nombre_padre || "");
    setCorreoPadre(alumno.correo_padre || "");
    setTelefonoPadre(alumno.telefono_padre || "");
    setMovilAlumno(alumno.movil_alumno || "");
    setTurno(alumno.turno || "");
    setMunicipio(alumno.municipio || "");
    setDepartamento(alumno.departamento || "");
    setNivelEducativo(alumno.nivel_educativo || "");
    setGradoId(alumno.gradoid || "");
    setSeccionId(alumno.seccionid || "");
    setShowEditModal(true);
  };

  // Función para generar reporte
  const generarReporte = async () => {
    try {
      // Cargar datos de la escuela si no están disponibles
      if (!datosEscuela && escuelas.length === 0) {
        await fetchEscuelas();
      }

      setDatosEscuela(escuelas[0] || null);
      setMostrarVistaReporte(true);
    } catch (error) {
      setMensaje("Error al generar el reporte");
    }
  };

  // Función para imprimir reporte
  const imprimirReporte = () => {
    window.print();
  };

  // Función para exportar a CSV
  const exportarCSV = () => {
    const headers = [
      "N°",
      "Código MINED",
      "Nombre Completo",
      "Email",
      "Escuela",
      "Grado",
      "Sección",
      "Género",
      "Fecha Nacimiento",
      "Teléfono",
    ];

    const rows = alumnosFiltrados.map((alumno, index) => [
      index + 1,
      alumno.codigo_mined || "Sin código",
      `${alumno.nombre} ${alumno.apellido}`,
      alumno.email,
      alumno.escuela || "Sin escuela",
      alumno.grado || "Sin grado",
      alumno.seccion || "Sin sección",
      alumno.genero || "No especificado",
      alumno.fecha_nacimiento
        ? new Date(alumno.fecha_nacimiento).toLocaleDateString()
        : "No registrada",
      alumno.movil_alumno || "Sin teléfono",
    ]);

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.map((field) => `"${field}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `reporte_alumnos_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensaje("Reporte CSV exportado correctamente");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl shadow-2xl border border-red-500/20 p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-4">
              Error al Cargar Datos
            </h2>
            <p className="text-red-300 text-sm mb-6 leading-relaxed">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setError("");
                  fetchAlumnos();
                }}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors duration-200"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar y paginar alumnos
  const alumnosFiltrados = alumnos.filter((alumno) => {
    const matchesSearch =
      alumno.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumno.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumno.codigo_mined &&
        alumno.codigo_mined.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesEscuela =
      filterEscuela === "" || alumno.escuela === filterEscuela;
    const matchesGrado = filterGrado === "" || alumno.grado === filterGrado;
    return matchesSearch && matchesEscuela && matchesGrado;
  });

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = alumnosFiltrados.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(alumnosFiltrados.length / itemsPerPage);

  // Estadísticas
  const estadisticas = {
    total: alumnos.length,
    masculino: alumnos.filter((a) => a.genero === "Masculino").length,
    femenino: alumnos.filter((a) => a.genero === "Femenino").length,
    escuelas: [...new Set(alumnos.map((a) => a.escuela).filter(Boolean))]
      .length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Moderno y Compacto */}
        <PageHeader
          title="Registro de Alumnos"
          subtitle="Gestiona la información completa de todos los estudiantes registrados"
          icon={UserIcon}
          gradientFrom="blue-600"
          gradientTo="indigo-600"
          badge="Gestión Estudiantil"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={{
            "Total de Alumnos": estadisticas.total,
            Masculinos: estadisticas.masculino,
            Femeninas: estadisticas.femenino,
            "Escuelas Activas": estadisticas.escuelas,
          }}
          actions={
            <>
              <button
                onClick={() => navigate("/alumnos/registro")}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Nuevo Alumno</span>
              </button>
              <button
                onClick={generarReporte}
                className="px-4 py-2 bg-white/20 text-white rounded-xl font-semibold backdrop-blur-sm hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
              >
                <AcademicCapIcon className="w-5 h-5" />
                <span>Reporte</span>
              </button>
            </>
          }
        />
        {mensaje && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-300 text-center backdrop-blur-sm">
            {mensaje}
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o código MINED..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                value={filterEscuela}
                onChange={(e) => setFilterEscuela(e.target.value)}
              >
                <option value="">Todas las escuelas</option>
                {[
                  ...new Set(alumnos.map((a) => a.escuela).filter(Boolean)),
                ].map((escuela) => (
                  <option key={escuela} value={escuela}>
                    {escuela}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
                value={filterGrado}
                onChange={(e) => setFilterGrado(e.target.value)}
              >
                <option value="">Todos los grados</option>
                {[...new Set(alumnos.map((a) => a.grado).filter(Boolean))].map(
                  (grado) => (
                    <option key={grado} value={grado}>
                      {grado}
                    </option>
                  )
                )}
              </select>

              <div className="flex bg-gray-700 rounded-xl p-1">
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("table")}
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "cards"
                      ? "bg-blue-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("cards")}
                >
                  <UserIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {alumnosFiltrados.length !== alumnos.length && (
            <div className="mt-4 text-sm text-gray-400">
              Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando alumnos...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          currentItems.length === 0 &&
          alumnosFiltrados.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">👨‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-300 mb-4">
                No hay alumnos registrados
              </h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Comienza registrando el primer alumno para comenzar con la
                gestión estudiantil.
              </p>
              <button
                onClick={() => navigate("/alumnos/registro")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5 mr-2 inline" />
                Registrar Primer Alumno
              </button>
            </div>
          )}

        {/* Filtered empty state */}
        {!isLoading && alumnosFiltrados.length === 0 && alumnos.length > 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No se encontraron alumnos
            </h3>
            <p className="text-gray-400">
              Intenta modificar los filtros de búsqueda
            </p>
          </div>
        )}

        {/* Vista de Tabla */}
        {!isLoading && currentItems.length > 0 && viewMode === "table" && (
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Foto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Código Mined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      PIN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Escuela
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Grado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Género
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentItems.map((alumno, idx) => (
                    <tr
                      key={alumno.id_estudiante}
                      className="hover:bg-gray-700 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {indexOfFirstItem + idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-12 h-12">
                          <img
                            src={
                              alumno.imagen
                                ? `${API_BASE_URL}${alumno.imagen}`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    alumno.nombre + " " + alumno.apellido
                                  )}&background=0D8ABC&color=fff`
                            }
                            alt="Alumno"
                            className="w-full h-full rounded-full object-cover border-2 border-blue-500 shadow-lg"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
                          {alumno.codigo_mined || "Sin código"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full">
                          {alumno.pin || "------"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {alumno.nombre} {alumno.apellido}
                        </div>
                        <div className="text-sm text-gray-400">
                          {alumno.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {alumno.escuela || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-full">
                          {alumno.grado || "-"}{" "}
                          {alumno.seccion && `- ${alumno.seccion}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            alumno.genero === "Masculino"
                              ? "bg-blue-500/20 text-blue-300"
                              : alumno.genero === "Femenino"
                              ? "bg-pink-500/20 text-pink-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {alumno.genero || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/alumnos/detalle/${alumno.id_estudiante}`
                              )
                            }
                            className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors duration-200"
                            title="Ver Detalle"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAbrirEditar(alumno)}
                            className="p-2 bg-yellow-500/20 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-colors duration-200"
                            title="Editar"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEliminar(alumno.id_estudiante)}
                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors duration-200"
                            title="Eliminar"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vista de Tarjetas */}
        {!isLoading && currentItems.length > 0 && viewMode === "cards" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentItems.map((alumno) => (
              <div
                key={alumno.id_estudiante}
                className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-blue-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group cursor-pointer"
                onClick={() =>
                  navigate(`/alumnos/detalle/${alumno.id_estudiante}`)
                }
              >
                {/* Header de la tarjeta */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 flex-shrink-0">
                      <img
                        src={
                          alumno.imagen
                            ? `${API_BASE_URL}${alumno.imagen}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                alumno.nombre + " " + alumno.apellido
                              )}&background=0D8ABC&color=fff`
                        }
                        alt="Alumno"
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white line-clamp-1">
                        {alumno.nombre} {alumno.apellido}
                      </h3>
                      <p className="text-blue-100 text-sm">{alumno.email}</p>
                    </div>
                  </div>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-blue-400 text-sm">#</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Código MINED</p>
                      <p className="text-white text-sm font-medium">
                        {alumno.codigo_mined || "Sin código"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-400 text-sm">🏫</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Escuela</p>
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {alumno.escuela || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                      <span className="text-yellow-400 text-sm">📚</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Grado y Sección</p>
                      <p className="text-white text-sm font-medium">
                        {alumno.grado || "-"}{" "}
                        {alumno.seccion && `- ${alumno.seccion}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <span className="text-purple-400 text-sm">👤</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Género</p>
                      <p className="text-white text-sm font-medium">
                        {alumno.genero || "-"}
                      </p>
                    </div>
                  </div>

                  {alumno.fecha_nacimiento && (
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">
                          Fecha de Nacimiento
                        </p>
                        <p className="text-white text-sm font-medium">
                          {new Date(
                            alumno.fecha_nacimiento
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="bg-gray-700 px-6 py-4 flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAbrirEditar(alumno);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium shadow-sm transform hover:scale-105 transition-all duration-200"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEliminar(alumno.id_estudiante);
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm transform hover:scale-105 transition-all duration-200"
                    title="Eliminar"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="text-sm text-gray-400">
              Mostrando {indexOfFirstItem + 1} a{" "}
              {Math.min(indexOfLastItem, alumnosFiltrados.length)} de{" "}
              {alumnosFiltrados.length} alumnos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } transition-colors duration-200`}
              >
                Anterior
              </button>

              <div className="flex space-x-1">
                {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      } transition-colors duration-200`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                } transition-colors duration-200`}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
        {/* Modal para registrar/editar alumno */}
        {(showModal || (showEditModal && alumnoEditar)) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-700">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {showEditModal && alumnoEditar
                        ? "Editar Alumno"
                        : "Registrar Nuevo Alumno"}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {showEditModal && alumnoEditar
                        ? "Actualice la información del estudiante"
                        : "Complete la información del estudiante"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setShowEditModal(false);
                      setAlumnoEditar(null);
                      setImagen("");
                      setImagenFile(null);
                      setMunicipiosFiltrados([]);
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
                  >
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <form
                onSubmit={
                  showEditModal && alumnoEditar
                    ? handleActualizarAlumno
                    : handleRegistrar
                }
                className="p-8 space-y-8"
              >
                {/* Datos del Alumno */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                      <UserIcon className="w-5 h-5 text-blue-400" />
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
                        placeholder="Ingrese el nombre"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={fecha_nacimiento}
                        onChange={(e) => setFechaNacimiento(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Género
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                      >
                        <option value="">Seleccionar género</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Código MINED
                      </label>
                      <input
                        type="text"
                        placeholder="Código asignado por MINED"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={codigo_mined}
                        onChange={(e) => setCodigoMined(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        placeholder="correo@ejemplo.com"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fotografía del Estudiante
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setImagenFile(file);
                            setImagen(file.name);
                          }
                        }}
                      />
                      {imagen && (
                        <p className="text-sm text-gray-400 mt-2">
                          Archivo: {imagen}
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                {/* Información Académica */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-5 h-5 text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Información Académica
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Escuela *
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={gradoId}
                        onChange={(e) => setGradoId(e.target.value)}
                        required
                        disabled={!grados.length}
                      >
                        <option value="">Seleccionar grado</option>
                        {grados.map((g) => (
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
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={seccionId}
                        onChange={(e) => setSeccionId(e.target.value)}
                        required
                        disabled={!secciones.length}
                      >
                        <option value="" className="text-white">
                          Seleccionar sección
                        </option>
                        {secciones.map((s) => (
                          <option
                            key={s.id_seccion}
                            value={s.id_seccion}
                            className="text-white"
                          >
                            {s.nombre}
                          </option>
                        ))}
                      </select>
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
                    <h2 className="text-xl font-bold text-white">
                      Información de Contacto
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        placeholder="Dirección completa"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={direccion_exacta}
                        onChange={(e) => setDireccionExacta(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Departamento
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={departamento}
                        onChange={(e) => {
                          const dept = e.target.value;
                          setDepartamento(dept);
                          setMunicipiosFiltrados(
                            dept ? municipiosPorDepartamento[dept] || [] : []
                          );
                          setMunicipio("");
                        }}
                      >
                        <option value="" className="text-white">
                          Seleccionar departamento
                        </option>
                        {departamentos.map((d) => (
                          <option
                            key={d.value}
                            value={d.value}
                            className="text-white"
                          >
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Municipio
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={municipio}
                        onChange={(e) => setMunicipio(e.target.value)}
                        disabled={!departamento}
                      >
                        <option value="" className="text-white">
                          {departamento
                            ? "Seleccionar municipio"
                            : "Primero seleccione departamento"}
                        </option>
                        {municipiosFiltrados.map((m) => (
                          <option key={m} value={m} className="text-white">
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Teléfono del Alumno
                      </label>
                      <input
                        type="text"
                        placeholder="Número de contacto"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
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
                    <h2 className="text-xl font-bold text-white">
                      Información del Tutor/Padre
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre del Tutor
                      </label>
                      <input
                        type="text"
                        value={nombre_padre}
                        onChange={(e) => setNombrePadre(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                        placeholder="Nombre completo del padre/tutor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Teléfono del Tutor
                      </label>
                      <input
                        type="text"
                        value={telefono_padre}
                        onChange={(e) => setTelefonoPadre(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                        placeholder="Número de contacto del tutor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email del Tutor
                      </label>
                      <input
                        type="email"
                        value={correo_padre}
                        onChange={(e) => setCorreoPadre(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                        placeholder="correo@tutor.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Turno
                      </label>
                      <select
                        value={alumnoEditar.turno || ""}
                        onChange={(e) =>
                          setAlumnoEditar({
                            ...alumnoEditar,
                            turno: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                      >
                        <option value="">Seleccionar turno</option>
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noche">Noche</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Información Académica (Solo visualización) */}
                <section>
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center mr-3">
                      <AcademicCapIcon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      Información Académica
                      <span className="text-sm text-gray-400 ml-2">
                        (Solo consulta - Contacta administrador para cambios)
                      </span>
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Escuela Actual
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-300 cursor-not-allowed">
                        {alumnoEditar.escuela || "No asignada"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Grado Actual
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-300 cursor-not-allowed">
                        {alumnoEditar.grado || "No asignado"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sección Actual
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-300 cursor-not-allowed">
                        {alumnoEditar.seccion || "No asignada"}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Botones */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-700">
                  <div className="text-sm text-gray-400">
                    <span className="font-medium">Nota:</span> Los cambios
                    académicos requieren autorización del administrador
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Vista de Reporte */}
        {mostrarVistaReporte && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-white print-preview">
            <div className="max-w-5xl mx-auto p-8 print:p-0 print:max-w-none print:mx-0 preview-content">
              {/* Header del reporte */}
              <div className="flex items-start justify-between mb-6 print:mb-4 border-b-2 border-gray-300 pb-4 print:pb-3">
                <div className="flex items-center space-x-6">
                  {/* Logo de la escuela */}
                  <div className="flex-shrink-0">
                    {datosEscuela && datosEscuela.logo ? (
                      <img
                        src={`http://localhost:4000/uploads/logos/${datosEscuela.logo}`}
                        alt="Logo de la escuela"
                        className="w-20 h-20 object-contain print:w-16 print:h-16"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center print:w-16 print:h-16"
                      style={{
                        display: datosEscuela?.logo ? "none" : "flex",
                      }}
                    >
                      <svg
                        className="w-12 h-12 text-white print:w-10 print:h-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Información de la escuela */}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                      {datosEscuela
                        ? datosEscuela.nombre
                        : "Sistema de Gestión Escolar"}
                    </h1>
                    {datosEscuela && (
                      <>
                        <p className="text-gray-600 flex items-center mb-1 print:text-xs">
                          📍{" "}
                          {datosEscuela.direccion || "Dirección no disponible"}
                        </p>
                        {datosEscuela.telefono && (
                          <p className="text-gray-600 flex items-center mb-1 print:text-xs">
                            📞 {datosEscuela.telefono}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Información del reporte */}
                <div className="text-right text-sm text-gray-600 print:text-xs">
                  <p className="flex items-center justify-end mb-1">
                    📅 {new Date().toLocaleDateString()}
                  </p>
                  <p className="font-semibold text-base print:text-sm">
                    REPORTE DE ALUMNOS REGISTRADOS
                  </p>
                  <p className="print:text-xs">Año Académico 2025</p>
                </div>
              </div>

              {/* Estadísticas del reporte */}
              <div className="mb-6 print:mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 print:text-base print:mb-3">
                  📊 Resumen Estadístico
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 print:gap-3 print:mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 print:rounded-none print:p-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center print:w-6 print:h-6">
                        <UserIcon className="w-4 h-4 text-blue-600 print:w-3 print:h-3" />
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-blue-600 font-medium">
                          Total Alumnos
                        </p>
                        <p className="text-lg font-bold text-blue-900 print:text-base">
                          {estadisticas.total}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200 print:rounded-none print:p-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center print:w-6 print:h-6">
                        👦
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-green-600 font-medium">
                          Masculinos
                        </p>
                        <p className="text-lg font-bold text-green-900 print:text-base">
                          {estadisticas.masculino}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 print:rounded-none print:p-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-pink-500/20 rounded-full flex items-center justify-center print:w-6 print:h-6">
                        👧
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-pink-600 font-medium">
                          Femeninas
                        </p>
                        <p className="text-lg font-bold text-pink-900 print:text-base">
                          {estadisticas.femenino}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 print:rounded-none print:p-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center print:w-6 print:h-6">
                        🏫
                      </div>
                      <div className="ml-3">
                        <p className="text-xs text-purple-600 font-medium">
                          Escuelas
                        </p>
                        <p className="text-lg font-bold text-purple-900 print:text-base">
                          {estadisticas.escuelas}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de alumnos */}
              <div className="mb-6 print:mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 print:text-base print:mb-3">
                  📋 Listado de Alumnos Registrados
                </h3>

                <div className="overflow-x-auto border border-gray-300 rounded-lg print:rounded-none">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-gray-100 print:bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          #
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Código MINED
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Nombre Completo
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Escuela
                        </th>
                        <th className="px-3 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Grado
                        </th>
                        <th className="px-3 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Sección
                        </th>
                        <th className="px-3 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Género
                        </th>
                        <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosFiltrados.map((alumno, idx) => (
                        <tr
                          key={alumno.id_estudiante}
                          className={`border-b border-gray-200 ${
                            idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-900 print:px-2 print:py-1">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2 text-gray-900 print:px-2 print:py-1 font-medium">
                            {alumno.codigo_mined || "Sin código"}
                          </td>
                          <td className="px-3 py-2 text-gray-900 print:px-2 print:py-1 font-medium">
                            {alumno.nombre} {alumno.apellido}
                          </td>
                          <td className="px-3 py-2 text-gray-900 print:px-2 print:py-1">
                            {alumno.escuela || "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900 print:px-2 print:py-1">
                            {alumno.grado || "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900 print:px-2 print:py-1">
                            {alumno.seccion || "-"}
                          </td>
                          <td className="px-3 py-2 text-center text-gray-900 print:px-2 print:py-1">
                            {alumno.genero || "-"}
                          </td>
                          <td className="px-3 py-2 text-gray-900 print:px-2 print:py-1">
                            {alumno.email}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4 print:mt-6 print:pt-3">
                <p>
                  Este documento es generado automáticamente por el Sistema AOC
                  de Gestión Escolar
                </p>
                <p>
                  Fecha de generación: {new Date().toLocaleDateString()} - Total
                  de registros: {alumnosFiltrados.length}
                </p>
              </div>

              {/* Botones de acción (solo visibles en pantalla) */}
              <div className="fixed bottom-6 right-6 space-y-3 print:hidden no-print">
                <button
                  onClick={() => setMostrarVistaReporte(false)}
                  className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-lg transition-colors"
                >
                  Cerrar Vista Previa
                </button>
                <button
                  onClick={imprimirReporte}
                  className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-colors flex items-center justify-center"
                >
                  🖨️ Imprimir Reporte
                </button>
                <button
                  onClick={exportarCSV}
                  className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-lg transition-colors flex items-center justify-center"
                >
                  📊 Exportar CSV
                </button>
              </div>
            </div>

            {/* Estilos específicos para impresión */}
            <style jsx>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-preview,
                .print-preview * {
                  visibility: visible;
                }
                .no-print {
                  display: none !important;
                }
                @page {
                  size: A4 landscape;
                  margin: 10mm;
                }
                html,
                body {
                  margin: 0;
                  padding: 0;
                  font-size: 10px;
                  line-height: 1.2;
                  color: black;
                  background: white;
                }
                .print-preview {
                  width: 100% !important;
                  max-width: none !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  color: black !important;
                }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

export default Alumnos;
