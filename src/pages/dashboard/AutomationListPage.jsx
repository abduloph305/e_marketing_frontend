import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import Modal from '../../components/ui/Modal.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { dripCampaignPresets, triggerLabels, workflowStatusTabs } from '../../data/automations.js'
import { api } from '../../lib/api.js'

const initialFilters = {
  search: '',
  trigger: '',
}

function AutomationListPage() {
  const navigate = useNavigate()
  const toast = useContext(ToastContext)
  const [workflows, setWorkflows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [meta, setMeta] = useState({ triggers: [] })
  const [filters, setFilters] = useState(initialFilters)
  const [statusTab, setStatusTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateChooser, setShowCreateChooser] = useState(false)
  const [showRecipeGallery, setShowRecipeGallery] = useState(false)

  const loadWorkflows = async (page = 1, nextStatus = statusTab, nextFilters = filters) => {
    setIsLoading(true)

    try {
      const [metaResponse, listResponse] = await Promise.all([
        api.get('/automations/meta'),
        api.get('/automations', {
          params: {
            page,
            limit: 10,
            status: nextStatus,
            search: nextFilters.search || undefined,
            trigger: nextFilters.trigger || undefined,
          },
        }),
      ])

      setMeta(metaResponse.data)
      setWorkflows(listResponse.data.data)
      setPagination(listResponse.data.pagination)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load workflows')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWorkflows(1)
  }, [])

  const handleToggleStatus = async (workflow) => {
    try {
      await api.post(`/automations/${workflow._id}/${workflow.isActive ? 'deactivate' : 'activate'}`)
      toast.success(workflow.isActive ? 'Workflow deactivated' : 'Workflow activated')
      loadWorkflows(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update workflow')
    }
  }

  const handleChooseReadyMade = () => {
    setShowCreateChooser(false)
    setShowRecipeGallery(true)
  }

  const handleChooseCustom = () => {
    setShowCreateChooser(false)
    navigate('/automations/new')
  }

  return (
    <div className="space-y-6">
      <section className="brevo-card p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader title="Workflow automation studio" />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">{pagination.total} workflows in workspace</span>
            </div>
          </div>
          <button type="button" className="primary-button" onClick={() => setShowCreateChooser(true)}>
            Create workflow
          </button>
        </div>
      </section>

      <section className="brevo-card p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {workflowStatusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusTab(tab)
                loadWorkflows(1, tab, filters)
              }}
              className={`brevo-tab capitalize ${statusTab === tab ? 'brevo-tab-active' : ''}`}
            >
              {tab === 'all' ? 'All workflows' : tab}
            </button>
          ))}
        </div>

        <form
          className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_220px_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            loadWorkflows(1)
          }}
        >
          <input
            className="field"
            placeholder="Search workflow name or description"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <select
            className="field"
            value={filters.trigger}
            onChange={(event) => setFilters((current) => ({ ...current, trigger: event.target.value }))}
          >
            <option value="">All triggers</option>
            {meta.triggers.map((trigger) => (
              <option key={trigger} value={trigger}>
                {triggerLabels[trigger] || trigger}
              </option>
            ))}
          </select>
          <button type="submit" className="primary-button">
            Apply filters
          </button>
        </form>
      </section>

      <section className="brevo-card overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading workflows..." />
        ) : workflows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[var(--border-soft)] bg-[#f7f9f1] text-[#667085]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Workflow</th>
                    <th className="px-6 py-4 font-medium">Trigger</th>
                    <th className="px-6 py-4 font-medium">Steps</th>
                    <th className="px-6 py-4 font-medium">Executions</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((workflow) => (
                    <tr key={workflow._id} className="border-b border-[var(--border-soft)] align-top last:border-b-0">
                      <td className="px-6 py-5">
                        <Link to={`/automations/${workflow._id}`} className="text-[15px] font-semibold text-[#101828]">
                          {workflow.name}
                        </Link>
                        <p className="mt-1 text-sm text-[#667085]">
                          {workflow.description || 'No workflow description yet'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-[#475467]">
                        {triggerLabels[workflow.trigger] || workflow.trigger}
                      </td>
                      <td className="px-6 py-5 text-[#475467]">{workflow.stepCount}</td>
                      <td className="px-6 py-5 text-[#475467]">
                        <p>{workflow.executionCount || 0} total runs</p>
                        <p className="mt-1 text-xs text-[#667085]">
                          {workflow.executionStats?.completed || 0} completed / {workflow.executionStats?.failed || 0} failed
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={workflow.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-3">
                          <Link className="font-medium text-[#101828]" to={`/automations/${workflow._id}`}>
                            View
                          </Link>
                          <Link className="font-medium text-[#166534]" to={`/automations/${workflow._id}/edit`}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="font-medium text-[#b54708]"
                            onClick={() => handleToggleStatus(workflow)}
                          >
                            {workflow.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link className="font-medium text-[#667085]" to={`/automations/${workflow._id}/executions`}>
                            Logs
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4 text-sm text-[#667085] md:flex-row md:items-center md:justify-between">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page <= 1}
                  onClick={() => loadWorkflows(pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-full border border-[var(--border-strong)] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadWorkflows(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No workflows match these filters"
              description="Create a workflow, switch status tabs, or widen the filters to continue building your automation layer."
              action={
                <Link to="/automations/new" className="primary-button">
                  Create workflow
                </Link>
              }
            />
          </div>
        )}
      </section>

      {showCreateChooser ? (
        <Modal
          title="Create workflow"
          // description="Pick a ready-made automation recipe or start with a custom flow."
          onClose={() => setShowCreateChooser(false)}
          className="max-w-4xl"
          bodyClassName="grid gap-4 md:grid-cols-2"
        >
          <button
            type="button"
            onClick={handleChooseReadyMade}
            className="rounded-[28px] border border-emerald-200 bg-[#f6fff8] p-6 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="inline-flex rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
              Ready-made automation
            </div>
            
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pick a workflow for welcome, signup, abandoned cart recovery, order confirmation, payment thank-you, follow-up, reminder, or discount flows.
            </p>
            <p className="mt-4 text-sm font-medium text-emerald-700">
              Browse automation recipes -&gt;
            </p>
          </button>

          <button
            type="button"
            onClick={handleChooseCustom}
            className="rounded-[28px] border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
          >
            <div className="inline-flex rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              Custom flow
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              Build from scratch
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Open the workflow builder and create your own trigger, steps, delays, conditions, and email actions.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-900">
              Open builder -&gt;
            </p>
          </button>
        </Modal>
      ) : null}

      {showRecipeGallery ? (
        <Modal
          title="Ready-made automation"
          description="Pick a proven workflow recipe and open the builder with matching starter steps."
          onClose={() => setShowRecipeGallery(false)}
          className="max-w-6xl"
          bodyClassName="space-y-4"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#667085]">
                Drip Campaigns
              </p>
              <h3 className="mt-1 text-[20px] font-semibold text-[#101828]">
                Quick-start automation recipes
              </h3>
              <p className="mt-1 text-sm text-[#667085]">
                Use these as ready-made workflows for signup, recovery, reminders, and offers.
              </p>
            </div>
            <p className="text-xs text-[#667085]">
              Each preset opens the builder with a matching trigger and starter steps.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {dripCampaignPresets.map((preset) => (
              <Link
                key={preset.key}
                to={`/automations/new?preset=${preset.key}`}
                onClick={() => setShowRecipeGallery(false)}
                className="rounded-[24px] border border-[var(--border-soft)] bg-white p-4 transition hover:border-[rgba(21,128,61,0.2)] hover:bg-[#f7f9f1]"
              >
                <p className="text-[15px] font-semibold text-[#101828]">{preset.label}</p>
                <p className="mt-1 text-sm text-[#667085]">{preset.description}</p>
                <p className="mt-3 text-xs font-medium text-[#166534]">
                  Trigger: {triggerLabels[preset.trigger] || preset.trigger}
                </p>
              </Link>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

export default AutomationListPage
