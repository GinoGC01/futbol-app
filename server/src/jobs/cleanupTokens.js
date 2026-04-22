import cron from 'node-cron'
import { supabaseAdmin } from '../lib/supabase.js'

export function startCleanupJob() {
  // Ejecutar todos los días a las 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[cleanup] Iniciando limpieza de tokens expirados o usados...');
    try {
      // Limpiar tokens de verificación de email
      const { error: errorEmail } = await supabaseAdmin
        .from('email_verification_tokens')
        .delete()
        .or(`used.eq.true,expires_at.lt.${new Date().toISOString()}`);

      if (errorEmail) {
        console.error('[cleanup] Error limpiando email_verification_tokens:', errorEmail);
      } else {
        console.log('[cleanup] email_verification_tokens limpios.');
      }

      // Limpiar tokens de recuperación de contraseña
      const { error: errorPass } = await supabaseAdmin
        .from('password_reset_tokens')
        .delete()
        .or(`used.eq.true,expires_at.lt.${new Date().toISOString()}`);

      if (errorPass) {
        console.error('[cleanup] Error limpiando password_reset_tokens:', errorPass);
      } else {
        console.log('[cleanup] password_reset_tokens limpios.');
      }
    } catch (err) {
      console.error('[cleanup] Error inesperado:', err);
    }
  });
}
