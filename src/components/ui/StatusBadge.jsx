function StatusBadge({ status }) {
  const palette = {
    subscribed: 'bg-emerald-100 text-emerald-700',
    unsubscribed: 'bg-slate-200 text-slate-700',
    bounced: 'bg-amber-100 text-amber-700',
    complained: 'bg-rose-100 text-rose-700',
    suppressed: 'bg-violet-100 text-violet-700',
    draft: 'bg-slate-100 text-slate-700',
    scheduled: 'bg-violet-100 text-violet-700',
    sending: 'bg-sky-100 text-sky-700',
    sent: 'bg-emerald-100 text-emerald-700',
    paused: 'bg-amber-100 text-amber-700',
    failed: 'bg-rose-100 text-rose-700',
    archived: 'bg-zinc-200 text-zinc-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    opened: 'bg-blue-100 text-blue-700',
    clicked: 'bg-indigo-100 text-indigo-700',
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-200 text-slate-700',
    pending: 'bg-slate-100 text-slate-700',
    running: 'bg-sky-100 text-sky-700',
    completed: 'bg-emerald-100 text-emerald-700',
    exited: 'bg-amber-100 text-amber-700',
    super_admin: 'bg-violet-100 text-violet-700',
    marketing_manager: 'bg-sky-100 text-sky-700',
    content_editor: 'bg-amber-100 text-amber-700',
    analyst: 'bg-emerald-100 text-emerald-700',
    read_only: 'bg-slate-200 text-slate-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        palette[status] || 'bg-slate-100 text-slate-700'
      }`}
    >
      {String(status).replaceAll('_', ' ')}
    </span>
  )
}

export default StatusBadge
