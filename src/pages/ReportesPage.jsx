import React, {useState, useEffect, useCallback} from "react";
import api from "../api/axiosConfig";
import PageHeader from "../components/PageHeader";
import {jsPDF} from "jspdf";
import autoTable from "jspdf-autotable";
import Toast from "../components/Toast";
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
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const token = localStorage.getItem("token");

  // --- 1. CARGA DE DATOS INICIALES ---
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get("/api/usuarios/perfil");
      setUser({
        rol: res.data.usuario?.rol || res.data.rol,
        id_usuario: res.data.usuario?.id_usuario || res.data.id_usuario,
        id_profesor: res.data.usuario?.id_profesor,
      });

      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`);
        setEscuela(escuelaRes.data);
      }

      if (res.data.usuario?.id_profesor) {
        const profesorRes = await api.get(
          `/api/profesores/${res.data.usuario.id_profesor}`
        );
        setProfesor(profesorRes.data);
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    }
  }, []);

  const fetchGrados = useCallback(async () => {
    if (!user) return;
    try {
      const esProfesor = user?.rol?.toLowerCase() === "profesor";
      let gradosUnicos = [];

      if (esProfesor && user?.id_profesor) {
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/carga`
        );
        const asignacionesData = asignacionesRes.data.data || [];
        const gradosIds = new Set();

        asignacionesData.forEach((asig) => {
          if (!gradosIds.has(asig.id_grado)) {
            gradosIds.add(asig.id_grado);
            gradosUnicos.push({
              id_grado: asig.id_grado,
              nombre: asig.grado_nombre || `Grado ${asig.id_grado}`,
            });
          }
        });
      } else {
        const gradosRes = await api.get("/api/grados");
        const gradosData = gradosRes.data?.data || gradosRes.data;
        gradosUnicos = Array.isArray(gradosData) ? gradosData : [];
      }
      setGrados(Array.isArray(gradosUnicos) ? gradosUnicos : []);
    } catch (error) {
      console.error("Error al cargar grados:", error);
      setGrados([]);
    }
  }, [user]);

  const fetchSecciones = useCallback(async () => {
    if (!user || !selectedGrado) return;
    try {
      let seccionesFiltradas = [];
      if (user?.rol?.toLowerCase() === "profesor" && user?.id_profesor) {
        const asignacionesRes = await api.get(
          `/api/profesores/${user.id_profesor}/carga`
        );
        seccionesFiltradas = (asignacionesRes.data.data || [])
          .filter((asig) => asig.id_grado.toString() === selectedGrado)
          .map((asig) => ({
            id_seccion: asig.id_seccion,
            nombre: asig.seccion_nombre || `Sección ${asig.id_seccion}`,
            id_grado: asig.id_grado,
          }));

        // Eliminar duplicados de secciones si el profesor tiene varias materias en la misma sección
        const uniqueSecciones = [];
        const map = new Map();
        for (const item of seccionesFiltradas) {
          if (!map.has(item.id_seccion)) {
            map.set(item.id_seccion, true);
            uniqueSecciones.push(item);
          }
        }
        setSecciones(uniqueSecciones);
      } else {
        const seccionesRes = await api.get(
          `/api/secciones?id_grado=${selectedGrado}`
        );
        // El backend devuelve { success: true, data: [...] }
        const seccionesData = seccionesRes.data?.data || seccionesRes.data;
        console.log(
          "📋 Secciones recibidas para grado",
          selectedGrado,
          ":",
          seccionesData
        );
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
      }
    } catch (error) {
      console.error("Error al cargar secciones:", error);
      setSecciones([]);
    }
  }, [user, selectedGrado]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);
  useEffect(() => {
    if (user) fetchGrados();
  }, [user, fetchGrados]);
  useEffect(() => {
    fetchSecciones();
  }, [fetchSecciones]);

  // Auto-seleccionar primer grado cuando se cargan los grados
  useEffect(() => {
    if (grados.length > 0 && !selectedGrado) {
      setSelectedGrado(grados[0].id_grado.toString());
    }
  }, [grados, selectedGrado]);

  // Auto-seleccionar primera sección cuando se cargan las secciones
  useEffect(() => {
    if (secciones.length > 0 && !selectedSeccion) {
      setSelectedSeccion(secciones[0].id_seccion.toString());
    }
  }, [secciones, selectedSeccion]);

  // --- 2. LÓGICA DE FILTROS MINED ---

  // Define qué columnas ver según el periodo escolar seleccionado
  const getColumnasVisibles = () => {
    switch (selectedBimestre) {
      case "s1": // I Semestre Completo
        return {
          b1: true,
          b2: true,
          s1: true,
          b3: false,
          b4: false,
          s2: false,
          final: false,
          colSpan: 6, // 2 cols * 3 periodos (Cual/Cuant)
        };
      case "s2": // II Semestre Completo
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
      case "final": // Reporte Anual
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
      default: // Default I Semestre
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
  };

  const cargarReporte = async () => {
    if (!selectedGrado || !selectedSeccion) {
      setMensaje("Debe seleccionar grado y sección");
      return;
    }
    setLoading(true);
    setMensaje("");
    setReporteData(null);

    try {
      const params = {id_grado: selectedGrado, id_seccion: selectedSeccion};
      if (selectedGenero !== "todos") params.genero = selectedGenero;

      console.log("📊 Solicitando reporte con params:", params);
      const res = await api.get("/api/reportes/consolidado", {params});
      console.log("✅ Respuesta del servidor:", res.data);
      console.log("📚 Estudiantes:", res.data.estudiantes?.length || 0);
      console.log("📖 Materias:", res.data.materias?.length || 0);

      setReporteData(res.data);

      if (res.data.profesor) setProfesor(res.data.profesor);
      if (res.data.estudiantes?.length === 0)
        setMensaje("No hay estudiantes registrados.");
    } catch (error) {
      console.error("❌ Error reporte:", error);
      console.error(
        "❌ Detalles del error:",
        error.response?.data || error.message
      );
      setMensaje("Error al cargar los datos del reporte.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. UTILIDADES DE CÁLCULO Y FORMATO ---

  const getBadgeClass = (cual) => {
    switch (cual) {
      case "AA":
        return "bg-green-600 text-white";
      case "AS":
        return "bg-blue-600 text-white";
      case "AF":
        return "bg-yellow-600 text-white";
      case "AI":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const convertirACualitativa = (nota) => {
    if (nota >= 90) return "AA";
    if (nota >= 76) return "AS";
    if (nota >= 60) return "AF";
    return "AI"; // Menor a 60 o 0
  };

  // Calcula nota final promediando Semestre 1 y Semestre 2 (Lógica MINED)
  const calcularNotaFinal = (semestre1, semestre2) => {
    const s1 = semestre1?.cuant || 0;
    const s2 = semestre2?.cuant || 0;

    // Si no ha iniciado el año o faltan datos críticos
    if (s1 === 0 && s2 === 0) return {cual: "-", cuant: 0};

    // Si solo hay un semestre, la nota final temporal es ese semestre
    // OJO: En algunos colegios prefieren mostrar "-" hasta que termine el año.
    // Aquí asumiremos que se promedia lo que existe si el sistema lo permite,
    // pero lo estándar es (S1+S2)/2

    let promedio = 0;
    if (s1 > 0 && s2 > 0) {
      promedio = Math.round((s1 + s2) / 2);
    } else if (s1 > 0) {
      // Aún cursando S2
      return {cual: "-", cuant: 0};
    }

    return {
      cuant: promedio,
      cual: convertirACualitativa(promedio),
    };
  };

  // --- 4. GENERACIÓN DE PDFS (SÁBANA Y CERTIFICADO) ---

  const imprimirReporte = () => window.print();

  const mostrarVistaPreviaEstudiante = (estudiante) => {
    setEstudiantePreview(estudiante);
    setMostrarVistaPrevia(true);
  };

  const cerrarVistaPrevia = () => {
    setMostrarVistaPrevia(false);
    setEstudiantePreview(null);
  };

  // [PDF] CERTIFICADO INDIVIDUAL
  const generarCertificadoPDF = (estudiante) => {
    if (!reporteData || !estudiante) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "cm",
      format: [21.6, 33],
    }); // Oficio/Legal
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 2;
    let currentY = 2;

    // Header simple
    if (escuela?.logo) {
      try {
        const logoUrl = `http://localhost:4000${escuela.logo}`;
        doc.addImage(
          logoUrl,
          "PNG",
          pageWidth - margin - 2.5,
          currentY - 0.5,
          2.5,
          2.5
        );
      } catch (e) {
        /* ignore */
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      escuela?.nombre || "CENTRO EDUCATIVO",
      pageWidth / 2,
      currentY + 0.5,
      {align: "center"}
    );

    currentY += 1.5;
    doc.setFontSize(14);
    doc.text("CERTIFICADO DE CALIFICACIONES", pageWidth / 2, currentY, {
      align: "center",
    });

    currentY += 0.7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Año Lectivo: ${new Date().getFullYear()}`,
      pageWidth / 2,
      currentY,
      {align: "center"}
    );

    // Línea verde MINED
    currentY += 0.5;
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(0.05);
    doc.line(margin, currentY, pageWidth - margin, currentY);

    // Datos Estudiante
    currentY += 1;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Estudiante: ${estudiante.nombre_completo}`, margin, currentY);

    currentY += 0.6;
    doc.setFont("helvetica", "normal");
    const gradoNom =
      grados.find((g) => g.id_grado == selectedGrado)?.nombre || "";
    const seccionNom = Array.isArray(secciones)
      ? secciones.find((s) => s.id_seccion == selectedSeccion)?.nombre || ""
      : "";
    doc.text(
      `Grado: ${gradoNom}      Sección: ${seccionNom}`,
      margin,
      currentY
    );
    doc.text(
      `Código: ${estudiante.codigo_mined || "N/A"}`,
      pageWidth - margin - 4,
      currentY
    );

    currentY += 0.6;
    const profesorGuia = reporteData.profesor
      ? `${reporteData.profesor.nombre} ${reporteData.profesor.apellido}`
      : "No asignado";
    doc.text(`Profesor Guía: ${profesorGuia}`, margin, currentY);

    // Tabla Notas Finales
    currentY += 1;

    const tablaBody = [];
    let sumaPromedios = 0;
    let countMaterias = 0;

    reporteData.materias.forEach((mat) => {
      const cal = estudiante.calificaciones[mat.id_materia];
      if (cal) {
        // Usamos los semestres ya calculados por el backend si existen, o calculamos
        const s1 =
          cal.semestre_1?.cuant ||
          Math.round(
            ((cal.bimestre_1?.cuant || 0) + (cal.bimestre_2?.cuant || 0)) / 2
          );
        const s2 =
          cal.semestre_2?.cuant ||
          Math.round(
            ((cal.bimestre_3?.cuant || 0) + (cal.bimestre_4?.cuant || 0)) / 2
          );

        let nf = 0;
        let cual = "AI";

        // Solo calcular nota final si ambos semestres tienen nota
        if (s1 > 0 && s2 > 0) {
          nf = Math.round((s1 + s2) / 2);
          cual = convertirACualitativa(nf);
          sumaPromedios += nf;
          countMaterias++;
        } else if (s1 > 0) {
          // Caso especial: Certificado parcial a medio año
          nf = s1;
          cual = convertirACualitativa(nf);
          // Opcional: Decidir si sumar al promedio general
        }

        tablaBody.push([mat.nombre, nf > 0 ? nf : "-", nf > 0 ? cual : "-"]);
      }
    });

    const promGral =
      countMaterias > 0 ? Math.round(sumaPromedios / countMaterias) : 0;
    const promCual = convertirACualitativa(promGral);

    autoTable(doc, {
      startY: currentY,
      head: [["ASIGNATURA", "NOTA FINAL", "CUALITATIVA"]],
      body: tablaBody,
      foot: [
        [
          "PROMEDIO GENERAL",
          promGral > 0 ? promGral : "-",
          promGral > 0 ? promCual : "-",
        ],
      ],
      theme: "grid",
      headStyles: {fillColor: [21, 128, 61], halign: "center"},
      columnStyles: {
        0: {halign: "left"},
        1: {halign: "center"},
        2: {halign: "center"},
      },
      footStyles: {fillColor: [234, 179, 8], textColor: 0, halign: "center"},
    });

    // Firmas y Leyenda (Mismo estilo anterior)
    const finalY = doc.lastAutoTable.finalY + 1;
    doc.setFontSize(8);
    doc.text(
      "AA: 90-100  |  AS: 76-89  |  AF: 60-75  |  AI: 0-59",
      margin,
      finalY
    );

    const firmaY = 27; // Cerca del final
    doc.line(margin + 2, firmaY, margin + 7, firmaY);
    doc.text("Director(a)", margin + 3.5, firmaY + 0.5);

    doc.line(pageWidth - margin - 7, firmaY, pageWidth - margin - 2, firmaY);
    doc.text("Secretaria(o)", pageWidth - margin - 5.5, firmaY + 0.5);

    // Pie de página profesional
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.01);
    doc.line(margin, pageHeight - 1.5, pageWidth - margin, pageHeight - 1.5);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      escuela?.direccion || "Dirección no disponible",
      pageWidth / 2,
      pageHeight - 1.1,
      {align: "center"}
    );
    doc.text(
      `Tel: ${escuela?.telefono || "N/A"} | Email: ${escuela?.email || "N/A"}`,
      pageWidth / 2,
      pageHeight - 0.7,
      {align: "center"}
    );
    doc.text(
      `Documento generado el ${new Date().toLocaleDateString(
        "es-NI"
      )} a las ${new Date().toLocaleTimeString("es-NI")}`,
      pageWidth / 2,
      pageHeight - 0.3,
      {align: "center"}
    );

    doc.save(
      `Certificado_${
        estudiante.nombre_completo
      }_${new Date().getFullYear()}.pdf`
    );
  };

  // [PDF] REPORTE SÁBANA (CONSOLIDADO)
  const getTituloReporte = () => {
    switch (selectedBimestre) {
      case "s1":
        return "I SEMESTRE (Cortes I y II)";
      case "s2":
        return "II SEMESTRE (Cortes III y IV)";
      case "final":
        return "CONSOLIDADO FINAL";
      default:
        return "SÁBANA DE CALIFICACIONES";
    }
  };

  const exportarPDF = () => {
    if (!reporteData?.estudiantes?.length)
      return showToast("Sin datos", "warning");

    const normalizeText = (value) =>
      String(value || "")
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, " ")
        .trim();

    const abbreviateMateria = (nombre, maxLen = 8) => {
      const clean = normalizeText(nombre).toUpperCase();
      if (!clean) return "MAT";
      if (clean.length <= maxLen) return clean;

      const stop = new Set([
        "DE",
        "DEL",
        "LA",
        "LAS",
        "EL",
        "LOS",
        "Y",
        "E",
        "EN",
        "A",
        "AL",
        "PARA",
        "CON",
      ]);
      const words = clean.split(" ").filter((w) => w && !stop.has(w));

      // 1) Iniciales (hasta 4)
      if (words.length >= 2) {
        const initials = words
          .slice(0, 4)
          .map((w) => w[0])
          .join("");
        if (initials.length >= 3) return initials.slice(0, maxLen);
      }

      // 2) 2 primeras palabras recortadas
      if (words.length >= 2) {
        const a = words[0].slice(0, Math.min(4, words[0].length));
        const b = words[1].slice(0, Math.min(4, words[1].length));
        return (a + b).slice(0, maxLen);
      }

      // 3) Recorte simple
      return clean.slice(0, maxLen);
    };

    const buildMateriaAbbr = (materias) => {
      const maxLen = (materias?.length || 0) > 6 ? 6 : 8;
      const used = new Map();
      const map = new Map();
      (materias || []).forEach((m) => {
        const base = abbreviateMateria(m.nombre, maxLen);
        const key = base;
        const count = (used.get(key) || 0) + 1;
        used.set(key, count);
        const abbr = count === 1 ? base : `${base}${count}`.slice(0, maxLen);
        map.set(m.id_materia, abbr);
      });
      return map;
    };

    const materiasCount = reporteData.materias?.length || 0;
    const baseFontSize = materiasCount > 10 ? 5.5 : materiasCount > 6 ? 6 : 7;
    const basePadding =
      materiasCount > 10 ? 0.025 : materiasCount > 6 ? 0.03 : 0.04;
    const materiaAbbrMap = buildMateriaAbbr(reporteData.materias);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "legal",
    });
    const cols = getColumnasVisibles();

    // Configuración de columnas dinámicas para autoTable
    // Lógica: Construir headers anidados según 'cols'
    const headers = [
      [
        {content: "No.", rowSpan: 3, styles: {valign: "middle"}},
        {
          content: "Nombres y Apellidos",
          rowSpan: 3,
          styles: {valign: "middle"},
        },
        {
          content: "Código MINED",
          rowSpan: 3,
          styles: {valign: "middle"},
        },
      ],
    ];
    const subHeader1 = []; // Bimestres/Semestres
    const subHeader2 = []; // Cual/Cuant

    // Llenar headers por materia
    reporteData.materias.forEach((mat) => {
      const matHeader = materiaAbbrMap.get(mat.id_materia) || mat.nombre;
      headers[0].push({
        content: matHeader,
        colSpan: cols.colSpan,
        styles: {halign: "center"},
      });

      // Subheaders
      if (cols.b1) {
        subHeader1.push({
          content: "I BIM",
          colSpan: 2,
          styles: {halign: "center"},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.b2) {
        subHeader1.push({
          content: "II BIM",
          colSpan: 2,
          styles: {halign: "center"},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.s1) {
        subHeader1.push({
          content: "I SEM",
          colSpan: 2,
          styles: {halign: "center", fillColor: [219, 234, 254], textColor: 0},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.b3) {
        subHeader1.push({
          content: "III BIM",
          colSpan: 2,
          styles: {halign: "center"},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.b4) {
        subHeader1.push({
          content: "IV BIM",
          colSpan: 2,
          styles: {halign: "center"},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.s2) {
        subHeader1.push({
          content: "II SEM",
          colSpan: 2,
          styles: {halign: "center", fillColor: [243, 232, 255], textColor: 0},
        });
        subHeader2.push("Cual", "Cuant");
      }
      if (cols.final) {
        subHeader1.push({
          content: "FINAL",
          colSpan: 2,
          styles: {halign: "center", fillColor: [250, 204, 21], textColor: 0},
        });
        subHeader2.push("Cual", "Cuant");
      }
    });

    // Construir Body
    const body = reporteData.estudiantes.map((est) => {
      const codigoMined =
        est.codigo_mined || est.codigo_estudiante || est.codigo || "-";
      const row = [est.numero, est.nombre_completo, codigoMined];
      reporteData.materias.forEach((mat) => {
        const cal = est.calificaciones[mat.id_materia] || {};

        // Helper para formatear celda vacía
        const fmt = (val) =>
          val && val.cuant > 0 ? val : {cual: "-", cuant: "-"};

        if (cols.b1)
          row.push(fmt(cal.bimestre_1).cual, fmt(cal.bimestre_1).cuant);
        if (cols.b2)
          row.push(fmt(cal.bimestre_2).cual, fmt(cal.bimestre_2).cuant);
        if (cols.s1)
          row.push(fmt(cal.semestre_1).cual, fmt(cal.semestre_1).cuant);
        if (cols.b3)
          row.push(fmt(cal.bimestre_3).cual, fmt(cal.bimestre_3).cuant);
        if (cols.b4)
          row.push(fmt(cal.bimestre_4).cual, fmt(cal.bimestre_4).cuant);
        if (cols.s2)
          row.push(fmt(cal.semestre_2).cual, fmt(cal.semestre_2).cuant);
        if (cols.final) {
          const final = calcularNotaFinal(cal.semestre_1, cal.semestre_2);
          row.push(final.cual, final.cuant > 0 ? final.cuant : "-");
        }
      });
      return row;
    });

    // Encabezado profesional
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Logo y título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(escuela?.nombre || "CENTRO EDUCATIVO", pageWidth / 2, 0.4, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("SÁBANA DE CALIFICACIONES", pageWidth / 2, 0.6, {align: "center"});
    doc.setFontSize(10);
    doc.text(getTituloReporte(), pageWidth / 2, 0.75, {align: "center"});

    // Información del reporte
    doc.setFontSize(10);
    const gradoTxt =
      grados.find((g) => g.id_grado == selectedGrado)?.nombre || "";
    const seccionTxt = Array.isArray(secciones)
      ? secciones.find((s) => s.id_seccion == selectedSeccion)?.nombre
      : "";
    const profesorGuia = reporteData.profesor
      ? `${reporteData.profesor.nombre} ${reporteData.profesor.apellido}`
      : "No asignado";

    doc.text(`Grado: ${gradoTxt} - Sección: ${seccionTxt}`, 0.5, 0.85);
    doc.text(`Profesor Guía: ${profesorGuia}`, 0.5, 1.0);
    doc.text(
      `Año Lectivo: ${new Date().getFullYear()}`,
      pageWidth - 0.5,
      0.85,
      {align: "right"}
    );
    doc.text(
      `Fecha: ${new Date().toLocaleDateString("es-NI")}`,
      pageWidth - 0.5,
      1.0,
      {align: "right"}
    );

    autoTable(doc, {
      startY: 1.2,
      head: [headers[0], subHeader1, subHeader2],
      body: body,
      theme: "grid",
      styles: {
        fontSize: baseFontSize,
        cellPadding: basePadding,
        lineColor: [200, 200, 200],
        lineWidth: 0.01,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        valign: "middle",
        lineColor: [0, 0, 0],
        lineWidth: 0.02,
      },
      columnStyles: {
        0: {cellWidth: 0.3},
        1: {cellWidth: 2.7},
        2: {cellWidth: 0.9},
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      didParseCell: (data) => {
        // Quitar fondos de colores de los subheaders
        if (data.section === "head") {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
        }

        // Marcar notas reprobadas
        if (data.section === "body" && data.column.index > 1) {
          const val = data.cell.raw;
          if (!isNaN(val) && val < 60 && val > 0) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
      didDrawPage: (data) => {
        // Pie de página en cada página
        const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;
        const totalPages = doc.internal.getNumberOfPages();

        // Línea separadora
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.01);
        doc.line(0.5, pageHeight - 0.5, pageWidth - 0.5, pageHeight - 0.5);

        // Información del pie
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          escuela?.direccion || "Dirección no disponible",
          pageWidth / 2,
          pageHeight - 0.35,
          {align: "center"}
        );
        doc.text(
          `Teléfono: ${escuela?.telefono || "N/A"} | Email: ${
            escuela?.email || "N/A"
          }`,
          pageWidth / 2,
          pageHeight - 0.2,
          {align: "center"}
        );
        doc.text(
          `Página ${pageNumber} de ${totalPages} | Generado: ${new Date().toLocaleString(
            "es-NI"
          )}`,
          pageWidth - 0.5,
          pageHeight - 0.2,
          {align: "right"}
        );
      },
    });

    // Nota corta cuando hay muchas materias (encabezados abreviados)
    if (materiasCount > 6) {
      const y = doc.lastAutoTable.finalY + 0.12;
      if (y < pageHeight - 0.6) {
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text(
          "Nota: los encabezados de materias están abreviados para mejor legibilidad.",
          0.5,
          y
        );
      }
    }

    doc.save(
      `Sabana_Calificaciones_${gradoTxt}_${seccionTxt}_${new Date().getFullYear()}.pdf`
    );
  };

  // --- RENDERIZADO PRINCIPAL ---
  // (Mantengo tu estructura visual original de Cards y Tablas HTML,
  // solo asegurando que la tabla HTML use getColumnasVisibles() correctamente)

  const headerStats = [
    {
      label: "Grados Disponibles",
      value: grados.length || 0,
      color: "from-blue-500 to-indigo-600",
      icon: TableCellsIcon,
    },
    {
      label: "Secciones Activas",
      value: secciones.length || 0,
      color: "from-emerald-500 to-teal-600",
      icon: FunnelIcon,
    },
    {
      label: "Formatos",
      value: "2 Tipos",
      color: "from-purple-500 to-violet-600",
      icon: DocumentTextIcon,
    },
    {
      label: "Estado",
      value: loading ? "Procesando..." : "Listo",
      color: "from-amber-500 to-orange-600",
      icon: PrinterIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <PageHeader
          title="Reportes de Calificaciones"
          subtitle="Sistema MINED - Consolidado de Notas"
          icon={DocumentChartBarIcon}
          schoolName={escuela?.nombre}
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          stats={headerStats}
        />

        {vistaActual !== "menu" && (
          <button
            onClick={() => {
              setVistaActual("menu");
              setReporteData(null);
            }}
            className="mt-4 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            ← Volver al Menú
          </button>
        )}
      </div>

      {/* MENÚ PRINCIPAL */}
      {vistaActual === "menu" && (
        <div className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => setVistaActual("sabana")}
            className="cursor-pointer bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl hover:scale-105 transition-all"
          >
            <TableCellsIcon className="w-12 h-12 text-white mb-4" />
            <h3 className="text-3xl font-bold text-white">Reporte Sábana</h3>
            <p className="text-blue-100 mt-2">
              Vista consolidada por Bimestre/Semestre.
            </p>
          </div>
          <div
            onClick={() => setVistaActual("certificado")}
            className="cursor-pointer bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 shadow-2xl hover:scale-105 transition-all"
          >
            <DocumentTextIcon className="w-12 h-12 text-white mb-4" />
            <h3 className="text-3xl font-bold text-white">Certificados</h3>
            <p className="text-emerald-100 mt-2">
              Boletines individuales para impresión.
            </p>
          </div>
        </div>
      )}

      {/* VISTA SÁBANA (CON FILTROS) */}
      {vistaActual === "sabana" && (
        <div className="max-w-7xl mx-auto px-4 pb-8">
          <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={selectedGrado}
                onChange={(e) => {
                  setSelectedGrado(e.target.value);
                  setSelectedSeccion("");
                }}
                className="bg-gray-700 text-white p-3 rounded-xl border border-gray-600"
              >
                <option value="">Seleccionar Grado</option>
                {Array.isArray(grados) &&
                  grados.map((g) => (
                    <option key={g.id_grado} value={g.id_grado}>
                      {g.nombre}
                    </option>
                  ))}
              </select>
              <select
                value={selectedSeccion}
                onChange={(e) => setSelectedSeccion(e.target.value)}
                className="bg-gray-700 text-white p-3 rounded-xl border border-gray-600"
              >
                <option value="">Seleccionar Sección</option>
                {Array.isArray(secciones) &&
                  secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
              <select
                value={selectedBimestre}
                onChange={(e) => setSelectedBimestre(e.target.value)}
                className="bg-gray-700 text-white p-3 rounded-xl border border-gray-600"
              >
                <option value="s1">I Semestre (Cortes I y II)</option>
                <option value="s2">II Semestre (Cortes III y IV)</option>
                <option value="final">Final Anual</option>
              </select>
              <button
                onClick={cargarReporte}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl font-bold"
              >
                {loading ? "Cargando..." : "Generar Tabla"}
              </button>
            </div>
          </div>

          {/* Mensajes de estado */}
          {mensaje && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
              <p className="font-semibold">⚠️ {mensaje}</p>
            </div>
          )}

          {loading && (
            <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
              <p className="font-semibold">🔄 Cargando datos del reporte...</p>
            </div>
          )}

          {/* Indicador de datos cargados */}
          {reporteData && !loading && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
              <p className="font-semibold">
                ✅ Reporte cargado: {reporteData.estudiantes?.length || 0}{" "}
                estudiantes, {reporteData.materias?.length || 0} materias
              </p>
            </div>
          )}

          {/* BOTONES EXPORTAR */}
          {reporteData && (
            <div className="flex gap-4 mb-4">
              <button
                onClick={exportarPDF}
                className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700"
              >
                <ArrowDownTrayIcon className="w-5 h-5" /> Exportar PDF Legal
              </button>
            </div>
          )}

          {/* TABLA HTML (VISUALIZACIÓN RÁPIDA) */}
          {reporteData && reporteData.estudiantes && reporteData.materias ? (
            <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl overflow-x-auto border border-gray-700">
              {/* Encabezado del Reporte (UI semi-oscura) */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700 text-center">
                <h2 className="text-2xl font-bold text-gray-100 uppercase tracking-wide">
                  {escuela?.nombre || "Centro Educativo"}
                </h2>
                <h3 className="text-lg font-semibold text-gray-300 mt-1">
                  Sábana de Calificaciones - Año Lectivo{" "}
                  {new Date().getFullYear()}
                </h3>
                <h4 className="text-md font-medium text-gray-400 mt-0.5">
                  {getTituloReporte()}
                </h4>
                <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm text-gray-300 font-medium">
                  <div className="bg-gray-900/40 px-4 py-2 rounded-lg border border-gray-700">
                    <span className="text-gray-400 mr-2">Grado:</span>
                    <span className="text-gray-100">
                      {grados.find((g) => g.id_grado == selectedGrado)
                        ?.nombre || "N/A"}
                    </span>
                  </div>
                  <div className="bg-gray-900/40 px-4 py-2 rounded-lg border border-gray-700">
                    <span className="text-gray-400 mr-2">Sección:</span>
                    <span className="text-gray-100">
                      {Array.isArray(secciones)
                        ? secciones.find((s) => s.id_seccion == selectedSeccion)
                            ?.nombre
                        : "N/A"}
                    </span>
                  </div>
                  <div className="bg-gray-900/40 px-4 py-2 rounded-lg border border-gray-700">
                    <span className="text-gray-400 mr-2">Profesor Guía:</span>
                    <span className="text-gray-100">
                      {reporteData.profesor
                        ? `${reporteData.profesor.nombre} ${reporteData.profesor.apellido}`
                        : "No asignado"}
                    </span>
                  </div>
                </div>
              </div>

              <table className="w-full text-xs border-collapse text-gray-200">
                <thead className="bg-gray-900/40 text-gray-100">
                  <tr>
                    <th
                      rowSpan={3}
                      className="p-2 border border-gray-700 sticky left-0 bg-gray-900/60 z-10 font-bold"
                    >
                      No.
                    </th>
                    <th
                      rowSpan={3}
                      className="p-2 border border-gray-700 sticky left-8 bg-gray-900/60 z-10 min-w-[200px] font-bold"
                    >
                      Nombre
                    </th>
                    {Array.isArray(reporteData.materias) &&
                      reporteData.materias.map((mat) => (
                        <th
                          key={mat.id_materia}
                          colSpan={getColumnasVisibles().colSpan}
                          className="border border-gray-700 p-2 text-center font-bold bg-gray-800 text-indigo-200"
                        >
                          {mat.nombre}
                        </th>
                      ))}
                  </tr>
                  {/* Segunda fila: Bimestres y Semestres */}
                  <tr>
                    {Array.isArray(reporteData.materias) &&
                      reporteData.materias.map((mat) => {
                        const cols = getColumnasVisibles();
                        return (
                          <React.Fragment key={`sem-${mat.id_materia}`}>
                            {cols.b1 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-indigo-500/10 text-indigo-200 font-semibold"
                              >
                                I BIM
                              </th>
                            )}
                            {cols.b2 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-indigo-500/10 text-indigo-200 font-semibold"
                              >
                                II BIM
                              </th>
                            )}
                            {cols.s1 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-indigo-500/20 text-indigo-100 font-bold"
                              >
                                SEM 1
                              </th>
                            )}
                            {cols.b3 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-purple-500/10 text-purple-200 font-semibold"
                              >
                                III BIM
                              </th>
                            )}
                            {cols.b4 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-purple-500/10 text-purple-200 font-semibold"
                              >
                                IV BIM
                              </th>
                            )}
                            {cols.s2 && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-purple-500/20 text-purple-100 font-bold"
                              >
                                SEM 2
                              </th>
                            )}
                            {cols.final && (
                              <th
                                colSpan={2}
                                className="border border-gray-700 p-1 text-xs bg-amber-500/15 text-amber-100 font-bold"
                              >
                                FINAL
                              </th>
                            )}
                          </React.Fragment>
                        );
                      })}
                  </tr>
                  {/* Tercera fila: Cual/Cuant */}
                  <tr>
                    {Array.isArray(reporteData.materias) &&
                      reporteData.materias.map((mat) => {
                        const cols = getColumnasVisibles();
                        const totalCols = cols.colSpan / 2;
                        return (
                          <React.Fragment key={`headers-${mat.id_materia}`}>
                            {[...Array(totalCols)].map((_, i) => (
                              <React.Fragment key={i}>
                                <th className="border border-gray-700 p-1 text-[10px] bg-gray-800 text-gray-400 font-normal">
                                  Cual
                                </th>
                                <th className="border border-gray-700 p-1 text-[10px] bg-gray-800 text-gray-400 font-normal">
                                  Cuant
                                </th>
                              </React.Fragment>
                            ))}
                          </React.Fragment>
                        );
                      })}
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(reporteData.estudiantes) &&
                    reporteData.estudiantes.map((est) => (
                      <tr
                        key={est.id_estudiante}
                        className="hover:bg-gray-700/60 text-gray-100 transition-colors"
                      >
                        <td className="p-2 border border-gray-700 text-center sticky left-0 bg-gray-800 font-medium">
                          {est.numero}
                        </td>
                        <td className="p-2 border border-gray-700 sticky left-8 bg-gray-800 font-medium text-gray-100">
                          {est.nombre_completo}
                        </td>
                        {/* Celdas de notas renderizadas dinámicamente según getColumnasVisibles */}
                        {reporteData.materias.map((mat) => {
                          const cal = est.calificaciones[mat.id_materia] || {};
                          const cols = getColumnasVisibles();
                          // Renderizar celdas igual que en PDF logic...
                          return (
                            <React.Fragment key={mat.id_materia}>
                              {cols.b1 && (
                                <>
                                  <td className="border border-gray-700 text-center text-gray-200">
                                    {cal.bimestre_1?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center text-gray-200 ${
                                      cal.bimestre_1?.cuant < 60 &&
                                      cal.bimestre_1?.cuant > 0
                                        ? "text-red-600 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {cal.bimestre_1?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.b2 && (
                                <>
                                  <td className="border border-gray-700 text-center text-gray-200">
                                    {cal.bimestre_2?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center text-gray-200 ${
                                      cal.bimestre_2?.cuant < 60 &&
                                      cal.bimestre_2?.cuant > 0
                                        ? "text-red-600 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {cal.bimestre_2?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.s1 && (
                                <>
                                  <td className="border border-gray-700 text-center bg-indigo-500/10 text-indigo-100">
                                    {cal.semestre_1?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center bg-indigo-500/10 text-indigo-100 font-bold ${
                                      cal.semestre_1?.cuant < 60 &&
                                      cal.semestre_1?.cuant > 0
                                        ? "text-red-400"
                                        : ""
                                    }`}
                                  >
                                    {cal.semestre_1?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.b3 && (
                                <>
                                  <td className="border border-gray-700 text-center text-gray-200">
                                    {cal.bimestre_3?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center text-gray-200 ${
                                      cal.bimestre_3?.cuant < 60 &&
                                      cal.bimestre_3?.cuant > 0
                                        ? "text-red-600 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {cal.bimestre_3?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.b4 && (
                                <>
                                  <td className="border border-gray-700 text-center text-gray-200">
                                    {cal.bimestre_4?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center text-gray-200 ${
                                      cal.bimestre_4?.cuant < 60 &&
                                      cal.bimestre_4?.cuant > 0
                                        ? "text-red-600 font-bold"
                                        : ""
                                    }`}
                                  >
                                    {cal.bimestre_4?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.s2 && (
                                <>
                                  <td className="border border-gray-700 text-center bg-purple-500/10 text-purple-100">
                                    {cal.semestre_2?.cual || "-"}
                                  </td>
                                  <td
                                    className={`border border-gray-700 text-center bg-purple-500/10 text-purple-100 font-bold ${
                                      cal.semestre_2?.cuant < 60 &&
                                      cal.semestre_2?.cuant > 0
                                        ? "text-red-400"
                                        : ""
                                    }`}
                                  >
                                    {cal.semestre_2?.cuant || "-"}
                                  </td>
                                </>
                              )}
                              {cols.final &&
                                (() => {
                                  const f = calcularNotaFinal(
                                    cal.semestre_1,
                                    cal.semestre_2
                                  );
                                  return (
                                    <>
                                      <td className="border border-gray-700 text-center bg-amber-500/15 text-amber-100">
                                        {f.cual}
                                      </td>
                                      <td
                                        className={`border border-gray-700 text-center bg-amber-500/15 text-amber-100 font-bold ${
                                          f.cuant < 60 && f.cuant > 0
                                            ? "text-red-400"
                                            : ""
                                        }`}
                                      >
                                        {f.cuant || "-"}
                                      </td>
                                    </>
                                  );
                                })()}
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      )}

      {/* VISTA CERTIFICADO (IGUAL QUE ANTES PERO CON GRADOS CARGADOS) */}
      {vistaActual === "certificado" && (
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={selectedGrado}
                onChange={(e) => {
                  setSelectedGrado(e.target.value);
                  setSelectedSeccion("");
                }}
                className="bg-gray-700 text-white p-3 rounded-xl border border-gray-600"
              >
                <option value="">Seleccionar Grado</option>
                {Array.isArray(grados) &&
                  grados.map((g) => (
                    <option key={g.id_grado} value={g.id_grado}>
                      {g.nombre}
                    </option>
                  ))}
              </select>
              <select
                value={selectedSeccion}
                onChange={(e) => setSelectedSeccion(e.target.value)}
                className="bg-gray-700 text-white p-3 rounded-xl border border-gray-600"
              >
                <option value="">Seleccionar Sección</option>
                {Array.isArray(secciones) &&
                  secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.nombre}
                    </option>
                  ))}
              </select>
            </div>
            <button
              onClick={cargarReporte}
              disabled={!selectedGrado || !selectedSeccion}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold"
            >
              Cargar Lista de Estudiantes
            </button>
          </div>

          {reporteData && (
            <div className="mt-6 grid gap-3">
              {reporteData.estudiantes.map((est) => (
                <div
                  key={est.id_estudiante}
                  className="bg-gray-700 p-4 rounded-xl flex justify-between items-center hover:bg-gray-600 transition-colors"
                >
                  <div className="text-white">
                    <p className="font-bold">{est.nombre_completo}</p>
                    <p className="text-sm text-gray-400">{est.codigo_mined}</p>
                  </div>
                  <button
                    onClick={() => generarCertificadoPDF(est)}
                    className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-bold flex gap-2"
                  >
                    <PrinterIcon className="w-5 h-5" /> Imprimir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
}

export default ReportesPage;
