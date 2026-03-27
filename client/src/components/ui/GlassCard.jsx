import { motion } from 'motion/react'

export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        glass rounded-xl p-5
        ${hover ? 'transition-all duration-300 hover:border-border-accent hover:shadow-glow-primary hover:-translate-y-0.5' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}
