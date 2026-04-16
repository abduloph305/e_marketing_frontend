import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EmptyState from "../../components/ui/EmptyState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { buildTemplateHtml, templatePresets } from "../../data/templatePresets.js";
import { api } from "../../lib/api.js";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not set";

const getTemplateTimestampLabel = (template) => {
  const createdAt = template.createdAt ? new Date(template.createdAt) : null;
  const updatedAt = template.updatedAt ? new Date(template.updatedAt) : null;

  if (!createdAt && updatedAt) {
    return `Updated on ${formatDateTime(updatedAt)}`;
  }

  if (createdAt && updatedAt && createdAt.getTime() !== updatedAt.getTime()) {
    return `Updated on ${formatDateTime(updatedAt)}`;
  }

  return `Created on ${formatDateTime(createdAt || updatedAt)}`;
};

function ModalShell({ children, onClose, className = "" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.25)] ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function TemplatesListPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChooser, setShowChooser] = useState(false);
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const [activePresetKey, setActivePresetKey] = useState(templatePresets[0]?.key || "");

  const activePreset = useMemo(
    () =>
      templatePresets.find((preset) => preset.key === activePresetKey) ||
      templatePresets[0] ||
      null,
    [activePresetKey],
  );

  const loadTemplates = async () => {
    setIsLoading(true);

    try {
      const { data } = await api.get("/templates");
      setTemplates(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleDelete = async (id) => {
    await api.delete(`/templates/${id}`);
    loadTemplates();
  };

  const handleOpenChooser = () => setShowChooser(true);

  const handleOpenCustomEditor = () => {
    setShowChooser(false);
    setShowPresetGallery(false);
    navigate("/templates/new");
  };

  const handleOpenPresetGallery = () => {
    setShowChooser(false);
    setShowPresetGallery(true);
    setActivePresetKey(templatePresets[0]?.key || "");
  };

  const handleUsePreset = (key) => {
    setShowPresetGallery(false);
    navigate(`/templates/new?preset=${encodeURIComponent(key)}`);
  };

  return (
    <div className="space-y-6">
      <section className="shell-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            title="Email templates"
            description="Store reusable campaign layouts with editable subjects, preview text, and simple HTML content."
          />
          <button type="button" onClick={handleOpenChooser} className="primary-button">
            Create template
          </button>
        </div>
      </section>

      <section className="shell-card p-6">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading templates...</p>
        ) : templates.length ? (
          <div className="grid gap-4">
            {templates.map((template) => (
              <article key={template._id} className="rounded-3xl border border-slate-200 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{template.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">{template.subject}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {template.previewText || "No preview text"}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {getTemplateTimestampLabel(template)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      to={`/templates/${template._id}/edit`}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(template._id)}
                      className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No templates yet"
            description="Create your first reusable template for campaigns."
            action={
              <button type="button" onClick={handleOpenChooser} className="primary-button">
                Create template
              </button>
            }
          />
        )}
      </section>

      {showChooser ? (
        <ModalShell onClose={() => setShowChooser(false)} className="max-w-5xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            {/* <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Create template
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Choose how you want to build
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Pick a ready-made template to preview and customize, or start from scratch.
              </p>
            </div> */}
            <button
              type="button"
              onClick={() => setShowChooser(false)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <button
              type="button"
              onClick={handleOpenPresetGallery}
              className="group rounded-[28px] border border-emerald-200 bg-[#f6fff8] p-6 text-left transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg"
            >
              <div className="inline-flex rounded-2xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-700">
                Ready-made templates
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Use a ready-made design
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Preview 8 personalized templates for welcome, signup, abandoned cart recovery, order confirmation, payment thank-you, follow-up, reminder, and discount flows.
              </p>
              <p className="mt-4 text-sm font-medium text-emerald-700">
                Browse templates -&gt;
              </p>
            </button>

            <button
              type="button"
              onClick={handleOpenCustomEditor}
              className="group rounded-[28px] border border-slate-200 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <div className="inline-flex rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                Custom template
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Build your own layout
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Open the editor and create your own email design from scratch with your own copy and branding.
              </p>
              <p className="mt-4 text-sm font-medium text-slate-900">
                Open editor -&gt;
              </p>
            </button>
          </div>
        </ModalShell>
      ) : null}

      {showPresetGallery ? (
        <ModalShell onClose={() => setShowPresetGallery(false)} className="max-w-7xl">
          <div className="flex items-start justify-between border-b border-slate-200 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Ready-made templates
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                Preview and use a preset
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Select a template, preview it, then open the editor with that layout prefilled.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPresetGallery(false);
                  setShowChooser(true);
                }}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setShowPresetGallery(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
            <div className="max-h-[76vh] overflow-y-auto border-r border-slate-200 p-6">
              <div className="grid gap-4">
                {templatePresets.map((preset) => {
                  const isActive = preset.key === activePresetKey;

                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setActivePresetKey(preset.key)}
                      className={`rounded-[24px] border p-5 text-left transition ${
                        isActive
                          ? "border-emerald-400 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-[#fbfffd]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {preset.category}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-slate-900">{preset.name}</h3>
                          <p className="mt-2 text-sm text-slate-500">{preset.description}</p>
                        </div>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                          {isActive ? "Selected" : "Preview"}
                        </span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-slate-700">
                        Subject: {preset.subject}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                          {preset.key.replaceAll("_", " ")}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Ready to use
                        </span>
                        {(preset.variables || []).map((variable) => (
                          <span
                            key={variable}
                            className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700"
                          >
                            {variable}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="max-h-[76vh] overflow-y-auto bg-slate-50 p-6">
              {activePreset ? (
                <div className="space-y-5">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                          Preview
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                          {activePreset.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">{activePreset.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUsePreset(activePreset.key)}
                        className="primary-button whitespace-nowrap"
                      >
                        Use this template
                      </button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white">
                    <iframe
                      title={`${activePreset.name} preview`}
                      srcDoc={buildTemplateHtml({
                        name: activePreset.name,
                        subject: activePreset.subject,
                        previewText: activePreset.previewText,
                        ...activePreset.form,
                      })}
                      className="h-[560px] w-full bg-white"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

export default TemplatesListPage;
