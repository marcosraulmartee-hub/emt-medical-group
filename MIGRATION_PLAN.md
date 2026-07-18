# EMT Clinic Migration Plan

## Objetivo
Crear un proyecto independiente para una clínica de Estimulación Magnética Transcraneal (EMT/rTMS) inspirado en la arquitectura, organización y diseño del proyecto original, pero sin copiar lógica ni modelos odontológicos.

## Stack reutilizado
- React 18
- TypeScript estricto
- Vite
- Tailwind CSS
- Supabase (Auth + Postgres)
- React Router DOM v6
- Lucide React

## Arquitectura principal
- `src/context/AuthContext.tsx`: proveedor de autenticación y perfil
- `src/lib/supabase.ts`: cliente Supabase centralizado
- `src/hooks/useAuth.ts`: hook para consumir el contexto
- `src/components/ProtectedRoute.tsx`: guardia de sesión
- `src/components/PermissionRoute.tsx`: guardia de permisos
- `src/components/RoleRoute.tsx`: guardia de roles
- `src/components/layout/AppShell.tsx`: layout principal con sidebar + navbar
- `src/components/AuthLayout.tsx`: layout para pantallas de acceso
- `src/services/*`: capa de servicios para llamadas a Supabase
- `src/pages/*`: psicología de páginas por módulo
- `src/types/*`: tipos compartidos y matriz de permisos

## Organización del proyecto
- `src/`: código fuente de la aplicación
  - `components/`: UI genérica, layouts, guardias, secciones reutilizables
  - `context/`: contexto de autenticación y datos globales
  - `hooks/`: hooks personalizados
  - `lib/`: cliente Supabase y utilidades de inicialización
  - `pages/`: páginas de rutas principales
  - `services/`: lógica de acceso a datos y APIs
  - `types/`: tipos TypeScript y permisos
  - `utils/`: utilidades de formato y helpers
- `supabase/`: esquema SQL y migraciones de base de datos
- `public/` o `index.html`: base del SPA

## Componentes y patrones reutilizables
- Layout de autenticación con panel de marca e interfaz responsive
- AppShell con sidebar desktop + drawer móvil
- Navbar con título, fecha y panel de usuario
- Sidebar basada en permisos / rutas habilitadas
- Rutas protegidas por sesión y permisos
- Contexto de auth que carga perfil + permisos al iniciar sesión
- Capa de servicios para encapsular `supabase.from(...)`
- Tipos y matrices de roles/permiso para fallback cuando RBAC no esté disponible
- Sistema de UI ligero con `Button`, `Input`, `Select`, `Spinner`, `Card`, `Alert`

## Qué patrones se reutilizarán
- Arquitectura basada en React + Vite + Tailwind
- Organización de carpetas y convenciones de nombres
- Contexto de autenticación y guardias de ruta
- Modelo de permisos basado en objetos `role_permissions` y `permissions`
- Estilo visual de esquemas de color suave, tarjetas y navegación lateral
- Uso de `supabase.auth` para login, registro, recuperación y cambio de contraseña
- Enrutamiento tipo SPA con rutas públicas y privadas
- Componentes reutilizables para formularios y layouts

## Qué NO debe copiarse
- Lógica odontológica (odontograma, dientes, tratamientos dentales, facturación dental)
- Tablas y modelos de datos específicos de odontología (`odontograms`, `tooth_treatments`, `billing`, `caja`, `clinic_settings` vinculadas a odontología)
- Componentes de dominio dental (`Odontogram`, `ToothTreatment`, `PatientBillingTab`)
- Patrones de datos y formularios solo aplicables a pacientes dentales
- Rutas, textos y nombres que hagan referencia exclusivamente a odontología
- SQL de odontología, facturación dental, radiografías, odontograma y tratamientos odontológicos

## Nuevas áreas de enfoque para EMT
- Usuario / roles / permisos adaptados al entorno de neuromodulación
- Agenda / calendario para sesiones EMT
- Pacientes con antecedentes, diagnósticos, contraindicaciones y consentimientos
- Biblioteca de protocolos EMT con versión, evidencia, regulador, bibliografía
- Equipos y bobinas de neuromodulación
- Registro de sesiones EMT con parámetros técnicos y respuesta clínica
- Escalas clínicas PHQ-9, HAM-D, MADRS, BDI-II, GAD-7, MoCA, MMSE
- Módulo de investigación y dashboards científicos
- Auditoría de eventos administrativos y clínicos

## Diseño de la nueva base de datos
Se propone un modelo normalizado y extensible, separado del dominio odontológico:
- `app_role` / `profiles`
- `permissions`, `roles`, `role_permissions`
- `audit_logs`
- `patients`
- `patient_diagnoses`
- `patient_medications`
- `patient_contraindications`
- `patient_consents`
- `patient_documents`
- `emt_equipment`
- `emt_coils`
- `protocol_categories`
- `protocols`
- `emt_sessions`
- `clinical_scales`
- `research_projects`
- `research_metrics`

Este modelo debe soportar rTMS, Deep TMS, iTBS, cTBS, sTMS, Neuronavegación, tDCS, tACS, tRNS, sin atarse a una técnica específica.

## Identidad propia
- Mantener la experiencia de usuario del proyecto original: navegación clara, panel lateral, dashboard informativo y diseño de tarjetas
- Crear identidad de marca propia para la clínica EMT: colores, iconografía y terminología de neuromodulación
- Inspirarse en la calidad visual y UX del proyecto original, sin clonar la interfaz odontológica

## Fases de implementación
1. Documentar el plan y crear el nuevo repositorio independiente (`emt-clinic-pro`)
2. Inicializar el nuevo proyecto React + TypeScript + Vite + Tailwind
3. Implementar Auth, rutas protegidas y layout base
4. Crear pages y servicios genéricos de módulos EMT
5. Diseñar y versionar el esquema de base de datos Supabase
6. Añadir los módulos prioritarios: Login, Usuarios, Roles, Dashboard, Agenda, Pacientes, Protocolos, Consentimientos, Sesiones, Reportes
7. Agregar investigaciones, estadísticas y auditoría
8. Validar compilación, lint y rutas

## Reglas importantes
- El proyecto original no debe modificarse bajo ninguna circunstancia.
- El nuevo proyecto debe residir solo en `emt-clinic-pro/`.
- Nunca copiar modelos ni tablas odontológicas.
- Reutilizar únicamente patrones, arquitectura y componentes genéricos.
- Mantener la integración de Supabase y el enfoque de permisos del proyecto original.
- Validar compilación antes de avanzar.
