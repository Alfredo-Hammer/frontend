import React, {useState, useEffect} from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Loader from "../Loader";
import ConfirmModal from "../ConfirmModal";
import Toast from "../Toast";

const ConceptosPagoTab = () => {
  const [conceptos, setConceptos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingConcepto, setEditingConcepto] = useState(null);
  const [deleteConceptoId, setDeleteConceptoId] = useState(null);
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
    monto_base: "",
    tipo: "mensualidad",
    activo: true,
  });

  const tiposConcepto = [
    {value: "matricula", label: "Matrícula"},
    {value: "mensualidad", label: "Mensualidad"},
    {value: "uniforme", label: "Uniforme"},
    {value: "transporte", label: "Transporte"},
    {value: "alimentacion", label: "Alimentación"},
    {value: "materiales", label: "Materiales"},
    {value: "eventos", label: "Eventos"},
    {value: "otro", label: "Otro"},
  ];

  useEffect(() => {
    cargarConceptos();
  }, []);

  const cargarConceptos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(services.finanzasConceptos, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setConceptos(response.data);
    } catch (error) {
      console.error("Error cargando conceptos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingConcepto) {
        await api.put(
          services.finanzasConcepto(editingConcepto.id_concepto),
          formData,
          {
            headers: {Authorization: `Bearer ${token}`},
          }
        );
      } else {
        await api.post(services.finanzasConceptos, formData, {
          headers: {Authorization: `Bearer ${token}`},
        });
      }

      setShowModal(false);
      setEditingConcepto(null);
      setFormData({
        nombre: "",
        descripcion: "",
        monto_base: "",
        tipo: "mensualidad",
        activo: true,
      });
      cargarConceptos();
      showToast(
        editingConcepto
          ? "Concepto actualizado exitosamente"
          : "Concepto creado exitosamente",
        "success"
      );
    } catch (error) {
      console.error("Error guardando concepto:", error);
      showToast(
        error.response?.data?.message || "Error al guardar el concepto de pago",
        "error"
      );
    }
  };

  const handleEdit = (concepto) => {
    setEditingConcepto(concepto);
    setFormData({
      nombre: concepto.nombre,
      descripcion: concepto.descripcion || "",
      monto_base: concepto.monto_base,
      tipo: concepto.tipo,
      activo: concepto.activo,
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.delete(services.finanzasConcepto(deleteConceptoId), {
        headers: {Authorization: `Bearer ${token}`},
      });
      setShowDeleteModal(false);
      setDeleteConceptoId(null);
      cargarConceptos();
      showToast("Concepto eliminado exitosamente", "success");
    } catch (error) {
      console.error("Error eliminando concepto:", error);
      showToast(
        error.response?.data?.message ||
          "Error al eliminar el concepto de pago",
        "error"
      );
    }
  };

  const conceptosFiltrados = conceptos.filter((concepto) => {
    const matchSearch =
      concepto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      concepto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = tipoFiltro === "todos" || concepto.tipo === tipoFiltro;
    return matchSearch && matchTipo;
  });

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
          <div className="flex-1 flex gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar conceptos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtro por Tipo */}
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              {tiposConcepto.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón Agregar */}
          <button
            onClick={() => {
              setEditingConcepto(null);
              setFormData({
                nombre: "",
                descripcion: "",
                monto_base: "",
                tipo: "mensualidad",
                activo: true,
              });
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Agregar Concepto
          </button>
        </div>
      </div>

      {/* Tabla de Conceptos */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Monto Base
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/30 divide-y divide-gray-700">
              {conceptosFiltrados.map((concepto) => (
                <tr key={concepto.id_concepto} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-100">
                        {concepto.nombre}
                      </div>
                      {concepto.descripcion && (
                        <div className="text-sm text-gray-400">
                          {concepto.descripcion}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300">
                      {tiposConcepto.find((t) => t.value === concepto.tipo)
                        ?.label || concepto.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-100">
                    {formatCurrency(concepto.monto_base)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {concepto.activo ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">
                        Activo
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300">
                        Inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(concepto)}
                      className="text-blue-400 hover:text-blue-300 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConceptoId(concepto.id_concepto);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">
                {editingConcepto ? "Editar Concepto" : "Nuevo Concepto de Pago"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Concepto *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({...formData, nombre: e.target.value})
                    }
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Mensualidad Enero 2024"
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
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descripción opcional del concepto"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Tipo de Concepto *
                    </label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({...formData, tipo: e.target.value})
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {tiposConcepto.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Monto Base (C$) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.monto_base}
                      onChange={(e) =>
                        setFormData({...formData, monto_base: e.target.value})
                      }
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
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
                    Activo
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingConcepto(null);
                    }}
                    className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingConcepto ? "Actualizar" : "Crear"} Concepto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Eliminar Concepto de Pago"
        message="¿Está seguro que desea eliminar este concepto de pago? Esta acción no se puede deshacer."
      />

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

export default ConceptosPagoTab;
