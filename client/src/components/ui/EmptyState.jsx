export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-bg-surface/30 border border-dashed border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] pointer-events-none" />
      {Icon && (
        <div className="w-20 h-20 bg-bg-deep flex items-center justify-center mb-6 skew-x-[-15deg] border border-white/5 relative group">
          <div className="skew-x-[15deg]">
            <Icon className="w-10 h-10 text-text-dim/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      )}
      <h3 className="text-xl font-heading font-black text-text-primary mb-2 uppercase italic tracking-wide">{title}</h3>
      {description && <p className="text-xs text-text-dim max-w-xs font-bold uppercase tracking-widest">{description}</p>}
      {action && <div className="mt-8 relative z-10">{action}</div>}
    </div>
  )
}
