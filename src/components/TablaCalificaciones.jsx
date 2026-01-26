import React, {useEffect, useMemo, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {
  ArrowLeftIcon,
  PrinterIcon,
  AcademicCapIcon,
  UserCircleIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";
import {generarBoletaPDF} from "../utils/exportarBoleta";

function TablaCalificaciones({alumnoId, nombreAlumno, onVolver, token}) {
  const [alumnoInfo, setAlumnoInfo] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  const cellKey = (idMateria, idEval) => `${idMateria}-${idEval}`;

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const init = async () => {
      if (!alumnoId) return;
      setLoading(true);
      try {
        const resInfo = await api.get(
          `${services.calificacionesAlumnoInfo}/${alumnoId}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
        setAlumnoInfo(resInfo.data || {});

        if (resInfo.data?.id_ciclo) {
          const resEval = await api.get(
            services.evaluacionesPorCiclo(resInfo.data.id_ciclo),
            {
              headers: {Authorization: `Bearer ${token}`},
            }
          );
          // Ordenar siempre por el campo 'orden'
          const evals = Array.isArray(resEval.data) ? resEval.data : [];
          setEvaluaciones(evals.sort((a, b) => a.orden - b.orden));

          const resNotas = await api.get(services.notasAlumno(alumnoId), {
            headers: {Authorization: `Bearer ${token}`},
            params: {id_ciclo: resInfo.data.id_ciclo},
          });
          setMaterias(Array.isArray(resNotas.data) ? resNotas.data : []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [alumnoId, token]);

  // --- LÓGICA DE AGRUPACIÓN DINÁMICA (UNIVERSAL) ---
  // Esto detecta automáticamente si son Semestres, Trimestres o Cortes únicos
  const columnasAgrupadas = useMemo(() => {
    const grupos = {};
    const ordenGrupos = [];

    evaluaciones.forEach((ev) => {
      // Si no tiene agrupador, usamos "General"
      const nombreGrupo = ev.agrupador || "General";

      if (!grupos[nombreGrupo]) {
        grupos[nombreGrupo] = [];
        ordenGrupos.push(nombreGrupo);
      }
      grupos[nombreGrupo].push(ev);
    });

    // Retorna array de objetos: [{ titulo: "I SEMESTRE", cortes: [...] }, ...]
    return ordenGrupos.map((g) => ({
      titulo: g,
      cortes: grupos[g],
    }));
  }, [evaluaciones]);

  const notasMap = useMemo(() => {
    const map = new Map();
    materias.forEach((m) => map.set(Number(m.id_materia), m.notas || []));
    return map;
  }, [materias]);

  const findNotaValor = (idMateria, idEval) => {
    const listaNotas = notasMap.get(Number(idMateria)) || [];
    const nota = listaNotas.find(
      (n) => Number(n.id_evaluacion) === Number(idEval)
    );
    return nota?.valor_numerico;
  };

  const getDisplayValue = (idMateria, idEval) => {
    const key = cellKey(idMateria, idEval);
    if (drafts.hasOwnProperty(key)) return drafts[key];
    const val = findNotaValor(idMateria, idEval);
    return val !== null && val !== undefined ? String(val) : "";
  };

  const getCualitativa = (valor) => {
    if (!valor && valor !== 0) return "-";
    const v = Number(valor);
    if (isNaN(v)) return "-";
    if (v >= 90) return "AA";
    if (v >= 76) return "AS";
    if (v >= 60) return "AF";
    return "AI";
  };

  const getColorLetra = (letra) => {
    switch (letra) {
      case "AA":
        return "text-emerald-400 font-extrabold";
      case "AS":
        return "text-blue-400 font-bold";
      case "AF":
        return "text-yellow-400 font-bold";
      case "AI":
        return "text-red-500 font-bold";
      default:
        return "text-gray-500";
    }
  };

  // Limpiar nombre (Quitar "Evaluativo")
  const cleanName = (name) => name?.replace(/Evaluativo/i, "").trim() || name;

  const calcularNotaFinal = (idMateria) => {
    const listaNotas = notasMap.get(Number(idMateria)) || [];
    const notasValidas = listaNotas
      .filter((n) => n.valor_numerico !== null)
      .map((n) => Number(n.valor_numerico));
    if (notasValidas.length === 0) return null;
    return Math.round(
      notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
    );
  };

  // --- GUARDADO ---
  const handleGuardar = async (idMateria, idEval, valor) => {
    const key = cellKey(idMateria, idEval);
    let numVal = null;
    if (String(valor).trim() !== "") {
      numVal = Number(valor);
      if (isNaN(numVal) || numVal < 0 || numVal > 100) return;
    }

    try {
      setSavingKey(key);
      await api.post(
        services.notasGuardar,
        {
          id_estudiante: Number(alumnoId),
          id_materia: Number(idMateria),
          id_evaluacion: Number(idEval),
          valor_nota: numVal,
        },
        {headers: {Authorization: `Bearer ${token}`}}
      );

      const res = await api.get(services.notasAlumno(alumnoId), {
        headers: {Authorization: `Bearer ${token}`},
        params: {id_ciclo: alumnoInfo?.id_ciclo},
      });
      if (res.data) setMaterias(res.data);

      setDrafts((prev) => {
        const next = {...prev};
        delete next[key];
        return next;
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSavingKey(null);
    }
  };

  const handleBlur = (idMateria, idEval) => {
    const val = getDisplayValue(idMateria, idEval);
    const original = findNotaValor(idMateria, idEval);
    const originalStr =
      original !== null && original !== undefined ? String(original) : "";
    if (val !== originalStr) handleGuardar(idMateria, idEval, val);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") e.target.blur();
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">
        Cargando expediente...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="max-w-[1400px] mx-auto mb-6 flex justify-between items-center">
        <button
          onClick={onVolver}
          className="flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Volver
        </button>
        <button
          onClick={() =>
            generarBoletaPDF(alumnoInfo, materias, evaluaciones, nombreAlumno)
          }
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all"
        >
          <PrinterIcon className="w-5 h-5" />
          Imprimir Boleta
        </button>
      </div>

      {/* INFO ALUMNO */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl p-6 mb-8 max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-900/50 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <BuildingLibraryIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {alumnoInfo?.escuela_nombre}
            </h2>
            <p className="text-sm text-gray-400">
              Ciclo Escolar {alumnoInfo?.anio_lectivo}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-lg font-bold text-white flex items-center justify-end gap-2">
            <UserCircleIcon className="w-5 h-5 text-purple-400" />{" "}
            {nombreAlumno}
          </h3>
          <p className="text-sm text-gray-400">
            {alumnoInfo?.grado_nombre} - {alumnoInfo?.seccion_nombre}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Código: {alumnoInfo?.codigo_mined}
          </p>
        </div>
      </div>

      {/* --- TABLA TOTALMENTE DINÁMICA --- */}
      <div className="max-w-[1400px] mx-auto bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 border-collapse">
            <thead>
              {/* NIVEL 1: GRUPOS (Semestres/Trimestres) */}
              <tr className="bg-gray-950 text-gray-400 text-xs uppercase tracking-wider">
                <th
                  rowSpan={3}
                  className="px-6 py-4 text-left font-bold text-gray-300 border-r border-gray-800 bg-gray-900 sticky left-0 z-20 w-64"
                >
                  ASIGNATURAS
                </th>

                {columnasAgrupadas.map((grupo, idx) => (
                  <th
                    key={grupo.titulo}
                    colSpan={grupo.cortes.length * 2}
                    className={`px-4 py-2 text-center font-bold border-r border-gray-800 
                            ${
                              idx % 2 === 0
                                ? "text-indigo-400 bg-indigo-900/20"
                                : "text-purple-400 bg-purple-900/20"
                            }
                        `}
                  >
                    {grupo.titulo}
                  </th>
                ))}

                <th
                  colSpan={2}
                  className="px-4 py-2 text-center font-bold text-emerald-400 bg-emerald-900/20"
                >
                  FINAL
                </th>
              </tr>

              {/* NIVEL 2: NOMBRES DE CORTES */}
              <tr className="bg-gray-900/50 text-[10px] text-gray-300 uppercase font-bold">
                {columnasAgrupadas.map((grupo) =>
                  grupo.cortes.map((ev) => (
                    <th
                      key={ev.id_evaluacion}
                      colSpan={2}
                      className="px-2 py-2 text-center border-r border-gray-800 relative"
                    >
                      {cleanName(ev.nombre_corto)}
                      {!ev.activo_captura && (
                        <span className="ml-1 text-red-500" title="Cerrado">
                          🔒
                        </span>
                      )}
                    </th>
                  ))
                )}
                {/* Final */}
                <th
                  colSpan={2}
                  className="bg-gray-900/30 text-center text-emerald-500/50"
                >
                  ANUAL
                </th>
              </tr>

              {/* NIVEL 3: CUANT / CUAL */}
              <tr className="bg-gray-900 border-b border-gray-700 text-[9px] text-gray-500 uppercase font-medium">
                {columnasAgrupadas
                  .flatMap((g) => g.cortes)
                  .map((ev) => (
                    <React.Fragment key={ev.id_evaluacion}>
                      <th className="px-1 py-1 text-center border-r border-gray-800 w-12">
                        CUANT
                      </th>
                      <th className="px-1 py-1 text-center border-r border-gray-700 w-12 bg-gray-800/30">
                        CUAL
                      </th>
                    </React.Fragment>
                  ))}
                <th className="px-1 py-1 text-center border-r border-gray-800 w-14 text-emerald-600">
                  CUANT
                </th>
                <th className="px-1 py-1 text-center w-14 text-emerald-600">
                  CUAL
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800 bg-gray-900">
              {materias.map((mat) => {
                const finalNum = calcularNotaFinal(mat.id_materia);
                const finalLetra = getCualitativa(finalNum);

                return (
                  <tr
                    key={mat.id_materia}
                    className="hover:bg-gray-800/40 transition-colors group"
                  >
                    <td className="px-6 py-3 text-sm font-medium text-gray-200 border-r border-gray-800 bg-gray-900 sticky left-0 z-10 group-hover:bg-gray-800 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                      {mat.materia}
                    </td>

                    {/* Renderizar Celdas Dinámicamente según Agrupación */}
                    {columnasAgrupadas
                      .flatMap((g) => g.cortes)
                      .map((ev) => {
                        const key = cellKey(mat.id_materia, ev.id_evaluacion);
                        const isLocked = !ev.activo_captura;
                        const isSaving = savingKey === key;
                        const rawValue = getDisplayValue(
                          mat.id_materia,
                          ev.id_evaluacion
                        );
                        const letra = getCualitativa(rawValue);

                        return (
                          <React.Fragment key={ev.id_evaluacion}>
                            {/* Input */}
                            <td
                              className={`p-0 border-r border-gray-800 relative h-10 ${
                                isLocked ? "bg-gray-950/80" : ""
                              }`}
                            >
                              <input
                                type="number"
                                min="0"
                                max="100"
                                disabled={isLocked || isSaving}
                                value={rawValue}
                                onChange={(e) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                onBlur={() =>
                                  handleBlur(mat.id_materia, ev.id_evaluacion)
                                }
                                onKeyDown={handleKeyDown}
                                className={`w-full h-full text-center outline-none bg-transparent font-mono text-sm focus:bg-indigo-500/10 focus:text-white transition-all
                                        ${
                                          isLocked
                                            ? "cursor-not-allowed text-gray-600"
                                            : "text-gray-300 hover:text-white"
                                        }
                                        ${isSaving ? "animate-pulse" : ""}
                                    `}
                              />
                            </td>
                            {/* Letra */}
                            <td className="px-1 py-1 border-r border-gray-800 text-center bg-gray-800/20">
                              <span
                                className={`text-[10px] font-bold ${getColorLetra(
                                  letra
                                )}`}
                              >
                                {letra}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}

                    {/* Nota Final */}
                    <td className="px-1 py-1 text-center font-bold border-r border-gray-800 bg-gray-800/40 text-white">
                      {finalNum ?? "-"}
                    </td>
                    <td className="px-1 py-1 text-center bg-gray-800/40">
                      <span
                        className={`text-[10px] font-bold ${getColorLetra(
                          finalLetra
                        )}`}
                      >
                        {finalLetra || "-"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TablaCalificaciones;
