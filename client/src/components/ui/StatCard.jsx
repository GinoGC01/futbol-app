import { motion } from 'motion/react'

export default function StatCard({ icon: Icon, value, label, trend, className = '', isAlert }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden border-none p-5 sm:p-6 ring-1 transition-all group ${
        isAlert 
          ? 'ring-danger/30 bg-danger/5' 
          : 'ring-white/5 hover:ring-primary/30 bg-bg-surface'
      } rounded-[1.5rem] ${className}`}
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/[0.03] to-transparent rounded-bl-[80px]" />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4 flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim flex items-center gap-2">
            <span className="w-1 h-3 bg-primary/50 skew-x-[-15deg]" />
            {label}
          </p>
          <div className="space-y-1 pt-1">
            <h3 className={`text-2xl sm:text-3xl font-heading font-black tracking-tighter uppercase italic leading-[1.1] truncate ${
              isAlert ? 'text-danger' : 'text-text-primary'
            }`}>
              {value}
            </h3>
            {trend !== undefined && (
              <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest ${
                trend >= 0 ? 'text-primary' : 'text-danger'
              }`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% CRECIMIENTO
              </span>
            )}
          </div>
        </div>
        
        {Icon && (
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shrink-0 ${
            isAlert ? 'bg-danger/10 border-danger/20' : 'bg-white/5 border-white/10'
          }`}>
            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isAlert ? 'text-danger' : 'text-primary'}`} />
          </div>
        )}
      </div>

      {/* Background Watermark */}
      {Icon && (
        <Icon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.02] group-hover:opacity-[0.04] transition-all duration-700 pointer-events-none group-hover:scale-125" />
      )}
    </motion.div>
  )
}
