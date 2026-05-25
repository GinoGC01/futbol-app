import React from 'react'
import Badge from '../../../../components/ui/Badge'
import Button from '../../../../components/ui/Button'
import { Calendar, ChevronRight, Pencil, Trash2, Zap, Lock as LockIcon } from 'lucide-react'

export default function TemporadaActiveCard({ tree, isVault, onEdit, onDelete, isDeleting, children }) {
  return (
    <div className="bg-bg-surface rounded-[2rem] border border-white/5 p-6 sm:p-10 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl sm:text-4xl font-heading font-black tracking-wide text-text-primary uppercase italic leading-[1.1]">
              {tree.nombre}
            </h2>
            <Badge status={tree.estado} className="h-6" />
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-text-dim">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{tree.fecha_inicio ? new Date(tree.fecha_inicio).toLocaleDateString() : 'SIN INICIO'}</span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span>{tree.fecha_fin ? new Date(tree.fecha_fin).toLocaleDateString() : 'SIN FIN'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          {!isVault && (
            <>
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 sm:flex-none h-12 px-6 font-black uppercase italic tracking-wide">
                <Pencil className="w-4 h-4 mr-2" /> Editar
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete} loading={isDeleting} className="flex-1 sm:flex-none h-12 px-6 font-black uppercase italic tracking-wide text-danger border-danger hover:bg-danger hover:text-bg-deep">
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </>
          )}
          {tree.estado === 'borrador' && (
            <Button variant="primary" size="sm" onClick={onEdit} className="flex-1 sm:flex-none h-12 px-8 bg-primary text-bg-deep font-black uppercase italic tracking-wide shadow-lg shadow-primary/20">
              <Zap className="w-4 h-4 mr-2" /> Abrir Edición
            </Button>
          )}
          {isVault && (
            <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-danger/10 text-danger border border-danger/20 text-xs font-black uppercase italic tracking-wide">
              <LockIcon className="w-4 h-4" /> Bóveda de Datos
            </div>
          )}
        </div>
      </div>

      {/* Phases Section Container */}
      <div className="mt-12 space-y-10">
        {children}
      </div>
    </div>
  )
}
