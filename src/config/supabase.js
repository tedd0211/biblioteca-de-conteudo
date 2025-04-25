import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fbjydwgytcgifchgpywo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianlkd2d5dGNnaWZjaGdweXdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDEzNTYsImV4cCI6MjA1ODU3NzM1Nn0.FXzWnKYvGR4sXmoTRWHFvT_L0jSJWh58MPQlWj3ta0o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 