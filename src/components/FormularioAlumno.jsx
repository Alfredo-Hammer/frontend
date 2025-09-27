import React, {useState} from "react";
import {
  Box,
  Grid,
  TextField,
  Typography,
  Divider,
  Button,
  MenuItem,
} from "@mui/material";

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return edad >= 0 ? edad : "";
}

function FormularioAlumno({escuelas, grados, secciones, onSubmit, onCancel}) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    edad: "",
    fechaNacimiento: "",
    codigo_mined: "",
    id_escuela: "",
    id_grado: "",
    id_seccion: "",
    nombrePadre: "",
    telefonoPadre: "",
    nombreMadre: "",
    telefonoMadre: "",
    direccion: "",
    colonia: "",
    ciudad: "",
    codigoPostal: "",
    telefonoContacto: "",
    email: "",
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    let newForm = {...form, [name]: value};
    if (name === "fechaNacimiento") {
      newForm.edad = calcularEdad(value);
    }
    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* DATOS DEL ALUMNO */}
      <Typography variant="h6" color="primary" fontWeight={700} gutterBottom>
        Datos del Alumno
      </Typography>
      <Divider sx={{mb: 2}} />
      <Grid container spacing={2}>
        {/* Fila 1: Nombre y Apellido */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Apellido"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>
        {/* Fila 2: Fecha de nacimiento y Edad */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Fecha de nacimiento"
            name="fechaNacimiento"
            type="date"
            value={form.fechaNacimiento}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{shrink: true}}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Edad"
            name="edad"
            type="number"
            value={form.edad}
            onChange={handleChange}
            fullWidth
            required
            inputProps={{min: 1, readOnly: true}}
          />
        </Grid>
        {/* Fila 3: Código MINED y Escuela */}
        <Grid item xs={12} md={6}>
          <TextField
            label="Código MINED"
            name="codigo_mined"
            value={form.codigo_mined}
            onChange={handleChange}
            fullWidth
          />
        </Grid>

        {/* Escuela: campo completo */}
        <Grid item xs={12} md={12}>
          <TextField
            select
            label="Escuela"
            name="id_escuela"
            value={form.id_escuela}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">Seleccione una opción</MenuItem>
            {escuelas.map((esc) => (
              <MenuItem key={esc.id_escuela} value={String(esc.id_escuela)}>
                {esc.nombre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Grado: campo completo */}
        <Grid item xs={12} md={12}>
          <TextField
            select
            label="Grado"
            name="id_grado"
            value={form.id_grado}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">Seleccione una opción</MenuItem>
            {grados.map((g) => (
              <MenuItem key={g.id_grado} value={String(g.id_grado)}>
                {g.nombre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        {/* Sección: campo completo */}
        <Grid item xs={12} md={12}>
          <TextField
            select
            label="Sección"
            name="id_seccion"
            value={form.id_seccion}
            onChange={handleChange}
            fullWidth
            required
          >
            <MenuItem value="">Seleccione una opción</MenuItem>
            {secciones.map((s) => (
              <MenuItem key={s.id_seccion} value={String(s.id_seccion)}>
                {s.nombre}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* DATOS DE LOS PADRES */}
      <Typography
        variant="h6"
        color="primary"
        fontWeight={700}
        mt={4}
        gutterBottom
      >
        Datos de los Padres
      </Typography>
      <Divider sx={{mb: 2}} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre del padre"
            name="nombrePadre"
            value={form.nombrePadre}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Teléfono del padre"
            name="telefonoPadre"
            value={form.telefonoPadre}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Nombre de la madre"
            name="nombreMadre"
            value={form.nombreMadre}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Teléfono de la madre"
            name="telefonoMadre"
            value={form.telefonoMadre}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* DATOS DE RESIDENCIA Y CONTACTO */}
      <Typography
        variant="h6"
        color="primary"
        fontWeight={700}
        mt={4}
        gutterBottom
      >
        Datos de Residencia y Contacto
      </Typography>
      <Divider sx={{mb: 2}} />
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Colonia"
            name="colonia"
            value={form.colonia}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Ciudad"
            name="ciudad"
            value={form.ciudad}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Código Postal"
            name="codigoPostal"
            value={form.codigoPostal}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Teléfono de contacto"
            name="telefonoContacto"
            value={form.telefonoContacto}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
          />
        </Grid>
      </Grid>

      {/* BOTONES */}
      <Box mt={4} display="flex" justifyContent="flex-end" gap={2}>
        <Button variant="contained" color="primary" type="submit">
          Guardar
        </Button>
        <Button variant="outlined" color="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </Box>
    </form>
  );
}

export default FormularioAlumno;
