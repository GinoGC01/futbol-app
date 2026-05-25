import React from 'react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', isDestructive = false, isLoading = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="space-y-6">
        <p className="text-sm text-text-dim leading-relaxed">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="text-text-dim hover:text-white">
            {cancelText}
          </Button>
          <Button 
            variant={isDestructive ? 'outline' : 'primary'} 
            onClick={onConfirm} 
            loading={isLoading}
            className={isDestructive ? 'text-danger border-danger hover:bg-danger hover:text-bg-deep' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
