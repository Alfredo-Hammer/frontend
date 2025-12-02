import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import {
  UserIcon,
  BuildingLibraryIcon,
  PhoneIcon,
  MapPinIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  PrinterIcon,
  EyeIcon,
  ClockIcon,
  IdentificationIcon,
  HomeIcon,
  UsersIcon,
} from "@heroicons/react/24/solid";

const API_BASE_URL = "http://localhost:4000";

const DetalleAlumno = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alumno, setAlumno] = useState(null);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDetalleCompleto = async () => {
      setLoading(true);
      setError("");

      try {
        // Obtener datos completos del alumno con información relacionada
        const alumnoRes = await api.get(`/api/alumnos/${id}/detalle-completo`, {
          headers: {Authorization: `Bearer ${token}`},
        });

        console.log("Datos completos del alumno:", alumnoRes.data);

        // Si el endpoint anterior no existe, usar el endpoint normal y obtener datos adicionales
        if (alumnoRes.status === 404) {
          // Obtener datos básicos del alumno
          const alumnoBasico = await api.get(`/api/alumnos/${id}`, {
            headers: {Authorization: `Bearer ${token}`},
          });

          let datosCompletos = {...alumnoBasico.data};

          // Obtener información de la escuela si existe escuelaid o id_escuela
          if (datosCompletos.escuelaid || datosCompletos.id_escuela) {
            try {
              const escuelaId =
                datosCompletos.escuelaid || datosCompletos.id_escuela;
              const escuelaRes = await api.get(`/api/escuelas/${escuelaId}`, {
                headers: {Authorization: `Bearer ${token}`},
              });

              // Agregar información de la escuela al objeto alumno
              datosCompletos = {
                ...datosCompletos,
                logo_escuela: escuelaRes.data.logo
                  ? `http://localhost:4000${escuelaRes.data.logo}`
                  : null,
                nombre_director: escuelaRes.data.nombre_director,
                direccion_escuela: escuelaRes.data.direccion,
                telefono_escuela: escuelaRes.data.telefono,
                email_escuela: escuelaRes.data.email,
                escuela: escuelaRes.data.nombre, // Asegurar que el nombre de la escuela esté presente
              };
            } catch (escuelaError) {
              console.warn(
                "No se pudo obtener información de la escuela:",
                escuelaError
              );
            }
          }

          // Obtener información del profesor si existe id_profesor
          if (datosCompletos.id_profesor) {
            try {
              const profesorRes = await api.get(
                `/api/profesores/${datosCompletos.id_profesor}`,
                {
                  headers: {Authorization: `Bearer ${token}`},
                }
              );

              datosCompletos = {
                ...datosCompletos,
                profesor: `${profesorRes.data.nombres} ${profesorRes.data.apellidos}`,
                email_profesor: profesorRes.data.email,
              };
            } catch (profesorError) {
              console.warn(
                "No se pudo obtener información del profesor:",
                profesorError
              );
            }
          }

          setAlumno(datosCompletos);
        } else {
          // Si el endpoint detalle-completo existe y funciona
          let datosCompletos = {...alumnoRes.data};

          // Asegurar que el logo tenga la URL completa
          if (
            datosCompletos.logo_escuela &&
            !datosCompletos.logo_escuela.startsWith("http")
          ) {
            datosCompletos.logo_escuela = `http://localhost:4000${datosCompletos.logo_escuela}`;
          }

          setAlumno(datosCompletos);
        }
      } catch (error) {
        console.error("Error al obtener datos del alumno:", error);

        // Si el endpoint detalle-completo no existe, intentar con el endpoint básico
        if (error.response?.status === 404) {
          try {
            const alumnoBasico = await api.get(`/api/alumnos/${id}`, {
              headers: {Authorization: `Bearer ${token}`},
            });

            let datosCompletos = {...alumnoBasico.data};

            // Obtener información de la escuela
            if (datosCompletos.escuelaid || datosCompletos.id_escuela) {
              try {
                const escuelaId =
                  datosCompletos.escuelaid || datosCompletos.id_escuela;
                const escuelaRes = await api.get(`/api/escuelas/${escuelaId}`, {
                  headers: {Authorization: `Bearer ${token}`},
                });

                datosCompletos = {
                  ...datosCompletos,
                  logo_escuela: escuelaRes.data.logo
                    ? `http://localhost:4000${escuelaRes.data.logo}`
                    : null,
                  nombre_director: escuelaRes.data.nombre_director,
                  direccion_escuela: escuelaRes.data.direccion,
                  telefono_escuela: escuelaRes.data.telefono,
                  email_escuela: escuelaRes.data.email,
                  escuela: escuelaRes.data.nombre,
                };
              } catch (escuelaError) {
                console.warn(
                  "No se pudo obtener información de la escuela:",
                  escuelaError
                );
              }
            }

            // Obtener información del profesor
            if (datosCompletos.id_profesor) {
              try {
                const profesorRes = await api.get(
                  `/api/profesores/${datosCompletos.id_profesor}`,
                  {
                    headers: {Authorization: `Bearer ${token}`},
                  }
                );

                datosCompletos = {
                  ...datosCompletos,
                  profesor: `${profesorRes.data.nombres} ${profesorRes.data.apellidos}`,
                  email_profesor: profesorRes.data.email,
                };
              } catch (profesorError) {
                console.warn(
                  "No se pudo obtener información del profesor:",
                  profesorError
                );
              }
            }

            setAlumno(datosCompletos);
          } catch (basicError) {
            setError(
              "Error al cargar los datos del alumno: " +
                (basicError.response?.data?.message || basicError.message)
            );
          }
        } else {
          setError(
            "Error al cargar los datos del alumno: " +
              (error.response?.data?.message || error.message)
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchDetalleCompleto();
    } else {
      setError("ID de alumno o token no válido");
      setLoading(false);
    }
  }, [id, token]);

  const imprimirPDF = () => {
    // Ocultar elementos innecesarios antes de imprimir
    const elementsToHide = [
      "header",
      "nav",
      ".sidebar",
      ".header",
      '[data-testid="sidebar"]',
      '[role="navigation"]',
    ];

    elementsToHide.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.display = "none";
      });
    });

    // Aplicar estilos específicos para impresión
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    setTimeout(() => {
      window.print();

      // Restaurar elementos después de imprimir
      setTimeout(() => {
        elementsToHide.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            el.style.display = "";
          });
        });
        document.body.style.margin = "";
        document.body.style.padding = "";
      }, 1000);
    }, 500);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Cargando información del estudiante...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-8 max-w-md">{error}</p>
          <button
            onClick={() => navigate("/alumnos")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Volver a Alumnos
          </button>
        </div>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-300 mb-4">
            Alumno no encontrado
          </h2>
          <button
            onClick={() => navigate("/alumnos")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Volver a Alumnos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${
        showPreview
          ? "bg-white print-preview"
          : "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
      } print:bg-white`}
    >
      {/* Header - Hidden on print and preview */}
      {!showPreview && (
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 overflow-hidden print:hidden no-print">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-16">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={() => navigate("/alumnos")}
                  className="p-3 bg-white/10 rounded-xl text-white hover:bg-white/20 backdrop-blur-sm transition-colors"
                >
                  <ArrowLeftIcon className="w-6 h-6" />
                </button>

                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  <img
                    src={
                      alumno.imagen
                        ? `${API_BASE_URL}${alumno.imagen}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            alumno.nombre + " " + alumno.apellido
                          )}&background=0D8ABC&color=fff`
                    }
                    alt="Alumno"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h1 className="text-4xl font-bold text-white">
                    {alumno.nombre} {alumno.apellido}
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Ficha Completa del Estudiante
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    {alumno.codigo_mined && (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                        MINED: {alumno.codigo_mined}
                      </span>
                    )}
                    {alumno.grado && (
                      <span className="px-3 py-1 bg-white/20 rounded-full text-sm text-white">
                        {alumno.grado} - {alumno.seccion || "Sin sección"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePreview}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold backdrop-blur-sm hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
                >
                  <EyeIcon className="w-5 h-5" />
                  <span>Vista Previa</span>
                </button>

                <button
                  onClick={imprimirPDF}
                  className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center space-x-2"
                >
                  <PrinterIcon className="w-5 h-5" />
                  <span>Imprimir PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div
        className={`max-w-7xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none print:mx-0 ${
          showPreview ? "pt-8 preview-content" : ""
        }`}
      >
        {/* Header para impresión y vista previa */}
        <div
          className={`${
            showPreview ? "block" : "hidden print:block"
          } mb-8 border-b-2 border-gray-300 pb-6 print-only`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Logo de la escuela */}
              <div className="flex-shrink-0">
                {alumno.logo_escuela ? (
                  <img
                    src={alumno.logo_escuela}
                    alt="Logo de la escuela"
                    className="w-24 h-24 object-contain rounded-xl bg-white p-2 border print:w-20 print:h-20"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center print:w-20 print:h-20"
                  style={{display: alumno?.logo_escuela ? "none" : "flex"}}
                >
                  <BuildingLibraryIcon className="w-16 h-16 text-white print:w-12 print:h-12" />
                </div>
              </div>

              {/* Información de la escuela */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2 print:text-3xl">
                  {alumno.escuela || "Nombre de la Escuela"}
                </h1>
                <div className="space-y-1 text-gray-700 print:text-sm">
                  {alumno.direccion_escuela && (
                    <p className="flex items-center text-sm print:text-xs">
                      <MapPinIcon className="w-4 h-4 mr-2 print:w-3 print:h-3" />
                      {alumno.direccion_escuela}
                    </p>
                  )}
                  {alumno.telefono_escuela && (
                    <p className="flex items-center text-sm print:text-xs">
                      <PhoneIcon className="w-4 h-4 mr-2 print:w-3 print:h-3" />
                      {alumno.telefono_escuela}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 print:text-2xl">
                FICHA DEL ESTUDIANTE
              </h2>
              <p className="text-gray-600 print:text-sm">Año Académico 2025</p>
              <p className="text-gray-600 print:text-sm">
                Fecha:{" "}
                {new Date().toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Header con información de la escuela - Solo vista normal */}
        {!showPreview && (
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-8 border border-gray-600 mb-8 print:hidden no-print -mt-16 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-6">
                {/* Logo de la escuela */}
                <div className="flex-shrink-0">
                  {alumno.logo_escuela ? (
                    <img
                      src={alumno.logo_escuela}
                      alt="Logo de la escuela"
                      className="w-20 h-20 object-contain rounded-xl bg-white p-2"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"
                    style={{display: alumno?.logo_escuela ? "none" : "flex"}}
                  >
                    <BuildingLibraryIcon className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Información de la escuela */}
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {alumno.escuela || "Información Institucional"}
                  </h3>
                  <div className="space-y-1 text-gray-300">
                    {alumno.direccion_escuela && (
                      <p className="flex items-center text-sm">
                        <MapPinIcon className="w-4 h-4 mr-2 text-indigo-400" />
                        {alumno.direccion_escuela}
                      </p>
                    )}
                    {alumno.telefono_escuela && (
                      <p className="flex items-center text-sm">
                        <PhoneIcon className="w-4 h-4 mr-2 text-green-400" />
                        {alumno.telefono_escuela}
                      </p>
                    )}
                    {alumno.email_escuela && (
                      <p className="flex items-center text-sm">
                        <EnvelopeIcon className="w-4 h-4 mr-2 text-blue-400" />
                        {alumno.email_escuela}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Foto del estudiante para impresión */}
        <div
          className={`${
            showPreview ? "block" : "hidden print:block"
          } mb-8 text-center print-only`}
        >
          <div className="inline-block">
            <img
              src={
                alumno.imagen
                  ? `${API_BASE_URL}${alumno.imagen}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      alumno.nombre + " " + alumno.apellido
                    )}&background=0D8ABC&color=fff&size=150`
              }
              alt="Foto del estudiante"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-lg print:w-24 print:h-24"
            />
            <h3 className="text-2xl font-bold text-gray-900 mt-4 print:text-xl">
              {alumno.nombre} {alumno.apellido}
            </h3>
            <p className="text-gray-600 print:text-sm">
              {alumno.codigo_mined && `Código MINED: ${alumno.codigo_mined}`}
            </p>
          </div>
        </div>

        {/* Grid de información detallada */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-6">
          {/* Información Personal */}
          <div
            className={`${
              showPreview
                ? "bg-white border border-gray-300"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-6 print:bg-white print:border print:border-gray-300 print:rounded-none avoid-break`}
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-10 h-10 ${
                  showPreview ? "bg-blue-100" : "bg-blue-500/20"
                } rounded-full flex items-center justify-center mr-3 print:bg-blue-100`}
              >
                <UserIcon
                  className={`w-5 h-5 ${
                    showPreview ? "text-blue-600" : "text-blue-400"
                  } print:text-blue-600`}
                />
              </div>
              <h3
                className={`text-xl font-bold ${
                  showPreview ? "text-gray-900" : "text-white"
                } print:text-gray-900`}
              >
                Información Personal
              </h3>
            </div>

            <div className="space-y-4">
              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <IdentificationIcon className="w-4 h-4 mr-2" />
                  Nombre Completo:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.nombre} {alumno.apellido}
                </span>
              </div>

              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Código MINED:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.codigo_mined || "Sin asignar"}
                </span>
              </div>

              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Género:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.genero || "No especificado"}
                </span>
              </div>

              {alumno.fecha_nacimiento && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    Fecha de Nacimiento:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {new Date(alumno.fecha_nacimiento).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <EnvelopeIcon className="w-4 h-4 mr-2" />
                  Email:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.email || "-"}
                </span>
              </div>

              {alumno.movil_alumno && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Teléfono:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {alumno.movil_alumno}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información Académica */}
          <div
            className={`${
              showPreview
                ? "bg-white border border-gray-300"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-6 print:bg-white print:border print:border-gray-300 print:rounded-none avoid-break`}
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-10 h-10 ${
                  showPreview ? "bg-green-100" : "bg-green-500/20"
                } rounded-full flex items-center justify-center mr-3 print:bg-green-100`}
              >
                <AcademicCapIcon
                  className={`w-5 h-5 ${
                    showPreview ? "text-green-600" : "text-green-400"
                  } print:text-green-600`}
                />
              </div>
              <h3
                className={`text-xl font-bold ${
                  showPreview ? "text-gray-900" : "text-white"
                } print:text-gray-900`}
              >
                Información Académica
              </h3>
            </div>

            <div className="space-y-4">
              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <BuildingLibraryIcon className="w-4 h-4 mr-2" />
                  Escuela:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.escuela || "No asignada"}
                </span>
              </div>

              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <AcademicCapIcon className="w-4 h-4 mr-2" />
                  Grado:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.grado || "No asignado"}
                </span>
              </div>

              <div
                className={`flex items-center justify-between py-3 border-b ${
                  showPreview ? "border-gray-300" : "border-gray-700"
                } print:border-gray-300`}
              >
                <span
                  className={`${
                    showPreview ? "text-gray-600" : "text-gray-400"
                  } print:text-gray-600 flex items-center`}
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Sección:
                </span>
                <span
                  className={`${
                    showPreview ? "text-gray-900" : "text-white"
                  } font-medium print:text-gray-900`}
                >
                  {alumno.seccion || "No asignada"}
                </span>
              </div>

              {alumno.nivel_educativo && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Nivel Educativo:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {alumno.nivel_educativo}
                  </span>
                </div>
              )}

              {alumno.turno && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <ClockIcon className="w-4 h-4 mr-2" />
                    Turno:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {alumno.turno}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información de Ubicación */}
          <div
            className={`${
              showPreview
                ? "bg-white border border-gray-300"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-6 print:bg-white print:border print:border-gray-300 print:rounded-none avoid-break`}
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-10 h-10 ${
                  showPreview ? "bg-purple-100" : "bg-purple-500/20"
                } rounded-full flex items-center justify-center mr-3 print:bg-purple-100`}
              >
                <MapPinIcon
                  className={`w-5 h-5 ${
                    showPreview ? "text-purple-600" : "text-purple-400"
                  } print:text-purple-600`}
                />
              </div>
              <h3
                className={`text-xl font-bold ${
                  showPreview ? "text-gray-900" : "text-white"
                } print:text-gray-900`}
              >
                Información de Ubicación
              </h3>
            </div>

            <div className="space-y-4">
              {alumno.direccion_exacta && (
                <div
                  className={`flex items-start justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <HomeIcon className="w-4 h-4 mr-2" />
                    Dirección:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium text-right max-w-xs print:text-gray-900`}
                  >
                    {alumno.direccion_exacta}
                  </span>
                </div>
              )}

              {alumno.municipio && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Municipio:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {alumno.municipio}
                  </span>
                </div>
              )}

              {alumno.departamento && (
                <div
                  className={`flex items-center justify-between py-3 border-b ${
                    showPreview ? "border-gray-300" : "border-gray-700"
                  } print:border-gray-300`}
                >
                  <span
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600 flex items-center`}
                  >
                    <MapPinIcon className="w-4 h-4 mr-2" />
                    Departamento:
                  </span>
                  <span
                    className={`${
                      showPreview ? "text-gray-900" : "text-white"
                    } font-medium print:text-gray-900`}
                  >
                    {alumno.departamento}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información del Tutor */}
          <div
            className={`${
              showPreview
                ? "bg-white border border-gray-300"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-6 print:bg-white print:border print:border-gray-300 print:rounded-none avoid-break`}
          >
            <div className="flex items-center mb-6">
              <div
                className={`w-10 h-10 ${
                  showPreview ? "bg-yellow-100" : "bg-yellow-500/20"
                } rounded-full flex items-center justify-center mr-3 print:bg-yellow-100`}
              >
                <UserIcon
                  className={`w-5 h-5 ${
                    showPreview ? "text-yellow-600" : "text-yellow-400"
                  } print:text-yellow-600`}
                />
              </div>
              <h3
                className={`text-xl font-bold ${
                  showPreview ? "text-gray-900" : "text-white"
                } print:text-gray-900`}
              >
                Información del Tutor
              </h3>
            </div>

            <div className="space-y-4">
              {alumno.nombre_padre ? (
                <>
                  <div
                    className={`flex items-center justify-between py-3 border-b ${
                      showPreview ? "border-gray-300" : "border-gray-700"
                    } print:border-gray-300`}
                  >
                    <span
                      className={`${
                        showPreview ? "text-gray-600" : "text-gray-400"
                      } print:text-gray-600 flex items-center`}
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Nombre del Tutor:
                    </span>
                    <span
                      className={`${
                        showPreview ? "text-gray-900" : "text-white"
                      } font-medium print:text-gray-900`}
                    >
                      {alumno.nombre_padre}
                    </span>
                  </div>

                  {alumno.telefono_padre && (
                    <div
                      className={`flex items-center justify-between py-3 border-b ${
                        showPreview ? "border-gray-300" : "border-gray-700"
                      } print:border-gray-300`}
                    >
                      <span
                        className={`${
                          showPreview ? "text-gray-600" : "text-gray-400"
                        } print:text-gray-600 flex items-center`}
                      >
                        <PhoneIcon className="w-4 h-4 mr-2" />
                        Teléfono:
                      </span>
                      <span
                        className={`${
                          showPreview ? "text-gray-900" : "text-white"
                        } font-medium print:text-gray-900`}
                      >
                        {alumno.telefono_padre}
                      </span>
                    </div>
                  )}

                  {alumno.correo_padre && (
                    <div
                      className={`flex items-center justify-between py-3 border-b ${
                        showPreview ? "border-gray-300" : "border-gray-700"
                      } print:border-gray-300`}
                    >
                      <span
                        className={`${
                          showPreview ? "text-gray-600" : "text-gray-400"
                        } print:text-gray-600 flex items-center`}
                      >
                        <EnvelopeIcon className="w-4 h-4 mr-2" />
                        Email:
                      </span>
                      <span
                        className={`${
                          showPreview ? "text-gray-900" : "text-white"
                        } font-medium print:text-gray-900`}
                      >
                        {alumno.correo_padre}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p
                    className={`${
                      showPreview ? "text-gray-600" : "text-gray-400"
                    } print:text-gray-600`}
                  >
                    No hay información del tutor registrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer para impresión y vista previa */}
        <div
          className={`${
            showPreview ? "block" : "hidden print:block"
          } mt-12 pt-8 border-t border-gray-300 print-only`}
        >
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm font-semibold text-gray-700">Director(a)</p>
              <p className="text-xs text-gray-500">
                {alumno.nombre_director || "Nombre del Director"}
              </p>
            </div>

            <div>
              <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm font-semibold text-gray-700">
                Profesor(a) Guía
              </p>
              <p className="text-xs text-gray-500">
                {alumno.profesor || "Nombre del Profesor"}
              </p>
            </div>

            <div>
              <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
              <p className="text-sm font-semibold text-gray-700">
                Padre/Madre o Tutor
              </p>
              <p className="text-xs text-gray-500">
                {alumno.nombre_padre || "Firma del Responsable"}
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p>
              Este documento es generado automáticamente por el Sistema AOC de
              Gestión Escolar
            </p>
            <p>
              Fecha de generación: {new Date().toLocaleDateString()} - Válido
              únicamente con sello y firma institucional
            </p>
          </div>
        </div>

        {/* Botones de acción - Hidden on print */}
        <div className="flex justify-center space-x-4 mt-8 print:hidden no-print">
          <button
            onClick={() => navigate("/alumnos")}
            className="px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center space-x-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>Volver a Alumnos</span>
          </button>

          <button
            onClick={togglePreview}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center space-x-2"
          >
            <EyeIcon className="w-5 h-5" />
            <span>
              {showPreview ? "Vista Normal" : "Vista Previa de Impresión"}
            </span>
          </button>

          <button
            onClick={imprimirPDF}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-semibold shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center space-x-2"
          >
            <PrinterIcon className="w-5 h-5" />
            <span>Imprimir Ficha PDF</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @media print {
          /* Ocultar todo lo que no sea contenido principal */
          body * {
            visibility: hidden;
          }

          .print-preview,
          .print-preview * {
            visibility: visible;
          }

          .print-only,
          .print-only * {
            visibility: visible !important;
          }

          .no-print,
          .print\\:hidden {
            display: none !important;
            visibility: hidden !important;
          }

          .preview-content,
          .preview-content * {
            visibility: visible;
          }

          /* Configuración de página */
          @page {
            size: A4;
            margin: 15mm;
          }

          /* Resetear estilos para impresión */
          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
            color: black;
            background: white;
          }

          /* Contenedor principal */
          .print-preview {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }

          /* Ocultar elementos específicos */
          header,
          nav,
          .sidebar,
          .header,
          [data-testid="sidebar"],
          [role="navigation"] {
            display: none !important;
          }

          /* Estilos específicos para impresión */
          .print\\:text-black {
            color: black !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }

          /* Evitar saltos de página en elementos importantes */
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          /* Ajustar tamaños para impresión */
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          .print\\:text-xs {
            font-size: 0.75rem !important;
          }
          .print\\:w-20 {
            width: 5rem !important;
          }
          .print\\:h-20 {
            height: 5rem !important;
          }
          .print\\:w-24 {
            width: 6rem !important;
          }
          .print\\:h-24 {
            height: 6rem !important;
          }
          .print\\:gap-6 {
            gap: 1.5rem !important;
          }
        }

        /* Estilos para vista previa */
        .print-preview {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .preview-content {
          background: white;
          color: black;
          min-height: 100vh;
        }

        .preview-content h1,
        .preview-content h2,
        .preview-content h3,
        .preview-content p,
        .preview-content span {
          color: black !important;
        }
      `}</style>
    </div>
  );
};

export default DetalleAlumno;
