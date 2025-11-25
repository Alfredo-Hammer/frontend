import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TablaCalificacionesAlumno from "../components/TablaCalificacionesAlumno";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

function CalificacionesPage() {
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosLista, setAlumnosLista] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [vistaAlumno, setVistaAlumno] = useState(null);
  const [nombreAlumno, setNombreAlumno] = useState("");

  // Estados para funcionalidades adicionales
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  const [sortBy, setSortBy] = useState("alumno");
  const [sortOrder, setSortOrder] = useState("asc");
  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

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
        ]);
      } catch (error) {
        setMensaje("Error al cargar datos iniciales");
      } finally {
        setIsLoading(false);
      }
    };
    initializePage();
  }, []);

  useEffect(() => {
    fetchAlumnosLista();
  }, [filtroGrado, filtroSeccion]);

  const fetchAlumnos = async () => {
    try {
      const res = await api.get(services.alumnos, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAlumnos(res.data);
    } catch (error) {
      setMensaje("Error al cargar alumnos");
    }
  };

  const fetchGrados = async () => {
    try {
      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setGrados(res.data);
    } catch (error) {
      setMensaje("Error al cargar grados");
    }
  };

  const fetchSecciones = async () => {
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setSecciones(res.data);
    } catch (error) {
      setMensaje("Error al cargar secciones");
    }
  };

  const fetchMaterias = async () => {
    try {
      const res = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setMaterias(res.data);
    } catch (error) {
      setMensaje("Error al cargar materias");
    }
  };

  const fetchAlumnosLista = async () => {
    try {
      let url = services.calificaciones + "/alumnos-lista";
      const params = [];
      if (filtroGrado) params.push(`id_grado=${filtroGrado}`);
      if (filtroSeccion) params.push(`id_seccion=${filtroSeccion}`);
      if (params.length) url += "?" + params.join("&");
      const res = await api.get(url, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setAlumnosLista(res.data);
    } catch (error) {
      setMensaje("Error al cargar lista de alumnos");
    }
  };

  // Vista de calificaciones por alumno - SIMPLIFICADA
  const verCalificacionesAlumno = (id_alumno, nombre) => {
    console.log("Ver calificaciones para alumno ID:", id_alumno);
    setNombreAlumno(nombre);
    setVistaAlumno(id_alumno);
    setMensaje("");
  };

  // Filtros y búsqueda
  const alumnosFiltrados = alumnosLista.filter((alumno) => {
    const matchesSearch =
      alumno.alumno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alumno.grado &&
        alumno.grado.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (alumno.seccion &&
        alumno.seccion.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Ordenamiento
  const alumnosOrdenados = [...alumnosFiltrados].sort((a, b) => {
    let aValue = a[sortBy] || "";
    let bValue = b[sortBy] || "";

    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Estadísticas generales
  const estadisticasGenerales = {
    totalAlumnos: alumnosLista.length,
    gradosUnicos: [...new Set(alumnosLista.map((a) => a.grado).filter(Boolean))]
      .length,
    seccionesUnicas: [
      ...new Set(alumnosLista.map((a) => a.seccion).filter(Boolean)),
    ].length,
    filtrados: alumnosFiltrados.length,
  };

  // Función para generar reporte consolidado
  const exportarReporteConsolidado = async () => {
    if (!alumnosLista || alumnosLista.length === 0) {
      setMensaje("No hay estudiantes para generar el reporte");
      return;
    }

    try {
      setMensaje("Generando reporte consolidado...");
      const doc = new jsPDF("l", "mm", "a4"); // Formato horizontal para mejor espacio

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("REPORTE CONSOLIDADO DE CALIFICACIONES", 148, 20, {
        align: "center",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha de generación: ${new Date().toLocaleDateString()}`,
        148,
        30,
        {align: "center"}
      );

      // Preparar datos para la tabla consolidada
      const consolidatedData = [];
      const maxStudents = Math.min(alumnosLista.length, 50); // Limitar para evitar documentos muy largos

      for (let i = 0; i < maxStudents; i++) {
        const alumno = alumnosLista[i];
        try {
          const res = await api.get(
            `${services.calificacionesMateriasAlumno}/${alumno.id_alumno}`,
            {headers: {Authorization: `Bearer ${token}`}}
          );

          const calificaciones = res.data;
          if (calificaciones.length > 0) {
            let totalNotas = 0;
            let totalBimestres = 0;
            let reprobadas = 0;

            calificaciones.forEach((cal) => {
              const b1 = Number(cal.bimestre_1) || 0;
              const b2 = Number(cal.bimestre_2) || 0;
              const b3 = Number(cal.bimestre_3) || 0;
              const b4 = Number(cal.bimestre_4) || 0;

              const notas = [b1, b2, b3, b4].filter((n) => n > 0);
              notas.forEach((nota) => {
                totalNotas += nota;
                totalBimestres++;
                if (nota < 60) reprobadas++;
              });
            });

            const promedio =
              totalBimestres > 0 ? totalNotas / totalBimestres : 0;

            consolidatedData.push([
              alumno.alumno,
              alumno.grado || "N/A",
              alumno.seccion || "N/A",
              calificaciones.length,
              promedio.toFixed(2),
              reprobadas,
              promedio >= 70 ? "Aprobado" : "En riesgo",
            ]);
          } else {
            // Agregar estudiante sin calificaciones
            consolidatedData.push([
              alumno.alumno,
              alumno.grado || "N/A",
              alumno.seccion || "N/A",
              0,
              "0.00",
              0,
              "Sin calificar",
            ]);
          }
        } catch (error) {
          console.error(
            `Error al obtener calificaciones de ${alumno.alumno}:`,
            error
          );
          // Agregar estudiante con error
          consolidatedData.push([
            alumno.alumno,
            alumno.grado || "N/A",
            alumno.seccion || "N/A",
            "Error",
            "Error",
            "Error",
            "Error",
          ]);
        }
      }

      // Crear tabla consolidada usando autoTable
      autoTable(doc, {
        head: [
          [
            "Estudiante",
            "Grado",
            "Sección",
            "Materias",
            "Promedio",
            "Reprobadas",
            "Estado",
          ],
        ],
        body: consolidatedData,
        startY: 45,
        theme: "striped",
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        columnStyles: {
          0: {cellWidth: 60},
          1: {cellWidth: 25, halign: "center"},
          2: {cellWidth: 25, halign: "center"},
          3: {cellWidth: 25, halign: "center"},
          4: {cellWidth: 25, halign: "center", fontStyle: "bold"},
          5: {cellWidth: 25, halign: "center"},
          6: {cellWidth: 30, halign: "center"},
        },
        didParseCell: (data) => {
          if (data.column.index === 6) {
            // Columna de estado
            if (data.cell.text[0] === "Aprobado") {
              data.cell.styles.textColor = [40, 167, 69];
              data.cell.styles.fontStyle = "bold";
            } else if (data.cell.text[0] === "En riesgo") {
              data.cell.styles.textColor = [220, 53, 69];
              data.cell.styles.fontStyle = "bold";
            } else if (data.cell.text[0] === "Sin calificar") {
              data.cell.styles.textColor = [255, 193, 7];
              data.cell.styles.fontStyle = "bold";
            }
          } else if (data.column.index === 4) {
            // Columna de promedio
            const promedio = parseFloat(data.cell.text[0]);
            if (!isNaN(promedio)) {
              if (promedio < 60) {
                data.cell.styles.textColor = [220, 53, 69];
              } else if (promedio >= 90) {
                data.cell.styles.textColor = [40, 167, 69];
              }
            }
          }
        },
      });

      // Estadísticas generales
      const validData = consolidatedData.filter(
        (row) => !isNaN(parseFloat(row[4]))
      );
      const totalEstudiantes = consolidatedData.length;
      const aprobados = consolidatedData.filter(
        (row) => row[6] === "Aprobado"
      ).length;
      const enRiesgo = consolidatedData.filter(
        (row) => row[6] === "En riesgo"
      ).length;
      const sinCalificar = consolidatedData.filter(
        (row) => row[6] === "Sin calificar"
      ).length;
      const promedioGeneral =
        validData.length > 0
          ? validData.reduce((sum, row) => sum + parseFloat(row[4]), 0) /
            validData.length
          : 0;

      const statsY = doc.lastAutoTable.finalY + 20;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ESTADÍSTICAS GENERALES", 20, statsY);

      const generalStats = [
        ["Total de estudiantes evaluados:", totalEstudiantes.toString()],
        [
          "Estudiantes aprobados:",
          `${aprobados} (${
            totalEstudiantes > 0
              ? ((aprobados / totalEstudiantes) * 100).toFixed(1)
              : 0
          }%)`,
        ],
        [
          "Estudiantes en riesgo:",
          `${enRiesgo} (${
            totalEstudiantes > 0
              ? ((enRiesgo / totalEstudiantes) * 100).toFixed(1)
              : 0
          }%)`,
        ],
        [
          "Estudiantes sin calificar:",
          `${sinCalificar} (${
            totalEstudiantes > 0
              ? ((sinCalificar / totalEstudiantes) * 100).toFixed(1)
              : 0
          }%)`,
        ],
        ["Promedio general de la institución:", promedioGeneral.toFixed(2)],
      ];

      autoTable(doc, {
        body: generalStats,
        startY: statsY + 8,
        theme: "plain",
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        columnStyles: {
          0: {fontStyle: "bold", cellWidth: 80},
          1: {fontStyle: "bold", cellWidth: 40},
        },
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Sistema AOC de Gestión Escolar - Reporte generado automáticamente",
        148,
        pageHeight - 15,
        {align: "center"}
      );
      doc.text(
        `${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        148,
        pageHeight - 10,
        {align: "center"}
      );

      // Guardar el PDF
      const fileName = `Reporte_Consolidado_${new Date().getFullYear()}_${String(
        new Date().getMonth() + 1
      ).padStart(2, "0")}_${String(new Date().getDate()).padStart(2, "0")}.pdf`;
      doc.save(fileName);

      setMensaje("Reporte consolidado exportado correctamente");
    } catch (error) {
      console.error("Error al exportar reporte consolidado:", error);
      setMensaje("Error al generar el reporte consolidado: " + error.message);
    }
  };

  // Si vistaAlumno está activo, mostrar el componente TablaCalificacionesAlumno
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

  // Vista principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Hero Section */}
      <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-violet-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-fuchsia-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white mb-4 backdrop-blur-sm">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Sistema de Evaluación
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <BuildingLibraryIcon className="w-8 h-8 text-white" />
                  </div>
                  <span>Gestión de</span>
                </div>
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent ml-16">
                  Calificaciones
                </span>
              </h1>
              <p className="text-xl text-violet-100 mb-8 max-w-2xl">
                Administra y registra las calificaciones de los estudiantes.
                Sistema de evaluación bimestral con estadísticas avanzadas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                >
                  <ChartBarIcon className="w-5 h-5 mr-2" />
                  {showStats ? "Ocultar Estadísticas" : "Ver Estadísticas"}
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold backdrop-blur-sm hover:bg-white/20 transform transition-all duration-300 flex items-center justify-center"
                >
                  <FunnelIcon className="w-5 h-5 mr-2" />
                  {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                </button>
                {/* Nuevo botón para reporte consolidado */}
                <button
                  onClick={exportarReporteConsolidado}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Reporte PDF
                </button>
              </div>
            </div>

            <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Resumen del Sistema
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-white">
                      <span>Total de Estudiantes</span>
                      <span className="font-bold text-yellow-400">
                        {estadisticasGenerales.totalAlumnos}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Grados</span>
                      <span className="font-bold text-violet-400">
                        {estadisticasGenerales.gradosUnicos}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Secciones</span>
                      <span className="font-bold text-purple-400">
                        {estadisticasGenerales.seccionesUnicas}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Filtrados</span>
                      <span className="font-bold text-fuchsia-400">
                        {estadisticasGenerales.filtrados}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-2xl text-center backdrop-blur-sm border ${
              mensaje.includes("correctamente") || mensaje.includes("Generando")
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Panel de control y filtros */}
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-700 -mt-16 relative z-10">
          {/* Barra de búsqueda y controles principales */}
          <div className="flex flex-col lg:flex-row gap-4 items-center mb-6">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar estudiantes por nombre, grado o sección..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-3 items-center">
              <select
                className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="alumno">Ordenar por Nombre</option>
                <option value="grado">Ordenar por Grado</option>
                <option value="seccion">Ordenar por Sección</option>
              </select>

              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="p-3 border border-gray-600 rounded-xl bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors duration-200"
                title={`Orden ${
                  sortOrder === "asc" ? "Ascendente" : "Descendente"
                }`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>

              <div className="flex bg-gray-700 rounded-xl p-1">
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "cards"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("cards")}
                  title="Vista de tarjetas"
                >
                  <UserIcon className="w-5 h-5" />
                </button>
                <button
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-purple-600 text-white shadow"
                      : "text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setViewMode("table")}
                  title="Vista de tabla"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros avanzados académicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filtrar por Grado
              </label>
              <select
                value={filtroGrado}
                onChange={(e) => setFiltroGrado(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
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
                Filtrar por Sección
              </label>
              <select
                value={filtroSeccion}
                onChange={(e) => setFiltroSeccion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filtrar por Materia
              </label>
              <select
                value={filtroMateria}
                onChange={(e) => setFiltroMateria(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
              >
                <option value="">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m.id_materia} value={m.id_materia}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {alumnosFiltrados.length !== alumnosLista.length && (
            <div className="text-sm text-gray-400 text-center">
              Mostrando {alumnosFiltrados.length} de {alumnosLista.length}{" "}
              estudiantes
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando estudiantes...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && alumnosLista.length === 0 && (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">📊</div>
            <h2 className="text-2xl font-bold text-gray-300 mb-4">
              No hay estudiantes registrados
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Necesitas tener estudiantes registrados para poder gestionar sus
              calificaciones.
            </p>
          </div>
        )}

        {/* Filtered empty state */}
        {!isLoading &&
          alumnosFiltrados.length === 0 &&
          alumnosLista.length > 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                No se encontraron estudiantes
              </h3>
              <p className="text-gray-400">
                Intenta modificar los filtros de búsqueda
              </p>
            </div>
          )}

        {/* Vista de Tarjetas */}
        {!isLoading && alumnosFiltrados.length > 0 && viewMode === "cards" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-purple-400" />
                Lista de Estudiantes
              </h3>
              <div className="text-sm text-gray-400">
                {alumnosFiltrados.length} estudiante
                {alumnosFiltrados.length !== 1 ? "s" : ""}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {alumnosOrdenados.map((alumno, idx) => (
                <div
                  key={alumno.id_alumno}
                  className="bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-700 hover:border-purple-500 transform hover:-translate-y-2 transition-all duration-300 overflow-hidden group"
                >
                  {/* Header de la tarjeta */}
                  <div className="bg-gradient-to-r from-purple-600 to-fuchsia-600 p-6 relative">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                    <div className="flex items-center justify-between">
                      <UserIcon className="w-8 h-8 text-white" />
                      <span className="px-3 py-1 bg-white/20 rounded-full text-xs text-white">
                        #{idx + 1}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-white mt-3 line-clamp-1">
                      {alumno.alumno}
                    </h4>
                  </div>

                  {/* Contenido de la tarjeta */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <AcademicCapIcon className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Grado</p>
                        <p className="text-white text-sm font-medium">
                          {alumno.grado || "Sin grado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <span className="text-emerald-400 font-bold text-sm">
                          S
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Sección</p>
                        <p className="text-white text-sm font-medium">
                          {alumno.seccion || "Sin sección"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="bg-gray-700 px-6 py-4 flex justify-center">
                    <button
                      onClick={() =>
                        verCalificacionesAlumno(alumno.id_alumno, alumno.alumno)
                      }
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 font-medium shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <ChartBarIcon className="w-4 h-4" />
                      <span>Calificar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vista de Tabla */}
        {!isLoading && alumnosFiltrados.length > 0 && viewMode === "table" && (
          <div className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-700">
            <div className="px-6 py-4 bg-gray-900 border-b border-gray-700">
              <h3 className="text-lg font-bold text-white flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2 text-purple-400" />
                Tabla de Estudiantes
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Grado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Sección
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {alumnosOrdenados.map((alumno, idx) => (
                    <tr
                      key={alumno.id_alumno}
                      className="hover:bg-gray-700 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        #{idx + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {alumno.alumno}
                            </div>
                            <div className="text-sm text-gray-400">
                              ID: {alumno.id_alumno}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-300 rounded-full">
                          {alumno.grado || "Sin grado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-300 rounded-full">
                          {alumno.seccion || "Sin sección"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() =>
                            verCalificacionesAlumno(
                              alumno.id_alumno,
                              alumno.alumno
                            )
                          }
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 shadow-sm transform hover:scale-105 transition-all duration-200"
                        >
                          <ChartBarIcon className="w-4 h-4 mr-2" />
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
      </div>
    </div>
  );
}

export default CalificacionesPage;
