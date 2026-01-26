import React, {useState, useEffect} from "react";
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import api from "../../api/axiosConfig";
import services from "../../api/services";
import Loader from "../Loader";
import Toast from "../Toast";
import {format} from "date-fns";
import {es} from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const EstadoCuentaTab = () => {
  const [loading, setLoading] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [escuelaInfo, setEscuelaInfo] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({show: true, message, type});
  };

  useEffect(() => {
    cargarInfoEscuela();
  }, []);

  useEffect(() => {
    if (busquedaEstudiante.length >= 3) {
      buscarEstudiantes();
    } else {
      setEstudiantes([]);
      setMostrarResultados(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaEstudiante]);

  const cargarInfoEscuela = async () => {
    try {
      const token = localStorage.getItem("token");

      // Primero obtener el perfil del usuario para conseguir id_escuela
      const userRes = await api.get("/api/usuarios/perfil", {
        headers: {Authorization: `Bearer ${token}`},
      });

      const id_escuela =
        userRes.data.usuario?.id_escuela || userRes.data.id_escuela;
      console.log("ID Escuela del usuario:", id_escuela);

      if (id_escuela) {
        // Ahora obtener la información específica de la escuela
        const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
          headers: {Authorization: `Bearer ${token}`},
        });
        console.log("Información de escuela cargada:", escuelaRes.data);
        setEscuelaInfo(escuelaRes.data);
      }
    } catch (error) {
      console.error("Error cargando información de escuela:", error);
    }
  };

  const buscarEstudiantes = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(services.alumnos, {
        headers: {Authorization: `Bearer ${token}`},
      });

      const filtrados = response.data.filter(
        (est) =>
          est.nombre
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase()) ||
          est.apellido
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase()) ||
          est.codigo_mined
            ?.toLowerCase()
            .includes(busquedaEstudiante.toLowerCase())
      );

      setEstudiantes(filtrados);
      setMostrarResultados(true);
    } catch (error) {
      console.error("Error buscando estudiantes:", error);
    }
  };

  const seleccionarEstudiante = async (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setBusquedaEstudiante(`${estudiante.nombre} ${estudiante.apellido}`);
    setMostrarResultados(false);
    await cargarEstadoCuenta(estudiante.id_estudiante);
  };

  const cargarEstadoCuenta = async (idEstudiante) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(
        services.finanzasEstadoCuenta(idEstudiante),
        {
          headers: {Authorization: `Bearer ${token}`},
        }
      );
      setEstadoCuenta(response.data);
    } catch (error) {
      console.error("Error cargando estado de cuenta:", error);
      showToast(
        error?.response?.data?.error || "Error al cargar el estado de cuenta",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-NI", {
      style: "currency",
      currency: "NIO",
    }).format(amount || 0);
  };

  const exportarPDF = () => {
    generarPDF(false);
  };

  const vistaPrevia = () => {
    generarPDF(true);
  };

  const generarPDF = async (preview = false) => {
    if (!estadoCuenta || !estudianteSeleccionado) return;

    // Asegurarse de que la información de la escuela esté cargada
    let infoEscuela = escuelaInfo;
    if (!infoEscuela) {
      console.log("Cargando información de escuela...");
      try {
        const token = localStorage.getItem("token");

        // Obtener el perfil del usuario para conseguir id_escuela
        const userRes = await api.get("/api/usuarios/perfil", {
          headers: {Authorization: `Bearer ${token}`},
        });

        const id_escuela =
          userRes.data.usuario?.id_escuela || userRes.data.id_escuela;

        if (id_escuela) {
          // Obtener la información específica de la escuela
          const escuelaRes = await api.get(`/api/escuelas/${id_escuela}`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          infoEscuela = escuelaRes.data;
          setEscuelaInfo(infoEscuela);
          console.log("Escuela cargada para PDF:", infoEscuela);
        }
      } catch (error) {
        console.error("Error cargando escuela para PDF:", error);
      }
    }

    console.log("Generando PDF con escuelaInfo:", infoEscuela);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Función para agregar pie de página
    const agregarPiePagina = (pageNum) => {
      doc.setFontSize(8);
      doc.setTextColor(100);

      // Número de página
      doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 15, {
        align: "center",
      });

      // Información de la escuela en el pie
      if (infoEscuela) {
        // Dirección
        if (infoEscuela.direccion) {
          doc.text(
            `Dirección: ${infoEscuela.direccion}`,
            pageWidth / 2,
            pageHeight - 11,
            {align: "center"}
          );
        }

        // Teléfono y Email
        const contacto = [];
        if (infoEscuela.telefono) contacto.push(`Tel: ${infoEscuela.telefono}`);
        if (infoEscuela.email) contacto.push(`Email: ${infoEscuela.email}`);

        if (contacto.length > 0) {
          doc.text(contacto.join(" | "), pageWidth / 2, pageHeight - 7, {
            align: "center",
          });
        }
      }

      // Fecha de generación
      doc.text(
        `Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", {locale: es})}`,
        pageWidth / 2,
        pageHeight - 3,
        {align: "center"}
      );

      doc.setTextColor(0);
    };

    let currentY = 20;

    // Encabezado con logo y nombre de escuela
    if (infoEscuela) {
      console.log("Agregando encabezado con escuela:", infoEscuela.nombre);

      // Agregar logo si existe
      if (infoEscuela.logo) {
        try {
          // Usar la misma URL que en reportes
          const logoUrl = `http://localhost:4000${infoEscuela.logo}`;
          console.log("Cargando logo desde:", logoUrl);

          const img = new Image();
          img.crossOrigin = "Anonymous";

          await new Promise((resolve, reject) => {
            img.onload = () => {
              console.log("Logo cargado exitosamente");
              // Logo en la esquina superior izquierda (tamaño 25x25)
              doc.addImage(img, "PNG", 14, 10, 25, 25);
              resolve();
            };
            img.onerror = () => {
              console.log("No se pudo cargar el logo desde:", logoUrl);
              resolve(); // Continuar sin logo
            };
            img.src = logoUrl;
          });
        } catch (error) {
          console.log("Error cargando logo:", error);
        }
      }

      // Nombre de la escuela (más grande que el título)
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(infoEscuela.nombre.toUpperCase(), pageWidth / 2, 20, {
        align: "center",
      });

      currentY = 30;
    }

    // Título del documento (más pequeño que el nombre de la escuela)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ESTADO DE CUENTA", pageWidth / 2, currentY, {align: "center"});

    currentY += 10;

    // Información del estudiante
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.text(
      `Estudiante: ${estadoCuenta.estudiante.nombre} ${estadoCuenta.estudiante.apellido}`,
      14,
      currentY
    );
    currentY += 6;

    doc.text(
      `Código MINED: ${estadoCuenta.estudiante.codigo_mined || "N/A"}`,
      14,
      currentY
    );
    currentY += 6;

    doc.text(
      `Grado: ${estadoCuenta.estudiante.grado || "N/A"} - Sección: ${
        estadoCuenta.estudiante.seccion || "N/A"
      }`,
      14,
      currentY
    );
    currentY += 10;

    // Resumen financiero
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Resumen Financiero", 14, currentY);

    const resumenData = [
      ["Total Pagado", formatCurrency(estadoCuenta.totalPagado)],
      ["Total Descuentos", formatCurrency(estadoCuenta.totalDescuentos)],
      ["Total Pendiente", formatCurrency(estadoCuenta.totalPendiente)],
      ["Total Vencido", formatCurrency(estadoCuenta.totalVencido)],
    ];

    autoTable(doc, {
      startY: currentY + 5,
      head: [["Concepto", "Monto"]],
      body: resumenData,
      theme: "grid",
      headStyles: {fillColor: [59, 130, 246]},
      margin: {bottom: 25},
    });

    let finalY = doc.lastAutoTable.finalY + 10;

    // Historial de pagos
    if (estadoCuenta.historialPagos.length > 0) {
      if (finalY > pageHeight - 80) {
        agregarPiePagina(1);
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Historial de Pagos", 14, finalY);

      const pagosData = estadoCuenta.historialPagos.map((pago) => [
        pago.numero_recibo,
        pago.concepto,
        formatCurrency(pago.monto_original),
        formatCurrency(pago.descuento_monto),
        formatCurrency(pago.monto_total),
        format(new Date(pago.fecha_pago), "dd/MM/yyyy", {locale: es}),
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "Recibo",
            "Concepto",
            "Monto Original",
            "Descuento",
            "Monto Total",
            "Fecha",
          ],
        ],
        body: pagosData,
        theme: "striped",
        headStyles: {fillColor: [59, 130, 246]},
        margin: {bottom: 25},
      });

      finalY = doc.lastAutoTable.finalY + 10;
    }

    // Deudas pendientes
    if (estadoCuenta.deudasPendientes.length > 0) {
      if (finalY > pageHeight - 80) {
        agregarPiePagina(doc.internal.getNumberOfPages());
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(13);
      doc.setFont(undefined, "bold");
      doc.text("Cuentas Pendientes", 14, finalY);

      const deudasData = estadoCuenta.deudasPendientes.map((deuda) => [
        deuda.concepto,
        formatCurrency(deuda.monto_total),
        formatCurrency(deuda.monto_pendiente),
        deuda.fecha_vencimiento
          ? format(new Date(deuda.fecha_vencimiento), "dd/MM/yyyy", {
              locale: es,
            })
          : "Sin vencimiento",
        deuda.estado === "vencido" ? "Vencida" : "Pendiente",
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          ["Concepto", "Monto Total", "Pendiente", "Vencimiento", "Estado"],
        ],
        body: deudasData,
        theme: "striped",
        headStyles: {fillColor: [239, 68, 68]},
        margin: {bottom: 25},
      });
    }

    // Agregar pie de página a la última página
    agregarPiePagina(doc.internal.getNumberOfPages());

    if (preview) {
      // Vista previa en nueva pestaña
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } else {
      // Guardar PDF
      const fileName = `estado_cuenta_${estadoCuenta.estudiante.nombre}_${
        estadoCuenta.estudiante.apellido
      }_${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(fileName);
    }
  };

  const imprimirEstadoCuenta = () => {
    if (!estadoCuenta || !estudianteSeleccionado) return;
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Búsqueda de Estudiante */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Buscar Estudiante
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={busquedaEstudiante}
            onChange={(e) => setBusquedaEstudiante(e.target.value)}
            placeholder="Nombre, apellido o número de identificación..."
            className="w-full pl-10 pr-10 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          />
          {estudianteSeleccionado && (
            <button
              type="button"
              onClick={() => {
                setEstudianteSeleccionado(null);
                setBusquedaEstudiante("");
                setEstadoCuenta(null);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {mostrarResultados && estudiantes.length > 0 && (
          <div className="mt-2 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {estudiantes.map((est) => (
              <button
                key={est.id_estudiante}
                type="button"
                onClick={() => seleccionarEstudiante(est)}
                className="w-full text-left px-4 py-3 hover:bg-gray-600 border-b border-gray-600 last:border-0"
              >
                <div className="font-medium text-gray-100">
                  {est.nombre} {est.apellido}
                </div>
                <div className="text-sm text-gray-400">
                  {est.codigo_mined || "Sin código"} - Grado{" "}
                  {est.gradoid || "N/A"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && <Loader />}

      {/* Estado de Cuenta */}
      {estadoCuenta && !loading && (
        <>
          {/* Botones de Exportar e Imprimir */}
          <div className="flex justify-end gap-3 mb-4">
            <button
              onClick={vistaPrevia}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200"
            >
              <EyeIcon className="h-5 w-5" />
              Vista Previa
            </button>
            <button
              onClick={exportarPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Exportar PDF
            </button>
            <button
              onClick={imprimirEstadoCuenta}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
            >
              <PrinterIcon className="h-5 w-5" />
              Imprimir
            </button>
          </div>

          {/* Resumen de Cuenta */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500/20 via-emerald-500/10 to-teal-500/20 backdrop-blur-sm rounded-lg shadow-xl border border-green-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-300">
                    Total Pagado
                  </p>
                  <p className="text-2xl font-bold text-green-200 mt-2">
                    {formatCurrency(estadoCuenta.totalPagado)}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 backdrop-blur-sm rounded-lg shadow-xl border border-yellow-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-300">
                    Total Pendiente
                  </p>
                  <p className="text-2xl font-bold text-yellow-200 mt-2">
                    {formatCurrency(estadoCuenta.totalPendiente)}
                  </p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-yellow-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500/20 via-rose-500/10 to-pink-500/20 backdrop-blur-sm rounded-lg shadow-xl border border-red-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Total Vencido
                  </p>
                  <p className="text-2xl font-bold text-red-200 mt-2">
                    {formatCurrency(estadoCuenta.totalVencido)}
                  </p>
                </div>
                <ExclamationCircleIcon className="h-10 w-10 text-red-300" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-blue-500/20 backdrop-blur-sm rounded-lg shadow-xl border border-blue-500/30 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-300">
                    Total Descuentos
                  </p>
                  <p className="text-2xl font-bold text-blue-200 mt-2">
                    {formatCurrency(estadoCuenta.totalDescuentos)}
                  </p>
                </div>
                <DocumentTextIcon className="h-10 w-10 text-blue-300" />
              </div>
            </div>
          </div>

          {/* Becas Activas */}
          {estadoCuenta.becasActivas.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Becas y Descuentos Activos
              </h3>
              <div className="space-y-3">
                {estadoCuenta.becasActivas.map((beca) => (
                  <div
                    key={beca.id_beca}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/20 via-cyan-500/10 to-blue-500/20 rounded-lg border border-blue-500/30"
                  >
                    <div>
                      <div className="font-medium text-gray-100">
                        {beca.nombre}
                      </div>
                      <div className="text-sm text-gray-400">
                        {beca.descripcion}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Válida hasta:{" "}
                        {format(new Date(beca.fecha_fin), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-300">
                        {beca.tipo_descuento === "porcentaje"
                          ? `${beca.valor_descuento}%`
                          : formatCurrency(beca.valor_descuento)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {beca.tipo_descuento === "porcentaje"
                          ? "Porcentaje"
                          : "Fijo"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deudas Pendientes */}
          {estadoCuenta.deudasPendientes.length > 0 && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
              <div className="px-6 py-4 bg-yellow-500/10 border-b border-yellow-500/30">
                <h3 className="text-lg font-semibold text-yellow-300">
                  Cuentas Pendientes de Pago
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Concepto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Monto Original
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Monto Pendiente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Fecha Vencimiento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                    {estadoCuenta.deudasPendientes.map((deuda) => (
                      <tr
                        key={deuda.id_cuenta}
                        className="hover:bg-gray-700/50"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-100">
                          {deuda.concepto}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-100">
                          {formatCurrency(deuda.monto_total)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-100">
                          {formatCurrency(deuda.monto_pendiente)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {deuda.fecha_vencimiento
                            ? format(
                                new Date(deuda.fecha_vencimiento),
                                "dd/MM/yyyy",
                                {locale: es}
                              )
                            : "Sin vencimiento"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {deuda.estado === "vencida" ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300">
                              Vencida
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Historial de Pagos */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-gray-100">
                Historial de Pagos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Concepto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Monto Original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Descuento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Monto Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800/30 divide-y divide-gray-700">
                  {estadoCuenta.historialPagos.map((pago) => (
                    <tr key={pago.id_pago} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-300">
                        {pago.numero_recibo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-100">
                        {pago.concepto}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatCurrency(pago.monto_original)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-300">
                        {pago.descuento_porcentaje > 0 &&
                          `${pago.descuento_porcentaje}%`}
                        {pago.descuento_monto > 0 &&
                          ` -${formatCurrency(pago.descuento_monto)}`}
                        {pago.descuento_porcentaje === 0 &&
                          pago.descuento_monto === 0 &&
                          "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-100">
                        {formatCurrency(pago.monto_total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 capitalize">
                          {pago.metodo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {format(new Date(pago.fecha_pago), "dd/MM/yyyy HH:mm", {
                          locale: es,
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {pago.anulado ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300">
                            Anulado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300">
                            Válido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Estado Vacío */}
      {!loading && !estadoCuenta && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 p-12 text-center">
          <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            Busque un Estudiante
          </h3>
          <p className="text-gray-400">
            Ingrese el nombre o identificación del estudiante para ver su estado
            de cuenta
          </p>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}
    </div>
  );
};

export default EstadoCuentaTab;
