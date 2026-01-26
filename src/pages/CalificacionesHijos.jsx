import React, {useEffect, useMemo, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import PageHeader from "../components/PageHeader";
import TablaCalificacionesAlumno from "../components/TablaCalificacionesAlumno";
import {
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

function CalificacionesHijos() {
  const token = localStorage.getItem("token");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [hijos, setHijos] = useState([]);
  const [vistaAlumno, setVistaAlumno] = useState(null);
  const [nombreAlumno, setNombreAlumno] = useState("");

  const headerStats = useMemo(
    () => [
      {
        label: "Estudiantes vinculados",
        value: Array.isArray(hijos) ? hijos.length : 0,
        icon: UserGroupIcon,
      },
    ],
    [hijos]
  );

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(services.padresMisHijos, {
          headers: {Authorization: `Bearer ${token}`},
        });

        const lista = Array.isArray(res?.data?.hijos) ? res.data.hijos : [];
        setHijos(lista);
      } catch (e) {
        console.error("Error cargando hijos:", e);
        setError(
          e?.response?.data?.message ||
            e?.response?.data?.error ||
            "No se pudieron cargar los hijos."
        );
        setHijos([]);
        setVistaAlumno(null);
        setNombreAlumno("");
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vistaAlumno) {
    return (
      <TablaCalificacionesAlumno
        alumnoId={vistaAlumno}
        nombreAlumno={nombreAlumno}
        onVolver={() => {
          setVistaAlumno(null);
          setNombreAlumno("");
        }}
        token={token}
        readOnly
        allowExport={false}
      />
    );
  }

  if (loading && !hijos.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg">Cargando calificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Calificaciones de mis hijos"
          subtitle="Consulta notas, promedios y comentarios del profesor por materia."
          icon={ClipboardDocumentCheckIcon}
          gradientFrom="indigo-600"
          gradientTo="purple-600"
          stats={headerStats}
        />

        {error && (
          <div className="mb-6 bg-red-500/10 text-red-300 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-400 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo cargar la información</p>
              <p className="text-sm text-red-200/80">{error}</p>
            </div>
          </div>
        )}

        {!error && !hijos.length && (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-10 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400">No tienes estudiantes vinculados.</p>
          </div>
        )}

        {!!hijos.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {hijos.map((h) => {
              const nombre = `${h?.nombre || ""} ${h?.apellido || ""}`.trim();
              const gradoSeccion = `${h?.grado || ""} ${
                h?.seccion || ""
              }`.trim();

              return (
                <button
                  key={h.id_usuario_alumno}
                  onClick={() => {
                    setVistaAlumno(Number(h.id_usuario_alumno));
                    setNombreAlumno(nombre || "Estudiante");
                  }}
                  className="text-left bg-gray-800 border border-gray-700 rounded-xl p-5 hover:bg-gray-750 hover:border-gray-600 transition-colors shadow-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Estudiante</p>
                      <p className="text-lg font-bold text-white leading-tight">
                        {nombre || "Estudiante"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {gradoSeccion || "—"}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
                      <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-300" />
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-indigo-200">
                    Ver calificaciones →
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalificacionesHijos;
