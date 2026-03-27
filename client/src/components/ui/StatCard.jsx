import { motion } from 'motion/react'

export default function StatCard({ icon: Icon, value, label, trend, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-xl p-4 flex items-center gap-4 ${className}`}
    >
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-heading font-bold text-text-primary truncate">{value}</p>
        <p className="text-xs text-text-dim uppercase tracking-wider">{label}</p>
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold ${trend >= 0 ? 'text-primary' : 'text-danger'}`}>
          {trend >= 0 ? '+' : ''}{trend}
        </span>
      )}
    </motion.div>
  )
}
