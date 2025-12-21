import React, {useState, useEffect} from "react";
import {
  PlusIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Loader from "../Loader";
import Toast from "../Toast";
import {format} from "date-fns";
import {es} from "date-fns/locale";

const BecasTab = () => {
  const [becas, setBecas] = useState([]);
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBeca, setEditingBeca] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    tipo_descuento: "porcentaje",
    valor_descuento: "",
    conceptos_aplicables: [],
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const [becasRes, conceptosRes] = await Promise.all([
        api.get(services.finanzasBecas, {
          headers: {Authorization: `Bearer ${token}`},
        }),
        api.get(services.finanzasConceptos, {
          headers: {Authorization: `Bearer ${token}`},
        }),
      ]);

      setBecas(becasRes.data);
      setConceptos(conceptosRes.data.filter((c) => c.activo));
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const becaData = {
        ...formData,
        valor_descuento: parseFloat(formData.valor_descuento),
        conceptos_aplicables: formData.conceptos_aplicables.map((id) =>
          parseInt(id)
        ),
      };

      if (editingBeca) {
        await api.put(services.finanzasBeca(editingBeca.id_beca), becaData, {
          headers: {Authorization: `Bearer ${token}`},
        });
      } else {
        await api.post(services.finanzasBecas, becaData, {
          headers: {Authorization: `Bearer ${token}`},
        });
      }

      setShowModal(false);
      setEditingBeca(null);
      setFormData({
        nombre: "",
        descripcion: "",
        tipo_descuento: "porcentaje",
        valor_descuento: "",
        conceptos_aplicables: [],
        fecha_inicio: "",
        fecha_fin: "",
        activo: true,
      });
      cargarDatos();
      showToast(
        editingBeca
          ? "Beca/descuento actualizado exitosamente"
          : "Beca/descuento creado exitosamente",
        "success"
      );
    } catch (error) {
      console.error("Error guardando beca:", error);
      showToast(
        error.response?.data?.message || "Error al guardar la beca/descuento",
        "error"
      );
    }
  };

  const handleEdit = (beca) => {
    setEditingBeca(beca);
    setFormData({
      nombre: beca.nombre,
      descripcion: beca.descripcion || "",
      tipo_descuento: beca.tipo_descuento,
      valor_descuento: beca.valor_descuento,
      conceptos_aplicables: beca.conceptos_aplicables || [],
      fecha_inicio: beca.fecha_inicio
        ? format(new Date(beca.fecha_inicio), "yyyy-MM-dd")
        : "",
      fecha_fin: beca.fecha_fin
        ? format(new Date(beca.fecha_fin), "yyyy-MM-dd")
        : "",
      activo: beca.activo,
    });
    setShowModal(true);
  };

  const toggleConcepto = (idConcepto) => {
    setFormData((prev) => {
      const conceptos = [...prev.conceptos_aplicables];
      const index = conceptos.indexOf(idConcepto);

      if (index > -1) {
        conceptos.splice(index, 1);
      } else {
        conceptos.push(idConcepto);
      }

      return {...prev, conceptos_aplicables: conceptos};
    });
  };

  const becasFiltradas = becas.filter((beca) =>
    beca.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount || 0);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Barra de Acciones */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar becas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => {
              setEditingBeca(null);
              setFormData({
                nombre: "",
                descripcion: "",
                tipo_descuento: "porcentaje",
                valor_descuento: "",
                conceptos_aplicables: [],
                fecha_inicio: "",
                fecha_fin: "",
                activo: true,
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Agregar Beca/Descuento
          </button>
        </div>
      </div>

      {/* Grid de Becas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {becasFiltradas.map((beca) => (
          <div
            key={beca.id_beca}
            className="bg-gradient-to-br from-gray-800 via-gray-800/80 to-gray-900 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 hover:shadow-2xl hover:border-gray-600/50 transition-all"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full p-3 border border-blue-500/30">
                  <AcademicCapIcon className="h-6 w-6 text-blue-300" />
                </div>
                <div className="flex gap-2">
                  {beca.activo ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">
                      Activa
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">
                      Inactiva
                    </span>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <h3 className="text-lg font-bold text-gray-100 mb-2">
                {beca.nombre}
              </h3>

              {/* Descripción */}
              {beca.descripcion && (
                <p className="text-sm text-gray-400 mb-4">{beca.descripcion}</p>
              )}

              {/* Valor del Descuento */}
              <div className="bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-lg p-4 mb-4 border border-blue-500/30">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300">
                    {beca.tipo_descuento === "porcentaje"
                      ? `${beca.valor_descuento}%`
                      : formatCurrency(beca.valor_descuento)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {beca.tipo_descuento === "porcentaje"
                      ? "Descuento Porcentual"
                      : "Descuento Fijo"}
                  </div>
                </div>
              </div>

              {/* Vigencia */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Inicio:</span>
                  <span className="font-medium text-gray-200">
                    {beca.fecha_inicio
                      ? format(new Date(beca.fecha_inicio), "dd/MM/yyyy", {
                          locale: es,
                        })
                      : "Sin fecha"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Fin:</span>
                  <span className="font-medium text-gray-200">
                    {beca.fecha_fin
                      ? format(new Date(beca.fecha_fin), "dd/MM/yyyy", {
                          locale: es,
                        })
                      : "Sin fecha"}
                  </span>
                </div>
              </div>

              {/* Conceptos Aplicables */}
              {beca.conceptos_aplicables &&
                beca.conceptos_aplicables.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">
                      Aplica a {beca.conceptos_aplicables.length} concepto
                      {beca.conceptos_aplicables.length !== 1 ? "s" : ""}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {beca.conceptos_aplicables
                        .slice(0, 3)
                        .map((idConcepto) => {
                          const concepto = conceptos.find(
                            (c) => c.id_concepto_pago === idConcepto
                          );
                          return concepto ? (
                            <span
                              key={concepto.id_concepto_pago}
                              className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300 border border-gray-600"
                            >
                              {concepto.nombre.slice(0, 15)}
                              {concepto.nombre.length > 15 ? "..." : ""}
                            </span>
                          ) : null;
                        })}
                      {beca.conceptos_aplicables.length > 3 && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300 border border-gray-600">
                          +{beca.conceptos_aplicables.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {/* Botón Editar */}
              <button
                onClick={() => handleEdit(beca)}
                className="w-full mt-4 px-4 py-2 border border-blue-500 text-blue-300 rounded-lg hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-2"
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Estado Vacío */}
      {becasFiltradas.length === 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-12 text-center">
          <AcademicCapIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            No hay becas o descuentos
          </h3>
          <p className="text-gray-400">
            Cree una nueva beca o descuento para aplicar a los pagos
          </p>
        </div>
      )}

      {/* Modal de Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">
                {editingBeca ? "Editar Beca/Descuento" : "Nueva Beca/Descuento"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({...formData, nombre: e.target.value})
                    }
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Beca de Excelencia Académica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) =>
                      setFormData({...formData, descripcion: e.target.value})
                    }
                    rows={2}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción de la beca o descuento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Descuento *
                    </label>
                    <select
                      required
                      value={formData.tipo_descuento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipo_descuento: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="monto_fijo">Monto Fijo (C$)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Valor del Descuento *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      max={
                        formData.tipo_descuento === "porcentaje"
                          ? 100
                          : undefined
                      }
                      value={formData.valor_descuento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_descuento: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        formData.tipo_descuento === "porcentaje"
                          ? "0-100"
                          : "0.00"
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Conceptos Aplicables *
                  </label>
                  <div className="bg-gray-900/50 border border-gray-600 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                    {conceptos.map((concepto) => (
                      <label
                        key={concepto.id_concepto_pago}
                        className="flex items-center p-2 hover:bg-gray-700/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.conceptos_aplicables.includes(
                            concepto.id_concepto_pago
                          )}
                          onChange={() =>
                            toggleConcepto(concepto.id_concepto_pago)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-100">
                          {concepto.nombre}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Seleccione los conceptos de pago a los que aplica esta
                    beca/descuento
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) =>
                        setFormData({...formData, fecha_inicio: e.target.value})
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Fecha de Fin
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) =>
                        setFormData({...formData, fecha_fin: e.target.value})
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({...formData, activo: e.target.checked})
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="activo"
                    className="ml-2 block text-sm text-gray-300"
                  >
                    Beca/Descuento activa
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingBeca(null);
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingBeca ? "Actualizar" : "Crear"} Beca/Descuento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast Component */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
};

export default BecasTab;
