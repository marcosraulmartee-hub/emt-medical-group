/**
 * No existe forma de adjuntar un archivo generado en el navegador a un link
 * de WhatsApp o mailto (restricción de seguridad del navegador, no de esta
 * app). El flujo real es: se descarga el PDF y se abre WhatsApp Web / el
 * cliente de correo con el mensaje ya escrito, para que el staff adjunte el
 * archivo manualmente en la conversación que se abrió.
 */
export function buildWhatsAppShareUrl(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

export function buildMailtoUrl(email: string | null | undefined, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${email ?? ''}?${params.toString().replace(/\+/g, '%20')}`
}

export function openShareWindow(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
