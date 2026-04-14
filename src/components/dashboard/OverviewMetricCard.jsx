function OverviewMetricCard({ title, value, hint, tone = 'default', icon = 'ST' }) {
  const toneClasses = {
    default: {
      wrapper: 'text-[#5f5878]',
      value: 'text-[#5b35c8]',
      icon: 'text-[#7c3aed]',
    },
    blue: {
      wrapper: 'text-[#3b82f6]',
      value: 'text-[#0369a1]',
      icon: 'text-[#3b82f6]',
    },
    emerald: {
      wrapper: 'text-[#16a34a]',
      value: 'text-[#059669]',
      icon: 'text-[#10b981]',
    },
    amber: {
      wrapper: 'text-[#d97706]',
      value: 'text-[#d97706]',
      icon: 'text-[#f59e0b]',
    },
    rose: {
      wrapper: 'text-[#e11d48]',
      value: 'text-[#e11d48]',
      icon: 'text-[#f43f5e]',
    },
  }
  const palette = toneClasses[tone] || toneClasses.default

  return (
    <article className="metric-card">
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-[15px] font-medium ${palette.wrapper}`}>{title}</p>
          <span className={`text-lg ${palette.icon}`}>{icon}</span>
        </div>
        <p className={`mt-8 text-[42px] font-semibold leading-none tracking-tight ${palette.value}`}>
          {value}
        </p>
        <p className="mt-3 text-sm text-[#9a94b2]">{hint}</p>
      </div>
    </article>
  )
}

export default OverviewMetricCard
