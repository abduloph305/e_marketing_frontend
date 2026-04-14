function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ui-muted">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="text-3xl font-semibold tracking-tight text-ui-strong md:text-4xl">{title}</h3>
      <p className="max-w-3xl text-sm leading-6 text-ui-body md:text-[15px]">{description}</p>
    </div>
  )
}

export default PageHeader
