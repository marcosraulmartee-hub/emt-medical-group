import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { EquipmentSection } from './settings/EquipmentSection'
import { CoilsSection } from './settings/CoilsSection'
import { ProtocolCategoriesSection } from './settings/ProtocolCategoriesSection'
import { UsersSection } from './settings/UsersSection'
import { ChecklistSection } from './settings/ChecklistSection'
import { ClinicalScalesSection } from './settings/ClinicalScalesSection'
import { BillingSettingsSection } from './settings/BillingSettingsSection'
import { PermissionsSection } from './settings/PermissionsSection'
import { IntakeFormSection } from './settings/IntakeFormSection'

const TABS = [
  { key: 'equipment', label: 'Equipos' },
  { key: 'coils', label: 'Bobinas' },
  { key: 'categories', label: 'Categorías de protocolo' },
  { key: 'checklist', label: 'Checklist de seguridad' },
  { key: 'scales', label: 'Escalas clínicas' },
  { key: 'billing', label: 'Facturación' },
  { key: 'intake', label: 'Registro en línea' },
  { key: 'users', label: 'Usuarios' },
  { key: 'permissions', label: 'Permisos' },
] as const

type TabKey = (typeof TABS)[number]['key']

export function SettingsPage() {
  const [tab, setTab] = useState<TabKey>('equipment')

  return (
    <AppShell title="Configuración">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-1.5 shadow-card">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                'rounded-xl px-4 py-2 text-sm font-medium transition ' +
                (tab === t.key ? 'bg-teal-500 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-card">
          {tab === 'equipment' && <EquipmentSection />}
          {tab === 'coils' && <CoilsSection />}
          {tab === 'categories' && <ProtocolCategoriesSection />}
          {tab === 'checklist' && <ChecklistSection />}
          {tab === 'scales' && <ClinicalScalesSection />}
          {tab === 'billing' && <BillingSettingsSection />}
          {tab === 'intake' && <IntakeFormSection />}
          {tab === 'users' && <UsersSection />}
          {tab === 'permissions' && <PermissionsSection />}
        </div>
      </div>
    </AppShell>
  )
}
