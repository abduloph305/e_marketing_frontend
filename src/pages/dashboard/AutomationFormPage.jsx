import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import LoadingState from '../../components/ui/LoadingState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import {
  createWorkflowStep,
  stepTypeLabels,
  triggerLabels,
} from '../../data/automations.js'
import { api } from '../../lib/api.js'

const createInitialForm = () => ({
  name: '',
  description: '',
  trigger: 'welcome_signup',
  status: 'draft',
  entrySegmentId: '',
  triggerConfig: {
    delayWindow: '',
    notes: '',
  },
  steps: [createWorkflowStep('send_email'), createWorkflowStep('exit')],
})

function StepEditor({ step, index, templates, onChange, onRemove }) {
  return (
    <article className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
              Step {index + 1}
            </span>
            <select
              className="field max-w-[220px]"
              value={step.type}
              onChange={(event) => onChange(index, { ...createWorkflowStep(event.target.value), type: event.target.value })}
            >
              {Object.entries(stepTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              className="field"
              placeholder="Step title"
              value={step.title}
              onChange={(event) => onChange(index, { ...step, title: event.target.value })}
            />
            <input
              className="field"
              placeholder="Short description"
              value={step.description}
              onChange={(event) => onChange(index, { ...step, description: event.target.value })}
            />
          </div>

          <div className="mt-4">
            {step.type === 'delay' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="field"
                  type="number"
                  min="1"
                  value={step.config?.value || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, value: event.target.value },
                    })
                  }
                />
                <select
                  className="field"
                  value={step.config?.unit || 'hours'}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, unit: event.target.value },
                    })
                  }
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            ) : null}

            {step.type === 'condition' ? (
              <div className="grid gap-4 md:grid-cols-3">
                <input
                  className="field"
                  placeholder="Field"
                  value={step.config?.field || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, field: event.target.value },
                    })
                  }
                />
                <select
                  className="field"
                  value={step.config?.operator || 'gte'}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, operator: event.target.value },
                    })
                  }
                >
                  <option value="eq">Equals</option>
                  <option value="gte">Greater than or equal</option>
                  <option value="lte">Less than or equal</option>
                  <option value="contains">Contains</option>
                </select>
                <input
                  className="field"
                  placeholder="Value"
                  value={step.config?.value || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, value: event.target.value },
                    })
                  }
                />
              </div>
            ) : null}

            {step.type === 'send_email' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <select
                  className="field"
                  value={step.config?.templateId || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, templateId: event.target.value },
                    })
                  }
                >
                  <option value="">Select template</option>
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <input
                  className="field"
                  placeholder="Optional subject override"
                  value={step.config?.subjectOverride || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, subjectOverride: event.target.value },
                    })
                  }
                />
              </div>
            ) : null}

            {step.type === 'add_tag' || step.type === 'remove_tag' ? (
              <input
                className="field"
                placeholder="Tag name"
                value={step.config?.tag || ''}
                onChange={(event) =>
                  onChange(index, {
                    ...step,
                    config: { ...step.config, tag: event.target.value },
                  })
                }
              />
            ) : null}

            {step.type === 'webhook' ? (
              <div className="grid gap-4 md:grid-cols-[1fr_160px]">
                <input
                  className="field"
                  placeholder="Webhook URL"
                  value={step.config?.url || ''}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, url: event.target.value },
                    })
                  }
                />
                <select
                  className="field"
                  value={step.config?.method || 'POST'}
                  onChange={(event) =>
                    onChange(index, {
                      ...step,
                      config: { ...step.config, method: event.target.value },
                    })
                  }
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
          onClick={() => onRemove(index)}
        >
          Remove
        </button>
      </div>
    </article>
  )
}

function AutomationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useContext(ToastContext)
  const [form, setForm] = useState(createInitialForm())
  const [meta, setMeta] = useState({ triggers: [], statuses: [], templates: [], segments: [], ecommerceHooks: null })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [metaResponse, workflowResponse] = await Promise.all([
          api.get('/automations/meta'),
          id ? api.get(`/automations/${id}`) : Promise.resolve({ data: null }),
        ])

        setMeta(metaResponse.data)

        if (workflowResponse.data) {
          setForm({
            name: workflowResponse.data.name || '',
            description: workflowResponse.data.description || '',
            trigger: workflowResponse.data.trigger || 'welcome_signup',
            status: workflowResponse.data.status || 'draft',
            entrySegmentId: workflowResponse.data.entrySegmentId?._id || '',
            triggerConfig: {
              delayWindow: workflowResponse.data.triggerConfig?.delayWindow || '',
              notes: workflowResponse.data.triggerConfig?.notes || '',
            },
            steps: workflowResponse.data.steps?.length ? workflowResponse.data.steps : [createWorkflowStep('send_email')],
          })
        }
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load workflow editor')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const updateStep = (index, nextStep) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? nextStep : step)),
    }))
  }

  const removeStep = (index) => {
    setForm((current) => ({
      ...current,
      steps: current.steps.filter((_, stepIndex) => stepIndex !== index),
    }))
  }

  const addStep = (type) => {
    setForm((current) => ({
      ...current,
      steps: [...current.steps, createWorkflowStep(type)],
    }))
  }

  const validateForm = () => {
    if (!form.name.trim()) {
      return 'Workflow name is required'
    }

    if (!form.trigger) {
      return 'Workflow trigger is required'
    }

    if (!form.steps.length) {
      return 'Add at least one step to this workflow'
    }

    return ''
  }

  const handleSubmit = async (nextStatus = form.status) => {
    const validationMessage = validateForm()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const payload = {
        ...form,
        status: nextStatus,
        isActive: nextStatus === 'active',
        entrySegmentId: form.entrySegmentId || null,
      }

      if (id) {
        await api.put(`/automations/${id}`, payload)
        toast.success('Workflow updated')
      } else {
        const { data } = await api.post('/automations', payload)
        toast.success('Workflow created')
        navigate(`/automations/${data._id}`)
        return
      }

      navigate('/automations')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save workflow')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading workflow builder..." />
  }

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              
              title={id ? 'Edit workflow' : 'Build a workflow'}
              
            />
            <div className="flex flex-wrap gap-2">
              {/* <span className="soft-pill">Visual step builder</span> */}
              <span className="soft-pill">{meta.ecommerceHooks?.message}</span>
            </div>
          </div>
          <Link to="/automations" className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]">
            Back to automations
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit(form.status)
          }}
        >
          <section className="shell-card-strong space-y-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                className="field md:col-span-2"
                placeholder="Workflow name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <textarea
                className="field md:col-span-2 min-h-[120px] resize-y"
                placeholder="Describe what this workflow is meant to achieve"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              />
              <select
                className="field"
                value={form.trigger}
                onChange={(event) => setForm((current) => ({ ...current, trigger: event.target.value }))}
              >
                {meta.triggers.map((trigger) => (
                  <option key={trigger} value={trigger}>
                    {triggerLabels[trigger] || trigger}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              >
                {meta.statuses.filter((status) => status !== 'archived').map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={form.entrySegmentId}
                onChange={(event) => setForm((current) => ({ ...current, entrySegmentId: event.target.value }))}
              >
                <option value="">All eligible subscribers</option>
                {meta.segments.map((segment) => (
                  <option key={segment._id} value={segment._id}>
                    {segment.name}
                  </option>
                ))}
              </select>
              <input
                className="field"
                placeholder="Optional delay window hint"
                value={form.triggerConfig.delayWindow}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    triggerConfig: { ...current.triggerConfig, delayWindow: event.target.value },
                  }))
                }
              />
              <input
                className="field md:col-span-2"
                placeholder="Internal workflow notes"
                value={form.triggerConfig.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    triggerConfig: { ...current.triggerConfig, notes: event.target.value },
                  }))
                }
              />
            </div>
          </section>

          <section className="shell-card-strong space-y-5 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Workflow steps</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">Sequence builder</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(stepTypeLabels).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addStep(type)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
                  >
                    Add {stepTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {form.steps.map((step, index) => (
                <StepEditor
                  key={`${step.type}-${index}`}
                  step={step}
                  index={index}
                  templates={meta.templates}
                  onChange={updateStep}
                  onRemove={removeStep}
                />
              ))}
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-semibold text-[#5f5878]"
                disabled={isSubmitting}
                onClick={() => handleSubmit('draft')}
              >
                {isSubmitting ? 'Saving...' : 'Save as draft'}
              </button>
              <button type="submit" className="primary-button" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : id ? 'Update workflow' : 'Create workflow'}
              </button>
            </div>
          </section>
        </form>

        <div className="space-y-6">
          <section className="shell-card-strong p-6">
            <h3 className="text-xl font-semibold text-[#2f2b3d]">Builder guidance</h3>
            <div className="mt-4 space-y-4 text-sm text-[#6e6787]">
              <p>1. Start with a clear trigger so the processor can stay deterministic as integrations grow.</p>
              <p>2. Keep the sequence readable. Delay, condition, and send steps should explain themselves at a glance.</p>
              <p>3. Use exit steps intentionally to stop a journey when a branch should no longer continue.</p>
            </div>
          </section>

          <section className="shell-card-strong p-6">
            <h3 className="text-xl font-semibold text-[#2f2b3d]">Future integrations</h3>
            <div className="mt-4 rounded-2xl bg-[#faf7ff] p-4 text-sm text-[#6e6787]">
              <p>Ecommerce-driven triggers are scaffolded but not hard-coupled to any store yet.</p>
              <p className="mt-3">That keeps the architecture clean now while leaving room for real event ingestion later.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AutomationFormPage
