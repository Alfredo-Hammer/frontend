import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TablaCalificacionesAlumno from "../components/TablaCalificacionesAlumno"; // Asegúrate de actualizar este componente también después
import PageHeader from "../components/PageHeader";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  DocumentTextIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

function CalificacionesPage() {
  // Ciclos escolares
  const [ciclos, setCiclos] = useState([]);
  const [cicloSeleccionado, setCicloSeleccionado] = useState("");
  // ==================== ESTADOS (LÓGICA INTACTA) ====================
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosLista, setAlumnosLista] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);

  // Filtros
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");

  // Navegación
  const [vistaAlumno, setVistaAlumno] = useState(null);
  const [nombreAlumno, setNombreAlumno] = useState("");

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'
  const [sortBy, setSortBy] = useState("alumno");
  const [sortOrder, setSortOrder] = useState("asc");
  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

  // ==================== EFECTOS Y CARGA DE DATOS ====================
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchAlumnos(),
          fetchGrados(),
          fetchSecciones(),
          fetchMaterias(),
          fetchAlumnosLista(),
          fetchCiclosEscolares(),
        ]);
      } catch (error) {
        setMensaje("Error al cargar datos iniciales");
      } finally {
        setIsLoading(false);
      }
    };
    initializePage();
    // Cargar ciclos escolares
    const fetchCiclosEscolares = async () => {
      try {
        const res = await api.get(services.API_BASE + "/ciclos-escolares", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setCiclos(res.data?.data || res.data || []);
        // Seleccionar ciclo activo por defecto
        const activo = (res.data?.data || res.data || []).find((c) => c.activo);
        if (activo) setCicloSeleccionado(activo.id);
      } catch (error) {
        setCiclos([]);
        console.error("Error al cargar ciclos escolares:", error);
      }
    };
  }, []);

  useEffect(() => {
    fetchAlumnosLista();
  }, [filtroGrado, filtroSeccion, cicloSeleccionado]);

  // ==================== FUNCIONES API (LÓGICA INTACTA) ====================
  const fetchAlumnos = async () => {
    try {
      const res = await api.get(services.alumnos, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAlumnos(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGrados = async () => {
    try {
      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchSecciones = async () => {
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = res.data?.data || res.data || [];
      setSecciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMaterias = async () => {
    try {
      const res = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMaterias(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAlumnosLista = async () => {
    try {
      if (!token) {
        setMensaje(
          "No se encontró token de autenticación. Por favor, inicia sesión nuevamente."
        );
        return;
      }

      let url = services.calificacionesAlumnosLista;
      const params = [];
      if (filtroGrado) params.push(`id_grado=${filtroGrado}`);
      if (filtroSeccion) params.push(`id_seccion=${filtroSeccion}`);
      if (cicloSeleccionado) params.push(`id_ciclo=${cicloSeleccionado}`);
      params.push(`_t=${Date.now()}`); // Anti-cache
      if (params.length) url += "?" + params.join("&");

      const res = await api.get(url, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAlumnosLista(res.data);
    } catch (error) {
      console.error(
        "Error actualizando lista de estudiantes:",
        error?.response?.status,
        error?.response?.data || error?.message
      );

      const status = error?.response?.status;
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.detalle ||
        null;

      if (status === 401) {
        setMensaje("Sesión expirada o no autorizada. Vuelve a iniciar sesión.");
      } else if (status === 403) {
        setMensaje("No tienes permisos para ver la lista de estudiantes.");
      } else {
        setMensaje(backendMsg || "Error actualizando lista de estudiantes");
      }
    }
  };

  // ==================== LÓGICA DE NEGOCIO ====================
  const verCalificacionesAlumno = (id_alumno, nombre) => {
    setNombreAlumno(nombre);
    setVistaAlumno(id_alumno);
    setMensaje("");
  };

  // Filtros y Ordenamiento
  const alumnosFiltrados = alumnosLista.filter((alumno) => {
    const term = searchTerm.toLowerCase();
    return (
      alumno.alumno.toLowerCase().includes(term) ||
      (alumno.grado && alumno.grado.toLowerCase().includes(term)) ||
      (alumno.seccion && alumno.seccion.toLowerCase().includes(term))
    );
  });

  const alumnosOrdenados = [...alumnosFiltrados].sort((a, b) => {
    let aValue = a[sortBy] || "";
    let bValue = b[sortBy] || "";
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    return sortOrder === "asc"
      ? aValue < bValue
        ? -1
        : aValue > bValue
        ? 1
        : 0
      : aValue > bValue
      ? -1
      : aValue < bValue
      ? 1
      : 0;
  });

  // Estadísticas rápidas
  const stats = {
    total: alumnosLista.length,
    grados: [...new Set(alumnosLista.map((a) => a.grado).filter(Boolean))]
      .length,
    secciones: [...new Set(alumnosLista.map((a) => a.seccion).filter(Boolean))]
      .length,
  };

  const headerStats = [
    {
      label: "Total Alumnos",
      value: stats.total,
      color: "from-blue-500 to-blue-700",
      icon: UserIcon,
    },
    {
      label: "Grados Activos",
      value: stats.grados,
      color: "from-indigo-500 to-purple-700",
      icon: AcademicCapIcon,
    },
    {
      label: "Secciones",
      value: stats.secciones,
      color: "from-cyan-500 to-blue-600",
      icon: Squares2X2Icon,
    },
    {
      label: "En lista actual",
      value: alumnosFiltrados.length,
      color: "from-emerald-500 to-teal-600",
      icon: TableCellsIcon,
    },
  ];

  // ==================== EXPORTACIÓN PDF (LÓGICA INTACTA) ====================
  const exportarReporteConsolidado = async () => {
    if (!alumnosLista || alumnosLista.length === 0)
      return setMensaje("No hay datos para exportar");

    try {
      setMensaje("Generando PDF...");
      const doc = new jsPDF("l", "mm", "a4");

      // Encabezado PDF
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REPORTE ACADÉMICO CONSOLIDADO", 148, 20, {align: "center"});
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generado: ${new Date().toLocaleDateString()}`, 148, 28, {
        align: "center",
      });

      const consolidatedData = [];
      const maxStudents = Math.min(alumnosLista.length, 50); // Límite de seguridad

      // Recolección de datos (Iterativa)
      for (let i = 0; i < maxStudents; i++) {
        const alumno = alumnosLista[i];
        try {
          const res = await api.get(
            `${services.calificacionesMateriasAlumno}/${alumno.id_alumno}`,
            {headers: {Authorization: `Bearer ${token}`}}
          );
          const calif = res.data;

          if (calif.length > 0) {
            let totalNotas = 0,
              count = 0,
              reprobadas = 0;
            calif.forEach((c) => {
              const notas = [
                Number(c.bimestre_1),
                Number(c.bimestre_2),
                Number(c.bimestre_3),
                Number(c.bimestre_4),
              ].filter((n) => n > 0);
              notas.forEach((n) => {
                totalNotas += n;
                count++;
                if (n < 60) reprobadas++;
              });
            });
            const promedio = count > 0 ? totalNotas / count : 0;
            consolidatedData.push([
              alumno.alumno,
              alumno.grado || "-",
              alumno.seccion || "-",
              calif.length,
              promedio.toFixed(2),
              reprobadas,
              promedio >= 60 ? "Aprobado" : "Reprobado",
            ]);
          } else {
            consolidatedData.push([
              alumno.alumno,
              alumno.grado,
              alumno.seccion,
              0,
              "0.00",
              0,
              "Sin notas",
            ]);
          }
        } catch (e) {
          consolidatedData.push([
            alumno.alumno,
            "-",
            "-",
            "Error",
            "-",
            "-",
            "-",
          ]);
        }
      }

      // Generación Tabla PDF
      autoTable(doc, {
        head: [["Estudiante", "Grado", "Sec", "Mat", "Prom", "Rep", "Estado"]],
        body: consolidatedData,
        startY: 35,
        theme: "striped",
        headStyles: {fillColor: [63, 81, 181]}, // Indigo
        styles: {fontSize: 9},
        didParseCell: (data) => {
          if (data.column.index === 6) {
            const val = data.cell.text[0];
            data.cell.styles.textColor =
              val === "Aprobado"
                ? [0, 150, 0]
                : val === "Reprobado"
                ? [200, 0, 0]
                : [0, 0, 0];
          }
        },
      });

      doc.save(`Reporte_Notas_${new Date().toISOString().slice(0, 10)}.pdf`);
      setMensaje("Reporte descargado correctamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      setMensaje("Error generando PDF");
      console.error(error);
    }
  };

  // ==================== VISTA DE DETALLE (HIJO) ====================
  if (vistaAlumno) {
    return (
      <TablaCalificacionesAlumno
        alumnoId={vistaAlumno}
        nombreAlumno={nombreAlumno}
        onVolver={() => setVistaAlumno(null)}
        token={token}
      />
    );
  }

  // ==================== RENDER PRINCIPAL ====================
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      <PageHeader
        title="Gestión de Calificaciones"
        subtitle="Registra notas, visualiza promedios y genera reportes académicos."
        icon={AcademicCapIcon}
        gradientFrom="indigo-600"
        gradientTo="purple-600"
        stats={headerStats}
        actions={
          <button
            onClick={exportarReporteConsolidado}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl transition-all shadow-lg"
          >
            <DocumentTextIcon className="w-5 h-5 text-red-400" />
            <span>Exportar PDF</span>
          </button>
        }
      />

      {/* MENSAJES DE SISTEMA */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            mensaje.includes("Error")
              ? "bg-red-500/10 text-red-300 border border-red-500/20"
              : "bg-green-500/10 text-green-300 border border-green-500/20"
          }`}
        >
          {mensaje.includes("Error") ? (
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-green-400" />
          )}
          {mensaje}
        </div>
      )}

      {/* TOOLBAR Y FILTROS */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6 shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
          {/* Selector de Ciclo Escolar */}
          <div className="mb-2 md:mb-0">
            <label className="text-xs text-gray-400 mb-1 block">
              Ciclo Escolar
            </label>
            <select
              value={cicloSeleccionado}
              onChange={(e) => setCicloSeleccionado(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
            >
              <option value="">Todos</option>
              {ciclos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.fecha_inicio?.slice(0, 4)} -{" "}
                  {c.fecha_fin?.slice(0, 4)}){c.activo ? " (Activo)" : ""}
                </option>
              ))}
            </select>
          </div>
          {/* Buscador */}
          <div className="relative w-full md:w-96">
            <MagnifyingGlassIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Botones Derecha */}
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-indigo-900/50 border-indigo-500 text-indigo-300"
                  : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filtros</span>
            </button>
            <div className="bg-gray-700 rounded-lg p-1 border border-gray-600 flex">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded ${
                  viewMode === "table"
                    ? "bg-gray-600 text-white shadow"
                    : "text-gray-400"
                }`}
              >
                <TableCellsIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 rounded ${
                  viewMode === "cards"
                    ? "bg-gray-600 text-white shadow"
                    : "text-gray-400"
                }`}
              >
                <Squares2X2Icon className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={fetchAlumnosLista}
              className="p-2.5 bg-gray-700 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:rotate-180 transition-all"
              title="Recargar datos"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Expandible de Filtros */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Grado</label>
              <select
                value={filtroGrado}
                onChange={(e) => setFiltroGrado(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
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
              <label className="text-xs text-gray-400 mb-1 block">
                Sección
              </label>
              <select
                value={filtroSeccion}
                onChange={(e) => setFiltroSeccion(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
              >
                <option value="">Todas las secciones</option>
                {secciones.map((s) => (
                  <option key={s.id_seccion} value={s.id_seccion}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Ordenar por
              </label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none"
                >
                  <option value="alumno">Nombre</option>
                  <option value="grado">Grado</option>
                </select>
                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 bg-gray-700 border border-gray-600 rounded-lg text-white hover:bg-gray-600"
                >
                  {sortOrder === "asc" ? "A-Z" : "Z-A"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando expediente académico...</p>
        </div>
      ) : alumnosFiltrados.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
          <AcademicCapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            No se encontraron estudiantes
          </h3>
          <p className="text-gray-400">
            Intenta ajustar los filtros o registra nuevos alumnos en el módulo
            correspondiente.
          </p>
        </div>
      ) : (
        <>
          {/* VISTA TABLA */}
          {viewMode === "table" && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase font-semibold border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Estudiante</th>
                      <th className="px-6 py-4">Grado & Sección</th>
                      <th className="px-6 py-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {alumnosOrdenados.map((alumno, idx) => (
                      <tr
                        key={alumno.id_alumno}
                        className="hover:bg-gray-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                              {alumno.alumno.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {alumno.alumno}
                              </p>
                              <p className="text-xs text-gray-500">
                                ID: {alumno.id_alumno}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600">
                              {alumno.grado || "N/A"}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 border border-gray-600">
                              {alumno.seccion || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              verCalificacionesAlumno(
                                alumno.id_alumno,
                                alumno.alumno
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
                          >
                            <ChartBarIcon className="w-4 h-4" />
                            Calificar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VISTA CARDS */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alumnosOrdenados.map((alumno) => (
                <div
                  key={alumno.id_alumno}
                  className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-indigo-500/50 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-white group-hover:bg-indigo-600 transition-colors">
                      {alumno.alumno.charAt(0)}
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      #{alumno.id_alumno}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 truncate">
                    {alumno.alumno}
                  </h3>
                  <div className="flex gap-2 mb-6">
                    <span className="text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded border border-gray-700">
                      {alumno.grado}
                    </span>
                    <span className="text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded border border-gray-700">
                      {alumno.seccion}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      verCalificacionesAlumno(alumno.id_alumno, alumno.alumno)
                    }
                    className="w-full py-2 bg-gray-700 hover:bg-indigo-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    Ver Calificaciones
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default CalificacionesPage;
