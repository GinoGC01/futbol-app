import OrganizadorService from '../../services/identity/OrganizadorService.js'

/**
 * GET /api/identity/me
 */
export async function getMe(req, res, next) {
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
export async function createOrganizador(req, res, next) {
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
export async function updateMe(req, res, next) {
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

export const OrganizadorController = {
  getMe,
  createOrganizador,
  updateMe
};

export default OrganizadorController;
