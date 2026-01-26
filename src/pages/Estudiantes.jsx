import {useEffect, useState} from "react";
import api from "../api/axiosConfig";
import services from "../api/services";
import {hasPermission} from "../config/roles";
import FormularioEstudianteCompleto from "../components/FormularioEstudianteCompleto";
import PageHeader from "../components/PageHeader";
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  HeartIcon,
  HomeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {CheckCircleIcon as CheckCircleSolid} from "@heroicons/react/24/solid";

const API_BASE_URL = "http://localhost:4000";

function Estudiantes() {
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [estudiantes, setEstudiantes] = useState([]);
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState([]);

  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosPorDepartamento, setMunicipiosPorDepartamento] = useState(
    {}
  );
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrado, setFilterGrado] = useState("");
  const [filterSeccion, setFilterSeccion] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [estudianteDetalle, setEstudianteDetalle] = useState(null);
  const [estudianteEditar, setEstudianteEditar] = useState(null);
  const [estudianteToDelete, setEstudianteToDelete] = useState(null);

  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    fecha_nacimiento: "",
    genero: "",
    codigo_mined: "",
    direccion: "",
    telefono: "",
    pin: "",
    id_grado: "",
    id_seccion: "",
    municipio: "",
    departamento: "",
    edad: "",
    nacionalidad: "Nicaragüense",
    etnia: "",
    enfermedad: "",
    direccion_exacta: "",
    movil_alumno: "",
    nombre_padre: "",
    correo_padre: "",
    telefono_padre: "",
    turno: "",
    nivel_educativo: "",
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [documentoSaludFile, setDocumentoSaludFile] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

  const cargarDatosNicaragua = async () => {
    try {
      const res = await api.get(services.nicaraguaTodos);
      const {departamentos: deps, municipiosPorDepartamento: muns} = res.data;
      setDepartamentos(deps || []);
      setMunicipiosPorDepartamento(muns || {});
    } catch (error) {
      console.error("❌ Error al cargar datos de Nicaragua:", error);
    }
  };

  const cargarGrados = async () => {
    try {
      const res = await api.get(services.grados, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = res.data?.data || res.data || [];
      setGrados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "❌ Error al cargar grados:",
        error.response?.data || error.message
      );
      showToast("Error al cargar grados", "error");
      setGrados([]);
    }
  };

  const cargarSecciones = async () => {
    try {
      const res = await api.get(services.secciones, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data;
      setSecciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "❌ Error al cargar secciones:",
        error.response?.data || error.message
      );
      showToast("Error al cargar secciones", "error");
      setSecciones([]);
    }
  };

  const cargarSeccionesPorGrado = async (idGrado) => {
    try {
      const res = await api.get(services.secciones, {
        params: {id_grado: idGrado},
      });
      const seccionesData = Array.isArray(res.data?.data) ? res.data.data : [];
      setSeccionesDisponibles(seccionesData);
    } catch (error) {
      console.error(
        "❌ Error al cargar secciones del grado:",
        error.response?.data || error.message
      );
      showToast("Error al cargar secciones del grado", "error");
      setSeccionesDisponibles([]);
    }
  };

  const cargarEstudiantes = async () => {
    try {
      const res = await api.get(services.alumnos, {
        headers: {Authorization: `Bearer ${token}`},
      });
      const data = res.data?.data || res.data || [];
      setEstudiantes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(
        "❌ Error al cargar estudiantes:",
        error.response?.data || error.message
      );
      showToast("Error al cargar estudiantes", "error");
      setEstudiantes([]);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });

      const userRole = res.data.usuario?.rol || res.data.rol;
      setUser({
        rol: userRole,
        id_profesor: res.data.usuario?.id_profesor || res.data.id_profesor,
        id_escuela: res.data.usuario?.id_escuela || res.data.id_escuela,
        ...res.data.usuario,
      });

      const escuelaId = res.data.usuario?.id_escuela || res.data.id_escuela;
      if (escuelaId) {
        const escuelaRes = await api.get(`/api/escuelas/${escuelaId}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        setEscuela(escuelaRes.data);
      }
    } catch (error) {
      console.error("❌ Error al obtener usuario:", error);
      showToast("Error al cargar información del usuario", "error");
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      await fetchUser();
      if (!mounted) return;

      await Promise.all([
        cargarGrados(),
        cargarSecciones(),
        cargarDatosNicaragua(),
        cargarEstudiantes(),
      ]);
      if (!mounted) return;

      setIsLoading(false);
    };

    init();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (formData.id_grado) {
      cargarSeccionesPorGrado(formData.id_grado);
    } else {
      setSeccionesDisponibles([]);
      setFormData((prev) => ({...prev, id_seccion: ""}));
    }
    // eslint-disable-next-line
  }, [formData.id_grado]);

  useEffect(() => {
    if (formData.fecha_nacimiento) {
      const hoy = new Date();
      const nacimiento = new Date(formData.fecha_nacimiento);
      let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edadCalculada--;
      }
      if (edadCalculada >= 0) {
        setFormData((prev) => ({...prev, edad: edadCalculada.toString()}));
      }
    }
  }, [formData.fecha_nacimiento]);

  useEffect(() => {
    if (
      formData.departamento &&
      municipiosPorDepartamento[formData.departamento]
    ) {
      setMunicipiosFiltrados(municipiosPorDepartamento[formData.departamento]);
    } else {
      setMunicipiosFiltrados([]);
    }
    setFormData((prev) => ({...prev, municipio: ""}));
    // eslint-disable-next-line
  }, [formData.departamento]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagenFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagen(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentoSaludChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentoSaludFile(file);
    }
  };

  const resetFormulario = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      fecha_nacimiento: "",
      genero: "",
      codigo_mined: "",
      direccion: "",
      telefono: "",
      pin: "",
      id_grado: "",
      id_seccion: "",
    });
    setImagenFile(null);
    setPreviewImagen(null);
    setEstudianteEditar(null);
  };

  // ============ CRUD OPERATIONS ============
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre || !formData.apellido || !formData.email) {
      showToast(
        "Por favor complete los campos obligatorios: Nombre, Apellido y Email",
        "error"
      );
      return;
    }

    // Validar que se haya seleccionado grado y sección
    if (!formData.id_grado || !formData.id_seccion) {
      showToast(
        "Por favor seleccione el grado y la sección del estudiante",
        "error"
      );
      return;
    }

    const formDataToSend = new FormData();

    // Datos personales
    formDataToSend.append("nombre", formData.nombre);
    formDataToSend.append("apellido", formData.apellido);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("fecha_nacimiento", formData.fecha_nacimiento || "");
    formDataToSend.append("edad", formData.edad || "");
    formDataToSend.append("genero", formData.genero || "");
    formDataToSend.append("nacionalidad", formData.nacionalidad || "");
    formDataToSend.append("etnia", formData.etnia || "");
    formDataToSend.append("enfermedad", formData.enfermedad || "");
    formDataToSend.append("codigo_mined", formData.codigo_mined || "");

    // Datos de ubicación
    formDataToSend.append("direccion", formData.direccion || "");
    formDataToSend.append("direccion_exacta", formData.direccion_exacta || "");
    formDataToSend.append("departamento", formData.departamento || "");
    formDataToSend.append("municipio", formData.municipio || "");
    formDataToSend.append("telefono", formData.telefono || "");
    formDataToSend.append("movil_alumno", formData.movil_alumno || "");

    // Datos del tutor
    formDataToSend.append("nombre_padre", formData.nombre_padre || "");
    formDataToSend.append("correo_padre", formData.correo_padre || "");
    formDataToSend.append("telefono_padre", formData.telefono_padre || "");

    // Datos académicos
    formDataToSend.append("id_seccion", formData.id_seccion);
    formDataToSend.append("turno", formData.turno || "");
    formDataToSend.append("nivel_educativo", formData.nivel_educativo || "");

    // PIN / contraseña inicial
    formDataToSend.append(
      "pin",
      formData.pin || `${formData.apellido.split(" ")[0].toLowerCase()}123`
    );

    // Imagen
    if (imagenFile) {
      formDataToSend.append("imagen", imagenFile);
    }

    // Documento de salud (epicrisis/recetas)
    if (documentoSaludFile) {
      formDataToSend.append("documento_salud", documentoSaludFile);
    }

    try {
      // Crear el estudiante (esto creará usuario + estudiante + usuarios_escuelas)
      const resEstudiante = await api.post(services.alumnos, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Matricular al estudiante en la sección seleccionada
      await api.post(
        `${services.alumnos}/matricula`,
        {
          id_estudiante: resEstudiante.data.estudiante.id_estudiante,
          id_seccion: formData.id_seccion,
          estado: "Activo",
        },
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      showToast("Estudiante registrado y matriculado exitosamente", "success");
      setShowModal(false);
      resetFormulario();
      cargarEstudiantes();
    } catch (error) {
      console.error("Error al registrar estudiante:", error);
      const errorMsg =
        error.response?.data?.error || "Error al registrar el estudiante";
      showToast(errorMsg, "error");
    }
  };

  const handleEdit = (estudiante) => {
    setEstudianteEditar(estudiante);

    // Formatear fecha de nacimiento para el input type="date" (YYYY-MM-DD)
    let fechaFormateada = "";
    if (estudiante.fecha_nacimiento) {
      try {
        const fecha = new Date(estudiante.fecha_nacimiento);
        fechaFormateada = fecha.toISOString().split("T")[0];
      } catch (e) {
        console.error("Error al formatear fecha_nacimiento:", e);
        fechaFormateada = "";
      }
    }
    setFormData({
      // Datos personales
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      email: estudiante.email,
      fecha_nacimiento: fechaFormateada,
      edad: estudiante.edad || "",
      genero: estudiante.genero || "",
      nacionalidad: estudiante.nacionalidad || "Nicaragüense",
      etnia: estudiante.etnia || "",
      enfermedad: estudiante.enfermedad || "",
      codigo_mined: estudiante.codigo_mined || "",
      pin: "",
      // Datos de ubicación
      direccion: estudiante.direccion || "",
      direccion_exacta: estudiante.direccion_exacta || "",
      departamento: estudiante.departamento || "",
      municipio: estudiante.municipio || "",
      telefono: estudiante.telefono || "",
      movil_alumno: estudiante.movil_alumno || "",
      // Datos del tutor
      nombre_padre: estudiante.nombre_padre || "",
      correo_padre: estudiante.correo_padre || "",
      telefono_padre: estudiante.telefono_padre || "",
      // Datos académicos
      id_grado: estudiante.matricula_actual?.id_grado || "",
      id_seccion: estudiante.matricula_actual?.id_seccion || "",
      turno: estudiante.turno || "",
      nivel_educativo: estudiante.nivel_educativo || "",
    });

    if (estudiante.foto_url || estudiante.imagen_url) {
      setPreviewImagen(
        `${API_BASE_URL}${estudiante.foto_url || estudiante.imagen_url}`
      );
    }

    // Si tiene departamento, cargar municipios
    if (
      estudiante.departamento &&
      municipiosPorDepartamento[estudiante.departamento]
    ) {
      setMunicipiosFiltrados(
        municipiosPorDepartamento[estudiante.departamento]
      );
    }

    // Si tiene grado, cargar secciones
    if (estudiante.matricula_actual?.id_grado) {
      cargarSeccionesPorGrado(estudiante.matricula_actual.id_grado);
    }

    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido || !formData.email) {
      showToast("Por favor complete los campos obligatorios", "error");
      return;
    }

    const formDataToSend = new FormData();
    // Datos personales
    formDataToSend.append("nombre", formData.nombre);
    formDataToSend.append("apellido", formData.apellido);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("fecha_nacimiento", formData.fecha_nacimiento || "");
    formDataToSend.append("edad", formData.edad || "");
    formDataToSend.append("genero", formData.genero || "");
    formDataToSend.append("nacionalidad", formData.nacionalidad || "");
    formDataToSend.append("etnia", formData.etnia || "");
    formDataToSend.append("enfermedad", formData.enfermedad || "");
    formDataToSend.append("codigo_mined", formData.codigo_mined || "");
    // Datos de ubicación
    formDataToSend.append("direccion", formData.direccion || "");
    formDataToSend.append("direccion_exacta", formData.direccion_exacta || "");
    formDataToSend.append("departamento", formData.departamento || "");
    formDataToSend.append("municipio", formData.municipio || "");
    formDataToSend.append("telefono", formData.telefono || "");
    formDataToSend.append("movil_alumno", formData.movil_alumno || "");
    // Datos del tutor
    formDataToSend.append("nombre_padre", formData.nombre_padre || "");
    formDataToSend.append("correo_padre", formData.correo_padre || "");
    formDataToSend.append("telefono_padre", formData.telefono_padre || "");
    // Datos académicos
    formDataToSend.append("turno", formData.turno || "");
    formDataToSend.append("nivel_educativo", formData.nivel_educativo || "");

    if (imagenFile) {
      formDataToSend.append("imagen", imagenFile);
    }

    if (documentoSaludFile) {
      formDataToSend.append("documento_salud", documentoSaludFile);
    }

    try {
      await api.put(
        `${services.alumnos}/${estudianteEditar.id_estudiante}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      showToast("Estudiante actualizado exitosamente", "success");
      setShowEditModal(false);
      resetFormulario();
      cargarEstudiantes();
    } catch (error) {
      console.error("Error al actualizar estudiante:", error);
      const errorMsg =
        error.response?.data?.error || "Error al actualizar el estudiante";
      showToast(errorMsg, "error");
    }
  };

  const confirmDelete = (estudiante) => {
    setEstudianteToDelete(estudiante);
    setShowConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!estudianteToDelete) return;

    try {
      await api.delete(
        `${services.alumnos}/${estudianteToDelete.id_estudiante}`,
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );

      showToast("Estudiante eliminado exitosamente", "success");
      setShowConfirmDelete(false);
      setEstudianteToDelete(null);
      cargarEstudiantes();
    } catch (error) {
      console.error("Error al eliminar estudiante:", error);
      const errorMsg =
        error.response?.data?.error || "Error al eliminar el estudiante";
      showToast(errorMsg, "error");
    }
  };

  // ============ FUNCIÓN VER DETALLE ============
  const handleVerDetalle = (estudiante) => {
    setEstudianteDetalle(estudiante);
    setShowDetalleModal(true);
  };

  const cerrarDetalleModal = () => {
    setShowDetalleModal(false);
    setEstudianteDetalle(null);
  };

  // ============ FUNCIÓN EXPORTAR PDF ============
  const exportarPDF = () => {
    if (!estudianteDetalle || generatingPDF) return;

    setGeneratingPDF(true);

    // Crear una ventana temporal con el contenido a imprimir
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast(
        "No se pudo abrir la ventana de impresión. Revisa si el navegador bloqueó los pop-ups.",
        "error"
      );
      setGeneratingPDF(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha de Estudiante - ${estudianteDetalle.nombre} ${
      estudianteDetalle.apellido
    }</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; background: white; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #1e40af; margin-bottom: 10px; font-size: 28px; }
          .header p { color: #6b7280; font-size: 14px; }
          .foto-container { text-align: center; margin: 20px 0; }
          .foto { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #3b82f6; }
          .seccion { margin-bottom: 25px; page-break-inside: avoid; }
          .seccion-titulo { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; padding: 12px 20px; border-radius: 8px; font-size: 16px; font-weight: bold; margin-bottom: 15px; }
          .datos-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .dato { padding: 12px; background: #f3f4f6; border-radius: 6px; }
          .dato-label { font-weight: bold; color: #4b5563; font-size: 12px; margin-bottom: 4px; }
          .dato-valor { color: #111827; font-size: 14px; }
          .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>FICHA COMPLETA DE ESTUDIANTE</h1>
          <p>Sistema de Gestión Escolar</p>
        </div>

        ${
          estudianteDetalle.foto_url
            ? `
          <div class="foto-container">
            <img src="${API_BASE_URL}${estudianteDetalle.foto_url}" alt="Foto" class="foto" />
          </div>
        `
            : ""
        }

        <div class="seccion">
          <div class="seccion-titulo">📋 INFORMACIÓN PERSONAL</div>
          <div class="datos-grid">
            <div class="dato">
              <div class="dato-label">Nombre Completo</div>
              <div class="dato-valor">${estudianteDetalle.nombre} ${
      estudianteDetalle.apellido
    }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Código MINED</div>
              <div class="dato-valor">${
                estudianteDetalle.codigo_mined || "No asignado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Fecha de Nacimiento</div>
              <div class="dato-valor">${
                estudianteDetalle.fecha_nacimiento
                  ? new Date(
                      estudianteDetalle.fecha_nacimiento
                    ).toLocaleDateString("es-NI")
                  : "No especificado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Edad</div>
              <div class="dato-valor">${
                estudianteDetalle.edad || "No especificado"
              } años</div>
            </div>
            <div class="dato">
              <div class="dato-label">Género</div>
              <div class="dato-valor">${
                estudianteDetalle.genero || "No especificado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Nacionalidad</div>
              <div class="dato-valor">${
                estudianteDetalle.nacionalidad || "Nicaragüense"
              }</div>
            </div>
            ${
              estudianteDetalle.etnia
                ? `
              <div class="dato">
                <div class="dato-label">Etnia</div>
                <div class="dato-valor">${estudianteDetalle.etnia}</div>
              </div>
            `
                : ""
            }
            ${
              estudianteDetalle.enfermedad
                ? `
              <div class="dato">
                <div class="dato-label">Condición de Salud</div>
                <div class="dato-valor">${estudianteDetalle.enfermedad}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="seccion">
          <div class="seccion-titulo">📍 INFORMACIÓN DE CONTACTO</div>
          <div class="datos-grid">
            <div class="dato">
              <div class="dato-label">Email</div>
              <div class="dato-valor">${estudianteDetalle.email}</div>
            </div>
            <div class="dato">
              <div class="dato-label">Teléfono Fijo</div>
              <div class="dato-valor">${
                estudianteDetalle.telefono || "No especificado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Móvil del Alumno</div>
              <div class="dato-valor">${
                estudianteDetalle.movil_alumno || "No especificado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Departamento</div>
              <div class="dato-valor">${
                estudianteDetalle.departamento || "No especificado"
              }</div>
            </div>
            <div class="dato">
              <div class="dato-label">Municipio</div>
              <div class="dato-valor">${
                estudianteDetalle.municipio || "No especificado"
              }</div>
            </div>
            ${
              estudianteDetalle.direccion_exacta
                ? `
              <div class="dato" style="grid-column: span 2;">
                <div class="dato-label">Dirección Exacta</div>
                <div class="dato-valor">${estudianteDetalle.direccion_exacta}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        ${
          estudianteDetalle.nombre_padre ||
          estudianteDetalle.correo_padre ||
          estudianteDetalle.telefono_padre
            ? `
          <div class="seccion">
            <div class="seccion-titulo">👨‍👩‍👧 INFORMACIÓN DEL TUTOR</div>
            <div class="datos-grid">
              ${
                estudianteDetalle.nombre_padre
                  ? `
                <div class="dato">
                  <div class="dato-label">Nombre del Padre/Tutor</div>
                  <div class="dato-valor">${estudianteDetalle.nombre_padre}</div>
                </div>
              `
                  : ""
              }
              ${
                estudianteDetalle.correo_padre
                  ? `
                <div class="dato">
                  <div class="dato-label">Email del Padre/Tutor</div>
                  <div class="dato-valor">${estudianteDetalle.correo_padre}</div>
                </div>
              `
                  : ""
              }
              ${
                estudianteDetalle.telefono_padre
                  ? `
                <div class="dato">
                  <div class="dato-label">Teléfono del Padre/Tutor</div>
                  <div class="dato-valor">${estudianteDetalle.telefono_padre}</div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <div class="seccion">
          <div class="seccion-titulo">🎓 INFORMACIÓN ACADÉMICA</div>
          <div class="datos-grid">
            ${
              estudianteDetalle.matricula_actual
                ? `
              <div class="dato">
                <div class="dato-label">Grado y Sección</div>
                <div class="dato-valor">${estudianteDetalle.matricula_actual.seccion_nombre}</div>
              </div>
              <div class="dato">
                <div class="dato-label">Estado de Matrícula</div>
                <div class="dato-valor">${estudianteDetalle.matricula_actual.estado}</div>
              </div>
            `
                : `
              <div class="dato" style="grid-column: span 2;">
                <div class="dato-label">Estado de Matrícula</div>
                <div class="dato-valor">Sin Matrícula Activa</div>
              </div>
            `
            }
            ${
              estudianteDetalle.turno
                ? `
              <div class="dato">
                <div class="dato-label">Turno</div>
                <div class="dato-valor">${estudianteDetalle.turno}</div>
              </div>
            `
                : ""
            }
            ${
              estudianteDetalle.nivel_educativo
                ? `
              <div class="dato">
                <div class="dato-label">Nivel Educativo</div>
                <div class="dato-valor">${estudianteDetalle.nivel_educativo}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="footer">
          <p>Documento generado el ${new Date().toLocaleDateString("es-NI", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
          <p>Sistema de Gestión Escolar © ${new Date().getFullYear()}</p>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();

    // Esperar a que carguen las imágenes antes de imprimir
    setTimeout(() => {
      try {
        printWindow.print();
        printWindow.close();
      } finally {
        setGeneratingPDF(false);
      }
    }, 500);
  };

  // ============ FUNCIONES DE UI ============
  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(() => {
      setToast({show: false, message: "", type: "success"});
    }, 3000);
  };

  const abrirModalNuevo = () => {
    resetFormulario();
    setShowModal(true);
  };

  // ============ FILTRADO DE ESTUDIANTES ============
  const estudiantesFiltrados = estudiantes.filter((est) => {
    // Búsqueda por nombre o apellido
    const searchMatch =
      searchTerm === "" ||
      est.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.codigo_mined?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por grado
    const gradoMatch =
      filterGrado === "" ||
      est.matricula_actual?.id_grado === parseInt(filterGrado);

    // Filtro por sección
    const seccionMatch =
      filterSeccion === "" ||
      est.matricula_actual?.id_seccion === parseInt(filterSeccion);

    // Filtro por estado de matrícula
    let estadoMatch = true;
    if (filterEstado === "matriculados") {
      estadoMatch = est.matricula_actual !== null;
    } else if (filterEstado === "sin_matricula") {
      estadoMatch = est.matricula_actual === null;
    }

    return searchMatch && gradoMatch && seccionMatch && estadoMatch;
  });

  // ============ OBTENER SECCIONES FILTRADAS POR GRADO ============
  const seccionesFiltradas = filterGrado
    ? secciones.filter((s) => s.id_grado === parseInt(filterGrado))
    : [];

  // ============ VERIFICAR PERMISOS ============
  const puedeCrear = user && hasPermission(user.rol, "alumnos", "crear");
  const puedeEditar = user && hasPermission(user.rol, "alumnos", "editar");
  const puedeEliminar = user && hasPermission(user.rol, "alumnos", "eliminar");

  // ============ RENDER ============
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalEstudiantes = estudiantes.length;
  const totalMatriculados = estudiantes.filter(
    (e) => e.matricula_actual
  ).length;
  const totalSinMatricula = estudiantes.filter(
    (e) => !e.matricula_actual
  ).length;

  const headerStats = [
    {
      label: "Total estudiantes",
      value: totalEstudiantes,
      color: "from-blue-500 to-blue-700",
      icon: UserIcon,
    },
    {
      label: "Matriculados",
      value: totalMatriculados,
      color: "from-green-500 to-emerald-700",
      icon: CheckCircleSolid,
    },
    {
      label: "Sin matrícula",
      value: totalSinMatricula,
      color: "from-orange-500 to-red-600",
      icon: ExclamationTriangleIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-down">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-900 text-green-100 border border-green-700"
                : "bg-red-900 text-red-100 border border-red-700"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircleSolid className="h-6 w-6 text-green-600" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            )}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Directorio de Estudiantes"
          subtitle="Gestiona el registro, matrícula y datos académicos de los estudiantes"
          icon={AcademicCapIcon}
          gradientFrom="blue-600"
          gradientTo="indigo-600"
          badge="Gestión Académica"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          stats={headerStats}
        />

        {/* Barra de Herramientas */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Buscador */}
            <div className="lg:col-span-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtro por Grado */}
            <div className="lg:col-span-2">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterGrado}
                  onChange={(e) => {
                    setFilterGrado(e.target.value);
                    setFilterSeccion(""); // Reset sección al cambiar grado
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="">Todos los grados</option>
                  {grados.map((grado) => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtro por Sección */}
            <div className="lg:col-span-2">
              <select
                value={filterSeccion}
                onChange={(e) => setFilterSeccion(e.target.value)}
                disabled={!filterGrado}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:bg-gray-800 disabled:cursor-not-allowed"
              >
                <option value="">Todas las secciones</option>
                {seccionesFiltradas.map((seccion) => (
                  <option key={seccion.id_seccion} value={seccion.id_seccion}>
                    {seccion.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="lg:col-span-2">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="todos">Todos</option>
                <option value="matriculados">Matriculados</option>
                <option value="sin_matricula">Sin Matrícula</option>
              </select>
            </div>

            {/* Botón Nuevo Estudiante */}
            {puedeCrear && (
              <div className="lg:col-span-2">
                <button
                  onClick={abrirModalNuevo}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <PlusIcon className="h-5 w-5" />
                  Nuevo Estudiante
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Estudiantes */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
          {estudiantesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-white">
                No se encontraron estudiantes
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || filterGrado || filterSeccion
                  ? "Intente ajustar los filtros de búsqueda"
                  : "Comience registrando un nuevo estudiante"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Código MINED
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Grado / Sección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {estudiantesFiltrados.map((estudiante) => (
                    <tr
                      key={estudiante.id_estudiante}
                      className="hover:bg-gray-750 transition-colors"
                    >
                      {/* Columna: Estudiante (Avatar + Nombre) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {estudiante.foto_url || estudiante.imagen_url ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={`${API_BASE_URL}${
                                  estudiante.foto_url || estudiante.imagen_url
                                }`}
                                alt={`${estudiante.nombre} ${estudiante.apellido}`}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <UserIcon className="h-6 w-6 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {estudiante.nombre} {estudiante.apellido}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <EnvelopeIcon className="h-4 w-4" />
                              {estudiante.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Columna: Código MINED */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {estudiante.codigo_mined || (
                            <span className="text-gray-500 italic">
                              No asignado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna: Grado / Sección */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {estudiante.matricula_actual ? (
                          <div className="flex items-center gap-2">
                            <AcademicCapIcon className="h-5 w-5 text-green-400" />
                            <span className="text-sm font-medium text-gray-200">
                              {estudiante.matricula_actual.seccion_nombre}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                            <span className="text-sm text-orange-600 font-medium">
                              Sin Matrícula
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Columna: Estado */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            estudiante.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {estudiante.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Columna: Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerDetalle(estudiante)}
                            className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-700"
                            title="Ver detalle"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {puedeEditar && (
                            <button
                              onClick={() => handleEdit(estudiante)}
                              className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-700"
                              title="Editar"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                          {puedeEliminar && (
                            <button
                              onClick={() => confirmDelete(estudiante)}
                              className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-700"
                              title="Eliminar"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Nuevo Estudiante */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <PlusIcon className="h-6 w-6 text-blue-400" />
                  Registro de Nuevo Estudiante
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetFormulario();
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="p-6 bg-gray-800">
                <FormularioEstudianteCompleto
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleImageChange={handleImageChange}
                  handleDocumentoSaludChange={handleDocumentoSaludChange}
                  previewImagen={previewImagen}
                  grados={grados}
                  seccionesDisponibles={seccionesDisponibles}
                  departamentos={departamentos}
                  municipiosFiltrados={municipiosFiltrados}
                />

                {/* Botones de Acción */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetFormulario();
                    }}
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Registrar Estudiante
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Editar Estudiante */}
        {showEditModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <PencilIcon className="h-6 w-6 text-green-400" />
                  Editar Estudiante
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetFormulario();
                  }}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 bg-gray-800">
                <FormularioEstudianteCompleto
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleImageChange={handleImageChange}
                  handleDocumentoSaludChange={handleDocumentoSaludChange}
                  previewImagen={previewImagen}
                  grados={grados}
                  seccionesDisponibles={seccionesDisponibles}
                  departamentos={departamentos}
                  municipiosFiltrados={municipiosFiltrados}
                />

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-700 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetFormulario();
                    }}
                    className="px-6 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirmar Eliminación */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-900 bg-opacity-40 rounded-full mb-4">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white text-center mb-2">
                  ¿Eliminar Estudiante?
                </h3>
                <p className="text-sm text-gray-300 text-center mb-6">
                  Esta acción marcará al estudiante como inactivo. Se puede
                  reactivar posteriormente desde la administración.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowConfirmDelete(false);
                      setEstudianteToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ver Detalle del Estudiante */}
        {showDetalleModal && estudianteDetalle && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <div className="relative bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header del Modal */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-t-lg z-10">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-4 border-white/90 shadow-lg bg-white/10">
                    {estudianteDetalle.foto_url ? (
                      <img
                        src={`${API_BASE_URL}${estudianteDetalle.foto_url}`}
                        alt="Foto"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-200 flex items-center justify-center">
                        <UserIcon className="h-8 w-8 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-2xl font-bold text-white truncate">
                      {estudianteDetalle.nombre} {estudianteDetalle.apellido}
                    </h3>
                    <p className="text-blue-100/90 text-sm truncate">
                      {escuela?.nombre
                        ? escuela.nombre
                        : "Ficha Completa del Estudiante"}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {estudianteDetalle.codigo_mined && (
                        <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-white">
                          MINED: {estudianteDetalle.codigo_mined}
                        </span>
                      )}
                      <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold text-white">
                        {estudianteDetalle.matricula_actual
                          ? estudianteDetalle.matricula_actual.seccion_nombre
                          : "Sin matrícula"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={exportarPDF}
                    disabled={generatingPDF}
                    className={`px-4 py-2 rounded-xl text-white transition-all flex items-center gap-2 ${
                      generatingPDF
                        ? "bg-white/20 cursor-not-allowed"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                    title="Exportar PDF"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                      {generatingPDF ? "Generando..." : "Exportar PDF"}
                    </span>
                  </button>
                  <button
                    onClick={cerrarDetalleModal}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-6">
                {/* Sección: Información Personal */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <IdentificationIcon className="h-6 w-6 text-blue-400" />
                    Información Personal
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">
                        Nombre Completo
                      </p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.nombre} {estudianteDetalle.apellido}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Código MINED</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.codigo_mined || "No asignado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">
                        Fecha de Nacimiento
                      </p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.fecha_nacimiento
                          ? new Date(
                              estudianteDetalle.fecha_nacimiento
                            ).toLocaleDateString("es-NI")
                          : "No especificado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Edad</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.edad || "No especificado"} años
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Género</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.genero || "No especificado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Nacionalidad</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.nacionalidad || "Nicaragüense"}
                      </p>
                    </div>
                    {estudianteDetalle.etnia && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Etnia</p>
                        <p className="text-sm text-white font-medium">
                          {estudianteDetalle.etnia}
                        </p>
                      </div>
                    )}
                    {estudianteDetalle.enfermedad && (
                      <div className="bg-gray-800 p-4 rounded-lg md:col-span-2">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <HeartIcon className="h-4 w-4 text-red-400" />
                          Condición de Salud
                        </p>
                        <p className="text-sm text-white font-medium">
                          {estudianteDetalle.enfermedad}
                        </p>
                      </div>
                    )}
                    {estudianteDetalle.documento_salud_url && (
                      <div className="bg-gray-800 p-4 rounded-lg md:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">
                          Documento Médico (Epicrisis / Recetas)
                        </p>
                        <a
                          href={`${API_BASE_URL}${estudianteDetalle.documento_salud_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-300 hover:text-blue-200 underline"
                        >
                          Ver / Descargar documento
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección: Información de Contacto */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MapPinIcon className="h-6 w-6 text-purple-400" />
                    Información de Contacto y Ubicación
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        Email
                      </p>
                      <p className="text-sm text-white font-medium break-all">
                        {estudianteDetalle.email}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        Teléfono Fijo
                      </p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.telefono || "No especificado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <PhoneIcon className="h-4 w-4" />
                        Móvil del Alumno
                      </p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.movil_alumno || "No especificado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Departamento</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.departamento || "No especificado"}
                      </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Municipio</p>
                      <p className="text-sm text-white font-medium">
                        {estudianteDetalle.municipio || "No especificado"}
                      </p>
                    </div>
                    {estudianteDetalle.direccion_exacta && (
                      <div className="bg-gray-800 p-4 rounded-lg md:col-span-2 lg:col-span-3">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <HomeIcon className="h-4 w-4" />
                          Dirección Exacta
                        </p>
                        <p className="text-sm text-white font-medium">
                          {estudianteDetalle.direccion_exacta}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección: Información del Tutor */}
                {(estudianteDetalle.nombre_padre ||
                  estudianteDetalle.correo_padre ||
                  estudianteDetalle.telefono_padre) && (
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <UsersIcon className="h-6 w-6 text-yellow-400" />
                      Información del Tutor / Padre
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {estudianteDetalle.nombre_padre && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Nombre del Padre/Tutor
                          </p>
                          <p className="text-sm text-white font-medium">
                            {estudianteDetalle.nombre_padre}
                          </p>
                        </div>
                      )}
                      {estudianteDetalle.correo_padre && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Email del Padre/Tutor
                          </p>
                          <p className="text-sm text-white font-medium break-all">
                            {estudianteDetalle.correo_padre}
                          </p>
                        </div>
                      )}
                      {estudianteDetalle.telefono_padre && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Teléfono del Padre/Tutor
                          </p>
                          <p className="text-sm text-white font-medium">
                            {estudianteDetalle.telefono_padre}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sección: Información Académica */}
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AcademicCapIcon className="h-6 w-6 text-green-400" />
                    Información Académica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {estudianteDetalle.matricula_actual ? (
                      <>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Grado y Sección
                          </p>
                          <p className="text-sm text-white font-medium">
                            {estudianteDetalle.matricula_actual.seccion_nombre}
                          </p>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg">
                          <p className="text-xs text-gray-400 mb-1">
                            Estado de Matrícula
                          </p>
                          <p className="text-sm text-green-400 font-medium">
                            {estudianteDetalle.matricula_actual.estado}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="bg-gray-800 p-4 rounded-lg md:col-span-2">
                        <p className="text-xs text-gray-400 mb-1">
                          Estado de Matrícula
                        </p>
                        <p className="text-sm text-orange-400 font-medium">
                          Sin Matrícula Activa
                        </p>
                      </div>
                    )}
                    {estudianteDetalle.turno && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Turno</p>
                        <p className="text-sm text-white font-medium">
                          {estudianteDetalle.turno}
                        </p>
                      </div>
                    )}
                    {estudianteDetalle.nivel_educativo && (
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">
                          Nivel Educativo
                        </p>
                        <p className="text-sm text-white font-medium">
                          {estudianteDetalle.nivel_educativo}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pie del Modal */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={cerrarDetalleModal}
                    className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Estudiantes;
