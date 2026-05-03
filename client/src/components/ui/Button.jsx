const variants = {
  primary:   'bg-primary text-text-on-primary hover:bg-primary-dim shadow-[0_0_15px_rgba(206,222,11,0.2)]',
  secondary: 'bg-secondary text-white hover:bg-secondary-dim shadow-[0_0_15px_rgba(131,153,14,0.2)]',
  danger:    'bg-danger text-white hover:opacity-90',
  ghost:     'bg-transparent text-text-secondary border border-border-default hover:bg-bg-hover hover:text-text-primary',
  gold:      'bg-accent-gold text-bg-deep hover:opacity-90 shadow-[0_0_15px_rgba(212,175,55,0.2)]',
  outline:   'bg-transparent text-primary border border-primary/30 hover:bg-primary-glow'
}

const sizes = {
  xs: 'px-2 py-1 text-[10px]',
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base'
}

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false, className = '', 
  noSkew = false, ...props
}) {
  // Aplicamos el polígono estándar solicitado
  const polygonStyle = noSkew ? {} : { clipPath: 'polygon(4% 0%, 100% 0%, 96% 100%, 0% 100%)' }

  return (
    <button
      disabled={disabled || loading}
      style={polygonStyle}
      className={`
        inline-flex items-center justify-center gap-2
        font-bold font-heading tracking-widest uppercase
        transition-all duration-300
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.95] rounded-none border-black/20
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      <div className="flex items-center gap-2 w-full justify-center">
        {loading && <span className="spinner !w-4 !h-4 !border-2" />}
        {children}
      </div>
    </button>
  )
}
