import React, {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  UserIcon,
  PrinterIcon,
  BuildingLibraryIcon,
  CalendarDaysIcon,
  PhoneIcon,
  EyeIcon,
  MapPinIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/solid";

function TablaCalificacionesAlumno({alumnoId, nombreAlumno, onVolver, token}) {
  const [calificacionesAlumno, setCalificacionesAlumno] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mostrarVistaImpresion, setMostrarVistaImpresion] = useState(false);
  const [datosCompletos, setDatosCompletos] = useState({
    estudiante: null,
    escuela: null,
    profesor: null,
    codigoMined: "",
    fechaGeneracion: new Date().toLocaleDateString(),
  });

  useEffect(() => {
    if (alumnoId) {
      cargarCalificacionesAlumno();
      obtenerDatosCompletos(alumnoId);
    }
  }, [alumnoId]);

  const cargarCalificacionesAlumno = async () => {
    try {
      setMensaje("");
      setCalificacionesAlumno([]);

      console.log("Cargando calificaciones para alumno ID:", alumnoId);

      const res = await api.get(
        `${services.calificacionesMateriasAlumno}/${alumnoId}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );

      console.log("Respuesta del servidor:", res.data);

      if (res.data && res.data.length > 0) {
        setCalificacionesAlumno(res.data);
        console.log("Calificaciones cargadas:", res.data);
      } else {
        // Si no hay calificaciones, crear estructura vacía
        console.log("No hay calificaciones, creando estructura vacía");

        try {
          const materiasRes = await api.get(services.materias, {
            headers: {Authorization: `Bearer ${token}`},
          });

          console.log("Materias disponibles:", materiasRes.data);

          if (materiasRes.data && materiasRes.data.length > 0) {
            const emptyGrades = materiasRes.data.map((materia) => ({
              id_materia: materia.id_materia,
              materia: materia.nombre,
              bimestre_1: 0,
              bimestre_2: 0,
              bimestre_3: 0,
              bimestre_4: 0,
              comentarios: "",
              id_calificacion: null, // Importante: marcar como nueva
            }));

            setCalificacionesAlumno(emptyGrades);
            setMensaje(
              "No hay calificaciones registradas. Se han creado campos vacíos para todas las materias."
            );
          } else {
            setMensaje("No se encontraron materias disponibles.");
          }
        } catch (materiasError) {
          console.error("Error al cargar materias:", materiasError);
          setMensaje("Error al cargar las materias disponibles.");
        }
      }
    } catch (error) {
      console.error("Error loading student grades:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });

      setMensaje(
        "Error al cargar calificaciones del alumno: " +
          (error.response?.data?.message || error.message)
      );
      setCalificacionesAlumno([]);
    }
  };

  const obtenerDatosCompletos = async (id_alumno) => {
    try {
      // Obtener datos del estudiante
      let estudianteData = null;
      try {
        const estudianteRes = await api.get(
          `${services.alumnos}/${id_alumno}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        estudianteData = estudianteRes.data;
      } catch (error) {
        console.log("Error getting student data:", error);
        estudianteData = {
          id_alumno: id_alumno,
          nombres: nombreAlumno,
          codigo_mined: "N/A",
          grado: "N/A",
          seccion: "N/A",
        };
      }

      // Obtener datos de la escuela
      let escuelaData = null;
      try {
        const escuelaRes = await api.get(`${services.escuelas}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        escuelaData =
          escuelaRes.data && escuelaRes.data.length > 0
            ? escuelaRes.data[0]
            : null;

        // Si hay logo, agregar la URL completa
        if (escuelaData && escuelaData.logo) {
          escuelaData.logo = escuelaData.logo.startsWith("http")
            ? escuelaData.logo
            : `http://localhost:4000${escuelaData.logo}`;
        }
      } catch (error) {
        console.log("Error getting school data:", error);
      }

      if (!escuelaData) {
        escuelaData = {
          nombre: "Institución Educativa",
          direccion: "Dirección no disponible",
          telefono: "Teléfono no disponible",
          codigo_escuela: "N/A",
          logo: null,
        };
      }

      // Obtener datos del profesor
      let profesorData = null;
      try {
        const profesorRes = await api.get(`${services.profesores}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        profesorData =
          profesorRes.data && profesorRes.data.length > 0
            ? profesorRes.data[0]
            : null;
      } catch (error) {
        console.log("No se pudo obtener información del profesor");
      }

      setDatosCompletos({
        estudiante: estudianteData,
        escuela: escuelaData,
        profesor: profesorData,
        codigoMined: estudianteData?.codigo_mined || "N/A",
        fechaGeneracion: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.log("Error al obtener datos completos:", error);
      setDatosCompletos({
        estudiante: {
          id_alumno: id_alumno,
          nombres: nombreAlumno,
          codigo_mined: "N/A",
          grado: "N/A",
          seccion: "N/A",
        },
        escuela: {
          nombre: "Institución Educativa",
          direccion: "Dirección no disponible",
          telefono: "Teléfono no disponible",
          logo: null,
        },
        profesor: null,
        codigoMined: "N/A",
        fechaGeneracion: new Date().toLocaleDateString(),
      });
    }
  };

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

  const handleInputChange = (idx, campo, valor) => {
    // Validar que el valor esté entre 0 y 100
    const numValor = parseFloat(valor);
    if (valor !== "" && (isNaN(numValor) || numValor < 0 || numValor > 100)) {
      return; // No actualizar si está fuera del rango
    }

    setCalificacionesAlumno((prev) =>
      prev.map((cal, i) => (i === idx ? {...cal, [campo]: valor} : cal))
    );
  };

  const guardarTodas = async () => {
    setGuardando(true);
    try {
      setMensaje("Guardando calificaciones...");

      for (const cal of calificacionesAlumno) {
        // Validar datos antes de enviar
        const datosCalificacion = {
          bimestre_1: parseFloat(cal.bimestre_1) || 0,
          bimestre_2: parseFloat(cal.bimestre_2) || 0,
          bimestre_3: parseFloat(cal.bimestre_3) || 0,
          bimestre_4: parseFloat(cal.bimestre_4) || 0,
          comentarios: cal.comentarios || "",
        };

        console.log("Datos a enviar:", datosCalificacion);
        console.log("ID Calificación:", cal.id_calificacion);
        console.log("ID Alumno:", alumnoId);
        console.log("ID Materia:", cal.id_materia);

        try {
          if (cal.id_calificacion) {
            // Actualizar calificación existente
            console.log(`Actualizando calificación ID: ${cal.id_calificacion}`);
            const response = await api.put(
              `${services.calificaciones}/${cal.id_calificacion}`,
              datosCalificacion,
              {headers: {Authorization: `Bearer ${token}`}}
            );
            console.log("Respuesta PUT:", response.data);
          } else {
            // Crear nueva calificación
            console.log(
              `Creando nueva calificación para materia: ${cal.materia}`
            );
            const datosNuevaCalificacion = {
              id_alumno: parseInt(alumnoId),
              id_materia: parseInt(cal.id_materia),
              ...datosCalificacion,
            };

            console.log("Datos nueva calificación:", datosNuevaCalificacion);

            const response = await api.post(
              services.calificaciones,
              datosNuevaCalificacion,
              {headers: {Authorization: `Bearer ${token}`}}
            );
            console.log("Respuesta POST:", response.data);
          }
        } catch (error) {
          console.error(`Error con la materia ${cal.materia}:`, {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            config: error.config,
          });

          // Si es un error específico de una materia, continúa con las demás
          setMensaje(
            `Error en la materia ${cal.materia}: ${
              error.response?.data?.message || error.message
            }`
          );
          throw error; // Re-lanza el error para detener el proceso
        }
      }

      setMensaje("Todas las calificaciones guardadas correctamente");

      // Recargar datos después de guardar exitosamente
      setTimeout(async () => {
        await cargarCalificacionesAlumno();
        setMensaje("");
      }, 2000);
    } catch (error) {
      console.error("Error general al guardar calificaciones:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      });

      let mensajeError = "Error al guardar las calificaciones: ";

      if (error.response?.status === 500) {
        mensajeError += "Error interno del servidor. ";
        if (error.response?.data?.message) {
          mensajeError += error.response.data.message;
        } else {
          mensajeError +=
            "Verifique que todos los campos estén correctos y que la conexión con la base de datos esté funcionando.";
        }
      } else if (error.response?.status === 401) {
        mensajeError += "No tiene permisos para realizar esta acción.";
      } else if (error.response?.status === 400) {
        mensajeError += error.response?.data?.message || "Datos inválidos.";
      } else {
        mensajeError += error.message;
      }

      setMensaje(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

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

    setMensaje("Calificaciones exportadas correctamente en CSV");
  };

  const exportarPDF = async () => {
    if (!calificacionesAlumno || calificacionesAlumno.length === 0) {
      setMensaje("No hay calificaciones para exportar");
      return;
    }

    try {
      setMensaje("Generando PDF...");

      const doc = new jsPDF("p", "mm", "a4");

      doc.setFont("helvetica", "bold");
      let yPosition = 20;

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
        if (
          datosCompletos.escuela.direccion &&
          datosCompletos.escuela.direccion !== "Dirección no disponible"
        ) {
          doc.text(datosCompletos.escuela.direccion, 105, yPosition, {
            align: "center",
          });
          yPosition += 6;
        }
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("BOLETÍN DE CALIFICACIONES", 105, yPosition + 10, {
        align: "center",
      });
      yPosition += 20;

      const studentInfo = [
        ["Nombre:", nombreAlumno || "N/A"],
        ["Código MINED:", datosCompletos.codigoMined || "N/A"],
        [
          "Grado:",
          `${datosCompletos.estudiante?.grado || "N/A"} - ${
            datosCompletos.estudiante?.seccion || "N/A"
          }`,
        ],
        ["Año Académico:", new Date().getFullYear().toString()],
        ["Fecha de Emisión:", datosCompletos.fechaGeneracion],
      ];

      autoTable(doc, {
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

      const tableData = calificacionesAlumno.map((cal, index) => {
        const b1 = Number(cal.bimestre_1) || 0;
        const b2 = Number(cal.bimestre_2) || 0;
        const b3 = Number(cal.bimestre_3) || 0;
        const b4 = Number(cal.bimestre_4) || 0;
        const semestre1 = b1 > 0 && b2 > 0 ? ((b1 + b2) / 2).toFixed(1) : "-";
        const semestre2 = b3 > 0 && b4 > 0 ? ((b3 + b4) / 2).toFixed(1) : "-";
        const notaFinal =
          b1 > 0 && b2 > 0 && b3 > 0 && b4 > 0
            ? ((b1 + b2 + b3 + b4) / 4).toFixed(1)
            : "-";

        return [
          index + 1,
          cal.materia || "Materia no disponible",
          b1 > 0 ? b1.toString() : "-",
          b2 > 0 ? b2.toString() : "-",
          semestre1,
          b3 > 0 ? b3.toString() : "-",
          b4 > 0 ? b4.toString() : "-",
          semestre2,
          notaFinal,
          cal.comentarios || "-",
        ];
      });

      autoTable(doc, {
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
        didParseCell: (data) => {
          const columnIndex = data.column.index;
          const cellValue = parseFloat(data.cell.text[0]);

          if ([2, 3, 5, 6, 8].includes(columnIndex) && !isNaN(cellValue)) {
            if (cellValue < 60) {
              data.cell.styles.textColor = [220, 53, 69];
              data.cell.styles.fontStyle = "bold";
            } else if (cellValue >= 90) {
              data.cell.styles.textColor = [40, 167, 69];
              data.cell.styles.fontStyle = "bold";
            } else if (columnIndex === 8) {
              data.cell.styles.textColor = [0, 123, 255];
            }
          }
        },
        margin: {top: 10, right: 10, bottom: 10, left: 10},
        tableWidth: "auto",
      });

      const estadisticasAlumno =
        calcularEstadisticasAlumno(calificacionesAlumno);
      if (estadisticasAlumno) {
        yPosition = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RESUMEN ACADÉMICO", 20, yPosition);

        const statsData = [
          ["Total de Materias:", estadisticasAlumno.materias.toString()],
          ["Promedio General:", estadisticasAlumno.promedio],
          ["Notas Excelentes (≥90):", estadisticasAlumno.excelentes.toString()],
          ["Notas Reprobadas (<60):", estadisticasAlumno.reprobadas.toString()],
        ];

        autoTable(doc, {
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

      const pageHeight = doc.internal.pageSize.height;
      const signatureY = Math.max(
        doc.lastAutoTable.finalY + 30,
        pageHeight - 50
      );

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");

      doc.line(20, signatureY, 70, signatureY);
      doc.line(75, signatureY, 125, signatureY);
      doc.line(130, signatureY, 180, signatureY);

      doc.text("Director(a)", 45, signatureY + 8, {align: "center"});
      doc.text("Profesor(a) Guía", 100, signatureY + 8, {align: "center"});
      doc.text("Padre/Madre o Tutor", 155, signatureY + 8, {align: "center"});

      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      doc.text(
        "Este documento es generado automáticamente por el Sistema AOC de Gestión Escolar",
        105,
        pageHeight - 15,
        {align: "center"}
      );

      const fileName = `Boletin_${nombreAlumno.replace(
        /\s+/g,
        "_"
      )}_${new Date().getFullYear()}.pdf`;
      doc.save(fileName);

      setMensaje("Boletín exportado correctamente en formato PDF");
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      setMensaje("Error al exportar el boletín en PDF: " + error.message);
    }
  };

  const toggleVistaPrevia = () => {
    if (!calificacionesAlumno || calificacionesAlumno.length === 0) {
      setMensaje("No hay calificaciones para mostrar en vista previa");
      return;
    }
    setMostrarVistaImpresion(!mostrarVistaImpresion);
  };

  const imprimirCalificaciones = () => {
    setMostrarVistaImpresion(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setMostrarVistaImpresion(false);
      }, 1000);
    }, 500);
  };

  const estadisticasAlumno = calcularEstadisticasAlumno(calificacionesAlumno);

  // También vamos a agregar una función para guardar individualmente
  const guardarCalificacionIndividual = async (cal, idx) => {
    try {
      const datosCalificacion = {
        bimestre_1: parseFloat(cal.bimestre_1) || 0,
        bimestre_2: parseFloat(cal.bimestre_2) || 0,
        bimestre_3: parseFloat(cal.bimestre_3) || 0,
        bimestre_4: parseFloat(cal.bimestre_4) || 0,
        comentarios: cal.comentarios || "",
      };

      if (cal.id_calificacion) {
        await api.put(
          `${services.calificaciones}/${cal.id_calificacion}`,
          datosCalificacion,
          {headers: {Authorization: `Bearer ${token}`}}
        );
      } else {
        const response = await api.post(
          services.calificaciones,
          {
            id_alumno: parseInt(alumnoId),
            id_materia: parseInt(cal.id_materia),
            ...datosCalificacion,
          },
          {headers: {Authorization: `Bearer ${token}`}}
        );

        // Actualizar el estado con el nuevo ID
        setCalificacionesAlumno((prev) =>
          prev.map((item, index) =>
            index === idx
              ? {...item, id_calificacion: response.data.id_calificacion}
              : item
          )
        );
      }

      setMensaje(`Calificación de ${cal.materia} guardada correctamente`);
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error(`Error al guardar ${cal.materia}:`, error);
      setMensaje(
        `Error al guardar ${cal.materia}: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Vista de Impresión
  if (mostrarVistaImpresion) {
    return (
      <div className="min-h-screen bg-white p-8 print:p-4">
        {/* Header del reporte */}
        <div className="flex items-start justify-between mb-6 border-b-2 border-gray-300 pb-4">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {datosCompletos.escuela?.logo ? (
                <img
                  src={datosCompletos.escuela.logo}
                  alt="Logo"
                  className="w-20 h-20 object-contain rounded-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "";
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <BuildingLibraryIcon className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {datosCompletos.escuela?.nombre || "Institución Educativa"}
              </h1>
              {datosCompletos.escuela && (
                <>
                  <p className="text-gray-600 flex items-center mb-1 text-sm">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    {datosCompletos.escuela.direccion ||
                      "Dirección no disponible"}
                  </p>
                  {datosCompletos.escuela.telefono && (
                    <p className="text-gray-600 flex items-center mb-1 text-sm">
                      <PhoneIcon className="w-3 h-3 mr-1" />
                      {datosCompletos.escuela.telefono}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-600">
            <p className="flex items-center justify-end mb-1">
              <CalendarDaysIcon className="w-3 h-3 mr-1" />
              {datosCompletos.fechaGeneracion}
            </p>
            <p className="font-semibold text-base">BOLETÍN DE CALIFICACIONES</p>
            <p>Año Académico 2025</p>
          </div>
        </div>

        {/* Información del estudiante */}
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-300">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
            Información del Estudiante
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Nombre Completo
              </p>
              <p className="text-base font-semibold text-gray-900">
                {nombreAlumno}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Código MINED
              </p>
              <p className="text-base font-semibold text-gray-900">
                {datosCompletos.codigoMined}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">
                Grado y Sección
              </p>
              <p className="text-base font-semibold text-gray-900">
                {datosCompletos.estudiante?.grado || "N/A"} -{" "}
                {datosCompletos.estudiante?.seccion || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de calificaciones */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-green-600" />
            Registro de Calificaciones
          </h3>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300">
                    Materia
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    I Bim
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    II Bim
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    I Sem
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    III Bim
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    IV Bim
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    II Sem
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-gray-900 border-b border-gray-300">
                    Final
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-blue-700 border-b border-gray-300 bg-blue-50">
                    CUANT
                  </th>
                  <th className="px-2 py-2 text-center font-bold text-purple-700 border-b border-gray-300 bg-purple-50">
                    CUAL
                  </th>
                  <th className="px-3 py-2 text-left font-bold text-gray-900 border-b border-gray-300">
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

                  // Calcular nota cuantitativa (MINED: mínimo 40)
                  let nota_cuantitativa = nota_final;
                  if (nota_cuantitativa > 0 && nota_cuantitativa < 40) {
                    nota_cuantitativa = 40;
                  }

                  // Calcular nota cualitativa (MINED)
                  let nota_cualitativa = "-";
                  if (nota_cuantitativa >= 90) nota_cualitativa = "AA";
                  else if (nota_cuantitativa >= 76) nota_cualitativa = "AS";
                  else if (nota_cuantitativa >= 60) nota_cualitativa = "AF";
                  else if (nota_cuantitativa >= 40) nota_cualitativa = "AI";

                  // Color del badge cualitativo
                  const getBadgeColor = () => {
                    if (nota_cualitativa === "AA")
                      return "bg-green-500 text-white";
                    if (nota_cualitativa === "AS")
                      return "bg-blue-500 text-white";
                    if (nota_cualitativa === "AF")
                      return "bg-yellow-500 text-white";
                    if (nota_cualitativa === "AI")
                      return "bg-red-500 text-white";
                    return "bg-gray-300 text-gray-600";
                  };

                  return (
                    <tr
                      key={cal.id_materia}
                      className="border-b border-gray-200"
                    >
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {cal.materia}
                      </td>
                      <td
                        className={`px-2 py-2 text-center font-semibold ${
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
                        className={`px-2 py-2 text-center font-semibold ${
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
                        className={`px-2 py-2 text-center font-bold ${
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
                        className={`px-2 py-2 text-center font-semibold ${
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
                        className={`px-2 py-2 text-center font-semibold ${
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
                        className={`px-2 py-2 text-center font-bold ${
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
                        className={`px-2 py-2 text-center font-bold ${
                          nota_final < 60
                            ? "text-red-600 bg-red-50"
                            : nota_final >= 90
                            ? "text-green-600 bg-green-50"
                            : "text-blue-600 bg-blue-50"
                        }`}
                      >
                        {isNaN(nota_final) ? "-" : nota_final.toFixed(1)}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-blue-700 bg-blue-50">
                        {nota_cuantitativa > 0
                          ? nota_cuantitativa.toFixed(0)
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {nota_cuantitativa > 0 ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-bold ${getBadgeColor()}`}
                          >
                            {nota_cualitativa}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {cal.comentarios || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botones solo visibles en pantalla */}
        <div className="fixed bottom-6 right-6 space-y-3 print:hidden">
          <button
            onClick={() => setMostrarVistaImpresion(false)}
            className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium shadow-lg transition-colors"
          >
            Vista Normal
          </button>
          <button
            onClick={imprimirCalificaciones}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-colors flex items-center justify-center"
          >
            <PrinterIcon className="w-4 h-4 mr-2" />
            Imprimir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1">
              <button
                onClick={onVolver}
                className="mb-6 inline-flex items-center px-4 py-2 bg-white/10 rounded-xl text-white hover:bg-white/20 backdrop-blur-sm transition-colors duration-200"
              >
                ← Volver a la lista
              </button>

              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                Calificaciones de
                <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {nombreAlumno}
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={toggleVistaPrevia}
                  disabled={
                    !calificacionesAlumno || calificacionesAlumno.length === 0
                  }
                  className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <EyeIcon className="w-5 h-5 mr-2" />
                  Vista Previa
                </button>

                <button
                  onClick={exportarPDF}
                  disabled={
                    !calificacionesAlumno || calificacionesAlumno.length === 0
                  }
                  className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Exportar PDF
                </button>
              </div>
            </div>

            {/* Estadísticas del alumno */}
            {estadisticasAlumno && (
              <div className="flex-1 mt-8 lg:mt-0 flex justify-center">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 w-80">
                  <h3 className="text-lg font-semibold text-white mb-6">
                    Estadísticas del Estudiante
                  </h3>
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
              mensaje.includes("correctamente") || mensaje.includes("Generando")
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Loading state */}
        {calificacionesAlumno.length === 0 && !mensaje.includes("Error") && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <span className="ml-3 text-lg text-gray-300">
              Cargando calificaciones...
            </span>
          </div>
        )}

        {/* Tabla de calificaciones */}
        {calificacionesAlumno.length > 0 && (
          <>
            <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl shadow-lg overflow-hidden border border-blue-700/30">
              <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-600 border-b border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <BuildingLibraryIcon className="w-8 h-8 mr-3 text-white" />
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {datosCompletos.escuela?.nombre || "Cargando..."}
                        </h3>
                        <p className="text-green-100 text-sm">
                          Registro de Calificaciones
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-white">
                      <div>
                        <span className="text-green-100 text-xs">
                          Estudiante:
                        </span>
                        <p className="font-semibold">{nombreAlumno}</p>
                      </div>
                      <div>
                        <span className="text-green-100 text-xs">Grado:</span>
                        <p className="font-semibold">
                          {datosCompletos.estudiante?.grado || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-green-100 text-xs">Sección:</span>
                        <p className="font-semibold">
                          {datosCompletos.estudiante?.seccion || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-green-100 text-xs">Docente:</span>
                        <p className="font-semibold">
                          {datosCompletos.profesor
                            ? `${datosCompletos.profesor.nombre} ${datosCompletos.profesor.apellido}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={guardarTodas}
                    disabled={guardando}
                    className="px-6 py-3 bg-white text-green-600 rounded-lg font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
                  >
                    {guardando ? "Guardando..." : "Guardar Todas"}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Materia
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        I BIM
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        II BIM
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        III BIM
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider">
                        IV BIM
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                        Comentarios
                      </th>
                    </tr>
                    <tr className="bg-blue-50">
                      <td
                        colspan="6"
                        className="px-4 py-2 text-xs text-gray-700 italic text-center"
                      >
                        <strong>Sistema MINED:</strong> Los promedios se
                        calculan automáticamente | 90-100 (AA), 76-89 (AS),
                        60-75 (AF), 0-59 (AI)
                      </td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700 bg-gray-800">
                    {calificacionesAlumno.map((cal, idx) => {
                      const b1 = Number(cal.bimestre_1) || 0;
                      const b2 = Number(cal.bimestre_2) || 0;
                      const b3 = Number(cal.bimestre_3) || 0;
                      const b4 = Number(cal.bimestre_4) || 0;
                      const semestre_1 = b1 > 0 && b2 > 0 ? (b1 + b2) / 2 : 0;
                      const semestre_2 = b3 > 0 && b4 > 0 ? (b3 + b4) / 2 : 0;
                      const nota_final =
                        b1 > 0 && b2 > 0 && b3 > 0 && b4 > 0
                          ? (b1 + b2 + b3 + b4) / 4
                          : 0;

                      // Calcular nota cuantitativa (MINED: mínimo 40)
                      let nota_cuantitativa = nota_final;
                      if (nota_cuantitativa > 0 && nota_cuantitativa < 40) {
                        nota_cuantitativa = 40;
                      }

                      // Calcular nota cualitativa (MINED)
                      let nota_cualitativa = "-";
                      if (nota_cuantitativa >= 90) nota_cualitativa = "AA";
                      else if (nota_cuantitativa >= 76) nota_cualitativa = "AS";
                      else if (nota_cuantitativa >= 60) nota_cualitativa = "AF";
                      else if (nota_cuantitativa >= 40) nota_cualitativa = "AI";

                      // Color del badge cualitativo
                      const getBadgeColor = () => {
                        if (nota_cualitativa === "AA")
                          return "bg-green-500 text-white";
                        if (nota_cualitativa === "AS")
                          return "bg-blue-500 text-white";
                        if (nota_cualitativa === "AF")
                          return "bg-yellow-500 text-white";
                        if (nota_cualitativa === "AI")
                          return "bg-red-500 text-white";
                        return "bg-gray-600 text-gray-300";
                      };

                      return (
                        <tr
                          key={`${cal.id_materia}-${idx}`}
                          className="hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-gray-200">
                            {cal.materia}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cal.bimestre_1 || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  idx,
                                  "bimestre_1",
                                  e.target.value
                                )
                              }
                              className={`w-20 text-center border-2 rounded-lg bg-gray-700 px-2 py-1.5 font-semibold ${
                                b1 < 60 && b1 > 0
                                  ? "border-red-500 text-red-400"
                                  : b1 >= 60
                                  ? "border-green-500 text-green-400"
                                  : "border-gray-600 text-gray-200"
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cal.bimestre_2 || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  idx,
                                  "bimestre_2",
                                  e.target.value
                                )
                              }
                              className={`w-20 text-center border-2 rounded-lg bg-gray-700 px-2 py-1.5 font-semibold ${
                                b2 < 60 && b2 > 0
                                  ? "border-red-500 text-red-400"
                                  : b2 >= 60
                                  ? "border-green-500 text-green-400"
                                  : "border-gray-600 text-gray-200"
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cal.bimestre_3 || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  idx,
                                  "bimestre_3",
                                  e.target.value
                                )
                              }
                              className={`w-20 text-center border-2 rounded-lg bg-gray-700 px-2 py-1.5 font-semibold ${
                                b3 < 60 && b3 > 0
                                  ? "border-red-500 text-red-400"
                                  : b3 >= 60
                                  ? "border-green-500 text-green-400"
                                  : "border-gray-600 text-gray-200"
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 py-3 text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={cal.bimestre_4 || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  idx,
                                  "bimestre_4",
                                  e.target.value
                                )
                              }
                              className={`w-20 text-center border-2 rounded-lg bg-gray-700 px-2 py-1.5 font-semibold ${
                                b4 < 60 && b4 > 0
                                  ? "border-red-500 text-red-400"
                                  : b4 >= 60
                                  ? "border-green-500 text-green-400"
                                  : "border-gray-600 text-gray-200"
                              }`}
                              placeholder="0"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              value={cal.comentarios || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  idx,
                                  "comentarios",
                                  e.target.value
                                )
                              }
                              className="w-full border-2 border-gray-600 rounded-lg bg-gray-700 text-gray-200 px-3 py-1.5 text-sm"
                              placeholder="Comentarios..."
                              rows="2"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TablaCalificacionesAlumno;
