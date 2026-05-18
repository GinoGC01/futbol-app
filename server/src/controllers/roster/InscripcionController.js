import InscripcionService from "../../services/roster/InscripcionService.js";
import { validationResult } from "express-validator";

export const inscribirEquipo = async (req, res, next) => {
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

export const agregarJugador = async (req, res, next) => {
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

export const actualizarPago = async (req, res, next) => {
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

export const getByTemporada = async (req, res, next) => {
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

export const getByEquipo = async (req, res, next) => {
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

export const inscribirEquiposBatch = async (req, res, next) => {
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

export const agregarJugadoresBatch = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ status: "fail", errors: errors.array() });

    const { plantel_id, jugadores } = req.body;

    const results = await InscripcionService.agregarJugadoresBatch(
      plantel_id,
      jugadores,
      req.organizador.id,
    );

    res.status(201).json({ status: "success", data: results });
  } catch (error) {
    next(error);
  }
}

const InscripcionController = {
  inscribirEquipo,
  agregarJugador,
  actualizarPago,
  getByTemporada,
  getByEquipo,
  inscribirEquiposBatch,
  agregarJugadoresBatch,
}

export default InscripcionController;
