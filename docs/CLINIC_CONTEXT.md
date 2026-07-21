# Contexto operativo de EMT Medical Group

Esta información no se puede deducir del código — está acá para que cualquier
persona que retome el proyecto entienda las restricciones reales del negocio.

## La clínica

- Centro especializado en Estimulación Magnética Transcraneal (salud mental).
- Sede única: Calle 10 esquina José A. Patiño, No. 2A, Villa Olga, Santiago de los
  Caballeros, República Dominicana (confirmado por el consentimiento informado y el
  brochure oficiales — corrige la referencia anterior a "Plaza Esencia").
- Contacto: tel. (809) 330-1538, WhatsApp +1 (849) 449-0904, www.emtmedicalgroup.do,
  emtmedicalgroup@gmail.com.
- Equipo humano (~9 personas): 6 socios/médicos, 1 técnico operador, 1 recepcionista, 1 contable.
- Marco legal: Ley 172-13 (protección de datos personales, RD) + buenas prácticas de
  habilitación del Ministerio de Salud Pública. HIPAA se usa solo como referencia de
  buenas prácticas, no es un requisito legal aplicable.

## Equipo TMS

- Modelo: **Neurosoft Neuro-MSX SLIM**. Número de serie pendiente de cargar en
  Configuración → Equipos.
- Campo magnético pico: 2.5 Tesla.
- Frecuencia: protocolos rTMS estándar hasta **100 Hz**.
- Protocolos soportados: rTMS e iTBS (Theta Burst).
- Modos de pulso: único, tren, burst, rampa y barrido.
- Registro de sesiones 100% manual en v1 — si Neurosoft ofrece exportación de datos en
  el futuro, evaluar integración (el modelo de datos ya deja `emt_sessions` listo para
  eso: parámetros técnicos como columnas propias, no texto libre).
- **Límites físicos aplicados como restricción de base de datos** (no solo en el
  formulario): frecuencia ≤ 100 Hz, intensidad entre 1% y 150% del umbral motor de
  reposo. Ver `emt_sessions_frequency_hz_range` / `emt_sessions_intensity_pct_range`
  en `supabase/schema.sql` (Migración 007).

## Operación clínica

- Volumen: 5–8 pacientes activos al inicio, meta 15+; 8–15 sesiones diarias.
- Ciclo típico: 5 días/semana durante 4–6 semanas = 20–36 sesiones por paciente
  (el default de "sesiones planificadas" al crear un ciclo es 30, dentro de ese rango).
- Horario semilla: lunes a viernes 8:00–17:00, cupos de 45 minutos, 1 cabina —
  9 horas × 60 / 45 min = 12 cupos/día, que es exactamente el `daily_appointment_limit`
  default cargado en `clinic_settings`.
- Escalas clínicas priorizadas: PHQ-9, MADRS, Y-BOCS (+ GAD-7, HAM-D, BDI-II, MoCA,
  MMSE disponibles en el catálogo).
- Protocolos de referencia precargados (Migración 007, editables por los médicos desde
  Protocolos): rTMS 10 Hz DLPFC izquierda (120% UMR, depresión mayor), rTMS 1 Hz DLPFC
  derecha, iTBS DLPFC izquierda (80% UMR, 600 pulsos).

## Facturación

- NCF gestionados internamente (B01 crédito fiscal, B02 consumidor final, B04 nota de
  crédito), sin conexión a la DGII por defecto — el interruptor e-CF queda apagado
  hasta que se implemente esa integración.
- Servicios de salud tratados como **exentos de ITBIS (0%)** de forma provisional —
  pendiente de confirmación formal con el contable de la clínica.
- Tarifario inicial cargado (Migración 007, editable en Configuración → Facturación):
  sesión TMS RD$8,500, evaluación inicial RD$5,000, seguimiento RD$3,000.
- Recordatorios de cita por email/WhatsApp: **no implementado todavía** — requiere
  integrar un proveedor externo (ej. Resend/SendGrid para email, WhatsApp Business API
  o Twilio). Queda para una fase posterior, junto con el portal de pacientes.
- El Dashboard muestra la tasa USD → RD$ como referencia (fetch en vivo a
  `open.er-api.com`, sin API key). Es informativa — la facturación sigue en RD$, no se
  usa para convertir montos automáticamente.
- Facturación → pestaña "Cuadre del día" (Migración 013, tabla `cash_closings`):
  agrupa los pagos del día por método (efectivo/tarjeta/transferencia/otro), lo
  facturado y permite ingresar el conteo físico de efectivo para ver la diferencia
  contra el sistema. "Guardar cuadre" deja un registro inmutable (sin update/delete
  a nivel de RLS, igual que las facturas emitidas) con quién lo cerró — visible para
  admin, recepcionista y contable.

## Investigación clínica

Migración 014. Pensado para que los datos ya capturados en el día a día sirvan
para publicaciones sin trabajo extra de recolección:

- Ficha del paciente → pestaña "Investigación clínica": perfil de investigación
  (`patient_research_profile`, 1 fila por paciente, editable in situ) con inicio del
  episodio actual, episodios depresivos previos, historia familiar psiquiátrica, y el
  **consentimiento de investigación** — separado del consentimiento de tratamiento
  (`patient_consents`), porque un paciente puede aceptar el TMS sin autorizar el uso
  de sus datos en un estudio.
- Misma pestaña → "Tratamientos previos" (`patient_treatment_history`, lista
  append-only): antidepresivos/ECT/ketamina-esketamina/psicoterapia/TMS previo, con
  si el ensayo fue a dosis/duración adecuada y la respuesta obtenida. De ahí se deriva
  el conteo de "antidepresivos fallidos con ensayo adecuado" (estadificación de
  resistencia al tratamiento).
- Escalas clínicas: cada puntaje ahora lleva un `assessment_point` (basal / intermedio
  / fin de tratamiento / seguimiento 1-3-6 meses). Con eso se calcula automáticamente
  respuesta (≥50% de reducción vs. basal, 35% para Y-BOCS) y remisión (por debajo del
  umbral clínico de cada escala) — ver `src/utils/scaleThresholds.ts`. Se agregó
  también la escala **C-SSRS** (riesgo suicida) al catálogo.
- Página "Investigación" (`/research`, ya existía en el menú "Análisis" pero era un
  placeholder vacío — ahora usa `src/services/researchExport.ts`): muestra en
  pantalla, con nombre real visible (uso interno, admin/médico ya tienen acceso a la
  identidad del paciente en toda la app), a todos los pacientes con consentimiento de
  investigación activo — variables sociodemográficas, historia de tratamientos,
  puntajes basal/último por escala con respuesta/remisión, sesiones completadas y
  eventos adversos. El botón "Exportar Excel (anonimizado)" genera el mismo dataset
  pero sin nombre/correo/teléfono/cédula, con código generado (`PAC-0001`...) — pensado
  para un archivo que puede salir de la clínica hacia un análisis o publicación.

## Marca

Ver `Brand Tool Kit - EMT Medical Group.pdf` (compartido por el cliente). Aplicado en
`tailwind.config.ts` (colores), `index.html` + `src/index.css` (tipografías Onest/DM
Sans) y `src/components/Logo.tsx` (isotipo).

Pendiente de parte del cliente:
- Archivo vectorial (SVG/AI) real del isotipo — el actual en `Logo.tsx` es una
  aproximación dibujada a mano a partir de la imagen del PDF, no el trazado original.
- Confirmar el hex correcto del color "Prohibición" de la paleta de señalización (el
  PDF trae una inconsistencia: dos swatches distintos listados con el mismo hex).
