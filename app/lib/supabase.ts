import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hicdsrqhgjdvjctxcucr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpY2RzcnFoZ2pkdmpjdHhjdWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDMxNDEsImV4cCI6MjA5MzkxOTE0MX0.l8N5-LjFNakStf2ZF0-TyrD9Vg9ooFKihzh53L-NXNo'

export const supabase = createClient(supabaseUrl, supabaseKey)
