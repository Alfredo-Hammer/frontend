import React, {useEffect, useMemo, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function TablaCalificacionesAlumno({alumnoId, nombreAlumno, onVolver, token}) {
  const [calificacionesAlumno, setCalificacionesAlumno] = useState([]);
  const [incrementos, setIncrementos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [cargandoInfo, setCargandoInfo] = useState(false);

  const makeIncrementosRow = () => ({
    bimestre_1: {valor: "", aplicado: 0},
    bimestre_2: {valor: "", aplicado: 0},
    bimestre_3: {valor: "", aplicado: 0},
    bimestre_4: {valor: "", aplicado: 0},
  });

  useEffect(() => {
    if (!alumnoId) return;
    cargarInfoAlumno();
    cargarCalificacionesAlumno();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoId]);

  const cargarInfoAlumno = async () => {
    try {
      setCargandoInfo(true);
      const res = await api.get(
        `${services.calificacionesAlumnoInfo}/${alumnoId}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      setAlumnoInfo(res.data || null);
    } catch (error) {
      console.error("Error al cargar info del alumno:", error);
      setAlumnoInfo(null);
    } finally {
      setCargandoInfo(false);
    }
  };

  const cargarCalificacionesAlumno = async () => {
    try {
      setMensaje("");
      setCalificacionesAlumno([]);
      setIncrementos([]);

      const res = await api.get(
        `${services.calificacionesMateriasAlumno}/${alumnoId}`,
        {headers: {Authorization: `Bearer ${token}`}}
      );

      if (Array.isArray(res.data) && res.data.length > 0) {
        setCalificacionesAlumno(res.data);
        // "Agregar" debe reflejar lo que ya está acumulado para que el docente pueda continuar sumando.
        setIncrementos(
          res.data.map((cal) => ({
            bimestre_1: {
              valor:
                Number(cal?.bimestre_1) > 0
                  ? String(Number(cal.bimestre_1))
                  : "",
              aplicado: Number(cal?.bimestre_1) || 0,
            },
            bimestre_2: {
              valor:
                Number(cal?.bimestre_2) > 0
                  ? String(Number(cal.bimestre_2))
                  : "",
              aplicado: Number(cal?.bimestre_2) || 0,
            },
            bimestre_3: {
              valor:
                Number(cal?.bimestre_3) > 0
                  ? String(Number(cal.bimestre_3))
                  : "",
              aplicado: Number(cal?.bimestre_3) || 0,
            },
            bimestre_4: {
              valor:
                Number(cal?.bimestre_4) > 0
                  ? String(Number(cal.bimestre_4))
                  : "",
              aplicado: Number(cal?.bimestre_4) || 0,
            },
          }))
        );
        return;
      }

      // Si no hay calificaciones, crear estructura vacía desde materias
      const materiasRes = await api.get(services.materias, {
        headers: {Authorization: `Bearer ${token}`},
      });

      if (Array.isArray(materiasRes.data) && materiasRes.data.length > 0) {
        const emptyGrades = materiasRes.data.map((materia) => ({
          id_materia: materia.id_materia,
          materia: materia.nombre,
          bimestre_1: 0,
          bimestre_2: 0,
          bimestre_3: 0,
          bimestre_4: 0,
          comentarios: "",
          id_calificacion: null,
        }));

        setCalificacionesAlumno(emptyGrades);
        setIncrementos(emptyGrades.map(() => makeIncrementosRow()));
        setMensaje(
          "No hay calificaciones registradas. Se crearon campos vacíos para todas las materias."
        );
      } else {
        setMensaje("No se encontraron materias disponibles.");
      }
    } catch (error) {
      console.error("Error al cargar calificaciones:", error);
      setMensaje(
        `Error al cargar calificaciones: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleIncrementoChange = (idx, campo, valor) => {
    const numValor = parseFloat(valor);

    // Permitir limpiar el input
    if (valor === "") {
      setIncrementos((prev) =>
        prev.map((inc, i) =>
          i === idx
            ? {
                ...inc,
                [campo]: {
                  ...inc?.[campo],
                  valor: "",
                },
              }
            : inc
        )
      );
      return;
    }

    // Validación de rango 0-100 para el incremento
    if (Number.isNaN(numValor) || numValor < 0 || numValor > 100) return;

    const aplicado = Number(incrementos?.[idx]?.[campo]?.aplicado) || 0;
    if (numValor < aplicado) {
      setMensaje(
        `No puedes reducir el valor agregado (actual ${aplicado}). Si necesitas corregir, ajusta el acumulado desde administración.`
      );
      return;
    }

    const delta = numValor - aplicado;

    const actual = Number(calificacionesAlumno?.[idx]?.[campo]) || 0;
    const nuevoTotal = actual + delta;
    if (nuevoTotal > 100) {
      setMensaje(
        `No se puede agregar ${delta} pts: el acumulado de ${campo.replace(
          "bimestre_",
          "Bimestre "
        )} sería ${nuevoTotal} y excede 100.`
      );
      return;
    }

    setIncrementos((prev) =>
      prev.map((inc, i) =>
        i === idx
          ? {
              ...inc,
              [campo]: {
                ...inc?.[campo],
                valor: numValor,
              },
            }
          : inc
      )
    );
  };

  const handleComentarioChange = (idx, valor) => {
    setCalificacionesAlumno((prev) =>
      prev.map((cal, i) => (i === idx ? {...cal, comentarios: valor} : cal))
    );
  };

  const calcularFinalMateria = (cal) => {
    const b1 = Number(cal.bimestre_1) || 0;
    const b2 = Number(cal.bimestre_2) || 0;
    const b3 = Number(cal.bimestre_3) || 0;
    const b4 = Number(cal.bimestre_4) || 0;

    // Promedio “en tiempo real” como venía: promedio de los 4 bimestres
    // (si no hay notas, será 0)
    return (b1 + b2 + b3 + b4) / 4;
  };

  const stats = useMemo(() => {
    if (!calificacionesAlumno || calificacionesAlumno.length === 0) return null;

    let totalFinales = 0;
    let count = 0;

    calificacionesAlumno.forEach((cal) => {
      const final = calcularFinalMateria(cal);
      if (final > 0) {
        totalFinales += final;
        count++;
      }
    });

    const promedioGeneral = count > 0 ? totalFinales / count : 0;

    return {
      materias: calificacionesAlumno.length,
      promedioGeneral,
    };
  }, [calificacionesAlumno]);

  const guardarCalificacionIndividual = async (cal, idx) => {
    const inc = incrementos?.[idx] || {};

    const getDelta = (campo) => {
      const v = inc?.[campo]?.valor;
      if (v === "" || v === null || v === undefined) return 0;
      const valorNum = Number(v);
      const aplicado = Number(inc?.[campo]?.aplicado) || 0;
      if (!Number.isFinite(valorNum)) return 0;
      const delta = valorNum - aplicado;
      return delta > 0 ? delta : 0;
    };

    const datosCalificacion = {
      acumulativo: true,
      bimestre_1: getDelta("bimestre_1"),
      bimestre_2: getDelta("bimestre_2"),
      bimestre_3: getDelta("bimestre_3"),
      bimestre_4: getDelta("bimestre_4"),
      comentarios: cal.comentarios || "",
    };

    const hayDelta =
      (datosCalificacion.bimestre_1 || 0) > 0 ||
      (datosCalificacion.bimestre_2 || 0) > 0 ||
      (datosCalificacion.bimestre_3 || 0) > 0 ||
      (datosCalificacion.bimestre_4 || 0) > 0;

    // Si aún no existe registro y no hay nada que sumar, no hacemos request.
    if (
      !cal.id_calificacion &&
      !hayDelta &&
      !String(datosCalificacion.comentarios || "").trim()
    ) {
      return;
    }

    const actualB1 = Number(cal.bimestre_1) || 0;
    const actualB2 = Number(cal.bimestre_2) || 0;
    const actualB3 = Number(cal.bimestre_3) || 0;
    const actualB4 = Number(cal.bimestre_4) || 0;
    const nuevoB1 = actualB1 + (datosCalificacion.bimestre_1 || 0);
    const nuevoB2 = actualB2 + (datosCalificacion.bimestre_2 || 0);
    const nuevoB3 = actualB3 + (datosCalificacion.bimestre_3 || 0);
    const nuevoB4 = actualB4 + (datosCalificacion.bimestre_4 || 0);

    if ([nuevoB1, nuevoB2, nuevoB3, nuevoB4].some((n) => n > 100)) {
      setMensaje(
        `Error: el acumulado no puede exceder 100 pts por bimestre (Materia: "${cal.materia}").`
      );
      return;
    }

    try {
      if (cal.id_calificacion) {
        const response = await api.put(
          `${services.calificaciones}/${cal.id_calificacion}`,
          datosCalificacion,
          {headers: {Authorization: `Bearer ${token}`}}
        );

        if (response?.data?.calificacion) {
          setCalificacionesAlumno((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    ...response.data.calificacion,
                    id_calificacion:
                      response.data.calificacion.id_calificacion ??
                      item.id_calificacion,
                  }
                : item
            )
          );
        }
      } else {
        const response = await api.post(
          services.calificaciones,
          {
            id_alumno: parseInt(alumnoId, 10),
            id_materia: parseInt(cal.id_materia, 10),
            ...datosCalificacion,
          },
          {headers: {Authorization: `Bearer ${token}`}}
        );

        // Guardar id_calificacion recién creado para futuros PUT
        if (response?.data?.id_calificacion) {
          setCalificacionesAlumno((prev) =>
            prev.map((item, i) =>
              i === idx
                ? {
                    ...item,
                    ...(response.data.calificacion || {}),
                    id_calificacion: response.data.id_calificacion,
                  }
                : item
            )
          );
        }
      }

      // Mantener el valor en "Agregar" y marcarlo como aplicado (para que la próxima vez solo se envíe el delta).
      setIncrementos((prev) =>
        prev.map((item, i) => {
          if (i !== idx) return item;
          const next = {...item};
          ["bimestre_1", "bimestre_2", "bimestre_3", "bimestre_4"].forEach(
            (campo) => {
              const valor = next?.[campo]?.valor;
              if (valor === "" || valor === null || valor === undefined) return;
              const valorNum = Number(valor);
              if (!Number.isFinite(valorNum)) return;
              next[campo] = {
                ...next[campo],
                aplicado: valorNum,
              };
            }
          );
          return next;
        })
      );

      setMensaje(
        `Calificación de "${cal.materia}" guardada correctamente (acumulativo).`
      );
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error(`Error al guardar ${cal.materia}:`, error);
      setMensaje(
        `Error al guardar "${cal.materia}": ${
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message
        }`
      );
    }
  };

  const guardarTodas = async () => {
    setGuardando(true);
    setMensaje("Guardando calificaciones...");

    try {
      for (let idx = 0; idx < calificacionesAlumno.length; idx++) {
        const cal = calificacionesAlumno[idx];
        // Reutiliza la misma lógica PUT/POST
        // eslint-disable-next-line no-await-in-loop
        await guardarCalificacionIndividual(cal, idx);
      }

      setMensaje("Todas las calificaciones guardadas correctamente.");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("Error general al guardar calificaciones:", error);
      setMensaje(
        `Error al guardar las calificaciones: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setGuardando(false);
    }
  };

  const buildExportRows = () => {
    return (calificacionesAlumno || []).map((cal) => {
      const b1 = Number(cal?.bimestre_1) || 0;
      const b2 = Number(cal?.bimestre_2) || 0;
      const b3 = Number(cal?.bimestre_3) || 0;
      const b4 = Number(cal?.bimestre_4) || 0;
      const final = calcularFinalMateria(cal);
      return {
        materia: cal?.materia || "",
        b1,
        b2,
        b3,
        b4,
        final,
        comentarios: cal?.comentarios || "",
      };
    });
  };

  const exportarPDF = () => {
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const titulo = `Calificaciones - ${nombreAlumno || "Estudiante"}`;
      doc.setFontSize(14);
      doc.text(titulo, 14, 14);

      const info = [
        alumnoInfo?.escuela_nombre
          ? `Escuela: ${alumnoInfo.escuela_nombre}`
          : null,
        alumnoInfo?.grado_nombre ? `Grado: ${alumnoInfo.grado_nombre}` : null,
        alumnoInfo?.seccion_nombre
          ? `Sección: ${alumnoInfo.seccion_nombre}`
          : null,
        alumnoInfo?.anio_lectivo
          ? `Año lectivo: ${alumnoInfo.anio_lectivo}`
          : null,
      ].filter(Boolean);

      if (info.length) {
        doc.setFontSize(10);
        doc.text(info.join("   |   "), 14, 20);
      }

      const rows = buildExportRows();
      autoTable(doc, {
        startY: 26,
        head: [["Materia", "I", "II", "III", "IV", "Final", "Observaciones"]],
        body: rows.map((r) => [
          r.materia,
          r.b1,
          r.b2,
          r.b3,
          r.b4,
          Number(r.final || 0).toFixed(1),
          r.comentarios,
        ]),
        styles: {fontSize: 9},
        headStyles: {fillColor: [17, 24, 39]},
      });

      const safeName = String(nombreAlumno || "alumno")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-]/g, "");
      doc.save(`calificaciones_${safeName}.pdf`);
    } catch (e) {
      console.error("Error exportando PDF:", e);
      setMensaje("Error al exportar PDF");
    }
  };

  const exportarExcel = () => {
    try {
      const rows = buildExportRows();
      const headers = [
        "Materia",
        "I",
        "II",
        "III",
        "IV",
        "Final",
        "Observaciones",
      ];
      const csv = [
        headers.join(","),
        ...rows.map((r) =>
          [
            r.materia,
            r.b1,
            r.b2,
            r.b3,
            r.b4,
            Number(r.final || 0).toFixed(1),
            r.comentarios,
          ]
            .map((field) => `"${String(field ?? "").replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\uFEFF", csv], {type: "text/csv;charset=utf-8;"});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const safeName = String(nombreAlumno || "alumno")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-]/g, "");
      link.download = `calificaciones_${safeName}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exportando Excel (CSV):", e);
      setMensaje("Error al exportar Excel");
    }
  };

  return (
    <div className="min-h-screen bg-gray-800 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onVolver}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 hover:bg-gray-600 transition-colors"
            >
              ← Volver
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={exportarPDF}
                disabled={calificacionesAlumno.length === 0}
                className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
                </svg>
                Exportar PDF
              </button>
              <button
                onClick={exportarExcel}
                disabled={calificacionesAlumno.length === 0}
                className="inline-flex items-center gap-2 justify-center px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L13 1.586A2 2 0 0011.586 1H9zm2 2H9v8h6V6h-2a2 2 0 01-2-2V4z" />
                </svg>
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-400">Estudiante</p>
                <h1 className="text-2xl font-bold text-white">
                  {nombreAlumno}
                </h1>
                <p className="text-xs text-gray-400 mt-1">
                  ID Alumno: <span className="font-mono">{alumnoId}</span>
                </p>

                <div className="mt-3 space-y-1 text-xs text-gray-300">
                  <p>
                    <span className="text-gray-400">Código MINED:</span>{" "}
                    <span className="font-semibold">
                      {cargandoInfo
                        ? "Cargando..."
                        : alumnoInfo?.codigo_mined || "No asignado"}
                    </span>
                  </p>

                  <div className="flex items-center gap-2">
                    {alumnoInfo?.escuela_logo && (
                      <img
                        src={`${api.defaults.baseURL}${alumnoInfo.escuela_logo}`}
                        alt={alumnoInfo?.escuela_nombre || "Logo escuela"}
                        className="h-8 w-8 rounded bg-gray-900 border border-gray-700 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    )}
                    <p>
                      <span className="text-gray-400">Escuela:</span>{" "}
                      <span className="font-semibold">
                        {cargandoInfo
                          ? "Cargando..."
                          : alumnoInfo?.escuela_nombre || "-"}
                      </span>
                    </p>
                  </div>

                  <p>
                    <span className="text-gray-400">Año lectivo:</span>{" "}
                    <span className="font-semibold">
                      {cargandoInfo
                        ? "Cargando..."
                        : alumnoInfo?.anio_lectivo || "-"}
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">Profesor guía:</span>{" "}
                    <span className="font-semibold">
                      {cargandoInfo
                        ? "Cargando..."
                        : alumnoInfo?.profesor_guia || "No asignado"}
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">Grado:</span>{" "}
                    <span className="font-semibold">
                      {cargandoInfo
                        ? "Cargando..."
                        : alumnoInfo?.grado_nombre || "-"}
                    </span>
                  </p>

                  <p>
                    <span className="text-gray-400">Sección:</span>{" "}
                    <span className="font-semibold">
                      {cargandoInfo
                        ? "Cargando..."
                        : alumnoInfo?.seccion_nombre || "-"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 min-w-[180px]">
                  <p className="text-xs text-gray-400">Materias</p>
                  <p className="text-xl font-bold text-white">
                    {stats?.materias ?? 0}
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 min-w-[180px]">
                  <p className="text-xs text-gray-400">Promedio General</p>
                  <p
                    className={`text-xl font-bold ${
                      (stats?.promedioGeneral ?? 0) >= 60
                        ? "text-emerald-400"
                        : (stats?.promedioGeneral ?? 0) > 0
                        ? "text-red-400"
                        : "text-gray-300"
                    }`}
                  >
                    {(stats?.promedioGeneral ?? 0) > 0
                      ? stats.promedioGeneral.toFixed(1)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>

            {mensaje && (
              <div
                className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                  mensaje.toLowerCase().includes("error")
                    ? "bg-red-500/10 border-red-500/20 text-red-300"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                }`}
              >
                {mensaje}
              </div>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Registro de Calificaciones
            </h2>
            <p className="text-xs text-gray-400">
              Semáforo: Final ≥ 60{" "}
              <span className="text-emerald-400 font-semibold">Aprobado</span> /{" "}
              Final &lt; 60{" "}
              <span className="text-red-400 font-semibold">Reprobado</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/50 text-gray-400">
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-3 text-left font-semibold" rowSpan={2}>
                    Materia
                  </th>
                  <th
                    className="px-2 py-2 text-center font-semibold bg-blue-900/20 border-x border-blue-700/30"
                    colSpan={3}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-blue-300">I Semestre</span>
                    </div>
                  </th>
                  <th
                    className="px-2 py-2 text-center font-semibold bg-purple-900/20 border-x border-purple-700/30"
                    colSpan={3}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-purple-300">II Semestre</span>
                    </div>
                  </th>
                </tr>
                <tr className="border-b border-gray-700">
                  {/* Semestre 1 */}
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-900/10 border-r border-blue-700/20">
                    IB
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-900/10 border-r border-blue-700/20">
                    IIB
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-blue-900/20 border-r border-blue-700/30">
                    <div className="flex flex-col">
                      <span>Prom</span>
                      <span className="text-[10px] text-blue-400">S1</span>
                    </div>
                  </th>
                  {/* Semestre 2 */}
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-900/10 border-r border-purple-700/20">
                    IIIB
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-900/10 border-r border-purple-700/20">
                    IVB
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-semibold bg-purple-900/20 border-r border-purple-700/30">
                    <div className="flex flex-col">
                      <span>Prom</span>
                      <span className="text-[10px] text-purple-400">S2</span>
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {calificacionesAlumno.map((cal, idx) => {
                  const b1 = Number(cal.bimestre_1) || 0;
                  const b2 = Number(cal.bimestre_2) || 0;
                  const b3 = Number(cal.bimestre_3) || 0;
                  const b4 = Number(cal.bimestre_4) || 0;

                  // Calcular promedios por semestre en el frontend
                  const promedioS1 = (b1 + b2) / 2;
                  const promedioS2 = (b3 + b4) / 2;

                  // Clases de color para promedios
                  const getPromedioClass = (prom) => {
                    if (prom === 0) return "text-gray-400";
                    return prom >= 60 ? "text-emerald-400" : "text-red-400";
                  };

                  const inputBase =
                    "w-20 text-center px-2 py-1.5 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 text-sm";

                  const fmt = (n) => {
                    const v = Number(n) || 0;
                    return v > 0 ? v.toFixed(1) : "0";
                  };

                  return (
                    <tr
                      key={`${cal.id_materia}-${idx}`}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">
                        <div className="flex flex-col">
                          <span className="truncate">{cal.materia}</span>
                          <span className="text-xs text-gray-500 font-mono">
                            {cal.id_calificacion
                              ? `#${cal.id_calificacion}`
                              : "nuevo"}
                          </span>
                        </div>
                      </td>

                      {/* SEMESTRE 1 - Fondo azul tenue */}
                      <td className="px-3 py-3 text-center bg-blue-900/5 border-r border-blue-700/10">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-xs text-blue-300 font-semibold">
                            Acum: {fmt(cal.bimestre_1)}
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={incrementos?.[idx]?.bimestre_1?.valor ?? ""}
                            onChange={(e) =>
                              handleIncrementoChange(
                                idx,
                                "bimestre_1",
                                e.target.value
                              )
                            }
                            className={`${inputBase} focus:ring-blue-500 border-blue-600/30`}
                            placeholder="+"
                          />
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center bg-blue-900/5 border-r border-blue-700/10">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-xs text-blue-300 font-semibold">
                            Acum: {fmt(cal.bimestre_2)}
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={incrementos?.[idx]?.bimestre_2?.valor ?? ""}
                            onChange={(e) =>
                              handleIncrementoChange(
                                idx,
                                "bimestre_2",
                                e.target.value
                              )
                            }
                            className={`${inputBase} focus:ring-blue-500 border-blue-600/30`}
                            placeholder="+"
                          />
                        </div>
                      </td>

                      <td
                        className={`px-3 py-3 text-center bg-blue-900/10 border-r border-blue-700/30 ${getPromedioClass(
                          promedioS1
                        )}`}
                      >
                        <div className="text-lg font-bold">
                          {promedioS1 > 0 ? promedioS1.toFixed(1) : "-"}
                        </div>
                        <div className="text-[10px] text-blue-400 mt-0.5">
                          Semestre 1
                        </div>
                      </td>

                      {/* SEMESTRE 2 - Fondo morado tenue */}
                      <td className="px-3 py-3 text-center bg-purple-900/5 border-r border-purple-700/10">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-xs text-purple-300 font-semibold">
                            Acum: {fmt(cal.bimestre_3)}
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={incrementos?.[idx]?.bimestre_3?.valor ?? ""}
                            onChange={(e) =>
                              handleIncrementoChange(
                                idx,
                                "bimestre_3",
                                e.target.value
                              )
                            }
                            className={`${inputBase} focus:ring-purple-500 border-purple-600/30`}
                            placeholder="+"
                          />
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center bg-purple-900/5 border-r border-purple-700/10">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="text-xs text-purple-300 font-semibold">
                            Acum: {fmt(cal.bimestre_4)}
                          </div>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={incrementos?.[idx]?.bimestre_4?.valor ?? ""}
                            onChange={(e) =>
                              handleIncrementoChange(
                                idx,
                                "bimestre_4",
                                e.target.value
                              )
                            }
                            className={`${inputBase} focus:ring-purple-500 border-purple-600/30`}
                            placeholder="+"
                          />
                        </div>
                      </td>

                      <td
                        className={`px-3 py-3 text-center bg-purple-900/10 border-r border-purple-700/30 ${getPromedioClass(
                          promedioS2
                        )}`}
                      >
                        <div className="text-lg font-bold">
                          {promedioS2 > 0 ? promedioS2.toFixed(1) : "-"}
                        </div>
                        <div className="text-[10px] text-purple-400 mt-0.5">
                          Semestre 2
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {calificacionesAlumno.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-gray-400"
                      colSpan={7}
                    >
                      No hay calificaciones para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Observaciones Generales */}
          <div className="px-6 py-4 border-t border-gray-700">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Observaciones Generales
            </label>
            <textarea
              value={calificacionesAlumno[0]?.comentarios || ""}
              onChange={(e) => {
                setCalificacionesAlumno((prev) =>
                  prev.map((cal) => ({...cal, comentarios: e.target.value}))
                );
              }}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="Ingrese observaciones generales para todas las materias..."
            />
          </div>

          {/* Botones de acción */}
          <div className="px-6 py-4 border-t border-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-xs text-gray-400">
              💡 <strong>Modo acumulativo:</strong> El acumulado se muestra
              arriba. En "Agregar" puedes continuar sumando hasta 100 por
              bimestre.
            </div>

            <div className="flex gap-3">
              <button
                onClick={onVolver}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 border border-gray-600 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={guardarTodas}
                disabled={guardando || calificacionesAlumno.length === 0}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {guardando ? "Guardando..." : "💾 Guardar Calificaciones"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TablaCalificacionesAlumno;
