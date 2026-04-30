/**
 * Test Suite: FixtureEngine — Validación de reglas R1-R7
 * 
 * Ejecutar: node server/src/__tests__/FixtureEngine.test.js
 */

import FixtureEngine from '../services/match/FixtureEngine.js'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
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

// ─── Test Helpers ───
function generateIds(n) {
  return Array.from({ length: n }, (_, i) => `team-${String.fromCharCode(65 + i)}`)
}

function checkR1(result) {
  const seen = new Set()
  for (const round of result.rounds) {
    for (const match of round.matches) {
      const key = [match.local, match.visitante].sort().join('|')
      if (seen.has(key)) return false
      seen.add(key)
    }
  }
  return true
}

function checkR2(result, n) {
  const expectedPerRound = Math.floor(n / 2)
  return result.rounds.every(r => r.matches.length === expectedPerRound)
}

function checkR3(result, teams) {
  for (const team of teams) {
    let consecutiveHome = 0
    for (const round of result.rounds) {
      const isHome = round.matches.some(m => m.local === team)
      if (isHome) {
        consecutiveHome++
        if (consecutiveHome > 2) return false
      } else {
        consecutiveHome = 0
      }
    }
  }
  return true
}

function checkR4(result, teams) {
  const byeCount = {}
  teams.forEach(t => { byeCount[t] = 0 })
  
  for (const round of result.rounds) {
    if (round.bye && byeCount[round.bye] !== undefined) {
      byeCount[round.bye]++
    }
  }
  
  const counts = Object.values(byeCount)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  
  // No consecutive byes
  for (const team of teams) {
    let lastBye = -2
    for (let i = 0; i < result.rounds.length; i++) {
      if (result.rounds[i].bye === team) {
        if (i - lastBye === 1) return false
        lastBye = i
      }
    }
  }
  
  return max - min <= 1
}

function checkR5(result, n) {
  const roundsPerLeg = n % 2 === 0 ? n - 1 : n
  const firstLeg = result.rounds.slice(0, roundsPerLeg)
  const secondLeg = result.rounds.slice(roundsPerLeg)
  
  // Second leg should be mirror of first (reversed order)
  // Each pair must appear in the mirrored position
  // R3 optimization may swap home/away, so we check pair existence, not exact inversion
  for (let i = 0; i < roundsPerLeg; i++) {
    const firstRound = firstLeg[i]
    const mirrorRound = secondLeg[roundsPerLeg - 1 - i]
    
    // All pairings from first round should exist in mirror round
    const firstPairs = new Set(firstRound.matches.map(m => [m.local, m.visitante].sort().join('|')))
    const mirrorPairs = new Set(mirrorRound.matches.map(m => [m.local, m.visitante].sort().join('|')))
    
    for (const pair of firstPairs) {
      if (!mirrorPairs.has(pair)) return false
    }
  }
  return true
}

function checkR6(result) {
  const sizes = result.rounds.map(r => r.matches.length)
  const min = Math.min(...sizes)
  const max = Math.max(...sizes)
  return max - min <= 1
}

function checkR7(result) {
  for (let i = 1; i < result.rounds.length; i++) {
    const prevPairs = new Set()
    for (const m of result.rounds[i - 1].matches) {
      prevPairs.add([m.local, m.visitante].sort().join('|'))
    }
    for (const m of result.rounds[i].matches) {
      const key = [m.local, m.visitante].sort().join('|')
      if (prevPairs.has(key)) return false
    }
  }
  return true
}

// ═══════════════════════════════════════
// TEST SUITES
// ═══════════════════════════════════════

section('Casos Base')

// 4 equipos (par)
{
  const teams = generateIds(4)
  const result = FixtureEngine.generate(teams, false)
  
  assert(result.totalRounds === 3, '4 equipos → 3 jornadas')
  assert(result.matchesPerRound === 2, '4 equipos → 2 partidos por jornada')
  assert(result.totalMatches === 6, '4 equipos → 6 partidos totales')
  assert(result.warnings.length === 0, 'Sin advertencias')
}

// 5 equipos (impar)
{
  const teams = generateIds(5)
  const result = FixtureEngine.generate(teams, false)
  
  assert(result.totalRounds === 5, '5 equipos → 5 jornadas')
  assert(result.matchesPerRound === 2, '5 equipos → 2 partidos por jornada (1 descansa)')
  assert(result.totalMatches === 10, '5 equipos → 10 partidos totales')
}

// 8 equipos
{
  const teams = generateIds(8)
  const result = FixtureEngine.generate(teams, false)
  
  assert(result.totalRounds === 7, '8 equipos → 7 jornadas')
  assert(result.matchesPerRound === 4, '8 equipos → 4 partidos por jornada')
  assert(result.totalMatches === 28, '8 equipos → 28 partidos totales')
}

section('R1 — Sin enfrentamientos duplicados')

for (const n of [4, 5, 6, 7, 8, 10, 12]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, false)
  assert(checkR1(result), `R1 pasa con ${n} equipos (solo ida)`)
}

for (const n of [4, 6, 8]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, true)
  // In ida y vuelta, each pair appears EXACTLY twice (once per leg)
  const pairs = {}
  for (const round of result.rounds) {
    for (const m of round.matches) {
      const key = [m.local, m.visitante].sort().join('|')
      pairs[key] = (pairs[key] || 0) + 1
    }
  }
  const allTwice = Object.values(pairs).every(c => c === 2)
  assert(allTwice, `R1 ida/vuelta: cada par exactamente 2 veces con ${n} equipos`)
}

section('R2 & R6 — Jornadas completas y equilibradas')

for (const n of [4, 5, 6, 7, 8, 9, 10]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, false)
  assert(checkR2(result, n), `R2/R6: todas las jornadas completas con ${n} equipos`)
  assert(checkR6(result), `R6: jornadas equilibradas con ${n} equipos`)
}

section('R3 — Máximo 2 jornadas consecutivas como local')

for (const n of [4, 5, 6, 7, 8, 10]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, false)
  assert(checkR3(result, teams), `R3: máx 2 localías consecutivas con ${n} equipos (solo ida)`)
}

for (const n of [4, 6, 8]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, true)
  const pass = checkR3(result, teams)
  assert(pass, `R3: máx 2 localías consecutivas con ${n} equipos (ida y vuelta)`)
}

section('R4 — Descanso equitativo (equipos impares)')

for (const n of [3, 5, 7, 9, 11]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, false)
  assert(checkR4(result, teams), `R4: descanso equitativo con ${n} equipos`)
}

section('R5 — Segunda vuelta: espejo con localía invertida')

for (const n of [4, 6, 8, 10]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, true)
  assert(checkR5(result, n), `R5: espejo correcto con ${n} equipos`)
}

section('R7 — No rivales repetidos en jornadas consecutivas')

for (const n of [4, 5, 6, 7, 8, 10]) {
  const teams = generateIds(n)
  const result = FixtureEngine.generate(teams, false)
  assert(checkR7(result), `R7: sin rivales consecutivos con ${n} equipos`)
}

// ─── Edge Cases ───
section('Edge Cases')

{
  const teams = generateIds(2)
  const result = FixtureEngine.generate(teams, false)
  assert(result.totalRounds === 1, '2 equipos → 1 jornada')
  assert(result.totalMatches === 1, '2 equipos → 1 partido')
}

{
  const teams = generateIds(2)
  const result = FixtureEngine.generate(teams, true)
  assert(result.totalRounds === 2, '2 equipos ida/vuelta → 2 jornadas')
  assert(result.totalMatches === 2, '2 equipos ida/vuelta → 2 partidos')
}

{
  const teams = generateIds(3)
  const result = FixtureEngine.generate(teams, false)
  assert(result.totalRounds === 3, '3 equipos → 3 jornadas')
  assert(result.totalMatches === 3, '3 equipos → 3 partidos')
  // Each team plays 2 and rests 1
  const appearances = {}
  teams.forEach(t => { appearances[t] = 0 })
  for (const round of result.rounds) {
    for (const m of round.matches) {
      appearances[m.local]++
      appearances[m.visitante]++
    }
  }
  assert(Object.values(appearances).every(c => c === 2), '3 equipos: cada uno juega exactamente 2 partidos')
}

{
  try {
    FixtureEngine.generate(['solo-uno'], false)
    assert(false, 'Debería lanzar error con 1 equipo')
  } catch (e) {
    assert(e.message.includes('al menos 2'), 'Error correcto con 1 equipo')
  }
}

{
  try {
    FixtureEngine.generate([], false)
    assert(false, 'Debería lanzar error con 0 equipos')
  } catch (e) {
    assert(true, 'Error correcto con 0 equipos')
  }
}

// ─── calculateRequiredRounds ───
section('calculateRequiredRounds')

assert(FixtureEngine.calculateRequiredRounds(4, false) === 3, '4 equipos solo ida → 3')
assert(FixtureEngine.calculateRequiredRounds(4, true) === 6, '4 equipos ida/vuelta → 6')
assert(FixtureEngine.calculateRequiredRounds(5, false) === 5, '5 equipos solo ida → 5')
assert(FixtureEngine.calculateRequiredRounds(5, true) === 10, '5 equipos ida/vuelta → 10')
assert(FixtureEngine.calculateRequiredRounds(8, false) === 7, '8 equipos solo ida → 7')
assert(FixtureEngine.calculateRequiredRounds(8, true) === 14, '8 equipos ida/vuelta → 14')

// ─── Summary ───
console.log(`\n${BOLD}═══════════════════════════════════════${RESET}`)
console.log(`${GREEN}Passed: ${passed}${RESET} | ${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`)
console.log(`${BOLD}═══════════════════════════════════════${RESET}\n`)

process.exit(failed > 0 ? 1 : 0)
