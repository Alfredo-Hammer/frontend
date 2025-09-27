import React, {useEffect, useState, useMemo} from "react";
import {Calendar, momentLocalizer} from "react-big-calendar";
import {parseISO} from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(require("moment"));

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function HorarioPage() {
  const [horario, setHorario] = useState([]);
  const [horas, setHoras] = useState([]);
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [gradosSecciones, setGradosSecciones] = useState([]);

  useEffect(() => {
    // Obtén grados/secciones del usuario (puedes adaptar esto a tu API)
    fetch("http://localhost:4000/api/usuario/grados-secciones", {
      headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
    })
      .then((res) => res.json())
      .then((data) => {
        setGradosSecciones(data);
        if (data.length > 0) {
          setGrado(data[0].grado);
          setSeccion(data[0].seccion);
        }
      });
  }, []);

  useEffect(() => {
    if (grado && seccion) {
      fetch(
        `http://localhost:4000/api/horario?grado=${grado}&seccion=${seccion}`,
        {
          headers: {Authorization: `Bearer ${localStorage.getItem("token")}`},
        }
      )
        .then((res) => res.json())
        .then((data) => {
          setHorario(data);
          // Extrae las horas únicas ordenadas
          const horasUnicas = [
            ...new Set(data.map((item) => item.hora)),
          ].sort();
          setHoras(horasUnicas);
        });
    }
  }, [grado, seccion]);

  // Transforma tu horario a eventos de calendario
  const events = useMemo(
    () =>
      horario.map((clase) => ({
        title: clase.materia + (clase.aula ? ` (${clase.aula})` : ""),
        start: parseISO(clase.fecha_inicio), // Debes tener fecha y hora
        end: parseISO(clase.fecha_fin),
        allDay: false,
      })),
    [horario]
  );

  return (
    <div className="max-w-5xl mx-auto py-10">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Mi Horario</h1>
      {gradosSecciones.length > 1 && (
        <div className="flex gap-4 mb-6">
          <select
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {gradosSecciones.map((gs) => (
              <option key={gs.grado + gs.seccion} value={gs.grado}>
                {gs.grado}
              </option>
            ))}
          </select>
          <select
            value={seccion}
            onChange={(e) => setSeccion(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {gradosSecciones
              .filter((gs) => gs.grado === grado)
              .map((gs) => (
                <option key={gs.seccion} value={gs.seccion}>
                  {gs.seccion}
                </option>
              ))}
          </select>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-blue-300 bg-white rounded shadow">
          <thead>
            <tr>
              <th className="border px-4 py-2">Hora</th>
              {diasSemana.map((dia) => (
                <th key={dia} className="border px-4 py-2">
                  {dia}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horas.map((hora) => (
              <tr key={hora}>
                <td className="border px-4 py-2 font-semibold">{hora}</td>
                {diasSemana.map((dia) => {
                  const clase = horario.find(
                    (h) => h.dia === dia && h.hora === hora
                  );
                  return (
                    <td key={dia} className="border px-4 py-2 text-center">
                      {clase ? (
                        <>
                          <div className="font-bold">{clase.materia}</div>
                          <div className="text-xs text-blue-700">
                            {clase.aula}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          height: "80vh",
          background: "#fff",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Calendar
          localizer={localizer}
          events={events}
          defaultView="week"
          views={["week", "day"]}
          startAccessor="start"
          endAccessor="end"
          style={{height: "100%"}}
          messages={{
            week: "Semana",
            day: "Día",
            today: "Hoy",
            previous: "Anterior",
            next: "Siguiente",
          }}
        />
      </div>
    </div>
  );
}

export default HorarioPage;
