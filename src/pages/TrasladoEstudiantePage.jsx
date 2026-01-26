import React, {useState, useEffect} from "react";
import api from "../api/axiosConfig";
import {format} from "date-fns";
import {es} from "date-fns/locale";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";

const TrasladoEstudiantePage = () => {
  const [activeTab, setActiveTab] = useState("traslado");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  const hideToast = () => {
    setToast({show: false, message: "", type: "success"});
  };

  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  const [filtroGrado, setFiltroGrado] = useState("");
  const [filtroSeccion, setFiltroSeccion] = useState("");
  const [grados, setGrados] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [tipoTraslado, setTipoTraslado] = useState("");
  const [escuelasDisponibles, setEscuelasDisponibles] = useState([]);
  const [escuelaDestino, setEscuelaDestino] = useState("");

  const [gradosDestino, setGradosDestino] = useState([]);
  const [seccionesDestino, setSeccionesDestino] = useState([]);
  const [ciclosDestino, setCiclosDestino] = useState([]);
  const [gradoDestino, setGradoDestino] = useState("");
  const [seccionDestino, setSeccionDestino] = useState("");
  const [cicloDestino, setCicloDestino] = useState("");
  const [escuelaExterna, setEscuelaExterna] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    contacto: "",
  });
  const [motivo, setMotivo] = useState("");
  const [fechaTraslado, setFechaTraslado] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [historialTraslados, setHistorialTraslados] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });

  useEffect(() => {
    if (activeTab === "historial") {
      cargarHistorialTraslados();
    }
  }, [activeTab, pagination.page]);

  useEffect(() => {
    if (activeTab === "traslado") {
      cargarGrados();
    }
  }, [activeTab]);

  useEffect(() => {
    if (tipoTraslado === "interno") {
      cargarEscuelasDisponibles();
    }
  }, [tipoTraslado]);

  useEffect(() => {
    if (tipoTraslado === "interno" && escuelaDestino) {
      cargarOpcionesDestino();
    } else {
      setGradosDestino([]);
      setSeccionesDestino([]);
      setCiclosDestino([]);
      setGradoDestino("");
      setSeccionDestino("");
      setCicloDestino("");
    }
  }, [tipoTraslado, escuelaDestino]);

  useEffect(() => {
    if (filtroGrado) {
      cargarSecciones(filtroGrado);
    } else {
      setSecciones([]);
      setFiltroSeccion("");
    }
  }, [filtroGrado]);

  useEffect(() => {
    // Auto-listado: si el usuario selecciona grado y sección, cargar resultados sin requerir clic.
    if (activeTab !== "traslado") return;
    if (estudianteSeleccionado) return;
    if (!filtroGrado || !filtroSeccion) return;

    const t = setTimeout(() => {
      buscarEstudiante(true);
    }, 200);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filtroGrado, filtroSeccion]);

  useEffect(() => {
    if (tipoTraslado === "interno" && escuelaDestino) {
      // Si cambia el grado destino, recargar secciones destino filtradas
      cargarOpcionesDestino(gradoDestino);
      setSeccionDestino("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradoDestino]);

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const cargarGrados = async () => {
    try {
      const response = await api.get("/api/grados");
      const lista = normalizeList(response.data);
      setGrados(lista);
      // Selección por defecto para auto-listado
      if (!filtroGrado && lista.length > 0) {
        setFiltroGrado(String(lista[0].id_grado));
      }
    } catch (error) {
      console.error("Error al cargar grados:", error);
    }
  };

  const cargarSecciones = async (idGrado) => {
    try {
      const response = await api.get(`/api/secciones?id_grado=${idGrado}`);
      const lista = normalizeList(response.data);
      setSecciones(lista);
      // Si aún no hay sección seleccionada, tomar la primera disponible
      if (!filtroSeccion && lista.length > 0) {
        setFiltroSeccion(String(lista[0].id_seccion));
      }
    } catch (error) {
      console.error("Error al cargar secciones:", error);
    }
  };

  const cargarOpcionesDestino = async (idGradoFiltro = null) => {
    try {
      const params = new URLSearchParams();
      params.set("id_escuela_destino", escuelaDestino);
      if (idGradoFiltro) params.set("id_grado", idGradoFiltro);
      const response = await api.get(
        `/api/traslados/destino-opciones?${params.toString()}`
      );
      setGradosDestino(response.data.grados || []);
      setSeccionesDestino(response.data.secciones || []);
      setCiclosDestino(response.data.ciclos || []);
      if (!cicloDestino && response.data.id_ciclo_activo) {
        setCicloDestino(String(response.data.id_ciclo_activo));
      }
    } catch (error) {
      console.error("Error al cargar opciones destino:", error);
      showToast("Error al cargar opciones del destino", "error");
    }
  };

  const buscarEstudiante = async (silent = false) => {
    const texto = (busqueda || "").trim();
    const hasText = texto.length >= 3;
    const hasFilters = Boolean(filtroGrado || filtroSeccion);
    if (!hasText && !hasFilters) {
      if (!silent) {
        showToast(
          "Ingrese al menos 3 caracteres para buscar o seleccione grado/sección",
          "warning"
        );
      }
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (hasText) params.set("busqueda", texto);
      if (filtroGrado) params.set("id_grado", filtroGrado);
      if (filtroSeccion) params.set("id_seccion", filtroSeccion);
      const response = await api.get(
        `/api/traslados/buscar-estudiante?${params.toString()}`
      );
      setResultadosBusqueda(response.data.estudiantes);
    } catch (error) {
      console.error("Error al buscar estudiante:", error);
      if (!silent) showToast("Error al buscar estudiante", "error");
    } finally {
      setLoading(false);
    }
  };

  const seleccionarEstudiante = (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setResultadosBusqueda([]);
    setBusqueda("");
  };

  const cargarEscuelasDisponibles = async () => {
    try {
      const response = await api.get("/api/traslados/escuelas-disponibles");
      setEscuelasDisponibles(response.data.escuelas);
    } catch (error) {
      console.error("Error al cargar escuelas:", error);
    }
  };

  const cargarHistorialTraslados = async () => {
    setLoading(true);
    try {
      const response = await api.get(
        `/api/traslados/historial?page=${pagination.page}&limit=${pagination.limit}`
      );
      setHistorialTraslados(response.data.traslados);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error al cargar historial:", error);
      showToast("Error al cargar el historial de traslados", "error");
    } finally {
      setLoading(false);
    }
  };

  const validarFormulario = () => {
    if (!estudianteSeleccionado) {
      showToast("Debe seleccionar un estudiante", "warning");
      return false;
    }

    if (!tipoTraslado) {
      showToast("Debe seleccionar el tipo de traslado", "warning");
      return false;
    }

    if (tipoTraslado === "interno" && !escuelaDestino) {
      showToast("Debe seleccionar la escuela destino", "warning");
      return false;
    }

    if (tipoTraslado === "interno") {
      if (!gradoDestino) {
        showToast("Debe seleccionar el grado destino", "warning");
        return false;
      }
      if (!seccionDestino) {
        showToast("Debe seleccionar la sección destino", "warning");
        return false;
      }
      if (!cicloDestino) {
        showToast("Debe seleccionar el ciclo destino", "warning");
        return false;
      }
    }

    if (tipoTraslado === "externo") {
      if (!escuelaExterna.nombre || !escuelaExterna.direccion) {
        showToast(
          "Debe completar al menos el nombre y dirección de la escuela externa",
          "warning"
        );
        return false;
      }
    }

    if (!motivo || motivo.length < 10) {
      showToast(
        "Debe ingresar un motivo del traslado (mínimo 10 caracteres)",
        "warning"
      );
      return false;
    }

    return true;
  };

  const realizarTraslado = async () => {
    if (!validarFormulario()) return;

    const confirmacion = window.confirm(
      `¿Está seguro de realizar el traslado de ${estudianteSeleccionado.nombre_completo}?\n\n` +
        `Tipo: ${
          tipoTraslado === "interno" ? "Traslado Interno" : "Traslado Externo"
        }\n` +
        `${
          tipoTraslado === "interno"
            ? `Destino: ${
                escuelasDisponibles.find(
                  (e) => e.id_escuela === parseInt(escuelaDestino)
                )?.nombre
              }`
            : `Destino: ${escuelaExterna.nombre}`
        }\n\n` +
        `Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    setLoading(true);
    try {
      const data = {
        id_estudiante: estudianteSeleccionado.id_estudiante,
        tipo_traslado: tipoTraslado,
        motivo,
        fecha_traslado: fechaTraslado,
      };

      if (tipoTraslado === "interno") {
        data.id_escuela_destino = parseInt(escuelaDestino);
        data.id_grado_destino = parseInt(gradoDestino);
        data.id_seccion_destino = parseInt(seccionDestino);
        data.id_ciclo_destino = parseInt(cicloDestino);
      } else {
        data.escuela_externa = escuelaExterna;
      }

      const response = await api.post("/api/traslados/realizar", data);

      showToast(
        `✅ ${response.data.mensaje}\nEstudiante: ${response.data.estudiante}`,
        "success"
      );

      resetFormulario();
    } catch (error) {
      console.error("Error al realizar traslado:", error);
      showToast(
        `Error al realizar el traslado: ${
          error.response?.data?.error || error.message
        }`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetFormulario = () => {
    setEstudianteSeleccionado(null);
    setTipoTraslado("");
    setEscuelaDestino("");
    setGradosDestino([]);
    setSeccionesDestino([]);
    setCiclosDestino([]);
    setGradoDestino("");
    setSeccionDestino("");
    setCicloDestino("");
    setEscuelaExterna({
      nombre: "",
      direccion: "",
      telefono: "",
      email: "",
      contacto: "",
    });
    setMotivo("");
    setFechaTraslado(format(new Date(), "yyyy-MM-dd"));
    setBusqueda("");
    setResultadosBusqueda([]);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      {toast.show && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <PageHeader
        title="Traslado de Estudiantes"
        subtitle="Gestión de traslados internos y externos del sistema"
        icon={UserGroupIcon}
        gradientFrom="blue-600"
        gradientTo="cyan-600"
        badge="Administración"
      />

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="border-b border-white/10 bg-slate-900/50">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("traslado")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "traslado"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Realizar Traslado
            </button>
            <button
              onClick={() => setActiveTab("historial")}
              className={`px-6 py-4 text-sm font-medium transition-colors relative ${
                activeTab === "historial"
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Historial de Traslados
            </button>
          </nav>
        </div>

        {activeTab === "traslado" ? (
          <div className="p-6 space-y-6">
            {/* Paso 1 */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                  1
                </span>
                Buscar Estudiante
              </h2>

              {!estudianteSeleccionado ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <select
                      value={filtroGrado}
                      onChange={(e) => {
                        setFiltroGrado(e.target.value);
                        setFiltroSeccion("");
                        setResultadosBusqueda([]);
                      }}
                      className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Todos los grados</option>
                      {grados.map((g) => (
                        <option key={g.id_grado} value={g.id_grado}>
                          {g.nombre}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filtroSeccion}
                      onChange={(e) => setFiltroSeccion(e.target.value)}
                      disabled={!filtroGrado}
                      className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Todas las secciones</option>
                      {(Array.isArray(secciones) ? secciones : []).map((s) => (
                        <option key={s.id_seccion} value={s.id_seccion}>
                          {s.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && buscarEstudiante(false)
                      }
                      placeholder="Nombre, código o email del estudiante..."
                      className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={buscarEstudiante}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      <MagnifyingGlassIcon className="w-5 h-5" />
                      Buscar
                    </button>
                  </div>

                  {resultadosBusqueda.length > 0 && (
                    <div className="border border-slate-700 rounded-lg overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        {resultadosBusqueda.map((estudiante) => (
                          <div
                            key={estudiante.id_estudiante}
                            onClick={() => seleccionarEstudiante(estudiante)}
                            className="p-4 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors"
                          >
                            <div className="font-medium text-slate-200">
                              {estudiante.nombre_completo}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                              Código: {estudiante.codigo_estudiante || "N/A"} |
                              Email: {estudiante.email}
                            </div>
                            {estudiante.grado && (
                              <div className="text-sm text-slate-500 mt-1">
                                {estudiante.grado} - {estudiante.seccion} |{" "}
                                {estudiante.estado_matricula}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading &&
                    resultadosBusqueda.length === 0 &&
                    filtroGrado &&
                    filtroSeccion && (
                      <div className="text-sm text-slate-400">
                        No hay estudiantes para el grado/sección seleccionado.
                      </div>
                    )}
                </div>
              ) : (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-blue-300">
                        {estudianteSeleccionado.nombre_completo}
                      </div>
                      <div className="text-sm text-blue-400 mt-1">
                        Código:{" "}
                        {estudianteSeleccionado.codigo_estudiante || "N/A"}
                      </div>
                      <div className="text-sm text-blue-400">
                        Email: {estudianteSeleccionado.email}
                      </div>
                      {estudianteSeleccionado.grado && (
                        <div className="text-sm text-blue-400">
                          Grado: {estudianteSeleccionado.grado} -{" "}
                          {estudianteSeleccionado.seccion}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setEstudianteSeleccionado(null)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Paso 2 */}
            {estudianteSeleccionado && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                    2
                  </span>
                  Tipo de Traslado
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => setTipoTraslado("interno")}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      tipoTraslado === "interno"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <input
                        type="radio"
                        checked={tipoTraslado === "interno"}
                        onChange={() => setTipoTraslado("interno")}
                        className="mr-3"
                      />
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <BuildingOfficeIcon className="w-5 h-5 text-blue-400" />
                        Traslado Interno
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 ml-8">
                      El estudiante se traslada a otra escuela que usa este
                      sistema.
                    </p>
                  </div>

                  <div
                    onClick={() => setTipoTraslado("externo")}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      tipoTraslado === "externo"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center mb-3">
                      <input
                        type="radio"
                        checked={tipoTraslado === "externo"}
                        onChange={() => setTipoTraslado("externo")}
                        className="mr-3"
                      />
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <ArrowRightIcon className="w-5 h-5 text-orange-400" />
                        Traslado Externo
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 ml-8">
                      El estudiante se traslada a una escuela fuera del sistema.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3 */}
            {tipoTraslado === "interno" && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                    3
                  </span>
                  Seleccionar Escuela Destino
                </h2>
                <select
                  value={escuelaDestino}
                  onChange={(e) => setEscuelaDestino(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Seleccione una escuela...</option>
                  {escuelasDisponibles.map((escuela) => (
                    <option key={escuela.id_escuela} value={escuela.id_escuela}>
                      {escuela.nombre} - {escuela.direccion}
                    </option>
                  ))}
                </select>

                {escuelaDestino && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Grado destino
                      </label>
                      <select
                        value={gradoDestino}
                        onChange={(e) => setGradoDestino(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Seleccione...</option>
                        {gradosDestino.map((g) => (
                          <option key={g.id_grado} value={g.id_grado}>
                            {g.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Sección destino
                      </label>
                      <select
                        value={seccionDestino}
                        onChange={(e) => setSeccionDestino(e.target.value)}
                        disabled={!gradoDestino}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="">Seleccione...</option>
                        {seccionesDestino
                          .filter(
                            (s) => String(s.id_grado) === String(gradoDestino)
                          )
                          .map((s) => (
                            <option key={s.id_seccion} value={s.id_seccion}>
                              {s.nombre}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Ciclo destino
                      </label>
                      <select
                        value={cicloDestino}
                        onChange={(e) => setCicloDestino(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Seleccione...</option>
                        {ciclosDestino.map((c) => (
                          <option key={c.id_ciclo} value={c.id_ciclo}>
                            {c.nombre}
                            {c.es_activo_academico ? " (Activo)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {tipoTraslado === "externo" && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                    3
                  </span>
                  Datos de Escuela Externa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre de la Escuela *
                    </label>
                    <input
                      type="text"
                      value={escuelaExterna.nombre}
                      onChange={(e) =>
                        setEscuelaExterna({
                          ...escuelaExterna,
                          nombre: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={escuelaExterna.direccion}
                      onChange={(e) =>
                        setEscuelaExterna({
                          ...escuelaExterna,
                          direccion: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={escuelaExterna.telefono}
                      onChange={(e) =>
                        setEscuelaExterna({
                          ...escuelaExterna,
                          telefono: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={escuelaExterna.email}
                      onChange={(e) =>
                        setEscuelaExterna({
                          ...escuelaExterna,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Persona de Contacto
                    </label>
                    <input
                      type="text"
                      value={escuelaExterna.contacto}
                      onChange={(e) =>
                        setEscuelaExterna({
                          ...escuelaExterna,
                          contacto: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Paso 4 */}
            {tipoTraslado && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full text-sm font-bold">
                    4
                  </span>
                  Detalles del Traslado
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha del Traslado
                    </label>
                    <input
                      type="date"
                      value={fechaTraslado}
                      onChange={(e) => setFechaTraslado(e.target.value)}
                      className="w-full md:w-64 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Motivo del Traslado *
                    </label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows="4"
                      placeholder="Describa el motivo del traslado (mínimo 10 caracteres)..."
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            {tipoTraslado && (
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={resetFormulario}
                  className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={realizarTraslado}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {loading ? "Procesando..." : "Confirmar Traslado"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-4 text-slate-400">Cargando...</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-slate-700">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Realizado Por
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {historialTraslados.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-12 text-center text-slate-500"
                        >
                          No hay traslados registrados
                        </td>
                      </tr>
                    ) : (
                      historialTraslados.map((traslado) => (
                        <tr
                          key={traslado.id_log}
                          className="hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {format(
                              new Date(traslado.fecha_hora),
                              "dd/MM/yyyy HH:mm",
                              {
                                locale: es,
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 text-xs font-medium rounded-full ${
                                traslado.tipo_accion === "TRASLADO_INTERNO"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                              }`}
                            >
                              {traslado.tipo_accion === "TRASLADO_INTERNO"
                                ? "Interno"
                                : "Externo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400 max-w-md">
                            {traslado.descripcion}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {traslado.realizado_por}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
                <div className="text-sm text-slate-400">
                  Mostrando {(pagination.page - 1) * pagination.limit + 1} a{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  de {pagination.total} registros
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setPagination({...pagination, page: pagination.page - 1})
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 text-sm bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-400">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setPagination({...pagination, page: pagination.page + 1})
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 text-sm bg-slate-800 text-slate-300 border border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrasladoEstudiantePage;
