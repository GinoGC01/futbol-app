import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                  w-[calc(100%-2rem)] ${widths[size]}
                  glass-heavy rounded-2xl p-6 shadow-lg
                  max-h-[85vh] overflow-y-auto
                `}
              >
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-heading font-semibold">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-dim hover:text-text-primary transition-colors">
                    <X className="w-4 h-4" />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
