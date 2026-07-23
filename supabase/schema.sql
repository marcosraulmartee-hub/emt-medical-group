-- EMT Clinic — esquema inicial de Supabase

-- Roles de aplicación
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum ('admin', 'clinician', 'technician', 'reception');
  end if;
end $$;

-- Perfiles de usuario
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'reception',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auditar el registro de sesiones y cambios de estado
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Permisos y roles
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  code public.app_role unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_code public.app_role not null references public.roles(code) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_code, permission_key)
);

-- Pacientes
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique,
  phone text,
  birth_date date,
  gender text,
  medical_record text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_patients_updated_at on public.patients;
create trigger trg_patients_updated_at
  before update on public.patients
  for each row execute function public.set_updated_at();

-- Diagnósticos del paciente
create table if not exists public.patient_diagnoses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  diagnosis text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Medicamentos
create table if not exists public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication text not null,
  dosage text,
  frequency text,
  started_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contraindicaciones
create table if not exists public.patient_contraindications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  contraindication text not null,
  severity text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Consentimientos
create table if not exists public.patient_consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  content text not null,
  signed_at timestamptz,
  signer_name text,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documentos de paciente
create table if not exists public.patient_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  url text not null,
  type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Equipos EMT
create table if not exists public.emt_equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manufacturer text,
  model text,
  serial_number text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bobinas
create table if not exists public.emt_coils (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Categorías de protocolo
create table if not exists public.protocol_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Protocolos
create table if not exists public.protocols (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null references public.protocol_categories(code),
  diagnosis text,
  indication text,
  objective text,
  technical_parameters text,
  contraindications text,
  precautions text,
  adverse_events text,
  evidence_level text,
  bibliography text,
  clinical_guidelines text,
  regulatory_body text,
  version text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Escalas clínicas
create table if not exists public.clinical_scales (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sesiones EMT
create table if not exists public.emt_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid not null references auth.users(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  equipment_id uuid not null references public.emt_equipment(id) on delete set null,
  coil_id uuid not null references public.emt_coils(id) on delete set null,
  stimulated_region text,
  laterality text,
  protocol_id uuid not null references public.protocols(id) on delete set null,
  frequency_hz numeric,
  intensity_pct numeric,
  rmt_pct numeric,
  motor_threshold numeric,
  pulses integer,
  trains integer,
  duration_minutes integer,
  clinical_response text,
  adverse_events text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- MIGRACIÓN 002 — Roles reales (6), autoprovisión de perfiles y RLS
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- Seguro de re-ejecutar (usa IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS).
-- =====================================================================

-- 1) Roles: clinician->medico, technician->tecnico, reception->recepcionista,
--    + contable y paciente (paciente queda reservado para el portal futuro).
do $$
begin
  if exists (select 1 from pg_enum where enumlabel = 'clinician' and enumtypid = 'public.app_role'::regtype) then
    alter type public.app_role rename value 'clinician' to 'medico';
  end if;
  if exists (select 1 from pg_enum where enumlabel = 'technician' and enumtypid = 'public.app_role'::regtype) then
    alter type public.app_role rename value 'technician' to 'tecnico';
  end if;
  if exists (select 1 from pg_enum where enumlabel = 'reception' and enumtypid = 'public.app_role'::regtype) then
    alter type public.app_role rename value 'reception' to 'recepcionista';
  end if;
end $$;

alter type public.app_role add value if not exists 'contable';
alter type public.app_role add value if not exists 'paciente';

-- 2) Autoprovisión de perfiles al registrarse (antes no existía: los usuarios
--    nuevos quedaban sin fila en profiles y por lo tanto sin permisos).
--    El primer usuario que se registra queda como admin; el resto entra
--    como recepcionista y un admin lo asciende luego desde Configuración > Usuarios.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    (case when not exists (select 1 from public.profiles) then 'admin' else 'recepcionista' end)::public.app_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2b) Backfill: si ya te registraste ANTES de que existiera este trigger,
--     tu usuario de auth.users no tiene fila en profiles todavía. Esto la
--     crea (como admin si profiles está vacía). Seguro de re-ejecutar.
insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  (case when not exists (select 1 from public.profiles) then 'admin' else 'recepcionista' end)::public.app_role
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- 3) Columnas de "corrección" para las tablas clínicas append-only.
--    Nunca se actualiza el contenido de una fila existente: una corrección
--    es una fila nueva, y como mucho se desactiva la anterior.
alter table public.patient_diagnoses add column if not exists is_active boolean not null default true;
alter table public.patient_medications add column if not exists is_active boolean not null default true;
alter table public.patient_contraindications add column if not exists is_active boolean not null default true;

-- 4) Trigger genérico que bloquea a nivel de base cualquier UPDATE que toque
--    columnas de contenido clínico (solo permite cambiar is_active/updated_at).
create or replace function public.enforce_append_only()
returns trigger
language plpgsql
as $$
declare
  old_row jsonb := to_jsonb(old);
  new_row jsonb := to_jsonb(new);
  allowed text[] := tg_argv;
  key text;
begin
  for key in select jsonb_object_keys(old_row) loop
    if key = any(allowed) then
      continue;
    end if;
    if old_row -> key is distinct from new_row -> key then
      raise exception 'La columna "%" es de solo lectura (registro clínico inmutable)', key;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists trg_patient_diagnoses_append_only on public.patient_diagnoses;
create trigger trg_patient_diagnoses_append_only
  before update on public.patient_diagnoses
  for each row execute function public.enforce_append_only('is_active', 'updated_at');

drop trigger if exists trg_patient_medications_append_only on public.patient_medications;
create trigger trg_patient_medications_append_only
  before update on public.patient_medications
  for each row execute function public.enforce_append_only('is_active', 'updated_at');

drop trigger if exists trg_patient_contraindications_append_only on public.patient_contraindications;
create trigger trg_patient_contraindications_append_only
  before update on public.patient_contraindications
  for each row execute function public.enforce_append_only('is_active', 'updated_at');

-- 5) Helper de RLS: rol del usuario autenticado, solo si su perfil está activo.
--    security definer para poder leer profiles sin recursión de RLS sobre sí misma.
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true limit 1
$$;

-- 6) Row Level Security en todas las tablas.
alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.patients enable row level security;
alter table public.patient_diagnoses enable row level security;
alter table public.patient_medications enable row level security;
alter table public.patient_contraindications enable row level security;
alter table public.patient_consents enable row level security;
alter table public.patient_documents enable row level security;
alter table public.emt_equipment enable row level security;
alter table public.emt_coils enable row level security;
alter table public.protocol_categories enable row level security;
alter table public.protocols enable row level security;
alter table public.clinical_scales enable row level security;
alter table public.emt_sessions enable row level security;

-- profiles: cada quien lee/edita el suyo; admin lee/edita todos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.current_app_role() = 'admin');
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.current_app_role() = 'admin')
  with check (id = auth.uid() or public.current_app_role() = 'admin');

-- audit_logs: cualquier staff activo puede insertar (registrar acción);
-- solo admin puede leer; sin políticas de update/delete (inmutable).
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs for insert
  with check (public.current_app_role() is not null);
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs for select
  using (public.current_app_role() = 'admin');

-- catálogo de permisos/roles: lectura para cualquier staff activo (necesitan
-- cargar sus propios permisos), escritura solo admin.
drop policy if exists permissions_select on public.permissions;
create policy permissions_select on public.permissions for select
  using (public.current_app_role() is not null);
drop policy if exists permissions_write on public.permissions;
create policy permissions_write on public.permissions for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles for select
  using (public.current_app_role() is not null);
drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions for select
  using (public.current_app_role() is not null);
drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- patients: datos de contacto/administrativos — admin, médico, técnico y
-- recepcionista (recepción gestiona altas y cuentas de pacientes).
drop policy if exists patients_all on public.patients;
create policy patients_all on public.patients for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

-- datos clínicos estrictos: solo admin, médico y técnico.
drop policy if exists patient_diagnoses_all on public.patient_diagnoses;
create policy patient_diagnoses_all on public.patient_diagnoses for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists patient_medications_all on public.patient_medications;
create policy patient_medications_all on public.patient_medications for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists patient_contraindications_all on public.patient_contraindications;
create policy patient_contraindications_all on public.patient_contraindications for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists emt_sessions_all on public.emt_sessions;
create policy emt_sessions_all on public.emt_sessions for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists clinical_scales_select on public.clinical_scales;
create policy clinical_scales_select on public.clinical_scales for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists clinical_scales_write on public.clinical_scales;
create policy clinical_scales_write on public.clinical_scales for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- consentimientos y documentos: papeleo administrativo-legal, no clínico en
-- sí mismo — se suma recepcionista porque es quien recibe firmas y archivos.
drop policy if exists patient_consents_all on public.patient_consents;
create policy patient_consents_all on public.patient_consents for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

drop policy if exists patient_documents_all on public.patient_documents;
create policy patient_documents_all on public.patient_documents for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

-- catálogos (equipos, bobinas, categorías, protocolos): lectura para staff
-- clínico/técnico, escritura solo admin.
drop policy if exists emt_equipment_select on public.emt_equipment;
create policy emt_equipment_select on public.emt_equipment for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists emt_equipment_write on public.emt_equipment;
create policy emt_equipment_write on public.emt_equipment for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists emt_coils_select on public.emt_coils;
create policy emt_coils_select on public.emt_coils for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists emt_coils_write on public.emt_coils;
create policy emt_coils_write on public.emt_coils for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists protocol_categories_select on public.protocol_categories;
create policy protocol_categories_select on public.protocol_categories for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists protocol_categories_write on public.protocol_categories;
create policy protocol_categories_write on public.protocol_categories for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists protocols_select on public.protocols;
create policy protocols_select on public.protocols for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists protocols_write on public.protocols;
create policy protocols_write on public.protocols for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- =====================================================================
-- MIGRACIÓN 003 — Agenda (citas) y configuración general de la clínica
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

-- Configuración clave/valor genérica (cupos/día hoy; impuesto, e-CF, etc.
-- en el pase de Facturación reusan esta misma tabla).
create table if not exists public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.clinic_settings (key, value)
values ('daily_appointment_limit', '12')
on conflict (key) do nothing;

-- Citas de agenda — separadas del registro clínico de la sesión
-- (emt_sessions), que se genera cuando la cita se atiende (próximo pase).
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  clinician_id uuid references public.profiles(id) on delete set null,
  protocol_id uuid references public.protocols(id) on delete set null,
  date date not null,
  start_time time not null,
  end_time time,
  status text not null default 'pending', -- pending | confirmed | reschedule_requested | cancelled | completed
  requested_date date,
  requested_start_time time,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_appointments_updated_at on public.appointments;
create trigger trg_appointments_updated_at
  before update on public.appointments
  for each row execute function public.set_updated_at();

alter table public.clinic_settings enable row level security;
alter table public.appointments enable row level security;

drop policy if exists clinic_settings_select on public.clinic_settings;
create policy clinic_settings_select on public.clinic_settings for select
  using (public.current_app_role() is not null);
drop policy if exists clinic_settings_write on public.clinic_settings;
create policy clinic_settings_write on public.clinic_settings for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists appointments_all on public.appointments;
create policy appointments_all on public.appointments for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

-- =====================================================================
-- MIGRACIÓN 004 — Tratamiento TMS: ciclos, checklist de seguridad,
-- vínculo opcional sesión↔cita.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

-- Ciclo de tratamiento de un paciente con un protocolo (ej. "sesión 14 de 30").
-- El número de sesión dentro del ciclo se calcula, no se guarda, para que
-- nunca quede desincronizado.
create table if not exists public.treatment_cycles (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  protocol_id uuid references public.protocols(id) on delete set null,
  planned_sessions integer not null default 1,
  status text not null default 'active', -- active | completed | cancelled
  started_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_treatment_cycles_updated_at on public.treatment_cycles;
create trigger trg_treatment_cycles_updated_at
  before update on public.treatment_cycles
  for each row execute function public.set_updated_at();

-- Catálogo del checklist de seguridad obligatorio (screening estándar rTMS),
-- editable desde Configuración.
create table if not exists public.safety_checklist_items (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  order_index integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.safety_checklist_items (code, label, order_index) values
  ('no_implants', 'Sin implantes metálicos o dispositivos electrónicos cerca de la bobina (marcapasos, clips de aneurisma, neuroestimuladores, fragmentos metálicos)', 1),
  ('no_seizure_history', 'Sin historia personal de convulsiones o epilepsia', 2),
  ('no_unstable_neuro', 'Sin trastorno neurológico agudo o inestable', 3),
  ('pregnancy_ruled_out', 'Embarazo descartado (si aplica)', 4),
  ('medication_reviewed', 'Medicación revisada — sin fármacos que reduzcan significativamente el umbral convulsivo sin autorización', 5),
  ('no_recent_head_injury', 'Sin lesión craneal o cirugía craneal reciente sin autorización médica', 6),
  ('consent_current', 'Paciente informado del procedimiento y riesgos, consentimiento vigente', 7),
  ('no_substance_sleep_risk', 'Sin consumo reciente de alcohol/sustancias ni deprivación severa de sueño', 8)
on conflict (code) do nothing;

-- Ciclo, checklist (snapshot inmutable de las respuestas al momento de la
-- sesión) y vínculo opcional con la cita de agenda que originó la sesión.
alter table public.emt_sessions add column if not exists cycle_id uuid references public.treatment_cycles(id) on delete set null;
alter table public.emt_sessions add column if not exists appointment_id uuid references public.appointments(id) on delete set null;
alter table public.emt_sessions add column if not exists safety_checklist jsonb not null default '[]'::jsonb;

alter table public.treatment_cycles enable row level security;
alter table public.safety_checklist_items enable row level security;

drop policy if exists treatment_cycles_all on public.treatment_cycles;
create policy treatment_cycles_all on public.treatment_cycles for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists safety_checklist_items_select on public.safety_checklist_items;
create policy safety_checklist_items_select on public.safety_checklist_items for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists safety_checklist_items_write on public.safety_checklist_items;
create policy safety_checklist_items_write on public.safety_checklist_items for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

-- =====================================================================
-- MIGRACIÓN 005 — Escalas clínicas (historial de puntajes) y eventos
-- adversos. Ambas son registros clínicos inmutables: se insertan y se
-- leen, nunca se editan ni se borran (no se definen políticas de
-- update/delete a propósito, así quedan denegadas por RLS).
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

insert into public.clinical_scales (code, label, description) values
  ('phq9', 'PHQ-9', 'Patient Health Questionnaire — severidad de síntomas depresivos (0-27)'),
  ('gad7', 'GAD-7', 'Generalized Anxiety Disorder scale — severidad de ansiedad (0-21)'),
  ('madrs', 'MADRS', 'Montgomery-Åsberg Depression Rating Scale (0-60)'),
  ('ybocs', 'Y-BOCS', 'Yale-Brown Obsessive Compulsive Scale (0-40)'),
  ('hamd', 'HAM-D', 'Hamilton Depression Rating Scale'),
  ('bdi2', 'BDI-II', 'Beck Depression Inventory-II (0-63)'),
  ('moca', 'MoCA', 'Montreal Cognitive Assessment (0-30)'),
  ('mmse', 'MMSE', 'Mini-Mental State Examination (0-30)')
on conflict (code) do nothing;

create table if not exists public.patient_scale_scores (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  cycle_id uuid references public.treatment_cycles(id) on delete set null,
  scale_code text not null references public.clinical_scales(code),
  score numeric not null,
  notes text,
  administered_at date not null default current_date,
  administered_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.adverse_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  session_id uuid references public.emt_sessions(id) on delete set null,
  severity text not null default 'leve', -- leve | moderado | grave
  description text not null,
  action_taken text,
  reported_by uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.patient_scale_scores enable row level security;
alter table public.adverse_events enable row level security;

drop policy if exists patient_scale_scores_select on public.patient_scale_scores;
create policy patient_scale_scores_select on public.patient_scale_scores for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists patient_scale_scores_insert on public.patient_scale_scores;
create policy patient_scale_scores_insert on public.patient_scale_scores for insert
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists adverse_events_select on public.adverse_events;
create policy adverse_events_select on public.adverse_events for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'));
drop policy if exists adverse_events_insert on public.adverse_events;
create policy adverse_events_insert on public.adverse_events for insert
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

-- =====================================================================
-- MIGRACIÓN 006 — Facturación NCF (República Dominicana / DGII)
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
--
-- Modelo: factura en borrador totalmente editable; al "emitir" se le
-- asigna el próximo número de la secuencia NCF configurada y queda
-- inmutable (un trigger bloquea cambios a sus montos/identidad). La
-- única corrección posible es una Nota de Crédito (B04) nueva que
-- referencia a la original — nunca se edita ni se borra una emitida.
-- =====================================================================

insert into public.clinic_settings (key, value) values
  ('tax_rate', '0'),
  ('ecf_enabled', 'false')
on conflict (key) do nothing;

-- Secuencias de NCF por tipo. Arrancan sin rango asignado (range_end = 0);
-- un admin las carga desde Configuración → Facturación cuando la DGII
-- autorice los rangos. Emitir una factura de un tipo sin rango configurado
-- falla explícitamente (nunca se inventa un número).
create table if not exists public.ncf_sequences (
  id uuid primary key default gen_random_uuid(),
  ncf_type text unique not null, -- B01 | B02 | B04
  label text not null,
  range_start bigint not null default 0,
  range_end bigint not null default 0,
  next_number bigint not null default 0,
  authorized_until date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ncf_sequences (ncf_type, label) values
  ('B02', 'Consumidor Final'),
  ('B01', 'Crédito Fiscal'),
  ('B04', 'Nota de Crédito')
on conflict (ncf_type) do nothing;

drop trigger if exists trg_ncf_sequences_updated_at on public.ncf_sequences;
create trigger trg_ncf_sequences_updated_at
  before update on public.ncf_sequences
  for each row execute function public.set_updated_at();

-- Tarifario de servicios (sesión individual, paquetes, consultas).
create table if not exists public.price_list (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  label text not null,
  price numeric not null default 0,
  unit text not null default 'sesión',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_price_list_updated_at on public.price_list;
create trigger trg_price_list_updated_at
  before update on public.price_list
  for each row execute function public.set_updated_at();

-- Paquetes/bonos de sesiones comprados por un paciente.
create table if not exists public.session_packages (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  protocol_id uuid references public.protocols(id) on delete set null,
  name text not null,
  total_sessions integer not null,
  used_sessions integer not null default 0,
  price numeric not null default 0,
  status text not null default 'active', -- active | completed | expired | cancelled
  invoice_id uuid,
  purchased_at date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_session_packages_updated_at on public.session_packages;
create trigger trg_session_packages_updated_at
  before update on public.session_packages
  for each row execute function public.set_updated_at();

-- Facturas. subtotal/tax/discount/total se calculan en la app a partir de
-- invoice_items y se guardan como snapshot al emitir (inmutable desde ahí).
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete restrict,
  ncf_type text not null references public.ncf_sequences(ncf_type),
  ncf_number text,
  status text not null default 'draft', -- draft | issued | corrected | cancelled
  corrects_invoice_id uuid references public.invoices(id) on delete set null,
  issue_date date,
  due_date date,
  subtotal numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  discount_amount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'session_packages_invoice_id_fkey') then
    alter table public.session_packages add constraint session_packages_invoice_id_fkey
      foreign key (invoice_id) references public.invoices(id) on delete set null;
  end if;
end $$;

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  session_id uuid references public.emt_sessions(id) on delete set null,
  package_id uuid references public.session_packages(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric not null,
  method text not null default 'efectivo', -- efectivo | tarjeta | transferencia | otro
  paid_at timestamptz not null default now(),
  reference text,
  registered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Inmutabilidad: una factura draft se edita libre; una vez "issued" no se
-- puede tocar identidad/montos/NCF (solo notas, o pasar a 'corrected').
create or replace function public.enforce_invoice_immutability()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'issued' then
    if new.subtotal is distinct from old.subtotal
      or new.tax_amount is distinct from old.tax_amount
      or new.discount_amount is distinct from old.discount_amount
      or new.total is distinct from old.total
      or new.ncf_type is distinct from old.ncf_type
      or new.ncf_number is distinct from old.ncf_number
      or new.patient_id is distinct from old.patient_id
      or new.issue_date is distinct from old.issue_date
      or (new.status is distinct from old.status and new.status not in ('issued', 'corrected'))
    then
      raise exception 'La factura ya fue emitida y es inmutable. Corregí mediante una nota de crédito.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoices_immutable on public.invoices;
create trigger trg_invoices_immutable
  before update on public.invoices
  for each row execute function public.enforce_invoice_immutability();

create or replace function public.enforce_invoice_items_immutability()
returns trigger
language plpgsql
as $$
declare
  invoice_status text;
begin
  select status into invoice_status from public.invoices where id = coalesce(new.invoice_id, old.invoice_id);
  if invoice_status = 'issued' then
    raise exception 'La factura ya fue emitida: sus líneas son inmutables.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_invoice_items_immutable on public.invoice_items;
create trigger trg_invoice_items_immutable
  before update or delete on public.invoice_items
  for each row execute function public.enforce_invoice_items_immutability();

-- Emitir factura: asigna el próximo NCF de la secuencia correspondiente de
-- forma atómica (bloquea la fila de la secuencia) y bloquea el borrador.
-- security definer porque necesita escribir ncf_sequences, que solo admin
-- puede tocar directamente por RLS — por eso valida el rol a mano adentro.
create or replace function public.issue_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices;
  v_seq public.ncf_sequences;
  v_number bigint;
  v_ncf text;
begin
  if public.current_app_role() not in ('admin', 'recepcionista') then
    raise exception 'No autorizado para emitir facturas';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if v_invoice.id is null then
    raise exception 'Factura no encontrada';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'Solo se pueden emitir facturas en borrador';
  end if;

  select * into v_seq from public.ncf_sequences where ncf_type = v_invoice.ncf_type and is_active = true for update;
  if v_seq.id is null then
    raise exception 'No hay secuencia NCF activa para el tipo %', v_invoice.ncf_type;
  end if;
  if v_seq.next_number = 0 or v_seq.next_number > v_seq.range_end then
    raise exception 'La secuencia NCF de tipo % no tiene rango disponible. Cargalo en Configuración → Facturación.', v_invoice.ncf_type;
  end if;

  v_number := v_seq.next_number;
  v_ncf := v_invoice.ncf_type || lpad(v_number::text, 8, '0');

  update public.ncf_sequences set next_number = next_number + 1 where id = v_seq.id;

  update public.invoices
    set ncf_number = v_ncf, status = 'issued', issue_date = coalesce(issue_date, current_date)
    where id = p_invoice_id
    returning * into v_invoice;

  return v_invoice;
end;
$$;

-- Nota de crédito: crea y emite en el mismo paso una factura B04 que
-- reversa el total de la original, y marca la original como 'corrected'.
create or replace function public.create_credit_note(p_invoice_id uuid, p_reason text)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_original public.invoices;
  v_credit public.invoices;
begin
  if public.current_app_role() not in ('admin', 'recepcionista') then
    raise exception 'No autorizado para emitir notas de crédito';
  end if;

  select * into v_original from public.invoices where id = p_invoice_id for update;
  if v_original.id is null then
    raise exception 'Factura no encontrada';
  end if;
  if v_original.status <> 'issued' then
    raise exception 'Solo se pueden corregir facturas emitidas';
  end if;

  insert into public.invoices (
    patient_id, ncf_type, status, corrects_invoice_id, issue_date,
    subtotal, tax_rate, tax_amount, discount_amount, total, notes, created_by
  ) values (
    v_original.patient_id, 'B04', 'draft', v_original.id, current_date,
    -v_original.subtotal, v_original.tax_rate, -v_original.tax_amount, -v_original.discount_amount, -v_original.total,
    p_reason, auth.uid()
  ) returning * into v_credit;

  v_credit := public.issue_invoice(v_credit.id);

  update public.invoices set status = 'corrected' where id = v_original.id;

  return v_credit;
end;
$$;

alter table public.ncf_sequences enable row level security;
alter table public.price_list enable row level security;
alter table public.session_packages enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists ncf_sequences_select on public.ncf_sequences;
create policy ncf_sequences_select on public.ncf_sequences for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists ncf_sequences_write on public.ncf_sequences;
create policy ncf_sequences_write on public.ncf_sequences for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists price_list_select on public.price_list;
create policy price_list_select on public.price_list for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists price_list_write on public.price_list;
create policy price_list_write on public.price_list for all
  using (public.current_app_role() = 'admin')
  with check (public.current_app_role() = 'admin');

drop policy if exists session_packages_select on public.session_packages;
create policy session_packages_select on public.session_packages for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista', 'contable'));
drop policy if exists session_packages_insert on public.session_packages;
create policy session_packages_insert on public.session_packages for insert
  with check (public.current_app_role() in ('admin', 'recepcionista'));
drop policy if exists session_packages_update on public.session_packages;
create policy session_packages_update on public.session_packages for update
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

drop policy if exists invoices_select on public.invoices;
create policy invoices_select on public.invoices for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists invoices_insert on public.invoices;
create policy invoices_insert on public.invoices for insert
  with check (public.current_app_role() in ('admin', 'recepcionista'));
drop policy if exists invoices_update on public.invoices;
create policy invoices_update on public.invoices for update
  using (public.current_app_role() in ('admin', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'recepcionista'));

drop policy if exists invoice_items_select on public.invoice_items;
create policy invoice_items_select on public.invoice_items for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists invoice_items_write on public.invoice_items;
create policy invoice_items_write on public.invoice_items for all
  using (public.current_app_role() in ('admin', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'recepcionista'));

drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert
  with check (public.current_app_role() in ('admin', 'recepcionista'));

-- =====================================================================
-- MIGRACIÓN 007 — Límites físicos del equipo (Neurosoft Neuro-MSX SLIM),
-- datos semilla de protocolos/tarifario/equipo reales de la clínica.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

-- El Neuro-MSX SLIM opera protocolos rTMS estándar hasta 100 Hz y la
-- intensidad se dosifica como 1-150% del umbral motor de reposo. El
-- sistema rechaza a nivel de base cualquier sesión fuera de esos rangos,
-- no solo en el formulario.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'emt_sessions_frequency_hz_range') then
    alter table public.emt_sessions add constraint emt_sessions_frequency_hz_range
      check (frequency_hz is null or (frequency_hz > 0 and frequency_hz <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'emt_sessions_intensity_pct_range') then
    alter table public.emt_sessions add constraint emt_sessions_intensity_pct_range
      check (intensity_pct is null or (intensity_pct >= 1 and intensity_pct <= 150));
  end if;
end $$;

-- Equipo real de la clínica (Plaza Esencia, Santiago de los Caballeros).
-- Número de serie queda pendiente de carga manual en Configuración → Equipos.
insert into public.emt_equipment (name, manufacturer, model, serial_number, status)
select 'Neuro-MSX SLIM', 'Neurosoft', 'Neuro-MSX SLIM', null, 'active'
where not exists (select 1 from public.emt_equipment where name = 'Neuro-MSX SLIM');

-- Categorías y protocolos de referencia con los que arranca la clínica
-- (editables por los médicos desde Protocolos).
insert into public.protocol_categories (code, label, description) values
  ('rtms', 'rTMS', 'Estimulación magnética transcraneal repetitiva convencional'),
  ('itbs', 'iTBS', 'Theta Burst intermitente')
on conflict (code) do nothing;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'protocols_name_key') then
    alter table public.protocols add constraint protocols_name_key unique (name);
  end if;
end $$;

insert into public.protocols (
  name, category, diagnosis, indication, objective, technical_parameters,
  contraindications, precautions, adverse_events, evidence_level, version, is_active
) values
(
  'rTMS 10 Hz DLPFC izquierda',
  'rtms',
  'Trastorno depresivo mayor',
  'Depresión resistente a tratamiento farmacológico',
  'Estimulación excitatoria de la corteza prefrontal dorsolateral izquierda',
  '10 Hz, 120% del umbral motor de reposo, 3000 pulsos por sesión, DLPFC izquierda',
  'Ver checklist de seguridad general del protocolo TMS',
  'Ajustar intensidad según tolerancia del paciente',
  'Cefalea leve transitoria, molestia en cuero cabelludo',
  'Nivel A (evidencia clínica sólida)',
  '1.0',
  true
),
(
  'rTMS 1 Hz DLPFC derecha',
  'rtms',
  'Trastorno depresivo mayor / trastorno de ansiedad',
  'Estimulación inhibitoria como alternativa o complemento terapéutico',
  'Modulación inhibitoria de la corteza prefrontal dorsolateral derecha',
  '1 Hz, intensidad según indicación del médico tratante, DLPFC derecha',
  'Ver checklist de seguridad general del protocolo TMS',
  'Monitorear respuesta clínica en cada sesión',
  'Cefalea leve transitoria',
  'Nivel B',
  '1.0',
  true
),
(
  'iTBS DLPFC izquierda',
  'itbs',
  'Trastorno depresivo mayor',
  'Protocolo acelerado de estimulación excitatoria (Theta Burst)',
  'Estimulación excitatoria de alta eficiencia de la corteza prefrontal dorsolateral izquierda',
  '80% del umbral motor de reposo, 600 pulsos por sesión, Theta Burst intermitente (~3 minutos por aplicación), DLPFC izquierda',
  'Ver checklist de seguridad general del protocolo TMS',
  'Sesión más corta — verificar igualmente el checklist completo',
  'Cefalea leve transitoria, molestia en cuero cabelludo',
  'Nivel A (protocolo aprobado para TDM)',
  '1.0',
  true
)
on conflict (name) do nothing;

-- Tarifario inicial (RD$) — editable en Configuración → Facturación.
insert into public.price_list (code, label, price, unit) values
  ('tms_session', 'Sesión TMS', 8500, 'sesión'),
  ('initial_eval', 'Evaluación inicial', 5000, 'consulta'),
  ('followup', 'Seguimiento', 3000, 'consulta')
on conflict (code) do nothing;

-- =====================================================================
-- MIGRACIÓN 008 — Bobina real de la clínica y ficha de paciente ampliada
-- (datos sociodemográficos y de contacto para investigación clínica).
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

insert into public.emt_coils (name, type, description, status)
select 'Bobina doble (Figura en 8)', 'figure-8', 'Bobina focal de doble ala para el Neuro-MSX SLIM', 'active'
where not exists (select 1 from public.emt_coils where name = 'Bobina doble (Figura en 8)');

alter table public.patients add column if not exists national_id text;
alter table public.patients add column if not exists address text;
alter table public.patients add column if not exists city text;
alter table public.patients add column if not exists occupation text;
alter table public.patients add column if not exists education_level text;
alter table public.patients add column if not exists marital_status text;
alter table public.patients add column if not exists emergency_contact_name text;
alter table public.patients add column if not exists emergency_contact_phone text;
alter table public.patients add column if not exists referred_by text;
alter table public.patients add column if not exists insurance_provider text;

-- =====================================================================
-- MIGRACIÓN 009 — PDF del cuestionario oficial por escala clínica.
-- No se aloja ningún PDF con copyright acá: PHQ-9/GAD-7 son de dominio
-- público, pero BDI-II/MMSE/MoCA tienen licencia — el admin carga el link
-- (o archivo propio subido a Storage) desde Configuración → Escalas.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

alter table public.clinical_scales add column if not exists pdf_url text;

-- =====================================================================
-- MIGRACIÓN 010 — Links a los cuestionarios oficiales de cada escala.
-- PHQ-9/GAD-7/HAM-D son de dominio público; Y-BOCS tiene permiso explícito
-- de sus autores para uso clínico. MADRS no tiene una fuente única oficial
-- gratuita, se linkea un recurso clínico confiable. MoCA exige certificación
-- gratuita del clínico desde 2022 (se linkea el sitio oficial, no un PDF
-- suelto). BDI-II (Pearson) y MMSE (PAR) son estrictamente comerciales —
-- no existe versión gratuita legítima, quedan sin link a propósito.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

update public.clinical_scales set pdf_url = 'https://www.phqscreeners.com/select-screener' where code = 'phq9';
update public.clinical_scales set pdf_url = 'https://www.phqscreeners.com/images/sites/g/files/g10060481/f/201412/GAD-7_English.pdf' where code = 'gad7';
update public.clinical_scales set pdf_url = 'https://psychology-tools.com/test/montgomery-asberg-depression-rating-scale' where code = 'madrs';
update public.clinical_scales set pdf_url = 'https://www.intermed.com/hubfs/Website%20Forms/Behavioral%20Health%20Forms/Assessments%20and%20Questionnaires/Yale-Brown-Obsessive-Compulsive-Scale-Y-BOCS_July-2022.pdf?hsLang=en' where code = 'ybocs';
update public.clinical_scales set pdf_url = 'https://www.rcpsych.ac.uk/docs/default-source/improving-care/ccqi/quality-networks/electro-convulsive-therapy-clinics-(ectas)/ectas---hamilton-depression-rating-scale-17.pdf' where code = 'hamd';
update public.clinical_scales set pdf_url = 'https://www.mocacognition.com/the-moca-test/' where code = 'moca';
update public.clinical_scales
  set description = 'Beck Depression Inventory-II (0-63) — instrumento comercial con copyright de Pearson. No existe versión gratuita legítima; requiere compra/licencia en pearsonassessments.com.'
  where code = 'bdi2';
update public.clinical_scales
  set description = 'Mini-Mental State Examination (0-30) — instrumento comercial con licencia exclusiva de PAR (Psychological Assessment Resources). No existe versión gratuita legítima; requiere compra/licencia en parinc.com.'
  where code = 'mmse';

-- =====================================================================
-- MIGRACIÓN 011 — Storage privado para que la clínica suba sus propias
-- copias de cuestionarios con licencia (ej. BDI-II, MMSE) desde la app,
-- sin que ese contenido pase por el código/repositorio.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('clinical-scale-pdfs', 'clinical-scale-pdfs', true)
on conflict (id) do nothing;

drop policy if exists clinical_scale_pdfs_select on storage.objects;
create policy clinical_scale_pdfs_select on storage.objects for select
  using (bucket_id = 'clinical-scale-pdfs');

drop policy if exists clinical_scale_pdfs_write on storage.objects;
create policy clinical_scale_pdfs_write on storage.objects for all
  using (bucket_id = 'clinical-scale-pdfs' and public.current_app_role() = 'admin')
  with check (bucket_id = 'clinical-scale-pdfs' and public.current_app_role() = 'admin');

-- =====================================================================
-- MIGRACIÓN 012 — Versión en español de cada escala (columna aparte, se
-- muestran ambos idiomas por separado) y se simplifican las descripciones
-- de BDI-II/MMSE a texto neutro (sin aviso de licencia en la ficha).
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

alter table public.clinical_scales add column if not exists pdf_url_es text;

update public.clinical_scales set pdf_url_es = 'https://aidsetc.org/sites/default/files/resources_files/PHQ-9_Spanish.pdf' where code = 'phq9';
update public.clinical_scales set pdf_url_es = 'https://biadmin.cibersam.es/Intranet/Ficheros/GetFichero.aspx?FileName=GAD7_Escala_para_el_Trastorno_de_Ansiedad_Generalizada.pdf' where code = 'gad7';
update public.clinical_scales set pdf_url_es = 'https://www.huvn.es/archivos/cms/enfermeria-en-huvn/archivos/publico/cuestionarios/Cuestionarios-3/cuestionario_montgomery.pdf' where code = 'madrs';
update public.clinical_scales set pdf_url_es = 'https://herramientasclinicas.com/yale-brown-obsessive-compulsive-scale-espanol/' where code = 'ybocs';
update public.clinical_scales set pdf_url_es = 'https://evalmed.es/wp-content/uploads/2020/04/3.1.11.1-Ficha-Escala-Eval-de-Depresi%C3%B3n-de-Hamilton-HRSD-heteroaplic.pdf' where code = 'hamd';

update public.clinical_scales set description = 'Beck Depression Inventory-II (0-63)' where code = 'bdi2';
update public.clinical_scales set description = 'Mini-Mental State Examination (0-30)' where code = 'mmse';

-- =====================================================================
-- MIGRACIÓN 013 — Cuadre de caja diario (Facturación → Cuadre del día).
-- Guarda una foto (append-only) de los cobros del día por método de pago,
-- lo facturado y el conteo físico de efectivo, para que recepción cierre
-- el día y contabilidad/admin lo audite después.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists public.cash_closings (
  id uuid primary key default gen_random_uuid(),
  closing_date date not null,
  total_efectivo numeric not null default 0,
  total_tarjeta numeric not null default 0,
  total_transferencia numeric not null default 0,
  total_otro numeric not null default 0,
  total_collected numeric not null default 0,
  invoices_issued_count int not null default 0,
  invoices_issued_total numeric not null default 0,
  counted_cash numeric,
  notes text,
  closed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cash_closings enable row level security;

-- Solo admin, recepcionista y contable ven los cuadres; solo admin y
-- recepcionista pueden cerrarlos. Sin políticas de update/delete: un
-- cuadre guardado es inmutable, igual que las facturas emitidas — una
-- corrección se hace cerrando el día de nuevo, no editando el registro.
drop policy if exists cash_closings_select on public.cash_closings;
create policy cash_closings_select on public.cash_closings for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));

drop policy if exists cash_closings_insert on public.cash_closings;
create policy cash_closings_insert on public.cash_closings for insert
  with check (public.current_app_role() in ('admin', 'recepcionista') and closed_by = auth.uid());

-- =====================================================================
-- MIGRACIÓN 014 — Investigación clínica: historia de tratamientos previos
-- (estadificación de resistencia), perfil de investigación (episodio
-- actual, historia familiar, consentimiento de investigación separado del
-- consentimiento de tratamiento), momento de evaluación en las escalas
-- clínicas (para calcular respuesta/remisión) y la escala C-SSRS de
-- riesgo suicida en el catálogo.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

-- Tratamientos previos a la TMS (medicación, ECT, ketamina/esketamina,
-- psicoterapia formal, TMS previo en otro centro). Lista append-only:
-- una corrección agrega una fila nueva y desactiva la anterior, igual
-- que patient_diagnoses/patient_medications.
create table if not exists public.patient_treatment_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  treatment_type text not null default 'otro', -- antidepresivo | estabilizador | antipsicotico | ansiolitico | ect | ketamina_esketamina | psicoterapia | tms_previo | otro
  treatment_name text,
  adequate_trial boolean,
  response text, -- sin_respuesta | respuesta_parcial | respuesta_completa | intolerancia | desconocido
  start_date date,
  end_date date,
  notes text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_patient_treatment_history_updated_at on public.patient_treatment_history;
create trigger trg_patient_treatment_history_updated_at
  before update on public.patient_treatment_history
  for each row execute function public.set_updated_at();

drop trigger if exists trg_patient_treatment_history_append_only on public.patient_treatment_history;
create trigger trg_patient_treatment_history_append_only
  before update on public.patient_treatment_history
  for each row execute function public.enforce_append_only('is_active', 'updated_at');

-- Perfil de investigación: un registro por paciente, editable directamente
-- (no es una lista de hechos, es un resumen que se corrige in situ), con
-- el episodio actual, historia familiar y el consentimiento específico
-- para uso de datos en investigación/publicaciones — separado del
-- consentimiento de tratamiento (patient_consents).
create table if not exists public.patient_research_profile (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null unique references public.patients(id) on delete cascade,
  current_episode_onset_date date,
  lifetime_depressive_episodes int,
  family_psychiatric_history text,
  research_consent boolean not null default false,
  research_consent_date date,
  research_consent_notes text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_patient_research_profile_updated_at on public.patient_research_profile;
create trigger trg_patient_research_profile_updated_at
  before update on public.patient_research_profile
  for each row execute function public.set_updated_at();

alter table public.patient_treatment_history enable row level security;
alter table public.patient_research_profile enable row level security;

drop policy if exists patient_treatment_history_all on public.patient_treatment_history;
create policy patient_treatment_history_all on public.patient_treatment_history for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

drop policy if exists patient_research_profile_all on public.patient_research_profile;
create policy patient_research_profile_all on public.patient_research_profile for all
  using (public.current_app_role() in ('admin', 'medico', 'tecnico'))
  with check (public.current_app_role() in ('admin', 'medico', 'tecnico'));

-- Momento de evaluación de cada puntaje de escala, para poder calcular
-- respuesta (≥50% de reducción vs. baseline) y remisión (por debajo del
-- umbral clínico de cada escala) de forma comparable entre pacientes.
alter table public.patient_scale_scores add column if not exists assessment_point text not null default 'otro';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'patient_scale_scores_assessment_point_check') then
    alter table public.patient_scale_scores add constraint patient_scale_scores_assessment_point_check
      check (assessment_point in ('baseline', 'intermedio', 'fin_tratamiento', 'seguimiento_1m', 'seguimiento_3m', 'seguimiento_6m', 'otro'));
  end if;
end $$;

-- Columbia-Suicide Severity Rating Scale — estándar de seguridad e
-- investigación en poblaciones con depresión tratadas con TMS.
insert into public.clinical_scales (code, label, description) values
  ('cssrs', 'C-SSRS', 'Columbia-Suicide Severity Rating Scale — riesgo e ideación suicida')
on conflict (code) do nothing;

-- =====================================================================
-- MIGRACIÓN 015 — Presupuestos (Facturación → Presupuestos).
-- Un ciclo TMS típico son 20-36 sesiones; antes de que el paciente decida
-- iniciar, se le entrega un presupuesto en PDF. No es un comprobante
-- fiscal (no lleva NCF, no pasa por ncf_sequences) — es una propuesta de
-- costo editable que, una vez aceptada, se puede convertir en factura
-- borrador real desde Facturación.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  protocol_id uuid references public.protocols(id) on delete set null,
  status text not null default 'draft', -- draft | sent | accepted | rejected | expired
  valid_until date,
  subtotal numeric not null default 0,
  discount_amount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_budgets_updated_at on public.budgets;
create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  amount numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.budgets enable row level security;
alter table public.budget_items enable row level security;

-- admin, médico y recepcionista arman/proponen presupuestos; contable solo
-- lee (mismo criterio que facturas — visibilidad fiscal sin edición).
drop policy if exists budgets_select on public.budgets;
create policy budgets_select on public.budgets for select
  using (public.current_app_role() in ('admin', 'medico', 'recepcionista', 'contable'));
drop policy if exists budgets_write on public.budgets;
create policy budgets_write on public.budgets for all
  using (public.current_app_role() in ('admin', 'medico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'recepcionista'));

drop policy if exists budget_items_select on public.budget_items;
create policy budget_items_select on public.budget_items for select
  using (public.current_app_role() in ('admin', 'medico', 'recepcionista', 'contable'));
drop policy if exists budget_items_write on public.budget_items;
create policy budget_items_write on public.budget_items for all
  using (public.current_app_role() in ('admin', 'medico', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'medico', 'recepcionista'));

-- =====================================================================
-- MIGRACIÓN 016 — Alta de paciente al terminar el plan de tratamiento.
-- No hay política de RLS nueva: patients_all ("for all") ya cubre estas
-- columnas para admin/médico/técnico/recepcionista.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

alter table public.patients add column if not exists status text not null default 'active'; -- active | discharged
alter table public.patients add column if not exists discharged_at date;
alter table public.patients add column if not exists discharge_notes text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'patients_status_check') then
    alter table public.patients add constraint patients_status_check check (status in ('active', 'discharged'));
  end if;
end $$;

-- =====================================================================
-- MIGRACIÓN 017 — Pendientes de recepción: notas libres editables desde el
-- Dashboard (checklist propio del día a día, no clínico), visibles/editables
-- para admin y recepcionista.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists public.staff_reminders (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  is_done boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_staff_reminders_updated_at on public.staff_reminders;
create trigger trg_staff_reminders_updated_at
  before update on public.staff_reminders
  for each row execute function public.set_updated_at();

alter table public.staff_reminders enable row level security;

drop policy if exists staff_reminders_all on public.staff_reminders;
create policy staff_reminders_all on public.staff_reminders for all
  using (public.current_app_role() in ('admin', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'recepcionista'));

-- =====================================================================
-- MIGRACIÓN 018 — Arregla huecos de RLS que dejaban a recepcionista sin
-- opciones en "Protocolo" y "Clínico/técnico asignado" al crear una cita
-- (no era un bug de la UI: las políticas de SELECT no la dejaban leer esas
-- tablas). Agrega NCF tipo B03 (Nota de Débito). Y siembra permissions /
-- roles / role_permissions con el estado actual de ROLE_MATRIX, para que
-- Configuración → Permisos (nuevo) pueda editar accesos por rol desde la
-- app sin tocar código — src/services/permissions.ts ya prioriza
-- role_permissions sobre el matrix hardcodeado si hay filas.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

-- 1) profiles: cualquier staff activo puede LEER todos los perfiles (nombre
--    y rol de otros usuarios) — lo necesita para asignar clínico/técnico en
--    citas, ver "cerrado por" en cuadres, etc. La escritura (profiles_update)
--    se queda igual: cada quien solo edita el suyo, admin edita todos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (public.current_app_role() is not null);

-- 2) protocols: recepcionista necesita leerlos para elegir protocolo al
--    agendar una cita (la escritura sigue siendo solo admin).
drop policy if exists protocols_select on public.protocols;
create policy protocols_select on public.protocols for select
  using (public.current_app_role() in ('admin', 'medico', 'tecnico', 'recepcionista'));

-- 3) NCF tipo B03 (Nota de Débito) — faltaba en el catálogo inicial.
insert into public.ncf_sequences (ncf_type, label) values
  ('B03', 'Nota de Débito')
on conflict (ncf_type) do nothing;

-- 4) Catálogo de permisos y roles (antes vacío — current_app_role()/
--    loadPermissions() ya sabían leerlo, solo faltaban los datos y la UI).
insert into public.permissions (key, label) values
  ('dashboard.view', 'Ver Dashboard'),
  ('agenda.view', 'Ver Agenda'),
  ('patients.view', 'Ver Pacientes'),
  ('protocols.view', 'Ver Protocolos'),
  ('consents.view', 'Ver Consentimientos'),
  ('sessions.view', 'Ver Sesiones'),
  ('research.view', 'Ver Investigación'),
  ('billing.view', 'Ver Facturación'),
  ('reports.view', 'Ver Reportes'),
  ('settings.view', 'Ver Configuración'),
  ('audit.view', 'Ver Auditoría'),
  ('reminders.view', 'Ver pendientes de recepción (Dashboard)')
on conflict (key) do nothing;

insert into public.roles (code, label) values
  ('admin', 'Administrador'),
  ('medico', 'Médico'),
  ('tecnico', 'Técnico'),
  ('recepcionista', 'Recepcionista'),
  ('contable', 'Contable'),
  ('paciente', 'Paciente')
on conflict (code) do nothing;

-- Estado inicial = exactamente lo que ya hacía ROLE_MATRIX en el código,
-- para que sembrar esto no cambie el acceso de nadie hasta que un admin
-- lo edite desde Configuración → Permisos.
insert into public.role_permissions (role_code, permission_key)
select role_code::public.app_role, permission_key from (values
  ('admin', 'dashboard.view'), ('admin', 'agenda.view'), ('admin', 'patients.view'),
  ('admin', 'protocols.view'), ('admin', 'consents.view'), ('admin', 'sessions.view'),
  ('admin', 'research.view'), ('admin', 'billing.view'), ('admin', 'reports.view'),
  ('admin', 'settings.view'), ('admin', 'audit.view'), ('admin', 'reminders.view'),
  ('medico', 'dashboard.view'), ('medico', 'agenda.view'), ('medico', 'patients.view'),
  ('medico', 'protocols.view'), ('medico', 'consents.view'), ('medico', 'sessions.view'),
  ('medico', 'research.view'),
  ('tecnico', 'dashboard.view'), ('tecnico', 'agenda.view'), ('tecnico', 'protocols.view'),
  ('tecnico', 'sessions.view'),
  ('recepcionista', 'dashboard.view'), ('recepcionista', 'agenda.view'), ('recepcionista', 'patients.view'),
  ('recepcionista', 'consents.view'), ('recepcionista', 'billing.view'), ('recepcionista', 'reminders.view'),
  ('contable', 'dashboard.view'), ('contable', 'billing.view'), ('contable', 'reports.view')
) as seed(role_code, permission_key)
on conflict (role_code, permission_key) do nothing;

-- =====================================================================
-- MIGRACIÓN 019 — Se retira el sistema NCF/DGII de la facturación:
-- numeración interna simple (F-1001, F-1002...) en vez de tipos B01-B04
-- con rangos autorizados por la DGII (esa complejidad ya no aplica al
-- flujo de la clínica). Los servicios de salud están exentos de ITBIS en
-- RD — tax_rate sigue en 0% por defecto y editable solo si algún ítem no
-- exento lo requiere. "Anular" reemplaza a la nota de crédito como
-- mecanismo de corrección de una factura ya emitida, y un borrador
-- (nunca emitido) ahora se puede eliminar directamente.
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

create sequence if not exists public.invoice_number_seq start 1001;

alter table public.invoices add column if not exists invoice_number text;

-- Preserva el historial: una factura que ya tenía NCF conserva ese valor
-- como su número de factura, en vez de perderlo.
update public.invoices set invoice_number = ncf_number where invoice_number is null and ncf_number is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_invoice_number_key') then
    alter table public.invoices add constraint invoices_invoice_number_key unique (invoice_number);
  end if;
end $$;

alter table public.invoices alter column ncf_type drop not null;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'invoices_ncf_type_fkey') then
    alter table public.invoices drop constraint invoices_ncf_type_fkey;
  end if;
end $$;

-- Emitir factura: ya no depende de ncf_sequences/rangos DGII — asigna el
-- próximo número correlativo simple de forma atómica.
create or replace function public.issue_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices;
begin
  if public.current_app_role() not in ('admin', 'recepcionista') then
    raise exception 'No autorizado para emitir facturas';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if v_invoice.id is null then
    raise exception 'Factura no encontrada';
  end if;
  if v_invoice.status <> 'draft' then
    raise exception 'Solo se pueden emitir facturas en borrador';
  end if;

  update public.invoices
    set invoice_number = 'F-' || nextval('public.invoice_number_seq')::text,
        status = 'issued',
        issue_date = coalesce(issue_date, current_date)
    where id = p_invoice_id
    returning * into v_invoice;

  return v_invoice;
end;
$$;

-- Reemplaza la nota de crédito (B04) por "Anular": marca la factura
-- emitida como cancelada, sin generar un documento nuevo.
create or replace function public.void_invoice(p_invoice_id uuid)
returns public.invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invoice public.invoices;
begin
  if public.current_app_role() not in ('admin', 'recepcionista') then
    raise exception 'No autorizado para anular facturas';
  end if;

  select * into v_invoice from public.invoices where id = p_invoice_id for update;
  if v_invoice.id is null then
    raise exception 'Factura no encontrada';
  end if;
  if v_invoice.status <> 'issued' then
    raise exception 'Solo se pueden anular facturas emitidas';
  end if;

  update public.invoices set status = 'cancelled' where id = p_invoice_id returning * into v_invoice;
  return v_invoice;
end;
$$;

-- La inmutabilidad de una factura emitida ahora también permite pasar a
-- 'cancelled' (antes solo permitía 'issued'/'corrected').
create or replace function public.enforce_invoice_immutability()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'issued' then
    if new.subtotal is distinct from old.subtotal
      or new.tax_amount is distinct from old.tax_amount
      or new.discount_amount is distinct from old.discount_amount
      or new.total is distinct from old.total
      or new.patient_id is distinct from old.patient_id
      or new.issue_date is distinct from old.issue_date
      or (new.status is distinct from old.status and new.status not in ('issued', 'cancelled'))
    then
      raise exception 'La factura ya fue emitida y es inmutable. Usá "Anular" para corregirla.';
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists invoices_delete on public.invoices;
create policy invoices_delete on public.invoices for delete
  using (public.current_app_role() in ('admin', 'recepcionista') and status = 'draft');

-- =====================================================================
-- MIGRACIÓN 020 — Caja diaria: estado abierta/cerrada por día (antes el
-- "Cuadre del día" no tenía ningún gesto de apertura, solo el cierre) y
-- egresos (salidas de efectivo de caja, ej. compras menores) — no existía
-- ningún registro de egresos hasta ahora. admin y recepcionista pueden
-- abrir/cerrar la caja y registrar egresos; contable solo lee (mismo
-- criterio que el resto de facturación/cuadre).
-- Ejecutar este bloque completo en el SQL Editor de Supabase.
-- =====================================================================

create table if not exists public.cash_registers (
  id uuid primary key default gen_random_uuid(),
  business_date date not null unique,
  status text not null default 'closed', -- open | closed
  opening_amount numeric not null default 0,
  opened_at timestamptz,
  opened_by uuid references auth.users(id) on delete set null,
  closed_at timestamptz,
  closed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_cash_registers_updated_at on public.cash_registers;
create trigger trg_cash_registers_updated_at
  before update on public.cash_registers
  for each row execute function public.set_updated_at();

create table if not exists public.cash_expenses (
  id uuid primary key default gen_random_uuid(),
  business_date date not null,
  amount numeric not null,
  concept text not null,
  method text not null default 'efectivo', -- efectivo | tarjeta | transferencia | otro
  registered_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.cash_registers enable row level security;
alter table public.cash_expenses enable row level security;

drop policy if exists cash_registers_select on public.cash_registers;
create policy cash_registers_select on public.cash_registers for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists cash_registers_write on public.cash_registers;
create policy cash_registers_write on public.cash_registers for all
  using (public.current_app_role() in ('admin', 'recepcionista'))
  with check (public.current_app_role() in ('admin', 'recepcionista'));

drop policy if exists cash_expenses_select on public.cash_expenses;
create policy cash_expenses_select on public.cash_expenses for select
  using (public.current_app_role() in ('admin', 'recepcionista', 'contable'));
drop policy if exists cash_expenses_insert on public.cash_expenses;
create policy cash_expenses_insert on public.cash_expenses for insert
  with check (public.current_app_role() in ('admin', 'recepcionista'));
