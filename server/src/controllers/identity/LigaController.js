import { validationResult } from "express-validator";
import RegistrationService from "../../services/identity/RegistrationService.js";
import LigaService from "../../services/identity/LigaService.js";

/**
 * POST /api/identity/register
 * Onboarding completo: Organizador -> Liga -> Email de Verificación
 */
export async function register(req, res, next) {
  try {
    console.log("--- REGISTER DEBUG (Deferred Registration) ---");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }

    const {
      email,
      password,
      nombre_organizador,
      telefono,
      nombre_liga,
      slug,
      zona,
      tipo_futbol,
    } = req.body;

    await RegistrationService.registerPending({
      email,
      password,
      nombre_organizador,
      telefono,
      nombre_liga,
      slug,
      zona,
      tipo_futbol,
    });

    res.status(201).json({
      status: "success",
      message: "Revisá tu email para confirmar tu cuenta y crear tu liga",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/identity/ligas
 */
export async function getMyLigas(req, res, next) {
  try {
    const ligas = await LigaService.getLigasByOrganizador(req.organizador.id);

    res.status(200).json({
      status: "success",
      results: ligas.length,
      data: ligas,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/identity/ligas
 */
export async function createLiga(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }

    const organizadorId = req.organizador.id;
    const nuevaLiga = await LigaService.createLiga(organizadorId, req.body);

    res.status(201).json({
      status: "success",
      data: nuevaLiga,
    });
  } catch (error) {
    if (
      error.statusCode === 403 &&
      error.message?.includes("límite de ligas")
    ) {
      return res.status(403).json({
        status: "fail",
        code: "LEAGUE_LIMIT_REACHED",
        message: error.message,
      });
    }
    next(error);
  }
}

/**
 * PUT /api/identity/ligas/:id
 */
export async function updateLiga(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: "fail", errors: errors.array() });
    }

    const { id } = req.params;
    const organizadorId = req.organizador.id;

    const updatedLiga = await LigaService.updateLiga(
      id,
      organizadorId,
      req.body,
    );

    res.status(200).json({
      status: "success",
      data: updatedLiga,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/identity/ligas/:id/stats
 */
export async function getDashboardStats(req, res, next) {
  try {
    const { id } = req.params;
    const organizadorId = req.organizador.id;

    const stats = await LigaService.getDashboardStats(id, organizadorId);

    res.status(200).json({
      status: "success",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/identity/ligas/:id
 */
export async function deleteLiga(req, res, next) {
  try {
    const { id } = req.params;
    const organizadorId = req.organizador.id;

    await LigaService.deleteLiga(id, organizadorId);

    res.status(200).json({
      status: "success",
      message: "Liga eliminada exitosamente junto con todos sus datos",
    });
  } catch (error) {
    next(error);
  }
}

export const LigaController = {
  register,
  getMyLigas,
  createLiga,
  updateLiga,
  getDashboardStats,
  deleteLiga
};

export default LigaController;
