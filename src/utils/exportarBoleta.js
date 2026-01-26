import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const cleanName = (name) => name?.replace(/Evaluativo/i, '').trim() || name;

const getCualitativa = (valor) => {
  if (valor === "" || valor === null || valor === undefined) return "-";
  const v = Number(valor);
  if (isNaN(v)) return "-";
  if (v >= 90) return "AA";
  if (v >= 76) return "AS";
  if (v >= 60) return "AF";
  return "AI";
};

export const generarBoletaPDF = (alumnoInfo, materias, evaluaciones, nombreAlumno) => {
  const doc = new jsPDF("l", "mm", "a4");

  // --- AGRUPACIÓN DINÁMICA ---
  const grupos = {};
  const ordenGrupos = [];

  evaluaciones.forEach(ev => {
    const g = ev.agrupador || "General";
    if (!grupos[g]) {
      grupos[g] = [];
      ordenGrupos.push(g);
    }
    grupos[g].push(ev);
  });

  const columnasAgrupadas = ordenGrupos.map(g => ({
    titulo: g,
    cortes: grupos[g]
  }));

  // --- HEADER ---
  const pageWidth = doc.internal.pageSize.width;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(alumnoInfo?.escuela_nombre?.toUpperCase() || "ESCUELA", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("BOLETA DE CALIFICACIONES OFICIAL", pageWidth / 2, 22, { align: "center" });
  doc.text(`CICLO ${alumnoInfo?.anio_lectivo || ""}`, pageWidth / 2, 27, { align: "center" });

  // Info Alumno
  doc.setFillColor(250, 250, 250);
  doc.rect(14, 32, pageWidth - 28, 15, 'F');
  doc.setFontSize(10);
  doc.text(`Estudiante: ${nombreAlumno}`, 18, 38);
  doc.text(`Grado: ${alumnoInfo?.grado_nombre || ""} - ${alumnoInfo?.seccion_nombre || ""}`, 18, 44);
  doc.text(`Código: ${alumnoInfo?.codigo_mined || "-"}`, 160, 38);

  // --- TABLA DINÁMICA ---

  // 1. Header Superior (Grupos)
  const header1 = [
    { content: 'ASIGNATURAS', rowSpan: 3, styles: { valign: 'middle', halign: 'left', fillColor: [240, 240, 240] } },
    ...columnasAgrupadas.map(g => ({
      content: g.titulo.toUpperCase(),
      colSpan: g.cortes.length * 2,
      styles: { halign: 'center', fontStyle: 'bold', fillColor: [230, 230, 230] }
    })),
    { content: 'FINAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [220, 220, 220] } }
  ];

  // 2. Header Medio (Cortes)
  const header2 = [
    ...columnasAgrupadas.flatMap(g =>
      g.cortes.map(ev => ({
        content: cleanName(ev.nombre_corto),
        colSpan: 2,
        styles: { halign: 'center', fontSize: 8 }
      }))
    ),
    { content: 'ANUAL', colSpan: 2, styles: { halign: 'center', fontSize: 8 } }
  ];

  // 3. Header Inferior (Cuant/Cual)
  const header3 = [
    ...columnasAgrupadas.flatMap(g => g.cortes.flatMap(() => ['CUANT', 'CUAL'])),
    'CUANT', 'CUAL'
  ];

  const body = materias.map(mat => {
    const row = [mat.materia];
    let notasParaPromedio = [];

    // Iterar en el mismo orden que los grupos
    columnasAgrupadas.forEach(g => {
      g.cortes.forEach(ev => {
        const notaObj = mat.notas?.find(n => Number(n.id_evaluacion) === Number(ev.id_evaluacion));
        const val = notaObj?.valor_numerico;

        if (val !== undefined && val !== null) {
          notasParaPromedio.push(Number(val));
          row.push(String(val));
          row.push(getCualitativa(val));
        } else {
          row.push("-");
          row.push("-");
        }
      });
    });

    // Final
    if (notasParaPromedio.length > 0) {
      const sum = notasParaPromedio.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / notasParaPromedio.length);
      row.push(String(avg));
      row.push(getCualitativa(avg));
    } else {
      row.push("-");
      row.push("-");
    }
    return row;
  });

  autoTable(doc, {
    startY: 52,
    head: [header1, header2, header3],
    body: body,
    theme: 'grid',
    styles: { fontSize: 9, lineColor: [0, 0, 0], lineWidth: 0.1, textColor: [0, 0, 0] },
    headStyles: { textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0] },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index > 0) {
        const txt = data.cell.text[0];
        if (txt === 'AI' || (!isNaN(txt) && Number(txt) < 60)) {
          data.cell.styles.textColor = [200, 0, 0];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // Firmas
  const finalY = doc.lastAutoTable.finalY + 25;
  doc.setLineWidth(0.3);
  doc.line(40, finalY, 100, finalY);
  doc.line(180, finalY, 240, finalY);
  doc.text("Docente", 70, finalY + 5, { align: "center" });
  doc.text("Tutor", 210, finalY + 5, { align: "center" });

  doc.save(`Boleta_${nombreAlumno.replace(/\s+/g, '_')}.pdf`);
};