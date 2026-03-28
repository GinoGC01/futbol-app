import OrganizadorService from '../../services/identity/OrganizadorService.js'
import LigaService from '../../services/identity/LigaService.js'
import { supabaseAdmin } from '../../lib/supabase.js'
import AppError from '../../utils/AppError.js'
import { validationResult } from 'express-validator'

class LigaController {
  /**
   * POST /api/identity/register
   * Onboarding completo: Auth User -> Organizador -> Liga
   */
  async register(req, res, next) {
    try {
      console.log('--- REGISTER DEBUG ---')
      console.log('Body:', JSON.stringify(req.body, null, 2))
      
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        console.log('Validation Errors:', JSON.stringify(errors.array(), null, 2))
        return res.status(400).json({ status: 'fail', errors: errors.array() })
      }

      const { email, password, nombre_organizador, telefono, nombre_liga, slug, zona, tipo_futbol } = req.body

      // 0. Validar slug antes de crear el usuario para fallar rápido
      console.log('Step 0: Validating slug:', slug)
      await LigaService.validateSlug(slug)
      console.log('Step 0: Slug is valid and free.')

      // 1. Crear usuario en Supabase Auth
      console.log('Step 1: Creating Auth User...')
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true 
      })

      if (authError) {
        console.log('Step 1: Auth Error:', JSON.stringify(authError, null, 2))
        throw new AppError(`Error creando autenticación: ${authError.message}`, 400)
      }

      console.log('Step 1: Auth User created:', authData.user.id)
      const userId = authData.user.id
      let organizadorId = null

      try {
        // 2. Crear Organizador vinculado al auth_id
        console.log('Step 2: Creating Organizador Profile...')
        const organizador = await OrganizadorService.getOrCreateOrganizador(
          userId, 
          email, 
          nombre_organizador, 
          telefono
        )
        
        organizadorId = organizador.id

        // 3. Crear primera Liga
        const nuevaLiga = await LigaService.createLiga(organizadorId, {
          nombre: nombre_liga,
          slug,
          zona,
          tipo_futbol
        })

        // Onboarding exitoso
        res.status(201).json({
          status: 'success',
          message: 'Registro exitoso',
          data: {
            organizador,
            liga: nuevaLiga
          }
        })
      } catch (error) {
        // Rollback manual (Compensación) si algo falla tras crear el usuario en Auth
        if (userId) {
          console.warn(`[Rollback] Eliminando usuario auth ${userId} por fallo en onboarding: ${error.message}`)
          await supabaseAdmin.auth.admin.deleteUser(userId)
          
          // Si el organizador llegó a crearse, el CASCADE on DELETE de auth.users (si lo hay) limpia organizador.
          // Pero en nuestro schema (migración 002) pusimos ON DELETE SET NULL. Así que deberíamos
          // borrar el organizador manualmente también si ya lo creamos.
          if (organizadorId) {
             await supabaseAdmin.from('organizador').delete().eq('id', organizadorId)
          }
        }
        throw error // Re-throw the AppError to be handled
      }

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
