import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import Loader from "../components/Loader";
import Toast from "../components/Toast";
import {
  ClockIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  UserGroupIcon,
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import jsPDF from "jspdf";
import "jspdf-autotable";

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const diasMap = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

function HorarioPage() {
  // ========== Estados ==========
  const [horarios, setHorarios] = useState([]);
  const [horariosAgrupados, setHorariosAgrupados] = useState({});
  const [profesores, setProfesores] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vistaActual, setVistaActual] = useState("tabla"); // "tabla" o "grid"
  const [user, setUser] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    id_profesor: "",
    id_grado: "",
    id_seccion: "",
    id_materia: "",
    dia_semana: "",
  });

  // Toast
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const token = localStorage.getItem("token");

  // ========== Efectos ==========

  useEffect(() => {
    const init = async () => {
      await obtenerUsuario();
      await cargarCatalogos();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Solo cargar horarios si el usuario ya ha sido cargado
    // para asegurar que los filtros por rol se apliquen correctamente
    if (user) {
      cargarHorarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, user]);

  // ========== Funciones de Datos ==========

  const obtenerUsuario = async () => {
    try {
      const res = await api.get("/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const userData = res.data?.data || res.data;
      setUser(userData);

      // El backend ahora maneja el filtro para estudiantes y profesores automáticamente.
      // El frontend solo necesita enviar filtros para los admins.
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      showToast("Error al cargar información del usuario", "error");
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [resProfes, resGrados, resMaterias, resSecciones] =
        await Promise.all([
          api.get("/profesores", {headers: {Authorization: `Bearer ${token}`}}),
          api.get("/grados", {headers: {Authorization: `Bearer ${token}`}}),
          api.get("/materias", {headers: {Authorization: `Bearer ${token}`}}),
          api.get("/secciones", {headers: {Authorization: `Bearer ${token}`}}),
        ]);

      setProfesores(resProfes.data?.data || resProfes.data || []);
      setGrados(resGrados.data?.data || resGrados.data || []);
      setMaterias(resMaterias.data?.data || resMaterias.data || []);
      setSecciones(resSecciones.data?.data || resSecciones.data || []);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
      showToast("Error al cargar catálogos", "error");
    }
  };

  const cargarHorarios = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // Solo los admins pueden usar estos filtros, el backend los ignora para otros roles
      if (filtros.id_profesor)
        params.append("id_profesor", filtros.id_profesor);
      if (filtros.id_grado) params.append("id_grado", filtros.id_grado);
      if (filtros.id_seccion) params.append("id_seccion", filtros.id_seccion);
      if (filtros.id_materia) params.append("id_materia", filtros.id_materia);
      if (filtros.dia_semana) params.append("dia_semana", filtros.dia_semana);

      const res = await api.get(`/horarios?${params.toString()}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const horariosData = res.data?.data || res.data || [];
      setHorarios(Array.isArray(horariosData) ? horariosData : []);
      agruparHorarios(horariosData);
    } catch (error) {
      console.error("Error cargando horarios:", error);
      showToast("Error al cargar horarios", "error");
      setHorarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const agruparHorarios = (horariosData) => {
    const agrupado = {};

    if (!Array.isArray(horariosData)) {
      setHorariosAgrupados({});
      return;
    }

    horariosData.forEach((h) => {
      const key = `${h.hora_inicio}-${h.hora_fin}`;
      if (!agrupado[key]) {
        agrupado[key] = {
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
          clases: {},
        };
      }

      const diaNombre = diasMap[h.dia_semana];
      if (!diaNombre) return;

      if (!agrupado[key].clases[diaNombre]) {
        agrupado[key].clases[diaNombre] = [];
      }

      agrupado[key].clases[diaNombre].push(h);
    });

    setHorariosAgrupados(agrupado);
  };

  const limpiarFiltros = () => {
    setFiltros({
      id_profesor: "",
      id_grado: "",
      id_seccion: "",
      id_materia: "",
      dia_semana: "",
    });
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    const tableColumn = [
      "Día",
      "Hora",
      "Materia",
      "Profesor",
      "Grado",
      "Sección",
    ];
    const tableRows = [];

    const selectedSeccion = secciones.find(
      (s) => s.id_seccion.toString() === filtros.id_seccion
    );
    const title = `Horario de Clases ${
      selectedSeccion ? `- ${selectedSeccion.nombre}` : ""
    }`;

    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(
      `Fecha de exportación: ${new Date().toLocaleDateString()}`,
      14,
      29
    );

    horarios.forEach((h) => {
      const horarioData = [
        diasMap[h.dia_semana],
        `${h.hora_inicio.substring(0, 5)} - ${h.hora_fin.substring(0, 5)}`,
        h.materia,
        h.profesor,
        h.grado,
        h.seccion,
      ];
      tableRows.push(horarioData);
    });

    doc.autoTable(tableColumn, tableRows, {
      startY: 35,
      theme: "grid",
      headStyles: {fillColor: [22, 160, 133]},
    });
    doc.save(`horario_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const isAdminView =
    user?.rol === "admin" ||
    user?.rol === "director" ||
    user?.rol === "secretariado";

  // ========== Renders ==========

  const totalClases = horarios.length;
  const profesoresUnicos = new Set(horarios.map((h) => h.id_profesor)).size;
  const materiasUnicas = new Set(horarios.map((h) => h.id_materia)).size;
  const gradosUnicos = new Set(horarios.map((h) => h.id_grado)).size;

  const headerStats = [
    {
      label: "Total Clases",
      value: totalClases,
      color: "from-cyan-500 to-blue-600",
      icon: ClockIcon,
    },
    {
      label: "Profesores",
      value: profesoresUnicos,
      color: "from-purple-500 to-pink-600",
      icon: UserGroupIcon,
    },
    {
      label: "Materias",
      value: materiasUnicas,
      color: "from-emerald-500 to-teal-600",
      icon: BookOpenIcon,
    },
    {
      label: "Grados",
      value: gradosUnicos,
      color: "from-orange-500 to-red-600",
      icon: AcademicCapIcon,
    },
  ];

  const renderFiltros = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Filtros</h3>
        </div>
        {isAdminView && (
          <button
            onClick={limpiarFiltros}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isAdminView && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Profesor
            </label>
            <select
              value={filtros.id_profesor}
              onChange={(e) =>
                setFiltros({...filtros, id_profesor: e.target.value})
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">Todos los profesores</option>
              {profesores.map((p) => (
                <option key={p.id_profesor} value={p.id_profesor}>
                  {p.nombre} {p.apellido}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Grado
            </label>
            <select
              value={filtros.id_grado}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  id_grado: e.target.value,
                  id_seccion: "",
                })
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">Todos los grados</option>
              {grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sección
            </label>
            <select
              value={filtros.id_seccion}
              onChange={(e) =>
                setFiltros({...filtros, id_seccion: e.target.value})
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={!filtros.id_grado}
            >
              <option value="">Todas las secciones</option>
              {secciones
                .filter(
                  (s) =>
                    !filtros.id_grado ||
                    s.id_grado.toString() === filtros.id_grado
                )
                .map((s) => (
                  <option key={s.id_seccion} value={s.id_seccion}>
                    {s.nombre}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Materia
            </label>
            <select
              value={filtros.id_materia}
              onChange={(e) =>
                setFiltros({...filtros, id_materia: e.target.value})
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">Todas las materias</option>
              {materias.map((m) => (
                <option key={m.id_materia} value={m.id_materia}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Día
            </label>
            <select
              value={filtros.dia_semana}
              onChange={(e) =>
                setFiltros({...filtros, dia_semana: e.target.value})
              }
              className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="">Todos los días</option>
              {Object.entries(diasMap).map(([num, dia]) => (
                <option key={num} value={num}>
                  {dia}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderVistaTabla = () => {
    const horasOrdenadas = Object.keys(horariosAgrupados).sort();

    if (horasOrdenadas.length === 0) {
      return (
        <div className="text-center py-16">
          <CalendarDaysIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {user?.rol === "alumno"
              ? "No tienes un horario asignado aún."
              : "No hay horarios con los filtros seleccionados."}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-900/50 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-700 px-4 py-3 text-left text-cyan-400 font-semibold">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Hora
                </div>
              </th>
              {diasSemana.map((dia) => (
                <th
                  key={dia}
                  className="border border-gray-700 px-4 py-3 text-center text-cyan-400 font-semibold"
                >
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasOrdenadas.map((horaKey) => {
              const {hora_inicio, hora_fin, clases} =
                horariosAgrupados[horaKey];
              return (
                <tr
                  key={horaKey}
                  className="hover:bg-gray-800/30 transition-colors"
                >
                  <td className="border border-gray-700 px-4 py-3 font-semibold text-gray-300 whitespace-nowrap">
                    {hora_inicio?.substring(0, 5)} - {hora_fin?.substring(0, 5)}
                  </td>
                  {diasSemana.map((dia) => {
                    const clasesDelDia = clases[dia] || [];
                    return (
                      <td
                        key={dia}
                        className="border border-gray-700 px-2 py-2 text-center align-top"
                      >
                        {clasesDelDia.length > 0 ? (
                          <div className="space-y-2">
                            {clasesDelDia.map((clase, idx) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border border-cyan-500/30 rounded-lg p-3 hover:border-cyan-400/60 transition-all"
                              >
                                <div className="font-bold text-cyan-300 text-sm mb-1">
                                  {clase.materia}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center justify-center gap-1 mb-1">
                                  <AcademicCapIcon className="w-3 h-3" />
                                  {clase.profesor}
                                </div>
                                <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                                  <UserGroupIcon className="w-3 h-3" />
                                  {clase.grado} - {clase.seccion}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderVistaGrid = () => {
    if (!horarios || horarios.length === 0) {
      return (
        <div className="text-center py-16">
          <CalendarDaysIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No hay horarios disponibles.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {horarios.map((clase) => (
          <div
            key={clase.id_carga}
            className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl p-5 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <h4 className="text-lg font-bold text-cyan-300">
                {clase.materia}
              </h4>
              <span className="text-xs bg-cyan-900/40 text-cyan-300 px-2 py-1 rounded-full">
                {diasMap[clase.dia_semana]}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-300">
                <ClockIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">
                  {clase.hora_inicio?.substring(0, 5)} -{" "}
                  {clase.hora_fin?.substring(0, 5)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <AcademicCapIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">{clase.profesor}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-300">
                <UserGroupIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-sm">
                  {clase.grado} - {clase.seccion}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-10">
      {isLoading && <Loader text="Cargando horarios..." />}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Horarios de Clases"
          subtitle={
            isAdminView
              ? "Visualiza y gestiona los horarios de la escuela."
              : "Consulta tu horario de clases semanal."
          }
          icon={CalendarDaysIcon}
          stats={isAdminView && horarios.length > 0 ? headerStats : null}
          actions={
            <div className="flex items-center gap-4">
              <div className="flex gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setVistaActual("tabla")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    vistaActual === "tabla"
                      ? "bg-cyan-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <TableCellsIcon className="w-5 h-5" />
                  Tabla
                </button>
                <button
                  onClick={() => setVistaActual("grid")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                    vistaActual === "grid"
                      ? "bg-cyan-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                  Tarjetas
                </button>
              </div>
              <button
                onClick={exportarPDF}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 hover:text-white hover:border-cyan-500 transition-all"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Exportar
              </button>
            </div>
          }
        />

        {/* Filtros */}
        {renderFiltros()}

        {/* Contenido Principal */}
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
          {vistaActual === "tabla" ? renderVistaTabla() : renderVistaGrid()}
        </div>
      </div>
    </div>
  );
}

export default HorarioPage;
