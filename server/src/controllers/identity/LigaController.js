import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '../../lib/supabase.js'
import { sendVerificationEmail } from '../../utils/mailer.js'
import AuthController from './AuthController.js'
import OrganizadorService from '../../services/identity/OrganizadorService.js'
import LigaService from '../../services/identity/LigaService.js'
import AppError from '../../utils/AppError.js'
import { validationResult } from 'express-validator'

class LigaController {
  /**
   * POST /api/identity/register
   * Onboarding completo: Organizador -> Liga -> Email de Verificación
   */
  async register(req, res, next) {
    try {
      console.log('--- REGISTER DEBUG (Deferred Registration) ---')
      
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'fail', errors: errors.array() })
      }

      const { email, password, nombre_organizador, telefono, nombre_liga, slug, zona, tipo_futbol } = req.body

      // 1. Validar que el email no esté ya verificado en organizador
      const existingUser = await OrganizadorService.findByEmail(email)
      if (existingUser && existingUser.email_verified) {
        throw new AppError('El email ya está registrado y verificado', 409)
      }

      // 2. Validar slug antes de crear nada
      await LigaService.validateSlug(slug)

      // 3. Hashear contraseña
      const password_hash = await bcrypt.hash(password, 10)

      // 4. Inhabilitar registros pendientes previos del mismo email
      await supabaseAdmin
        .from('pending_registrations')
        .update({ used: true })
        .eq('email', email)
        .eq('used', false)

      // 5. Crear registro pendiente
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const { error: prError } = await supabaseAdmin
        .from('pending_registrations')
        .insert([{
          email,
          password_hash,
          nombre_organizador,
          telefono,
          nombre_liga,
          slug,
          zona,
          tipo_futbol,
          token,
          expires_at: expiresAt
        }])

      if (prError) {
        console.error('Error insertando registro pendiente:', prError)
        throw new AppError('No se pudo procesar el registro. Intentalo de nuevo.', 500)
      }

      // 6. Enviar email
      await sendVerificationEmail(email, token)

      res.status(201).json({
        status: 'success',
        message: 'Revisá tu email para confirmar tu cuenta y crear tu liga',
        data: null
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/identity/ligas
   */
  async getMyLigas(req, res, next) {
    try {
      const ligas = await LigaService.getLigasByOrganizador(req.organizador.id)
      
      res.status(200).json({
        status: 'success',
        results: ligas.length,
        data: ligas
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/identity/ligas
   */
  async createLiga(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'fail', errors: errors.array() })
      }

      const organizadorId = req.organizador.id
      const nuevaLiga = await LigaService.createLiga(organizadorId, req.body)

      res.status(201).json({
        status: 'success',
        data: nuevaLiga
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/identity/ligas/:id
   */
  async updateLiga(req, res, next) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'fail', errors: errors.array() })
      }

      const { id } = req.params
      const organizadorId = req.organizador.id

      const updatedLiga = await LigaService.updateLiga(id, organizadorId, req.body)

      res.status(200).json({
        status: 'success',
        data: updatedLiga
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/identity/ligas/:id/stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const { id } = req.params
      const organizadorId = req.organizador.id

      const stats = await LigaService.getDashboardStats(id, organizadorId)

      res.status(200).json({
        status: 'success',
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/identity/ligas/:id
   */
  async deleteLiga(req, res, next) {
    try {
      const { id } = req.params
      const organizadorId = req.organizador.id

      await LigaService.deleteLiga(id, organizadorId)

      res.status(200).json({
        status: 'success',
        message: 'Liga eliminada exitosamente junto con todos sus datos'
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new LigaController()
