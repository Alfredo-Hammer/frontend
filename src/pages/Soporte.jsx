import React, {useState} from "react";
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
  PaperAirplaneIcon,
  UserIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/solid";
import PageHeader from "../components/PageHeader";
import api from "../api/axiosConfig";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";

function Soporte() {
  const [formData, setFormData] = useState({
    asunto: "",
    mensaje: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({show: false, message: "", type: ""});
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      await api.post("/api/comunicaciones/soporte", formData);
      setToast({
        show: true,
        message: "Mensaje enviado correctamente. Te contactaremos pronto.",
        type: "success",
      });
      setFormData({asunto: "", mensaje: "", telefono: ""});
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      setToast({
        show: true,
        message: "Error al enviar el mensaje. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({...toast, show: false})}
        />
      )}

      <ConfirmModal
        open={showConfirm}
        title="¿Enviar mensaje?"
        message="¿Estás seguro de que deseas enviar este mensaje al soporte técnico?"
        confirmText="Enviar"
        cancelText="Cancelar"
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirm(false)}
        type="info"
        icon={<PaperAirplaneIcon className="h-8 w-8 text-blue-500" />}
      />

      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Contacto y Soporte"
          subtitle="Estamos aquí para ayudarte. Contáctanos si tienes dudas o problemas con el sistema."
          icon={LifebuoyIcon}
          gradientFrom="blue-600"
          gradientTo="cyan-600"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Columna Izquierda: Información y Bio */}
          <div className="space-y-8">
            {/* Tarjeta de Contacto */}
            <div className="bg-gray-900/60 border border-gray-700/80 rounded-3xl shadow-2xl p-8 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-500 group-hover:bg-blue-500/20"></div>

              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-400" />
                  Canales de Atención
                </h2>

                <div className="space-y-6">
                  {/* Teléfono */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-colors duration-300">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <PhoneIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium mb-1">
                        Llámanos o escríbenos
                      </p>
                      <p className="text-xl font-bold text-white tracking-wide">
                        941 296 4916
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        Disponible en WhatsApp
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 transition-colors duration-300">
                    <div className="p-3 bg-blue-500/20 rounded-xl">
                      <EnvelopeIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 font-medium mb-1">
                        Correo Electrónico
                      </p>
                      <p className="text-xl font-bold text-white tracking-wide break-all">
                        coderhammer70@gmail.com
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        Respuesta en menos de 24h
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Biografía del Desarrollador */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/80 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-8 -mt-8"></div>

              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <CodeBracketIcon className="h-6 w-6 text-purple-400" />
                Sobre el Desarrollador
              </h3>

              <div className="flex items-start gap-4">
                <div className="p-1 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                    <UserIcon className="h-10 w-10 text-gray-400" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Alfredo Pereira Hammer
                  </h4>
                  <p className="text-purple-400 text-sm font-medium mb-2">
                    Desarrollador Web & Android
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Soy un apasionado por la programación y el aprendizaje
                    constante. Me dedico al desarrollo de sistemas web y
                    aplicaciones móviles Android con Java. Mi objetivo es crear
                    herramientas útiles y sencillas que faciliten el trabajo de
                    los demás.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formulario */}
          <div className="bg-gray-900/60 border border-gray-700/80 rounded-3xl shadow-2xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <PaperAirplaneIcon className="h-8 w-8 text-cyan-400" />
              Envíanos un Mensaje
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="¿En qué podemos ayudarte?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Teléfono (Opcional)
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
                  placeholder="Para contactarte más rápido"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Mensaje
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Describe tu consulta o problema detalladamente..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>Enviando...</>
                ) : (
                  <>
                    Enviar Mensaje
                    <PaperAirplaneIcon className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Soporte;
