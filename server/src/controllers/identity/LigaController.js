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
      console.log('--- REGISTER DEBUG (Custom Auth) ---')
      
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ status: 'fail', errors: errors.array() })
      }

      const { email, password, nombre_organizador, telefono, nombre_liga, slug, zona, tipo_futbol } = req.body

      // 0. Validar slug antes de crear nada
      await LigaService.validateSlug(slug)

      // 1. Hashear contraseña
      const password_hash = await bcrypt.hash(password, 10)

      // 2. Crear Organizador en la tabla interna
      const organizador = await OrganizadorService.create({
        nombre: nombre_organizador,
        email,
        password_hash,
        telefono
      })

      // 3. Crear primera Liga
      const nuevaLiga = await LigaService.createLiga(organizador.id, {
        nombre: nombre_liga,
        slug,
        zona,
        tipo_futbol
      })

      // 4. Generar Token de Verificación
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas

      const { error: tokenError } = await supabaseAdmin
        .from('email_verification_tokens')
        .insert([{
          user_id: organizador.id,
          token: token,
          expires_at: expiresAt
        }])

      if (tokenError) {
        console.error('Error insertando token de verificación:', tokenError)
        // No bloqueamos el registro por esto, pero el usuario tendrá que pedir reenvío.
      } else {
        await sendVerificationEmail(organizador.email, token)
      }

      res.status(201).json({
        status: 'success',
        message: 'Revisá tu email para verificar tu cuenta',
        data: null // Ya no enviamos JWT ni info sensible
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
}

export default new LigaController()
