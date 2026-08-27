import { getSetting, setSetting } from './clinicSettings'

export type NotificationRetention = '24h' | '7d' | 'never'

const SETTING_KEY = 'notification_retention'
const DEFAULT_RETENTION: NotificationRetention = 'never'

const RETENTION_MS: Record<Exclude<NotificationRetention, 'never'>, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

function isValidRetention(value: string | null): value is NotificationRetention {
  return value === '24h' || value === '7d' || value === 'never'
}

export async function getNotificationRetention(): Promise<NotificationRetention> {
  const value = await getSetting(SETTING_KEY)
  return isValidRetention(value) ? value : DEFAULT_RETENTION
}

export async function setNotificationRetention(value: NotificationRetention) {
  await setSetting(SETTING_KEY, value)
}

export function isWithinRetention(createdAt: string, retention: NotificationRetention): boolean {
  if (retention === 'never') return true
  const cutoff = Date.now() - RETENTION_MS[retention]
  return new Date(createdAt).getTime() >= cutoff
}
