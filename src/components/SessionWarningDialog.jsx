import React from "react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";

const formatTime = (totalSeconds) => {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}`;
};

function SessionWarningDialog({
  isOpen,
  countdown,
  maxCountdown = 30,
  onContinue,
  onLogout,
}) {
  if (!isOpen) return null;

  const safeMax = Math.max(1, Number(maxCountdown) || 30);
  const safeCurrent = Math.max(0, Number(countdown) || 0);
  const progress = Math.min(100, Math.max(0, (safeCurrent / safeMax) * 100));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:w-full sm:max-w-lg">
          {/* Header con icono de advertencia */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <ExclamationTriangleIcon className="h-7 w-7 text-orange-600 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  Sesión por Expirar
                </h3>
                <p className="text-sm text-yellow-100">
                  Tu sesión está a punto de cerrarse
                </p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="bg-white px-6 py-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center gap-3 mb-4">
                <ClockIcon className="h-16 w-16 text-orange-500" />
                <div className="text-6xl font-bold text-orange-600 tabular-nums">
                  {formatTime(countdown)}
                </div>
              </div>

              <p className="text-gray-700 text-lg mb-2">
                Tu sesión expirará en{" "}
                <span className="font-bold text-orange-600">
                  {formatTime(countdown)}
                </span>
              </p>

              <p className="text-gray-600 text-sm">
                Por seguridad, serás desconectado automáticamente si no realizas
                ninguna acción.
              </p>
            </div>

            {/* Indicador de progreso */}
            <div className="mb-6">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000 ease-linear"
                  style={{width: `${progress}%`}}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onContinue}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                <ArrowPathIcon className="h-5 w-5" />
                Continuar Sesión
              </button>

              <button
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all transform hover:scale-105 shadow-lg font-semibold"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Cerrar Sesión
              </button>
            </div>

            {/* Mensaje adicional */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                💡 Tip: Cualquier actividad en el sistema mantendrá tu sesión
                activa
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionWarningDialog;
