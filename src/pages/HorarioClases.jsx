import React, {useState, useEffect} from "react";
import axios from "axios";
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

// Constantes
const API_BASE_URL = "http://localhost:4000";

const DIAS_SEMANA = [
  {key: "lunes", label: "Lunes", short: "LUN"},
  {key: "martes", label: "Martes", short: "MAR"},
  {key: "miercoles", label: "Miércoles", short: "MIE"},
  {key: "jueves", label: "Jueves", short: "JUE"},
  {key: "viernes", label: "Viernes", short: "VIE"},
  {key: "sabado", label: "Sábado", short: "SAB"},
];

const HORAS_DISPONIBLES = [
  "07:00",
  "07:45",
  "08:30",
  "09:15",
  "10:00",
  "10:45",
  "11:30",
  "12:15",
  "13:00",
  "13:45",
  "14:30",
  "15:15",
  "16:00",
];

const MOCK_HORARIOS = [
  {
    id: 1,
    materia: "Matemáticas",
    profesor: "Dr. Juan Pérez",
    aula: "Aula 101",
    grado: "10mo A",
    dia: "lunes",
    horaInicio: "08:00",
    horaFin: "09:00",
    color: "#3b82f6",
    escuela: "Instituto Nacional",
  },
  {
    id: 2,
    materia: "Historia",
    profesor: "Lic. María González",
    aula: "Aula 201",
    grado: "10mo A",
    dia: "lunes",
    horaInicio: "09:00",
    horaFin: "10:00",
    color: "#10b981",
    escuela: "Instituto Nacional",
  },
  {
    id: 3,
    materia: "Física",
    profesor: "Ing. Carlos López",
    aula: "Lab. Ciencias",
    grado: "10mo A",
    dia: "martes",
    horaInicio: "08:00",
    horaFin: "09:00",
    color: "#f59e0b",
    escuela: "Instituto Nacional",
  },
  {
    id: 4,
    materia: "Inglés",
    profesor: "Prof. Ana Martínez",
    aula: "Aula 102",
    grado: "10mo A",
    dia: "miercoles",
    horaInicio: "10:00",
    horaFin: "11:00",
    color: "#8b5cf6",
    escuela: "Instituto Nacional",
  },
  {
    id: 5,
    materia: "Educación Física",
    profesor: "Prof. Roberto Silva",
    aula: "Gimnasio",
    grado: "10mo A",
    dia: "jueves",
    horaInicio: "14:00",
    horaFin: "15:00",
    color: "#ef4444",
    escuela: "Instituto Nacional",
  },
];

const MOCK_PROFESORES = [
  {id: 1, nombre: "Dr. Juan Pérez"},
  {id: 2, nombre: "Lic. María González"},
  {id: 3, nombre: "Ing. Carlos López"},
  {id: 4, nombre: "Prof. Ana Martínez"},
  {id: 5, nombre: "Prof. Roberto Silva"},
];

const MOCK_MATERIAS = [
  {id: 1, nombre: "Matemáticas", color: "#3b82f6"},
  {id: 2, nombre: "Historia", color: "#10b981"},
  {id: 3, nombre: "Física", color: "#f59e0b"},
  {id: 4, nombre: "Inglés", color: "#8b5cf6"},
  {id: 5, nombre: "Educación Física", color: "#ef4444"},
];

function HorarioClases() {
  // Estados
  const [horarios, setHorarios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [vistaActual, setVistaActual] = useState("semanal"); // 'semanal', 'lista', 'estadisticas'
  const [filtros, setFiltros] = useState({
    grado: "",
    profesor: "",
    materia: "",
    dia: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [formHorario, setFormHorario] = useState({
    id_grado: "",
    id_seccion: "",
    id_materia: "",
    id_profesor: "",
    dia_semana: "",
    hora_inicio: "",
    hora_fin: "",
    aula: "",
  });
  const [seccionesFiltradas, setSeccionesFiltradas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    total_clases: 0,
    profesores_activos: 0,
    materias_activas: 0,
    grados_con_horario: 0,
  });

  // Función para verificar si el usuario tiene permisos de edición
  const puedeEditar = () => {
    console.log("🔍 Verificando permisos...");
    console.log("   Usuario completo:", usuario);
    console.log("   Usuario existe?:", !!usuario);
    console.log("   ID Rol:", usuario?.id_rol);

    if (!usuario) {
      console.log("❌ No hay usuario");
      return false;
    }

    // IDs de roles que pueden editar:
    // 1 = Administrador
    // 5 = Secretariado
    const idRol = usuario.id_rol;
    const rolesPermitidos = [1, 5]; // Array para fácil extensión
    const resultado = rolesPermitidos.includes(idRol);
    console.log(
      "   Resultado:",
      resultado ? "✅ PUEDE EDITAR" : "❌ NO PUEDE EDITAR"
    );

    return resultado;
  };

  // Cargar datos iniciales
  useEffect(() => {
    // Decodificar el token para obtener los datos del usuario
    const token = localStorage.getItem("token");
    if (token) {
      try {
        // Decodificar manualmente el JWT (es solo base64)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const user = JSON.parse(jsonPayload);
        console.log("👤 Usuario decodificado del token:", user);
        console.log("🔑 Rol del usuario:", user?.rol);
        console.log("📋 Todas las propiedades del usuario:", Object.keys(user));
        setUsuario(user);
      } catch (error) {
        console.error("Error al decodificar el token:", error);
      }
    }

    cargarHorarios();
    cargarGrados();
    cargarProfesores();
    cargarMaterias();
    cargarEstadisticas();
  }, []);

  // Verificar permisos cuando cambia el usuario
  useEffect(() => {
    if (usuario) {
      console.log("🔄 Usuario actualizado, verificando permisos...");
      puedeEditar();
    }
  }, [usuario]);

  // Cargar horarios desde el backend
  const cargarHorarios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/horarios`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setHorarios(response.data);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      alert("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  // Cargar grados
  const cargarGrados = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/grados`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(response.data);
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  };

  // Cargar profesores
  const cargarProfesores = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/profesores`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setProfesores(response.data);
    } catch (error) {
      console.error("Error al cargar profesores:", error);
    }
  };

  // Cargar materias
  const cargarMaterias = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/materias`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMaterias(response.data);
    } catch (error) {
      console.error("Error al cargar materias:", error);
    }
  };

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/horarios/estadisticas`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setEstadisticas(response.data);
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  // Eliminar horario
  const eliminarHorario = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este horario?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/api/horarios/${id}`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      alert("Horario eliminado exitosamente");
      cargarHorarios();
      cargarEstadisticas();
    } catch (error) {
      console.error("Error al eliminar horario:", error);
      alert(error.response?.data?.error || "Error al eliminar horario");
    }
  };

  // Cargar secciones cuando se selecciona un grado
  const cargarSecciones = async (idGrado) => {
    console.log("📚 Cargando secciones para grado:", idGrado);
    if (!idGrado) {
      setSeccionesFiltradas([]);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_BASE_URL}/api/secciones?id_grado=${idGrado}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      console.log("✅ Secciones cargadas:", response.data);
      setSeccionesFiltradas(response.data);
    } catch (error) {
      console.error("❌ Error al cargar secciones:", error);
    }
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const {name, value} = e.target;
    console.log(`📝 Campo ${name} cambiado a:`, value);

    // Si cambia el grado, cargar secciones correspondientes
    if (name === "id_grado") {
      cargarSecciones(value);
      setFormHorario({...formHorario, id_grado: value, id_seccion: ""});
    } else {
      setFormHorario({...formHorario, [name]: value});
    }
  };

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setFormHorario({
      id_grado: "",
      id_seccion: "",
      id_materia: "",
      id_profesor: "",
      dia_semana: "",
      hora_inicio: "",
      hora_fin: "",
      aula: "",
    });
    setSeccionesFiltradas([]);
    setModalCrear(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (horario) => {
    setFormHorario({
      id_grado: horario.id_grado,
      id_seccion: horario.id_seccion || "",
      id_materia: horario.id_materia,
      id_profesor: horario.id_profesor,
      dia_semana: horario.dia_semana,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      aula: horario.aula || "",
    });
    cargarSecciones(horario.id_grado);
    setHorarioSeleccionado(horario);
    setModalEditar(true);
  };

  // Crear horario
  const crearHorario = async (e) => {
    e.preventDefault();
    console.log("📝 Intentando crear horario...");
    console.log("   Datos del formulario:", formHorario);

    try {
      const token = localStorage.getItem("token");
      console.log("   Token existe:", !!token);

      const response = await axios.post(
        `${API_BASE_URL}/api/horarios`,
        formHorario,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      console.log("✅ Horario creado exitosamente:", response.data);
      alert("Horario creado exitosamente");
      setModalCrear(false);
      cargarHorarios();
      cargarEstadisticas();
    } catch (error) {
      console.error("❌ Error al crear horario:", error);
      console.error("   Response data:", error.response?.data);
      console.error("   Response status:", error.response?.status);
      console.error("   Response headers:", error.response?.headers);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear horario"
      );
    }
  };

  // Actualizar horario
  const actualizarHorario = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE_URL}/api/horarios/${horarioSeleccionado.id_horario}`,
        formHorario,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      alert("Horario actualizado exitosamente");
      setModalEditar(false);
      cargarHorarios();
      cargarEstadisticas();
    } catch (error) {
      console.error("Error al actualizar horario:", error);
      alert(error.response?.data?.error || "Error al actualizar horario");
    }
  };

  // Filtrar horarios
  const horariosFiltrados = horarios.filter((horario) => {
    const matchBusqueda =
      busqueda === "" ||
      horario.nombre_materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.nombre_profesor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.aula?.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.nombre_grado?.toLowerCase().includes(busqueda.toLowerCase());

    const matchFiltros =
      (filtros.grado === "" ||
        horario.id_grado?.toString() === filtros.grado) &&
      (filtros.profesor === "" ||
        horario.id_profesor?.toString() === filtros.profesor) &&
      (filtros.materia === "" ||
        horario.id_materia?.toString() === filtros.materia) &&
      (filtros.dia === "" || horario.dia_semana === filtros.dia);

    return matchBusqueda && matchFiltros;
  });

  const obtenerHorariosPorDia = (dia) => {
    return horariosFiltrados
      .filter((horario) => horario.dia_semana === dia)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  const HorarioCard = ({horario, isSmall = false}) => (
    <div
      className={`${
        isSmall ? "p-2" : "p-4"
      } rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-105 group cursor-pointer bg-gray-700`}
      style={{
        borderLeftColor: horario.color_materia || "#3b82f6",
      }}
      onClick={() => setHorarioSeleccionado(horario)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4
            className={`${
              isSmall ? "text-sm" : "text-lg"
            } font-bold text-white mb-1 group-hover:text-gray-200 transition-colors`}
          >
            {horario.nombre_materia}
          </h4>
          <p
            className={`${
              isSmall ? "text-xs" : "text-sm"
            } text-gray-300 mb-2 flex items-center`}
          >
            <AcademicCapIcon
              className="h-4 w-4 mr-1"
              style={{color: horario.color_materia || "#3b82f6"}}
            />
            {horario.nombre_profesor}
          </p>
          <div className="space-y-1">
            <p
              className={`${
                isSmall ? "text-xs" : "text-sm"
              } text-gray-400 flex items-center`}
            >
              <ClockIcon className="h-3 w-3 mr-1" />
              {horario.hora_inicio?.substring(0, 5)} -{" "}
              {horario.hora_fin?.substring(0, 5)}
            </p>
            {!isSmall && (
              <>
                {horario.aula && (
                  <p className="text-sm text-gray-400 flex items-center">
                    <BuildingLibraryIcon className="h-3 w-3 mr-1" />
                    {horario.aula}
                  </p>
                )}
                <p className="text-sm text-gray-400 flex items-center">
                  <UserGroupIcon className="h-3 w-3 mr-1" />
                  {horario.nombre_grado}{" "}
                  {horario.nombre_seccion && `- ${horario.nombre_seccion}`}
                </p>
              </>
            )}
          </div>
        </div>
        {!isSmall && puedeEditar() && (
          <div className="flex flex-col space-y-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                abrirModalEditar(horario);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                eliminarHorario(horario.id_horario);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const VistaSemanal = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {DIAS_SEMANA.map((dia) => (
        <div
          key={dia.key}
          className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700"
        >
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-4 text-center">
            <h3 className="font-bold text-lg">{dia.short}</h3>
            <p className="text-sm opacity-90">{dia.label}</p>
          </div>
          <div className="p-4 space-y-3 min-h-[400px]">
            {obtenerHorariosPorDia(dia.key).length > 0 ? (
              obtenerHorariosPorDia(dia.key).map((horario) => (
                <HorarioCard
                  key={horario.id}
                  horario={horario}
                  isSmall={true}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <CalendarIcon className="h-8 w-8 mb-2" />
                <p className="text-sm">Sin clases</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const VistaLista = () => (
    <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-700 to-gray-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Profesor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Día
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Aula
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Grado
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {horariosFiltrados.map((horario) => (
              <tr
                key={horario.id_horario}
                className="hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-3"
                      style={{
                        backgroundColor: horario.color_materia || "#3b82f6",
                      }}
                    ></div>
                    <div className="text-sm font-medium text-white">
                      {horario.nombre_materia}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {horario.nombre_profesor}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                    {
                      DIAS_SEMANA.find((d) => d.key === horario.dia_semana)
                        ?.label
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {horario.hora_inicio?.substring(0, 5)} -{" "}
                  {horario.hora_fin?.substring(0, 5)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {horario.aula || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {horario.nombre_grado} {horario.nombre_seccion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    {puedeEditar() && (
                      <>
                        <button
                          className="text-indigo-400 hover:text-indigo-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                          onClick={() => abrirModalEditar(horario)}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                          onClick={() => eliminarHorario(horario.id_horario)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const VistaEstadisticas = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Clases</p>
            <p className="text-3xl font-bold">{estadisticas.total_clases}</p>
          </div>
          <ClipboardDocumentListIcon className="h-12 w-12 text-blue-200" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">
              Profesores Activos
            </p>
            <p className="text-3xl font-bold">
              {estadisticas.profesores_activos}
            </p>
          </div>
          <AcademicCapIcon className="h-12 w-12 text-emerald-200" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium">
              Materias Activas
            </p>
            <p className="text-3xl font-bold">
              {estadisticas.materias_activas}
            </p>
          </div>
          <BookOpenIcon className="h-12 w-12 text-purple-200" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">
              Grados con Horario
            </p>
            <p className="text-3xl font-bold">
              {estadisticas.grados_con_horario}
            </p>
          </div>
          <ClockIcon className="h-12 w-12 text-orange-200" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <CalendarDaysIcon className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">Horarios de Clases</h1>
                <p className="text-xl text-blue-100">
                  Sistema de gestión de horarios académicos
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {puedeEditar() && (
                <button
                  onClick={abrirModalCrear}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border border-white/20"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Nuevo Horario</span>
                </button>
              )}

              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl transition-all duration-200 border border-white/20">
                <PrinterIcon className="h-5 w-5" />
              </button>

              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-xl transition-all duration-200 border border-white/20">
                <DocumentArrowDownIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Estadísticas rápidas en el hero */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">{estadisticas.total_clases}</p>
              <p className="text-blue-100 text-sm">Clases Programadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.profesores_activos}
              </p>
              <p className="text-blue-100 text-sm">Profesores</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.materias_activas}
              </p>
              <p className="text-blue-100 text-sm">Materias</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.grados_con_horario}
              </p>
              <p className="text-blue-100 text-sm">Grados Activos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por materia, profesor, aula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>

            {/* Selector de Vista */}
            <div className="flex bg-gray-700 p-1 rounded-xl">
              <button
                onClick={() => setVistaActual("semanal")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "semanal"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Semanal
              </button>
              <button
                onClick={() => setVistaActual("lista")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "lista"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4 inline mr-1" />
                Lista
              </button>
              <button
                onClick={() => setVistaActual("estadisticas")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "estadisticas"
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                Estadísticas
              </button>
            </div>

            {/* Botón Filtros */}
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`px-4 py-3 rounded-xl font-medium transition-all flex items-center space-x-2 ${
                mostrarFiltros
                  ? "bg-cyan-600 text-white border border-cyan-500"
                  : "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grado
                </label>
                <select
                  value={filtros.grado}
                  onChange={(e) =>
                    setFiltros({...filtros, grado: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los grados</option>
                  {grados.map((grado) => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profesor
                </label>
                <select
                  value={filtros.profesor}
                  onChange={(e) =>
                    setFiltros({...filtros, profesor: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los profesores</option>
                  {profesores.map((profesor) => (
                    <option
                      key={profesor.id_profesor}
                      value={profesor.id_profesor}
                    >
                      {profesor.nombre} {profesor.apellido}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Materia
                </label>
                <select
                  value={filtros.materia}
                  onChange={(e) =>
                    setFiltros({...filtros, materia: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todas las materias</option>
                  {materias.map((materia) => (
                    <option key={materia.id_materia} value={materia.id_materia}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Día
                </label>
                <select
                  value={filtros.dia}
                  onChange={(e) =>
                    setFiltros({...filtros, dia: e.target.value})
                  }
                  className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los días</option>
                  {DIAS_SEMANA.map((dia) => (
                    <option key={dia.key} value={dia.key}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Contenido Principal */}
        {vistaActual === "estadisticas" && <VistaEstadisticas />}
        {vistaActual === "semanal" && <VistaSemanal />}
        {vistaActual === "lista" && <VistaLista />}

        {/* Mensaje cuando no hay resultados */}
        {horariosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron horarios
            </h3>
            <p className="text-gray-600 mb-6">
              No hay horarios que coincidan con los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setBusqueda("");
                setFiltros({grado: "", profesor: "", materia: "", dia: ""});
              }}
              className="bg-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-cyan-700 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de detalles del horario */}
      {horarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setHorarioSeleccionado(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div
              className="bg-gradient-to-r p-6 text-white"
              style={{
                backgroundImage: `linear-gradient(135deg, ${horarioSeleccionado.color}dd, ${horarioSeleccionado.color}99)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {horarioSeleccionado.materia}
                  </h3>
                  <p className="text-white/90">
                    {horarioSeleccionado.profesor}
                  </p>
                </div>
                <button
                  onClick={() => setHorarioSeleccionado(null)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Día</span>
                  </div>
                  <p className="font-semibold">
                    {
                      DIAS_SEMANA.find((d) => d.key === horarioSeleccionado.dia)
                        ?.label
                    }
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Horario</span>
                  </div>
                  <p className="font-semibold">
                    {horarioSeleccionado.horaInicio} -{" "}
                    {horarioSeleccionado.horaFin}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <BuildingLibraryIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Aula</span>
                  </div>
                  <p className="font-semibold">{horarioSeleccionado.aula}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-600 mb-1">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Grado</span>
                  </div>
                  <p className="font-semibold">{horarioSeleccionado.grado}</p>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button className="flex-1 bg-cyan-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-2">
                  <PencilIcon className="h-4 w-4" />
                  <span>Editar</span>
                </button>
                <button className="flex-1 bg-red-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                  <TrashIcon className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Horario */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Crear Nuevo Horario</h3>
                <button
                  onClick={() => setModalCrear(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

            <form onSubmit={crearHorario} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_grado"
                    value={formHorario.id_grado}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccione un grado</option>
                    {grados.map((grado) => (
                      <option key={grado.id_grado} value={grado.id_grado}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sección
                  </label>
                  <select
                    name="id_seccion"
                    value={formHorario.id_seccion}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={!formHorario.id_grado}
                  >
                    <option value="">Sin sección</option>
                    {seccionesFiltradas.map((seccion) => (
                      <option
                        key={seccion.id_seccion}
                        value={seccion.id_seccion}
                      >
                        {seccion.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Materia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materia <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_materia"
                    value={formHorario.id_materia}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map((materia) => (
                      <option
                        key={materia.id_materia}
                        value={materia.id_materia}
                      >
                        {materia.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profesor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_profesor"
                    value={formHorario.id_profesor}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccione un profesor</option>
                    {profesores.map((profesor) => (
                      <option
                        key={profesor.id_profesor}
                        value={profesor.id_profesor}
                      >
                        {profesor.nombre} {profesor.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Día */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="dia_semana"
                    value={formHorario.dia_semana}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Seleccione un día</option>
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.key} value={dia.key}>
                        {dia.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aula
                  </label>
                  <input
                    type="text"
                    name="aula"
                    value={formHorario.aula}
                    onChange={handleFormChange}
                    placeholder="Ej: Aula 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formHorario.hora_inicio}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {/* Hora Fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formHorario.hora_fin}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:from-cyan-700 hover:to-blue-700 transition-all"
                >
                  Crear Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Horario */}
      {modalEditar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Editar Horario</h3>
                <button
                  onClick={() => setModalEditar(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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

            <form onSubmit={actualizarHorario} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Grado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_grado"
                    value={formHorario.id_grado}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione un grado</option>
                    {grados.map((grado) => (
                      <option key={grado.id_grado} value={grado.id_grado}>
                        {grado.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sección */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sección
                  </label>
                  <select
                    name="id_seccion"
                    value={formHorario.id_seccion}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={!formHorario.id_grado}
                  >
                    <option value="">Sin sección</option>
                    {seccionesFiltradas.map((seccion) => (
                      <option
                        key={seccion.id_seccion}
                        value={seccion.id_seccion}
                      >
                        {seccion.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Materia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materia <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_materia"
                    value={formHorario.id_materia}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map((materia) => (
                      <option
                        key={materia.id_materia}
                        value={materia.id_materia}
                      >
                        {materia.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Profesor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesor <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="id_profesor"
                    value={formHorario.id_profesor}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione un profesor</option>
                    {profesores.map((profesor) => (
                      <option
                        key={profesor.id_profesor}
                        value={profesor.id_profesor}
                      >
                        {profesor.nombre} {profesor.apellido}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Día */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Día <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="dia_semana"
                    value={formHorario.dia_semana}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleccione un día</option>
                    {DIAS_SEMANA.map((dia) => (
                      <option key={dia.key} value={dia.key}>
                        {dia.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aula */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aula
                  </label>
                  <input
                    type="text"
                    name="aula"
                    value={formHorario.aula}
                    onChange={handleFormChange}
                    placeholder="Ej: Aula 101"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Hora Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formHorario.hora_inicio}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Hora Fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formHorario.hora_fin}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  Actualizar Horario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HorarioClases;
