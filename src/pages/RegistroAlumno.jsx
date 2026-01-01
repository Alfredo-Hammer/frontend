import React, {useState, useEffect} from "react";
import ciclosApi from "../api/ciclosMatricula";
import api from "../api/axiosConfig";
import services from "../api/services";
import {useNavigate} from "react-router-dom";
import {
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

function RegistroAlumno() {
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Ciclo escolar para matrícula
  const [ciclos, setCiclos] = useState([]);
  const [cicloId, setCicloId] = useState("");

  // Estados para datos de Nicaragua
  const [departamentos, setDepartamentos] = useState([]);
  const [municipiosPorDepartamento, setMunicipiosPorDepartamento] = useState(
    {}
  );
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [direccion_exacta, setDireccionExacta] = useState("");
  const [fecha_nacimiento, setFechaNacimiento] = useState("");
  const [edad, setEdad] = useState("");
  const [codigo_mined, setCodigoMined] = useState("");
  const [genero, setGenero] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Nicaragüense");
  const [etnia, setEtnia] = useState("");
  const [enfermedad, setEnfermedad] = useState("");
  const [pin, setPin] = useState(
    Math.floor(100000 + Math.random() * 900000).toString()
  );
  const [nombre_padre, setNombrePadre] = useState("");
  const [correo_padre, setCorreoPadre] = useState("");
  const [telefono_padre, setTelefonoPadre] = useState("");
  const [movil_alumno, setMovilAlumno] = useState("");
  const [turno, setTurno] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [nivel_educativo, setNivelEducativo] = useState("");
  const [gradoId, setGradoId] = useState("");
  const [seccionId, setSeccionId] = useState("");
  const [imagen, setImagen] = useState("");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Función para calcular edad
  const calcularEdad = (fechaNac) => {
    if (!fechaNac) return "";
    const hoy = new Date();
    const nacimiento = new Date(fechaNac);
    let edadCalculada = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
      edadCalculada--;
    }
    return edadCalculada >= 0 ? edadCalculada : "";
  };

  // Actualizar edad cuando cambia fecha de nacimiento
  useEffect(() => {
    if (fecha_nacimiento) {
      const edadCalculada = calcularEdad(fecha_nacimiento);
      setEdad(edadCalculada);
    }
  }, [fecha_nacimiento]);

  // Cargar datos de Nicaragua desde backend
  useEffect(() => {
    const fetchDatosNicaragua = async () => {
      try {
        console.log("🔄 REGISTRO: Iniciando carga de datos de Nicaragua...");
        const response = await api.get(services.nicaraguaTodos, {
          headers: {Authorization: `Bearer ${token}`},
        });
        console.log("📦 REGISTRO: Respuesta del backend:", response.data);

        const {departamentos: deps, municipiosPorDepartamento: muns} =
          response.data;
        console.log("🏛️ REGISTRO: Departamentos recibidos:", deps);
        console.log("🏙️ REGISTRO: Municipios por departamento:", muns);

        setDepartamentos(deps || []);
        setMunicipiosPorDepartamento(muns || {});
        console.log("✅ REGISTRO: Datos de Nicaragua cargados correctamente");
      } catch (error) {
        console.error(
          "❌ REGISTRO: Error al cargar datos de Nicaragua:",
          error
        );
      }
    };
    fetchDatosNicaragua();
  }, [token]);

  // Filtrar municipios cuando cambia el departamento
  useEffect(() => {
    if (departamento && municipiosPorDepartamento[departamento]) {
      console.log(`🔍 REGISTRO: Filtrando municipios para ${departamento}`);
      setMunicipiosFiltrados(municipiosPorDepartamento[departamento]);
    } else {
      setMunicipiosFiltrados([]);
    }
  }, [departamento, municipiosPorDepartamento]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [gradRes, secRes, ciclosRes] = await Promise.all([
          api.get("http://localhost:4000/api/grados", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          api.get("http://localhost:4000/api/secciones", {
            headers: {Authorization: `Bearer ${token}`},
          }),
          ciclosApi.getCiclosMatricula(token),
        ]);
        const gradosData = gradRes.data?.data || gradRes.data || [];
        const seccionesData = secRes.data?.data || secRes.data || [];
        setGrados(Array.isArray(gradosData) ? gradosData : []);
        setSecciones(Array.isArray(seccionesData) ? seccionesData : []);
        setCiclos(ciclosRes.data.ciclos || []);
        setCicloId(ciclosRes.data.matricula || "");
      } catch (err) {
        setMensaje("Error al cargar datos.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Cargar secciones cuando cambia grado
  useEffect(() => {
    if (gradoId && secciones.length > 0) {
      // Reset sección cuando cambia grado
      setSeccionId("");
    }
  }, [gradoId, secciones]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre || !apellido || !gradoId || !seccionId || !cicloId) {
      setMensaje(
        "Complete todos los campos obligatorios (Nombre, Apellido, Grado, Sección y Ciclo Escolar)."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Usar FormData si hay imagen, de lo contrario enviar JSON
      let dataToSend;
      let headers = {Authorization: `Bearer ${token}`};

      if (imagen) {
        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("apellido", apellido);
        formData.append("email", email);
        formData.append("direccion_exacta", direccion_exacta);
        formData.append("fecha_nacimiento", fecha_nacimiento);
        formData.append("edad", edad);
        formData.append("codigo_mined", codigo_mined);
        formData.append("genero", genero);
        formData.append("nacionalidad", nacionalidad);
        formData.append("etnia", etnia);
        formData.append("enfermedad", enfermedad);
        formData.append("pin", pin);
        formData.append("nombre_padre", nombre_padre);
        formData.append("correo_padre", correo_padre);
        formData.append("telefono_padre", telefono_padre);
        formData.append("movil_alumno", movil_alumno);
        formData.append("turno", turno);
        formData.append("municipio", municipio);
        formData.append("departamento", departamento);
        formData.append("nivel_educativo", nivel_educativo);
        formData.append("gradoId", gradoId);
        formData.append("seccionId", seccionId);
        formData.append("cicloId", cicloId);
        formData.append("imagen", imagen);

        dataToSend = formData;
        headers["Content-Type"] = "multipart/form-data";
      } else {
        dataToSend = {
          nombre,
          apellido,
          email,
          direccion_exacta,
          fecha_nacimiento,
          edad,
          codigo_mined,
          genero,
          nacionalidad,
          etnia,
          enfermedad,
          pin,
          nombre_padre,
          correo_padre,
          telefono_padre,
          movil_alumno,
          turno,
          municipio,
          departamento,
          nivel_educativo,
          gradoId,
          seccionId,
          cicloId,
        };
      }

      await api.post("http://localhost:4000/api/alumnos", dataToSend, {
        headers,
      });

      setMensaje("Alumno registrado correctamente");
      setTimeout(() => navigate("/alumnos"), 2000);
    } catch (err) {
      setMensaje(err.response?.data?.message || "Error al registrar alumno");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para limpiar formulario
  const limpiarFormulario = () => {
    setNombre("");
    setApellido("");
    setEmail("");
    setDireccionExacta("");
    setFechaNacimiento("");
    setCodigoMined("");
    setGenero("");
    setNombrePadre("");
    setCorreoPadre("");
    setTelefonoPadre("");
    setMovilAlumno("");
    setTurno("");
    setMunicipio("");
    setDepartamento("");
    setNivelEducativo("");
    setGradoId("");
    setSeccionId("");
    setImagen("");
  };

  // En sistema multi-tenant, todos los grados ya pertenecen a la escuela del usuario
  const gradosFiltrados = Array.isArray(grados) ? grados : [];

  // Obtener secciones filtradas por grado seleccionado
  const seccionesFiltradas = (Array.isArray(secciones) ? secciones : []).filter(
    (s) => String(s.id_grado) === String(gradoId)
  );

  // Debug: Ver qué secciones hay disponibles
  console.log("📊 Debug Secciones:");
  console.log("- Grado seleccionado:", gradoId);
  console.log("- Total secciones:", secciones.length);
  console.log("- Secciones filtradas:", seccionesFiltradas.length);
  if (secciones.length > 0) {
    console.log("- Estructura de una sección:", Object.keys(secciones[0]));
    console.log("- Primera sección:", secciones[0]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-blue-600 to-indigo-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-40 h-40 bg-green-400/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 bg-blue-400/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full text-sm text-white mb-4 backdrop-blur-sm">
                <UserIcon className="w-4 h-4 mr-2" />
                Nuevo Registro
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
                Registro de
                <span className="block bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent">
                  Alumno
                </span>
              </h1>
              <p className="text-xl text-green-100 mb-8 max-w-2xl">
                Complete la información del estudiante para registrarlo en el
                sistema educativo.
              </p>
              <button
                onClick={() => navigate("/alumnos")}
                className="px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold backdrop-blur-sm hover:bg-white/20 transform transition-all duration-300 flex items-center"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Volver a Lista de Alumnos
              </button>
            </div>

            <div className="flex-1 mt-12 lg:mt-0 flex justify-center">
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">
                      Progreso del Registro
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-white">
                      <span>Información Personal</span>
                      <span
                        className={`font-bold ${
                          nombre && apellido
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {nombre && apellido ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Información Académica</span>
                      <span
                        className={`font-bold ${
                          gradoId && seccionId
                            ? "text-green-400"
                            : "text-gray-400"
                        }`}
                      >
                        {gradoId && seccionId ? "✓" : "○"}
                      </span>
                    </div>
                    <div className="flex justify-between text-white">
                      <span>Información de Contacto</span>
                      <span className="text-gray-400">○</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-4">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            (((nombre && apellido ? 1 : 0) +
                              (gradoId && seccionId ? 1 : 0)) /
                              2) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 -mt-16 relative z-10">
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-2xl text-center backdrop-blur-sm border ${
              mensaje.includes("correctamente")
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {mensaje}
          </div>
        )}

        {/* Formulario Principal */}
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Formulario de Registro
                </h2>
                <p className="text-green-100 text-sm">
                  Complete toda la información requerida
                </p>
              </div>
              {isLoading && (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Ciclo Escolar para Matrícula */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center mr-3">
                  <AcademicCapIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Ciclo Escolar de Matrícula
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ciclo Escolar *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-cyan-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                    value={cicloId}
                    onChange={(e) => setCicloId(e.target.value)}
                    required
                  >
                    <option value="">Seleccione un ciclo escolar</option>
                    {ciclos.map((c) => (
                      <option key={c.id_ciclo} value={c.id_ciclo}>
                        {c.nombre}{" "}
                        {c.matricula_abierta ? "(Matrícula Abierta)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    El ciclo con <strong>(Matrícula Abierta)</strong> es el
                    sugerido por el sistema, pero puedes corregir manualmente
                    para casos excepcionales.
                  </p>
                </div>
              </div>
            </section>
            {/* Información Personal */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                  <UserIcon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información Personal
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el nombre"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    placeholder="Ingrese el apellido"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email (Opcional para menores)
                  </label>
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com (opcional)"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Si no se proporciona, se generará uno automáticamente
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={fecha_nacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Género
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={genero}
                    onChange={(e) => setGenero(e.target.value)}
                  >
                    <option value="">Seleccionar género</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código MINED
                  </label>
                  <input
                    type="text"
                    placeholder="Código asignado por MINED"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={codigo_mined}
                    onChange={(e) => setCodigoMined(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Edad
                  </label>
                  <input
                    type="text"
                    placeholder="Se calcula automáticamente"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-400 focus:outline-none transition-all duration-200"
                    value={edad}
                    readOnly
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Se calcula automáticamente con la fecha de nacimiento
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nacionalidad *
                  </label>
                  <input
                    type="text"
                    placeholder="Nacionalidad del estudiante"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={nacionalidad}
                    onChange={(e) => setNacionalidad(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Etnia
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={etnia}
                    onChange={(e) => setEtnia(e.target.value)}
                  >
                    <option value="">Seleccionar etnia</option>
                    <option value="Mestizo">Mestizo</option>
                    <option value="Miskito">Miskito</option>
                    <option value="Mayangna">Mayangna (Sumu)</option>
                    <option value="Garífuna">Garífuna</option>
                    <option value="Rama">Rama</option>
                    <option value="Creole">Creole (Afrodescendiente)</option>
                    <option value="Xiu-Sutiava">Xiu-Sutiava</option>
                    <option value="Ulwa">Ulwa</option>
                    <option value="Nahoa-Nicarao">Nahoa-Nicarao</option>
                    <option value="Chorotega">Chorotega</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    PIN de Acceso
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-gray-400 focus:outline-none transition-all duration-200"
                    value={pin}
                    readOnly
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    PIN de 6 dígitos para acceso del alumno
                  </p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Condición de Salud / Enfermedad
                  </label>
                  <textarea
                    placeholder="Especifique si el alumno padece alguna enfermedad o condición médica importante"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    value={enfermedad}
                    onChange={(e) => setEnfermedad(e.target.value)}
                    rows={2}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Esta información es confidencial y se usa para atención
                    médica en caso de emergencia
                  </p>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Fotografía del Estudiante (Opcional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImagen(file);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Formatos permitidos: JPG, PNG, GIF (máximo 2MB)
                  </p>
                </div>
              </div>
            </section>

            {/* Información Académica */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mr-3">
                  <AcademicCapIcon className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información Académica
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Grado *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    style={{color: "white"}}
                    value={gradoId}
                    onChange={(e) => setGradoId(e.target.value)}
                    required
                    disabled={!gradosFiltrados.length}
                  >
                    <option
                      value=""
                      style={{
                        color: "#111827 !important",
                        backgroundColor: "white !important",
                      }}
                    >
                      Seleccionar grado
                    </option>
                    {gradosFiltrados.map((g) => (
                      <option
                        key={g.id_grado}
                        value={g.id_grado}
                        style={{
                          color: "#111827 !important",
                          backgroundColor: "white !important",
                        }}
                      >
                        {g.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sección *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    style={{color: "white"}}
                    value={seccionId}
                    onChange={(e) => setSeccionId(e.target.value)}
                    required
                    disabled={!seccionesFiltradas.length}
                  >
                    <option
                      value=""
                      style={{
                        color: "#111827 !important",
                        backgroundColor: "white !important",
                      }}
                    >
                      {gradoId
                        ? "Seleccionar sección"
                        : "Primero selecciona un grado"}
                    </option>
                    {seccionesFiltradas.map((s) => (
                      <option
                        key={s.id_seccion}
                        value={s.id_seccion}
                        style={{
                          color: "#111827 !important",
                          backgroundColor: "white !important",
                        }}
                      >
                        {s.nombre_seccion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Turno
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    style={{color: "white"}}
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                  >
                    <option
                      value=""
                      className="text-gray-900 bg-white"
                      style={{color: "black", backgroundColor: "white"}}
                    >
                      Seleccionar turno
                    </option>
                    <option
                      value="Mañana"
                      className="text-gray-900 bg-white"
                      style={{color: "black", backgroundColor: "white"}}
                    >
                      Mañana
                    </option>
                    <option
                      value="Tarde"
                      className="text-gray-900 bg-white"
                      style={{color: "black", backgroundColor: "white"}}
                    >
                      Tarde
                    </option>
                    <option
                      value="Nocturno"
                      className="text-gray-900 bg-white"
                      style={{color: "black", backgroundColor: "white"}}
                    >
                      Nocturno
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nivel Educativo
                  </label>
                  <input
                    type="text"
                    placeholder="Nivel educativo"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    value={nivel_educativo}
                    onChange={(e) => setNivelEducativo(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Información de Contacto */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información de Contacto y Ubicación
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Dirección
                  </label>
                  <input
                    type="text"
                    placeholder="Dirección completa"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={direccion_exacta}
                    onChange={(e) => setDireccionExacta(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Departamento
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={departamento}
                    onChange={(e) => {
                      const nuevoDept = e.target.value;
                      console.log(
                        `📍 REGISTRO: Departamento seleccionado: ${nuevoDept}`
                      );
                      setDepartamento(nuevoDept);
                      setMunicipio(""); // Resetear municipio al cambiar departamento
                    }}
                  >
                    <option value="">Seleccione un departamento</option>
                    {departamentos.map((dept) => {
                      console.log(
                        `🏛️ REGISTRO: Renderizando departamento: ${dept.label}`
                      );
                      return (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Municipio
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={municipio}
                    onChange={(e) => {
                      const nuevoMun = e.target.value;
                      console.log(
                        `🏙️ REGISTRO: Municipio seleccionado: ${nuevoMun}`
                      );
                      setMunicipio(nuevoMun);
                    }}
                    disabled={!departamento}
                  >
                    <option value="">
                      {departamento
                        ? "Seleccione un municipio"
                        : "Primero seleccione un departamento"}
                    </option>
                    {municipiosFiltrados.map((mun) => {
                      console.log(
                        `🏙️ REGISTRO: Renderizando municipio: ${mun}`
                      );
                      return (
                        <option key={mun} value={mun}>
                          {mun}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono del Alumno
                  </label>
                  <input
                    type="text"
                    placeholder="Número de contacto"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                    value={movil_alumno}
                    onChange={(e) => setMovilAlumno(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Información del Tutor */}
            <section>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">
                  Información del Tutor/Padre
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Tutor
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre completo del padre/tutor"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={nombre_padre}
                    onChange={(e) => setNombrePadre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Teléfono del Tutor
                  </label>
                  <input
                    type="text"
                    placeholder="Número de contacto del tutor"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={telefono_padre}
                    onChange={(e) => setTelefonoPadre(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email del Tutor
                  </label>
                  <input
                    type="email"
                    placeholder="correo@tutor.com"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all duration-200"
                    value={correo_padre}
                    onChange={(e) => setCorreoPadre(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-gray-700 space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/alumnos")}
                  className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={limpiarFormulario}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium transition-colors duration-200"
                >
                  Limpiar Formulario
                </button>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-medium shadow-lg transform transition-all duration-200 ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 hover:shadow-xl"
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Registrar Alumno
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegistroAlumno;
