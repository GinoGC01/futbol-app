import { useState } from 'react'
import { useAdminLiga, useEquipos, useCreateEquipo, useUpdateEquipo, useDeleteEquipo } from '../../../hooks/useAdmin'
import Loader from '../../../components/ui/Loader'
import ImageUploader from '../../../components/ui/ImageUploader'
import { Pencil, Trash2, X } from 'lucide-react'

export default function GestionEquipos() {
  const [nombre, setNombre] = useState('')
  const [escudoUrl, setEscudoUrl] = useState(null)
  const [errorImg, setErrorImg] = useState(null)
  const [editingId, setEditingId] = useState(null)
  
  const { data: adminLiga } = useAdminLiga()
  const ligaId = adminLiga?.liga_id

  const { data: equipos = [], isLoading } = useEquipos(ligaId)
  const crearEquipo = useCreateEquipo()
  const actualizarEquipo = useUpdateEquipo()
  const eliminarEquipo = useDeleteEquipo()

  const handleEdit = (eq) => {
    setEditingId(eq.id)
    setNombre(eq.nombre)
    setEscudoUrl(eq.escudo_url)
    setErrorImg(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setNombre('')
    setEscudoUrl(null)
    setErrorImg(null)
  }

  const handleDelete = (id, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar el equipo "${nombre}"? Esta acción no se puede deshacer y eliminará su escudo.`)) {
      eliminarEquipo.mutate(id)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const n = nombre.trim()
    if (!n) return
    
    if (editingId) {
      actualizarEquipo.mutate({
        id: editingId,
        nombre: n,
        escudo_url: escudoUrl || null
      }, { 
        onSuccess: handleCancelEdit
      })
    } else {
      crearEquipo.mutate({
        nombre: n,
        liga_id: ligaId,
        escudo_url: escudoUrl || null
      }, { 
        onSuccess: handleCancelEdit
      })
    }
  }

  const isPending = crearEquipo.isPending || actualizarEquipo.isPending

  return (
    <div className="gestion-section" data-testid="gestion-equipos">
      <div className="flex justify-between items-center mb-6">
        <h2>Equipos</h2>
      </div>

      <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row items-center gap-4 bg-bg-surface p-4 rounded-2xl mb-6 border-2 transition-colors ${editingId ? 'border-primary' : 'border-transparent'}`} data-testid="form-equipo">
        <ImageUploader 
          onUploadSuccess={(url) => {
            setEscudoUrl(url)
            setErrorImg(null)
          }}
          onError={setErrorImg}
          bucket="STAGING_ASSETS"
          path={`equipos/${ligaId || 'general'}`}
          defaultImage={escudoUrl}
          key={editingId || 'new'} // Forzar re-render para limpiar el preview
        />
        
        <div className="flex-1 w-full flex flex-col gap-2">
          {editingId && <span className="text-xs text-primary font-semibold">Editando equipo...</span>}
          <div className="flex w-full gap-2">
            <input
              type="text"
              placeholder="Nombre del equipo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              minLength={2}
              maxLength={80}
              required
              className="flex-1 px-4 py-2 bg-bg-input border border-border-default rounded-xl outline-none focus:border-primary transition-all"
              data-testid="input-equipo"
            />
            <button 
              type="submit" 
              disabled={isPending}
              className="px-6 py-2 bg-primary text-bg-base font-semibold rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {isPending ? 'Guardando...' : (editingId ? 'Guardar Cambios' : '+ Agregar')}
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="px-3 py-2 bg-bg-input text-text-dim rounded-xl hover:text-text-base transition-colors"
                title="Cancelar edición"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {errorImg && <p className="text-red-500 text-xs">{errorImg}</p>}
        </div>
      </form>

      {crearEquipo.isError && <p role="alert" className="error-msg mb-4">{crearEquipo.error.message}</p>}
      {actualizarEquipo.isError && <p role="alert" className="error-msg mb-4">{actualizarEquipo.error.message}</p>}
      {eliminarEquipo.isError && <p role="alert" className="error-msg mb-4">{eliminarEquipo.error.message}</p>}

      {isLoading ? (
        <Loader className="py-10" />
      ) : (
        <ul className="items-list" data-testid="lista-equipos">
          {equipos.map(eq => (
            <li key={eq.id} className="item-row flex items-center gap-3 p-3 bg-bg-surface rounded-xl mb-2 group">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden" 
                style={{ backgroundColor: eq.color_principal || '#2a3a4a' }}
              >
                {eq.escudo_url
                  ? <img src={eq.escudo_url} alt={eq.nombre} className="w-full h-full object-contain" />
                  : <span className="text-white font-semibold">{eq.nombre[0]}</span>
                }
              </div>
              <span className="font-medium text-text-base flex-1">{eq.nombre}</span>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(eq)}
                  className="p-2 text-text-dim hover:text-primary transition-colors rounded-lg bg-bg-input"
                  title="Editar equipo"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(eq.id, eq.nombre)}
                  className="p-2 text-text-dim hover:text-red-500 transition-colors rounded-lg bg-bg-input"
                  title="Eliminar equipo"
                  disabled={eliminarEquipo.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
          {equipos.length === 0 && (
            <li className="text-text-dim text-center py-6">No hay equipos. Agregá el primero.</li>
          )}
        </ul>
      )}
    </div>
  )
}
