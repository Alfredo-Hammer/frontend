import {
  UserIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  MapPinIcon,
  UsersIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import {useEffect, useState} from "react";
import ciclosApi from "../api/ciclos";

const FormularioEstudianteCompleto = ({
  formData,
  handleInputChange,
  handleImageChange,
  handleDocumentoSaludChange,
  previewImagen,
  grados,
  seccionesDisponibles,
  departamentos,
  municipiosFiltrados,
}) => {
  // --- Selección híbrida de ciclo escolar ---
  const [ciclos, setCiclos] = useState([]);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  useEffect(() => {
    const fetchCiclos = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await ciclosApi.getCiclosSetup(token);
        setCiclos(res.data.ciclos || []);
        // Si no hay ciclo seleccionado, sugerir el de matrícula abierta
        if (!formData.cicloId && res.data.matricula) {
          handleInputChange({
            target: {name: "cicloId", value: res.data.matricula},
          });
        }
      } catch (e) {
        setCiclos([]);
      } finally {
        setLoadingCiclos(false);
      }
    };
    fetchCiclos();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="space-y-6">
      {/* Sección 1: Fotografía y Datos Personales */}
      <div>
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-blue-400" />
          Información Personal
        </h4>

        {/* Fotografía */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fotografía
          </label>
          <div className="flex items-center gap-4">
            {previewImagen ? (
              <img
                src={previewImagen}
                alt="Preview"
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                <UserIcon className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-900 file:text-blue-300 hover:file:bg-blue-800"
            />
          </div>
        </div>

        {/* Datos Personales Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Juan Carlos"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: López García"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="estudiante@escuela.edu.ni"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si no se proporciona, se generará automáticamente
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Fecha de Nacimiento
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={formData.fecha_nacimiento}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Edad
            </label>
            <input
              type="text"
              name="edad"
              value={formData.edad}
              readOnly
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg bg-gray-50 text-gray-400"
              placeholder="Se calcula automáticamente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Género
            </label>
            <select
              name="genero"
              value={formData.genero}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccione...</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Código MINED
            </label>
            <input
              type="text"
              name="codigo_mined"
              value={formData.codigo_mined}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Código asignado por MINED"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nacionalidad
            </label>
            <input
              type="text"
              name="nacionalidad"
              value={formData.nacionalidad}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nicaragüense"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Etnia
            </label>
            <select
              name="etnia"
              value={formData.etnia}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-2">
              <HeartIcon className="h-4 w-4 text-red-500" />
              Condición de Salud / Enfermedad
            </label>
            <textarea
              name="enfermedad"
              value={formData.enfermedad}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Especifique si el estudiante padece alguna enfermedad o condición médica importante (confidencial)"
            />
            <p className="text-xs text-gray-400 mt-1">
              Esta información es confidencial y se usa para atención médica en
              caso de emergencia
            </p>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Epicrisis / Recetas Médicas (opcional)
              </label>
              <input
                type="file"
                name="documento_salud"
                accept="application/pdf,image/*"
                onChange={handleDocumentoSaludChange}
                className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-900 file:text-red-200 hover:file:bg-red-800"
              />
              <p className="text-xs text-gray-400 mt-1">
                Puedes adjuntar un informe médico, epicrisis o recetas
                relevantes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Información de Contacto y Ubicación */}
      <div className="pt-6 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-purple-400" />
          Información de Contacto y Ubicación
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dirección Exacta
            </label>
            <input
              type="text"
              name="direccion_exacta"
              value={formData.direccion_exacta}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa con señas"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Departamento
            </label>
            <select
              name="departamento"
              value={formData.departamento}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccione un departamento</option>
              {departamentos.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Municipio
            </label>
            <select
              name="municipio"
              value={formData.municipio}
              onChange={handleInputChange}
              disabled={!formData.departamento}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.departamento
                  ? "Seleccione un municipio"
                  : "Primero seleccione un departamento"}
              </option>
              {municipiosFiltrados.map((mun) => (
                <option key={mun} value={mun}>
                  {mun}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono Fijo
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="2222-2222"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Móvil del Alumno
            </label>
            <input
              type="tel"
              name="movil_alumno"
              value={formData.movil_alumno}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8888-8888"
            />
          </div>
        </div>
      </div>

      {/* Sección 3: Información del Tutor */}
      <div className="pt-6 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-yellow-400" />
          Información del Tutor / Padre
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nombre Completo del Padre/Tutor
            </label>
            <input
              type="text"
              name="nombre_padre"
              value={formData.nombre_padre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Correo del Padre/Tutor
            </label>
            <input
              type="email"
              name="correo_padre"
              value={formData.correo_padre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="padre@ejemplo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Teléfono del Padre/Tutor
            </label>
            <input
              type="tel"
              name="telefono_padre"
              value={formData.telefono_padre}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8888-8888"
            />
          </div>
        </div>
      </div>

      {/* Sección 4: Datos Académicos */}
      <div className="pt-6 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AcademicCapIcon className="h-5 w-5 text-green-400" />
          Datos Académicos y Matrícula
        </h4>
        {/* Selección de Ciclo Escolar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Ciclo Escolar <span className="text-red-500">*</span>
          </label>
          <select
            name="cicloId"
            value={formData.cicloId || ""}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-cyan-600 text-white rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            disabled={loadingCiclos}
          >
            <option value="">Seleccione un ciclo escolar</option>
            {ciclos.map((c) => (
              <option key={c.id_ciclo} value={c.id_ciclo}>
                {c.nombre} {c.matricula_abierta ? "(Matrícula Abierta)" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            El ciclo con <strong>(Matrícula Abierta)</strong> es el sugerido por
            el sistema, pero puedes corregir manualmente para casos
            excepcionales.
          </p>
        </div>
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-300 flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5" />
            El estudiante será matriculado automáticamente en la sección
            seleccionada
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Grado <span className="text-red-500">*</span>
            </label>
            <select
              name="id_grado"
              value={formData.id_grado}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccione un grado...</option>
              {grados.map((grado) => (
                <option key={grado.id_grado} value={grado.id_grado}>
                  {grado.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Sección <span className="text-red-500">*</span>
            </label>
            <select
              name="id_seccion"
              value={formData.id_seccion}
              onChange={handleInputChange}
              required
              disabled={!formData.id_grado}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">
                {formData.id_grado
                  ? "Seleccione una sección..."
                  : "Primero seleccione un grado"}
              </option>
              {(seccionesDisponibles || []).map((seccion) => (
                <option key={seccion.id_seccion} value={seccion.id_seccion}>
                  {seccion.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Turno
            </label>
            <select
              name="turno"
              value={formData.turno}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar turno</option>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Nocturno">Nocturno</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nivel Educativo
            </label>
            <input
              type="text"
              name="nivel_educativo"
              value={formData.nivel_educativo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Primaria, Secundaria, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              PIN de Acceso (Opcional)
            </label>
            <input
              type="text"
              name="pin"
              value={formData.pin}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dejar vacío para generar automático"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si no se especifica, se generará: apellido123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioEstudianteCompleto;
