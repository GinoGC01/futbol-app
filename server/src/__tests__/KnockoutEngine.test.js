/**
 * Test Suite: FixtureEngine.generateKnockout — Eliminación Directa (C-02)
 * 
 * Ejecutar: node server/src/__tests__/KnockoutEngine.test.js
 */

import FixtureEngine from '../services/match/FixtureEngine.js'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const CYAN = '\x1b[36m'
const RESET = '\x1b[0m'
const BOLD = '\x1b[1m'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${label}`)
    passed++
  } else {
    console.log(`  ${RED}✗${RESET} ${label}`)
    failed++
  }
}

function section(name) {
  console.log(`\n${CYAN}${BOLD}━━━ ${name} ━━━${RESET}`)
}

function generateIds(n) {
  return Array.from({ length: n }, (_, i) => `team-${String.fromCharCode(65 + i)}`)
}

// ═══════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════

section('Bracket Size (Potencia de 2)')

{
  const r2 = FixtureEngine.generateKnockout(generateIds(2))
  assert(r2.bracketSize === 2, '2 equipos → bracket de 2')
  assert(r2.byeCount === 0, '2 equipos → 0 BYEs')
}
{
  const r4 = FixtureEngine.generateKnockout(generateIds(4))
  assert(r4.bracketSize === 4, '4 equipos → bracket de 4')
  assert(r4.byeCount === 0, '4 equipos → 0 BYEs')
}
{
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  assert(r8.bracketSize === 8, '8 equipos → bracket de 8')
  assert(r8.byeCount === 0, '8 equipos → 0 BYEs')
}
{
  const r16 = FixtureEngine.generateKnockout(generateIds(16))
  assert(r16.bracketSize === 16, '16 equipos → bracket de 16')
}
{
  const r32 = FixtureEngine.generateKnockout(generateIds(32))
  assert(r32.bracketSize === 32, '32 equipos → bracket de 32')
}

section('BYE Generation (Non power-of-2)')

{
  const r6 = FixtureEngine.generateKnockout(generateIds(6))
  assert(r6.bracketSize === 8, '6 equipos → bracket de 8')
  assert(r6.byeCount === 2, '6 equipos → 2 BYEs')
}
{
  const r10 = FixtureEngine.generateKnockout(generateIds(10))
  assert(r10.bracketSize === 16, '10 equipos → bracket de 16')
  assert(r10.byeCount === 6, '10 equipos → 6 BYEs')
}
{
  const r12 = FixtureEngine.generateKnockout(generateIds(12))
  assert(r12.bracketSize === 16, '12 equipos → bracket de 16')
  assert(r12.byeCount === 4, '12 equipos → 4 BYEs')
}
{
  const r3 = FixtureEngine.generateKnockout(generateIds(3))
  assert(r3.bracketSize === 4, '3 equipos → bracket de 4')
  assert(r3.byeCount === 1, '3 equipos → 1 BYE')
}

section('Round Names')

{
  const r32 = FixtureEngine.generateKnockout(generateIds(32))
  assert(r32.roundNames.join(',') === '16avos,8vos,4tos,Semis,Final', '32 eq → 16avos,8vos,4tos,Semis,Final')
}
{
  const r16 = FixtureEngine.generateKnockout(generateIds(16))
  assert(r16.roundNames.join(',') === '8vos,4tos,Semis,Final', '16 eq → 8vos,4tos,Semis,Final')
}
{
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  assert(r8.roundNames.join(',') === '4tos,Semis,Final', '8 eq → 4tos,Semis,Final')
}
{
  const r4 = FixtureEngine.generateKnockout(generateIds(4))
  assert(r4.roundNames.join(',') === 'Semis,Final', '4 eq → Semis,Final')
}
{
  const r2 = FixtureEngine.generateKnockout(generateIds(2))
  assert(r2.roundNames.join(',') === 'Final', '2 eq → Final')
}

section('Round Count')

{
  assert(FixtureEngine.generateKnockout(generateIds(2)).totalRounds === 1, '2 eq → 1 ronda')
  assert(FixtureEngine.generateKnockout(generateIds(4)).totalRounds === 2, '4 eq → 2 rondas')
  assert(FixtureEngine.generateKnockout(generateIds(8)).totalRounds === 3, '8 eq → 3 rondas')
  assert(FixtureEngine.generateKnockout(generateIds(16)).totalRounds === 4, '16 eq → 4 rondas')
  assert(FixtureEngine.generateKnockout(generateIds(32)).totalRounds === 5, '32 eq → 5 rondas')
  // Non power of 2: same bracket
  assert(FixtureEngine.generateKnockout(generateIds(6)).totalRounds === 3, '6 eq → 3 rondas (bracket 8)')
  assert(FixtureEngine.generateKnockout(generateIds(12)).totalRounds === 4, '12 eq → 4 rondas (bracket 16)')
}

section('R2 — BYEs distribuidos equitativamente')

{
  // 6 teams in bracket of 8 → 2 BYEs, should be on opposite sides
  const r6 = FixtureEngine.generateKnockout(generateIds(6))
  const firstRound = r6.rounds[0]
  const byeMatches = firstRound.matches.filter(m => m.isBye)
  assert(byeMatches.length === 2, '6 eq: 2 BYE matches en primera ronda')
  
  // BYEs should be distributed (not all on same side)
  const byePositions = firstRound.matches.map((m, i) => m.isBye ? i : -1).filter(i => i >= 0)
  const halfSize = firstRound.matches.length / 2
  const topHalf = byePositions.filter(p => p < halfSize).length
  const bottomHalf = byePositions.filter(p => p >= halfSize).length
  assert(topHalf > 0 && bottomHalf > 0, '6 eq: BYEs en ambas mitades del cuadro')
}

section('R3 — Mejores rankeados reciben BYEs')

{
  const teams = generateIds(6) // A is seed 1, B is seed 2, etc.
  const r6 = FixtureEngine.generateKnockout(teams)
  const firstRound = r6.rounds[0]
  const byeWinners = firstRound.matches.filter(m => m.isBye).map(m => m.winner)
  
  // Seeds 1 and 2 (team-A and team-B) should get BYEs
  assert(byeWinners.includes('team-A'), '6 eq: Seed 1 (team-A) recibe BYE')
  assert(byeWinners.includes('team-B'), '6 eq: Seed 2 (team-B) recibe BYE')
}

section('R4 — Ganador avanza (slot references)')

{
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  // Second round should reference first round winners
  const secondRound = r8.rounds[1]
  for (const match of secondRound.matches) {
    assert(match.localSource !== null || match.local !== null, `P${match.matchNumber}: local tiene referencia o equipo`)
    assert(match.visitanteSource !== null || match.visitante !== null, `P${match.matchNumber}: visitante tiene referencia o equipo`)
  }
}

section('R5 — Slots vacíos en rondas futuras')

{
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  // Round 2 (Semis) should have empty slots with source references
  const semis = r8.rounds[1]
  for (const match of semis.matches) {
    assert(match.localSource?.startsWith('Ganador P'), `Semis P${match.matchNumber}: local source es "Ganador P..."`)
    assert(match.visitanteSource?.startsWith('Ganador P'), `Semis P${match.matchNumber}: visitante source es "Ganador P..."`)
  }
  // Final should also have source references
  const final = r8.rounds[2]
  assert(final.matches.length === 1, '8 eq: Final tiene 1 partido')
  assert(final.matches[0].localSource?.startsWith('Ganador P'), 'Final: local source es "Ganador P..."')
}

section('R6 — Cuadro visible desde el inicio')

{
  const r16 = FixtureEngine.generateKnockout(generateIds(16))
  assert(r16.rounds.length === 4, '16 eq: 4 rondas visibles')
  assert(r16.bracket.structure.length === 4, '16 eq: bracket.structure tiene 4 rondas')
  // All rounds have matches
  for (const round of r16.rounds) {
    assert(round.matches.length > 0, `Ronda "${round.roundName}" tiene partidos`)
  }
}

section('R7 — Localía por ranking (mejor seed es local)')

{
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  const firstRound = r8.rounds[0]
  for (const match of firstRound.matches) {
    if (!match.isBye) {
      assert(match.localSeed < match.visitanteSeed, `P${match.matchNumber}: seed ${match.localSeed} (local) < seed ${match.visitanteSeed} (visitante)`)
    }
  }
}

section('R8 — Ida y Vuelta')

{
  const r4 = FixtureEngine.generateKnockout(generateIds(4), { idaYVuelta: true })
  assert(r4.idaYVuelta === true, '4 eq ida/vuelta: flag activado')
  
  const firstRound = r4.rounds[0]
  for (const match of firstRound.matches) {
    if (!match.isBye) {
      assert(match.idaYVuelta === true, `P${match.matchNumber}: tiene ida y vuelta`)
      assert(match.vuelta !== undefined, `P${match.matchNumber}: tiene partido de vuelta`)
      // R8: Mejor rankeado juega vuelta en casa
      assert(match.vuelta.isVuelta === true, `P${match.matchNumber}: vuelta marcada correctamente`)
    }
  }
}

section('Total Matches (sin BYEs)')

{
  // 8 teams: 4 (4tos) + 2 (Semis) + 1 (Final) = 7 matches total
  const r8 = FixtureEngine.generateKnockout(generateIds(8))
  assert(r8.totalMatches === 7, '8 eq: 7 partidos en el cuadro completo')
  
  // 4 teams: 2 (Semis) + 1 (Final) = 3 matches total
  const r4 = FixtureEngine.generateKnockout(generateIds(4))
  assert(r4.totalMatches === 3, '4 eq: 3 partidos en el cuadro completo')
  
  // 2 teams: 1 match
  const r2 = FixtureEngine.generateKnockout(generateIds(2))
  assert(r2.totalMatches === 1, '2 eq: 1 partido (Final directa)')
}

section('Edge Cases')

{
  try {
    FixtureEngine.generateKnockout(['solo-uno'])
    assert(false, 'Debería lanzar error con 1 equipo')
  } catch (e) {
    assert(e.message.includes('al menos 2'), 'Error correcto con 1 equipo')
  }
}
{
  try {
    FixtureEngine.generateKnockout([])
    assert(false, 'Debería lanzar error con 0 equipos')
  } catch (e) {
    assert(true, 'Error correcto con 0 equipos')
  }
}
{
  // 2 equipos → Final directa
  const r2 = FixtureEngine.generateKnockout(generateIds(2))
  assert(r2.totalRounds === 1, '2 eq: 1 ronda (Final)')
  assert(r2.roundNames[0] === 'Final', '2 eq: ronda es "Final"')
  assert(r2.rounds[0].matches.length === 1, '2 eq: 1 partido en la final')
  assert(r2.rounds[0].matches[0].local === 'team-A', '2 eq: team-A es local (seed 1)')
  assert(r2.rounds[0].matches[0].visitante === 'team-B', '2 eq: team-B es visitante (seed 2)')
}

section('calculateKnockoutRounds')

{
  assert(FixtureEngine.calculateKnockoutRounds(2, false) === 1, '2 eq → 1 ronda')
  assert(FixtureEngine.calculateKnockoutRounds(4, false) === 2, '4 eq → 2 rondas')
  assert(FixtureEngine.calculateKnockoutRounds(8, false) === 3, '8 eq → 3 rondas')
  assert(FixtureEngine.calculateKnockoutRounds(16, false) === 4, '16 eq → 4 rondas')
  assert(FixtureEngine.calculateKnockoutRounds(8, true) === 6, '8 eq ida/vuelta → 6 jornadas')
  assert(FixtureEngine.calculateKnockoutRounds(6, false) === 3, '6 eq → 3 rondas (bracket 8)')
}

// ─── Summary ───
console.log(`\n${BOLD}═══════════════════════════════════════${RESET}`)
console.log(`${GREEN}Passed: ${passed}${RESET} | ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`)
console.log(`${BOLD}═══════════════════════════════════════${RESET}\n`)

process.exit(failed > 0 ? 1 : 0)
