import { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import { ToastContext } from '../../context/ToastContext.jsx'
import { triggerLabels, workflowStatusTabs } from '../../data/automations.js'
import { api } from '../../lib/api.js'

const initialFilters = {
  search: '',
  trigger: '',
}

function AutomationListPage() {
  const toast = useContext(ToastContext)
  const [workflows, setWorkflows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [meta, setMeta] = useState({ triggers: [] })
  const [filters, setFilters] = useState(initialFilters)
  const [statusTab, setStatusTab] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

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

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              
              title="Workflow automation studio"
              
            />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">{pagination.total} workflows in workspace</span>
              {/* <span className="soft-pill">Future ecommerce hooks ready</span> */}
            </div>
          </div>
          <Link to="/automations/new" className="primary-button">
            Create workflow
          </Link>
        </div>
      </section>

      <section className="shell-card-strong p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {workflowStatusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setStatusTab(tab)
                loadWorkflows(1, tab, filters)
              }}
              className={`rounded-[3px] border px-4 py-2 text-sm font-semibold capitalize transition ${
                statusTab === tab
                  ? 'border-[#7c3aed] bg-[#7c3aed] text-white'
                  : 'border-[#ddd4f2] bg-white text-[#6e6787]'
              }`}
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

      <section className="shell-card-strong overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading workflows..." />
        ) : workflows.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#faf7ff] text-[#7a7296]">
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
                    <tr key={workflow._id} className="border-b border-slate-100 align-top last:border-b-0">
                      <td className="px-6 py-5">
                        <Link to={`/automations/${workflow._id}`} className="text-base font-semibold text-[#2f2b3d]">
                          {workflow.name}
                        </Link>
                        <p className="mt-1 text-sm text-[#6e6787]">
                          {workflow.description || 'No workflow description yet'}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        {triggerLabels[workflow.trigger] || workflow.trigger}
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">{workflow.stepCount}</td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>{workflow.executionCount || 0} total runs</p>
                        <p className="mt-1 text-xs text-[#9a94b2]">
                          {workflow.executionStats?.completed || 0} completed / {workflow.executionStats?.failed || 0} failed
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={workflow.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-3">
                          <Link className="font-medium text-[#2f2b3d]" to={`/automations/${workflow._id}`}>
                            View
                          </Link>
                          <Link className="font-medium text-[#6d28d9]" to={`/automations/${workflow._id}/edit`}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="font-medium text-[#c77b08]"
                            onClick={() => handleToggleStatus(workflow)}
                          >
                            {workflow.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link className="font-medium text-[#5f5878]" to={`/automations/${workflow._id}/executions`}>
                            Logs
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 px-6 py-4 text-sm text-[#6e6787] md:flex-row md:items-center md:justify-between">
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page <= 1}
                  onClick={() => loadWorkflows(pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-2 disabled:opacity-50"
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
    </div>
  )
}

export default AutomationListPage
