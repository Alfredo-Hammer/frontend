import React, {useState, useEffect} from "react";
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

// Datos mock para desarrollo
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

const MOCK_GRADOS = [
  {id: 1, nombre: "10mo A"},
  {id: 2, nombre: "10mo B"},
  {id: 3, nombre: "11mo A"},
  {id: 4, nombre: "11mo B"},
];

function HorarioClases() {
  const [horarios, setHorarios] = useState(MOCK_HORARIOS);
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
  const [modalCrear, setModalCrear] = useState(false);
  const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    totalClases: 0,
    profesoresActivos: 0,
    materiasActivas: 0,
    horasSemanales: 0,
  });

  // Calcular estadísticas
  useEffect(() => {
    setEstadisticas({
      totalClases: horarios.length,
      profesoresActivos: new Set(horarios.map((h) => h.profesor)).size,
      materiasActivas: new Set(horarios.map((h) => h.materia)).size,
      horasSemanales: horarios.length * 1, // Asumiendo 1 hora por clase
    });
  }, [horarios]);

  // Filtrar horarios
  const horariosFiltrados = horarios.filter((horario) => {
    const matchBusqueda =
      busqueda === "" ||
      horario.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.profesor.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.aula.toLowerCase().includes(busqueda.toLowerCase()) ||
      horario.grado.toLowerCase().includes(busqueda.toLowerCase());

    const matchFiltros =
      (filtros.grado === "" || horario.grado === filtros.grado) &&
      (filtros.profesor === "" || horario.profesor === filtros.profesor) &&
      (filtros.materia === "" || horario.materia === filtros.materia) &&
      (filtros.dia === "" || horario.dia === filtros.dia);

    return matchBusqueda && matchFiltros;
  });

  const obtenerHorariosPorDia = (dia) => {
    return horariosFiltrados
      .filter((horario) => horario.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  const HorarioCard = ({horario, isSmall = false}) => (
    <div
      className={`${
        isSmall ? "p-2" : "p-4"
      } rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-105 group cursor-pointer`}
      style={{
        borderLeftColor: horario.color,
        background: `linear-gradient(135deg, ${horario.color}10 0%, ${horario.color}05 100%)`,
      }}
      onClick={() => setHorarioSeleccionado(horario)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4
            className={`${
              isSmall ? "text-sm" : "text-lg"
            } font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors`}
          >
            {horario.materia}
          </h4>
          <p
            className={`${
              isSmall ? "text-xs" : "text-sm"
            } text-gray-600 mb-2 flex items-center`}
          >
            <AcademicCapIcon
              className="h-4 w-4 mr-1"
              style={{color: horario.color}}
            />
            {horario.profesor}
          </p>
          <div className="space-y-1">
            <p
              className={`${
                isSmall ? "text-xs" : "text-sm"
              } text-gray-500 flex items-center`}
            >
              <ClockIcon className="h-3 w-3 mr-1" />
              {horario.horaInicio} - {horario.horaFin}
            </p>
            {!isSmall && (
              <>
                <p className="text-sm text-gray-500 flex items-center">
                  <BuildingLibraryIcon className="h-3 w-3 mr-1" />
                  {horario.aula}
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <UserGroupIcon className="h-3 w-3 mr-1" />
                  {horario.grado}
                </p>
              </>
            )}
          </div>
        </div>
        {!isSmall && (
          <div className="flex flex-col space-y-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <PencilIcon className="h-4 w-4" />
            </button>
            <button className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
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
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Materia
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profesor
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Día
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horario
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aula
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grado
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {horariosFiltrados.map((horario, index) => (
              <tr
                key={horario.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-3"
                      style={{backgroundColor: horario.color}}
                    ></div>
                    <div className="text-sm font-medium text-gray-900">
                      {horario.materia}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {horario.profesor}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {DIAS_SEMANA.find((d) => d.key === horario.dia)?.label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {horario.horaInicio} - {horario.horaFin}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {horario.aula}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {horario.grado}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-all"
                      onClick={() => setHorarioSeleccionado(horario)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-all">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all">
                      <TrashIcon className="h-4 w-4" />
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
            <p className="text-3xl font-bold">{estadisticas.totalClases}</p>
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
              {estadisticas.profesoresActivos}
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
            <p className="text-3xl font-bold">{estadisticas.materiasActivas}</p>
          </div>
          <BookOpenIcon className="h-12 w-12 text-purple-200" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm font-medium">
              Horas Semanales
            </p>
            <p className="text-3xl font-bold">{estadisticas.horasSemanales}</p>
          </div>
          <ClockIcon className="h-12 w-12 text-orange-200" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando horarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white relative overflow-hidden">
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
              <button
                onClick={() => setModalCrear(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 border border-white/20"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nuevo Horario</span>
              </button>

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
              <p className="text-3xl font-bold">{estadisticas.totalClases}</p>
              <p className="text-blue-100 text-sm">Clases Programadas</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.profesoresActivos}
              </p>
              <p className="text-blue-100 text-sm">Profesores</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.materiasActivas}
              </p>
              <p className="text-blue-100 text-sm">Materias</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
              <p className="text-3xl font-bold">
                {estadisticas.horasSemanales}h
              </p>
              <p className="text-blue-100 text-sm">Por Semana</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controles y Filtros */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Buscador */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por materia, profesor, aula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Selector de Vista */}
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setVistaActual("semanal")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "semanal"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                Semanal
              </button>
              <button
                onClick={() => setVistaActual("lista")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "lista"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <ClipboardDocumentListIcon className="h-4 w-4 inline mr-1" />
                Lista
              </button>
              <button
                onClick={() => setVistaActual("estadisticas")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  vistaActual === "estadisticas"
                    ? "bg-white text-cyan-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
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
                  ? "bg-cyan-100 text-cyan-700 border border-cyan-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Panel de Filtros */}
          {mostrarFiltros && (
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grado
                </label>
                <select
                  value={filtros.grado}
                  onChange={(e) =>
                    setFiltros({...filtros, grado: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los grados</option>
                  {MOCK_GRADOS.map((grado) => (
                    <option key={grado.id} value={grado.nombre}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profesor
                </label>
                <select
                  value={filtros.profesor}
                  onChange={(e) =>
                    setFiltros({...filtros, profesor: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todos los profesores</option>
                  {MOCK_PROFESORES.map((profesor) => (
                    <option key={profesor.id} value={profesor.nombre}>
                      {profesor.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materia
                </label>
                <select
                  value={filtros.materia}
                  onChange={(e) =>
                    setFiltros({...filtros, materia: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Todas las materias</option>
                  {MOCK_MATERIAS.map((materia) => (
                    <option key={materia.id} value={materia.nombre}>
                      {materia.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Día
                </label>
                <select
                  value={filtros.dia}
                  onChange={(e) =>
                    setFiltros({...filtros, dia: e.target.value})
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
    </div>
  );
}

export default HorarioClases;
