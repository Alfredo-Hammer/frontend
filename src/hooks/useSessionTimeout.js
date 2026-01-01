import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import { setTokenWithExpiration } from '../utils/tokenUtils';

const useSessionTimeout = (onSessionExpired) => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const navigate = useNavigate();
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const activityTimerRef = useRef(null);

  // Tiempo en milisegundos
  // Nota: el backend expira el JWT; acá solo mostramos advertencia basada en tokenExpiry.
  const WARNING_TIME = 5 * 60 * 1000; // 5 minutos antes de expirar

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
  }, []);

  const logout = useCallback(() => {
    clearAllTimers();
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    setShowWarning(false);

    // Notificar a App.js que la sesión expiró
    if (onSessionExpired) {
      onSessionExpired();
    }

    navigate('/login');
  }, [clearAllTimers, navigate, onSessionExpired]);

  const startCountdown = useCallback(() => {
    // countdown ya viene seteado según el tiempo restante
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const getExpiryMs = useCallback(() => {
    const raw = localStorage.getItem('tokenExpiry');
    const expiryMs = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(expiryMs) ? expiryMs : null;
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();

    const token = localStorage.getItem('token');
    if (!token) return;

    const expiryMs = getExpiryMs();
    if (!expiryMs) return;

    const timeRemaining = expiryMs - Date.now();

    if (timeRemaining <= 0) {
      logout();
      return;
    }

    const warningDelay = Math.max(timeRemaining - WARNING_TIME, 0);

    // Timer para mostrar advertencia antes de expirar
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(Math.max(0, Math.ceil(Math.min(WARNING_TIME, expiryMs - Date.now()) / 1000)));
      startCountdown();
    }, warningDelay);

    // Timer para cerrar sesión automáticamente
    logoutTimerRef.current = setTimeout(() => {
      logout();
    }, timeRemaining);
  }, [WARNING_TIME, clearAllTimers, getExpiryMs, logout, startCountdown]);

  const refreshSession = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Cerrar el modal inmediatamente para que el usuario vea respuesta al click.
      setShowWarning(false);
      clearAllTimers();

      // Renovar el JWT en backend y actualizar tokenExpiry en frontend.
      const res = await api.post('/api/auth/refresh');
      const nuevoToken = res?.data?.token;
      if (!nuevoToken) {
        throw new Error('No se recibió token al renovar la sesión');
      }
      setTokenWithExpiration(nuevoToken);

      // Reiniciar timers con el nuevo expiry
      setCountdown(Math.ceil(WARNING_TIME / 1000));
      startTimers();
    } catch (error) {
      console.error('Error al renovar sesión:', error);
      logout();
    }
  }, [WARNING_TIME, clearAllTimers, logout, startTimers]);

  const handleContinue = useCallback(() => {
    refreshSession();
  }, [refreshSession]);

  const resetTimer = useCallback(() => {
    if (showWarning) return; // No resetear si ya está mostrando advertencia

    const token = localStorage.getItem('token');
    if (!token) return;
    // No extendemos tokenExpiry solo por actividad (el JWT expira en backend).
    // Solo reprogramamos timers en caso de que tokenExpiry haya cambiado por login/refresh real.
    startTimers();
  }, [showWarning, startTimers]);

  // Detectar actividad del usuario
  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);

      activityTimerRef.current = setTimeout(() => {
        resetTimer();
      }, 1000); // Debounce de 1 segundo
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [resetTimer]);

  // Inicializar timers al montar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const expiryMs = getExpiryMs();
    if (!expiryMs) {
      // Si no existe tokenExpiry, no podemos calcular warning con precisión.
      // Fallback: no iniciar timers aquí.
      return;
    }

    const timeRemaining = expiryMs - Date.now();

    if (timeRemaining <= 0) {
      logout();
      return;
    }

    if (timeRemaining <= WARNING_TIME) {
      // Ya está cerca de expirar, mostrar advertencia inmediatamente
      setShowWarning(true);
      const secondsLeft = Math.floor(timeRemaining / 1000);
      setCountdown(secondsLeft > 0 ? secondsLeft : 0);
      startCountdown();

      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, timeRemaining);
    } else {
      startTimers();
    }

    return () => {
      clearAllTimers();
    };
  }, [WARNING_TIME, clearAllTimers, getExpiryMs, logout, startTimers, startCountdown]);

  return {
    showWarning,
    countdown,
    maxCountdown: Math.ceil(WARNING_TIME / 1000),
    handleContinue,
    handleLogout: logout,
  };
};

export default useSessionTimeout;
