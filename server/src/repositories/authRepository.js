import { supabaseAdmin } from '../lib/supabase.js'

export const authRepository = {
  async findPendingRegistrationByToken(token) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()
    return { data, error }
  },

  async markPendingRegistrationAsUsed(id) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .update({ used: true })
      .eq('id', id)
      .select()
    return { data, error }
  },

  async updateOrganizador(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  async createOrganizador(organizadorData) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .insert([organizadorData])
      .select('*')
      .single()
    return { data, error }
  },

  async findLatestPendingRegistrationByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    return { data, error }
  },

  async updatePendingRegistrationToken(id, token, expiresAt) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .update({
        token,
        expires_at: expiresAt,
        created_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
    return { data, error }
  },

  async findRecentPasswordResetTokens(userId) {
    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id')
      .eq('user_id', userId)
      .gt('created_at', new Date(Date.now() - 60000).toISOString())
    return { data, error }
  },

  async invalidateAllPasswordResetTokensForUser(userId) {
    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', userId)
      .select()
    return { data, error }
  },

  async createPasswordResetToken(userId, token, expiresAt) {
    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert([{ user_id: userId, token, expires_at: expiresAt }])
      .select()
    return { data, error }
  },

  async findPasswordResetToken(token) {
    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()
    return { data, error }
  },

  async markPasswordResetTokenAsUsed(id) {
    const { data, error } = await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', id)
      .select()
    return { data, error }
  },

  async findOrganizadorPasswordHash(id) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('password_hash')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async invalidateAllPendingRegistrationsForEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false)
      .select()
    return { data, error }
  },

  async createPendingRegistration(registrationData) {
    const { data, error } = await supabaseAdmin
      .from('pending_registrations')
      .insert([registrationData])
      .select()
    return { data, error }
  },

  async findOrganizadorByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, password_hash, email_verified, created_at')
      .eq('email', email)
      .maybeSingle()
    return { data, error }
  },

  async findOrganizadorProfile(id) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .select('id, nombre, email, telefono, status, active_leagues_limit, created_at')
      .eq('id', id)
      .single()
    return { data, error }
  },

  async updateOrganizadorProfile(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('organizador')
      .update(updates)
      .eq('id', id)
      .select('id, nombre, email, telefono')
      .single()
    return { data, error }
  }
}
