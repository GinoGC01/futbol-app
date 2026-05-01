import { useState, useEffect } from 'react'
import { useLigaActiva } from '../../context/LigaContext'
import { useUpdateLiga, useDeleteLiga } from '../../hooks/useAdmin'
import { useToast } from '../../components/ui/Toast'
import Button from '../../components/ui/Button'
import GlassCard from '../../components/ui/GlassCard'
import { Settings, Trash2, AlertTriangle, Save, Image as ImageIcon, MapPin, Trophy, DollarSign } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import Loader from '../../components/ui/Loader'

export default function LeagueSettings() {
  const { liga, isLoading } = useLigaActiva()
  const navigate = useNavigate()
  const toast = useToast()
  const updateMutation = useUpdateLiga()
  const deleteMutation = useDeleteLiga()

  const [form, setForm] = useState({
    nombre: '',
    zona: '',
    descripcion: '',
    logo_url: '',
    monto_inscripcion: 0
  })

  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (liga) {
      setForm({
        nombre: liga.nombre || '',
        zona: liga.zona || '',
        descripcion: liga.descripcion || '',
        logo_url: liga.logo_url || '',
        monto_inscripcion: liga.monto_inscripcion || 0
      })
      // Resetear confirmación de borrado al cambiar de liga
      setDeleteConfirm('')
      setIsDeleting(false)
    }
  }, [liga?.id]) // Usar liga.id como dependencia

  if (isLoading) {
    return <Loader text="Cargando configuración de la liga..." className="py-20" />
  }

  if (!liga) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-warning/10 rounded-3xl flex items-center justify-center mb-6 border border-warning/20">
          <AlertTriangle className="w-10 h-10 text-warning" />
        </div>
        <h2 className="text-2xl font-heading font-bold mb-2">No hay ninguna liga seleccionada</h2>
        <p className="text-text-dim max-w-sm">Por favor, selecciona una liga desde el selector superior para ver su configuración.</p>
      </div>
    )
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({ id: liga.id, ...form })
      toast.success('Configuración de la liga actualizada con éxito')
    } catch (err) {
      toast.error('Error al actualizar la liga')
    }
  }

  const handleDelete = async () => {
    console.log(deleteConfirm.trim(), liga.nombre.trim())
    if (deleteConfirm.trim() !== liga.nombre.trim()) return

    try {
      setIsDeleting(true)
      await deleteMutation.mutateAsync(liga.id)
      toast.success('Liga eliminada permanentemente')
      navigate('/admin')
    } catch (err) {
      toast.error('Error al eliminar la liga')
      setIsDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">
          <Settings className="w-3 h-3" /> Configuración Global
        </div>
        <h1 className="text-3xl sm:text-4xl font-heading font-black tracking-normal leading-none">
          Ajustes de la <span className="text-primary italic">Liga</span>
        </h1>
        <p className="text-base text-text-dim">Modifica los parámetros fundamentales de <span className="text-text-primary font-bold">{liga.nombre}</span>.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="md:col-span-2 space-y-6">
          <GlassCard className="!p-8 border border-white/5">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-5">
                <label className="block">
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2 block">Nombre de la Liga</span>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors">
                      <Trophy className="w-full h-full" />
                    </div>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-2xl text-sm focus:border-primary transition-all outline-none font-bold shadow-sm"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="block">
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2 block">Zona / Ubicación</span>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors">
                        <MapPin className="w-full h-full" />
                      </div>
                      <input
                        type="text"
                        value={form.zona}
                        onChange={e => setForm({ ...form, zona: e.target.value })}
                        className="w-full pl-12 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-2xl text-sm focus:border-primary transition-all outline-none shadow-sm"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2 block">Inscripción ($)</span>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors">
                        <DollarSign className="w-full h-full" />
                      </div>
                      <input
                        type="number"
                        value={form.monto_inscripcion}
                        onChange={e => setForm({ ...form, monto_inscripcion: Number(e.target.value) })}
                        className="w-full pl-12 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-2xl text-sm focus:border-primary transition-all outline-none font-mono shadow-sm"
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2 block">URL del Logo</span>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim group-focus-within:text-primary transition-colors">
                      <ImageIcon className="w-full h-full" />
                    </div>
                    <input
                      type="url"
                      value={form.logo_url}
                      onChange={e => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full pl-12 pr-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-2xl text-sm focus:border-primary transition-all outline-none shadow-sm"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-2 block">Descripción</span>
                  <textarea
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                    rows={4}
                    placeholder="Describe las reglas o información general de tu liga..."
                    className="w-full px-4 py-3.5 bg-bg-elevated border border-border-subtle rounded-2xl text-sm focus:border-primary transition-all outline-none resize-none shadow-sm leading-relaxed"
                  />
                </label>
              </div>

              <div className="pt-6 border-t border-border-subtle flex justify-end">
                <Button
                  type="submit"
                  loading={updateMutation.isPending}
                  className="px-8 h-12 bg-primary text-secondary font-black uppercase italic tracking-wide shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4 mr-2" /> Guardar Cambios
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <GlassCard className="bg-bg-surface/50 border-border-subtle !p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-text-dim">
              Detalles Base
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-bg-deep rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-text-dim">URL</span>
                  <span className="text-xs font-bold text-text-primary">/{liga.slug}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase text-text-dim">Modalidad</span>
                  <span className="text-xs font-bold text-text-primary">{liga.tipo_futbol.toUpperCase()}</span>
                </div>
              </div>
              <p className="text-[10px] text-text-dim italic text-center">Estos valores no pueden ser editados.</p>
            </div>
          </GlassCard>

          <div className="p-6 rounded-[2rem] border border-border-subtle bg-bg-surface flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-bg-deep border border-border-subtle overflow-hidden flex items-center justify-center">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo Preview" className="w-full h-full object-contain p-2" />
              ) : (
                <Trophy className="w-8 h-8 text-text-dim opacity-20" />
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-text-primary">{form.nombre || 'Nombre de Liga'}</p>
              <p className="text-[10px] font-bold text-text-dim uppercase tracking-wider">{form.zona || 'Ubicación no definida'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pt-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px bg-danger/20 flex-1" />
          <h2 className="text-xs font-black text-danger uppercase tracking-[0.4em] px-4">Danger Zone</h2>
          <div className="h-px bg-danger/20 flex-1" />
        </div>

        <GlassCard className="border-danger/30 bg-danger/5 !p-8 sm:!p-10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-danger/10 blur-[100px] pointer-events-none -mr-32 -mt-32 transition-all duration-700 group-hover:bg-danger/20" />

          <div className="flex flex-col lg:flex-row gap-10 items-start relative z-10">
            <div className="flex-1 space-y-4">
              <div className="w-14 h-14 bg-danger/10 rounded-2xl flex items-center justify-center border border-danger/20">
                <Trash2 className="w-7 h-7 text-danger" />
              </div>
              <h3 className="text-xl font-heading font-black text-text-primary tracking-normal">Borrar Liga Permanentemente</h3>
              <div className="space-y-3 text-sm text-text-dim leading-relaxed max-w-xl">
                <p>Esta operación es <span className="text-danger font-bold italic">final e irreversible</span>.</p>
                <p>Se ejecutará un borrado en cascada que eliminará:</p>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-bold uppercase tracking-wide list-disc list-inside text-danger/70">
                  <li>Todas las Temporadas</li>
                  <li>Todos los Equipos</li>
                  <li>Todo el Fixture</li>
                  <li>Todos los Goles</li>
                  <li>Todos los Premios</li>
                  <li>Todas las Alertas</li>
                </ul>
              </div>
            </div>

            <div className="w-full lg:w-[360px] space-y-6 bg-bg-surface/40 p-6 rounded-3xl border border-danger/10 backdrop-blur-sm">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-text-dim tracking-widest block">
                  <span className='uppercase'>Confirma escribiendo:</span>  <span className="text-text-primary select-none">"{liga.nombre}"</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Nombre de la liga"
                  className="w-full px-5 py-4 bg-bg-deep border border-danger/20 rounded-2xl text-sm focus:border-danger transition-all outline-none font-bold placeholder:text-danger/20 text-danger"
                />
              </div>

              <Button
                onClick={handleDelete}
                disabled={deleteConfirm.trim() !== liga.nombre.trim() || isDeleting}
                loading={isDeleting}
                className="w-full h-14 bg-danger hover:bg-danger/80 text-white font-black uppercase italic tracking-wide shadow-xl shadow-danger/20 disabled:opacity-30 disabled:grayscale transition-all hover:scale-[1.02] active:scale-95"
              >
                <Trash2 className="w-5 h-5 mr-2" /> Destruir Todo
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
