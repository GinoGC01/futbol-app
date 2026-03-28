import { useState } from 'react'
import { useLigas, useEquipos, useCreateEquipo } from '../../hooks/useAdmin'
import { adminService } from '../../services/adminService'
import GlassCard from '../../components/ui/GlassCard'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import EmptyState from '../../components/ui/EmptyState'
import { Users, Plus, Search, UserPlus, Shield, ExternalLink, Settings } from 'lucide-react'
import TeamDetailView from './TeamDetailView'

export default function RosterManager() {
  const { data: ligas } = useLigas()
  const liga = ligas?.[0]
  const { data: equipos, isLoading } = useEquipos(liga?.id)
  const [showNewEquipo, setShowNewEquipo] = useState(false)
  const [showSearchPlayer, setShowSearchPlayer] = useState(false)
  const [selectedEquipo, setSelectedEquipo] = useState(null)

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Roster Manager</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSearchPlayer(true)}>
            <Search className="w-4 h-4" /> Buscar Jugador
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewEquipo(true)}>
            <Plus className="w-4 h-4" /> Nuevo Equipo
          </Button>
        </div>
      </div>

      {selectedEquipo ? (
        <TeamDetailView 
          equipo={selectedEquipo} 
          onBack={() => setSelectedEquipo(null)} 
          ligaId={liga?.id} 
        />
      ) : equipos?.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipos.map(eq => (
            <GlassCard key={eq.id} className="group hover:border-primary/50 cursor-pointer transition-all" onClick={() => setSelectedEquipo(eq)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: eq.color_principal ? `${eq.color_principal}20` : 'rgba(0,237,100,0.1)' }}>
                    <Shield className="w-5 h-5" style={{ color: eq.color_principal || 'var(--color-primary)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold truncate">{eq.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 rounded-full h-2" style={{ backgroundColor: eq.color_principal || 'var(--color-primary)' }} />
                      <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Ver Plantel</span>
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="Sin equipos" description="Empezá agregando equipos a tu liga."
          action={<Button size="sm" onClick={() => setShowNewEquipo(true)}>Agregar Equipo</Button>} />
      )}

      <NewEquipoModal open={showNewEquipo} onClose={() => setShowNewEquipo(false)} ligaId={liga?.id} />
      <SearchPlayerModal open={showSearchPlayer} onClose={() => setShowSearchPlayer(false)} />
    </div>
  )
}

function NewEquipoModal({ open, onClose, ligaId }) {
  const [form, setForm] = useState({ nombre: '', color_principal: '#00ED64' })
  const mutation = useCreateEquipo()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ liga_id: ligaId, ...form })
    onClose()
    setForm({ nombre: '', color_principal: '#00ED64' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Equipo">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Nombre del equipo" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <label className="text-xs font-medium text-text-dim">
          Color principal
          <input type="color" value={form.color_principal} onChange={set('color_principal')}
            className="w-full h-10 mt-1.5 rounded-lg cursor-pointer border border-border-default bg-bg-input" />
        </label>
        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Equipo</Button>
      </form>
    </Modal>
  )
}

function SearchPlayerModal({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  async function search() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const data = await adminService.searchJugadores(query)
      setResults(data || [])
    } catch { setResults([]) }
    setSearching(false)
  }

  return (
    <Modal open={open} onClose={onClose} title="Buscar Jugador (Global)">
      <div className="flex gap-2 mb-4">
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()} placeholder="Nombre o apellido..."
          className="flex-1 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all" />
        <Button size="sm" onClick={search} loading={searching}>Buscar</Button>
      </div>
      {results.length > 0 ? (
        <ul className="space-y-2 max-h-60 overflow-y-auto">
          {results.map(j => (
            <li key={j.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-deep/50">
              <UserPlus className="w-4 h-4 text-text-dim shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{j.nombre} {j.apellido}</p>
                {j.fecha_nacimiento && <p className="text-[11px] text-text-dim">{j.fecha_nacimiento}</p>}
              </div>
              <Badge status="activa" label="Existente" />
            </li>
          ))}
        </ul>
      ) : query && !searching ? (
        <p className="text-sm text-text-dim text-center py-4">Sin resultados. Podés crear un jugador nuevo.</p>
      ) : null}
    </Modal>
  )
}
