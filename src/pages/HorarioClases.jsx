import React, {useState, useEffect} from "react";
import axios from "axios";
import PageHeader from "../components/PageHeader";
import {
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import {
  CalendarIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import Toast from "../components/Toast";

// Constantes
const API_BASE_URL = "http://localhost:4000";

const DIAS_SEMANA = [
  {id: 1, key: "lunes", label: "Lunes", short: "LUN"},
  {id: 2, key: "martes", label: "Martes", short: "MAR"},
  {id: 3, key: "miercoles", label: "Miércoles", short: "MIE"},
  {id: 4, key: "jueves", label: "Jueves", short: "JUE"},
  {id: 5, key: "viernes", label: "Viernes", short: "VIE"},
  {id: 6, key: "sabado", label: "Sábado", short: "SAB"},
];

function HorarioClases() {
  // Estados
  const [horarios, setHorarios] = useState([]);
  const [grados, setGrados] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState("semanal"); // 'semanal', 'lista', 'estadisticas'
  const [filtros, setFiltros] = useState({
    grado: "",
    profesor: "",
    materia: "",
    dia: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total_clases: 0,
    profesores_activos: 0,
    materias_activas: 0,
    grados_con_horario: 0,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarHorarios();
    cargarGrados();
    cargarProfesores();
    cargarMaterias();
    cargarEstadisticas();
  }, []);

  // Cargar horarios desde el backend
  const cargarHorarios = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/horarios`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setHorarios(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar horarios:", error);
      showToast("Error al cargar horarios", "error");
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
      setGrados(response.data.data || []);
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
      setProfesores(response.data.data || []);
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
      setMaterias(response.data.data || []);
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
      setEstadisticas(
        response.data.data || {
          total_clases: 0,
          profesores_activos: 0,
          materias_activas: 0,
          grados_con_horario: 0,
        }
      );
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const headerStats = [
    {
      label: "Clases Programadas",
      value: estadisticas.total_clases,
      color: "from-blue-500 to-indigo-600",
      icon: ClipboardDocumentListIcon,
    },
    {
      label: "Profesores Activos",
      value: estadisticas.profesores_activos,
      color: "from-emerald-500 to-teal-600",
      icon: AcademicCapIcon,
    },
    {
      label: "Materias Activas",
      value: estadisticas.materias_activas,
      color: "from-purple-500 to-violet-600",
      icon: BookOpenIcon,
    },
    {
      label: "Grados con Horario",
      value: estadisticas.grados_con_horario,
      color: "from-amber-500 to-orange-600",
      icon: ClockIcon,
    },
  ];

  // Filtrar horarios
  const horariosFiltrados = horarios.filter((horario) => {
    const matchBusqueda =
      busqueda === "" ||
      horario.materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.profesor?.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.grado?.toLowerCase().includes(busqueda.toLowerCase());

    const matchFiltros =
      (filtros.grado === "" ||
        horario.id_grado?.toString() === filtros.grado) &&
      (filtros.profesor === "" ||
        horario.id_profesor?.toString() === filtros.profesor) &&
      (filtros.materia === "" ||
        horario.id_materia?.toString() === filtros.materia) &&
      (filtros.dia === "" || horario.dia_semana.toString() === filtros.dia);

    return matchBusqueda && matchFiltros;
  });

  const obtenerHorariosPorDia = (diaId) => {
    return horariosFiltrados
      .filter((horario) => horario.dia_semana === diaId)
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
            {horario.materia}
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
            {horario.profesor}
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
              <p className="text-sm text-gray-400 flex items-center">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                {horario.grado} {horario.seccion && `- ${horario.seccion}`}
              </p>
            )}
          </div>
        </div>
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
            {obtenerHorariosPorDia(dia.id).length > 0 ? (
              obtenerHorariosPorDia(dia.id).map((horario) => (
                <HorarioCard
                  key={horario.id_carga}
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
                      {horario.materia}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-300">
                    {horario.profesor}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                    {
                      DIAS_SEMANA.find((d) => d.id === horario.dia_semana)
                        ?.label
                    }
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {horario.hora_inicio?.substring(0, 5)} -{" "}
                  {horario.hora_fin?.substring(0, 5)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {horario.grado} {horario.seccion}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded-lg transition-all"
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
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
    <div className="min-h-screen bg-gray-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Horarios de Clases"
          subtitle="Visualización de horarios académicos"
          icon={CalendarDaysIcon}
          stats={headerStats}
          actions={
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-cyan-500 transition-all"
            >
              <PrinterIcon className="w-5 h-5" />
              Imprimir
            </button>
          }
        />

        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por materia, profesor o grado..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-gray-400"
              />
            </div>

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
                    <option key={dia.key} value={dia.id}>
                      {dia.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {vistaActual === "estadisticas" && <VistaEstadisticas />}
        {vistaActual === "semanal" && <VistaSemanal />}
        {vistaActual === "lista" && <VistaLista />}

        {horariosFiltrados.length === 0 && (
          <div className="bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-700">
            <ExclamationTriangleIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No se encontraron horarios
            </h3>
            <p className="text-gray-400 mb-6">
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

      {horarioSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setHorarioSeleccionado(null)}
          />
          <div className="relative bg-gray-800 border border-gray-700 rounded-3xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1 text-cyan-400">
                    {horarioSeleccionado.materia}
                  </h3>
                  <p className="text-gray-300">
                    {horarioSeleccionado.profesor}
                  </p>
                </div>
                <button
                  onClick={() => setHorarioSeleccionado(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
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
                <div className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center text-gray-400 mb-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Día</span>
                  </div>
                  <p className="font-semibold text-white">
                    {
                      DIAS_SEMANA.find(
                        (d) => d.id === horarioSeleccionado.dia_semana
                      )?.label
                    }
                  </p>
                </div>

                <div className="bg-gray-700 rounded-xl p-4">
                  <div className="flex items-center text-gray-400 mb-1">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Horario</span>
                  </div>
                  <p className="font-semibold text-white">
                    {horarioSeleccionado.hora_inicio?.substring(0, 5)} -{" "}
                    {horarioSeleccionado.hora_fin?.substring(0, 5)}
                  </p>
                </div>

                <div className="bg-gray-700 rounded-xl p-4 col-span-2">
                  <div className="flex items-center text-gray-400 mb-1">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Grado</span>
                  </div>
                  <p className="font-semibold text-white">
                    {horarioSeleccionado.grado}
                    {horarioSeleccionado.seccion &&
                      ` - ${horarioSeleccionado.seccion}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({show: false, message: "", type: "success"})}
        />
      )}
    </div>
  );
}

export default HorarioClases;
