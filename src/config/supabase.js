import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validação das credenciais
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERRO: Credenciais do Supabase não configuradas!')
  console.error('Por favor, configure as variáveis de ambiente REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no arquivo .env')
  throw new Error('Credenciais do Supabase não configuradas')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 