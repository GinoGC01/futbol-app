import { useState, useEffect } from 'react'
import { useCreateTemporada, useUpdateTemporada, useCreateFase, useUpdateFase, useCreateJornadas } from '../../../hooks/useAdmin'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import { Shield, Clock } from 'lucide-react'

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
]

export function NewTemporadaModal({ open, onClose, ligaId, formatos, defaultTipoFutbol }) {
  const [form, setForm] = useState({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  
  const mutation = useCreateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    let payload = { ...form, liga_id: ligaId }
    if (!payload.formato_tipo && formatos?.length > 0) {
      payload.formato_tipo = formatos[0].tipo
    }
    await mutation.mutateAsync(payload)
    onClose()
    setForm({ nombre: '', formato_tipo: '', fecha_inicio: '', fecha_fin: '' })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Apertura 2025" required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        </label>
        
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Formato de Competencia
            <select value={form.formato_tipo} onChange={set('formato_tipo')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none bg-bg-surface text-text-primary">
              <option value="" disabled>Seleccionar...</option>
              {formatos?.map(f => (
                <option key={f.id} value={f.tipo} className="bg-bg-surface text-text-primary">{f.nombre}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-dim">Modalidad (Fija)</span>
            <div className="mt-1.5 px-3 py-2.5 bg-bg-surface/50 border border-border-subtle rounded-xl text-sm text-text-dim flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Fútbol {defaultTipoFutbol?.replace(/\D/g, '') || '—'}
            </div>
            <p className="text-[10px] text-text-dim mt-1 px-1">Definida por la Liga</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Fecha Fin (Est.)
            <input type="date" value={form.fecha_fin} onChange={set('fecha_fin')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
          </label>
        </div>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Crear Temporada</Button>
      </form>
    </Modal>
  )
}

export function EditTemporadaModal({ open, onClose, temporada }) {
  const [form, setForm] = useState({ 
    nombre: '', fecha_inicio: '', fecha_fin: '', estado: 'borrador'
  })
  
  useEffect(() => {
    if (open && temporada) {
      setForm({
        nombre: temporada.nombre,
        fecha_inicio: temporada.fecha_inicio?.split('T')[0] || '',
        fecha_fin: temporada.fecha_fin?.split('T')[0] || '',
        estado: temporada.estado || 'borrador'
      })
    }
  }, [open, temporada])

  const mutation = useUpdateTemporada()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: temporada.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Temporada">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Nombre de Temporada
          <input type="text" value={form.nombre} onChange={set('nombre')} required
            className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        </label>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Fecha Inicio
            <input type="date" value={form.fecha_inicio} onChange={set('fecha_inicio')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Estado de Temporada
            <select value={form.estado} onChange={set('estado')} required
              className="w-full mt-1.5 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none font-bold bg-bg-surface text-text-primary">
              <option value="borrador" className="bg-bg-surface text-text-primary">Borrador</option>
              <option value="activa" className="bg-bg-surface text-text-primary">Activa / En Curso</option>
              <option value="finalizada" className="bg-bg-surface text-text-primary">Finalizada</option>
            </select>
          </label>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-dim">Modalidad (Fija)</span>
            <div className="mt-1.5 px-3 py-2.5 bg-bg-surface/50 border border-border-subtle rounded-xl text-sm text-text-dim flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Fútbol {temporada.liga?.tipo_futbol?.replace(/\D/g, '') || '—'}
            </div>
          </div>
        </div>
        <p className="text-[10px] text-text-dim italic">* La fecha de finalización puede modificarse en cualquier momento antes de finalizar la temporada.</p>
        <Button type="submit" loading={mutation.isPending} className="w-full mt-2">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

export function NewFaseModal({ open, onClose, temporadaId }) {
  const [form, setForm] = useState({
    nombre: '', tipo: 'todos_contra_todos',
    puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false,
    duracion_tiempo: 20, duracion_entretiempo: 5,
    tiempo_entre_partidos: 15, hora_inicio: '17:00', hora_fin: '22:00',
    canchas_disponibles: 1, dias_juego: [1, 3, 5]
  })
  const mutation = useCreateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleDia(dia) {
    setForm(f => ({
      ...f,
      dias_juego: f.dias_juego.includes(dia)
        ? (f.dias_juego.length > 1 ? f.dias_juego.filter(d => d !== dia) : f.dias_juego)
        : [...f.dias_juego, dia].sort()
    }))
  }

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ temporada_id: temporadaId, ...form })
    onClose()
    setForm({
      nombre: '', tipo: 'todos_contra_todos',
      puntos_victoria: 3, puntos_empate: 1, ida_y_vuelta: false,
      duracion_tiempo: 20, duracion_entretiempo: 5,
      tiempo_entre_partidos: 15, hora_inicio: '17:00', hora_fin: '22:00',
      canchas_disponibles: 1, dias_juego: [1, 3, 5]
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} placeholder="Ej: Fase Regular" required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none bg-bg-surface text-text-primary">
          <option value="todos_contra_todos" className="bg-bg-surface text-text-primary">Todos contra todos</option>
          <option value="eliminacion_directa" className="bg-bg-surface text-text-primary">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary bg-bg-surface text-text-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary bg-bg-surface text-text-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>

        {/* Configuración de horarios */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Configuración de Horarios</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] font-medium text-text-dim">
              Duración tiempo
              <input type="number" value={form.duracion_tiempo} onChange={set('duracion_tiempo')} min={1} max={60}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Entretiempo
              <input type="number" value={form.duracion_entretiempo} onChange={set('duracion_entretiempo')} min={0} max={30}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Entre partidos
              <input type="number" value={form.tiempo_entre_partidos} onChange={set('tiempo_entre_partidos')} min={0} max={60}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] font-medium text-text-dim">
              Hora inicio
              <input type="time" value={form.hora_inicio} onChange={set('hora_inicio')}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Hora fin
              <input type="time" value={form.hora_fin} onChange={set('hora_fin')}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Canchas
              <input type="number" value={form.canchas_disponibles} onChange={set('canchas_disponibles')} min={1} max={20}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
          </div>
          <div>
            <p className="text-[10px] font-medium text-text-dim mb-1.5">Días de juego</p>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_SEMANA.map(dia => {
                const active = form.dias_juego.includes(dia.value)
                return (
                  <button key={dia.value} type="button" onClick={() => toggleDia(dia.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all ${
                      active
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'bg-bg-surface border-border-default text-text-dim hover:border-primary/30'
                    }`}>
                    {dia.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <Button type="submit" loading={mutation.isPending} className="w-full">Crear Fase</Button>
      </form>
    </Modal>
  )
}

export function EditFaseModal({ open, onClose, fase }) {
  const [form, setForm] = useState({
    nombre: fase.nombre,
    tipo: fase.tipo,
    puntos_victoria: fase.puntos_victoria,
    puntos_empate: fase.puntos_empate,
    ida_y_vuelta: fase.ida_y_vuelta,
    duracion_tiempo: fase.duracion_tiempo || 20,
    duracion_entretiempo: fase.duracion_entretiempo || 5,
    tiempo_entre_partidos: fase.tiempo_entre_partidos || 15,
    hora_inicio: fase.hora_inicio || '17:00',
    hora_fin: fase.hora_fin || '22:00',
    canchas_disponibles: fase.canchas_disponibles || 1,
    dias_juego: fase.dias_juego || [1, 3, 5]
  })
  const mutation = useUpdateFase()
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  function toggleDia(dia) {
    setForm(f => ({
      ...f,
      dias_juego: f.dias_juego.includes(dia)
        ? (f.dias_juego.length > 1 ? f.dias_juego.filter(d => d !== dia) : f.dias_juego)
        : [...f.dias_juego, dia].sort()
    }))
  }

  async function submit(e) {
    e.preventDefault()
    await mutation.mutateAsync({ id: fase.id, ...form })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar Fase">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <input type="text" value={form.nombre} onChange={set('nombre')} required
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        <select value={form.tipo} onChange={set('tipo')}
          className="w-full px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all appearance-none bg-bg-surface text-text-primary">
          <option value="todos_contra_todos" className="bg-bg-surface text-text-primary">Todos contra todos</option>
          <option value="eliminacion_directa" className="bg-bg-surface text-text-primary">Eliminación directa</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-medium text-text-dim">
            Pts. Victoria
            <input type="number" value={form.puntos_victoria} onChange={set('puntos_victoria')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary bg-bg-surface text-text-primary" />
          </label>
          <label className="text-xs font-medium text-text-dim">
            Pts. Empate
            <input type="number" value={form.puntos_empate} onChange={set('puntos_empate')} min={0}
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary bg-bg-surface text-text-primary" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-text-dim cursor-pointer">
          <input type="checkbox" checked={form.ida_y_vuelta} onChange={e => setForm(f => ({ ...f, ida_y_vuelta: e.target.checked }))}
            className="rounded border-border-default accent-primary" />
          Ida y vuelta (doble rueda)
        </label>

        {/* Configuración de horarios */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Configuración de Horarios</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] font-medium text-text-dim">
              Duración tiempo
              <input type="number" value={form.duracion_tiempo} onChange={set('duracion_tiempo')} min={1} max={60}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Entretiempo
              <input type="number" value={form.duracion_entretiempo} onChange={set('duracion_entretiempo')} min={0} max={30}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Entre partidos
              <input type="number" value={form.tiempo_entre_partidos} onChange={set('tiempo_entre_partidos')} min={0} max={60}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-[10px] font-medium text-text-dim">
              Hora inicio
              <input type="time" value={form.hora_inicio} onChange={set('hora_inicio')}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Hora fin
              <input type="time" value={form.hora_fin} onChange={set('hora_fin')}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
            <label className="text-[10px] font-medium text-text-dim">
              Canchas
              <input type="number" value={form.canchas_disponibles} onChange={set('canchas_disponibles')} min={1} max={20}
                className="w-full mt-1 px-2 py-1.5 bg-bg-input border border-border-default rounded-lg text-xs outline-none focus:border-primary bg-bg-surface text-text-primary" />
            </label>
          </div>
          <div>
            <p className="text-[10px] font-medium text-text-dim mb-1.5">Días de juego</p>
            <div className="flex flex-wrap gap-1.5">
              {DIAS_SEMANA.map(dia => {
                const active = form.dias_juego.includes(dia.value)
                return (
                  <button key={dia.value} type="button" onClick={() => toggleDia(dia.value)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all ${
                      active
                        ? 'bg-primary/20 border-primary/40 text-primary'
                        : 'bg-bg-surface border-border-default text-text-dim hover:border-primary/30'
                    }`}>
                    {dia.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <Button type="submit" loading={mutation.isPending} className="w-full">Guardar Cambios</Button>
      </form>
    </Modal>
  )
}

export function NewJornadasModal({ open, onClose, faseId }) {
  const [cantidad, setCantidad] = useState(5)
  const [fechaInicio, setFechaInicio] = useState('')
  const mutation = useCreateJornadas()

  async function submit(e) {
    e.preventDefault()
    const payload = { fase_id: faseId, cantidad: Number(cantidad) }
    if (fechaInicio) payload.fecha_tentativa = new Date(fechaInicio).toISOString()
    await mutation.mutateAsync(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Generar Jornadas">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="text-xs font-medium text-text-dim">
          Cantidad de jornadas
          <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} min={1} max={50} required
            className="w-full mt-1 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        </label>
        <label className="text-xs font-medium text-text-dim">
          Fecha de inicio (opcional)
          <input type="datetime-local" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="w-full mt-1 px-3 py-2.5 bg-bg-input border border-border-default rounded-xl text-sm text-text-primary outline-none focus:border-primary transition-all bg-bg-surface" />
        </label>
        <p className="text-xs text-text-dim">Se crearán {cantidad} jornadas automáticamente (1 por semana).</p>
        <Button type="submit" loading={mutation.isPending} className="w-full">Generar</Button>
      </form>
    </Modal>
  )
}
