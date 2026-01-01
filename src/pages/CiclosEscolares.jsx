import React, {useEffect, useState} from "react";
import ciclosApi from "../api/ciclos";

function CiclosEscolares() {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [editId, setEditId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchCiclos();
  }, []);

  // Refresca los selects del setup si existen en la página principal
  const refreshSetupSelects = () => {
    // Busca si hay un iframe o window con /configuracion y recarga si existe
    if (window.location.pathname !== "/configuracion") {
      const configLink = document.querySelector('a[href="/configuracion"]');
      if (configLink) {
        configLink.click();
      }
    }
  };

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const res = await ciclosApi.getCiclos(token);
      setCiclos(res.data.ciclos || res.data || []);
    } catch (e) {
      setError("Error al cargar ciclos");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await ciclosApi.updateCiclo(token, editId, form);
        setSuccessMsg("¡Ciclo actualizado correctamente!");
      } else {
        await ciclosApi.createCiclo(token, form);
        setSuccessMsg("¡Ciclo creado correctamente!");
      }
      setForm({nombre: "", fecha_inicio: "", fecha_fin: ""});
      setEditId(null);
      setShowForm(false);
      fetchCiclos();
      refreshSetupSelects();
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (e) {
      setError("Error al guardar ciclo");
      setTimeout(() => setError(""), 2500);
    }
  };

  const handleEdit = (ciclo) => {
    setForm({
      nombre: ciclo.nombre,
      fecha_inicio: ciclo.fecha_inicio,
      fecha_fin: ciclo.fecha_fin,
    });
    setEditId(ciclo.id_ciclo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este ciclo?")) return;
    try {
      await ciclosApi.deleteCiclo(token, id);
      fetchCiclos();
    } catch (e) {
      if (e.response && e.response.status === 409) {
        setError(
          e.response.data.error ||
            "No se puede eliminar el ciclo porque ya tiene alumnos o datos asociados"
        );
      } else {
        setError("Error al eliminar ciclo");
      }
      setTimeout(() => setError(""), 3500);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">
        Gestor de Ciclos Escolares
      </h2>
      {error && <div className="text-red-400 mb-2">{error}</div>}
      {successMsg && <div className="text-green-400 mb-2">{successMsg}</div>}
      <button
        className="mb-4 px-4 py-2 bg-cyan-600 text-white rounded-lg"
        onClick={() => {
          setShowForm(true);
          setForm({nombre: "", fecha_inicio: "", fecha_fin: ""});
          setEditId(null);
        }}
      >
        + Nuevo Ciclo
      </button>
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">
              Crear Nuevo Ciclo Escolar
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-gray-300 mb-1">Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
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
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
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
                  className="w-full px-3 py-2 rounded bg-gray-700 text-white"
                />
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg"
                  onClick={() => {
                    setShowForm(false);
                    setEditId(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  {editId ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? (
        <div className="text-gray-400">Cargando...</div>
      ) : ciclos.length === 0 ? (
        <div className="text-gray-400">No hay ciclos registrados.</div>
      ) : (
        <table className="w-full text-white mt-4">
          <thead>
            <tr className="bg-gray-800">
              <th className="py-2">Nombre</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ciclos.map((c) => (
              <tr key={c.id_ciclo} className="border-b border-gray-700">
                <td className="py-2">{c.nombre}</td>
                <td>{c.fecha_inicio}</td>
                <td>{c.fecha_fin}</td>
                <td>
                  <button
                    className="text-blue-400 mr-2"
                    onClick={() => handleEdit(c)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-400"
                    onClick={() => handleDelete(c.id_ciclo)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CiclosEscolares;
