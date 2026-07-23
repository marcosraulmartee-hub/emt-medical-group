# Contexto operativo de EMT Medical Group

Esta información no se puede deducir del código — está acá para que cualquier
persona que retome el proyecto entienda las restricciones reales del negocio.

## La clínica

- Centro especializado en Estimulación Magnética Transcraneal (salud mental).
- Sede única: Calle 10 esquina José A. Patiño, No. 2A, Villa Olga, Santiago de los
  Caballeros, República Dominicana (confirmado por el consentimiento informado y el
  brochure oficiales — corrige la referencia anterior a "Plaza Esencia").
- Contacto: tel. (809) 330-1538, WhatsApp (809) 570-8705, www.emtmedicalgroup.do,
  emtmedicalgroup@gmail.com. El número de WhatsApp de la empresa debe estar vinculado
  (WhatsApp Web o WhatsApp Business en el dispositivo) en el equipo que use recepción,
  para que los botones de WhatsApp de la app (confirmar citas, recordatorios de
  seguimiento, compartir consentimiento/presupuesto) salgan desde ese número — no hay
  configuración de código para esto, depende de la sesión activa del dispositivo.
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

- **Migración 019 (decisión explícita del cliente): se retiró el sistema NCF/DGII.**
  Antes las facturas llevaban tipo B01/B02/B03/B04 con rangos autorizados por la DGII
  (`ncf_sequences`) y `issue_invoice()` rechazaba emitir si no había rango cargado —
  eso generaba facturas atascadas en "Borrador" y complejidad que la clínica no
  necesita en este momento. Ahora cada factura emitida recibe un número correlativo
  simple (`invoice_number`, formato "F-1001", "F-1002"...) vía la secuencia Postgres
  `invoice_number_seq`, sin ningún tipo de comprobante ni validación de rango. El
  cumplimiento fiscal formal ante la DGII (si la clínica lo necesita más adelante) se
  maneja fuera de la app. Corregir una factura emitida ahora es "Anular" (estado
  `cancelled`, función `void_invoice()`) en vez de una nota de crédito — no genera un
  documento nuevo. Un borrador nunca emitido se puede eliminar directamente.
- Servicios de salud tratados como **exentos de ITBIS (0%)** — el campo es editable
  por si algún ítem facturado no está exento, pero el valor por defecto y el texto de
  ayuda en el formulario dejan claro que la clínica normalmente no cobra ITBIS. En
  Configuración → Facturación hay un checkbox explícito "Exento de ITBIS" que fuerza
  la tasa a 0% y deshabilita el campo numérico mientras está marcado.
- **Facturación → pestaña "Caja"** (antes "Cuadre del día", Migración 020, tablas
  `cash_registers`/`cash_expenses`): la caja de un día debe **abrirse** explícitamente
  (botón "Abrir caja", con monto inicial opcional) antes de ver el historial de
  movimientos o registrar egresos — esto es nuevo respecto al cuadre anterior, que no
  tenía ningún gesto de apertura. Muestra 5 métricas: Ventas del día (facturas
  emitidas), Total cobrado, Pendiente por cobrar, Egresos, Balance final. El
  historial de movimientos combina cobros (ingresos, en verde) y egresos (en rojo) en
  una sola línea de tiempo. **Emitir facturas y registrar pagos NO requieren la caja
  abierta** — solo los egresos la exigen — para no restringir el flujo de facturación
  que recepcionista/admin ya tenían. "Cerrar caja" reemplaza al antiguo "Guardar
  cuadre": pide el efectivo contado físicamente + notas, guarda el registro histórico
  en `cash_closings` (sin cambios) y además marca la caja de ese día como cerrada.
- Tarifario inicial cargado (Migración 007, editable en Configuración → Facturación):
  sesión TMS RD$8,500, evaluación inicial RD$5,000, seguimiento RD$3,000.
- Recordatorios de cita por email/WhatsApp: **no implementado todavía** — requiere
  integrar un proveedor externo (ej. Resend/SendGrid para email, WhatsApp Business API
  o Twilio). Queda para una fase posterior, junto con el portal de pacientes.
- El Dashboard muestra la tasa USD → RD$ como referencia (fetch en vivo a
  `open.er-api.com`, sin API key). Es informativa — la facturación sigue en RD$, no se
  usa para convertir montos automáticamente.
- Facturación → pestaña "Presupuestos" (Migración 015, tablas `budgets`/`budget_items`):
  propuesta de costo de un ciclo TMS (ej. 30 sesiones × RD$8,500) para descargar en PDF
  y enviar al paciente antes de que decida iniciar tratamiento. No es un comprobante
  fiscal (no lleva NCF, el PDF lo aclara explícitamente). Estados: borrador → enviado →
  aceptado/rechazado/vencido. Un presupuesto aceptado tiene botón "Convertir en factura
  (borrador)" que crea la factura real en la pestaña Facturas usando los mismos ítems.
- Facturación → pestaña "Cuadre del día" (Migración 013, tabla `cash_closings`):
  agrupa los pagos del día por método (efectivo/tarjeta/transferencia/otro), lo
  facturado y permite ingresar el conteo físico de efectivo para ver la diferencia
  contra el sistema. "Guardar cuadre" deja un registro inmutable (sin update/delete
  a nivel de RLS, igual que las facturas emitidas) con quién lo cerró — visible para
  admin, recepcionista y contable.

## Migración 018 — huecos de RLS, NCF B03 y permisos editables desde la app

- **Bug de RLS resuelto**: `profiles_select` solo dejaba a cada usuario leer su propio
  perfil (o admin, todos). Eso hacía que el selector "Clínico/técnico asignado" en
  Nueva cita saliera vacío para recepcionista — no podía leer los perfiles de los
  demás. Ahora cualquier staff activo puede leer todos los perfiles (nombre + rol);
  la escritura sigue igual de restringida (cada quien el suyo, admin todos).
- **Bug de RLS resuelto**: `protocols_select` no incluía a recepcionista, por eso el
  selector de protocolo en Nueva cita también salía vacío para ella. Ahora sí puede
  leer protocolos (la escritura sigue siendo solo admin).
- **NCF**: se agregó el tipo **B03 (Nota de Débito)** al catálogo (`ncf_sequences`) y
  al selector de "Nueva factura" — antes solo existían B01/B02/B04.
- **Facturas atascadas en borrador / Cuadre vacío**: la causa más probable es que el
  tipo de NCF usado no tiene rango autorizado cargado en Configuración → Facturación
  → Secuencias NCF (`range_end = 0`) — `issue_invoice()` rechaza emitir en ese caso y
  la factura queda en "Borrador" para siempre, lo que también la deja fuera del
  Cuadre del día (que solo cuenta facturas `issued`/`corrected`). Se agregaron avisos
  visibles en Facturación y en Cuadre del día que detectan esto y lo explican in situ.
- **Permisos por rol editables desde la app** (Configuración → Permisos, admin only):
  antes `ROLE_MATRIX` en `src/types/permissions.ts` era la única fuente — ahora se
  sembraron las tablas `permissions`/`roles`/`role_permissions` (antes vacías) con el
  estado exacto de `ROLE_MATRIX`, y `loadPermissions()` (`src/services/permissions.ts`)
  ya las prioriza sobre el matrix hardcodeado. El admin puede prender/apagar el acceso
  de cualquier rol (excepto admin, que siempre tiene todo) a cualquier sección desde
  una tabla de checkboxes, sin tocar código. Los cambios aplican la próxima vez que
  ese usuario recargue sesión (no en caliente).

## Dashboard — pendientes de recepción y acciones rápidas

Migración 017, tabla `staff_reminders` (visible/editable para admin y recepcionista —
nuevo permiso `reminders.view` en `src/types/permissions.ts`).

- "Pendientes de recepción": lista de notas libres editable ahí mismo (agregar, marcar
  hecho, borrar) — para pendientes del día a día que no son datos clínicos.
- "Acciones pendientes": citas con estado `pending` de los próximos 14 días (con botón
  "Confirmar" y botón de WhatsApp que abre el mensaje de confirmación prellenado) y
  pacientes en seguimiento de 30+ días (con botón de WhatsApp de recordatorio) —
  reutiliza los mismos builders de mensaje que la Agenda y Pacientes
  (`src/utils/messages.ts`).

## Alta de paciente y seguimiento

Migración 016. `patients.status` ('active' | 'discharged') + `discharged_at` + `discharge_notes`.

- Ficha del paciente: control "Dar de alta" siempre disponible (decisión manual del
  médico), pero se resalta con un aviso verde cuando el ciclo de tratamiento activo
  llega a su número de sesiones planificadas. "Reactivar paciente" deshace el alta en
  cualquier momento.
- Pacientes → filtro "Seguimiento (30+ días)": pacientes activos (no dados de alta)
  cuya última cita o sesión fue hace 30+ días (o que nunca tuvieron una, contando desde
  su registro) — calculado en el cliente en `src/services/followUp.ts`. Por defecto la
  lista oculta a los pacientes dados de alta (checkbox "Incluir dados de alta" para
  mostrarlos).
- Dashboard: banner de aviso si hay pacientes en seguimiento, enlaza a
  `/patients?followup=true`.
- Envío de PDF (consentimiento/presupuesto) y recordatorios (seguimiento): botones
  "WhatsApp"/"Correo" que descargan el PDF y abren `wa.me`/`mailto:` con un mensaje
  prellenado — el navegador no permite adjuntar archivos generados client-side a esos
  links, así que el staff adjunta el PDF manualmente en la ventana que se abre. Envío
  automático real (sin intervención manual) requeriría integrar un proveedor de correo
  transaccional (ej. Resend) vía Edge Function — queda pendiente si se decide invertir
  en esa integración.

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
