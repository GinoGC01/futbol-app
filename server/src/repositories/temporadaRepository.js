import { supabaseAdmin } from '../lib/supabase.js'

export const temporadaRepository = {
  async findTemporadaCheck(id) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .select("estado, liga_id, liga:liga_id(monto_inscripcion)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return { data, error }
  },

  async findFormatoCompetenciaById(id) {
    const { data, error } = await supabaseAdmin
      .from("formato_competencia")
      .select("id, tipo, nombre")
      .eq("id", id)
      .maybeSingle();
    return { data, error }
  },

  async findFormatoCompetenciaByTipo(tipo) {
    const { data, error } = await supabaseAdmin
      .from("formato_competencia")
      .select("id, tipo, nombre")
      .eq("tipo", tipo.toLowerCase())
      .limit(1);
    return { data, error }
  },

  async findFormatoCompetenciaByNombre(nombre) {
    const { data, error } = await supabaseAdmin
      .from("formato_competencia")
      .select("id, tipo, nombre")
      .ilike("nombre", `%${nombre}%`)
      .limit(1);
    return { data, error }
  },

  async createTemporada(payload) {
    let result = await supabaseAdmin
      .from("temporada")
      .insert([payload])
      .select("id, nombre, estado, fecha_inicio, fecha_fin, formato_id, modalidad, liga:liga_id(id, tipo_futbol)")
      .maybeSingle();

    if (result.error && (result.error.message.includes("modalidad") || result.error.code === '42703')) {
      const copyPayload = { ...payload }
      delete copyPayload.modalidad;
      result = await supabaseAdmin
        .from("temporada")
        .insert([copyPayload])
        .select("id, nombre, estado, fecha_inicio, fecha_fin, formato_id, liga:liga_id(id, tipo_futbol)")
        .single();
      if (result.data) {
        result.data.modalidad = payload.modalidad;
      }
    }
    return result;
  },

  async findTemporadasByLiga(ligaId, filterArchived) {
    let query = supabaseAdmin
      .from("temporada")
      .select(`
        id, nombre, estado, fecha_inicio, fecha_fin, modalidad,
        liga:liga_id(id, tipo_futbol),
        formato:formato_competencia(id, nombre, tipo)
      `)
      .eq("liga_id", ligaId)
      .order("created_at", { ascending: false });

    if (filterArchived === 'active') {
      query = query.is("deleted_at", null);
    } else if (filterArchived === 'archived') {
      query = query.not("deleted_at", "is", null);
    }

    const { data, error } = await query;
    return { data, error }
  },

  async findTemporadaByIdCheck(id) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .select("id, estado, liga_id")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    return { data, error }
  },

  async updateTemporadaEstado(id, estado) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .update({ estado })
      .eq("id", id)
      .select("id, nombre, estado")
      .single();
    return { data, error }
  },

  async findTemporadaCompletaTree(id) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .select(
        `
        id, nombre, estado, fecha_inicio, fecha_fin, modalidad,
        liga:liga_id(id, tipo_futbol),
        formato:formato_competencia(id, nombre, tipo),
        fases:fase(
          id, nombre, tipo, orden, puntos_victoria, puntos_empate, ida_y_vuelta,
          jornadas:jornada(id, numero, estado, fecha_tentativa)
        )
      `,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();
    return { data, error }
  },

  async findFormatosCompetencia() {
    const { data, error } = await supabaseAdmin
      .from("formato_competencia")
      .select("id, nombre, tipo")
      .order("nombre", { ascending: true });
    return { data, error }
  },

  async updateTemporada(id, payload) {
    let result = await supabaseAdmin
      .from("temporada")
      .update(payload)
      .eq("id", id)
      .select("id, nombre, estado, fecha_inicio, fecha_fin, modalidad, liga:liga_id(id, tipo_futbol)")
      .maybeSingle();

    if (result.error && (result.error.message.includes("modalidad") || result.error.code === '42703')) {
      const copyPayload = { ...payload }
      delete copyPayload.modalidad;
      result = await supabaseAdmin
        .from("temporada")
        .update(copyPayload)
        .eq("id", id)
        .select("id, nombre, estado, fecha_inicio, fecha_fin, liga:liga_id(id, tipo_futbol)")
        .single();
    }
    return result;
  },

  async updateTemporadaDeletedAt(id, deletedAt) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .select()
    return { data, error }
  },

  async findTemporadaByIdCheckNoDeletedFilter(id) {
    const { data, error } = await supabaseAdmin
      .from("temporada")
      .select("id, liga_id")
      .eq("id", id)
      .maybeSingle();
    return { data, error }
  }
}

export default temporadaRepository;
