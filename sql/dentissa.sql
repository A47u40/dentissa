-- Migrations will appear here as you chat with AI

create table roles (
  id bigint primary key generated always as identity,
  nombre text not null
);

create table usuarios (
  id bigint primary key generated always as identity,
  email text unique not null,
  password text not null,
  rol_id bigint references roles (id),
  nombre_completo text,
  telefono text,
  fecha_registro timestamp with time zone default now()
);

create table pacientes_perfil (
  id bigint primary key generated always as identity,
  usuario_id bigint references usuarios (id),
  edad int,
  fecha_nacimiento date,
  enfermedad_importante text,
  alergias text,
  tiene_cuenta boolean
);

create table especialistas_perfil (
  id bigint primary key generated always as identity,
  usuario_id bigint references usuarios (id),
  especialidad text,
  whatsapp_contacto text
);

create table citas (
  id bigint primary key generated always as identity,
  paciente_id bigint references usuarios (id),
  especialista_id bigint references usuarios (id),
  fecha_cita date,
  hora_inicio time,
  hora_fin time,
  estado text check (
    estado in (
      'Pendiente',
      'Confirmada',
      'Realizada',
      'Cancelada',
      'Reprogramada'
    )
  ),
  motivo_cambio text,
  servicio_realizado text,
  comentario_especialista text
);

create table cola_notificaciones (
  id bigint primary key generated always as identity,
  cita_id bigint references citas (id),
  medio text check (medio in ('WhatsApp', 'SMS', 'Correo')),
  tipo_aviso text check (
    tipo_aviso in ('24H_CONFIRMACION', '1H_RECORDATORIO')
  ),
  estado text check (estado in ('Pendiente', 'Enviado', 'Fallido')),
  fecha_envio_programada timestamp with time zone
);

create table promociones (
  id bigint primary key generated always as identity,
  titulo text,
  descripcion text,
  imagen_url text,
  activo boolean
);

create table casos_exito (
  id bigint primary key generated always as identity,
  titulo text,
  descripcion text,
  imagen_antes text,
  imagen_despues text
);

create table preguntas_frecuentes (
  id bigint primary key generated always as identity,
  pregunta text,
  respuesta text
);

alter table promociones
add column fecha_inicio timestamp with time zone,
add column fecha_fin timestamp with time zone;

create
or replace function desactivar_promociones_expiradas () returns void as $$
BEGIN
    UPDATE promociones
    SET activo = false
    WHERE activo = true AND fecha_fin < now();
END;
$$ language plpgsql;