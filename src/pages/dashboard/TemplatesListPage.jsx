import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { api } from '../../lib/api.js'

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Not set'

const getTemplateTimestampLabel = (template) => {
  const createdAt = template.createdAt ? new Date(template.createdAt) : null
  const updatedAt = template.updatedAt ? new Date(template.updatedAt) : null

  if (!createdAt && updatedAt) {
    return `Updated on ${formatDateTime(updatedAt)}`
  }

  if (createdAt && updatedAt && createdAt.getTime() !== updatedAt.getTime()) {
    return `Updated on ${formatDateTime(updatedAt)}`
  }

  return `Created on ${formatDateTime(createdAt || updatedAt)}`
}

function TemplatesListPage() {
  const [templates, setTemplates] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTemplates = async () => {
    setIsLoading(true)

    try {
      const { data } = await api.get('/templates')
      setTemplates(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const handleDelete = async (id) => {
    await api.delete(`/templates/${id}`)
    loadTemplates()
  }

  return (
    <div className="space-y-6">
      <section className="shell-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
           
            title="Email templates"
            description="Store reusable campaign layouts with editable subjects, preview text, and simple HTML content."
          />
          <Link to="/templates/new" className="primary-button">
            Create template
          </Link>
        </div>
      </section>

      <section className="shell-card p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading templates...</p>
        ) : templates.length ? (
          <div className="grid gap-4">
            {templates.map((template) => (
              <article key={template._id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{template.subject}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {template.previewText || 'No preview text'}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">{getTemplateTimestampLabel(template)}</p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to={`/templates/${template._id}/edit`}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(template._id)}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No templates yet"
            description="Create your first reusable template for campaigns."
            action={
              <Link to="/templates/new" className="primary-button">
                Create template
              </Link>
            }
          />
        )}
      </section>
    </div>
  )
}

export default TemplatesListPage
