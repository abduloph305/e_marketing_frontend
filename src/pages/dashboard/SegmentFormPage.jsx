import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../components/ui/LoadingState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import { operatorOptions, segmentFieldOptions } from "../../data/audience.js";
import { getSegmentPreset } from "../../data/segmentPresets.js";
import { api } from "../../lib/api.js";

const createRule = () => ({
  field: "status",
  operator: "eq",
  value: "",
});

const needsValue = (field) =>
  !["cartAbandoners", "firstTimeBuyers", "openedButDidNotClick"].includes(
    field,
  );

function SegmentFormPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const presetId = new URLSearchParams(location.search).get("preset");
  const preset = !id ? getSegmentPreset(presetId) : null;
  const initialRules = preset?.rules?.length
    ? preset.rules.map((rule) => ({ ...rule }))
    : [createRule()];
  const [name, setName] = useState(() => preset?.name || "");
  const [description, setDescription] = useState(
    () => preset?.description || "",
  );
  const [rules, setRules] = useState(() =>
    initialRules.map((rule) => ({ ...rule })),
  );
  const [previewCount, setPreviewCount] = useState(0);
  const [previewSubscribers, setPreviewSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadSegment = async () => {
      try {
        const { data } = await api.get(`/segments/${id}`);
        setName(data.name);
        setDescription(data.description || "");
        const nextRules = data.rules.length ? data.rules : [createRule()];
        setRules(nextRules);
        setPreviewCount(data.previewCount || 0);
        await refreshPreview(nextRules);
      } finally {
        setIsLoading(false);
      }
    };

    loadSegment();
  }, [id]);

  const cleanedRules = (nextRules = rules) =>
    nextRules.filter(
      (rule) =>
        rule.field &&
        rule.operator &&
        (!needsValue(rule.field) || String(rule.value).trim()),
    );

  const refreshPreview = async (nextRules = rules) => {
    try {
      const { data } = await api.post("/segments/preview", {
        rules: cleanedRules(nextRules),
      });
      setPreviewCount(data.previewCount);
      setPreviewSubscribers(data.sampleSubscribers || []);
    } catch (_error) {
      setPreviewCount(0);
      setPreviewSubscribers([]);
    }
  };

  useEffect(() => {
    if (!id) {
      refreshPreview(initialRules);
    }
  }, []);

  const handleRuleChange = (index, key, value) => {
    const nextRules = rules.map((rule, ruleIndex) => {
      if (ruleIndex !== index) {
        return rule;
      }

      if (key === "field") {
        const fallbackOperator = operatorOptions[value]?.[0]?.value || "eq";
        return {
          field: value,
          operator: fallbackOperator,
          value: needsValue(value) ? "" : "true",
        };
      }

      return { ...rule, [key]: value };
    });

    setRules(nextRules);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Segment name is required");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name,
      description,
      rules: cleanedRules(),
    };

    try {
      if (id) {
        await api.put(`/segments/${id}`, payload);
        toast.success("Segment updated");
      } else {
        await api.post("/segments", payload);
        toast.success("Segment created");
      }

      navigate("/segments");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save segment",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading segment..." />;
  }

  return (
    <div className="space-y-6">
      <section className="shell-card-strong p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow="Segments"
            title={
              id
                ? "Edit segment"
                : preset
                  ? "Create segment from preset"
                  : "Create CRM segment"
            }
            description={
              preset
                ? preset.description
                : "Build stronger audience logic with lifecycle, value, engagement, location, and placeholder commerce rules."
            }
          />
          <Link
            to="/segments"
            className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
          >
            Back to segments
          </Link>
        </div>
      </section>

      <form
        className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"
        onSubmit={handleSubmit}
      >
        <section className="shell-card-strong space-y-6 p-6">
          <input
            className="field"
            placeholder="Segment name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <textarea
            className="field min-h-[110px] resize-y"
            placeholder="Short description for the team"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />

          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="grid gap-3 md:grid-cols-[1fr_1fr_1.15fr_auto]"
              >
                <select
                  className="field"
                  value={rule.field}
                  onChange={(event) =>
                    handleRuleChange(index, "field", event.target.value)
                  }
                >
                  {segmentFieldOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="field"
                  value={rule.operator}
                  onChange={(event) =>
                    handleRuleChange(index, "operator", event.target.value)
                  }
                >
                  {(operatorOptions[rule.field] || []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {needsValue(rule.field) ? (
                  <input
                    className="field"
                    placeholder="Value"
                    value={rule.value}
                    onChange={(event) =>
                      handleRuleChange(index, "value", event.target.value)
                    }
                  />
                ) : (
                  <div className="field flex items-center text-sm text-[#8b84a5]">
                    Rule uses built-in logic
                  </div>
                )}

                <button
                  type="button"
                  className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
                  onClick={() =>
                    setRules((current) =>
                      current.filter((_, ruleIndex) => ruleIndex !== index),
                    )
                  }
                  disabled={rules.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
              onClick={() => setRules((current) => [...current, createRule()])}
            >
              Add rule
            </button>
            <div className="flex items-center gap-3">
              <span className="soft-pill">Preview count: {previewCount}</span>
              <button
                type="button"
                className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
                onClick={() => refreshPreview()}
              >
                Refresh preview
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Saving..."
                : id
                  ? "Update segment"
                  : "Create segment"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          {preset ? (
            <article className="shell-card-strong p-6">
              <h3 className="text-xl font-semibold text-[#2f2b3d]">
                Preset loaded
              </h3>
              <p className="mt-2 text-sm text-[#6e6787]">
                Starting with{" "}
                <span className="font-medium text-[#2f2b3d]">
                  {preset.name}
                </span>
                . Refine the rules before saving.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {preset.rules.map((rule) => (
                  <span
                    key={`${preset.id}-${rule.field}`}
                    className="soft-pill"
                  >
                    {rule.field} {rule.operator} {rule.value}
                  </span>
                ))}
              </div>
            </article>
          ) : null}

          <article className="shell-card-strong p-6">
            <h3 className="text-xl font-semibold text-[#2f2b3d]">
              Suggested segment plays
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Repeat buyers",
                "Inactive users",
                "High value customers",
                "Opened but did not click",
                "Cart abandoners placeholder",
              ].map((item) => (
                <span key={item} className="soft-pill">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <article className="shell-card-strong p-6">
            <h3 className="text-xl font-semibold text-[#2f2b3d]">
              Builder guidance
            </h3>
            <div className="mt-4 space-y-3 text-sm text-[#6e6787]">
              <p>
                Use lifecycle and value rules first, then layer geography or
                tags for more precise targeting.
              </p>
              <p>
                Commerce-dependent rules are placeholder-ready and can map to
                live store logic later without redesigning the builder.
              </p>
              <p>
                Preview counts help validate the audience size before campaigns
                rely on the saved segment.
              </p>
            </div>
          </article>

          <article className="shell-card-strong p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-[#2f2b3d]">
                Matched subscribers
              </h3>
              <span className="soft-pill">{previewCount} matches</span>
            </div>
            <div className="mt-4 space-y-3">
              {previewSubscribers.length ? (
                previewSubscribers.map((subscriber) => (
                  <div
                    key={subscriber.email}
                    className="rounded-2xl bg-[#faf7ff] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#2f2b3d]">
                          {subscriber.firstName} {subscriber.lastName}
                        </p>
                        <p className="mt-1 text-sm text-[#6e6787]">
                          {subscriber.email}
                        </p>
                      </div>
                      <span className="soft-pill">{subscriber.status}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="soft-pill">
                        Score {subscriber.engagementScore || 0}
                      </span>
                      <span className="soft-pill">
                        {subscriber.totalOrders || 0} orders
                      </span>
                      <span className="soft-pill">
                        ${Number(subscriber.totalSpent || 0).toFixed(2)} spent
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6e6787]">
                  Refresh preview to load a small sample of matched subscribers.
                </p>
              )}
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="rounded-xl border border-[#ddd4f2] px-4 py-3 text-sm font-medium text-[#5f5878]"
                onClick={() => refreshPreview()}
              >
                Refresh preview
              </button>
            </div>
          </article>
        </section>
      </form>
    </div>
  );
}

export default SegmentFormPage;
