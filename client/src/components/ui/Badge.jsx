const styles = {
  live:        'bg-primary/15 text-primary border-primary/30 animate-pulse-live',
  finalizado:  'bg-bg-elevated text-text-secondary border-border-default',
  programado:  'bg-info-dim text-info border-info/30',
  en_juego:    'bg-primary/15 text-primary border-primary/30 animate-pulse-live',
  suspendido:  'bg-danger-dim text-danger border-danger/30',
  postergado:  'bg-warning-dim text-warning border-warning/30',
  activa:      'bg-primary/15 text-primary border-primary/30',
  borrador:    'bg-bg-elevated text-text-dim border-border-default',
  pagado:      'bg-primary/15 text-primary border-primary/30',
  parcial:     'bg-warning-dim text-warning border-warning/30',
  pendiente:   'bg-danger-dim text-danger border-danger/30',
  gold:        'bg-accent-gold/15 text-accent-gold border-accent-gold/30'
}

const labels = {
  live: 'EN VIVO', finalizado: 'FINALIZADO', programado: 'PROGRAMADO',
  en_juego: 'EN JUEGO', suspendido: 'SUSPENDIDO', postergado: 'POSTERGADO',
  activa: 'ACTIVA', borrador: 'BORRADOR', pagado: 'PAGADO',
  parcial: 'PARCIAL', pendiente: 'PENDIENTE', gold: 'GANADOR'
}

export default function Badge({ status, label, className = '' }) {
  const s = styles[status] || styles.programado
  const text = label || labels[status] || status?.toUpperCase()

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5
      text-[11px] font-semibold tracking-wider uppercase
      rounded-full border ${s} ${className}
    `}>
      {(status === 'live' || status === 'en_juego') && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {text}
    </span>
  )
}
