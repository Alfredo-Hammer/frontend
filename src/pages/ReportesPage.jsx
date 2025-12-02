import React, {useState, useEffect, useCallback} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DocumentChartBarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

function ReportesPage() {
  const [vistaActual, setVistaActual] = useState("menu"); // "menu", "sabana", "certificado"
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [selectedGrado, setSelectedGrado] = useState("");
  const [selectedSeccion, setSelectedSeccion] = useState("");
  const [selectedBimestre, setSelectedBimestre] = useState("s1");
  const [selectedGenero, setSelectedGenero] = useState("todos");
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);
  const [profesor, setProfesor] = useState(null);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [estudiantePreview, setEstudiantePreview] = useState(null);

  const token = localStorage.getItem("token");

  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_usuario: res.data.usuario?.id_usuario || res.data.id_usuario,
        id_profesor: res.data.usuario?.id_profesor,
      });

      // Cargar información de la escuela
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }

      // Si es profesor, cargar su información completa
      if (res.data.usuario?.id_profesor) {
        const profesorRes = await api.get(
          `/api/profesores/${res.data.usuario.id_profesor}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        console.log("Datos del profesor cargados:", profesorRes.data);
        setProfesor(profesorRes.data);
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  }, [token]);

  const fetchGrados = useCallback(async () => {
    if (!user) return;

    try {
      const esProfesor = user?.rol?.toLowerCase() === "profesor";

      if (esProfesor && user?.id_profesor) {
        // Si es profesor, cargar sus grados asignados
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/asignaciones`,
          {headers: {Authorization: `Bearer ${token}`}}
        );

        const asignacionesData = asignacionesRes.data.asignaciones || [];

        // Extraer grados únicos con su información completa
        const gradosUnicos = [];
        const gradosIds = new Set();

        asignacionesData.forEach((asig) => {
          if (!gradosIds.has(asig.id_grado)) {
            gradosIds.add(asig.id_grado);
            gradosUnicos.push({
              id_grado: asig.id_grado,
              nombre: asig.nombre_grado || `Grado ${asig.id_grado}`,
            });
          }
        });

        setGrados(gradosUnicos);

        // Seleccionar automáticamente el primer grado disponible
        if (gradosUnicos.length > 0 && !selectedGrado) {
          setSelectedGrado(gradosUnicos[0].id_grado.toString());
        }
      } else {
        // Para admin/director, cargar todos los grados
        const gradosRes = await api.get("/api/grados", {
          headers: {Authorization: `Bearer ${token}`},
        });
        setGrados(gradosRes.data);

        // Seleccionar automáticamente el primer grado disponible
        if (gradosRes.data.length > 0 && !selectedGrado) {
          setSelectedGrado(gradosRes.data[0].id_grado.toString());
        }
      }
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  }, [user, token]);

  const fetchSecciones = useCallback(async () => {
    if (!user) return;

    try {
      const esProfesor = user?.rol?.toLowerCase() === "profesor";

      if (esProfesor && user?.id_profesor) {
        // Si es profesor, cargar sus secciones asignadas
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/asignaciones`,
          {headers: {Authorization: `Bearer ${token}`}}
        );

        const asignacionesData = asignacionesRes.data.asignaciones || [];

        // Filtrar secciones por el grado seleccionado
        const seccionesDelGrado = asignacionesData
          .filter((asig) => asig.id_grado.toString() === selectedGrado)
          .map((asig) => ({
            id_seccion: asig.id_seccion,
            nombre: asig.nombre_seccion || `Sección ${asig.id_seccion}`,
            id_grado: asig.id_grado,
          }));

        setSecciones(seccionesDelGrado);

        // Seleccionar automáticamente la primera sección disponible
        if (seccionesDelGrado.length > 0 && !selectedSeccion) {
          setSelectedSeccion(seccionesDelGrado[0].id_seccion.toString());
        }
      } else {
        // Para admin/secretaria, cargar secciones filtradas por grado
        if (selectedGrado) {
          const seccionesRes = await api.get(
            `/api/secciones?id_grado=${selectedGrado}`,
            {headers: {Authorization: `Bearer ${token}`}}
          );

          // Normalizar estructura de datos
          const seccionesNormalizadas = seccionesRes.data.map((seccion) => ({
            id_seccion: seccion.id_seccion,
            nombre:
              seccion.nombre_seccion ||
              seccion.nombre ||
              `Sección ${seccion.id_seccion}`,
            id_grado: seccion.id_grado,
          }));

          setSecciones(seccionesNormalizadas);

          // Seleccionar automáticamente la primera sección disponible
          if (seccionesNormalizadas.length > 0 && !selectedSeccion) {
            setSelectedSeccion(seccionesNormalizadas[0].id_seccion.toString());
          }
        }
      }
    } catch (error) {
      console.error("Error al cargar secciones:", error);
    }
  }, [user, token, selectedGrado, selectedSeccion]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user) {
      fetchGrados();
    }
  }, [user, fetchGrados]);

  // Cargar secciones cuando cambie el grado seleccionado
  useEffect(() => {
    if (user && selectedGrado) {
      fetchSecciones();
    }
  }, [user, selectedGrado, fetchSecciones]);

  // Cargar reporte automáticamente cuando se seleccionen grado y sección
  useEffect(() => {
    if (
      selectedGrado &&
      selectedSeccion &&
      (vistaActual === "sabana" || vistaActual === "certificado")
    ) {
      cargarReporte();
    }
  }, [selectedGrado, selectedSeccion, vistaActual]);

  // Cargar grados cuando se entra a la vista sabana o certificado
  useEffect(() => {
    if (user && (vistaActual === "sabana" || vistaActual === "certificado")) {
      fetchGrados();
    }
  }, [vistaActual, user]);

  // Helper para determinar qué columnas mostrar según el bimestre seleccionado
  const getColumnasVisibles = () => {
    // Para semestre 1: mostrar I BIM, II BIM y I SEM
    if (selectedBimestre === "s1") {
      return {
        b1: true,
        b2: true,
        s1: true,
        b3: false,
        b4: false,
        s2: false,
        final: false,
        colSpan: 6,
      };
    }

    // Para semestre 2: mostrar III BIM, IV BIM y II SEM
    if (selectedBimestre === "s2") {
      return {
        b1: false,
        b2: false,
        s1: false,
        b3: true,
        b4: true,
        s2: true,
        final: false,
        colSpan: 6,
      };
    }

    // Para nota final: mostrar I SEM, II SEM y NOTA FINAL
    if (selectedBimestre === "final") {
      return {
        b1: false,
        b2: false,
        s1: true,
        b3: false,
        b4: false,
        s2: true,
        final: true,
        colSpan: 6,
      };
    }

    // Por defecto, mostrar semestre 1
    return {
      b1: true,
      b2: true,
      s1: true,
      b3: false,
      b4: false,
      s2: false,
      final: false,
      colSpan: 6,
    };
  };

  const cargarReporte = async () => {
    if (!selectedGrado || !selectedSeccion) {
      setMensaje("Debe seleccionar grado y sección");
      return;
    }

    setLoading(true);
    setMensaje("");

    try {
      const params = {
        id_grado: selectedGrado,
        id_seccion: selectedSeccion,
      };

      // Agregar filtro de género si no es "todos"
      if (selectedGenero !== "todos") {
        params.genero = selectedGenero;
      }

      const res = await api.get("/api/reportes/consolidado", {
        params,
        headers: {Authorization: `Bearer ${token}`},
      });

      setReporteData(res.data);

      // Actualizar el profesor con el que viene del reporte
      if (res.data.profesor) {
        setProfesor(res.data.profesor);
      } else {
        setProfesor(null);
      }

      if (res.data.estudiantes.length === 0) {
        setMensaje("No hay estudiantes registrados en este grado/sección");
      }
    } catch (error) {
      console.error("Error al cargar reporte:", error);
      const errorMsg =
        error.response?.data?.error ||
        error.message ||
        "Error al cargar el reporte";
      setMensaje(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeClass = (cual) => {
    if (cual === "AA") return "bg-green-600 text-white";
    if (cual === "AS") return "bg-blue-600 text-white";
    if (cual === "AF") return "bg-yellow-600 text-white";
    if (cual === "AI") return "bg-red-600 text-white";
    return "bg-gray-500 text-white";
  };

  const calcularNotaFinal = (semestre1, semestre2) => {
    // Si alguno de los semestres no tiene calificación, retornar vacío
    if (
      !semestre1 ||
      !semestre2 ||
      semestre1.cuant === 0 ||
      semestre2.cuant === 0
    ) {
      return {cual: "-", cuant: 0};
    }

    // Calcular promedio cuantitativo
    const cuant = Math.round((semestre1.cuant + semestre2.cuant) / 2);

    // Calcular cualitativo basado en el promedio
    let cual = "AI";
    if (cuant >= 90) cual = "AA";
    else if (cuant >= 75) cual = "AS";
    else if (cuant >= 60) cual = "AF";

    return {cual, cuant};
  };

  const convertirACualitativa = (nota) => {
    if (nota >= 90) return "AA";
    if (nota >= 76) return "AS";
    if (nota >= 60) return "AF";
    if (nota >= 40) return "AI";
    return "AI";
  };

  const imprimirReporte = () => {
    window.print();
  };

  const mostrarVistaPreviaEstudiante = (estudiante) => {
    setEstudiantePreview(estudiante);
    setMostrarVistaPrevia(true);
  };

  const cerrarVistaPrevia = () => {
    setMostrarVistaPrevia(false);
    setEstudiantePreview(null);
  };

  const generarCertificadoPDF = (estudiante) => {
    if (!reporteData || !estudiante) {
      alert("No hay datos para generar el certificado");
      return;
    }

    // Crear documento PDF en formato papel sellado vertical (21.6cm x 33cm)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: [21.6, 33],
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 2;
    let currentY = 2;

    // ENCABEZADO
    // Logo de la escuela en la esquina superior derecha (si existe)
    if (escuela?.logo) {
      try {
        const logoUrl = `http://localhost:4000${escuela.logo}`;
        const logoSize = 2.5; // Reducido para que no sobrepase la línea verde
        const logoX = pageWidth - margin - logoSize;
        const logoY = currentY - 0.3; // Subir un poco más
        doc.addImage(logoUrl, "PNG", logoX, logoY, logoSize, logoSize);
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }

    // Nombre de la escuela
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(
      escuela?.nombre || "CENTRO EDUCATIVO",
      pageWidth / 2,
      currentY + 0.5,
      {
        align: "center",
      }
    );

    currentY += 1.2;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CERTIFICADO DE CALIFICACIONES", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 0.5;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Año Académico: ${new Date().getFullYear()}`,
      pageWidth / 2,
      currentY,
      {
        align: "center",
      }
    );

    // Línea decorativa
    currentY += 0.5;
    doc.setDrawColor(34, 197, 94); // verde
    doc.setLineWidth(0.05);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // DATOS DEL ESTUDIANTE
    currentY += 1;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL ESTUDIANTE", margin, currentY);

    currentY += 0.6;
    doc.setFont("helvetica", "normal");
    const nombreEstudiante =
      estudiante.nombre_completo || estudiante.nombre || "Sin nombre";
    doc.text(`Nombre: ${nombreEstudiante}`, margin, currentY);

    currentY += 0.5;
    const gradoNombre =
      grados.find((g) => g.id_grado === parseInt(selectedGrado))?.nombre || "";
    const seccionNombre =
      secciones.find((s) => s.id_seccion === parseInt(selectedSeccion))
        ?.nombre || "";
    doc.text(
      `Grado: ${gradoNombre}     Sección: ${seccionNombre}`,
      margin,
      currentY
    );

    currentY += 0.5;
    doc.text(
      `Código MINED: ${
        estudiante.codigo_mined || estudiante.codigo_estudiante || "N/A"
      }`,
      margin,
      currentY
    );

    // TABLA DE CALIFICACIONES
    currentY += 1;
    doc.setFont("helvetica", "bold");
    doc.text("CALIFICACIONES FINALES", margin, currentY);

    currentY += 0.3;

    // Preparar datos de la tabla - usar promedio de 4 bimestres (nota final)
    const tablaMaterias = [];
    reporteData.materias.forEach((materia) => {
      const calMateria = estudiante.calificaciones[materia.id_materia];
      if (calMateria) {
        // Calcular nota final como promedio de los 4 bimestres
        const b1 = calMateria.bimestre_1?.cuant || 0;
        const b2 = calMateria.bimestre_2?.cuant || 0;
        const b3 = calMateria.bimestre_3?.cuant || 0;
        const b4 = calMateria.bimestre_4?.cuant || 0;

        const notaFinalCuant = (b1 + b2 + b3 + b4) / 4;
        const notaFinalCual = convertirACualitativa(notaFinalCuant);

        tablaMaterias.push([
          materia.nombre,
          notaFinalCuant.toFixed(1),
          notaFinalCual,
        ]);
      }
    });

    // Calcular promedio general
    let sumaNotas = 0;
    let contadorMaterias = 0;
    reporteData.materias.forEach((materia) => {
      const calMateria = estudiante.calificaciones[materia.id_materia];
      if (calMateria) {
        const notasMateria = [
          calMateria.bimestre_1?.cuant || 0,
          calMateria.bimestre_2?.cuant || 0,
          calMateria.bimestre_3?.cuant || 0,
          calMateria.bimestre_4?.cuant || 0,
        ];
        const tieneNotas = notasMateria.some((n) => n > 0);
        if (tieneNotas) {
          const notaFinalMateria = notasMateria.reduce((a, b) => a + b, 0) / 4;
          sumaNotas += notaFinalMateria;
          contadorMaterias++;
        }
      }
    });
    const promedioGeneral =
      contadorMaterias > 0 ? sumaNotas / contadorMaterias : 0;
    const promedioGenCual = convertirACualitativa(promedioGeneral);

    autoTable(doc, {
      startY: currentY,
      head: [["MATERIA", "NOTA (0-100)", "CUALITATIVA"]],
      body: tablaMaterias,
      foot: [["PROMEDIO GENERAL", promedioGeneral.toFixed(1), promedioGenCual]],
      theme: "grid",
      headStyles: {
        fillColor: [34, 197, 94],
        textColor: 255,
        fontSize: 10,
        fontStyle: "bold",
        halign: "center",
      },
      footStyles: {
        fillColor: [251, 191, 36],
        textColor: 0,
        fontSize: 10,
        fontStyle: "bold",
        halign: "center",
      },
      bodyStyles: {
        fontSize: 9,
        halign: "center",
      },
      columnStyles: {
        0: {halign: "left", cellWidth: 10},
        1: {halign: "center", cellWidth: 3.5},
        2: {halign: "center", cellWidth: 4},
      },
      margin: {left: margin, right: margin},
    });

    // LEYENDA
    const finalY = doc.lastAutoTable.finalY + 1;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("ESCALA DE CALIFICACIONES:", margin, finalY);

    doc.setFont("helvetica", "normal");
    const leyendaY = finalY + 0.4;
    doc.text("AA (90-100): Aprendizaje Avanzado", margin, leyendaY);
    doc.text("AS (76-89): Aprendizaje Satisfactorio", margin, leyendaY + 0.4);
    doc.text("AF (60-75): Aprendizaje Fundamental", margin, leyendaY + 0.8);
    doc.text("AI (40-59): Aprendizaje Inicial", margin, leyendaY + 1.2);

    // FIRMAS
    const firmasY = pageHeight - 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Firma Director
    const directorX = margin + 2;
    doc.line(directorX, firmasY, directorX + 5, firmasY);
    doc.text("Director(a)", directorX + 2.5, firmasY + 0.5, {align: "center"});
    doc.text(escuela?.nombre || "", directorX + 2.5, firmasY + 0.9, {
      align: "center",
    });

    // Firma Secretaria
    const secretariaX = pageWidth - margin - 7;
    doc.line(secretariaX, firmasY, secretariaX + 5, firmasY);
    doc.text("Secretaria(o)", secretariaX + 2.5, firmasY + 0.5, {
      align: "center",
    });
    doc.text(escuela?.nombre || "", secretariaX + 2.5, firmasY + 0.9, {
      align: "center",
    });

    // Fecha de emisión
    doc.setFontSize(8);
    doc.text(
      `Fecha de emisión: ${new Date().toLocaleDateString("es-NI")}`,
      pageWidth / 2,
      pageHeight - 2,
      {align: "center"}
    );

    // Guardar PDF - usar la variable nombreEstudiante ya declarada arriba
    const fileName = `Certificado_${nombreEstudiante.replace(
      /\s+/g,
      "_"
    )}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  const exportarPDF = () => {
    if (!reporteData || !reporteData.estudiantes.length) {
      alert("No hay datos para exportar");
      return;
    }

    // Crear documento PDF en formato Legal Horizontal (14 x 8.5 pulgadas)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "legal", // 14 x 8.5 pulgadas
    });

    const columnas = getColumnasVisibles();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Construir periodos visibles para el título
    const periodosVisibles = [];
    if (columnas.b1) periodosVisibles.push("IB");
    if (columnas.b2) periodosVisibles.push("IIB");
    if (columnas.s1) periodosVisibles.push("IS");
    if (columnas.b3) periodosVisibles.push("IIIB");
    if (columnas.b4) periodosVisibles.push("IVB");
    if (columnas.s2) periodosVisibles.push("IIS");

    const tituloCompleto =
      periodosVisibles.length > 0
        ? `REGISTRO DE CALIFICACIONES DEL ${periodosVisibles.join(", ")}, 2025`
        : "REGISTRO DE CALIFICACIONES, 2025";

    // Header - Logo y nombre de escuela
    let currentY = 0.5;

    // Agregar logo si existe
    if (escuela?.logo) {
      try {
        const logoUrl = `http://localhost:4000${escuela.logo}`;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logoUrl;
        // Agregar logo en esquina superior derecha
        doc.addImage(img, "PNG", pageWidth - 1.2, 0.3, 0.8, 0.8);
      } catch (error) {
        console.log("No se pudo cargar el logo", error);
      }
    }

    // Título centrado
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(escuela?.nombre || "Escuela", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 0.3;
    doc.setFontSize(12);
    doc.text(tituloCompleto, pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 0.25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `Año Académico: ${new Date().getFullYear()}`,
      pageWidth / 2,
      currentY,
      {
        align: "center",
      }
    );

    currentY += 0.3;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Grado: `, 0.5, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(gradoNombre, 1.0, currentY);

    doc.setFont("helvetica", "bold");
    doc.text(`Sección: `, 2.5, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(seccionNombre, 3.2, currentY);

    if (profesor) {
      doc.setFont("helvetica", "bold");
      doc.text(`Docente: `, 5.0, currentY);
      doc.setFont("helvetica", "normal");
      doc.text(`${profesor.nombre} ${profesor.apellido}`, 6.0, currentY);
    }

    currentY += 0.4;

    // Construir periodos visibles
    const periodos = [];
    if (columnas.b1) periodos.push({key: "b1", label: "I BIM", color: null});
    if (columnas.b2) periodos.push({key: "b2", label: "II BIM", color: null});
    if (columnas.s1)
      periodos.push({key: "s1", label: "I SEM", color: [219, 234, 254]});
    if (columnas.b3) periodos.push({key: "b3", label: "III BIM", color: null});
    if (columnas.b4) periodos.push({key: "b4", label: "IV BIM", color: null});
    if (columnas.s2)
      periodos.push({key: "s2", label: "II SEM", color: [243, 232, 255]});
    if (columnas.final)
      periodos.push({
        key: "final",
        label: "NOTA FINAL",
        color: [254, 249, 195],
      });

    // Construir estructura de headers con 3 filas
    const headerRow1 = [];
    const headerRow2 = [];
    const headerRow3 = [];

    // Columnas fijas (N°, Nombre, Código) - rowSpan 3
    headerRow1.push(
      {content: "N°", rowSpan: 3, styles: {halign: "center", valign: "middle"}},
      {
        content: "NOMBRES Y APELLIDOS",
        rowSpan: 3,
        styles: {halign: "center", valign: "middle"},
      },
      {
        content: "CÓDIGO",
        rowSpan: 3,
        styles: {halign: "center", valign: "middle"},
      }
    );

    // Fila 1: Nombres de materias con colSpan según periodos
    reporteData.materias.forEach((materia) => {
      headerRow1.push({
        content: materia.nombre.toUpperCase(),
        colSpan: columnas.colSpan,
        styles: {halign: "center", valign: "middle"},
      });
    });

    // Promedio con colSpan 2 y rowSpan 2 - Solo en Nota Final
    if (selectedBimestre === "final") {
      headerRow1.push({
        content: "PROMEDIO GENERAL",
        colSpan: 2,
        rowSpan: 2,
        styles: {halign: "center", valign: "middle", fillColor: [234, 179, 8]},
      });
    }

    // Fila 2: Periodos (I BIM, II BIM, etc.) con colSpan 2 cada uno
    reporteData.materias.forEach((materia) => {
      periodos.forEach((periodo) => {
        const fillColor = periodo.color || [22, 163, 74]; // Verde por defecto
        const textColor = periodo.color ? [0, 0, 0] : [255, 255, 255]; // Negro para semestres, blanco para bimestres
        headerRow2.push({
          content: periodo.label,
          colSpan: 2,
          styles: {
            halign: "center",
            valign: "middle",
            fillColor: fillColor,
            textColor: textColor,
          },
        });
      });
    });

    // Fila 3: CUAL y CUANT para cada periodo
    reporteData.materias.forEach((materia) => {
      periodos.forEach((periodo) => {
        const fillColor = periodo.color || [34, 197, 94]; // Verde más claro
        const textColor = periodo.color ? [0, 0, 0] : [255, 255, 255]; // Negro para semestres, blanco para bimestres
        headerRow3.push(
          {
            content: "CUAL",
            styles: {
              halign: "center",
              valign: "middle",
              fillColor: fillColor,
              textColor: textColor,
            },
          },
          {
            content: "CUANT",
            styles: {
              halign: "center",
              valign: "middle",
              fillColor: fillColor,
              textColor: textColor,
            },
          }
        );
      });
    });

    // CUAL y CUANT para Promedio
    headerRow3.push(
      {
        content: "CUAL",
        styles: {
          halign: "center",
          valign: "middle",
          fillColor: [250, 204, 21],
          textColor: [0, 0, 0],
        },
      },
      {
        content: "CUANT",
        styles: {
          halign: "center",
          valign: "middle",
          fillColor: [250, 204, 21],
          textColor: [0, 0, 0],
        },
      }
    );

    // Preparar columnas para body
    const bodyColumns = [];

    // Columnas fijas
    bodyColumns.push("numero", "nombre", "codigo");

    // Columnas de materias y periodos
    reporteData.materias.forEach((materia, idx) => {
      periodos.forEach((periodo) => {
        bodyColumns.push(`m${idx}_${periodo.key}_cual`);
        bodyColumns.push(`m${idx}_${periodo.key}_cuant`);
      });
    });

    // Columnas de promedio
    bodyColumns.push("prom_cual", "prom_cuant");

    // Preparar datos de las filas
    const tableData = reporteData.estudiantes.map((estudiante) => {
      const row = {
        numero: estudiante.numero,
        nombre: estudiante.nombre_completo,
        codigo: estudiante.codigo_mined,
      };

      reporteData.materias.forEach((materia, idx) => {
        const cal = estudiante.calificaciones[materia.id_materia];

        periodos.forEach((periodo) => {
          const baseKey = `m${idx}_${periodo.key}`;
          let cual = "-";
          let cuant = "-";

          if (periodo.key === "b1" && cal.bimestre_1) {
            cual = cal.bimestre_1.cual || "-";
            cuant = cal.bimestre_1.cuant > 0 ? cal.bimestre_1.cuant : "-";
          } else if (periodo.key === "b2" && cal.bimestre_2) {
            cual = cal.bimestre_2.cual || "-";
            cuant = cal.bimestre_2.cuant > 0 ? cal.bimestre_2.cuant : "-";
          } else if (periodo.key === "s1" && cal.semestre_1) {
            cual = cal.semestre_1.cual || "-";
            cuant = cal.semestre_1.cuant > 0 ? cal.semestre_1.cuant : "-";
          } else if (periodo.key === "b3" && cal.bimestre_3) {
            cual = cal.bimestre_3.cual || "-";
            cuant = cal.bimestre_3.cuant > 0 ? cal.bimestre_3.cuant : "-";
          } else if (periodo.key === "b4" && cal.bimestre_4) {
            cual = cal.bimestre_4.cual || "-";
            cuant = cal.bimestre_4.cuant > 0 ? cal.bimestre_4.cuant : "-";
          } else if (periodo.key === "s2" && cal.semestre_2) {
            cual = cal.semestre_2.cual || "-";
            cuant = cal.semestre_2.cuant > 0 ? cal.semestre_2.cuant : "-";
          } else if (periodo.key === "final") {
            // Calcular nota final
            const notaFinal = calcularNotaFinal(cal.semestre_1, cal.semestre_2);
            cual = notaFinal.cual;
            cuant = notaFinal.cuant > 0 ? notaFinal.cuant : "-";
          }

          row[`${baseKey}_cual`] = cual;
          row[`${baseKey}_cuant`] = cuant;
        });
      });

      row.prom_cual = estudiante.promedio?.cual || "-";
      row.prom_cuant =
        estudiante.promedio?.cuant > 0 ? estudiante.promedio.cuant : "-";

      return bodyColumns.map((col) => row[col]);
    });

    // Calcular anchos de columnas dinámicamente según cantidad de materias
    const margin = 0.6; // Margen total (left + right)
    const availableWidth = pageWidth - margin;

    // Anchos fijos para columnas base
    const colN = 0.3; // N°
    const colNombre = 1.5; // Nombre
    const colCodigo = 0.6; // Código
    const colPromedioCual = 0.3; // Promedio CUAL
    const colPromedioCuant = 0.35; // Promedio CUANT

    const fixedWidth =
      colN +
      colNombre +
      colCodigo +
      (selectedBimestre === "final" ? colPromedioCual + colPromedioCuant : 0);
    const remainingWidth = availableWidth - fixedWidth;

    // Calcular ancho por materia (cada materia tiene colSpan columnas)
    const totalColumnasMaterias =
      reporteData.materias.length * columnas.colSpan;
    const anchoColumnaMateria = remainingWidth / totalColumnasMaterias;

    // Construir columnStyles dinámicamente
    const columnStyles = {
      0: {cellWidth: colN, halign: "center"},
      1: {cellWidth: colNombre, halign: "left", fontSize: 6.5},
      2: {cellWidth: colCodigo, halign: "center"},
    };

    // Agregar anchos para todas las columnas de materias
    let colIndex = 3;
    reporteData.materias.forEach(() => {
      for (let i = 0; i < columnas.colSpan; i++) {
        columnStyles[colIndex] = {
          cellWidth: anchoColumnaMateria,
          halign: "center",
        };
        colIndex++;
      }
    });

    // Agregar anchos para promedio si es nota final
    if (selectedBimestre === "final") {
      columnStyles[colIndex] = {cellWidth: colPromedioCual, halign: "center"};
      columnStyles[colIndex + 1] = {
        cellWidth: colPromedioCuant,
        halign: "center",
      };
    }

    // Generar tabla con autoTable usando estructura de 3 filas
    autoTable(doc, {
      startY: currentY,
      head: [headerRow1, headerRow2, headerRow3],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: 0.05,
        lineColor: [156, 163, 175],
        lineWidth: 0.01,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [21, 128, 61], // Verde MINED
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
        valign: "middle",
        cellPadding: 0.06,
      },
      columnStyles: columnStyles,
      margin: {left: 0.3, right: 0.3, top: 0.3, bottom: 0.5},
      tableWidth: "auto",
      pageBreak: "auto",
      rowPageBreak: "avoid",
      didParseCell: function (data) {
        // Aplicar colores a celdas de semestres, promedio y notas menores a 60 en el body
        if (data.section === "body") {
          let colIdx = 3; // Empezar después de las 3 columnas fijas

          reporteData.materias.forEach((materia, mIdx) => {
            periodos.forEach((periodo) => {
              // CUAL
              if (data.column.index === colIdx) {
                if (periodo.key === "s1") {
                  data.cell.styles.fillColor = [219, 234, 254]; // Azul claro
                } else if (periodo.key === "s2") {
                  data.cell.styles.fillColor = [243, 232, 255]; // Púrpura claro
                }
              }
              colIdx++;

              // CUANT - Aplicar colores de fondo y color rojo si es menor a 60
              if (data.column.index === colIdx) {
                const valor = parseFloat(data.cell.raw);

                if (periodo.key === "s1") {
                  data.cell.styles.fillColor = [219, 234, 254];
                  data.cell.styles.fontStyle = "bold";
                } else if (periodo.key === "s2") {
                  data.cell.styles.fillColor = [243, 232, 255];
                  data.cell.styles.fontStyle = "bold";
                }

                // Color rojo para notas menores a 60
                if (!isNaN(valor) && valor > 0 && valor < 60) {
                  data.cell.styles.textColor = [220, 38, 38]; // Rojo
                  data.cell.styles.fontStyle = "bold";
                }
              }
              colIdx++;
            });
          });

          // Promedio CUAL
          if (data.column.index === colIdx) {
            data.cell.styles.fillColor = [254, 249, 195]; // Amarillo claro
          }
          colIdx++;

          // Promedio CUANT
          if (data.column.index === colIdx) {
            const valor = parseFloat(data.cell.raw);
            data.cell.styles.fillColor = [254, 249, 195];
            data.cell.styles.fontStyle = "bold";

            // Color rojo para promedio menor a 60
            if (!isNaN(valor) && valor > 0 && valor < 60) {
              data.cell.styles.textColor = [220, 38, 38]; // Rojo
              data.cell.styles.fontStyle = "bold";
            }
          }
        }
      },
      didDrawPage: function (data) {
        // Agregar número de página y datos de escuela
        const pageCount = doc.internal.pages.length - 1;
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height
          ? pageSize.height
          : pageSize.getHeight();

        // Datos de la escuela en el pie de página izquierdo
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        if (escuela?.direccion) {
          doc.text(escuela.direccion, 0.3, pageHeight - 0.3);
        }
        if (escuela?.telefono) {
          doc.text(`Tel: ${escuela.telefono}`, 0.3, pageHeight - 0.2);
        }

        // Número de página centrado
        doc.setFontSize(8);
        doc.text(
          `Página ${
            doc.internal.getCurrentPageInfo().pageNumber
          } de ${pageCount}`,
          pageSize.width / 2,
          pageHeight - 0.3,
          {align: "center"}
        );
      },
    });

    // Pie de página con leyenda en la última página
    const finalY = doc.lastAutoTable.finalY + 0.35;
    if (finalY < pageHeight - 0.8) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Leyenda:", 0.5, finalY);
      doc.setFont("helvetica", "normal");
      doc.text(
        "AA: 90-100 Avanzado  |  AS: 76-89 Satisfactorio  |  AF: 60-75 Fundamental  |  AI: 40-59 Inicial",
        1.2,
        finalY
      );
    }

    // Guardar PDF
    const fileName = `Reporte_${gradoNombre}_${seccionNombre}_${new Date().getTime()}.pdf`;
    doc.save(fileName);
  };

  const gradoNombre =
    grados.find((g) => g.id_grado === parseInt(selectedGrado))?.nombre || "";
  const seccionNombre =
    secciones.find((s) => s.id_seccion === parseInt(selectedSeccion))?.nombre ||
    "";

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Reportes de Calificaciones"
          subtitle="Sistema MINED - Registro de Calificaciones por Grado y Sección"
          icon={DocumentChartBarIcon}
          gradientFrom="green-600"
          gradientTo="emerald-600"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
        />

        {/* Botón volver si no está en el menú */}
        {vistaActual !== "menu" && (
          <button
            onClick={() => {
              setVistaActual("menu");
              setReporteData(null);
            }}
            className="mt-4 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Volver al Menú
          </button>
        )}
      </div>

      {/* MENÚ PRINCIPAL CON CARDS */}
      {vistaActual === "menu" && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Reporte Sábana */}
            <div
              onClick={() => setVistaActual("sabana")}
              className="group cursor-pointer bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 border border-purple-400/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <TableCellsIcon className="w-12 h-12 text-white" />
                </div>
                <svg
                  className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">
                Generar Reporte Sábana
              </h3>
              <p className="text-blue-100 text-lg leading-relaxed">
                Tabla completa de calificaciones por bimestre, semestre o nota
                final en formato horizontal (Legal)
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-blue-100">
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  Formato: Legal Horizontal
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  14" x 8.5"
                </span>
              </div>
            </div>

            {/* Card: Certificado de Notas */}
            <div
              onClick={() => setVistaActual("certificado")}
              className="group cursor-pointer bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 border border-emerald-400/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <DocumentTextIcon className="w-12 h-12 text-white" />
                </div>
                <svg
                  className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">
                Certificado de Notas
              </h3>
              <p className="text-emerald-100 text-lg leading-relaxed">
                Documento oficial con notas finales, firmas de autoridades y
                formato de papel sellado vertical
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-emerald-100">
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  Formato: Papel Sellado
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full">
                  21.6cm x 33cm
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA: REPORTE SÁBANA */}
      {vistaActual === "sabana" && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          {/* Filtros */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700 print:hidden">
            <div className="flex items-center gap-3 mb-4">
              <FunnelIcon className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">
                Filtros de Búsqueda
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grado
                </label>
                <select
                  value={selectedGrado}
                  onChange={(e) => {
                    setSelectedGrado(e.target.value);
                    setSelectedSeccion(""); // Limpiar sección al cambiar grado
                    setReporteData(null); // Limpiar datos del reporte
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
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
                  Sección
                </label>
                <select
                  value={selectedSeccion}
                  onChange={(e) => setSelectedSeccion(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Seleccionar sección</option>
                  {secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Género
                </label>
                <select
                  value={selectedGenero}
                  onChange={(e) => setSelectedGenero(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="todos">Todos</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Periodo
                </label>
                <select
                  value={selectedBimestre}
                  onChange={(e) => setSelectedBimestre(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="s1">
                    I Semestre (I BIM + II BIM + I SEM)
                  </option>
                  <option value="s2">
                    II Semestre (III BIM + IV BIM + II SEM)
                  </option>
                  <option value="final">
                    Nota Final (I SEM + II SEM + FINAL)
                  </option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={cargarReporte}
                  disabled={loading || !selectedGrado || !selectedSeccion}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <DocumentChartBarIcon className="w-5 h-5" />
                  {loading ? "Cargando..." : "Generar Reporte"}
                </button>
              </div>
            </div>
          </div>

          {mensaje && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 px-4 py-3 rounded-xl mb-6 text-center">
              {mensaje}
            </div>
          )}

          {/* Botones de acción */}
          {reporteData && reporteData.estudiantes.length > 0 && (
            <div className="flex gap-4 mb-6 print:hidden">
              <button
                onClick={imprimirReporte}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <PrinterIcon className="w-5 h-5" />
                Imprimir
              </button>
              <button
                onClick={exportarPDF}
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Exportar PDF
              </button>
            </div>
          )}

          {/* Tabla de Reporte Estilo MINED */}
          {reporteData && reporteData.estudiantes.length > 0 && (
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              {/* Header del reporte */}
              <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 text-white print:p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Espacio izquierdo vacío para balance */}
                  <div className="w-20"></div>

                  {/* Información central */}
                  <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold mb-2">
                      {escuela?.nombre || "Escuela"}
                    </h2>
                    <h3 className="text-lg font-bold mb-1">
                      REPORTE DE CALIFICACIONES
                    </h3>
                    <p className="text-green-100 text-xs">Año Académico 2025</p>
                  </div>

                  {/* Logo a la derecha */}
                  <div className="w-20 flex justify-end">
                    {escuela?.logo && (
                      <img
                        src={`http://localhost:4000${escuela.logo}`}
                        alt="Logo"
                        className="w-20 h-20 object-contain bg-white rounded-lg p-1"
                        onError={(e) => {
                          console.error(
                            "Error al cargar logo en reporte:",
                            escuela.logo
                          );
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                  </div>
                </div>

                <div className="text-xs bg-green-800/30 p-3 rounded mt-4">
                  <div className="flex gap-6 mb-2">
                    <div>
                      <span className="font-semibold">Grado:</span>{" "}
                      {gradoNombre}
                    </div>
                    <div>
                      <span className="font-semibold">Sección:</span>{" "}
                      {seccionNombre}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Docente:</span>{" "}
                    {profesor
                      ? `${profesor.nombre} ${profesor.apellido}`
                      : "No asignado"}
                  </div>
                </div>
              </div>

              {/* Leyenda */}
              <div className="bg-gray-50 p-4 border-b-2 border-gray-300 print:p-2">
                <div className="flex items-center justify-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-600 text-white rounded font-bold">
                      AA
                    </span>
                    <span className="text-gray-700">90-100: Avanzado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-600 text-white rounded font-bold">
                      AS
                    </span>
                    <span className="text-gray-700">76-89: Satisfactorio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-yellow-600 text-white rounded font-bold">
                      AF
                    </span>
                    <span className="text-gray-700">60-75: Fundamental</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-red-600 text-white rounded font-bold">
                      AI
                    </span>
                    <span className="text-gray-700">40-59: Inicial</span>
                  </div>
                </div>
              </div>

              {/* Tabla con scroll horizontal */}
              <div className="overflow-x-auto overflow-y-visible max-w-full">
                <table
                  className="w-full border-collapse text-xs"
                  style={{minWidth: "100%"}}
                >
                  <thead>
                    {/* Fila 1: Columnas fijas + Materias */}
                    <tr className="bg-green-700">
                      <th
                        rowSpan="3"
                        className="border border-gray-400 px-1 py-1 text-white font-bold sticky left-0 bg-green-700 z-20 text-[9px]"
                        style={{
                          width: "25px",
                          minWidth: "25px",
                          maxWidth: "25px",
                        }}
                      >
                        N°
                      </th>
                      <th
                        rowSpan="3"
                        className="border border-gray-400 px-1 py-1 text-white font-bold sticky left-[25px] bg-green-700 z-20 text-[9px]"
                        style={{
                          width: "120px",
                          minWidth: "120px",
                          maxWidth: "120px",
                        }}
                      >
                        NOMBRES Y APELLIDOS
                      </th>
                      <th
                        rowSpan="3"
                        className="border border-gray-400 px-1 py-1 text-white font-bold sticky left-[145px] bg-green-700 z-20 text-[9px]"
                        style={{
                          width: "60px",
                          minWidth: "60px",
                          maxWidth: "60px",
                        }}
                      >
                        CÓDIGO
                      </th>
                      {reporteData.materias.map((materia) => (
                        <th
                          key={materia.id_materia}
                          colSpan={getColumnasVisibles().colSpan}
                          className="border border-gray-400 px-1 py-1 text-white font-bold text-center uppercase text-[10px]"
                        >
                          {materia.nombre}
                        </th>
                      ))}
                      {/* Promedio General - Solo en Nota Final */}
                      {selectedBimestre === "final" && (
                        <th
                          colSpan="2"
                          rowSpan="2"
                          className="border border-gray-400 px-2 py-1 text-white font-bold text-center uppercase text-[10px] bg-yellow-600"
                        >
                          PROMEDIO GENERAL
                        </th>
                      )}
                    </tr>

                    {/* Fila 2: Bimestres y Semestres */}
                    <tr className="bg-green-600">
                      {reporteData.materias.map((materia) => {
                        const columnas = getColumnasVisibles();
                        return (
                          <React.Fragment
                            key={`periodos-${materia.id_materia}`}
                          >
                            {columnas.b1 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                I BIM
                              </th>
                            )}
                            {columnas.b2 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                II BIM
                              </th>
                            )}
                            {columnas.s1 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                I SEM
                              </th>
                            )}
                            {columnas.b3 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                III BIM
                              </th>
                            )}
                            {columnas.b4 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                IV BIM
                              </th>
                            )}
                            {columnas.s2 && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px]"
                              >
                                II SEM
                              </th>
                            )}
                            {columnas.final && (
                              <th
                                colSpan="2"
                                className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[10px] bg-yellow-500"
                              >
                                NOTA FINAL
                              </th>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tr>

                    {/* Fila 3: CUAL y CUANT */}
                    <tr className="bg-green-500">
                      {reporteData.materias.map((materia) => {
                        const columnas = getColumnasVisibles();
                        return (
                          <React.Fragment key={`notas-${materia.id_materia}`}>
                            {columnas.b1 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.b2 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.s1 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.b3 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.b4 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.s2 && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10">
                                  CUANT
                                </th>
                              </>
                            )}
                            {columnas.final && (
                              <>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8 bg-yellow-500">
                                  CUAL
                                </th>
                                <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10 bg-yellow-500">
                                  CUANT
                                </th>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {/* CUAL y CUANT para Promedio - Solo en Nota Final */}
                      {selectedBimestre === "final" && (
                        <>
                          <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-8 bg-yellow-500">
                            CUAL
                          </th>
                          <th className="border border-gray-400 px-1 py-1 text-white font-bold text-center text-[9px] w-10 bg-yellow-500">
                            CUANT
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {reporteData.estudiantes.map((estudiante) => (
                      <tr
                        key={estudiante.id_estudiante}
                        className="hover:bg-gray-50"
                      >
                        <td
                          className="border border-gray-300 px-1 py-1 text-center font-semibold sticky left-0 bg-white z-10 text-[9px]"
                          style={{
                            width: "25px",
                            minWidth: "25px",
                            maxWidth: "25px",
                          }}
                        >
                          {estudiante.numero}
                        </td>
                        <td
                          className="border border-gray-300 px-1 py-1 font-medium sticky left-[25px] bg-white z-10 text-[9px]"
                          style={{
                            width: "120px",
                            minWidth: "120px",
                            maxWidth: "120px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {estudiante.nombre_completo}
                        </td>
                        <td
                          className="border border-gray-300 px-1 py-1 text-center text-[9px] text-gray-600 sticky left-[145px] bg-white z-10"
                          style={{
                            width: "60px",
                            minWidth: "60px",
                            maxWidth: "60px",
                          }}
                        >
                          {estudiante.codigo_mined}
                        </td>

                        {reporteData.materias.map((materia) => {
                          const cal =
                            estudiante.calificaciones[materia.id_materia];
                          const columnas = getColumnasVisibles();
                          return (
                            <React.Fragment
                              key={`cal-${estudiante.id_estudiante}-${materia.id_materia}`}
                            >
                              {/* I BIM */}
                              {columnas.b1 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center">
                                    {cal.bimestre_1.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.bimestre_1.cual
                                        )}`}
                                      >
                                        {cal.bimestre_1.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-semibold text-xs">
                                    <span
                                      className={
                                        cal.bimestre_1.cuant > 0 &&
                                        cal.bimestre_1.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.bimestre_1.cuant > 0
                                        ? cal.bimestre_1.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* II BIM */}
                              {columnas.b2 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center">
                                    {cal.bimestre_2.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.bimestre_2.cual
                                        )}`}
                                      >
                                        {cal.bimestre_2.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-semibold text-xs">
                                    <span
                                      className={
                                        cal.bimestre_2.cuant > 0 &&
                                        cal.bimestre_2.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.bimestre_2.cuant > 0
                                        ? cal.bimestre_2.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* I SEM */}
                              {columnas.s1 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center bg-blue-50">
                                    {cal.semestre_1.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.semestre_1.cual
                                        )}`}
                                      >
                                        {cal.semestre_1.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-bold bg-blue-50 text-xs">
                                    <span
                                      className={
                                        cal.semestre_1.cuant > 0 &&
                                        cal.semestre_1.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.semestre_1.cuant > 0
                                        ? cal.semestre_1.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* III BIM */}
                              {columnas.b3 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center">
                                    {cal.bimestre_3?.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.bimestre_3.cual
                                        )}`}
                                      >
                                        {cal.bimestre_3.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-semibold text-xs">
                                    <span
                                      className={
                                        cal.bimestre_3?.cuant > 0 &&
                                        cal.bimestre_3.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.bimestre_3?.cuant > 0
                                        ? cal.bimestre_3.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* IV BIM */}
                              {columnas.b4 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center">
                                    {cal.bimestre_4?.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.bimestre_4.cual
                                        )}`}
                                      >
                                        {cal.bimestre_4.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-semibold text-xs">
                                    <span
                                      className={
                                        cal.bimestre_4?.cuant > 0 &&
                                        cal.bimestre_4.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.bimestre_4?.cuant > 0
                                        ? cal.bimestre_4.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* II SEM */}
                              {columnas.s2 && (
                                <>
                                  <td className="border border-gray-300 px-1 py-1 text-center bg-purple-50">
                                    {cal.semestre_2?.cual !== "-" ? (
                                      <span
                                        className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                          cal.semestre_2.cual
                                        )}`}
                                      >
                                        {cal.semestre_2.cual}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">
                                        -
                                      </span>
                                    )}
                                  </td>
                                  <td className="border border-gray-300 px-1 py-1 text-center font-bold bg-purple-50 text-xs">
                                    <span
                                      className={
                                        cal.semestre_2?.cuant > 0 &&
                                        cal.semestre_2.cuant < 60
                                          ? "text-red-600 font-bold"
                                          : ""
                                      }
                                    >
                                      {cal.semestre_2?.cuant > 0
                                        ? cal.semestre_2.cuant
                                        : "-"}
                                    </span>
                                  </td>
                                </>
                              )}

                              {/* NOTA FINAL */}
                              {columnas.final &&
                                (() => {
                                  const notaFinal = calcularNotaFinal(
                                    cal.semestre_1,
                                    cal.semestre_2
                                  );
                                  return (
                                    <>
                                      <td className="border border-gray-300 px-1 py-1 text-center bg-yellow-50">
                                        {notaFinal.cual !== "-" ? (
                                          <span
                                            className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                              notaFinal.cual
                                            )}`}
                                          >
                                            {notaFinal.cual}
                                          </span>
                                        ) : (
                                          <span className="text-gray-400 text-xs">
                                            -
                                          </span>
                                        )}
                                      </td>
                                      <td className="border border-gray-300 px-1 py-1 text-center font-bold bg-yellow-50 text-xs">
                                        <span
                                          className={
                                            notaFinal.cuant > 0 &&
                                            notaFinal.cuant < 60
                                              ? "text-red-600 font-bold"
                                              : ""
                                          }
                                        >
                                          {notaFinal.cuant > 0
                                            ? notaFinal.cuant
                                            : "-"}
                                        </span>
                                      </td>
                                    </>
                                  );
                                })()}
                            </React.Fragment>
                          );
                        })}

                        {/* Columna de Promedio General - Solo en Nota Final */}
                        {selectedBimestre === "final" && (
                          <>
                            {/* CUAL */}
                            <td className="border border-gray-300 px-1 py-1 text-center bg-yellow-50">
                              {estudiante.promedio?.cual !== "-" ? (
                                <span
                                  className={`px-1 py-0.5 rounded text-[9px] font-bold ${getBadgeClass(
                                    estudiante.promedio.cual
                                  )}`}
                                >
                                  {estudiante.promedio.cual}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            {/* CUANT */}
                            <td className="border border-gray-300 px-1 py-1 text-center font-bold bg-yellow-50 text-xs">
                              <span
                                className={
                                  estudiante.promedio?.cuant > 0 &&
                                  estudiante.promedio.cuant < 60
                                    ? "text-red-600 font-bold"
                                    : ""
                                }
                              >
                                {estudiante.promedio?.cuant > 0
                                  ? estudiante.promedio.cuant
                                  : "-"}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <style jsx>{`
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              table {
                page-break-inside: auto;
              }
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              thead {
                display: table-header-group;
              }
            }
          `}</style>
        </div>
      )}

      {/* VISTA: CERTIFICADO DE NOTAS */}
      {vistaActual === "certificado" && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          {/* Filtros para certificado */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                Seleccionar Estudiante
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Grado
                </label>
                <select
                  value={selectedGrado}
                  onChange={(e) => {
                    setSelectedGrado(e.target.value);
                    setSelectedSeccion("");
                    setReporteData(null);
                  }}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
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
                  Sección
                </label>
                <select
                  value={selectedSeccion}
                  onChange={(e) => setSelectedSeccion(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Seleccionar sección</option>
                  {secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={cargarReporte}
                  disabled={!selectedGrado || !selectedSeccion || loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <DocumentTextIcon className="w-5 h-5" />
                      Cargar Estudiantes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mensaje */}
          {mensaje && (
            <div className="bg-blue-900/30 border border-blue-500 text-blue-200 px-4 py-3 rounded-xl mb-4">
              {mensaje}
            </div>
          )}

          {/* Lista de estudiantes para generar certificado */}
          {reporteData && reporteData.estudiantes && (
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                Seleccione un estudiante para generar su certificado
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {reporteData.estudiantes.map((estudiante) => (
                  <button
                    key={estudiante.id_estudiante}
                    onClick={() => mostrarVistaPreviaEstudiante(estudiante)}
                    className="text-left px-6 py-4 bg-gray-700 hover:bg-gradient-to-r hover:from-emerald-600 hover:to-teal-600 rounded-xl transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold text-lg">
                          {estudiante.nombre_completo ||
                            estudiante.nombre ||
                            "Sin nombre"}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Código:{" "}
                          {estudiante.codigo_mined ||
                            estudiante.codigo_estudiante ||
                            "N/A"}
                        </p>
                      </div>
                      <DocumentTextIcon className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: VISTA PREVIA CERTIFICADO */}
      {mostrarVistaPrevia && estudiantePreview && reporteData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-7 h-7 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    Vista Previa del Certificado
                  </h2>
                </div>
                <button
                  onClick={cerrarVistaPrevia}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
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

            {/* Contenido del certificado */}
            <div className="p-8 max-h-[70vh] overflow-y-auto bg-gray-50">
              {/* Encabezado del certificado */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-gray-800 mb-2">
                        {escuela?.nombre || "CENTRO EDUCATIVO"}
                      </h3>
                      <div className="w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 my-3"></div>
                      <h4 className="text-2xl font-semibold text-gray-700">
                        CERTIFICADO DE NOTAS
                      </h4>
                    </div>
                  </div>
                  {escuela?.logo && (
                    <div className="ml-4">
                      <img
                        src={`http://localhost:5000${escuela.logo}`}
                        alt="Logo"
                        className="w-24 h-24 object-contain"
                        onError={(e) => {
                          console.error("Error cargando logo:", escuela.logo);
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Información del estudiante */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Información del Estudiante
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Nombre Completo:
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {estudiantePreview.nombre_completo ||
                        estudiantePreview.nombre ||
                        "Sin nombre"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Código MINED:
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {estudiantePreview.codigo_mined ||
                        estudiantePreview.codigo_estudiante ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Grado:
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {grados.find(
                        (g) => g.id_grado.toString() === selectedGrado
                      )?.nombre ||
                        grados.find(
                          (g) => g.id_grado.toString() === selectedGrado
                        )?.nombre_grado ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      Sección:
                    </p>
                    <p className="text-base font-semibold text-gray-800">
                      {secciones.find(
                        (s) => s.id_seccion.toString() === selectedSeccion
                      )?.nombre || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabla de calificaciones */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Calificaciones Finales por Materia
                </h5>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">
                          Materia
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Nota Final
                        </th>
                        <th className="px-4 py-3 text-center font-semibold">
                          Cualitativa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {reporteData.materias &&
                      reporteData.materias.length > 0 ? (
                        reporteData.materias.map((materia, idx) => {
                          const calMateria =
                            estudiantePreview.calificaciones?.[
                              materia.id_materia
                            ];

                          // Si no hay calificaciones, mostrar con valores 0
                          const b1 = calMateria?.bimestre_1?.cuant || 0;
                          const b2 = calMateria?.bimestre_2?.cuant || 0;
                          const b3 = calMateria?.bimestre_3?.cuant || 0;
                          const b4 = calMateria?.bimestre_4?.cuant || 0;
                          const notaFinalCuant = Math.round(
                            (b1 + b2 + b3 + b4) / 4
                          );
                          const notaFinalCual =
                            convertirACualitativa(notaFinalCuant);

                          return (
                            <tr
                              key={materia.id_materia}
                              className={
                                idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                              }
                            >
                              <td className="px-4 py-3 text-gray-800 font-medium">
                                {materia.nombre_materia ||
                                  materia.nombre ||
                                  materia.materia ||
                                  `Materia ${materia.id_materia}`}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-4 py-2 rounded-lg font-bold text-lg ${
                                    notaFinalCuant >= 90
                                      ? "bg-green-100 text-green-700"
                                      : notaFinalCuant >= 76
                                      ? "bg-blue-100 text-blue-700"
                                      : notaFinalCuant >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {notaFinalCuant}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span
                                  className={`inline-block px-4 py-1 rounded-full font-semibold ${
                                    notaFinalCuant >= 90
                                      ? "bg-green-200 text-green-800"
                                      : notaFinalCuant >= 76
                                      ? "bg-blue-200 text-blue-800"
                                      : notaFinalCuant >= 60
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-red-200 text-red-800"
                                  }`}
                                >
                                  {notaFinalCual}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            No hay materias registradas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Promedio general */}
              {estudiantePreview.promedio && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                      <span className="text-xl font-bold">
                        Promedio General
                      </span>
                    </div>
                    <div className="flex items-center gap-6 bg-white/20 rounded-xl px-6 py-3">
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-1">Cuantitativa</p>
                        <span className="text-4xl font-black">
                          {estudiantePreview.promedio.cuant}
                        </span>
                      </div>
                      <div className="w-px h-12 bg-white/30"></div>
                      <div className="text-center">
                        <p className="text-sm opacity-90 mb-1">Cualitativa</p>
                        <span className="text-3xl font-black">
                          {estudiantePreview.promedio.cual}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Leyenda de escalas */}
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h6 className="font-bold text-gray-800 mb-3 text-sm uppercase">
                  Escala de Calificaciones MINED
                </h6>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-lg font-bold text-green-700">AA</p>
                    <p className="text-xs text-gray-600">Avanzado</p>
                    <p className="text-xs text-gray-500">90-100</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-lg font-bold text-blue-700">AS</p>
                    <p className="text-xs text-gray-600">Satisfactorio</p>
                    <p className="text-xs text-gray-500">76-89</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-lg font-bold text-yellow-700">AF</p>
                    <p className="text-xs text-gray-600">Fundamental</p>
                    <p className="text-xs text-gray-500">60-75</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-lg font-bold text-red-700">AI</p>
                    <p className="text-xs text-gray-600">Inicial</p>
                    <p className="text-xs text-gray-500">0-59</p>
                  </div>
                </div>
              </div>

              {/* Firmas */}
              <div className="bg-white rounded-xl shadow p-6">
                <div className="grid grid-cols-2 gap-8 mb-4">
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-3 mt-12">
                      <p className="font-bold text-gray-800">Director(a)</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Firma y Sello
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-t-2 border-gray-800 pt-3 mt-12">
                      <p className="font-bold text-gray-800">Secretaria(o)</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Firma y Sello
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Fecha de emisión:{" "}
                    {new Date().toLocaleDateString("es-NI", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="bg-gray-100 p-6 rounded-b-2xl flex items-center justify-end gap-4">
              <button
                onClick={cerrarVistaPrevia}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  generarCertificadoPDF(estudiantePreview);
                  cerrarVistaPrevia();
                }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportesPage;
