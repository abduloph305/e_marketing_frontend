import { useEffect, useState } from 'react'
import DateRangeFilter from '../../components/ui/DateRangeFilter.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { api } from '../../lib/api.js'

const initialFilters = {
  startDate: '',
  endDate: '',
}

function AnalyticsPage() {
  const [filters, setFilters] = useState(initialFilters)
  const [summary, setSummary] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])
  const [topCampaigns, setTopCampaigns] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAnalytics = async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true)
    }

    try {
      const params = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      }

      const [summaryResponse, recentEventsResponse, topCampaignsResponse] = await Promise.all([
        api.get('/email/analytics/summary', { params }),
        api.get('/email/events/recent', { params: { ...params, limit: 8 } }),
        api.get('/email/campaigns/top', { params: { ...params, limit: 5 } }),
      ])

      setSummary(summaryResponse.data)
      setRecentEvents(recentEventsResponse.data.data)
      setTopCampaigns(topCampaignsResponse.data)
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadAnalytics({ silent: true }).catch(() => {})
    }, 30000)

    return () => window.clearInterval(intervalId)
  }, [])

  if (isLoading && !summary) {
    return <LoadingState message="Loading analytics..." />
  }

  return (
    <div className="space-y-6">
      <section className="shell-card p-6 md:p-8">
        <PageHeader
          eyebrow="Analytics"
          title="Performance summary"
          description="Review core email engagement, recent events, and the best-performing campaigns across the selected date range."
        />
      </section>

      <section className="shell-card p-6">
        <DateRangeFilter
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          onApply={loadAnalytics}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Emails sent" value={summary?.sent || 0} hint="Messages handed to SES" />
        <StatCard
          label="Inbox deliveries"
          value={summary?.delivered || 0}
          hint="Messages confirmed delivered"
        />
        <StatCard
          label="People opened"
          value={summary?.opens || 0}
          hint={`Open rate ${summary?.openRate || 0}%`}
        />
        <StatCard
          label="People clicked"
          value={summary?.clicks || 0}
          hint={`Click rate ${summary?.clickRate || 0}%`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent events</h3>
          </div>
          <div className="overflow-x-auto">
            {recentEvents.length ? (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Recipient</th>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event._id} className="border-t border-slate-100">
                      <td className="px-6 py-4 capitalize">{event.eventType}</td>
                      <td className="px-6 py-4">{event.recipientEmail}</td>
                      <td className="px-6 py-4">{event.campaignId?.name || 'N/A'}</td>
                      <td className="px-6 py-4">{new Date(event.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState
                  title="No recent events"
                  description="Events will appear here after test sends or live campaign activity."
                />
              </div>
            )}
          </div>
        </article>

        <article className="shell-card overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-900">Top campaigns</h3>
          </div>
          <div className="overflow-x-auto">
            {topCampaigns.length ? (
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Sent</th>
                    <th className="px-6 py-4 font-medium">Open rate</th>
                    <th className="px-6 py-4 font-medium">Click rate</th>
                  </tr>
                </thead>
                <tbody>
                  {topCampaigns.map((campaign) => (
                    <tr key={campaign._id} className="border-t border-slate-100">
                      <td className="px-6 py-4">{campaign.name}</td>
                      <td className="px-6 py-4">{campaign.totalSent}</td>
                      <td className="px-6 py-4">{campaign.openRate}%</td>
                      <td className="px-6 py-4">{campaign.clickRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState
                  title="No top campaigns yet"
                  description="Campaign rankings will appear once event activity is available in the selected range."
                />
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}

export default AnalyticsPage
