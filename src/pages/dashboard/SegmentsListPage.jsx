import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { segmentPresets } from "../../data/segmentPresets.js";
import { api } from "../../lib/api.js";

function SegmentsListPage() {
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSegments = async () => {
    setIsLoading(true);

    try {
      const { data } = await api.get("/segments");
      setSegments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSegments();
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/segments/${id}`);
    loadSegments();
  };

  return (
    <div className="space-y-6">
      <section className="shell-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            eyebrow="Segments"
            title="Dynamic segments"
            description="Create rule-based groups that can be reused later for campaign targeting and reporting."
          />
          <Link to="/segments/new" className="primary-button">
            Create segment
          </Link>
        </div>
      </section>

      <section className="shell-card p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-[#2f2b3d]">
              Preset segments
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Start from a useful audience pattern and refine it later.
            </p>
          </div>
          <span className="soft-pill">{segmentPresets.length} presets</span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {segmentPresets.map((preset) => (
            <article
              key={preset.id}
              className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#faf7ff] p-5"
            >
              <h4 className="text-lg font-semibold text-[#2f2b3d]">
                {preset.name}
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                {preset.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {preset.rules.map((rule) => (
                  <span
                    key={`${preset.id}-${rule.field}`}
                    className="soft-pill"
                  >
                    {rule.field}
                  </span>
                ))}
              </div>
              <div className="mt-5">
                <Link
                  to={`/segments/new?preset=${preset.id}`}
                  className="primary-button w-full"
                >
                  Use preset
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="shell-card p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading segments...</p>
        ) : segments.length ? (
          <div className="grid gap-4">
            {segments.map((segment) => (
              <article
                key={segment._id}
                className="rounded-3xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {segment.name}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {segment.rules.length} rules - {segment.previewCount}{" "}
                      matching subscribers
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to={`/segments/${segment._id}/edit`}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(segment._id)}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {segment.rules.map((rule, index) => (
                    <span
                      key={`${rule.field}-${index}`}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                    >
                      {rule.field} {rule.operator} {String(rule.value)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No segments yet"
            description="Create a segment to preview matching subscriber counts from your audience."
            action={
              <Link to="/segments/new" className="primary-button">
                Create segment
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}

export default SegmentsListPage;
