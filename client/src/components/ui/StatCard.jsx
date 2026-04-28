import { motion } from 'motion/react'

export default function StatCard({ icon: Icon, value, label, trend, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative overflow-hidden glass-ultrathin rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 transition-all hover:border-primary/30 ${className}`}
    >
      {/* Decorative Glow */}
      <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 blur-2xl rounded-full pointer-events-none" />
      
      {Icon && (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-dim font-bold uppercase tracking-widest mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl sm:text-2xl font-heading font-extrabold text-text-primary leading-tight break-words">
            {value}
          </h3>
          {trend !== undefined && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trend >= 0 ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
