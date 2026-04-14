import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../components/ui/LoadingState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import {
  campaignGoals,
  campaignStatuses,
  campaignTypes,
  formatCampaignTypeLabel,
} from "../../data/campaigns.js";
import { api } from "../../lib/api.js";
import {
  formatLocalDateTimeInput,
  toDateTimeLocalInput,
  toIsoStringFromLocalInput,
} from "../../lib/datetime.js";

const createInitialForm = () => ({
  name: "",
  type: "",
  goal: "",
  subject: "",
  previewText: "",
  fromName: "",
  fromEmail: "",
  replyTo: "",
  templateId: "",
  segmentId: "",
  status: "",
  scheduledAt: "",
  isRecurring: false,
  recurrenceInterval: 1,
  recurrenceUnit: "week",
});

const FormField = ({ label, className = "", children }) => (
  <label className={`block space-y-2 ${className}`}>
    <span className="text-sm font-semibold text-[#2f2b3d]">{label}</span>
    {children}
  </label>
);

const formatRecurrenceLabel = (interval, unit) => {
  const quantity = Number(interval || 1);
  const normalizedUnit = unit || "week";
  const suffix = quantity === 1 ? normalizedUnit : `${normalizedUnit}s`;

  return `Every ${quantity} ${suffix}`;
};

const formatAudienceLabel = (segmentName) => segmentName || "All subscribers";

function CampaignFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const [form, setForm] = useState(createInitialForm());
  const [templates, setTemplates] = useState([]);
  const [segments, setSegments] = useState([]);
  const [meta, setMeta] = useState({
    types: campaignTypes,
    goals: campaignGoals,
    statuses: campaignStatuses,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const broadcastPreset =
    new URLSearchParams(location.search).get("type") === "broadcast";
  const isBroadcastCampaign =
    form.type === "broadcast" || (!id && broadcastPreset);
  const audienceLabel = formatAudienceLabel(
    segments.find((segment) => segment._id === form.segmentId)?.name,
  );

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [metaResponse, templatesResponse, segmentsResponse] =
          await Promise.all([
            api.get("/campaigns/meta"),
            api.get("/templates"),
            api.get("/segments"),
          ]);

        setMeta(metaResponse.data);
        setTemplates(templatesResponse.data);
        setSegments(segmentsResponse.data);

        if (id) {
          const { data } = await api.get(`/campaigns/${id}`);
          setForm({
            name: data.name || "",
            type: data.type || "promotional",
            goal: data.goal || "clicks",
            subject: data.subject || "",
            previewText: data.previewText || "",
            fromName: data.fromName || "",
            fromEmail: data.fromEmail || "",
            replyTo: data.replyTo || "",
            templateId: data.templateId?._id || "",
            segmentId: data.segmentId?._id || "",
            status: data.status || "draft",
            scheduledAt: toDateTimeLocalInput(data.scheduledAt),
            isRecurring: Boolean(data.isRecurring),
            recurrenceInterval: data.recurrenceInterval || 1,
            recurrenceUnit: data.recurrenceUnit || "week",
          });
        } else if (broadcastPreset) {
          setForm((current) => ({
            ...current,
            type: "broadcast",
            goal: current.goal || "clicks",
            segmentId: "",
            isRecurring: false,
          }));
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            "Unable to load campaign form",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadDependencies();
  }, [broadcastPreset, id]);

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Campaign name is required";
    }

    if (!form.type) {
      return "Please choose what kind of campaign this is";
    }

    if (!form.subject.trim()) {
      return "Subject line is required";
    }

    if (!form.fromName.trim() || !form.fromEmail.trim()) {
      return "From name and from email are required";
    }

    if (!form.templateId) {
      return "Please select a template for this campaign";
    }

    return "";
  };

  const saveCampaign = async (
    nextStatus = form.status,
    { redirectAfterSave = true } = {},
  ) => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const effectiveStatus = form.isRecurring
        ? "scheduled"
        : nextStatus || "draft";
      const payload = {
        ...form,
        status: effectiveStatus,
        segmentId: form.segmentId || null,
        scheduledAt: toIsoStringFromLocalInput(form.scheduledAt) || null,
        isRecurring: Boolean(form.isRecurring),
        recurrenceInterval: Number(form.recurrenceInterval || 1),
        recurrenceUnit: form.recurrenceUnit || "week",
      };

      if (id) {
        await api.put(`/campaigns/${id}`, payload);
        toast.success(
          effectiveStatus === "draft" ? "Draft updated" : "Campaign updated",
        );
      } else {
        const { data } = await api.post("/campaigns", payload);
        toast.success(
          effectiveStatus === "draft" ? "Draft saved" : "Campaign created",
        );

        if (!redirectAfterSave) {
          return data;
        }

        if (effectiveStatus === "draft") {
          navigate(`/campaigns/${data._id}`);
          return data;
        }
      }

      if (redirectAfterSave) {
        navigate("/campaigns");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save campaign",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a test email address");
      return;
    }

    setIsSendingTest(true);

    try {
      let campaignId = id;

      if (!campaignId) {
        const savedCampaign = await saveCampaign(
          form.isRecurring ? "scheduled" : "draft",
          {
            redirectAfterSave: false,
          },
        );

        campaignId = savedCampaign?._id;
      }

      if (!campaignId) {
        toast.error("Save the campaign before sending a test");
        return;
      }

      await api.post(`/email/campaigns/${campaignId}/send-test`, {
        email: testEmail,
      });
      toast.success("Test email sent");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "Unable to send test email",
      );
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading campaign editor..." />;
  }

  return (
    <div className="space-y-6 ">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <PageHeader
              eyebrow="Campaigns"
              title={
                isBroadcastCampaign
                  ? id
                    ? "Edit broadcast campaign"
                    : "Broadcast campaign"
                  : id
                    ? "Edit campaign"
                    : "Create new campaign"
              }
              description={
                isBroadcastCampaign
                  ? "Create a one-time broadcast to all subscribers or a selected segment."
                  : undefined
              }
            />
            <div className="flex flex-wrap gap-2">
              <span className="soft-pill">Template-driven send setup</span>
              <span className="soft-pill">Lifecycle state managed</span>
            </div>
          </div>
          <Link
            to="/campaigns"
            className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
          >
            Back to campaigns
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] xl:items-start">
        <form
          className="shell-card-strong space-y-6 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            saveCampaign(form.status || "draft");
          }}
        >
          <div className="grid gap-4 md:grid-cols-2 ">
            <FormField label="Campaign name">
              <input
                className="field"
                placeholder="For example: April product update"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Campaign type">
              <select
                className="field"
                value={form.type}
                onChange={(event) => {
                  const nextType = event.target.value;
                  setForm((current) => ({
                    ...current,
                    type: nextType,
                    isRecurring:
                      nextType === "broadcast" ? false : current.isRecurring,
                  }));
                }}
              >
                <option value="">Choose a type</option>
                {meta.types.map((type) => (
                  <option key={type} value={type}>
                    {formatCampaignTypeLabel(type)}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Campaign goal">
              <select
                className="field"
                value={form.goal}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    goal: event.target.value,
                  }))
                }
              >
                <option value="">Choose a goal</option>
                {meta.goals.map((goal) => (
                  <option key={goal} value={goal}>
                    {goal}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Send status">
              <select
                className="field"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <option value="">Not selected yet</option>
                {meta.statuses
                  .filter((status) => status !== "archived")
                  .map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
              </select>
            </FormField>

            <FormField label="Subject line" className="md:col-span-2">
              <input
                className="field"
                placeholder="For example: A quick update from SellersLogin"
                value={form.subject}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Preview text" className="md:col-span-2">
              <input
                className="field"
                placeholder="For example: One small update and a helpful link"
                value={form.previewText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    previewText: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="From name">
              <input
                className="field"
                placeholder="For example: SellersLogin"
                value={form.fromName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fromName: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="From email">
              <input
                className="field"
                placeholder="For example: support@sellerslogin.com"
                type="email"
                value={form.fromEmail}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    fromEmail: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Reply-to">
              <input
                className="field"
                placeholder="Optional reply email"
                type="email"
                value={form.replyTo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    replyTo: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField
              label={form.isRecurring ? "First send time" : "Send time"}
            >
              <input
                className="field"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    scheduledAt: event.target.value,
                  }))
                }
              />
            </FormField>

            <FormField label="Template">
              <select
                className="field"
                value={form.templateId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    templateId: event.target.value,
                  }))
                }
              >
                <option value="">Choose a template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Audience">
              <div className="space-y-2">
                <select
                  className="field"
                  value={form.segmentId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      segmentId: event.target.value,
                    }))
                  }
                >
                  <option value="">All subscribers</option>
                  {segments.map((segment) => (
                    <option key={segment._id} value={segment._id}>
                      {segment.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#9a94b2]">
                  Leave this blank to send to all subscribers, or choose a
                  segment for targeted broadcast.
                </p>
              </div>
            </FormField>

            {!isBroadcastCampaign ? (
              <div className="md:col-span-2 rounded-[24px] border border-[#ece6f8] bg-[#faf7ff] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#2f2b3d]">
                      Recurring campaign
                    </p>
                    <p className="mt-1 text-sm text-[#6e6787]">
                      {formatRecurrenceLabel(
                        form.recurrenceInterval,
                        form.recurrenceUnit,
                      )}
                      . Recurring campaigns are saved as scheduled automatically
                      and re-check the selected audience on every run.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-[#ddd4f2] bg-white px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.isRecurring}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isRecurring: event.target.checked,
                        }))
                      }
                    />
                    <span className="text-sm font-semibold text-[#2f2b3d]">
                      {form.isRecurring ? "Enabled" : "Off"}
                    </span>
                  </label>
                </div>

                {form.isRecurring ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr]">
                    <FormField label="Repeat every">
                      <div className="grid gap-3 md:grid-cols-[120px_1fr]">
                        <input
                          className="field"
                          type="number"
                          min="1"
                          value={form.recurrenceInterval}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              recurrenceInterval: event.target.value,
                            }))
                          }
                        />
                        <select
                          className="field"
                          value={form.recurrenceUnit}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              recurrenceUnit: event.target.value,
                            }))
                          }
                        >
                          <option value="day">Day</option>
                          <option value="week">Week</option>
                          <option value="month">Month</option>
                        </select>
                      </div>
                    </FormField>
                    <div className="rounded-2xl border border-dashed border-[#ddd4f2] bg-white p-4 text-sm text-[#6e6787]">
                      {formatRecurrenceLabel(
                        form.recurrenceInterval,
                        form.recurrenceUnit,
                      )}
                      . Recurring sends use the current live audience at send
                      time, so new matching subscribers can be included in
                      future runs.
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
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
              onClick={() =>
                saveCampaign(form.isRecurring ? "scheduled" : "draft")
              }
            >
              {isSubmitting
                ? "Saving..."
                : form.isRecurring
                  ? "Save recurring"
                  : "Save as draft"}
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : id
                  ? "Update campaign"
                  : "Create campaign"}
            </button>
          </div>
        </form>

        <div className="space-y-6 xl:sticky xl:top-6">
          <section className="shell-card-strong p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
              Campaign summary
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#2f2b3d]">
              Quick glance
            </h3>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  Audience
                </p>
                <p className="mt-2 text-sm font-medium text-[#2f2b3d]">
                  {audienceLabel}
                </p>
              </div>
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  Send mode
                </p>
                <p className="mt-2 text-sm font-medium text-[#2f2b3d]">
                  {form.isRecurring
                    ? `${formatRecurrenceLabel(form.recurrenceInterval, form.recurrenceUnit)}`
                    : "One-time send"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#faf7ff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
                  First send time
                </p>
                <p className="mt-2 text-sm font-medium text-[#2f2b3d]">
                  {form.scheduledAt
                    ? formatLocalDateTimeInput(form.scheduledAt)
                    : "Not scheduled yet"}
                </p>
              </div>
            </div>
          </section>

          <section className="shell-card-strong p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
              Test send
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#2f2b3d]">
              Send a preview email
            </h3>
            <p className="mt-2 text-sm text-[#6e6787]">
              Use this to verify the template and content before launching the
              broadcast.
            </p>
            <div className="mt-4 space-y-3">
              <input
                className="field"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
              />
              <button
                type="button"
                className="primary-button w-full"
                disabled={isSendingTest || isSubmitting}
                onClick={handleSendTest}
              >
                {isSendingTest ? "Sending..." : "Send test email"}
              </button>
              {!id ? (
                <p className="text-xs text-[#9a94b2]">
                  New campaigns are saved automatically before the test is sent.
                </p>
              ) : null}
            </div>
          </section>

          <section className="shell-card-strong p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
              Checklist
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#2f2b3d]">
              Before you save
            </h3>
            <div className="mt-4 space-y-4 text-sm text-[#6e6787]">
              <p>
                1. Confirm the template matches the campaign goal and subject
                line.
              </p>
              <p>
                2. Use a segment only when targeting should be narrowed;
                otherwise all subscribers are included.
              </p>
              <p>
                3. Turn on recurring only when you want this campaign to repeat
                automatically.
              </p>
            </div>
          </section>

          <section className="shell-card-strong p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a94b2]">
              Notes
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#2f2b3d]">
              How it behaves
            </h3>
            <div className="mt-4 space-y-4 rounded-2xl bg-[#faf7ff] p-4 text-sm text-[#6e6787]">
              <p>Recurring sends always re-check the audience at send time.</p>
              <p>
                Suppressed and unsubscribed users stay excluded automatically.
              </p>
              <p>
                You can keep this campaign as a draft until everything is ready.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CampaignFormPage;
