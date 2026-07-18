-- EMT Clinic — esquema inicial de Supabase

-- Roles de aplicación
create type if not exists public.app_role as enum ('admin', 'clinician', 'technician', 'reception');

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
