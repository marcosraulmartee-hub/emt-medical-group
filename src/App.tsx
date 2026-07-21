import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleRoute } from './components/RoleRoute'
import { PermissionRoute, HomeRedirect } from './components/PermissionRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { DashboardPage } from './pages/DashboardPage'
import { AgendaPage } from './pages/AgendaPage'
import { PatientsPage } from './pages/PatientsPage'
import { PatientDetailPage } from './pages/PatientDetailPage'
import { ProtocolsPage } from './pages/ProtocolsPage'
import { ConsentPage } from './pages/ConsentPage'
import { SessionsPage } from './pages/SessionsPage'
import { BillingPage } from './pages/BillingPage'
import { ResearchPage } from './pages/ResearchPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { AuditPage } from './pages/AuditPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route element={<PermissionRoute perm="dashboard.view" />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route element={<PermissionRoute perm="agenda.view" />}>
              <Route path="/agenda" element={<AgendaPage />} />
            </Route>
            <Route element={<PermissionRoute perm="patients.view" />}>
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
            </Route>
            <Route element={<PermissionRoute perm="protocols.view" />}>
              <Route path="/protocols" element={<ProtocolsPage />} />
            </Route>
            <Route element={<PermissionRoute perm="consents.view" />}>
              <Route path="/consents" element={<ConsentPage />} />
            </Route>
            <Route element={<PermissionRoute perm="sessions.view" />}>
              <Route path="/sessions" element={<SessionsPage />} />
            </Route>
            <Route element={<PermissionRoute perm="research.view" />}>
              <Route path="/research" element={<ResearchPage />} />
            </Route>
            <Route element={<PermissionRoute perm="billing.view" />}>
              <Route path="/billing" element={<BillingPage />} />
            </Route>
            <Route element={<PermissionRoute perm="reports.view" />}>
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
            <Route element={<RoleRoute allow={['admin']} />}>
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit" element={<AuditPage />} />
            </Route>
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
