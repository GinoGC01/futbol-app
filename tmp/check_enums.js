import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../server/.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkEnums() {
  const { data, error } = await supabase.rpc('get_enum_values', { enum_type: 'tipo_formato_enum' })
  if (error) {
    // Fallback directly querying pg_enum
    const { data: enumData, error: pgError } = await supabase.rpc('run_sql', { 
        sql: "SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'tipo_formato_enum'" 
    })
    console.log('Enum Values:', enumData || pgError)
  } else {
    console.log('Enum Values:', data)
  }
}

checkEnums()
