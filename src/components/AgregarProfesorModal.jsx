import {useEffect, useState} from "react";

function AgregarProfesorModal({
  open,
  onClose,
  onSuccess,
  idEscuelaSeleccionada,
}) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    especialidad: "",
    contacto: "",
    numero_cedula: "",
    credenciales: "",
    imagen: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleChange = (e) => {
    const {name, value, files} = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value);
      });

      const res = await fetch("http://localhost:4000/api/profesores", {
        method: "POST",
        headers: {Authorization: `Bearer ${token}`},
        body: data,
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Error al agregar profesor");
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-2xl"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">
          Agregar Profesor
        </h2>
        {error && <div className="mb-3 text-red-600 text-center">{error}</div>}
        <form
          onSubmit={handleSubmit}
          className="space-y-3"
          encType="multipart/form-data"
        >
          <input
            name="nombre"
            type="text"
            placeholder="Nombre *"
            required
            className="w-full px-3 py-2 border rounded"
            value={form.nombre}
            onChange={handleChange}
          />
          <input
            name="apellido"
            type="text"
            placeholder="Apellido *"
            required
            className="w-full px-3 py-2 border rounded"
            value={form.apellido}
            onChange={handleChange}
          />
          <input
            name="especialidad"
            type="text"
            placeholder="Especialidad"
            className="w-full px-3 py-2 border rounded"
            value={form.especialidad}
            onChange={handleChange}
          />
          <input
            name="contacto"
            type="text"
            placeholder="Contacto"
            className="w-full px-3 py-2 border rounded"
            value={form.contacto}
            onChange={handleChange}
          />
          <input
            name="numero_cedula"
            type="text"
            placeholder="Cédula *"
            required
            className="w-full px-3 py-2 border rounded"
            value={form.numero_cedula}
            onChange={handleChange}
          />
          <input
            name="credenciales"
            type="text"
            placeholder="Credenciales"
            className="w-full px-3 py-2 border rounded"
            value={form.credenciales}
            onChange={handleChange}
          />
          <input
            name="imagen"
            type="file"
            accept="image/*"
            className="w-full"
            onChange={handleChange}
          />
          <input
            name="id_escuela"
            type="hidden"
            value={idEscuelaSeleccionada}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            {loading ? "Guardando..." : "Agregar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AgregarProfesorModal;
