import React, {useCallback, useEffect, useMemo, useState} from "react";
import ciclosApi from "../api/ciclos";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PageHeader from "../components/PageHeader";
import {
  CalendarDaysIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {format, parseISO} from "date-fns";

function CiclosEscolares() {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
    duration: 3000,
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [cicloToDelete, setCicloToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [editId, setEditId] = useState(null);

  // Ciclos maestros
  const [cicloAcademico, setCicloAcademico] = useState("");
  const [cicloMatricula, setCicloMatricula] = useState("");
  const [savingMaestros, setSavingMaestros] = useState(false);

  const token = localStorage.getItem("token");

  const showToast = (message, type = "success", duration = 3000) => {
    setToast({show: true, message, type, duration});
  };

  const hideToast = () => setToast((t) => ({...t, show: false}));

  const toInputDate = (value) => {
    if (!value) return "";
    if (typeof value === "string") {
      return value.includes("T") ? value.slice(0, 10) : value;
    }
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return format(d, "yyyy-MM-dd");
    } catch {
      return "";
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const date =
        typeof value === "string" ? parseISO(value) : new Date(value);
      if (Number.isNaN(date.getTime())) return String(value);
      return format(date, "dd/MM/yyyy");
    } catch {
      return String(value);
    }
  };

  const fetchCiclos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ciclosApi.getCiclos(token);
      const list = res.data.ciclos || res.data || [];
      setCiclos(list);

      const cicloActivo = list.find((c) => c.es_activo_academico);
      const cicloMat = list.find((c) => c.matricula_abierta);
      setCicloAcademico(
        cicloActivo?.id_ciclo ? String(cicloActivo.id_ciclo) : ""
      );
      setCicloMatricula(cicloMat?.id_ciclo ? String(cicloMat.id_ciclo) : "");
    } catch (e) {
      setError("Error al cargar ciclos");
      showToast("Error al cargar ciclos", "error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCiclos();
  }, [fetchCiclos]);

  const statsHeader = useMemo(() => {
    const total = ciclos.length;
    const activo = ciclos.find((c) => c.es_activo_academico);
    const matricula = ciclos.find((c) => c.matricula_abierta);
    return {
      total: {
        label: "Ciclos registrados",
        value: total,
        color: "from-white/5 via-white/0 to-white/5 border border-white/10",
      },
      activo: {
        label: "Ciclo académico",
        value: activo?.nombre || "Sin definir",
        color:
          "from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30",
      },
      matricula: {
        label: "Ciclo matrícula",
        value: matricula?.nombre || "Sin definir",
        color: "from-cyan-500/20 to-cyan-600/20 border border-cyan-500/30",
      },
    };
  }, [ciclos]);

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await ciclosApi.updateCiclo(token, editId, form);
        showToast("¡Ciclo actualizado correctamente!", "success");
      } else {
        await ciclosApi.createCiclo(token, form);
        showToast("¡Ciclo creado correctamente!", "success");
      }
      setForm({nombre: "", fecha_inicio: "", fecha_fin: ""});
      setEditId(null);
      setShowForm(false);
      fetchCiclos();
    } catch (e) {
      setError("Error al guardar ciclo");
      showToast("Error al guardar ciclo", "error");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleEdit = (ciclo) => {
    setForm({
      nombre: ciclo.nombre,
      fecha_inicio: toInputDate(ciclo.fecha_inicio),
      fecha_fin: toInputDate(ciclo.fecha_fin),
    });
    setEditId(ciclo.id_ciclo);
    setShowForm(true);
  };

  const handleSaveMaestros = async () => {
    if (!cicloAcademico || !cicloMatricula) {
      showToast("Selecciona el ciclo académico y el de matrícula", "warning");
      return;
    }
    try {
      setSavingMaestros(true);
      await ciclosApi.setCiclosMaestros(token, {
        id_ciclo_academico: cicloAcademico,
        id_ciclo_matricula: cicloMatricula,
      });
      showToast("¡Ciclos maestros actualizados correctamente!", "success");
      fetchCiclos();
    } catch (err) {
      showToast(
        err.response?.data?.error || "Error al actualizar ciclos maestros",
        "error",
        4500
      );
    } finally {
      setSavingMaestros(false);
    }
  };

  const requestDelete = (ciclo) => {
    setCicloToDelete(ciclo);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cicloToDelete?.id_ciclo) return;
    try {
      setDeleting(true);
      await ciclosApi.deleteCiclo(token, cicloToDelete.id_ciclo);
      showToast("Ciclo eliminado correctamente", "success");
      fetchCiclos();
    } catch (e) {
      if (e.response && e.response.status === 409) {
        showToast(
          e.response.data.error ||
            "No se puede eliminar el ciclo porque ya tiene alumnos o datos asociados",
          "warning",
          4500
        );
      } else {
        showToast("Error al eliminar ciclo", "error");
      }
      setTimeout(() => setError(""), 3500);
    } finally {
      setDeleting(false);
      setConfirmDeleteOpen(false);
      setCicloToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 p-6">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        type="danger"
        title="Eliminar ciclo escolar"
        message={
          cicloToDelete?.nombre
            ? `¿Deseas eliminar el ciclo "${cicloToDelete.nombre}"? Esta acción no se puede deshacer.`
            : "¿Deseas eliminar este ciclo? Esta acción no se puede deshacer."
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        loading={deleting}
        onCancel={() => {
          if (deleting) return;
          setConfirmDeleteOpen(false);
          setCicloToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          title="Ciclos Escolares"
          subtitle="Crea, edita y elimina ciclos. Define el ciclo académico activo y el ciclo habilitado para matrícula."
          icon={CalendarDaysIcon}
          gradientFrom="cyan-500"
          gradientTo="blue-600"
          badge="Gestión académica"
          stats={statsHeader}
          actions={
            <button
              type="button"
              onClick={() => {
                setShowForm(true);
                setForm({nombre: "", fecha_inicio: "", fecha_fin: ""});
                setEditId(null);
              }}
              className="px-4 py-2 bg-white text-cyan-700 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-200 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nuevo ciclo</span>
            </button>
          }
        />

        {error && (
          <div className="max-w-3xl mx-auto bg-red-900/40 border border-red-500/60 text-red-100 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Ciclos maestros */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-cyan-900/20 border border-cyan-500/20 rounded-2xl shadow-lg p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-1">
            Ciclos maestros
          </h2>
          <p className="text-sm text-gray-300/80 mb-4">
            Selecciona el ciclo académico activo y el ciclo habilitado para
            matrícula.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Ciclo académico
              </label>
              <select
                className="w-full bg-gray-950/60 border border-gray-700 rounded-xl px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={cicloAcademico}
                onChange={(e) => setCicloAcademico(e.target.value)}
              >
                <option value="">-- Selecciona un ciclo --</option>
                {ciclos.map((c) => (
                  <option key={c.id_ciclo} value={String(c.id_ciclo)}>
                    {c.nombre} {c.es_activo_academico ? "(Activo)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 text-sm font-medium">
                Ciclo matrícula
              </label>
              <select
                className="w-full bg-gray-950/60 border border-gray-700 rounded-xl px-3 py-2 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                value={cicloMatricula}
                onChange={(e) => setCicloMatricula(e.target.value)}
              >
                <option value="">-- Selecciona un ciclo --</option>
                {ciclos.map((c) => (
                  <option key={c.id_ciclo} value={String(c.id_ciclo)}>
                    {c.nombre}{" "}
                    {c.matricula_abierta ? "(Matrícula abierta)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              onClick={handleSaveMaestros}
              disabled={savingMaestros}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingMaestros ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 border border-white/10 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Listado</h2>
              <p className="text-sm text-gray-300/70">
                Administra nombre y fechas de cada ciclo.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-gray-300">Cargando...</div>
          ) : ciclos.length === 0 ? (
            <div className="p-6 text-gray-300">No hay ciclos registrados.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white/5">
                  <tr className="text-left text-gray-200">
                    <th className="px-6 py-3 font-semibold">Ciclo</th>
                    <th className="px-6 py-3 font-semibold">Inicio</th>
                    <th className="px-6 py-3 font-semibold">Fin</th>
                    <th className="px-6 py-3 font-semibold">Estado</th>
                    <th className="px-6 py-3 font-semibold text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {ciclos.map((c) => (
                    <tr
                      key={c.id_ciclo}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {c.nombre}
                        </div>
                        <div className="text-xs text-gray-300/70">
                          ID: {c.id_ciclo}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        {formatDate(c.fecha_inicio)}
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        {formatDate(c.fecha_fin)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {c.es_activo_academico && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                              Académico activo
                            </span>
                          )}
                          {c.matricula_abierta && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-200 border border-cyan-400/30">
                              Matrícula abierta
                            </span>
                          )}
                          {!c.es_activo_academico && !c.matricula_abierta && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/5 text-gray-200 border border-white/10">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center gap-2"
                            onClick={() => handleEdit(c)}
                          >
                            <PencilSquareIcon className="w-5 h-5 text-cyan-300" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                          <button
                            type="button"
                            className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-white border border-red-500/30 flex items-center gap-2"
                            onClick={() => requestDelete(c)}
                          >
                            <TrashIcon className="w-5 h-5 text-red-300" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-slate-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              {editId ? "Editar ciclo escolar" : "Crear nuevo ciclo escolar"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={form.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Fecha Fin</label>
                <input
                  type="date"
                  name="fecha_fin"
                  value={form.fecha_fin}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-gray-950/60 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold"
                >
                  {editId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CiclosEscolares;
