import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState.jsx";
import LoadingState from "../../components/ui/LoadingState.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import StatusBadge from "../../components/ui/StatusBadge.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";

const initialFilters = {
  search: "",
  status: "",
  source: "",
  tags: "",
};

const formatLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatCurrency = (value) => `$${Number(value || 0).toFixed(2)}`;

const parseCsvPreview = (content = "") => {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      headers: [],
      rows: [],
      duplicates: [],
      invalidRows: [],
      validCount: 0,
    };
  }

  const headers = lines[0].split(",").map((value) => value.trim());
  const rows = [];
  const duplicates = new Set();
  const seenEmails = new Set();
  const invalidRows = [];

  lines.slice(1).forEach((line, index) => {
    const values = line.split(",").map((value) => value.trim());
    const row = headers.reduce((accumulator, header, headerIndex) => {
      accumulator[header] = values[headerIndex] || "";
      return accumulator;
    }, {});

    const email = String(row.email || "")
      .trim()
      .toLowerCase();
    const firstName = String(row.firstName || "").trim();
    const lastName = String(row.lastName || "").trim();
    const hasRequiredFields = firstName && lastName && email;
    const isDuplicate = email && seenEmails.has(email);

    if (email) {
      seenEmails.add(email);
    }

    if (isDuplicate) {
      duplicates.add(email);
    }

    if (!hasRequiredFields) {
      invalidRows.push(index + 2);
    }

    rows.push({
      rowNumber: index + 2,
      email: row.email || "",
      firstName: row.firstName || "",
      lastName: row.lastName || "",
      source: row.source || "",
      isDuplicate,
      isValid: hasRequiredFields,
    });
  });

  return {
    headers,
    rows,
    duplicates: Array.from(duplicates),
    invalidRows,
    validCount: rows.filter((row) => row.isValid).length,
  };
};

const exportSubscribersToCsv = (subscribers) => {
  const headers = [
    "firstName",
    "lastName",
    "email",
    "status",
    "source",
    "tags",
    "city",
    "state",
    "country",
    "totalOrders",
    "totalSpent",
    "engagementScore",
  ];

  const rows = subscribers.map((subscriber) =>
    headers
      .map((header) => {
        const value =
          header === "tags"
            ? (subscriber.tags || []).join("|")
            : subscriber[header];
        return `"${String(value ?? "").replaceAll('"', '""')}"`;
      })
      .join(","),
  );

  const blob = new Blob([`${headers.join(",")}\n${rows.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "selected-subscribers.csv";
  anchor.click();
  URL.revokeObjectURL(url);
};

function AudienceListPage() {
  const toast = useContext(ToastContext);
  const [filters, setFilters] = useState(initialFilters);
  const [subscribers, setSubscribers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    activeCount: 0,
    riskCount: 0,
    averageEngagementScore: 0,
    totalOrders: 0,
    totalSpent: 0,
    byStatus: {},
    bySource: [],
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTags, setBulkTags] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [csvPreview, setCsvPreview] = useState({
    headers: [],
    rows: [],
    duplicates: [],
    invalidRows: [],
    validCount: 0,
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const selectedCount = selectedIds.length;

  const loadSubscribers = async (page = 1, nextFilters = filters) => {
    setIsLoading(true);

    try {
      const [listResult, summaryResult] = await Promise.allSettled([
        api.get("/subscribers", {
          params: {
            page,
            limit: 12,
            search: nextFilters.search || undefined,
            status: nextFilters.status || undefined,
            source: nextFilters.source || undefined,
            tags: nextFilters.tags || undefined,
          },
        }),
        api.get("/subscribers/summary"),
      ]);

      if (listResult.status === "fulfilled") {
        setSubscribers(listResult.value.data.data);
        setPagination(listResult.value.data.pagination);
      } else {
        toast.error(
          listResult.reason?.response?.data?.message ||
            "Unable to load subscribers",
        );
      }

      if (summaryResult.status === "fulfilled") {
        setSummary(summaryResult.value.data);
      } else {
        console.warn("Subscriber summary failed to load", summaryResult.reason);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load subscribers",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers(1);
  }, []);

  const selectedSubscribers = useMemo(
    () =>
      subscribers.filter((subscriber) => selectedIds.includes(subscriber._id)),
    [selectedIds, subscribers],
  );

  useEffect(() => {
    if (!isImportOpen) {
      return;
    }

    setCsvPreview(parseCsvPreview(csvContent));
  }, [csvContent, isImportOpen]);

  const handleStatusUpdate = async (subscriberId, status) => {
    try {
      const subscriber = subscribers.find((item) => item._id === subscriberId);
      if (!subscriber) return;

      await api.put(`/subscribers/${subscriberId}`, {
        ...subscriber,
        status,
      });

      toast.success(
        `Subscriber marked as ${formatLabel(status).toLowerCase()}`,
      );
      loadSubscribers(pagination.page);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update subscriber status",
      );
    }
  };

  const applyQuickFilter = (nextFilters) => {
    setFilters(nextFilters);
    setSelectedIds([]);
    loadSubscribers(1, nextFilters);
  };

  const toggleSelection = (subscriberId) => {
    setSelectedIds((current) =>
      current.includes(subscriberId)
        ? current.filter((id) => id !== subscriberId)
        : [...current, subscriberId],
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = subscribers.map((subscriber) => subscriber._id);

    if (visibleIds.every((id) => selectedIds.includes(id))) {
      setSelectedIds((current) =>
        current.filter((id) => !visibleIds.includes(id)),
      );
      return;
    }

    setSelectedIds((current) =>
      Array.from(new Set([...current, ...visibleIds])),
    );
  };

  const runBulkAction = async (action) => {
    if (!selectedIds.length) {
      toast.error("Select at least one subscriber");
      return;
    }

    try {
      if (action === "tags") {
        await api.post("/subscribers/bulk/tags", {
          subscriberIds: selectedIds,
          tags: bulkTags,
        });
        setBulkTags("");
        toast.success("Bulk tags applied");
      }

      if (action === "unsubscribe") {
        await api.post("/subscribers/bulk/unsubscribe", {
          subscriberIds: selectedIds,
        });
        toast.success("Subscribers unsubscribed");
      }

      if (action === "suppress") {
        await api.post("/subscribers/bulk/suppress", {
          subscriberIds: selectedIds,
        });
        toast.success("Subscribers suppressed");
      }

      if (action === "reactivate") {
        await api.post("/subscribers/bulk/reactivate", {
          subscriberIds: selectedIds,
        });
        toast.success("Subscribers reactivated");
      }

      setSelectedIds([]);
      loadSubscribers(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || "Bulk action failed");
    }
  };

  const handleExportSelected = () => {
    if (!selectedSubscribers.length) {
      toast.error("Select at least one subscriber");
      return;
    }

    exportSubscribersToCsv(selectedSubscribers);
    toast.success("Selected subscribers exported");
  };

  const handleImportCsv = async (event) => {
    event.preventDefault();

    try {
      const { data } = await api.post("/subscribers/import/csv", {
        csvContent,
      });
      toast.success(
        `${data.importedCount} imported, ${data.updatedCount} updated`,
      );
      setIsImportOpen(false);
      setCsvContent("");
      setCsvPreview({
        headers: [],
        rows: [],
        duplicates: [],
        invalidRows: [],
        validCount: 0,
      });
      loadSubscribers(1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to import CSV");
    }
  };

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              eyebrow="Audience"
              title="Contacts"
              description="Manage contacts, imports, status changes, and engagement context from one CRM-style workspace."
            />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">
                {summary.total || pagination.total} contacts
              </span>
            </div>
          </div>
          <div className="flex flex-nowrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="secondary-button shrink-0 whitespace-nowrap"
            >
              Import CSV
            </button>
            <Link
              to="/audience/new"
              className="primary-button shrink-0 whitespace-nowrap"
            >
              Add subscriber
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total contacts", summary.total || pagination.total],
          ["Active contacts", summary.activeCount],
          ["At-risk contacts", summary.riskCount],
          ["Avg engagement", summary.averageEngagementScore],
        ].map(([label, value]) => (
          <article
            key={label}
            className="metric-card bg-gradient-to-br from-white to-[#faf7ff]"
          >
            <div className="p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#7a7296]">
                {label}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-[#2f2b3d]">
                {value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="shell-card-strong p-5 md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#2f2b3d]">
              Quick filters
            </h3>
            <p className="mt-1 text-sm text-[#6e6787]">
              Jump to common audience slices without rebuilding the search form.
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-[#ddd4f2] px-4 py-2 text-sm font-medium text-[#5f5878]"
            onClick={() => applyQuickFilter(initialFilters)}
          >
            Clear filters
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "Active", status: "subscribed", tone: "emerald" },
            {
              label: "At risk",
              status: "unsubscribed,bounced,complained,suppressed",
              tone: "amber",
            },
            { label: "Suppressed", status: "suppressed", tone: "slate" },
            { label: "Unsubscribed", status: "unsubscribed", tone: "orange" },
            { label: "Bounced", status: "bounced", tone: "rose" },
          ].map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter.tone === "emerald"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : filter.tone === "amber"
                    ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : filter.tone === "slate"
                      ? "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      : filter.tone === "orange"
                        ? "border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
                        : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
              onClick={() =>
                applyQuickFilter({
                  ...initialFilters,
                  status: filter.status || "",
                  tags: filter.tags || "",
                })
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      {selectedCount ? (
        <section className="shell-card-strong p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">{selectedCount} selected</span>
              {selectedSubscribers.slice(0, 3).map((subscriber) => (
                <span key={subscriber._id} className="soft-pill">
                  {subscriber.firstName} {subscriber.lastName}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="field md:w-[240px]"
                placeholder="Add tags to selection"
                value={bulkTags}
                onChange={(event) => setBulkTags(event.target.value)}
              />
              <button
                type="button"
                className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-semibold text-[#5f5878]"
                onClick={() => runBulkAction("tags")}
              >
                Assign tags
              </button>
              <button
                type="button"
                className="rounded-xl border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700"
                onClick={() => runBulkAction("unsubscribe")}
              >
                Bulk unsubscribe
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                onClick={() => runBulkAction("suppress")}
              >
                Bulk suppress
              </button>
              <button
                type="button"
                className="rounded-xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700"
                onClick={() => runBulkAction("reactivate")}
              >
                Bulk reactivate
              </button>
              <button
                type="button"
                className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-semibold text-[#5f5878]"
                onClick={handleExportSelected}
              >
                Export selected
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell-card-strong overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading CRM records..." />
        ) : subscribers.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-[#faf7ff] text-[#7a7296]">
                  <tr>
                    <th className="px-6 py-4 font-medium">
                      <input
                        type="checkbox"
                        checked={
                          subscribers.length > 0 &&
                          subscribers.every((subscriber) =>
                            selectedIds.includes(subscriber._id),
                          )
                        }
                        onChange={toggleSelectAllVisible}
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Subscriber</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Source / location</th>
                    <th className="px-6 py-4 font-medium">Value</th>
                    <th className="px-6 py-4 font-medium">Engagement</th>
                    <th className="px-6 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr
                      key={subscriber._id}
                      className="border-b border-slate-100 align-top"
                    >
                      <td className="px-6 py-5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(subscriber._id)}
                          onChange={() => toggleSelection(subscriber._id)}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#2f2b3d]">
                          {subscriber.firstName} {subscriber.lastName}
                        </div>
                        <div className="mt-1 text-[#6e6787]">
                          {subscriber.email}
                        </div>
                        {subscriber.notes ? (
                          <div className="mt-2 max-w-[320px] text-xs leading-5 text-[#9a94b2]">
                            {subscriber.notes}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(subscriber.tags || []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-[#f1eaff] px-3 py-1 text-xs font-medium text-[#6d28d9]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={subscriber.status} />
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>{formatLabel(subscriber.source)}</p>
                        <p className="mt-2 text-xs text-[#9a94b2]">
                          {[
                            subscriber.city,
                            subscriber.state,
                            subscriber.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "No location"}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>{subscriber.totalOrders} orders</p>
                        <p className="mt-2 text-xs text-[#9a94b2]">
                          ${Number(subscriber.totalSpent || 0).toFixed(2)} total
                          spent
                        </p>
                      </td>
                      <td className="px-6 py-5 text-[#5f5878]">
                        <p>Score {subscriber.engagementScore || 0}</p>
                        <p className="mt-2 text-xs text-[#9a94b2]">
                          Last activity{" "}
                          {subscriber.lastActivityAt
                            ? new Date(
                                subscriber.lastActivityAt,
                              ).toLocaleDateString()
                            : "not recorded"}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            className="font-medium text-[#2f2b3d]"
                            to={`/audience/${subscriber._id}`}
                          >
                            View
                          </Link>
                          <Link
                            className="font-medium text-[#6d28d9]"
                            to={`/audience/${subscriber._id}/edit`}
                          >
                            Edit
                          </Link>
                          {subscriber.status !== "subscribed" ? (
                            <button
                              type="button"
                              className="font-medium text-emerald-600"
                              onClick={() =>
                                handleStatusUpdate(subscriber._id, "subscribed")
                              }
                            >
                              Reactivate
                            </button>
                          ) : null}
                          {subscriber.status !== "unsubscribed" ? (
                            <button
                              type="button"
                              className="font-medium text-amber-700"
                              onClick={() =>
                                handleStatusUpdate(
                                  subscriber._id,
                                  "unsubscribed",
                                )
                              }
                            >
                              Unsubscribe
                            </button>
                          ) : null}
                          {subscriber.status !== "suppressed" ? (
                            <button
                              type="button"
                              className="font-medium text-slate-600"
                              onClick={() =>
                                handleStatusUpdate(subscriber._id, "suppressed")
                              }
                            >
                              Suppress
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 text-sm text-[#6e6787]">
              <span>{pagination.total} subscribers</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page <= 1}
                  onClick={() => loadSubscribers(pagination.page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-2 disabled:opacity-50"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadSubscribers(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6">
            <EmptyState
              title="No subscribers found"
              description="Import a CSV, add a subscriber manually, or loosen your filters to start building the audience CRM."
              action={
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(true)}
                    className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
                  >
                    Import CSV
                  </button>
                  <Link to="/audience/new" className="primary-button">
                    Add subscriber
                  </Link>
                </div>
              }
            />
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <article className="shell-card-strong p-5 md:p-6">
          <h3 className="text-lg font-semibold text-[#2f2b3d]">Top sources</h3>
          <div className="mt-5 space-y-3">
            {summary.bySource.length ? (
              summary.bySource.map((item) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between rounded-2xl bg-[#faf7ff] p-4"
                >
                  <p className="text-sm font-medium text-[#2f2b3d]">
                    {formatLabel(item.source)}
                  </p>
                  <span className="soft-pill">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6e6787]">
                Source breakdown will appear once contacts are loaded.
              </p>
            )}
          </div>
        </article>

        <article className="shell-card-strong p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#2f2b3d]">
                Audience health
              </h3>
              <p className="mt-1 text-sm text-[#6e6787]">
                Top contact counts and list quality signals.
              </p>
            </div>
            <span className="soft-pill">{summary.totalOrders || 0} orders</span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Subscribed", summary.byStatus?.subscribed || 0],
              ["Unsubscribed", summary.byStatus?.unsubscribed || 0],
              ["Bounced", summary.byStatus?.bounced || 0],
              ["Complained", summary.byStatus?.complained || 0],
              ["Suppressed", summary.byStatus?.suppressed || 0],
              ["Revenue", formatCurrency(summary.totalSpent)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#2f2b3d]">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      {isImportOpen ? (
        <Modal
          title="Import subscribers from CSV"
          description="Paste a simple CSV with headers like firstName,lastName,email,source,tags,totalOrders,totalSpent."
          onClose={() => {
            setIsImportOpen(false);
            setCsvContent("");
            setCsvPreview({
              headers: [],
              rows: [],
              duplicates: [],
              invalidRows: [],
              validCount: 0,
            });
          }}
        >
          <form className="space-y-4" onSubmit={handleImportCsv}>
            <textarea
              className="field min-h-[220px] resize-y"
              value={csvContent}
              onChange={(event) => setCsvContent(event.target.value)}
              placeholder="firstName,lastName,email,source,tags&#10;Ava,Shah,ava@example.com,lead_magnet,VIP"
            />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  Rows
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2b3d]">
                  {csvPreview.rows.length}
                </p>
              </div>
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  Valid
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2b3d]">
                  {csvPreview.validCount}
                </p>
              </div>
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  Duplicates
                </p>
                <p className="mt-2 text-lg font-semibold text-[#2f2b3d]">
                  {csvPreview.duplicates.length}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#eee7fb] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                Import review
              </p>
              <div className="mt-3 space-y-3">
                {csvPreview.rows.length ? (
                  csvPreview.rows.slice(0, 5).map((row) => (
                    <div
                      key={row.rowNumber}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf7ff] p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#2f2b3d]">
                          Row {row.rowNumber}: {row.firstName} {row.lastName}
                        </p>
                        <p className="mt-1 text-xs text-[#6e6787]">
                          {row.email}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.isValid ? (
                          <span className="soft-pill">Valid</span>
                        ) : (
                          <span className="soft-pill">
                            Missing required fields
                          </span>
                        )}
                        {row.isDuplicate ? (
                          <span className="soft-pill">Duplicate email</span>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#6e6787]">
                    Paste CSV content to see a quick import review.
                  </p>
                )}
              </div>
              {csvPreview.invalidRows.length || csvPreview.duplicates.length ? (
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#6e6787]">
                  {csvPreview.invalidRows.length ? (
                    <span className="soft-pill">
                      Invalid rows: {csvPreview.invalidRows.join(", ")}
                    </span>
                  ) : null}
                  {csvPreview.duplicates.length ? (
                    <span className="soft-pill">
                      Duplicate emails: {csvPreview.duplicates.join(", ")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="flex justify-end">
              <button type="submit" className="primary-button">
                Import CSV
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

export default AudienceListPage;
