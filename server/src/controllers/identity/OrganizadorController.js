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
