const variants = {
  primary:   'bg-primary text-text-on-primary hover:bg-primary-dim shadow-glow-primary',
  secondary: 'bg-secondary text-white hover:bg-secondary-dim shadow-glow-secondary',
  danger:    'bg-danger text-white hover:opacity-90',
  ghost:     'bg-transparent text-text-secondary border border-border-default hover:bg-bg-hover hover:text-text-primary',
  gold:      'bg-accent-gold text-bg-deep hover:opacity-90 shadow-glow-gold',
  outline:   'bg-transparent text-primary border border-primary/30 hover:bg-primary-glow'
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl'
}

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled = false, loading = false, className = '', ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold font-heading tracking-wide
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
        active:scale-[0.97]
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <span className="spinner !w-4 !h-4 !border-2" />}
      {children}
    </button>
  )
}
