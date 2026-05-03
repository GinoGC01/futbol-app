import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function debug() {
  const { data: ligas } = await supabase.from('liga').select('id, nombre, slug')
  console.log('LIGAS:', JSON.stringify(ligas, null, 2))

  if (ligas && ligas.length > 0) {
    const { data: seasons } = await supabase
      .from('temporada')
      .select('id, liga_id, nombre, estado, deleted_at')
      .eq('liga_id', ligas[0].id)
    console.log('SEASONS FOR FIRST LIGA:', JSON.stringify(seasons, null, 2))
  }
}

debug()
