import InscripcionService from "../../services/roster/InscripcionService.js";
import { validationResult } from "express-validator";

class InscripcionController {
  /**
   * POST /api/roster/inscripciones/equipo
   */
  async inscribirEquipo(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ status: "fail", errors: errors.array() });

      const { equipo_id, temporada_id, monto_total, limite_jugadores } =
        req.body;

      const result = await InscripcionService.inscribirEquipoEnTemporada(
        equipo_id,
        temporada_id,
        req.organizador.id,
        { monto_total, limite_jugadores },
      );

      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roster/inscripciones/jugador
   */
  async agregarJugador(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ status: "fail", errors: errors.array() });

      const { plantel_id, jugador_id, dorsal, posicion } = req.body;

      const inscripcion = await InscripcionService.agregarJugadorAPlantel(
        plantel_id,
        jugador_id,
        req.organizador.id,
        { dorsal, posicion },
      );

      res.status(201).json({ status: "success", data: inscripcion });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/roster/inscripciones/pago/:id
   */
  async actualizarPago(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ status: "fail", errors: errors.array() });

      const updated = await InscripcionService.actualizarPago(
        req.params.id,
        req.organizador.id,
        req.body.monto_abonado,
      );

      res.status(200).json({ status: "success", data: updated });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roster/inscripciones?temporada_id=xxx
   */
  async getByTemporada(req, res, next) {
    try {
      const inscripciones =
        await InscripcionService.getInscripcionesByTemporada(
          req.query.temporada_id,
          req.organizador.id,
        );

      res
        .status(200)
        .json({
          status: "success",
          results: inscripciones.length,
          data: inscripciones,
        });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/roster/inscripciones/equipo/:equipo_id
   */
  async getByEquipo(req, res, next) {
    try {
      const { equipo_id } = req.params;
      const inscripciones = await InscripcionService.getInscripcionesByEquipo(
        equipo_id,
        req.organizador.id,
      );

      res
        .status(200)
        .json({
          status: "success",
          results: inscripciones.length,
          data: inscripciones,
        });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/roster/inscripciones/equipo/batch
   */
  async inscribirEquiposBatch(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ status: "fail", errors: errors.array() });

      const { equipo_ids, temporada_id, limite_jugadores } = req.body;

      const result = await InscripcionService.inscribirEquiposBatch(
        equipo_ids,
        temporada_id,
        req.organizador.id,
        { limite_jugadores },
      );

      res.status(201).json({ status: "success", data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new InscripcionController();
