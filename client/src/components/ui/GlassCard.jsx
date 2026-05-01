import { motion } from 'motion/react'

export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-gradient-to-br from-bg-surface to-bg-deep
        border border-border-default rounded-none
        relative overflow-hidden
        p-6
        before:absolute before:top-0 before:left-0 before:w-1 before:h-full before:bg-primary/50
        ${hover ? 'transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(206,222,11,0.1)] hover:-translate-y-1' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
