import { useState } from 'react'
import { useCreateLiga } from '../../hooks/useAdmin'
import { useToast } from '../../components/ui/Toast'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import LeagueLimitScreen from '../../features/alerts/components/LeagueLimitScreen'

export default function NewLigaModal({ open, onClose, limitReached, setLimitReached }) {
  const [form, setForm] = useState({ nombre: '', slug: '', tipo_futbol: 'f7', zona: '', monto_inscripcion: 0 })
  const mutation = useCreateLiga()
  const toast = useToast()
  
  const generateSlug = (val) => val.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '')

  async function submit(e) {
    e.preventDefault()
    try {
      await mutation.mutateAsync(form)
      onClose()
      setForm({ nombre: '', slug: '', tipo_futbol: 'f7', zona: '', monto_inscripcion: 0 })
    } catch (err) {
      if (err.code === 'LEAGUE_LIMIT_REACHED') {
        setLimitReached(true)
      } else {
        toast.error(err.message || 'Error al crear liga')
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={limitReached ? "" : "Crear Nueva Liga"} size={limitReached ? "md" : "sm"}>
      {limitReached ? (
        <LeagueLimitScreen onBack={() => setLimitReached(false)} />
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-medium text-text-dim">
            Nombre de la Liga
            <input type="text" required value={form.nombre} 
              onChange={e => setForm({ ...form, nombre: e.target.value, slug: generateSlug(e.target.value) })}
              placeholder="Ej: Cancha Libre Palermo"
              className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all" />
          </label>

          <label className="block text-xs font-medium text-text-dim">
            URL (Slug)
            <div className="flex items-center gap-1 mt-1 group">
              <span className="text-xs text-text-dim group-focus-within:text-primary transition-colors">
                {(import.meta.env.VITE_API_DOM || 'canchalibre.app/').replace(/^https?:\/\//, '').replace(/\/$/, '')}/liga/
              </span>
              <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: generateSlug(e.target.value) })}
                className="flex-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all font-mono" />
            </div>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-text-dim">
              Tipo de Fútbol
              <select value={form.tipo_futbol} onChange={e => setForm({ ...form, tipo_futbol: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all appearance-none">
                <option value="f5">Fútbol 5</option>
                <option value="f6">Fútbol 6</option>
                <option value="f7">Fútbol 7</option>
                <option value="f9">Fútbol 9</option>
                <option value="f11">Fútbol 11</option>
              </select>
            </label>
            <label className="block text-xs font-medium text-text-dim">
              Zona / Ubicación
              <input type="text" value={form.zona} onChange={e => setForm({ ...form, zona: e.target.value })}
                placeholder="Ej: Buenos Aires"
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all" />
            </label>
            <label className="block text-xs font-medium text-text-dim">
              Valor Inscripción ($)
              <input type="number" value={form.monto_inscripcion} onChange={e => setForm({ ...form, monto_inscripcion: e.target.value })}
                placeholder="Ej: 5000"
                className="w-full mt-1 px-3 py-2 bg-bg-input border border-border-default rounded-xl text-sm outline-none focus:border-primary transition-all font-mono" />
            </label>
          </div>

          <Button type="submit" loading={mutation.isPending} className="w-full mt-4">
            Crear mi Liga
          </Button>
        </form>
      )}
    </Modal>
  )
}
