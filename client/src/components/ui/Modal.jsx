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
            <Dialog.Content asChild aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`
                  fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2
                  w-[calc(100%-2rem)] ${widths[size]}
                  bg-bg-deep border border-white/10 rounded-none p-0 shadow-[0_0_100px_rgba(0,0,0,0.8)]
                  max-h-[85vh] overflow-y-auto
                `}
              >
                <div className="sticky top-0 z-10 bg-bg-deep/90 backdrop-blur-md border-b border-white/5 p-6 flex items-center justify-between">
                  <Dialog.Title className="text-xl font-heading font-black uppercase italic tracking-wide text-white">
                    {title}
                  </Dialog.Title>
                  <Dialog.Close className="w-10 h-10 bg-white/5 flex items-center justify-center text-text-dim hover:text-danger transition-all skew-x-[-12deg] group">
                    <X className="w-5 h-5 skew-x-[12deg] group-hover:scale-110" />
                  </Dialog.Close>
                </div>
                <div className="p-8">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
