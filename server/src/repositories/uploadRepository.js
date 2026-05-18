import { supabaseAdmin } from '../lib/supabase.js'

export const uploadRepository = {
  async uploadFile(bucket, filePath, buffer, options) {
    return await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, options)
  },

  getPublicUrl(bucket, filePath) {
    return supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath)
  }
}
