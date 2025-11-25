import React from "react";
import {Navigate} from "react-router-dom";
import {canAccessRoute, getDefaultRoute} from "../config/roles";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";

/**
 * Componente para proteger rutas según roles de usuario
 */
const ProtectedRoute = ({children, user, requiredPermission}) => {
  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no hay rol definido, mostrar error
  if (!user.rol) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl border border-red-500/20 p-8">
          <div className="text-center">
            <ShieldExclamationIcon className="w-20 h-20 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Error de Autenticación
            </h2>
            <p className="text-gray-400 mb-6">
              No se pudo determinar tu rol de usuario. Por favor, contacta al
              administrador.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verificar si el usuario tiene acceso a la ruta
  const currentPath = window.location.pathname;
  const hasAccess = canAccessRoute(user.rol, currentPath);

  // Si no tiene acceso, mostrar página de acceso denegado
  if (!hasAccess) {
    const defaultRoute = getDefaultRoute(user.rol);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-gray-800 rounded-2xl shadow-2xl border border-yellow-500/20 p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-400 mb-2">
              No tienes permisos para acceder a esta página.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Tu rol actual:{" "}
              <span className="font-semibold text-purple-400">{user.rol}</span>
            </p>

            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">
                Si crees que esto es un error, contacta al administrador del
                sistema.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.history.back()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Volver Atrás
              </button>
              <button
                onClick={() => (window.location.href = defaultRoute)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar el componente hijo
  return children;
};

export default ProtectedRoute;
