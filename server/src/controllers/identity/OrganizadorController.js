import OrganizadorService from '../../services/identity/OrganizadorService.js'

class OrganizadorController {
  /**
   * GET /api/identity/me
   */
  async getMe(req, res, next) {
    try {
      // req.organizador inyectado por requireOrganizador middleware
      const profile = await OrganizadorService.getProfile(req.organizador.id)
      
      res.status(200).json({
        status: 'success',
        data: profile
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/identity/organizador
   * Crea el perfil de organizador tras el signUp en frontend
   */
  async createOrganizador(req, res, next) {
    try {
      const { id: auth_id, email } = req.user
      const { nombre, telefono } = req.body

      const organizador = await OrganizadorService.getOrCreateOrganizador(
        auth_id,
        email,
        nombre,
        telefono
      )

      res.status(201).json({
        status: 'success',
        data: organizador
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/identity/me
   */
  async updateMe(req, res, next) {
    try {
      const updatedProfile = await OrganizadorService.updateProfile(req.organizador.id, req.body)
      
      res.status(200).json({
        status: 'success',
        data: updatedProfile
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new OrganizadorController()
