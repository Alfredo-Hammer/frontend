import {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import PageHeader from "../components/PageHeader";
import {
  UserCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BookOpenIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  BriefcaseIcon,
  CalendarIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {CheckCircleIcon, CheckBadgeIcon} from "@heroicons/react/24/solid";
import jsPDF from "jspdf";
import "jspdf-autotable";

function Profesores() {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profesorSeleccionado, setProfesorSeleccionado] = useState(null);
  const [cargaAcademica, setCargaAcademica] = useState([]);
  const [loadingCarga, setLoadingCarga] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [showCredencialesModal, setShowCredencialesModal] = useState(false);
  const [credencialesGeneradas, setCredencialesGeneradas] = useState({
    email: "",
    password: "",
  });

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    especialidad: "",
    cedula: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [escuela, setEscuela] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfesores();
    fetchEscuela();
  }, []);

  const fetchEscuela = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });
      if (res.data.escuela) {
        setEscuela(res.data.escuela);
      }
    } catch (error) {
      console.error("Error al cargar escuela:", error);
    }
  };

  const fetchProfesores = async () => {
    try {
      setLoading(true);
      const res = await api.get(services.profesores, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setProfesores(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Error al cargar profesores:", error);
      showToast("Error al cargar profesores", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(
      () => setToast({show: false, message: "", type: "success"}),
      3000
    );
  };

  // Función para generar contraseña aleatoria segura
  const generarPassword = () => {
    const caracteres =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length)
      );
    }
    return password;
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
    if (formErrors[name]) {
      setFormErrors((prev) => ({...prev, [name]: ""}));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (!formData.apellido.trim())
      errors.apellido = "El apellido es obligatorio";
    if (!formData.email.trim()) errors.email = "El email es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      errors.email = "Email inválido";
    if (!formData.cedula.trim()) errors.cedula = "La cédula es obligatoria";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const passwordGenerado = generarPassword();

      const data = new FormData();
      data.append("nombre", formData.nombre);
      data.append("apellido", formData.apellido);
      data.append("email", formData.email);
      data.append("password", passwordGenerado);
      data.append("telefono", formData.telefono || "");
      data.append("especialidad", formData.especialidad || "");
      data.append("cedula", formData.cedula);

      await api.post(services.profesores, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Mostrar credenciales en modal
      setCredencialesGeneradas({
        email: formData.email,
        password: passwordGenerado,
      });
      setShowModal(false);
      setShowCredencialesModal(true);
      resetForm();
      fetchProfesores();
      showToast("Profesor registrado exitosamente", "success");
    } catch (error) {
      console.error("Error al crear profesor:", error);
      showToast(
        error.response?.data?.message || "Error al registrar profesor",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await api.put(
        `${services.profesores}/${profesorSeleccionado.id_profesor}`,
        formData,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      showToast("Profesor actualizado exitosamente", "success");
      setShowEditModal(false);
      resetForm();
      fetchProfesores();
    } catch (error) {
      console.error("Error al actualizar profesor:", error);
      showToast(
        error.response?.data?.message || "Error al actualizar profesor",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      especialidad: "",
      cedula: "",
    });
    setFormErrors({});
    setProfesorSeleccionado(null);
  };

  const abrirDetalle = async (profesor) => {
    setProfesorSeleccionado(profesor);
    setShowDetailModal(true);
    setLoadingCarga(true);
    setCargaAcademica([]);

    try {
      const res = await api.get(
        `/api/profesores/${profesor.id_profesor}/carga`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setCargaAcademica(res.data?.data || res.data || []);
    } catch (error) {
      console.error("Error al cargar carga académica:", error);
      showToast("Error al cargar las asignaciones del profesor", "error");
    } finally {
      setLoadingCarga(false);
    }
  };

  const abrirEditar = (profesor) => {
    setProfesorSeleccionado(profesor);
    setFormData({
      nombre: profesor.nombre || "",
      apellido: profesor.apellido || "",
      email: profesor.email || "",
      telefono: profesor.telefono || "",
      especialidad: profesor.especialidad || "",
      cedula: profesor.cedula || "",
    });
    setShowEditModal(true);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    // Header con logo si existe
    if (escuela?.logo) {
      try {
        doc.addImage(
          `http://localhost:4000${escuela.logo}`,
          "PNG",
          14,
          10,
          30,
          30
        );
      } catch (error) {
        console.error("Error al cargar logo:", error);
      }
    }

    // Título
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text(escuela?.nombre || "Sistema de Gestión Escolar", 50, 20);

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Reporte de Profesores", 50, 28);

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-ES")}`, 50, 34);

    // Tabla
    const tableData = profesores.map((p) => [
      `${p.nombre} ${p.apellido}`,
      p.email || "N/A",
      p.telefono || "N/A",
      p.especialidad || "N/A",
      p.total_clases || 0,
    ]);

    doc.autoTable({
      startY: 45,
      head: [["Nombre", "Email", "Teléfono", "Especialidad", "Clases"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        {align: "center"}
      );
    }

    doc.save(`Profesores_${new Date().toISOString().split("T")[0]}.pdf`);
    showToast("PDF generado exitosamente", "success");
  };

  const filteredProfesores = profesores.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.especialidad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProfesores = profesores.length;
  const totalAsignaturas = profesores.reduce(
    (acc, curr) => acc + (parseInt(curr.total_clases) || 0),
    0
  );
  const especialidadesUnicas = new Set(
    profesores.map((p) => p.especialidad).filter(Boolean)
  ).size;

  const headerStats = [
    {
      label: "Total Profesores",
      value: totalProfesores,
      color: "from-indigo-500 to-purple-700",
      icon: UserCircleIcon,
    },
    {
      label: "Asignaturas Asignadas",
      value: totalAsignaturas,
      color: "from-blue-500 to-cyan-600",
      icon: BookOpenIcon,
    },
    {
      label: "Especialidades",
      value: especialidadesUnicas,
      color: "from-emerald-500 to-teal-600",
      icon: AcademicCapIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div
            className={`px-6 py-4 rounded-xl shadow-2xl border-2 flex items-center gap-3 ${
              toast.type === "success"
                ? "bg-green-900 border-green-500 text-green-100"
                : "bg-red-900 border-red-500 text-red-100"
            }`}
          >
            {toast.type === "success" && (
              <CheckCircleIcon className="w-6 h-6 text-green-400" />
            )}
            <p className="font-semibold">{toast.message}</p>
          </div>
        </div>
      )}

      <PageHeader
        title="Gestión de Profesores"
        subtitle="Administra el personal docente, asignaciones académicas y perfiles"
        icon={AcademicCapIcon}
        gradientFrom="indigo-600"
        gradientTo="purple-600"
        badge="Personal Docente"
        schoolLogo={
          escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
        }
        schoolName={escuela?.nombre}
        stats={headerStats}
        actions={
          <>
            <button
              onClick={exportarPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors border border-white/10"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Exportar PDF
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/30"
            >
              <PlusIcon className="w-5 h-5" />
              Agregar Profesor
            </button>
          </>
        }
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o especialidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Profesores Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredProfesores.length === 0 ? (
        <div className="bg-gray-800 rounded-2xl shadow-sm border-2 border-gray-700 p-12 text-center">
          <AcademicCapIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No hay profesores registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfesores.map((profesor) => (
            <div
              key={profesor.id_profesor}
              className="bg-gray-800 rounded-2xl shadow-sm border-2 border-gray-700 hover:border-indigo-500 hover:shadow-xl transition-all duration-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                <div className="flex items-center gap-4">
                  {profesor.foto_url ? (
                    <img
                      src={`http://localhost:4000${profesor.foto_url}`}
                      alt={`${profesor.nombre} ${profesor.apellido}`}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white/20 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <UserCircleIcon className="w-10 h-10 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">
                      {profesor.nombre} {profesor.apellido}
                    </h3>
                    {profesor.especialidad && (
                      <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium mt-1">
                        {profesor.especialidad}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <EnvelopeIcon className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm truncate">{profesor.email}</span>
                  {profesor.email_verificado ? (
                    <CheckBadgeIcon
                      className="w-5 h-5 text-blue-400 flex-shrink-0"
                      title="Email verificado"
                    />
                  ) : (
                    <span className="text-xs text-amber-400 font-medium flex-shrink-0">
                      (Sin verificar)
                    </span>
                  )}
                </div>

                {profesor.telefono && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <PhoneIcon className="w-5 h-5 text-green-400" />
                    <span className="text-sm">{profesor.telefono}</span>
                  </div>
                )}

                {profesor.cedula && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <IdentificationIcon className="w-5 h-5 text-purple-400" />
                    <span className="text-sm">{profesor.cedula}</span>
                  </div>
                )}

                {profesor.total_clases !== undefined && (
                  <div className="flex items-center gap-3 text-gray-300 pt-3 border-t border-gray-700">
                    <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-semibold">
                      {profesor.total_clases} Materia(s) asignada(s)
                    </span>
                  </div>
                )}

                {/* Botones de Acción */}
                <div className="flex gap-2 pt-3">
                  <button
                    onClick={() => abrirDetalle(profesor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                    Ver Detalle
                  </button>
                  <button
                    onClick={() => abrirEditar(profesor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Profesor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-700">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Registrar Nuevo Profesor
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">
                    Complete la información del docente
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Aviso de contraseña automática */}
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-200 text-sm flex items-start gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Nota:</strong> La contraseña se generará
                    automáticamente y se mostrará al finalizar el registro. El
                    profesor podrá cambiarla después de su primer inicio de
                    sesión.
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.nombre
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.nombre && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.nombre}
                    </p>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.apellido
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.apellido && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.apellido}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.cedula
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-indigo-500"
                    }`}
                  />
                  {formErrors.cedula && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.cedula}
                    </p>
                  )}
                </div>

                {/* Especialidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    placeholder="Ej: Matemáticas, Ciencias..."
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg transition-all duration-200 ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Registrando...
                    </div>
                  ) : (
                    "Registrar Profesor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Profesor - Diseño Moderno */}
      {showDetailModal && profesorSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden border border-gray-700/50">
            {/* Header con gradiente y patrón */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-8 overflow-hidden">
              {/* Patrón decorativo */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>

              <div className="relative flex items-start justify-between">
                <div className="flex items-center gap-6">
                  {/* Foto del profesor con diseño mejorado */}
                  <div className="relative">
                    {profesorSeleccionado.foto_url ? (
                      <img
                        src={`http://localhost:4000${profesorSeleccionado.foto_url}`}
                        alt={`${profesorSeleccionado.nombre} ${profesorSeleccionado.apellido}`}
                        className="w-24 h-24 rounded-2xl border-4 border-white/30 shadow-2xl object-cover backdrop-blur-sm"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl border-4 border-white/30 shadow-2xl flex items-center justify-center">
                        <UserCircleIcon className="w-16 h-16 text-white/80" />
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white/30">
                      <CheckCircleIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">
                      {profesorSeleccionado.nombre}{" "}
                      {profesorSeleccionado.apellido}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      {profesorSeleccionado.especialidad && (
                        <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-sm rounded-full font-semibold border border-white/30">
                          🎓 {profesorSeleccionado.especialidad}
                        </span>
                      )}
                      <span className="px-4 py-1.5 bg-green-500/30 backdrop-blur-md text-green-100 text-sm rounded-full font-semibold border border-green-400/30">
                        ✓ Activo
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Contenido con scroll */}
            <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-8">
              <div className="space-y-6">
                {/* Cards de estadísticas mejoradas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 rounded-2xl p-5 border border-indigo-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/20 rounded-xl">
                        <BookOpenIcon className="w-8 h-8 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {profesorSeleccionado.total_clases || 0}
                        </p>
                        <p className="text-indigo-300 text-sm font-medium">
                          Materias Asignadas
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl p-5 border border-purple-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <AcademicCapIcon className="w-8 h-8 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {cargaAcademica.length}
                        </p>
                        <p className="text-purple-300 text-sm font-medium">
                          Grupos Activos
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 rounded-2xl p-5 border border-pink-500/30">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-pink-500/20 rounded-xl">
                        <CalendarIcon className="w-8 h-8 text-pink-400" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-white">
                          {new Date().getFullYear()}
                        </p>
                        <p className="text-pink-300 text-sm font-medium">
                          Año Actual
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de contacto moderna */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                  <h5 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <IdentificationIcon className="w-6 h-6 text-indigo-400" />
                    Información de Contacto
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex items-center gap-4 bg-gray-700/30 rounded-xl p-4">
                      <div className="p-3 bg-indigo-500/20 rounded-lg">
                        <EnvelopeIcon className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                          Email
                        </p>
                        <p className="text-white font-semibold">
                          {profesorSeleccionado.email}
                        </p>
                      </div>
                    </div>

                    {profesorSeleccionado.telefono && (
                      <div className="flex items-center gap-4 bg-gray-700/30 rounded-xl p-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                          <PhoneIcon className="w-6 h-6 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                            Teléfono
                          </p>
                          <p className="text-white font-semibold">
                            {profesorSeleccionado.telefono}
                          </p>
                        </div>
                      </div>
                    )}

                    {profesorSeleccionado.cedula && (
                      <div className="flex items-center gap-4 bg-gray-700/30 rounded-xl p-4">
                        <div className="p-3 bg-purple-500/20 rounded-lg">
                          <IdentificationIcon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                            Cédula
                          </p>
                          <p className="text-white font-semibold">
                            {profesorSeleccionado.cedula}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Carga Académica - Grados y Secciones */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                  <h5 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <BookOpenIcon className="w-6 h-6 text-indigo-400" />
                    Asignaciones Académicas
                  </h5>

                  {loadingCarga ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                    </div>
                  ) : cargaAcademica.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpenIcon className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-lg">
                        No tiene asignaciones académicas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cargaAcademica.map((carga, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-r from-gray-700/40 to-gray-700/20 rounded-xl p-5 border border-gray-600/50 hover:border-indigo-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/10"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                  <BookOpenIcon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                  <h6 className="text-lg font-bold text-white">
                                    {carga.materia_nombre ||
                                      "Materia sin nombre"}
                                  </h6>
                                  {carga.codigo_materia && (
                                    <p className="text-xs text-gray-400 font-mono">
                                      Código: {carga.codigo_materia}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                                  <AcademicCapIcon className="w-4 h-4 text-purple-400" />
                                  <span className="text-sm font-semibold text-purple-300">
                                    {carga.grado_nombre || "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/20 rounded-lg border border-pink-500/30">
                                  <MapPinIcon className="w-4 h-4 text-pink-400" />
                                  <span className="text-sm font-semibold text-pink-300">
                                    Sección {carga.seccion_nombre || "N/A"}
                                  </span>
                                </div>

                                {carga.dia_nombre && carga.horario_formato && (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-500/30">
                                    <CalendarIcon className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-semibold text-green-300">
                                      {carga.dia_nombre} •{" "}
                                      {carga.horario_formato}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer con botones */}
            <div className="bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50 px-8 py-5">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-all duration-200 border border-gray-600"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    abrirEditar(profesorSeleccionado);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-purple-500/50"
                >
                  ✏️ Editar Profesor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Profesor */}
      {showEditModal && profesorSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gray-700">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Editar Profesor
                  </h3>
                  <p className="text-purple-100 text-sm mt-1">
                    Actualice la información del docente
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEdit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.nombre
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-purple-500"
                    }`}
                  />
                  {formErrors.nombre && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.nombre}
                    </p>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.apellido
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-purple-500"
                    }`}
                  />
                  {formErrors.apellido && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.apellido}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-purple-500"
                    }`}
                  />
                  {formErrors.email && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                {/* Cédula */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cédula *
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-gray-700 border-2 rounded-xl text-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.cedula
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-600 focus:ring-purple-500"
                    }`}
                  />
                  {formErrors.cedula && (
                    <p className="text-red-400 text-xs mt-1">
                      {formErrors.cedula}
                    </p>
                  )}
                </div>

                {/* Especialidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    placeholder="Ej: Matemáticas, Ciencias..."
                    className="w-full px-4 py-3 bg-gray-700 border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium shadow-lg transition-all duration-200 ${
                    isSubmitting
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105 hover:shadow-xl"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Actualizando...
                    </div>
                  ) : (
                    "Actualizar Profesor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Credenciales Generadas */}
      {showCredencialesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl w-full max-w-md border-2 border-green-500/50">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    ¡Profesor Registrado!
                  </h3>
                  <p className="text-green-100 text-sm mt-1">
                    Credenciales de acceso
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                <p className="text-yellow-200 text-sm flex items-start gap-2">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <strong>Importante:</strong> Guarda estas credenciales. No
                    se mostrarán nuevamente.
                  </span>
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Correo Electrónico
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">
                    <p className="text-white font-mono text-sm">
                      {credencialesGeneradas.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        credencialesGeneradas.email
                      );
                      showToast("Email copiado", "success");
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Copiar email"
                  >
                    <svg
                      className="w-5 h-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Contraseña Temporal
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3">
                    <p className="text-white font-mono text-lg font-bold tracking-wider">
                      {credencialesGeneradas.password}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        credencialesGeneradas.password
                      );
                      showToast("Contraseña copiada", "success");
                    }}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Copiar contraseña"
                  >
                    <svg
                      className="w-5 h-5 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  El profesor deberá cambiar su contraseña después del primer
                  inicio de sesión.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-8">
              <button
                onClick={() => setShowCredencialesModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profesores;
