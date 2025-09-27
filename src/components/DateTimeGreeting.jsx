import React, {useEffect, useState} from "react";

function DateTimeGreeting() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  let saludo = "Buenos días";
  if (hour >= 12 && hour < 19) saludo = "Buenas tardes";
  else if (hour >= 19 || hour < 6) saludo = "Buenas noches";

  const fecha = now.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const hora = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="absolute right-10 top-8 text-right mr-10">
      <div className="text-lg md:text-xl font-semibold text-blue-300">
        {saludo} 👋
      </div>
      <div className="text-sm text-gray-300">
        {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
      </div>
      <div className="text-2xl font-mono text-blue-200">{hora}</div>
    </div>
  );
}
export default DateTimeGreeting;
