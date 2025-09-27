import {useEffect, useState} from "react";
import AgregarProfesorModal from "../components/AgregarProfesorModal"; // Ajusta la ruta si es necesario

export default function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProfesores = () => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:4000/api/profesores", {
      headers: {Authorization: `Bearer ${token}`},
    })
      .then((res) => res.json())
      .then((data) => {
        setProfesores(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfesores();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <AgregarProfesorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchProfesores}
      />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Profesores</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition"
          onClick={() => setModalOpen(true)}
        >
          + Agregar Profesor
        </button>
      </div>
      {loading ? (
        <div className="text-center text-blue-700 font-semibold mt-16 text-xl">
          Cargando profesores...
        </div>
      ) : profesores.length === 0 ? (
        <div className="text-center text-gray-500 font-semibold mt-16 text-xl">
          No hay profesores registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-3 px-4 border-b text-left text-blue-700">
                  Nombre
                </th>
                <th className="py-3 px-4 border-b text-left text-blue-700">
                  Especialidad
                </th>
                <th className="py-3 px-4 border-b text-left text-blue-700">
                  Contacto
                </th>
                <th className="py-3 px-4 border-b text-left text-blue-700">
                  Cédula
                </th>
                <th className="py-3 px-4 border-b text-left text-blue-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {profesores.map((prof) => (
                <tr key={prof.id_profesor} className="hover:bg-blue-50">
                  <td className="py-2 px-4 border-b flex items-center gap-3">
                    {prof.imagen && (
                      <img
                        src={`http://localhost:4000${prof.imagen}`}
                        alt="Foto"
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    )}
                    <span>
                      {prof.nombre} {prof.apellido}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{prof.especialidad}</td>
                  <td className="py-2 px-4 border-b">{prof.contacto}</td>
                  <td className="py-2 px-4 border-b">{prof.numero_cedula}</td>
                  <td className="py-2 px-4 border-b">
                    <button className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm mr-2">
                      Editar
                    </button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
