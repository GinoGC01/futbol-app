import AppError from '../../utils/AppError.js'

const DIAS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

class FixtureHorarioService {

  /**
   * Calcula horarios de partido para una jornada, distribuyendo entre
   * múltiples días de juego si la fase los tiene configurados.
   */
  calculateSchedule(config, fechaJornada, matchCount) {
    const diasJuego = this._normalizeDiasJuego(config.dias_juego)

    if (diasJuego && diasJuego.length > 0) {
      return this._calculateMultiDay(config, fechaJornada, matchCount)
    }
    return this._calculateSingleDay(config, fechaJornada, matchCount)
  }

  /**
   * Asigna horarios a una lista de partidos.
   */
  assignMatchTimes(config, fechaJornada, partidos) {
    const { horarios, maxPartidos } = this.calculateSchedule(config, fechaJornada, partidos.length)

    if (partidos.length > maxPartidos) {
      const totalDays = config.dias_juego?.length || 1
      const perDay = Math.ceil(maxPartidos / totalDays)
      throw new AppError(
        `No hay suficiente disponibilidad horaria para generar el fixture. ` +
        `Se requieren ${partidos.length} partidos pero solo hay ${maxPartidos} espacios ` +
        `en ${totalDays} día(s) (${perDay} partidos/día aprox.). ` +
        `Agregá más días, ampliá el rango horario o aumentá la cantidad de canchas.`,
        400
      )
    }

    const canchas = parseInt(config.canchas_disponibles) || 1

    return partidos.map((partido, index) => {
      const horario = horarios[index] || horarios[horarios.length - 1]
      const canchaIndex = (index % canchas) + 1
      return {
        ...partido,
        fecha_hora: horario,
        cancha: partido.cancha || `Cancha ${canchaIndex}`
      }
    })
  }

  _calculateSingleDay(config, fechaJornada, matchCount) {
    const warnings = []
    const stats = this._computeDayStats(config)
    const fechaBase = fechaJornada.split('T')[0]
    const horarios = []

    for (let c = 0; c < stats.canchas; c++) {
      for (let p = 0; p < stats.partidosPorDia; p++) {
        const hora = this._addMinutes(stats.horaInicio, p * stats.intervaloPartido)
        horarios.push(this._formatISO(fechaBase, hora))
      }
    }
    horarios.sort()

    if (matchCount !== undefined && matchCount > stats.partidosPorDia) {
      warnings.push(
        `Se requieren ${matchCount} partidos pero solo caben ${stats.partidosPorDia} ` +
        `en el bloque horario (${stats.minutosDisponibles}min, ${stats.canchas} cancha(s)).`
      )
    }

    return { horarios, maxPartidos: stats.partidosPorDia, warnings }
  }

  _calculateMultiDay(config, fechaJornada, matchCount) {
    const warnings = []
    const stats = this._computeDayStats(config)
    const diasJuego = this._normalizeDiasJuego(config.dias_juego)

    if (!diasJuego || diasJuego.length === 0) {
      return this._calculateSingleDay(config, fechaJornada, matchCount)
    }

    const totalSlots = stats.partidosPorDia * diasJuego.length

    if (matchCount !== undefined && matchCount > totalSlots) {
      const diasStr = diasJuego.map(d => DIAS_LABELS[d] || `Día ${d}`).join(', ')
      throw new AppError(
        `No hay suficiente disponibilidad horaria para generar el fixture. ` +
        `Se requieren ${matchCount} partidos pero solo hay ${totalSlots} espacios ` +
        `en ${diasJuego.length} día(s) habilitados (${diasStr}). ` +
        `Capacidad por día: ${stats.partidosPorDia} partidos ` +
        `(${stats.minutosDisponibles}min, ${stats.canchas} cancha(s)). ` +
        `Agregá más días, ampliá el rango horario o aumentá la cantidad de canchas.`,
        400
      )
    }

    const fechaBase = new Date(fechaJornada)
    const gameDates = diasJuego
      .map(day => this._getNextDayOfWeek(fechaBase, day))
      .sort((a, b) => a - b)

    const horarios = []
    for (const gameDate of gameDates) {
      const fechaStr = gameDate.toISOString().split('T')[0]
      for (let c = 0; c < stats.canchas; c++) {
        for (let p = 0; p < stats.partidosPorDia; p++) {
          const hora = this._addMinutes(stats.horaInicio, p * stats.intervaloPartido)
          horarios.push(this._formatISO(fechaStr, hora))
        }
      }
    }
    horarios.sort()

    if (matchCount !== undefined) {
      warnings.push(
        `Distribuyendo ${matchCount} partidos en ${diasJuego.length} día(s): ` +
        `${stats.partidosPorDia} partidos/día, ${totalSlots} slots totales.`
      )
    }

    return { horarios, maxPartidos: totalSlots, warnings }
  }

  _computeDayStats(config) {
    const duracionTiempo = parseInt(config.duracion_tiempo) || 20
    const duracionEntretiempo = parseInt(config.duracion_entretiempo) || 5
    const tiempoEntrePartidos = parseInt(config.tiempo_entre_partidos) || 15
    const canchas = parseInt(config.canchas_disponibles) || 1
    const horaInicio = this._parseTime(config.hora_inicio || '17:00')
    const horaFin = this._parseTime(config.hora_fin || '22:00')


    if (!horaInicio || !horaFin) {
      throw new AppError('Configuración de horario inválida: hora_inicio y hora_fin deben ser HH:MM', 400)
    }
    const inicioMinutos = horaInicio.hours * 60 + horaInicio.minutes
    const finMinutos = horaFin.hours * 60 + horaFin.minutes
    if (finMinutos <= inicioMinutos) {
      throw new AppError('hora_fin debe ser posterior a hora_inicio', 400)
    }

    const duracionPartido = duracionTiempo * 2 + duracionEntretiempo
    const intervaloPartido = duracionPartido + tiempoEntrePartidos
    const minutosDisponibles = finMinutos - inicioMinutos

    if (minutosDisponibles < duracionPartido) {
      throw new AppError(
        `El bloque horario (${minutosDisponibles}min) es menor que la duración de un partido (${duracionPartido}min)`,
        400
      )
    }

    const partidosPorCancha = Math.floor(minutosDisponibles / intervaloPartido)
    const partidosPorDia = partidosPorCancha * canchas

    return { duracionPartido, intervaloPartido, minutosDisponibles, partidosPorDia, canchas, horaInicio }
  }

  _normalizeDiasJuego(dias) {
    if (!dias) return null
    const arr = Array.isArray(dias) ? dias : [dias]
    const nums = arr.map(d => parseInt(d)).filter(d => !isNaN(d) && d >= 0 && d <= 6)
    return [...new Set(nums)].sort()
  }

  _getNextDayOfWeek(fromDate, targetDay) {
    const d = new Date(fromDate)
    d.setHours(0, 0, 0, 0)
    const currentDay = d.getDay()
    let diff = targetDay - currentDay
    if (diff < 0) diff += 7
    d.setDate(d.getDate() + diff)
    return d
  }

  _parseTime(str) {
    if (!str) return null
    const parts = str.split(':')
    if (parts.length < 2) return null
    const hours = parseInt(parts[0])
    const minutes = parseInt(parts[1])
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
    return { hours, minutes }
  }

  _addMinutes(time, minutes) {
    const totalMinutes = time.hours * 60 + time.minutes + minutes
    const hours = Math.floor(totalMinutes / 60) % 24
    const mins = totalMinutes % 60
    return { hours, minutes: mins }
  }

  _formatISO(fechaStr, time) {
    const h = String(time.hours).padStart(2, '0')
    const m = String(time.minutes).padStart(2, '0')
    return `${fechaStr}T${h}:${m}:00.000Z`
  }
}

const instance = new FixtureHorarioService()
export default instance
