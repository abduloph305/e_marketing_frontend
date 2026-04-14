import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import {
  campaignGoals,
  campaignTypes,
  formatCampaignTypeLabel,
} from "../../data/campaigns.js";
import { api } from "../../lib/api.js";

const statusTabs = [
  "all",
  "draft",
  "scheduled",
  "sending",
  "sent",
  "paused",
  "failed",
  "archived",
];

const initialFilters = {
  search: "",
  type: "",
  goal: "",
};

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not scheduled";

const formatRecurringRule = (campaign) => {
  if (!campaign?.isRecurring) {
    return "";
  }

  const unit = campaign.recurrenceUnit || "week";
  const quantity = Number(campaign.recurrenceInterval || 1);
  const suffix = quantity === 1 ? unit : `${unit}s`;

  return `Every ${quantity} ${suffix}`;
};

function DeleteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12h10l1-12" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function CampaignsListPage() {
  const toast = useContext(ToastContext);
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [statusTab, setStatusTab] = useState("all");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [broadcastOnly, setBroadcastOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadCampaigns = async (
    page = 1,
    nextStatus = statusTab,
    nextFilters = filters,
    nextRecurringOnly = recurringOnly,
    nextBroadcastOnly = broadcastOnly,
  ) => {
    setIsLoading(true);

    try {
      const activeType = nextBroadcastOnly
        ? "broadcast"
        : nextFilters.type || undefined;

      const { data } = await api.get("/campaigns", {
        params: {
          page,
          limit: 10,
          status: nextStatus,
          search: nextFilters.search || undefined,
          type: activeType,
          goal: nextFilters.goal || undefined,
          recurring: nextRecurringOnly ? "true" : undefined,
        },
      });

      setCampaigns(data.data);
      setPagination(data.pagination);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load campaigns");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns(1);
  }, []);

  const handleArchive = async (campaignId) => {
    try {
      await api.post(`/campaigns/${campaignId}/archive`);
      toast.success("Campaign archived");
      loadCampaigns(pagination.page);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to archive campaign",
      );
    }
  };

  const handlePauseResume = async (campaign) => {
    try {
      await api.post(
        `/campaigns/${campaign._id}/${campaign.status === "paused" ? "resume" : "pause"}`,
      );
      toast.success(
        campaign.status === "paused" ? "Campaign resumed" : "Campaign paused",
      );
      loadCampaigns(pagination.page);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update campaign status",
      );
    }
  };

  const handleDelete = async (campaign) => {
    const confirmed = window.confirm(
      `Delete "${campaign.name}"? This will remove its recipients, events, and activity logs.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/campaigns/${campaign._id}`);
      toast.success("Campaign deleted");

      const nextPage =
        campaigns.length === 1 && pagination.page > 1
          ? pagination.page - 1
          : pagination.page;

      loadCampaigns(nextPage);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete campaign");
    }
  };

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              eyebrow="Campaigns"
              title="Campaign command center"
              description="Plan, stage, schedule, and monitor marketing sends from one operational workspace designed for the full campaign lifecycle."
            />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">
                {pagination.total} campaigns in workspace
              </span>
              <span className="soft-pill">Draft-to-send workflow ready</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/campaigns/new?type=broadcast"
              className="rounded-xl border border-[#ddd4f2] px-5 py-3 text-center text-sm font-semibold text-[#6d28d9]"
            >
              Create broadcast
            </Link>
            <Link
              to="/campaigns/new"
              className="primary-button shrink-0 min-w-[146px] whitespace-nowrap px-5 text-center"
            >
              Create campaign
            </Link>
          </div>
        </div>
      </section>

      <section className="shell-card-strong p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setRecurringOnly(false);
                setBroadcastOnly(false);
                setStatusTab(tab);
                loadCampaigns(1, tab, filters, false);
              }}
              className={`rounded-[3px] border px-4 py-2 text-sm font-semibold capitalize transition ${
                !recurringOnly && statusTab === tab
                  ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                  : "border-[#ddd4f2] bg-white text-[#6e6787]"
              }`}
            >
              {tab === "all" ? "All campaigns" : tab}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const nextRecurringOnly = !recurringOnly;
              setRecurringOnly(nextRecurringOnly);
              if (nextRecurringOnly) {
                setBroadcastOnly(false);
              }
              if (nextRecurringOnly) {
                setStatusTab("all");
              }
              loadCampaigns(
                1,
                nextRecurringOnly ? "all" : statusTab,
                filters,
                nextRecurringOnly,
                false,
              );
            }}
            className={`rounded-[3px] border px-4 py-2 text-sm font-semibold transition ${
              recurringOnly
                ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                : "border-[#ddd4f2] bg-white text-[#6e6787]"
            }`}
          >
            Recurring campaigns
          </button>
          <button
            type="button"
            onClick={() => {
              const nextBroadcastOnly = !broadcastOnly;
              setBroadcastOnly(nextBroadcastOnly);
              setRecurringOnly(false);
              if (nextBroadcastOnly) {
                setStatusTab("all");
              }
              loadCampaigns(
                1,
                nextBroadcastOnly ? "all" : statusTab,
                filters,
                false,
                nextBroadcastOnly,
              );
            }}
            className={`rounded-[3px] border px-4 py-2 text-sm font-semibold transition ${
              broadcastOnly
                ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                : "border-[#ddd4f2] bg-white text-[#6e6787]"
            }`}
          >
            Broadcast campaigns
          </button>
        </div>

        <form
          className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            loadCampaigns(1, statusTab, filters, recurringOnly);
          }}
        >
          <input
            className="field"
            placeholder="Search by campaign name, subject, or sender"
            value={filters.search}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                search: event.target.value,
              }))
            }
          />
          <select
            className="field"
            value={filters.type}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                type: event.target.value,
              }))
            }
          >
            <option value="">All types</option>
            {campaignTypes.map((type) => (
              <option key={type} value={type}>
                {formatCampaignTypeLabel(type)}
              </option>
            ))}
          </select>
          <select
            className="field"
            value={filters.goal}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                goal: event.target.value,
              }))
            }
          >
            <option value="">All goals</option>
            {campaignGoals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
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
          <LoadingState message="Loading campaigns..." />
        ) : campaigns.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#faf7ff] text-[#7a7296]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Campaign</th>
                    <th className="px-6 py-4 font-medium">Goal</th>
                    <th className="px-6 py-4 font-medium">Audience</th>
                    <th className="px-6 py-4 font-medium">Schedule</th>
                    <th className="px-6 py-4 font-medium">Performance</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign._id}
                      className="border-b border-slate-100 align-top last:border-b-0"
                    >
                      <td className="px-6 py-5">
                        <div>
                          <Link
                            to={`/campaigns/${campaign._id}`}
                            className="text-base font-semibold text-[#2f2b3d]"
                          >
                            {campaign.name}
                          </Link>
                          <p className="mt-1 text-sm text-[#6e6787]">
                            {campaign.subject}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#9a94b2]">
                            {formatCampaignTypeLabel(campaign.type)}
                          </p>
                          {campaign.isRecurring ? (
                            <p className="mt-2 inline-flex rounded-full bg-[#f1eaff] px-3 py-1 text-xs font-semibold text-[#6d28d9]">
                              Recurring
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-[#9a94b2]">
                            Created on {formatDateTime(campaign.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 capitalize text-[#5f5878]">
                        {campaign.goal}
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>{campaign.segmentId?.name || "All subscribers"}</p>
                        <p className="mt-1 text-xs text-[#9a94b2]">
                          {campaign.totalRecipients || 0} recipients
                        </p>
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>
                          {campaign.isRecurring ? "Next run: " : ""}
                          {formatDateTime(campaign.scheduledAt)}
                        </p>
                        {campaign.isRecurring ? (
                          <p className="mt-1 text-xs text-[#9a94b2]">
                            {formatRecurringRule(campaign)}
                            {campaign.recurrenceRunCount
                              ? ` · ${campaign.recurrenceRunCount} run(s)`
                              : ""}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-[#9a94b2]">
                            Sent on:{" "}
                            {campaign.sentAt
                              ? formatDateTime(campaign.sentAt)
                              : "Not sent"}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>{campaign.totals?.delivered || 0} delivered</p>
                        <p className="mt-1 text-xs text-[#9a94b2]">
                          {campaign.totals?.opens || 0} opens |{" "}
                          {campaign.totals?.clicks || 0} clicks
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={campaign.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            className="font-medium text-[#2f2b3d]"
                            to={`/campaigns/${campaign._id}`}
                          >
                            View
                          </Link>
                          <Link
                            className="font-medium text-[#6d28d9]"
                            to={`/campaigns/${campaign._id}/edit`}
                          >
                            Edit
                          </Link>
                          {["scheduled", "paused"].includes(campaign.status) ? (
                            <button
                              type="button"
                              className="font-medium text-[#c77b08]"
                              onClick={() => handlePauseResume(campaign)}
                            >
                              {campaign.status === "paused"
                                ? "Resume"
                                : "Pause"}
                            </button>
                          ) : null}
                          {campaign.status !== "archived" ? (
                            <button
                              type="button"
                              className="font-medium text-[#8b84a5]"
                              onClick={() => handleArchive(campaign._id)}
                            >
                              Archive
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 text-rose-600 transition hover:bg-rose-50"
                            onClick={() => handleDelete(campaign)}
                            aria-label={`Delete ${campaign.name}`}
                            title="Delete campaign"
                          >
                            <DeleteIcon />
                          </button>
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
                  onClick={() => loadCampaigns(pagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadCampaigns(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              title={
                broadcastOnly
                  ? "No broadcast campaigns yet"
                  : recurringOnly
                    ? "No recurring campaigns yet"
                    : "No campaigns match these filters"
              }
              description={
                broadcastOnly
                  ? "Create a broadcast campaign to see it here."
                  : recurringOnly
                    ? "Create a recurring campaign from the form, or switch back to all campaigns to continue."
                    : "Create a new campaign, loosen the filters, or switch to another status tab to continue."
              }
              action={
                <Link
                  to={
                    broadcastOnly
                      ? "/campaigns/new?type=broadcast"
                      : "/campaigns/new"
                  }
                  className="primary-button"
                >
                  {broadcastOnly ? "Create broadcast" : "Create campaign"}
                </Link>
              }
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default CampaignsListPage;
