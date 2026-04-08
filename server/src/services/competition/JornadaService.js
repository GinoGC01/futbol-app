import { supabaseAdmin } from '../../lib/supabase.js'
import TemporadaService from './TemporadaService.js'
import LigaService from '../identity/LigaService.js'
import AppError from '../../utils/AppError.js'

class JornadaService {
  /**
   * Generación atómica en batch de N jornadas.
   * Supabase insert([...]) realiza una transacción a nivel de API sobre la tabla. 
   * Si falla internamente (ej: un constraint de unicidad de numero de jornada en misma fase), revertirá todo el bloque insertado en esa petición.
   */
  async createJornadasBatch(faseId, organizadorId, cantidad) {
    if (!cantidad || cantidad < 1 || cantidad > 100) {
      throw new AppError('La cantidad debe ser un número válido (1-100)', 400)
    }

    // 1. Obtener la Fase y la Temporada para verificar Estado "Bóveda" y Propiedad
    const { data: fase, error: faseError } = await supabaseAdmin
      .from('fase')
      .select(`
        temporada_id,
        temporada:temporada(liga_id)
      `)
      .eq('id', faseId)
      .maybeSingle()

    if (faseError || !fase) throw new AppError('La Fase no existe', 404)

    // 2. Aislamiento Total
    await LigaService.verifyOwnership(fase.temporada.liga_id, organizadorId)

    // 3. Hard Lock: Control de Estado Bóveda
    await TemporadaService.validateNotFinalizada(fase.temporada_id)

    // 4. Determinar número de arranque (Evitar duplicidad de números en la misma fase)
    const { data: ultimasJornadas, error: uqError } = await supabaseAdmin
      .from('jornada')
      .select('numero')
      .eq('fase_id', faseId)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (uqError) throw new AppError(`Error al verificar jornadas previas: ${uqError.message}`, 500)

    const startNumber = ultimasJornadas ? ultimasJornadas.numero + 1 : 1

    // 5. Armar Array Batch
    const payloadBuffer = []
    for (let i = 0; i < cantidad; i++) {
       payloadBuffer.push({
         fase_id: faseId,
         numero: startNumber + i,
         estado: 'programada', // Valor inicial validado en el schema
       })
    }

    try {
      // 6. Transacción en API (Supabase Postgres)
      const { data: jornadasInsertadas, error: batchError } = await supabaseAdmin
        .from('jornada')
        .insert(payloadBuffer)
        .select('id, numero, estado')

      if (batchError) {
        // Falló la operación en bloque
        throw new AppError(`Falló la creación atómica de jornadas: ${batchError.message}`, 500)
      }

      return {
        message: `${cantidad} jornadas creadas exitosamente`,
        jornadas: jornadasInsertadas
      }
    } catch (e) {
      // Si fue AppError lo arrojamos directo
      if (e instanceof AppError) throw e
      throw new AppError(`Error fatal generando batch: ${e.message}`, 500)
    }
  }

  /**
   * Actualiza una jornada (fecha_tentativa).
   */
  async updateJornada(jornadaId, organizadorId, updateData) {
    // 1. Resolve: jornada → fase → temporada → liga
    const { data: jornada, error: jErr } = await supabaseAdmin
      .from('jornada')
      .select(`
        id, fase_id,
        fase:fase(
          temporada_id,
          temporada:temporada(liga_id, estado)
        )
      `)
      .eq('id', jornadaId)
      .maybeSingle()

    if (jErr || !jornada) throw new AppError('Jornada no encontrada', 404)

    // 2. Aislamiento
    await LigaService.verifyOwnership(jornada.fase.temporada.liga_id, organizadorId)

    // 3. Vault
    if (jornada.fase.temporada.estado === 'finalizada') {
      throw new AppError('Temporada finalizada: no se puede editar la jornada (Modo Bóveda)', 403)
    }

    // 4. Update
    const payload = {}
    if (updateData.fecha_tentativa !== undefined) payload.fecha_tentativa = updateData.fecha_tentativa

    if (Object.keys(payload).length === 0) {
      throw new AppError('No hay datos para actualizar', 400)
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('jornada')
      .update(payload)
      .eq('id', jornadaId)
      .select('id, numero, estado, fecha_tentativa')
      .single()

    if (updateError) throw new AppError(`Error al actualizar jornada: ${updateError.message}`, 500)

    return updated
  }
}

export default new JornadaService()
