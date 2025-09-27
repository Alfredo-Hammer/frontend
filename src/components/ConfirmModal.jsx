import {
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  TrashIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";
import {useState} from "react";

export default function ConfirmModal({
  open,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "warning", // warning, danger, success, info
  icon,
  loading = false,
}) {
  const [isClosing, setIsClosing] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onCancel?.();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm?.();
  };

  // Determinar colores y ícono basado en el tipo
  const getTypeConfig = () => {
    switch (type) {
      case "danger":
        return {
          bgGradient: "from-red-500 to-pink-600",
          ringColor: "ring-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          confirmBg: "from-red-600 to-red-700",
          confirmHover: "hover:from-red-700 hover:to-red-800",
          defaultIcon: <TrashIcon className="h-8 w-8" />,
        };
      case "success":
        return {
          bgGradient: "from-emerald-500 to-teal-600",
          ringColor: "ring-emerald-200",
          iconBg: "bg-emerald-100",
          iconColor: "text-emerald-600",
          confirmBg: "from-emerald-600 to-emerald-700",
          confirmHover: "hover:from-emerald-700 hover:to-emerald-800",
          defaultIcon: <CheckIcon className="h-8 w-8" />,
        };
      case "info":
        return {
          bgGradient: "from-blue-500 to-indigo-600",
          ringColor: "ring-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          confirmBg: "from-blue-600 to-blue-700",
          confirmHover: "hover:from-blue-700 hover:to-blue-800",
          defaultIcon: <ShieldExclamationIcon className="h-8 w-8" />,
        };
      default: // warning
        return {
          bgGradient: "from-amber-500 to-orange-600",
          ringColor: "ring-amber-200",
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          confirmBg: "from-amber-600 to-orange-600",
          confirmHover: "hover:from-amber-700 hover:to-orange-700",
          defaultIcon: <ExclamationTriangleIcon className="h-8 w-8" />,
        };
    }
  };

  const typeConfig = getTypeConfig();
  const displayIcon = icon || typeConfig.defaultIcon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ${
          isClosing
            ? "scale-95 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
      >
        {/* Header with Icon */}
        <div className="p-8 pb-4">
          {/* Close Button */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 group disabled:opacity-50"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* Icon Container */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`relative p-4 rounded-3xl ${typeConfig.iconBg} ${typeConfig.ringColor} ring-4 ring-opacity-50 mb-6 backdrop-blur-sm`}
            >
              {/* Background Effects */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${typeConfig.bgGradient} opacity-10 rounded-3xl`}
              ></div>
              <div className={`relative ${typeConfig.iconColor}`}>
                {displayIcon}
              </div>

              {/* Pulse Animation for warning/danger */}
              {(type === "warning" || type === "danger") && (
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${typeConfig.bgGradient} opacity-20 animate-ping`}
                ></div>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{title}</h2>

            {/* Message */}
            <p className="text-gray-600 text-base leading-relaxed max-w-sm">
              {message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 rounded-b-3xl px-8 py-6 flex gap-4">
          {/* Cancel Button */}
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          {/* Confirm Button */}
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 px-6 py-3 bg-gradient-to-r ${typeConfig.confirmBg} ${typeConfig.confirmHover} text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Procesando...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full -mr-16 -mt-16 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-50 to-transparent rounded-full -ml-12 -mb-12 opacity-40"></div>
      </div>
    </div>
  );
}
