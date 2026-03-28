import { motion, AnimatePresence } from 'motion/react'
import { useState, useEffect, createContext, useContext } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

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
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="pointer-events-auto"
            >
              <div className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl min-w-[300px]
                ${t.type === 'success' ? 'bg-primary/10 border-primary/20 text-primary' : 
                  t.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 
                  'bg-white/5 border-white/10 text-text-primary'}
              `}>
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                {t.type === 'info' && <Info className="w-5 h-5 flex-shrink-0" />}
                
                <p className="text-sm font-bold flex-1">{t.message}</p>
                
                <button onClick={() => removeToast(t.id)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 opacity-50" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// Fallback legacy component
export const Toaster = () => null
