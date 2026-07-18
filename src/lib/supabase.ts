import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isPlaceholderValue = (value: string | undefined) =>
  !value || value.includes('YOUR-PROJECT') || value.includes('your-anon-key')

if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Usa las credenciales de tu propio proyecto Supabase para esta copia.',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
