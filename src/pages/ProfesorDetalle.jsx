import {useState, useEffect, useRef} from "react";
import {useParams, useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import Toast from "../components/Toast";
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CakeIcon,
  IdentificationIcon,
  BookOpenIcon,
  BuildingLibraryIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PrinterIcon,
  EyeIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";

function ProfesorDetalle() {
  const {id} = useParams();
  const navigate = useNavigate();
  const [profesor, setProfesor] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [escuela, setEscuela] = useState(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const contentRef = useRef(null);
  const token = localStorage.getItem("token");

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  useEffect(() => {
    fetchProfesorDetalle();
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      const id_escuela = res.data.usuario?.id_escuela;
      if (id_escuela) {
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error al cargar datos de escuela:", error);
    }
  };

  const fetchProfesorDetalle = async () => {
    try {
      setLoading(true);

      // Obtener lista de profesores y buscar el específico
      const profesoresRes = await api.get(`/api/profesores`, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // Buscar el profesor específico por ID
      const profesorEncontrado = profesoresRes.data.find(
        (p) => p.id_profesor === parseInt(id)
      );

      if (!profesorEncontrado) {
        console.error("Profesor no encontrado en la lista");
        setProfesor(null);
        setLoading(false);
        return;
      }

      setProfesor(profesorEncontrado);

      // Obtener asignaciones del profesor
      const asignacionesRes = await api.get(
        `/api/profesores/${id}/asignaciones`,
        {headers: {Authorization: `Bearer ${token}`}}
      );
      console.log("📚 Asignaciones recibidas:", asignacionesRes.data);
      console.log(
        "📚 Array de asignaciones:",
        asignacionesRes.data.asignaciones
      );

      // Obtener materias del profesor
      const materiasRes = await api.get(`/api/profesores/${id}/materias`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      console.log("📚 Materias recibidas:", materiasRes.data);

      // Combinar asignaciones con materias
      const asignacionesConMaterias = asignacionesRes.data.asignaciones || [];
      const materiasProfesor = materiasRes.data || []; // Las materias vienen directamente en data

      console.log(
        "🔍 Total de materias del profesor:",
        materiasProfesor.length
      );
      console.log("🔍 Materias completas:", materiasProfesor);

      // Enriquecer asignaciones con información de materias
      const asignacionesCompletas = asignacionesConMaterias.map((asig) => {
        console.log(
          `🔍 Buscando materias para grado ${asig.id_grado} (${asig.nombre_grado})`
        );

        // Buscar materias que coincidan con el grado de esta asignación
        const materiasDelGrado = materiasProfesor.filter((mat) => {
          console.log(
            `  - Materia: id_grado=${mat.id_grado}, nombre=${
              mat.nombre_materia || mat.nombre
            }`
          );
          return mat.id_grado === asig.id_grado;
        });

        console.log(
          `  ✅ Materias encontradas para ${asig.nombre_grado}:`,
          materiasDelGrado.length
        );

        return {
          ...asig,
          materias: materiasDelGrado,
        };
      });

      console.log("📚 Asignaciones completas:", asignacionesCompletas);
      setAsignaciones(asignacionesCompletas);
    } catch (error) {
      console.error("Error al cargar detalle del profesor:", error);
      setProfesor(null);
    } finally {
      setLoading(false);
    }
  };

  // Agrupar asignaciones por grado
  console.log(
    "🔍 Estructura de asignaciones:",
    JSON.stringify(asignaciones, null, 2)
  );

  const asignacionesPorGrado = asignaciones.reduce((acc, asig) => {
    console.log("🔍 Procesando asignación:", asig);
    console.log("🔍 nombre_materia:", asig.nombre_materia);
    console.log("🔍 Todas las propiedades:", Object.keys(asig));

    const gradoNombre = asig.nombre_grado || "Sin grado";
    if (!acc[gradoNombre]) {
      acc[gradoNombre] = {
        grado: gradoNombre,
        secciones: [],
        materias: new Set(),
      };
    }
    if (asig.nombre_seccion) {
      acc[gradoNombre].secciones.push(asig.nombre_seccion);
    }

    // Procesar array de materias
    if (asig.materias && Array.isArray(asig.materias)) {
      asig.materias.forEach((mat) => {
        const nombreMateria = mat.nombre_materia || mat.nombre; // Usar 'nombre' como fallback
        if (nombreMateria) {
          console.log("✅ Agregando materia:", nombreMateria);
          acc[gradoNombre].materias.add(nombreMateria);
        }
      });
    } else {
      console.log("❌ No hay materias en esta asignación");
    }

    return acc;
  }, {});

  // Convertir materias Set a Array
  Object.keys(asignacionesPorGrado).forEach((grado) => {
    asignacionesPorGrado[grado].materias = Array.from(
      asignacionesPorGrado[grado].materias
    );
  });

  // Calcular total de materias únicas
  const totalMateriasUnicas = new Set();
  Object.values(asignacionesPorGrado).forEach((data) => {
    data.materias.forEach((materia) => totalMateriasUnicas.add(materia));
  });
  const totalMaterias = totalMateriasUnicas.size;

  console.log("📊 Total de asignaciones:", asignaciones.length);
  console.log("📊 Asignaciones por grado:", asignacionesPorGrado);
  console.log("📊 Total de materias únicas:", totalMaterias);
  console.log("📊 Materias únicas Set:", totalMateriasUnicas);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">
            Cargando información del profesor...
          </p>
        </div>
      </div>
    );
  }

  if (!profesor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">No se encontró el profesor</p>
          <button
            onClick={() => navigate("/profesores")}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Volver a Profesores
          </button>
        </div>
      </div>
    );
  }

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return "N/A";
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const abrirVistaPrevia = () => {
    setShowPDFPreview(true);
  };

  const descargarPDF = async () => {
    setGeneratingPDF(true);
    try {
      // Importar dinámicamente las librerías
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      // Capturar el contenido
      const element = contentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#1f2937",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Profesor_${profesor.nombre}_${profesor.apellido}.pdf`);
      setShowPDFPreview(false);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      showToast(
        "Error al generar el PDF. Por favor, intente nuevamente.",
        "error"
      );
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con información del profesor */}
        <div className="mb-6">
          <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/10 rounded-full blur-2xl animate-pulse delay-700"></div>

            <div className="relative z-10">
              {/* Botón de volver */}
              <button
                onClick={() => navigate("/profesores")}
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                <span>Volver</span>
              </button>

              {/* Logo y nombre de escuela */}
              {(escuela?.logo || escuela?.nombre) && (
                <div className="flex items-center justify-end gap-4 mb-6 pb-4 border-b border-white/20">
                  {escuela?.nombre && (
                    <div className="text-right">
                      <p className="text-xl font-bold text-white">
                        {escuela.nombre}
                      </p>
                      <p className="text-sm text-purple-100">
                        Sistema de Gestión Educativa
                      </p>
                    </div>
                  )}
                  {escuela?.logo && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/20 rounded-xl blur-xl"></div>
                      <img
                        src={`http://localhost:4000${escuela.logo}`}
                        alt={escuela.nombre}
                        className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl object-cover border-4 border-white/40 shadow-2xl"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Foto del profesor */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
                  {profesor.imagen ? (
                    <img
                      src={`http://localhost:4000${profesor.imagen}`}
                      alt={`${profesor.nombre} ${profesor.apellido}`}
                      className="relative w-32 h-32 rounded-2xl object-cover border-4 border-white/40 shadow-2xl"
                    />
                  ) : (
                    <div className="relative w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-sm border-4 border-white/40 flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-white/60" />
                    </div>
                  )}
                  {profesor.activo !== false && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-lg flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      Activo
                    </div>
                  )}
                </div>

                {/* Información principal */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h1 className="text-4xl font-bold text-white">
                      {profesor.nombre} {profesor.apellido}
                    </h1>
                    <button
                      onClick={abrirVistaPrevia}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
                    >
                      <EyeIcon className="w-5 h-5" />
                      <span className="hidden sm:inline">Vista Previa PDF</span>
                      <span className="sm:hidden">PDF</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {profesor.especialidad && (
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white font-semibold flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5" />
                        {profesor.especialidad}
                      </span>
                    )}
                    {profesor.titulo_academico && (
                      <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/90 flex items-center gap-2">
                        <BuildingLibraryIcon className="w-5 h-5" />
                        {profesor.titulo_academico}
                      </span>
                    )}
                    {profesor.años_experiencia && (
                      <span className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-white/90 flex items-center gap-2">
                        <BriefcaseIcon className="w-5 h-5" />
                        {profesor.años_experiencia} años de experiencia
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Personal */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <UserIcon className="w-6 h-6 text-purple-400" />
                Información Personal
              </h2>

              <div className="space-y-4">
                {profesor.numero_cedula && (
                  <div className="flex items-start gap-3">
                    <IdentificationIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Cédula</p>
                      <p className="text-white font-semibold">
                        {profesor.numero_cedula}
                      </p>
                    </div>
                  </div>
                )}

                {profesor.email && (
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">
                        Correo Electrónico
                      </p>
                      <p className="text-white font-semibold break-all">
                        {profesor.email}
                      </p>
                    </div>
                  </div>
                )}

                {profesor.contacto && (
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Teléfono</p>
                      <p className="text-white font-semibold">
                        {profesor.contacto}
                      </p>
                    </div>
                  </div>
                )}

                {profesor.fecha_nacimiento && (
                  <div className="flex items-start gap-3">
                    <CakeIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">
                        Fecha de Nacimiento
                      </p>
                      <p className="text-white font-semibold">
                        {new Date(profesor.fecha_nacimiento).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        {calcularEdad(profesor.fecha_nacimiento)} años
                      </p>
                    </div>
                  </div>
                )}

                {profesor.genero && (
                  <div className="flex items-start gap-3">
                    <UserIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Género</p>
                      <p className="text-white font-semibold capitalize">
                        {profesor.genero}
                      </p>
                    </div>
                  </div>
                )}

                {profesor.direccion && (
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">Dirección</p>
                      <p className="text-white font-semibold">
                        {profesor.direccion}
                      </p>
                    </div>
                  </div>
                )}

                {profesor.fecha_contratacion && (
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-400 text-sm">
                        Fecha de Contratación
                      </p>
                      <p className="text-white font-semibold">
                        {new Date(
                          profesor.fecha_contratacion
                        ).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Asignaciones Académicas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpenIcon className="w-6 h-6 text-blue-400" />
                Asignaciones Académicas
              </h2>

              {Object.keys(asignacionesPorGrado).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(asignacionesPorGrado).map(
                    ([grado, data], index) => (
                      <div
                        key={index}
                        className="bg-gray-700/50 rounded-xl p-5 border border-gray-600"
                      >
                        {/* Encabezado del grado */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-600">
                          <div className="p-2 bg-blue-500/20 rounded-lg">
                            <AcademicCapIcon className="w-6 h-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {data.grado}
                            </h3>
                            <p className="text-gray-400 text-sm">
                              {data.materias.length} materia(s) •{" "}
                              {data.secciones.length} sección(es)
                            </p>
                          </div>
                        </div>

                        {/* Materias asignadas */}
                        {data.materias.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <BookOpenIcon className="w-4 h-4" />
                              Materias
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {data.materias.map((materia, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm font-medium border border-blue-500/30"
                                >
                                  {materia}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Secciones asignadas */}
                        {data.secciones.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                              <UserGroupIcon className="w-4 h-4" />
                              Secciones
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {data.secciones.map((seccion, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium border border-purple-500/30"
                                >
                                  {seccion}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ClockIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">
                    No hay asignaciones registradas
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Este profesor aún no tiene grados, secciones o materias
                    asignadas
                  </p>
                </div>
              )}
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <AcademicCapIcon className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {Object.keys(asignacionesPorGrado).length}
                </h3>
                <p className="text-blue-300 text-sm">Grados Asignados</p>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <UserGroupIcon className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {Object.values(asignacionesPorGrado).reduce(
                    (acc, data) => acc + data.secciones.length,
                    0
                  )}
                </h3>
                <p className="text-purple-300 text-sm">Secciones Asignadas</p>
              </div>

              <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <BookOpenIcon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">
                  {totalMaterias}
                </h3>
                <p className="text-green-300 text-sm">Materias Asignadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Vista Previa PDF */}
      {showPDFPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Vista Previa del PDF
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {profesor.nombre} {profesor.apellido}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={descargarPDF}
                  disabled={generatingPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-xl font-semibold transition-colors shadow-lg"
                >
                  {generatingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      <span>Generando...</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPDFPreview(false)}
                  className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <XCircleIcon className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Contenido del Preview */}
            <div className="flex-1 overflow-auto p-6 bg-gray-900">
              <div
                ref={contentRef}
                className="bg-white rounded-xl max-w-5xl mx-auto shadow-2xl min-h-[297mm] flex flex-col"
                style={{width: "210mm"}}
              >
                {/* Contenido principal del PDF */}
                <div className="flex-1 p-8">
                  {/* Header del PDF - Estilo profesional */}
                  <div className="mb-6">
                    {/* Encabezado con logo y nombre de escuela */}
                    <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-gray-300">
                      <div className="flex-1">
                        {escuela?.nombre && (
                          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide mb-1">
                            {escuela.nombre}
                          </h1>
                        )}
                        {escuela?.direccion && (
                          <p className="text-xs text-gray-600">
                            {escuela.direccion}
                          </p>
                        )}
                        {escuela?.telefono && (
                          <p className="text-xs text-gray-600">
                            Tel: {escuela.telefono}
                          </p>
                        )}
                      </div>
                      {escuela?.logo && (
                        <img
                          src={`http://localhost:4000${escuela.logo}`}
                          alt={escuela.nombre}
                          className="w-16 h-16 rounded object-cover border border-gray-300"
                        />
                      )}
                    </div>

                    {/* Título del documento */}
                    <div className="bg-purple-600 text-white px-4 py-3 mb-6">
                      <h2 className="text-lg font-bold uppercase tracking-wider text-center">
                        Ficha de Información del Profesor
                      </h2>
                    </div>

                    {/* Información principal del profesor */}
                    <div className="border-2 border-gray-300 rounded-lg p-6 mb-6 bg-gray-50">
                      <div className="flex items-start gap-6">
                        {/* Foto del profesor */}
                        {profesor.imagen ? (
                          <img
                            src={`http://localhost:4000${profesor.imagen}`}
                            alt={`${profesor.nombre} ${profesor.apellido}`}
                            className="w-32 h-32 rounded border-2 border-gray-400 object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded bg-gray-200 border-2 border-gray-400 flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-gray-500" />
                          </div>
                        )}

                        {/* Datos del profesor */}
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 uppercase">
                            {profesor.nombre} {profesor.apellido}
                          </h3>

                          {/* Título y Especialidad en líneas separadas */}
                          <div className="mt-2 mb-3 space-y-1">
                            {profesor.titulo_academico && (
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">Título:</span>
                                <span className="ml-2">
                                  {profesor.titulo_academico}
                                </span>
                              </p>
                            )}
                            {profesor.especialidad && (
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold">
                                  Especialidad:
                                </span>
                                <span className="ml-2">
                                  {profesor.especialidad}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Otros datos en columnas */}
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-3 pt-3 border-t border-gray-300">
                            <div>
                              <span className="font-semibold text-gray-700">
                                Año Lectivo:
                              </span>
                              <span className="ml-2 text-gray-900">
                                {new Date().getFullYear()}
                              </span>
                            </div>
                            {profesor.años_experiencia && (
                              <div>
                                <span className="font-semibold text-gray-700">
                                  Experiencia:
                                </span>
                                <span className="ml-2 text-gray-900">
                                  {profesor.años_experiencia} años
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Información Personal */}
                    <div className="lg:col-span-1">
                      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-purple-600">
                          Información Personal
                        </h3>
                        <div className="space-y-3 text-sm">
                          {profesor.numero_cedula && (
                            <div>
                              <p className="text-gray-600 font-semibold">
                                Cédula:
                              </p>
                              <p className="text-gray-900">
                                {profesor.numero_cedula}
                              </p>
                            </div>
                          )}
                          {profesor.email && (
                            <div>
                              <p className="text-gray-600 font-semibold">
                                Correo:
                              </p>
                              <p className="text-gray-900 text-xs break-all">
                                {profesor.email}
                              </p>
                            </div>
                          )}
                          {profesor.contacto && (
                            <div>
                              <p className="text-gray-600 font-semibold">
                                Teléfono:
                              </p>
                              <p className="text-gray-900">
                                {profesor.contacto}
                              </p>
                            </div>
                          )}
                          {profesor.fecha_nacimiento && (
                            <div>
                              <p className="text-gray-600 font-semibold">
                                Fecha de Nacimiento:
                              </p>
                              <p className="text-gray-900">
                                {new Date(
                                  profesor.fecha_nacimiento
                                ).toLocaleDateString("es-ES")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estadísticas */}
                      <div className="grid grid-cols-1 gap-3 mt-4">
                        <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {Object.keys(asignacionesPorGrado).length}
                              </p>
                              <p className="text-gray-600 text-xs font-semibold">
                                Grados Asignados
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                              <AcademicCapIcon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {Object.values(asignacionesPorGrado).reduce(
                                  (acc, data) => acc + data.secciones.length,
                                  0
                                )}
                              </p>
                              <p className="text-gray-600 text-xs font-semibold">
                                Secciones Asignadas
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                              <UserGroupIcon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="border-2 border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {totalMaterias}
                              </p>
                              <p className="text-gray-600 text-xs font-semibold">
                                Materias Asignadas
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                              <BookOpenIcon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asignaciones */}
                    <div className="lg:col-span-2">
                      <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-purple-600">
                          Asignaciones Académicas
                        </h3>
                        {Object.keys(asignacionesPorGrado).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(asignacionesPorGrado).map(
                              ([grado, data], index) => (
                                <div
                                  key={index}
                                  className="border border-gray-300 rounded-lg p-3 bg-white"
                                >
                                  <h4 className="text-base font-bold text-gray-900 mb-2 pb-1 border-b border-gray-200">
                                    {data.grado}
                                  </h4>
                                  {data.materias.length > 0 && (
                                    <div className="mb-2">
                                      <p className="text-xs text-gray-600 font-semibold mb-1">
                                        Materias:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {data.materias.map((materia, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-purple-100 text-purple-900 rounded text-xs border border-purple-300 font-medium"
                                          >
                                            {materia}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {data.secciones.length > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-600 font-semibold mb-1">
                                        Secciones:
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {data.secciones.map((seccion, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-1 bg-gray-200 text-gray-900 rounded text-xs border border-gray-400 font-medium"
                                          >
                                            {seccion}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">
                            Sin asignaciones
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer del PDF - Al pie de página */}
                <div className="p-8 pt-4 border-t-2 border-gray-300 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    {/* Información de la Escuela */}
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-gray-900 mb-1">
                        Institución Educativa
                      </h4>
                      {escuela?.nombre && (
                        <p className="text-xs text-gray-700">
                          {escuela.nombre}
                        </p>
                      )}
                      {escuela?.direccion && (
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-semibold">Dirección:</span>{" "}
                          {escuela.direccion}
                        </p>
                      )}
                    </div>

                    {/* Contacto de la Escuela */}
                    <div className="text-center">
                      <h4 className="text-xs font-bold text-gray-900 mb-1">
                        Contacto
                      </h4>
                      {escuela?.telefono && (
                        <p className="text-xs text-gray-700">
                          <span className="font-semibold">Tel:</span>{" "}
                          {escuela.telefono}
                        </p>
                      )}
                      {escuela?.email && (
                        <p className="text-xs text-gray-700 mt-1">
                          <span className="font-semibold">Email:</span>{" "}
                          {escuela.email}
                        </p>
                      )}
                    </div>

                    {/* Fecha de generación */}
                    <div className="text-right">
                      <h4 className="text-xs font-bold text-gray-900 mb-1">
                        Documento Generado
                      </h4>
                      <p className="text-xs text-gray-700">
                        {new Date().toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Sistema de Gestión Educativa
                      </p>
                    </div>
                  </div>

                  {/* Línea final */}
                  <div className="border-t border-gray-200 pt-2 text-center">
                    <p className="text-xs text-gray-500">
                      Este documento es de carácter informativo y confidencial
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({show: false, message: "", type: "success"})}
        />
      )}
    </div>
  );
}

export default ProfesorDetalle;
