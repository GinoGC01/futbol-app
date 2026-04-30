/**
 * FixtureEngine — Motor de Generación de Fixture Automático
 * 
 * Genera un fixture competitivo completo respetando las reglas:
 *   R1 — No repetir enfrentamientos dentro de la misma fase (A vs B = B vs A)
 *   R2 — Cada jornada con la máxima cantidad de partidos posibles
 *   R3 — Un equipo no puede ser local más de 2 jornadas consecutivas
 *   R4 — Descanso rotativo equitativo para equipos impares
 *   R5 — Segunda vuelta = espejo de la primera con localía invertida
 *   R6 — Todas las jornadas deben tener la misma cantidad de partidos (±1 si impar)
 *   R7 — No enfrentar al mismo rival en jornadas consecutivas
 * 
 * Algoritmo: Round Robin clásico (circle method) + post-procesamiento de localía
 */

class FixtureEngine {
  /**
   * Genera el fixture completo para una fase.
   * @param {string[]} equipoIds — UUIDs de los equipos participantes (mínimo 2)
   * @param {boolean} idaYVuelta — Si true, genera primera y segunda vuelta
   * @returns {{ rounds: Array<{ matches: Array<{local: string, visitante: string}>, bye: string|null }>, warnings: string[] }}
   */
  generate(equipoIds, idaYVuelta = false) {
    if (!equipoIds || equipoIds.length < 2) {
      throw new Error('Se necesitan al menos 2 equipos para generar el fixture')
    }

    const warnings = []
    const n = equipoIds.length
    const isOdd = n % 2 !== 0

    // Clonar para no mutar el original
    const teams = [...equipoIds]

    // Si es impar, agregar BYE virtual para completar pares
    if (isOdd) teams.push('__BYE__')
    const teamCount = teams.length

    // ─── PASO 1: Generar cruces con Circle Method (Round Robin) ───
    // El primer equipo permanece fijo, los demás rotan
    const rawRounds = this._generateCircleRounds(teams, teamCount)

    // ─── PASO 2: Validar R1 (sin duplicados) ───
    this._validateNoDuplicates(rawRounds, warnings)

    // ─── PASO 3: Validar R2 & R6 (jornadas completas y equilibradas) ───
    this._validateRoundCompleteness(rawRounds, teamCount, isOdd, warnings)

    // ─── PASO 4: Optimizar localía para cumplir R3 ───
    const optimizedRounds = this._optimizeHomeAway(rawRounds, teams, teamCount)

    // ─── PASO 5: Validar R4 (descanso equitativo para impares) ───
    if (isOdd) {
      this._validateByeDistribution(optimizedRounds, equipoIds, warnings)
    }

    // ─── PASO 6: Validar R7 (no rivales repetidos en jornadas consecutivas) ───
    this._validateNoConsecutiveRivals(optimizedRounds, warnings)

    // ─── PASO 7: Construir primera vuelta ───
    const firstLeg = optimizedRounds.map(round => ({
      matches: round.matches.map(m => ({
        local: m.local,
        visitante: m.visitante
      })),
      bye: round.bye
    }))

    let allRounds = [...firstLeg]

    // ─── PASO 8: Segunda vuelta (R5 — espejo con localía invertida + R3 optimización) ───
    if (idaYVuelta) {
      const rawSecondLeg = this._generateSecondLeg(firstLeg)
      // Re-optimize home/away for the second leg, carrying state from first leg
      const secondLeg = this._optimizeSecondLegHomeAway(rawSecondLeg, firstLeg, teams, teamCount)
      allRounds = [...firstLeg, ...secondLeg]
    }

    // ─── PASO 9: Validación final de R3 en el fixture completo ───
    const r3Violations = this._checkR3Violations(allRounds, teams.filter(t => t !== '__BYE__'))
    if (r3Violations.length > 0) {
      warnings.push(`R3: ${r3Violations.length} equipos superan 2 jornadas consecutivas como local (se intentó minimizar)`)
    }

    // matchesPerRound uses actual team count (excluding BYE)
    const actualMatchesPerRound = Math.floor(n / 2)

    return {
      rounds: allRounds,
      totalRounds: allRounds.length,
      matchesPerRound: actualMatchesPerRound,
      totalMatches: allRounds.reduce((sum, r) => sum + r.matches.length, 0),
      warnings
    }
  }

  /**
   * Calcula cuántas jornadas necesita una fase.
   */
  calculateRequiredRounds(teamCount, idaYVuelta) {
    const n = teamCount
    const roundsPerLeg = n % 2 === 0 ? n - 1 : n
    return idaYVuelta ? roundsPerLeg * 2 : roundsPerLeg
  }

  // ═══════════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════════

  /**
   * Circle Method: el equipo 0 permanece fijo, los demás rotan en sentido horario.
   * Produce (teamCount - 1) rondas, cada una con teamCount/2 emparejamientos.
   */
  _generateCircleRounds(teams, teamCount) {
    // Trabajamos con índices para rotar fácilmente
    const slots = teams.map((_, i) => i)
    const rounds = []

    for (let round = 0; round < teamCount - 1; round++) {
      const matches = []
      let bye = null

      for (let i = 0; i < teamCount / 2; i++) {
        const homeIdx = slots[i]
        const awayIdx = slots[teamCount - 1 - i]
        const home = teams[homeIdx]
        const away = teams[awayIdx]

        if (home === '__BYE__') {
          bye = away
          continue
        }
        if (away === '__BYE__') {
          bye = home
          continue
        }

        // Asignación base de localía: alternar según ronda para balance inicial
        if (round % 2 === 0) {
          matches.push({ local: home, visitante: away })
        } else {
          matches.push({ local: away, visitante: home })
        }
      }

      rounds.push({ matches, bye })

      // Rotar: fijo el primero (index 0), rotar el resto hacia la derecha
      const last = slots.pop()
      slots.splice(1, 0, last)
    }

    return rounds
  }

  /**
   * R1: Verificar que no haya enfrentamientos duplicados dentro de la fase.
   * En un Round Robin correcto no debería haber, pero validamos por seguridad.
   */
  _validateNoDuplicates(rounds, warnings) {
    const seen = new Set()
    for (const round of rounds) {
      for (const match of round.matches) {
        // Normalizar: el par siempre se ordena alfabéticamente
        const key = [match.local, match.visitante].sort().join('|')
        if (seen.has(key)) {
          warnings.push(`R1: Enfrentamiento duplicado detectado: ${key}`)
        }
        seen.add(key)
      }
    }
  }

  /**
   * R2 & R6: Cada jornada debe tener el máximo de partidos posibles.
   */
  _validateRoundCompleteness(rounds, teamCount, isOdd, warnings) {
    const expectedPerRound = isOdd ? (teamCount - 1) / 2 : teamCount / 2

    for (let i = 0; i < rounds.length; i++) {
      const actual = rounds[i].matches.length
      if (actual !== expectedPerRound) {
        warnings.push(`R2/R6: Jornada ${i + 1} tiene ${actual} partidos, se esperaban ${expectedPerRound}`)
      }
    }
  }

  /**
   * R3: Optimizar localía para que ningún equipo sea local más de 2 veces consecutivas.
   * 
   * Estrategia: después de generar los cruces, podemos intercambiar local/visitante
   * en un partido sin afectar el emparejamiento. Usamos un enfoque greedy:
   * recorremos las rondas y, para cada partido, verificamos si alguno de los dos
   * equipos ya fue local 2 veces seguidas. Si es así, invertimos.
   */
  _optimizeHomeAway(rounds, teams, teamCount) {
    const realTeams = teams.filter(t => t !== '__BYE__')
    // Track: para cada equipo, las últimas localías ['H','A',...]
    const homeHistory = {}
    realTeams.forEach(t => { homeHistory[t] = [] })

    const optimized = rounds.map((round, roundIdx) => {
      const newMatches = round.matches.map(match => {
        let { local, visitante } = match
        
        const localConsecutiveHome = this._getConsecutiveHomeCount(homeHistory[local])
        const visitanteConsecutiveHome = this._getConsecutiveHomeCount(homeHistory[visitante])

        // Si el local ya tiene 2 seguidas como local, invertir
        if (localConsecutiveHome >= 2) {
          const temp = local
          local = visitante
          visitante = temp
        }
        // Si el visitante ya tiene 2 seguidas como local, mantener (el local no tiene problema)
        // Si ambos tienen 2, preferimos invertir para el equipo con más historial de local
        else if (visitanteConsecutiveHome >= 2) {
          // Mantener como está — el visitante no será local
        }
        // Balanceo adicional: si ambos están bien, preferir al que menos veces fue local
        else {
          const localTotal = homeHistory[local].filter(h => h === 'H').length
          const visitanteTotal = homeHistory[visitante].filter(h => h === 'H').length
          
          // Criterio de balance: si el local tiene significativamente más localías, invertir
          if (localTotal > visitanteTotal + 1) {
            const temp = local
            local = visitante
            visitante = temp
          }
        }

        // Registrar resultado
        homeHistory[local].push('H')
        homeHistory[visitante].push('A')

        return { local, visitante }
      })

      // Registrar bye como 'B' (no cuenta para localía)
      if (round.bye && homeHistory[round.bye]) {
        homeHistory[round.bye].push('B')
      }

      return { matches: newMatches, bye: round.bye }
    })

    return optimized
  }

  /**
   * Cuenta cuántas localías consecutivas tiene un equipo al final de su historial.
   */
  _getConsecutiveHomeCount(history) {
    let count = 0
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i] === 'H') count++
      else break
    }
    return count
  }

  /**
   * R4: Verificar que el descanso (BYE) se distribuya equitativamente.
   * En el circle method, cada equipo descansa exactamente 1 vez, lo cual ya es equitativo.
   * Adicionalmente verificamos que no haya descansos consecutivos.
   */
  _validateByeDistribution(rounds, realTeamIds, warnings) {
    const byeCount = {}
    const byePositions = {} // round index donde cada equipo descansa
    
    realTeamIds.forEach(id => { byeCount[id] = 0; byePositions[id] = [] })

    rounds.forEach((round, idx) => {
      if (round.bye && byeCount[round.bye] !== undefined) {
        byeCount[round.bye]++
        byePositions[round.bye].push(idx)
      }
    })

    // Verificar que todos descansen la misma cantidad (±1)
    const counts = Object.values(byeCount)
    const min = Math.min(...counts)
    const max = Math.max(...counts)
    if (max - min > 1) {
      warnings.push(`R4: Desbalance en descansos: min=${min}, max=${max}`)
    }

    // Verificar que no haya descansos consecutivos
    for (const [teamId, positions] of Object.entries(byePositions)) {
      for (let i = 1; i < positions.length; i++) {
        if (positions[i] - positions[i - 1] === 1) {
          warnings.push(`R4: Equipo ${teamId} descansa en jornadas consecutivas ${positions[i - 1] + 1} y ${positions[i] + 1}`)
        }
      }
    }
  }

  /**
   * R7: Verificar que no hay rivales repetidos en jornadas consecutivas.
   * En un Round Robin con N ≥ 4 equipos esto nunca debería ocurrir naturalmente.
   */
  _validateNoConsecutiveRivals(rounds, warnings) {
    for (let i = 1; i < rounds.length; i++) {
      const prevPairs = new Set()
      for (const m of rounds[i - 1].matches) {
        prevPairs.add([m.local, m.visitante].sort().join('|'))
      }

      for (const m of rounds[i].matches) {
        const key = [m.local, m.visitante].sort().join('|')
        if (prevPairs.has(key)) {
          warnings.push(`R7: ${key} se enfrentan en jornadas consecutivas ${i} y ${i + 1}`)
        }
      }
    }
  }

  /**
   * R5: Genera la segunda vuelta como espejo de la primera con localía invertida.
   * El orden de las jornadas se invierte (espejo).
   */
  _generateSecondLeg(firstLeg) {
    // Espejo: recorrer las jornadas de la primera vuelta en orden inverso
    const reversed = [...firstLeg].reverse()

    return reversed.map(round => ({
      matches: round.matches.map(m => ({
        // Invertir localía
        local: m.visitante,
        visitante: m.local
      })),
      bye: round.bye
    }))
  }

  /**
   * R3 optimization for the second leg: carries home/away history from the first leg
   * to prevent consecutive-home violations at the leg boundary.
   */
  _optimizeSecondLegHomeAway(secondLeg, firstLeg, teams, teamCount) {
    const realTeams = teams.filter(t => t !== '__BYE__')
    
    // Build home history from the first leg
    const homeHistory = {}
    realTeams.forEach(t => { homeHistory[t] = [] })
    
    for (const round of firstLeg) {
      for (const match of round.matches) {
        homeHistory[match.local].push('H')
        homeHistory[match.visitante].push('A')
      }
      if (round.bye && homeHistory[round.bye]) {
        homeHistory[round.bye].push('B')
      }
    }

    // Now apply the same greedy optimization to the second leg
    return secondLeg.map(round => {
      const newMatches = round.matches.map(match => {
        let { local, visitante } = match
        
        const localConsecutiveHome = this._getConsecutiveHomeCount(homeHistory[local])
        const visitanteConsecutiveHome = this._getConsecutiveHomeCount(homeHistory[visitante])

        if (localConsecutiveHome >= 2) {
          const temp = local
          local = visitante
          visitante = temp
        } else if (visitanteConsecutiveHome >= 2) {
          // Keep as is
        } else {
          const localTotal = homeHistory[local].filter(h => h === 'H').length
          const visitanteTotal = homeHistory[visitante].filter(h => h === 'H').length
          if (localTotal > visitanteTotal + 1) {
            const temp = local
            local = visitante
            visitante = temp
          }
        }

        homeHistory[local].push('H')
        homeHistory[visitante].push('A')

        return { local, visitante }
      })

      if (round.bye && homeHistory[round.bye]) {
        homeHistory[round.bye].push('B')
      }

      return { matches: newMatches, bye: round.bye }
    })
  }

  /**
   * Verificación final de R3 sobre el fixture completo (incluyendo segunda vuelta).
   * Retorna la lista de equipos que violan la regla.
   */
  _checkR3Violations(allRounds, realTeams) {
    const violations = []

    for (const team of realTeams) {
      let consecutiveHome = 0
      let maxConsecutive = 0

      for (const round of allRounds) {
        const isHome = round.matches.some(m => m.local === team)
        const isAway = round.matches.some(m => m.visitante === team)
        const isBye = round.bye === team

        if (isHome) {
          consecutiveHome++
          maxConsecutive = Math.max(maxConsecutive, consecutiveHome)
        } else if (isAway || isBye) {
          consecutiveHome = 0
        }
      }

      if (maxConsecutive > 2) {
        violations.push(team)
      }
    }

    return violations
  }
}

export default new FixtureEngine()
