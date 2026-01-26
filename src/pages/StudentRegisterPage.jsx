import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import api from "../api/axiosConfig";
import services from "../api/services";
import {hasPermission} from "../config/roles";
import FormularioEstudianteCompleto from "../components/FormularioEstudianteCompleto";
import PageHeader from "../components/PageHeader";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import {CheckCircleIcon as CheckCircleSolid} from "@heroicons/react/24/solid";

function StudentRegisterPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [escuela, setEscuela] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [grados, setGrados] = useState([]);
  const [seccionesDisponibles, setSeccionesDisponibles] = useState([]);

  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosPorDepartamento, setMunicipiosPorDepartamento] = useState(
    {}
  );
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

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
    tutor_apellido: "",
    correo_padre: "",
    telefono_padre: "",
    turno: "",
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [documentoSaludFile, setDocumentoSaludFile] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
    setTimeout(() => {
      setToast({show: false, message: "", type: "success"});
    }, 3000);
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData((prev) => ({...prev, [name]: value}));
  };

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

  const cargarDatosNicaragua = async () => {
    try {
      const res = await api.get(services.nicaraguaTodos);
      const {departamentos: deps, municipiosPorDepartamento: muns} = res.data;
      setDepartamentos(deps || []);
      setMunicipiosPorDepartamento(muns || {});
    } catch (error) {
      // Silencioso para no saturar; el formulario igual funciona sin estos datos
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

  const cargarSeccionesPorGrado = async (idGrado) => {
    try {
      const res = await api.get(services.secciones, {
        params: {id_grado: idGrado},
      });
      const secciones = Array.isArray(res.data?.data) ? res.data.data : [];
      setSeccionesDisponibles(secciones);
    } catch (error) {
      console.error(
        "❌ Error al cargar secciones del grado:",
        error.response?.data || error.message
      );
      showToast("Error al cargar secciones del grado", "error");
      setSeccionesDisponibles([]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.apellido) {
      showToast(
        "Por favor complete los campos obligatorios: Nombre y Apellido",
        "error"
      );
      return;
    }

    if (!formData.id_grado || !formData.id_seccion) {
      showToast(
        "Por favor seleccione el grado y la sección del estudiante",
        "error"
      );
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append("nombre", formData.nombre);
    formDataToSend.append("apellido", formData.apellido);
    if (String(formData.email || "").trim()) {
      formDataToSend.append("email", formData.email);
    }
    formDataToSend.append("fecha_nacimiento", formData.fecha_nacimiento || "");
    formDataToSend.append("edad", formData.edad || "");
    formDataToSend.append("genero", formData.genero || "");
    formDataToSend.append("nacionalidad", formData.nacionalidad || "");
    formDataToSend.append("etnia", formData.etnia || "");
    formDataToSend.append("enfermedad", formData.enfermedad || "");
    formDataToSend.append("codigo_mined", formData.codigo_mined || "");

    formDataToSend.append("direccion", formData.direccion || "");
    formDataToSend.append("direccion_exacta", formData.direccion_exacta || "");
    formDataToSend.append("departamento", formData.departamento || "");
    formDataToSend.append("municipio", formData.municipio || "");
    formDataToSend.append("telefono", formData.telefono || "");
    formDataToSend.append("movil_alumno", formData.movil_alumno || "");

    formDataToSend.append("nombre_padre", formData.nombre_padre || "");
    formDataToSend.append("tutor_apellido", formData.tutor_apellido || "");
    formDataToSend.append("correo_padre", formData.correo_padre || "");
    formDataToSend.append("telefono_padre", formData.telefono_padre || "");

    formDataToSend.append("id_seccion", formData.id_seccion);
    formDataToSend.append("turno", formData.turno || "");

    formDataToSend.append(
      "pin",
      formData.pin || `${formData.apellido.split(" ")[0].toLowerCase()}123`
    );

    if (imagenFile) {
      formDataToSend.append("imagen", imagenFile);
    }

    if (documentoSaludFile) {
      formDataToSend.append("documento_salud", documentoSaludFile);
    }

    try {
      const resEstudiante = await api.post(services.alumnos, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const padreUsuarioCreado = !!resEstudiante?.data?.padre_usuario_creado;
      const padreCredenciales =
        resEstudiante?.data?.padre_credenciales_temporales;
      const padreEmailEnviado = !!resEstudiante?.data?.padre_email_enviado;
      const padreRequiereVerificacion =
        !!resEstudiante?.data?.padre_requiere_verificacion;

      if (
        padreUsuarioCreado &&
        padreCredenciales?.email &&
        padreCredenciales?.password
      ) {
        const msg = padreEmailEnviado
          ? `Usuario padre creado: ${
              padreCredenciales.email
            }. Se enviaron credenciales por correo.${
              padreRequiereVerificacion
                ? " Debe verificar el email antes de iniciar sesión."
                : ""
            }`
          : `Usuario padre creado: ${
              padreCredenciales.email
            }. Contraseña temporal: ${padreCredenciales.password}.${
              padreRequiereVerificacion
                ? " Debe verificar el email antes de iniciar sesión."
                : ""
            }`;
        showToast(msg, "info");
      }

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
      setTimeout(() => navigate("/estudiantes"), 800);
    } catch (error) {
      console.error("Error al registrar estudiante:", error);
      const errorMsg =
        error.response?.data?.error || "Error al registrar el estudiante";
      showToast(errorMsg, "error");
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setIsLoading(true);
      await fetchUser();
      if (!mounted) return;

      await Promise.all([cargarGrados(), cargarDatosNicaragua()]);
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

  const puedeCrear = user && hasPermission(user.rol, "alumnos", "crear");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!puedeCrear) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-3xl mx-auto">
          <PageHeader
            title="Registro de Estudiante"
            subtitle="No tienes permisos para crear estudiantes"
            icon={ExclamationTriangleIcon}
            gradientFrom="red-600"
            gradientTo="orange-600"
            badge="Acceso restringido"
            schoolLogo={
              escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
            }
            schoolName={escuela?.nombre}
          />

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-gray-200">
            <p className="mb-6">
              Contacta a un administrador si necesitas acceso para registrar
              estudiantes.
            </p>
            <button
              onClick={() => navigate("/estudiantes")}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Registro de Nuevo Estudiante"
          subtitle="Completa los datos personales, ubicación y matrícula"
          icon={AcademicCapIcon}
          gradientFrom="blue-600"
          gradientTo="indigo-600"
          badge="Gestión Académica"
          schoolLogo={
            escuela?.logo ? `http://localhost:4000${escuela.logo}` : null
          }
          schoolName={escuela?.nombre}
          actions={
            <button
              onClick={() => navigate("/estudiantes")}
              className="px-4 py-2 border border-gray-600 rounded-xl text-gray-200 hover:bg-gray-700 font-semibold transition-colors"
            >
              Cancelar
            </button>
          }
        />

        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
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

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-700 mt-6">
              <button
                type="button"
                onClick={() => navigate("/estudiantes")}
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
    </div>
  );
}

export default StudentRegisterPage;
