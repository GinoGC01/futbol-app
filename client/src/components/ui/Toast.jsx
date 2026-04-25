import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => removeToast(id), 4000)
  }

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {toasts.map((t) => (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                className="pointer-events-auto"
              >
                <div className={`
                  flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-xl min-w-[280px] max-w-[400px]
                  ${t.type === 'success' ? 'bg-zinc-900/95 border-emerald-500/20' : 
                    t.type === 'error' ? 'bg-zinc-900/95 border-red-500/20' : 
                    'bg-zinc-900/95 border-zinc-800/50'}
                `}>
                  {t.type === 'success' && <CheckCircle2 className="w-[18px] h-[18px] flex-shrink-0 text-emerald-400" />}
                  {t.type === 'error' && <AlertCircle className="w-[18px] h-[18px] flex-shrink-0 text-red-400" />}
                  {t.type === 'info' && <Info className="w-[18px] h-[18px] flex-shrink-0 text-blue-400" />}
                  
                  <p className="text-[13px] font-medium flex-1 text-zinc-100 tracking-wide">{t.message}</p>
                  
                  <button onClick={() => removeToast(t.id)} className="p-1 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-white/10">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

// Fallback legacy component
export const Toaster = () => null
