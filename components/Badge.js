const styles = {
  success: {
    wrap: 'bg-[var(--success-bg)] text-[var(--success-text)]',
    ring: 'shadow-[0_0_0_1px_var(--success-border)]',
    dot:  'bg-[var(--success)]',
  },
  warning: {
    wrap: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
    ring: 'shadow-[0_0_0_1px_var(--warning-border)]',
    dot:  'bg-[var(--warning)]',
  },
  error: {
    wrap: 'bg-[var(--danger-bg)] text-[var(--danger-text)]',
    ring: 'shadow-[0_0_0_1px_var(--danger-border)]',
    dot:  'bg-[var(--danger)]',
  },
  info: {
    wrap: 'bg-[var(--info-bg)] text-[var(--info-text)]',
    ring: 'shadow-[0_0_0_1px_var(--info-border)]',
    dot:  'bg-[var(--info)]',
  },
  default: {
    wrap: 'bg-[var(--bg-active)] text-[var(--text-secondary)]',
    ring: 'shadow-[0_0_0_1px_var(--border)]',
    dot:  'bg-[var(--text-muted)]',
  },
};

export default function Badge({ children, variant = 'default', dot = false, className = '' }) {
  const s = styles[variant] ?? styles.default;
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full',
        'text-[11.5px] font-semibold tracking-wide leading-none',
        s.wrap, s.ring,
        className,
      ].join(' ')}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />}
      {children}
    </span>
  );
}

