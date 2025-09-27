import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
// Agregar imports para jsPDF
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  UserIcon,
  PrinterIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EyeIcon,
  MapPinIcon,
  // Agregar nuevo icono para PDF
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

function EditableCalificacionRow({cal, token, onGuardado, nombreAlumno}) {
  const [b1, setB1] = useState(cal.bimestre_1);
  const [b2, setB2] = useState(cal.bimestre_2);
  const [b3, setB3] = useState(cal.bimestre_3);
  const [b4, setB4] = useState(cal.bimestre_4);
  const [coment, setComent] = useState(cal.comentarios || "");
  const [guardando, setGuardando] = useState(false);
  const [grado, setGrado] = useState(cal.id_grado);

  // Calcula semestres y nota final en tiempo real
  const semestre_1 = (parseFloat(b1) + parseFloat(b2)) / 2;
  const semestre_2 = (parseFloat(b3) + parseFloat(b4)) / 2;
  const nota_final =
    (parseFloat(b1) + parseFloat(b2) + parseFloat(b3) + parseFloat(b4)) / 4;

  const guardar = async () => {
    setGuardando(true);
    await api.put(
      services.calificaciones + `/${cal.id_calificacion}`,
      {
        bimestre_1: b1,
        bimestre_2: b2,
        bimestre_3: b3,
        bimestre_4: b4,
        comentarios: coment,
      },
      {headers: {Authorization: `Bearer ${token}`}}
    );
    setGuardando(false);
    onGuardado(cal.id_alumno, nombreAlumno);
  };

  return (
    <tr className="text-center border-b">
      <td>{cal.materia}</td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          value={b1}
          onChange={(e) => {
            let val = Number(e.target.value);
            if (val < 0) val = 0;
            if (val > 100) val = 100;
            setB1(val);
          }}
          className={`w-16 text-center border rounded ${
            b1 < 60 ? "text-red-600 font-bold" : "text-green-700 font-bold"
          }`}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          value={b2}
          onChange={(e) => setB2(e.target.value)}
          className="w-16 text-center border rounded"
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          value={b3}
          onChange={(e) => setB3(e.target.value)}
          className="w-16 text-center border rounded"
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={100}
          value={b4}
          onChange={(e) => setB4(e.target.value)}
          className="w-16 text-center border rounded"
        />
      </td>
      <td>{isNaN(semestre_1) ? "" : semestre_1.toFixed(2)}</td>
      <td>{isNaN(semestre_2) ? "" : semestre_2.toFixed(2)}</td>
      <td>{isNaN(nota_final) ? "" : nota_final.toFixed(2)}</td>
      <td>
        <textarea
          value={coment}
          onChange={(e) => setComent(e.target.value)}
          className="w-32 border rounded"
        />
      </td>
      <td>
        <button
          className="bg-blue-600 text-white px-2 py-1 rounded"
          onClick={guardar}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

function CalificacionesPage() {
  const [calificaciones, setCalificaciones] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [alumnosLista, setAlumnosLista] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [vistaAlumno, setVistaAlumno] = useState(null);
  const [calificacionesAlumno, setCalificacionesAlumno] = useState([]);
  const [nombreAlumno, setNombreAlumno] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [comentarioGeneral, setComentarioGeneral] = useState("");

  // Nuevos estados para funcionalidades adicionales
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // "cards" o "table"
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState("asc");
  const [mensaje, setMensaje] = useState("");

  // Estados adicionales para impresión
  const [mostrarVistaImpresion, setMostrarVistaImpresion] = useState(false);
  const [datosCompletos, setDatosCompletos] = useState({
    estudiante: null,
    escuela: null,
    profesor: null,
    codigoMined: "",
    fechaGeneracion: new Date().toLocaleDateString(),
  });

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
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchAlumnosLista();
    // eslint-disable-next-line
  }, [filtroGrado, filtroSeccion]);

  const fetchCalificaciones = async () => {
    let url = "http://localhost:4000/api/calificaciones/todas";
    if (filtroGrado || filtroSeccion || filtroMateria) {
      const params = [];
      if (filtroGrado) params.push(`id_grado=${filtroGrado}`);
      if (filtroSeccion) params.push(`id_seccion=${filtroSeccion}`);
      if (filtroMateria) params.push(`id_materia=${filtroMateria}`);
      url = `http://localhost:4000/api/calificaciones/filtrar?${params.join(
        "&"
      )}`;
    }
    try {
      const res = await api.get(url, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setCalificaciones(res.data);
    } catch (error) {
      setMensaje("Error al cargar calificaciones");
    }
  };

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

  // Vista de calificaciones por alumno
  const verCalificacionesAlumno = async (id_alumno, nombre) => {
    setNombreAlumno(nombre);
    setVistaAlumno(id_alumno);
    try {
      const res = await api.get(
        services.calificacionesMateriasAlumno + `/${id_alumno}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setCalificacionesAlumno(res.data);

      // Obtener datos adicionales del estudiante para impresión
      await obtenerDatosCompletos(id_alumno);
    } catch (error) {
      setMensaje("Error al cargar calificaciones del alumno");
    }
  };

  // Obtener datos completos del estudiante para la impresión
  const obtenerDatosCompletos = async (id_alumno) => {
    try {
      // Obtener datos del estudiante
      const estudianteRes = await api.get(`${services.alumnos}/${id_alumno}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // Obtener datos de la escuela
      const escuelaRes = await api.get(`${services.escuelas}`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // Obtener datos del profesor (asumiendo que hay un endpoint para esto)
      let profesorData = null;
      try {
        const profesorRes = await api.get(`${services.profesores}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        profesorData = profesorRes.data[0]; // Tomar el primer profesor como ejemplo
      } catch (error) {
        console.log("No se pudo obtener información del profesor");
      }

      setDatosCompletos({
        estudiante: estudianteRes.data,
        escuela: escuelaRes.data[0] || null, // Tomar la primera escuela
        profesor: profesorData,
        codigoMined: estudianteRes.data.codigo_mined || "N/A",
        fechaGeneracion: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.log("Error al obtener datos completos:", error);
      setMensaje("Error al cargar datos adicionales del estudiante");
    }
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

  // Calcular estadísticas de calificaciones del alumno actual
  const calcularEstadisticasAlumno = (calificaciones) => {
    if (!calificaciones || calificaciones.length === 0) return null;

    const materias = calificaciones.length;
    let totalNotas = 0;
    let notasReprobadas = 0;
    let notasExcelentes = 0;
    let totalBimestres = 0;

    calificaciones.forEach((cal) => {
      const notas = [
        cal.bimestre_1,
        cal.bimestre_2,
        cal.bimestre_3,
        cal.bimestre_4,
      ].filter((n) => n && n > 0);
      notas.forEach((nota) => {
        totalNotas += parseFloat(nota);
        totalBimestres++;
        if (nota < 60) notasReprobadas++;
        if (nota >= 90) notasExcelentes++;
      });
    });

    const promedio = totalBimestres > 0 ? totalNotas / totalBimestres : 0;

    return {
      materias,
      promedio: promedio.toFixed(2),
      reprobadas: notasReprobadas,
      excelentes: notasExcelentes,
      totalBimestres,
    };
  };

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

  // Función para exportar calificaciones a CSV
  const exportarCSV = () => {
    if (!calificacionesAlumno || calificacionesAlumno.length === 0) {
      setMensaje("No hay calificaciones para exportar");
      return;
    }

    const headers = [
      "Materia",
      "I Bimestre",
      "II Bimestre",
      "I Semestre",
      "III Bimestre",
      "IV Bimestre",
      "II Semestre",
      "Nota Final",
      "Comentarios",
    ];

    const rows = calificacionesAlumno.map((cal) => {
      const b1 = Number(cal.bimestre_1) || 0;
      const b2 = Number(cal.bimestre_2) || 0;
      const b3 = Number(cal.bimestre_3) || 0;
      const b4 = Number(cal.bimestre_4) || 0;
      const semestre1 = ((b1 + b2) / 2).toFixed(2);
      const semestre2 = ((b3 + b4) / 2).toFixed(2);
      const notaFinal = ((b1 + b2 + b3 + b4) / 4).toFixed(2);

      return [
        cal.materia,
        b1,
        b2,
        semestre1,
        b3,
        b4,
        semestre2,
        notaFinal,
        cal.comentarios || "",
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `calificaciones_${nombreAlumno.replace(/\s+/g, "_")}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMensaje("Calificaciones exportadas correctamente");
  };

  // Función mejorada para exportar a PDF usando jsPDF-AutoTable
  const exportarPDF = async () => {
    if (!calificacionesAlumno || calificacionesAlumno.length === 0) {
      setMensaje("No hay calificaciones para exportar");
      return;
    }

    try {
      const doc = new jsPDF("p", "mm", "a4");

      // Configurar fuentes
      doc.setFont("helvetica", "bold");

      // Header con información de la escuela
      let yPosition = 20;

      // Logo y nombre de la escuela
      if (datosCompletos.escuela) {
        doc.setFontSize(16);
        doc.text(
          datosCompletos.escuela.nombre || "Institución Educativa",
          105,
          yPosition,
          {align: "center"}
        );
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        if (datosCompletos.escuela.direccion) {
          doc.text(datosCompletos.escuela.direccion, 105, yPosition, {
            align: "center",
          });
          yPosition += 6;
        }
        if (datosCompletos.escuela.telefono) {
          doc.text(`Tel: ${datosCompletos.escuela.telefono}`, 105, yPosition, {
            align: "center",
          });
          yPosition += 6;
        }
      }

      // Título del documento
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("BOLETÍN DE CALIFICACIONES", 105, yPosition + 10, {
        align: "center",
      });
      yPosition += 20;

      // Información del estudiante
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const studentInfo = [
        ["Nombre:", nombreAlumno],
        ["Código MINED:", datosCompletos.codigoMined || "N/A"],
        [
          "Grado:",
          `${datosCompletos.estudiante?.grado || "N/A"} - ${
            datosCompletos.estudiante?.seccion || "N/A"
          }`,
        ],
        ["Año Académico:", new Date().getFullYear()],
        ["Fecha de Emisión:", datosCompletos.fechaGeneracion],
      ];

      // Crear tabla de información del estudiante
      doc.autoTable({
        startY: yPosition,
        body: studentInfo,
        theme: "plain",
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        columnStyles: {
          0: {fontStyle: "bold", cellWidth: 40},
          1: {cellWidth: "auto"},
        },
        tableWidth: "wrap",
        margin: {left: 20},
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      // Preparar datos de la tabla de calificaciones
      const tableData = calificacionesAlumno.map((cal, index) => {
        const b1 = Number(cal.bimestre_1) || 0;
        const b2 = Number(cal.bimestre_2) || 0;
        const b3 = Number(cal.bimestre_3) || 0;
        const b4 = Number(cal.bimestre_4) || 0;
        const semestre1 = ((b1 + b2) / 2).toFixed(1);
        const semestre2 = ((b3 + b4) / 2).toFixed(1);
        const notaFinal = ((b1 + b2 + b3 + b4) / 4).toFixed(1);

        return [
          index + 1,
          cal.materia,
          b1 > 0 ? b1.toString() : "-",
          b2 > 0 ? b2.toString() : "-",
          isNaN(parseFloat(semestre1)) ? "-" : semestre1,
          b3 > 0 ? b3.toString() : "-",
          b4 > 0 ? b4.toString() : "-",
          isNaN(parseFloat(semestre2)) ? "-" : semestre2,
          isNaN(parseFloat(notaFinal)) ? "-" : notaFinal,
          cal.comentarios || "-",
        ];
      });

      // Crear tabla principal de calificaciones
      doc.autoTable({
        head: [
          [
            "#",
            "Materia",
            "I Bim",
            "II Bim",
            "I Sem",
            "III Bim",
            "IV Bim",
            "II Sem",
            "Final",
            "Observaciones",
          ],
        ],
        body: tableData,
        startY: yPosition,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold",
          halign: "center",
        },
        styles: {
          fontSize: 7,
          cellPadding: 3,
          halign: "center",
        },
        columnStyles: {
          0: {cellWidth: 8, halign: "center"},
          1: {cellWidth: 35, halign: "left"},
          2: {cellWidth: 12},
          3: {cellWidth: 12},
          4: {cellWidth: 12, fontStyle: "bold"},
          5: {cellWidth: 12},
          6: {cellWidth: 12},
          7: {cellWidth: 12, fontStyle: "bold"},
          8: {cellWidth: 15, fontStyle: "bold", fillColor: [240, 248, 255]},
          9: {cellWidth: "auto", halign: "left", fontSize: 6},
        },
        // Colorear filas según las calificaciones
        didParseCell: (data) => {
          const columnIndex = data.column.index;
          const cellValue = parseFloat(data.cell.text[0]);

          // Colorear las notas según el rendimiento
          if ([2, 3, 5, 6, 8].includes(columnIndex) && !isNaN(cellValue)) {
            if (cellValue < 60) {
              data.cell.styles.textColor = [220, 53, 69]; // Rojo para reprobado
              data.cell.styles.fontStyle = "bold";
            } else if (cellValue >= 90) {
              data.cell.styles.textColor = [40, 167, 69]; // Verde para excelente
              data.cell.styles.fontStyle = "bold";
            } else if (columnIndex === 8) {
              // Nota final
              data.cell.styles.textColor = [0, 123, 255]; // Azul para nota final
            }
          }
        },
        margin: {top: 10, right: 10, bottom: 10, left: 10},
        tableWidth: "auto",
      });

      // Estadísticas del estudiante
      const estadisticasAlumno =
        calcularEstadisticasAlumno(calificacionesAlumno);
      if (estadisticasAlumno) {
        yPosition = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN ACADÉMICO", 20, yPosition);

        const statsData = [
          ["Total de Materias:", estadisticasAlumno.materias],
          ["Promedio General:", estadisticasAlumno.promedio],
          ["Notas Excelentes (≥90):", estadisticasAlumno.excelentes],
          ["Notas Reprobadas (<60):", estadisticasAlumno.reprobadas],
        ];

        doc.autoTable({
          body: statsData,
          startY: yPosition + 8,
          theme: "plain",
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          columnStyles: {
            0: {fontStyle: "bold", cellWidth: 50},
            1: {fontStyle: "bold", cellWidth: 20, halign: "center"},
          },
          tableWidth: "wrap",
          margin: {left: 20},
        });
      }

      // Escala de calificación
      yPosition = doc.lastAutoTable.finalY + 15;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("ESCALA DE CALIFICACIÓN", 20, yPosition);

      const scaleData = [
        ["Excelente", "90-100"],
        ["Muy Bueno", "80-89"],
        ["Bueno", "70-79"],
        ["Regular", "60-69"],
        ["Reprobado", "< 60"],
      ];

      doc.autoTable({
        body: scaleData,
        startY: yPosition + 5,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        columnStyles: {
          0: {cellWidth: 25, fontStyle: "bold"},
          1: {cellWidth: 25, halign: "center"},
        },
        tableWidth: "wrap",
        margin: {left: 20},
      });

      // Firmas
      const pageHeight = doc.internal.pageSize.height;
      const signatureY = Math.max(
        doc.lastAutoTable.finalY + 30,
        pageHeight - 50
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      // Líneas para firmas
      doc.line(20, signatureY, 70, signatureY);
      doc.line(75, signatureY, 125, signatureY);
      doc.line(130, signatureY, 180, signatureY);

      doc.text("Director(a)", 45, signatureY + 8, {align: "center"});
      doc.text("Profesor(a) Guía", 100, signatureY + 8, {align: "center"});
      doc.text("Padre/Madre o Tutor", 155, signatureY + 8, {align: "center"});

      // Footer
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Este documento es generado automáticamente por el Sistema AOC de Gestión Escolar",
        105,
        pageHeight - 15,
        {align: "center"}
      );
      doc.text(
        `Fecha de generación: ${datosCompletos.fechaGeneracion} - Válido únicamente con sello y firma institucional`,
        105,
        pageHeight - 10,
        {align: "center"}
      );

      // Guardar el PDF
      const fileName = `Boletin_${nombreAlumno.replace(
        /\s+/g,
        "_"
      )}_${new Date().getFullYear()}.pdf`;
      doc.save(fileName);

      setMensaje("Boletín exportado correctamente en formato PDF");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      setMensaje("Error al exportar el boletín en PDF");
    }
  };

  // Función para generar reporte consolidado de todos los estudiantes
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

      // Crear tabla consolidada
      doc.autoTable({
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

      doc.autoTable({
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

  // Función para imprimir las calificaciones con impresión limpia
  const imprimirCalificaciones = () => {
    // Ocultar elementos innecesarios antes de imprimir
    const elementsToHide = [
      "header",
      "nav",
      ".sidebar",
      ".header",
      '[data-testid="sidebar"]',
      '[role="navigation"]',
      ".no-print",
    ];

    elementsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.display = "none";
      });
    });

    // Aplicar estilos específicos para impresión
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    setMostrarVistaImpresion(true);

    // Pequeño delay para que se renderice la vista de impresión
    setTimeout(() => {
      window.print();

      // Restaurar elementos después de imprimir
      setTimeout(() => {
        elementsToHide.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            el.style.display = "";
          });
        });
        document.body.style.margin = "";
        document.body.style.padding = "";
        setMostrarVistaImpresion(false);
      }, 1000);
    }, 500);
  };

  // Función para vista previa de impresión
  const toggleVistaPrevia = () => {
    setMostrarVistaImpresion(!mostrarVistaImpresion);
  };

  // Componente de vista previa para impresión
  const VistaImpresion = () => {
    if (!mostrarVistaImpresion) return null;

    const estadisticasAlumno = calcularEstadisticasAlumno(calificacionesAlumno);

    return (
      <div
        className={`fixed inset-0 z-50 overflow-y-auto print:static print:z-auto ${
          mostrarVistaImpresion ? "bg-white print-preview" : "bg-white"
        }`}
      >
        <div className="max-w-4xl mx-auto p-8 print:p-0 print:max-w-none print:mx-0 preview-content">
          {/* Header del reporte */}
          <div className="flex items-start justify-between mb-6 print:mb-4 border-b-2 border-gray-300 pb-4 print:pb-3 print-only">
            <div className="flex items-center space-x-6">
              {/* Logo de la escuela */}
              <div className="flex-shrink-0">
                {datosCompletos.escuela && datosCompletos.escuela.logo ? (
                  <img
                    src={`http://localhost:4000/uploads/logos/${datosCompletos.escuela.logo}`}
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
                    display: datosCompletos.escuela?.logo ? "none" : "flex",
                  }}
                >
                  <BuildingLibraryIcon className="w-12 h-12 text-white print:w-10 print:h-10" />
                </div>
              </div>

              {/* Información de la escuela */}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 print:text-xl">
                  {datosCompletos.escuela
                    ? datosCompletos.escuela.nombre
                    : "Nombre de la Escuela"}
                </h1>
                {datosCompletos.escuela && (
                  <>
                    <p className="text-gray-600 flex items-center mb-1 print:text-xs">
                      <MapPinIcon className="w-3 h-3 mr-1 print:w-2 print:h-2" />
                      {datosCompletos.escuela.direccion ||
                        "Dirección no disponible"}
                    </p>
                    {datosCompletos.escuela.telefono && (
                      <p className="text-gray-600 flex items-center mb-1 print:text-xs">
                        <PhoneIcon className="w-3 h-3 mr-1 print:w-2 print:h-2" />
                        {datosCompletos.escuela.telefono}
                      </p>
                    )}
                    {datosCompletos.escuela.codigo_escuela && (
                      <p className="text-gray-600 text-xs print:text-xs">
                        Código Escuela: {datosCompletos.escuela.codigo_escuela}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Información del reporte */}
            <div className="text-right text-sm text-gray-600 print:text-xs">
              <p className="flex items-center justify-end mb-1">
                <CalendarDaysIcon className="w-3 h-3 mr-1 print:w-2 print:h-2" />
                {datosCompletos.fechaGeneracion}
              </p>
              <p className="font-semibold text-base print:text-sm">
                BOLETÍN DE CALIFICACIONES
              </p>
              <p className="print:text-xs">Año Académico 2025</p>
            </div>
          </div>

          {/* Información del estudiante - Eliminada la foto */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4 print:bg-gray-100 print:border print:border-gray-300 print:p-3 print:rounded-none print:mb-3 avoid-break">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center print:text-base print:mb-2">
              <UserIcon className="w-5 h-5 mr-2 text-blue-600 print:w-4 print:h-4" />
              Información del Estudiante
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 print:gap-2">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Nombre Completo
                </p>
                <p className="text-base font-semibold text-gray-900 print:text-sm">
                  {nombreAlumno}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Código MINED
                </p>
                <p className="text-base font-semibold text-gray-900 print:text-sm">
                  {datosCompletos.codigoMined || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Grado y Sección
                </p>
                <p className="text-base font-semibold text-gray-900 print:text-sm">
                  {datosCompletos.estudiante?.grado || "N/A"} -{" "}
                  {datosCompletos.estudiante?.seccion || "N/A"}
                </p>
              </div>

              {datosCompletos.profesor && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Profesor Guía
                  </p>
                  <p className="text-base font-semibold text-gray-900 print:text-sm">
                    {datosCompletos.profesor.nombre ||
                      datosCompletos.profesor.nombres}{" "}
                    {datosCompletos.profesor.apellidos || ""}
                  </p>
                </div>
              )}

              {datosCompletos.estudiante?.fecha_nacimiento && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Fecha de Nacimiento
                  </p>
                  <p className="text-base font-semibold text-gray-900 print:text-sm">
                    {new Date(
                      datosCompletos.estudiante.fecha_nacimiento
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  ID del Estudiante
                </p>
                <p className="text-base font-semibold text-gray-900 print:text-sm">
                  {datosCompletos.estudiante?.id_alumno || vistaAlumno}
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de calificaciones */}
          <div className="mb-4 avoid-break">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center print:text-base print:mb-2">
              <ChartBarIcon className="w-5 h-5 mr-2 text-green-600 print:w-4 print:h-4" />
              Registro de Calificaciones
            </h3>

            <div className="overflow-x-auto border border-gray-300 rounded-lg print:rounded-none">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 print:bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                      Materia
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      I Bim
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      II Bim
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      I Sem
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      III Bim
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      IV Bim
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      II Sem
                    </th>
                    <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300 print:px-1 print:py-1">
                      Final
                    </th>
                    <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300 print:px-2 print:py-1">
                      Observaciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calificacionesAlumno.map((cal, idx) => {
                    const b1 = Number(cal.bimestre_1) || 0;
                    const b2 = Number(cal.bimestre_2) || 0;
                    const b3 = Number(cal.bimestre_3) || 0;
                    const b4 = Number(cal.bimestre_4) || 0;
                    const semestre_1 = (b1 + b2) / 2;
                    const semestre_2 = (b3 + b4) / 2;
                    const nota_final = (b1 + b2 + b3 + b4) / 4;

                    return (
                      <tr
                        key={cal.id_materia}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2 font-medium text-gray-900 print:px-2 print:py-1">
                          {cal.materia}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-semibold print:px-1 print:py-1 ${
                            b1 < 60
                              ? "text-red-600"
                              : b1 >= 90
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {b1 > 0 ? b1.toFixed(0) : "-"}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-semibold print:px-1 print:py-1 ${
                            b2 < 60
                              ? "text-red-600"
                              : b2 >= 90
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {b2 > 0 ? b2.toFixed(0) : "-"}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-bold print:px-1 print:py-1 ${
                            semestre_1 < 60
                              ? "text-red-600"
                              : semestre_1 >= 90
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {isNaN(semestre_1) ? "-" : semestre_1.toFixed(1)}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-semibold print:px-1 print:py-1 ${
                            b3 < 60
                              ? "text-red-600"
                              : b3 >= 90
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {b3 > 0 ? b3.toFixed(0) : "-"}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-semibold print:px-1 print:py-1 ${
                            b4 < 60
                              ? "text-red-600"
                              : b4 >= 90
                              ? "text-green-600"
                              : "text-gray-900"
                          }`}
                        >
                          {b4 > 0 ? b4.toFixed(0) : "-"}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-bold print:px-1 print:py-1 ${
                            semestre_2 < 60
                              ? "text-red-600"
                              : semestre_2 >= 90
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {isNaN(semestre_2) ? "-" : semestre_2.toFixed(1)}
                        </td>
                        <td
                          className={`px-2 py-2 text-center font-bold print:px-1 print:py-1 ${
                            nota_final < 60
                              ? "text-red-600 bg-red-50"
                              : nota_final >= 90
                              ? "text-green-600 bg-green-50"
                              : "text-blue-600 bg-blue-50"
                          }`}
                        >
                          {isNaN(nota_final) ? "-" : nota_final.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-24 print:px-2 print:py-1">
                          {cal.comentarios || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estadísticas del estudiante */}
          {estadisticasAlumno && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:gap-3 print:mb-3 avoid-break">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 print:bg-blue-25 print:rounded-none print:p-2">
                <h4 className="font-bold text-blue-900 mb-2 text-sm">
                  Resumen Académico
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total de Materias:</span>
                    <span className="font-semibold text-blue-900">
                      {estadisticasAlumno.materias}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Promedio General:</span>
                    <span
                      className={`font-bold ${
                        parseFloat(estadisticasAlumno.promedio) >= 70
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {estadisticasAlumno.promedio}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">
                      Notas Excelentes (≥90):
                    </span>
                    <span className="font-semibold text-green-600">
                      {estadisticasAlumno.excelentes}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">
                      Notas Reprobadas (&lt;60):
                    </span>
                    <span className="font-semibold text-red-600">
                      {estadisticasAlumno.reprobadas}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 print:bg-gray-25 print:rounded-none print:p-2">
                <h4 className="font-bold text-gray-900 mb-2 text-sm">
                  Escala de Calificación
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span>Excelente:</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-semibold">
                      90-100
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Muy Bueno:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      80-89
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bueno:</span>
                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      70-79
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Regular:</span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded text-xs font-semibold">
                      60-69
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Reprobado:</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-semibold">
                      &lt;60
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Firmas */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-300 print:mt-6 print:gap-4 print:pt-4 print-only">
            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-400 mb-2 print:h-10"></div>
              <p className="text-xs font-semibold text-gray-700">Director(a)</p>
              <p className="text-xs text-gray-500">
                {datosCompletos.escuela?.nombre_director ||
                  "Nombre del Director"}
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-400 mb-2 print:h-10"></div>
              <p className="text-xs font-semibold text-gray-700">
                Profesor(a) Guía
              </p>
              <p className="text-xs text-gray-500">
                {datosCompletos.profesor
                  ? `${
                      datosCompletos.profesor.nombre ||
                      datosCompletos.profesor.nombres
                    } ${datosCompletos.profesor.apellidos || ""}`
                  : "Nombre del Profesor"}
              </p>
            </div>

            <div className="text-center">
              <div className="h-12 border-b-2 border-gray-400 mb-2 print:h-10"></div>
              <p className="text-xs font-semibold text-gray-700">
                Padre/Madre o Tutor
              </p>
              <p className="text-xs text-gray-500">Firma del Responsable</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-200 pt-3 print:mt-4 print:pt-2 print-only">
            <p>
              Este documento es generado automáticamente por el Sistema AOC de
              Gestión Escolar
            </p>
            <p>
              Fecha de generación: {datosCompletos.fechaGeneracion} - Válido
              únicamente con sello y firma institucional
            </p>
          </div>

          {/* Botones de acción (solo visibles en pantalla) */}
          <div className="fixed bottom-6 right-6 space-y-3 print:hidden no-print">
            <button
              onClick={() => setMostrarVistaImpresion(false)}
              className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-lg transition-colors"
            >
              Vista Normal
            </button>
            <button
              onClick={imprimirCalificaciones}
              className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-colors flex items-center justify-center"
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Estilos específicos para impresión limpia */}
        <style jsx>{`
          @media print {
            /* Ocultar todo lo que no sea contenido principal */
            body * {
              visibility: hidden;
            }

            .print-preview,
            .print-preview * {
              visibility: visible;
            }

            .print-only,
            .print-only * {
              visibility: visible !important;
            }

            .no-print,
            .print\\:hidden {
              display: none !important;
              visibility: hidden !important;
            }

            .preview-content,
            .preview-content * {
              visibility: visible;
            }

            /* Configuración de página */
            @page {
              size: A4;
              margin: 10mm;
            }

            /* Resetear estilos para impresión */
            html,
            body {
              width: 210mm;
              height: 297mm;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.2;
              color: black;
              background: white;
            }

            /* Contenedor principal */
            .print-preview {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              color: black !important;
            }

            /* Ocultar elementos específicos */
            header,
            nav,
            .sidebar,
            .header,
            [data-testid="sidebar"],
            [role="navigation"] {
              display: none !important;
            }

            /* Evitar saltos de página en elementos importantes */
            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }

            /* Ajustar tamaños para impresión optimizada */
            .print\\:text-xs {
              font-size: 0.65rem !important;
            }
            .print\\:text-sm {
              font-size: 0.75rem !important;
            }
            .print\\:text-base {
              font-size: 0.8rem !important;
            }
            .print\\:text-lg {
              font-size: 0.9rem !important;
            }
            .print\\:text-xl {
              font-size: 1rem !important;
            }
            .print\\:w-16 {
              width: 4rem !important;
            }
            .print\\:h-16 {
              width: 4rem !important;
            }
            .print\\:w-10 {
              width: 2.5rem !important;
            }
            .print\\:h-10 {
              height: 2.5rem !important;
            }
            .print\\:w-4 {
              width: 1rem !important;
            }
            .print\\:h-4 {
              height: 1rem !important;
            }
            .print\\:w-2 {
              width: 0.5rem !important;
            }
            .print\\:h-2 {
              height: 0.5rem !important;
            }
            .print\\:px-2 {
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }
            .print\\:py-1 {
              padding-top: 0.25rem !important;
              padding-bottom: 0.25rem !important;
            }
            .print\\:px-1 {
              padding-left: 0.25rem !important;
              padding-right: 0.25rem !important;
            }
            .print\\:gap-3 {
              gap: 0.75rem !important;
            }
            .print\\:gap-4 {
              gap: 1rem !important;
            }
            .print\\:mt-6 {
              margin-top: 1.5rem !important;
            }
            .print\\:mt-4 {
              margin-top: 1rem !important;
            }
            .print\\:mb-4 {
              margin-bottom: 1rem !important;
            }
            .print\\:mb-3 {
              margin-bottom: 0.75rem !important;
            }
            .print\\:mb-2 {
              margin-bottom: 0.5rem !important;
            }
            .print\\:p-3 {
              padding: 0.75rem !important;
            }
            .print\\:p-2 {
              padding: 0.5rem !important;
            }
            .print\\:pt-4 {
              padding-top: 1rem !important;
            }
            .print\\:pt-2 {
              padding-top: 0.5rem !important;
            }
            .print\\:pb-3 {
              padding-bottom: 0.75rem !important;
            }
            .print\\:rounded-none {
              border-radius: 0 !important;
            }

            /* Fondos para impresión */
            .print\\:bg-gray-100 {
              background-color: #f3f4f6 !important;
            }
            .print\\:bg-gray-50 {
              background-color: #f9fafb !important;
            }
            .print\\:bg-blue-25 {
              background-color: #eff6ff !important;
            }
            .print\\:bg-gray-25 {
              background-color: #f9fafb !important;
            }
          }

          /* Estilos para vista previa */
          .print-preview {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }

          .preview-content {
            background: white;
            color: black;
            min-height: 100vh;
          }

          .preview-content h1,
          .preview-content h2,
          .preview-content h3,
          .preview-content h4,
          .preview-content p,
          .preview-content span,
          .preview-content td,
          .preview-content th {
            color: black !important;
          }
        `}</style>
      </div>
    );
  };

  // Maneja el cambio de inputs en la tabla
  const handleInputChange = (idx, campo, valor) => {
    setCalificacionesAlumno((prev) =>
      prev.map((cal, i) => (i === idx ? {...cal, [campo]: valor} : cal))
    );
  };

  // Guardar todas las calificaciones del alumno
  const guardarTodas = async () => {
    setGuardando(true);
    try {
      for (const cal of calificacionesAlumno) {
        // Si ya existe la calificación, actualiza; si no, crea
        if (cal.id_calificacion) {
          await api.put(
            services.calificaciones + `/${cal.id_calificacion}`,
            {
              bimestre_1: cal.bimestre_1,
              bimestre_2: cal.bimestre_2,
              bimestre_3: cal.bimestre_3,
              bimestre_4: cal.bimestre_4,
              comentarios: cal.comentarios,
            },
            {headers: {Authorization: `Bearer ${token}`}}
          );
        } else {
          await api.post(
            services.calificaciones,
            {
              id_alumno: vistaAlumno,
              id_materia: cal.id_materia,
              id_grado: cal.gradoid || cal.id_grado, // agrega esto si lo tienes
              id_seccion: cal.seccionid || cal.id_seccion, // agrega esto si lo tienes
              bimestre_1: cal.bimestre_1,
              bimestre_2: cal.bimestre_2,
              bimestre_3: cal.bimestre_3,
              bimestre_4: cal.bimestre_4,
              comentarios: cal.comentarios,
            },
            {headers: {Authorization: `Bearer ${token}`}}
          );
        }
      }
      setMensaje("Calificaciones guardadas correctamente");
      setVistaAlumno(null);
      fetchAlumnosLista();
    } catch (error) {
      setMensaje("Error al guardar las calificaciones");
    } finally {
      setGuardando(false);
    }
  };

  // Vista de materias y calificaciones del alumno seleccionado
  if (vistaAlumno) {
    const estadisticasAlumno = calcularEstadisticasAlumno(calificacionesAlumno);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Header del alumno */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-cyan-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex-1">
                <button
                  onClick={() => setVistaAlumno(null)}
                  className="mb-6 inline-flex items-center px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 backdrop-blur-sm transition-colors duration-200"
                >
                  ← Volver a la lista
                </button>

                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white mb-4 backdrop-blur-sm">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Calificaciones Individuales
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  Calificaciones de
                  <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                    {nombreAlumno}
                  </span>
                </h1>
                <p className="text-xl text-emerald-100 mb-8 max-w-2xl">
                  Sistema de evaluación bimestral con cálculo automático de
                  semestres y nota final.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={toggleVistaPrevia}
                    className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                  >
                    <EyeIcon className="w-5 h-5 mr-2" />
                    {mostrarVistaImpresion ? "Vista Normal" : "Vista Previa"}
                  </button>

                  <button
                    onClick={exportarPDF}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                  >
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Exportar PDF
                  </button>

                  <button
                    onClick={exportarCSV}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
                    Exportar CSV
                  </button>

                  <button
                    onClick={imprimirCalificaciones}
                    className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center"
                  >
                    <PrinterIcon className="w-5 h-5 mr-2" />
                    Imprimir
                  </button>
                </div>
              </div>

              {/* Estadísticas del alumno */}
              {estadisticasAlumno && (
                <div className="flex-1 mt-8 lg:mt-0 flex justify-center">
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 w-80">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">
                        Estadísticas del Estudiante
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-white">
                        <span>Materias</span>
                        <span className="font-bold text-yellow-400">
                          {estadisticasAlumno.materias}
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Promedio General</span>
                        <span
                          className={`font-bold ${
                            parseFloat(estadisticasAlumno.promedio) >= 70
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {estadisticasAlumno.promedio}
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Notas Excelentes</span>
                        <span className="font-bold text-emerald-400">
                          {estadisticasAlumno.excelentes}
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Notas Reprobadas</span>
                        <span className="font-bold text-red-400">
                          {estadisticasAlumno.reprobadas}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
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
                <select
                  className="px-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white"
                  value={grados}
                  onChange={(e) => setGrados(e.target.value)}
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
          {!isLoading &&
            alumnosFiltrados.length > 0 &&
            viewMode === "cards" && (
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
                            verCalificacionesAlumno(
                              alumno.id_alumno,
                              alumno.alumno
                            )
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
          {!isLoading &&
            alumnosFiltrados.length > 0 &&
            viewMode === "table" && (
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

  // Vista general: tabla de alumnos con filtros y botón Calificar
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
              mensaje.includes("correctamente")
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
