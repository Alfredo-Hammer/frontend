import React, {useState, useMemo} from "react";
import {useEvaluacionesConfig} from "./hooks/useEvaluacionesConfig"; // O impórtalo desde donde lo hayas puesto
import {PLANTILLAS} from "./constants"; // Define tus constantes fuera o al inicio

// --- CONSTANTES ---
const PLANTILLAS_OPTIONS = [
  {
    label: "MINED Estándar (4 Cortes)",
    value: "MINED_4_CORTES",
    desc: "Recomendado para escuelas oficiales. Crea 2 semestres con 2 cortes cada uno.",
    preview: ["I Corte", "II Corte", "III Corte", "IV Corte"],
  },
  {
    label: "Trimestral (3 Periodos)",
    value: "TRIMESTRAL_3_PERIODOS",
    desc: "Para sistemas cuatrimestrales o trimestrales simples.",
    preview: ["Periodo 1", "Periodo 2", "Periodo 3"],
  },
  {
    label: "Semestral Simple",
    value: "BASICO_2_SEMESTRES",
    desc: "Solo dos notas grandes al año.",
    preview: ["Semestre I", "Semestre II"],
  },
];

// --- SUBCOMPONENTES ---

const Switch = ({checked, onChange, disabled}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 ${
      checked ? "bg-emerald-500" : "bg-white/10"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

const FilaEvaluacion = ({evaluacion, onUpdate}) => {
  const [localNombre, setLocalNombre] = useState(evaluacion.nombre);
  const [localCorto, setLocalCorto] = useState(evaluacion.nombre_corto);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = () => {
    if (!localNombre.trim() || !localCorto.trim()) return;
    onUpdate(evaluacion.id_evaluacion, {
      nombre: localNombre,
      nombre_corto: localCorto,
    });
    setIsDirty(false);
  };

  // Detectar cambios locales
  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-300">{evaluacion.orden}</td>
      <td className="px-4 py-3 text-sm text-emerald-400 font-medium">
        {evaluacion.agrupador}
      </td>
      <td className="px-4 py-3">
        <input
          value={localNombre}
          onChange={handleChange(setLocalNombre)}
          className="w-full bg-transparent border-b border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none py-1 transition-colors"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={localCorto}
          onChange={handleChange(setLocalCorto)}
          className="w-full bg-transparent border-b border-white/10 text-white text-sm focus:border-emerald-500 focus:outline-none py-1 transition-colors"
        />
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <Switch
            checked={evaluacion.activo_captura}
            onChange={(val) =>
              onUpdate(evaluacion.id_evaluacion, {activo_captura: val})
            }
          />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {evaluacion.activo_captura ? "Abierto" : "Cerrado"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <Switch
            checked={evaluacion.visible_boleta}
            onChange={(val) =>
              onUpdate(evaluacion.id_evaluacion, {visible_boleta: val})
            }
          />
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {evaluacion.visible_boleta ? "Visible" : "Oculto"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {isDirty && (
          <button
            onClick={handleSave}
            className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            Guardar Cambios
          </button>
        )}
      </td>
    </tr>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function ConfigurarEvaluacionesModal({
  open,
  onClose,
  ciclo,
  token,
  onToast,
}) {
  const {loading, applying, evaluaciones, aplicarPlantilla, updateEvaluacion} =
    useEvaluacionesConfig(ciclo?.id_ciclo, token, onToast);

  const [selectedPlantilla, setSelectedPlantilla] = useState("MINED_4_CORTES");

  // Si no está abierto, no renderizamos nada (o retornamos null)
  if (!open) return null;

  const plantillaActual = PLANTILLAS_OPTIONS.find(
    (p) => p.value === selectedPlantilla
  );
  const tieneConfiguracion = evaluaciones.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Configuración de Evaluación
            </h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Ciclo Escolar:{" "}
              <span className="text-emerald-400 font-medium">
                {ciclo?.nombre}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Sección 1: Selector de Plantilla */}
          <section className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-4 space-y-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                  1. Seleccionar Modelo
                </h3>
                <p className="text-xs text-gray-400 mb-4">
                  Elige una estructura base para reiniciar o comenzar la
                  configuración de notas.
                </p>

                <div className="space-y-3">
                  {PLANTILLAS_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPlantilla === option.value
                          ? "bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/50"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plantilla"
                        value={option.value}
                        checked={selectedPlantilla === option.value}
                        onChange={(e) => setSelectedPlantilla(e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <span
                          className={`block text-sm font-medium ${
                            selectedPlantilla === option.value
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                        >
                          {option.label}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          {option.desc}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => aplicarPlantilla(selectedPlantilla)}
                  disabled={applying}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {applying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    "Aplicar Plantilla"
                  )}
                </button>
              </div>
            </div>

            {/* Sección 2: Tabla de Edición */}
            <div className="md:col-span-8">
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      2. Gestionar Evaluaciones Activas
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {tieneConfiguracion
                        ? `${evaluaciones.length} periodos configurados actualmente.`
                        : "No hay configuración aplicada. Selecciona una plantilla."}
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto min-h-[300px]">
                  {!tieneConfiguracion ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
                      <svg
                        className="w-16 h-16 mb-4 opacity-20"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                      </svg>
                      <p>
                        Selecciona y aplica una plantilla a la izquierda para
                        comenzar.
                      </p>
                    </div>
                  ) : loading ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                          <th className="px-4 py-3 font-semibold w-16">#</th>
                          <th className="px-4 py-3 font-semibold w-32">
                            Grupo
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Nombre Oficial
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Nombre Corto
                          </th>
                          <th className="px-4 py-3 font-semibold text-center w-24">
                            Captura
                          </th>
                          <th className="px-4 py-3 font-semibold text-center w-24">
                            Boleta
                          </th>
                          <th className="px-4 py-3 font-semibold text-right w-32">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {[...evaluaciones]
                          .sort((a, b) => a.orden - b.orden)
                          .map((ev) => (
                            <FilaEvaluacion
                              key={ev.id_evaluacion}
                              evaluacion={ev}
                              onUpdate={updateEvaluacion}
                            />
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
