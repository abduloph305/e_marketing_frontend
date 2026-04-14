import { useContext, useEffect, useMemo, useState } from "react";
import AnalyticsWidgetShell from "../../components/ui/AnalyticsWidgetShell.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatCard from "../../components/ui/StatCard.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";

const initialReportState = {
  selectedRange: { range: "30d", label: "Last 30 days" },
  selectedSummary: {},
  dailySummary: {},
  weeklySummary: {},
  monthlySummary: {},
  campaignReport: [],
  audienceGrowth: [],
  deliverability: {},
  exportFormats: [],
};

const exportTargetOptions = [
  { value: "selected_summary", label: "Selected summary" },
  { value: "campaign_report", label: "Campaign report" },
  { value: "deliverability_report", label: "Deliverability report" },
  { value: "audience_growth", label: "Audience growth" },
];

const rangeOptions = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const formatRate = (numerator, denominator) =>
  denominator ? `${((numerator / denominator) * 100).toFixed(2)}%` : "0.00%";

function ReportsPage() {
  const toast = useContext(ToastContext);
  const [reports, setReports] = useState(initialReportState);
  const [isLoading, setIsLoading] = useState(true);
  const [rangeSelection, setRangeSelection] = useState("30d");
  const [appliedRange, setAppliedRange] = useState({
    range: "30d",
  });
  const [customRangeDraft, setCustomRangeDraft] = useState({
    startDate: "",
    endDate: "",
  });
  const [exportTarget, setExportTarget] = useState("campaign_report");
  const [comparisonLeftId, setComparisonLeftId] = useState("");
  const [comparisonRightId, setComparisonRightId] = useState("");

  const loadReports = async (nextRange = appliedRange, silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const params = {
        range: nextRange.range,
      };

      if (nextRange.range === "custom") {
        params.startDate = nextRange.startDate || undefined;
        params.endDate = nextRange.endDate || undefined;
      }

      const { data } = await api.get("/reports", { params });
      setReports({
        ...initialReportState,
        ...data,
        selectedRange: data.selectedRange || initialReportState.selectedRange,
        selectedSummary: data.selectedSummary || {},
        dailySummary: data.dailySummary || {},
        weeklySummary: data.weeklySummary || {},
        monthlySummary: data.monthlySummary || {},
        campaignReport: Array.isArray(data.campaignReport)
          ? data.campaignReport
          : [],
        audienceGrowth: Array.isArray(data.audienceGrowth)
          ? data.audienceGrowth
          : [],
        deliverability: data.deliverability || {},
        exportFormats: Array.isArray(data.exportFormats)
          ? data.exportFormats
          : [],
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load reports");
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReports(appliedRange);
  }, [appliedRange]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadReports(appliedRange, true).catch(() => {});
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [appliedRange]);

  useEffect(() => {
    if (!reports.campaignReport.length) {
      return;
    }

    setComparisonLeftId((current) => current || reports.campaignReport[0]._id);
    setComparisonRightId(
      (current) =>
        current ||
        reports.campaignReport[1]?._id ||
        reports.campaignReport[0]._id,
    );
  }, [reports.campaignReport]);

  const selectedRangeLabel = reports.selectedRange?.label || "Last 30 days";
  const exportRangeParams = useMemo(
    () => ({
      range: appliedRange.range,
      ...(appliedRange.range === "custom"
        ? {
            startDate: appliedRange.startDate || undefined,
            endDate: appliedRange.endDate || undefined,
          }
        : {}),
    }),
    [appliedRange],
  );

  const comparison = useMemo(() => {
    const left = reports.campaignReport.find(
      (campaign) => campaign._id === comparisonLeftId,
    );
    const right = reports.campaignReport.find(
      (campaign) => campaign._id === comparisonRightId,
    );

    return {
      left,
      right,
    };
  }, [comparisonLeftId, comparisonRightId, reports.campaignReport]);

  const handlePresetRange = (range) => {
    setRangeSelection(range);
    setAppliedRange({ range });
  };

  const handleCustomRangeSubmit = (event) => {
    event.preventDefault();

    if (!customRangeDraft.startDate || !customRangeDraft.endDate) {
      toast.error("Pick both start and end dates for a custom range");
      return;
    }

    setRangeSelection("custom");
    setAppliedRange({
      range: "custom",
      startDate: customRangeDraft.startDate,
      endDate: customRangeDraft.endDate,
    });
  };

  const handleExport = async (report, format) => {
    try {
      const { data } = await api.get("/reports/export", {
        params: {
          report,
          format,
          ...exportRangeParams,
        },
      });
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start export");
    }
  };

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              eyebrow="Reports"
              title="Reporting and exports center"
              description="Review stakeholder-ready summaries, exportable tables, and range-based campaign reporting from one place."
            />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">
                Selected range: {selectedRangeLabel}
              </span>
              <span className="soft-pill">Campaign comparison ready</span>
              <span className="soft-pill">
                CSV, Excel, and PDF placeholders
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handlePresetRange(option.value)}
                  className={
                    rangeSelection === option.value
                      ? "primary-button"
                      : "secondary-button"
                  }
                >
                  {option.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRangeSelection("custom")}
                className={
                  rangeSelection === "custom"
                    ? "primary-button"
                    : "secondary-button"
                }
              >
                Custom range
              </button>
            </div>
            {rangeSelection === "custom" ? (
              <form
                className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                onSubmit={handleCustomRangeSubmit}
              >
                <input
                  className="field"
                  type="date"
                  value={customRangeDraft.startDate}
                  onChange={(event) =>
                    setCustomRangeDraft((current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
                <input
                  className="field"
                  type="date"
                  value={customRangeDraft.endDate}
                  onChange={(event) =>
                    setCustomRangeDraft((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
                <button type="submit" className="primary-button">
                  Apply
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="shell-card-strong px-6 py-4 text-sm text-[#6e6787]">
          Loading reports center...
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Selected sent"
          value={reports.selectedSummary?.sent || 0}
          hint={`${reports.selectedSummary?.delivered || 0} delivered`}
          accent="info"
        />
        <StatCard
          label="Selected delivered"
          value={reports.selectedSummary?.delivered || 0}
          hint={`${reports.selectedSummary?.opens || 0} opens`}
          accent="success"
        />
        <StatCard
          label="Selected opens"
          value={reports.selectedSummary?.opens || 0}
          hint={`${reports.selectedSummary?.clicks || 0} clicks`}
          accent="default"
        />
        <StatCard
          label="Deliverability bounce rate"
          value={`${reports.deliverability.bounceRate || 0}%`}
          hint={`${reports.deliverability.complaintRate || 0}% complaint rate`}
          accent="warning"
        />
      </section>

      <section className="space-y-6">
        <AnalyticsWidgetShell
          eyebrow="Summaries"
          title="Time-window summaries"
          description="Quick rollups for operational and stakeholder reporting."
        >
          <div className="flex gap-4 overflow-x-auto p-6">
            {[
              ["Daily", reports.dailySummary],
              ["Weekly", reports.weeklySummary],
              ["Monthly", reports.monthlySummary],
            ].map(([label, item]) => (
              <div
                key={label}
                className="min-w-[220px] flex-1 rounded-[24px] border border-ui bg-[var(--bg-subtle)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-muted">
                      {label}
                    </p>
                    <p className="text-2xl font-semibold text-ui-strong">
                      {item.sent || 0} sent
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-ui-body">
                      {item.opens || 0} opens, {item.clicks || 0} clicks
                    </p>
                    <p className="mt-1 text-sm text-ui-muted">
                      {item.newSubscribers || 0} new subscribers
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AnalyticsWidgetShell>

        <AnalyticsWidgetShell
          eyebrow="Audience growth"
          title="Recent subscriber growth"
          description="Monthly acquisition snapshot for list-health reporting."
        >
          <div className="space-y-3 p-6">
            {reports.audienceGrowth.length ? (
              reports.audienceGrowth.map((item) => (
                <div
                  key={item.period}
                  className="grid grid-cols-[96px_minmax(0,1fr)_70px] items-center gap-3"
                >
                  <span className="text-sm font-medium text-ui-body">
                    {item.period}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{
                        width: `${Math.max(
                          (item.subscribers /
                            Math.max(
                              ...reports.audienceGrowth.map(
                                (entry) => entry.subscribers,
                              ),
                              1,
                            )) *
                            100,
                          item.subscribers ? 10 : 0,
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-right text-sm font-semibold text-ui-strong">
                    {item.subscribers}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="No audience trend yet"
                description="Audience growth will appear here as subscriber records accumulate."
              />
            )}
          </div>
        </AnalyticsWidgetShell>
      </section>

      <section className="space-y-6">
        <AnalyticsWidgetShell
          eyebrow="Campaign report"
          title="Campaign performance snapshot"
          
          actions={
            <div className="flex flex-wrap gap-2">
              <select
                className="field min-w-[190px]"
                value={exportTarget}
                onChange={(event) => setExportTarget(event.target.value)}
              >
                {exportTargetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {reports.exportFormats.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => handleExport(exportTarget, format)}
                  className="secondary-button"
                >
                  Export {format.replaceAll("_", " ")}
                </button>
              ))}
            </div>
          }
        >
          {reports.campaignReport.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[var(--bg-subtle)] text-ui-muted">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Sent</th>
                    <th className="px-6 py-4 font-medium">Delivered</th>
                    <th className="px-6 py-4 font-medium">Opens</th>
                    <th className="px-6 py-4 font-medium">Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.campaignReport.map((row) => (
                    <tr key={row._id} className="border-t border-ui">
                      <td className="px-6 py-4 text-ui-strong">{row.name}</td>
                      <td className="px-6 py-4 capitalize text-ui-body">
                        {row.status}
                      </td>
                      <td className="px-6 py-4 text-ui-body">{row.sent}</td>
                      <td className="px-6 py-4 text-ui-body">
                        {row.delivered}
                      </td>
                      <td className="px-6 py-4 text-ui-body">{row.opens}</td>
                      <td className="px-6 py-4 text-ui-body">{row.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No campaign report rows"
                description="Campaign rows will appear once campaign activity is available."
              />
            </div>
          )}
        </AnalyticsWidgetShell>

        <AnalyticsWidgetShell
          eyebrow="Campaign comparison"
          title="Compare two campaigns"
          description="Select any two campaigns from the current report window to compare delivery and engagement."
        >
          <div className="grid gap-4 p-6">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="field"
                value={comparisonLeftId}
                onChange={(event) => setComparisonLeftId(event.target.value)}
              >
                {reports.campaignReport.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              <select
                className="field"
                value={comparisonRightId}
                onChange={(event) => setComparisonRightId(event.target.value)}
              >
                {reports.campaignReport.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            {comparison.left && comparison.right ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[comparison.left, comparison.right].map((campaign) => {
                  const openRate = formatRate(
                    campaign.opens || 0,
                    campaign.sent || 0,
                  );
                  const clickRate = formatRate(
                    campaign.clicks || 0,
                    campaign.sent || 0,
                  );

                  return (
                    <article
                      key={campaign._id}
                      className="rounded-[24px] border border-ui bg-[var(--bg-subtle)] p-4"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-muted">
                        {campaign.name}
                      </p>
                      <p className="mt-2 text-sm text-ui-body capitalize">
                        {campaign.status}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-ui-muted">Sent</p>
                          <p className="mt-1 text-xl font-semibold text-ui-strong">
                            {campaign.sent || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ui-muted">Delivered</p>
                          <p className="mt-1 text-xl font-semibold text-ui-strong">
                            {campaign.delivered || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ui-muted">Open rate</p>
                          <p className="mt-1 text-xl font-semibold text-ui-strong">
                            {openRate}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-ui-muted">Click rate</p>
                          <p className="mt-1 text-xl font-semibold text-ui-strong">
                            {clickRate}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Comparison needs two campaigns"
                description="Pick two campaigns from the report window to see a side-by-side breakdown."
              />
            )}
          </div>
        </AnalyticsWidgetShell>
      </section>

      <section>
        <AnalyticsWidgetShell
          eyebrow="Deliverability report"
          title="Channel health snapshot"
          description="Operational report values that can also power exports."
        >
          <div className="grid gap-4 p-6">
            <div className="rounded-[24px] border border-ui bg-[var(--bg-subtle)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-muted">
                Sent and delivered
              </p>
              <p className="mt-2 text-sm text-ui-body">
                {reports.deliverability.sent || 0} sent /{" "}
                {reports.deliverability.delivered || 0} delivered
              </p>
            </div>
            <div className="rounded-[24px] border border-ui bg-[var(--bg-subtle)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-muted">
                Engagement
              </p>
              <p className="mt-2 text-sm text-ui-body">
                {reports.deliverability.opens || 0} opens /{" "}
                {reports.deliverability.clicks || 0} clicks
              </p>
            </div>
            <div className="rounded-[24px] border border-ui bg-[var(--bg-subtle)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-muted">
                Risk rates
              </p>
              <p className="mt-2 text-sm text-ui-body">
                {reports.deliverability.bounceRate || 0}% bounce,{" "}
                {reports.deliverability.complaintRate || 0}% complaint,{" "}
                {reports.deliverability.unsubscribeRate || 0}% unsubscribe
              </p>
            </div>
          </div>
        </AnalyticsWidgetShell>
      </section>
    </div>
  );
}

export default ReportsPage;
