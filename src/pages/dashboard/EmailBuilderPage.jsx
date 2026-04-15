import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../components/ui/LoadingState.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import { templateVariables } from "../../data/campaigns.js";
import {
  getCatalogProduct,
  productCatalog,
} from "../../data/productCatalog.js";
import { api } from "../../lib/api.js";

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `block_${Math.random().toString(36).slice(2, 10)}`;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const money = (value = 0) => `$${Number(value || 0).toFixed(2)}`;

const textBlock = (type, content, align = "left") => ({
  id: uid(),
  type,
  props: { content, align },
});
const imageBlock = () => ({
  id: uid(),
  type: "image",
  props: {
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    alt: "Campaign banner",
    caption: "Optional caption for your image block.",
    rounded: true,
  },
});
const buttonBlock = () => ({
  id: uid(),
  type: "button",
  props: {
    text: "Shop now",
    url: "https://sellerslogin.com",
    style: "solid",
    align: "left",
  },
});
const productBlock = () => ({
  id: uid(),
  type: "product",
  props: {
    productId: productCatalog[0]?.id || "",
    showPrice: true,
    showCompareAt: true,
  },
});
const productListBlock = () => ({
  id: uid(),
  type: "product_list",
  props: {
    title: "Recommended products",
    productIds: productCatalog.slice(0, 3).map((p) => p.id),
    limit: 3,
    showCompareAt: true,
  },
});
const spacerBlock = () => ({ id: uid(), type: "spacer", props: { size: 24 } });
const dividerBlock = () => ({ id: uid(), type: "divider", props: {} });

const initialForm = () => ({
  name: "",
  subject: "",
  previewText: "",
  accentColor: "#6d28d9",
  blocks: [],
  advancedHtml: "",
});

const normalizeBlocks = (blocks = []) =>
  blocks.filter(Boolean).map((block) => ({
    id: block.id || uid(),
    type: block.type,
    props: block.props || {},
  }));

const legacyToBlocks = (design = {}) => {
  if (Array.isArray(design.blocks) && design.blocks.length)
    return normalizeBlocks(design.blocks);
  const blocks = [];
  if (design.headerLabel) blocks.push(textBlock("eyebrow", design.headerLabel));
  if (design.headline) blocks.push(textBlock("heading", design.headline));
  if (design.introText) blocks.push(textBlock("body", design.introText));
  if (design.bodyText) blocks.push(textBlock("body", design.bodyText));
  if (design.ctaText || design.ctaUrl)
    blocks.push({
      id: uid(),
      type: "button",
      props: {
        text: design.ctaText || "View Update",
        url: design.ctaUrl || "https://sellerslogin.com",
        style: "solid",
        align: "left",
      },
    });
  if (design.footerNote) blocks.push(textBlock("body", design.footerNote));
  return blocks.length ? blocks : [];
};

const mapTemplateToForm = (data) => {
  const design = data.designJson || {};
  return {
    ...initialForm(),
    name: data.name || "",
    subject: data.subject || "",
    previewText: data.previewText || "",
    accentColor: design.accentColor || "#6d28d9",
    blocks: legacyToBlocks(design),
    advancedHtml: data.htmlContent || "",
  };
};

const blockLabel = {
  eyebrow: "Eyebrow",
  heading: "Heading",
  text: "Text",
  body: "Body text",
  image: "Image",
  button: "Button / CTA",
  product: "Product card",
  product_list: "Dynamic product list",
  divider: "Divider",
  spacer: "Spacer",
};

const blockTypesInOrder = [
  "eyebrow",
  "heading",
  "text",
  "image",
  "button",
  "product",
  "product_list",
  "divider",
  "spacer",
];

const blockHtml = (block, accent) => {
  const a = block.props.align || "left";
  const c = escapeHtml(block.props.content || "");
  const alignStyle = `text-align:${a};`;
  if (block.type === "eyebrow")
    return `<p style="margin:0 0 8px;font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#64748b;font-weight:700;${alignStyle}">${c}</p>`;
  if (block.type === "heading")
    return `<h2 style="margin:0;font-size:30px;line-height:1.15;color:#0f172a;font-weight:700;${alignStyle}">${c}</h2>`;
  if (block.type === "body")
    return `<p style="margin:0;font-size:16px;line-height:1.8;color:#334155;${alignStyle};white-space:pre-line;">${c.replaceAll("\n", "<br />")}</p>`;
  if (block.type === "image")
    return `<div><img src="${escapeHtml(block.props.imageUrl || "")}" alt="${escapeHtml(block.props.alt || "Image")}" style="display:block;width:100%;border-radius:${block.props.rounded ? "24px" : "0"};object-fit:cover;" />${block.props.caption ? `<p style="margin:10px 0 0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">${escapeHtml(block.props.caption)}</p>` : ""}</div>`;
  if (block.type === "button") {
    const style =
      block.props.style === "ghost"
        ? `border:1px solid ${accent};color:${accent};background:transparent;`
        : `background:${accent};color:#fff;border:1px solid ${accent};`;
    return `<div style="text-align:${a};"><a href="${escapeHtml(block.props.url || "#")}" style="display:inline-block;text-decoration:none;font-size:15px;font-weight:700;padding:13px 20px;border-radius:12px;${style}">${escapeHtml(block.props.text || "Click")}</a></div>`;
  }
  if (block.type === "product") {
    const p = getCatalogProduct(block.props.productId);
    if (!p) return "";
    return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;background:#fff;"><tr><td width="180" style="padding:0;vertical-align:top;"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" style="display:block;width:100%;height:180px;object-fit:cover;" /></td><td style="padding:18px;vertical-align:top;"><div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#94a3b8;font-weight:700;">${escapeHtml(p.category)}</div><div style="margin-top:8px;font-size:18px;line-height:1.35;font-weight:700;color:#0f172a;">${escapeHtml(p.name)}</div>${block.props.showPrice !== false ? `<div style="margin-top:12px;font-size:18px;font-weight:700;color:${accent};">${money(p.price)}${block.props.showCompareAt && p.compareAtPrice ? `<span style="margin-left:8px;color:#94a3b8;text-decoration:line-through;">${money(p.compareAtPrice)}</span>` : ""}</div>` : ""}<div style="margin-top:16px;"><span style="display:inline-block;background:${accent};color:#fff;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:700;">View product</span></div></td></tr></table>`;
  }
  if (block.type === "product_list") {
    const products = (block.props.productIds || [])
      .map((id) => getCatalogProduct(id))
      .filter(Boolean)
      .slice(0, Number(block.props.limit || 3));
    const list = products.length
      ? products
      : productCatalog.slice(0, Number(block.props.limit || 3));
    return `<div style="margin:24px 0 0;"><div style="font-size:20px;line-height:1.3;font-weight:700;color:#0f172a;margin:0 0 16px;">${escapeHtml(block.props.title || "Featured products")}</div>${list.map((p) => blockHtml({ type: "product", props: { productId: p.id, showPrice: true, showCompareAt: block.props.showCompareAt } }, accent)).join("")}</div>`;
  }
  if (block.type === "divider")
    return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`;
  if (block.type === "spacer")
    return `<div style="height:${Number(block.props.size || 24)}px;"></div>`;
  return "";
};

const buildTemplateHtml = (form) =>
  `<!doctype html><html><body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;"><tr><td style="padding:28px;">${(form.blocks || []).map((b) => blockHtml(b, form.accentColor || "#6d28d9")).join("") || "<p>No content blocks added yet.</p>"}</td></tr></table></td></tr></table></body></html>`;

const previewBlock = (block, accent) => {
  const t = block.props.align || "left";
  const textAlign =
    t === "center" ? "text-center" : t === "right" ? "text-right" : "text-left";
  if (block.type === "eyebrow")
    return (
      <p
        className={`text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 ${textAlign}`}
      >
        {block.props.content || "Campaign update"}
      </p>
    );
  if (block.type === "heading")
    return (
      <h4 className={`text-2xl font-semibold text-slate-900 ${textAlign}`}>
        {block.props.content || "Your latest update"}
      </h4>
    );
  if (block.type === "body" || block.type === "text")
    return (
      <p
        className={`whitespace-pre-line text-sm leading-7 text-slate-600 ${textAlign}`}
      >
        {block.props.content || "Write your email copy here."}
      </p>
    );
  if (block.type === "image")
    return (
      <div>
        <img
          src={
            block.props.imageUrl ||
            "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
          }
          alt={block.props.alt || "Campaign banner"}
          className={`w-full object-cover ${block.props.rounded ? "rounded-3xl" : ""}`}
        />
        {block.props.caption ? (
          <p className="mt-2 text-center text-sm text-slate-500">
            {block.props.caption}
          </p>
        ) : null}
      </div>
    );
  if (block.type === "button")
    return (
      <div className={textAlign}>
        <span
          className={`inline-flex rounded-xl px-4 py-3 text-sm font-semibold ${block.props.style === "ghost" ? "border border-slate-300 bg-transparent text-slate-700" : "text-white"}`}
          style={
            block.props.style === "ghost"
              ? { color: accent }
              : { backgroundColor: accent }
          }
        >
          {block.props.text || "Click"}
        </span>
      </div>
    );
  if (block.type === "product") {
    const p = getCatalogProduct(block.props.productId);
    if (!p)
      return <p className="text-sm text-slate-500">No product selected</p>;
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <img
            src={p.imageUrl}
            alt={p.name}
            className="h-20 w-20 rounded-2xl object-cover"
          />
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-500">{p.category}</p>
            <p className="mt-2 font-semibold text-slate-900">
              {money(p.price)}
              {block.props.showCompareAt && p.compareAtPrice ? (
                <span className="ml-2 text-xs text-slate-400 line-through">
                  {money(p.compareAtPrice)}
                </span>
              ) : null}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (block.type === "product_list") {
    const ids = (block.props.productIds || []).slice(
      0,
      Number(block.props.limit || 3),
    );
    const products = ids.map((id) => getCatalogProduct(id)).filter(Boolean);
    const list = products.length
      ? products
      : productCatalog.slice(0, Number(block.props.limit || 3));
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">
          {block.props.title || "Featured products"}
        </p>
        <div className="mt-3 space-y-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3"
            >
              <img
                src={p.imageUrl}
                alt={p.name}
                className="h-14 w-14 rounded-2xl object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{p.name}</p>
                <p className="text-xs text-slate-500">{p.category}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{money(p.price)}</p>
                {block.props.showCompareAt ? (
                  <p className="text-xs text-slate-400 line-through">
                    {money(p.compareAtPrice)}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (block.type === "divider") return <hr className="my-6 border-slate-200" />;
  if (block.type === "spacer")
    return <div style={{ height: `${Number(block.props.size || 24)}px` }} />;
  return null;
};

function EmailBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const [form, setForm] = useState(initialForm());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragId, setDragId] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data } = await api.get(`/templates/${id}`);
        setForm(mapTemplateToForm(data));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const generatedHtml = useMemo(() => buildTemplateHtml(form), [form]);
  const updateForm = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));
  const updateBlock = (blockId, patch) =>
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block) =>
        block.id === blockId
          ? { ...block, props: { ...block.props, ...patch } }
          : block,
      ),
    }));
  const addBlock = (type) => {
    const next = {
      eyebrow: () => textBlock("eyebrow", "Campaign update"),
      heading: () => textBlock("heading", "Your latest update"),
      text: () => textBlock("body", "Write your email copy here."),
      image: imageBlock,
      button: buttonBlock,
      product: productBlock,
      product_list: productListBlock,
      divider: dividerBlock,
      spacer: spacerBlock,
    }[type]();
    setForm((current) => ({ ...current, blocks: [...current.blocks, next] }));
  };
  const removeBlock = (blockId) =>
    setForm((current) => ({
      ...current,
      blocks: current.blocks.filter((b) => b.id !== blockId),
    }));
  const moveBlock = (blockId, direction) =>
    setForm((current) => {
      const i = current.blocks.findIndex((b) => b.id === blockId);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= current.blocks.length) return current;
      const next = [...current.blocks];
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item);
      return { ...current, blocks: next };
    });
  const duplicateBlock = (blockId) =>
    setForm((current) => {
      const i = current.blocks.findIndex((b) => b.id === blockId);
      if (i < 0) return current;
      const copy = {
        ...current.blocks[i],
        id: uid(),
        props: { ...current.blocks[i].props },
      };
      const next = [...current.blocks];
      next.splice(i + 1, 0, copy);
      return { ...current, blocks: next };
    });
  const reorder = (fromId, toId) =>
    setForm((current) => {
      const from = current.blocks.findIndex((b) => b.id === fromId);
      const to = current.blocks.findIndex((b) => b.id === toId);
      if (from < 0 || to < 0 || from === to) return current;
      const next = [...current.blocks];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...current, blocks: next };
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.subject.trim())
      return setError("Builder name and subject are required");
    if (!form.blocks.length) return setError("Add at least one content block");
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        subject: form.subject.trim(),
        previewText: form.previewText.trim(),
        htmlContent: form.advancedHtml.trim() || generatedHtml,
        designJson: {
          editor: "block-builder",
          accentColor: form.accentColor,
          blocks: form.blocks,
        },
      };
      if (id) {
        await api.put(`/templates/${id}`, payload);
        toast.success("Builder updated");
      } else {
        await api.post("/templates", payload);
        toast.success("Builder saved");
      }
      navigate("/templates");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to save builder",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading email builder..." />;

  return (
    <div className="space-y-6">
      <section className="shell-card p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <PageHeader
            
            title={id ? "Edit email builder" : "Create email builder"}
            description="Build reusable campaign emails with drag-and-drop blocks, product cards, and auto-priced product lists."
          />
        </div>
      </section>

      <form
        className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        onSubmit={handleSubmit}
      >
        <section className="shell-card space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="field"
              placeholder="Builder name"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
            <input
              className="field"
              placeholder="Subject"
              value={form.subject}
              onChange={(e) => updateForm("subject", e.target.value)}
            />
          </div>
          <input
            className="field"
            placeholder="Preview text"
            value={form.previewText}
            onChange={(e) => updateForm("previewText", e.target.value)}
          />

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Block builder
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Drag blocks to reorder. Add text, images, CTAs, product cards,
                  and dynamic product lists.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {blockTypesInOrder.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="secondary-button"
                    onClick={() => addBlock(type)}
                  >
                    + {blockLabel[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {form.blocks.map((block, index) => (
                <article
                  key={block.id}
                  draggable
                  onDragStart={() => setDragId(block.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() =>
                    dragId && (reorder(dragId, block.id), setDragId(""))
                  }
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="cursor-move rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold tracking-[0.18em] text-slate-500">
                        DRAG
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {blockLabel[block.type] || block.type}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {block.type === "product_list"
                            ? "Dynamic pricing and auto-selected products"
                            : "Editable content block"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                        onClick={() => moveBlock(block.id, -1)}
                        disabled={index === 0}
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                        onClick={() => moveBlock(block.id, 1)}
                        disabled={index === form.blocks.length - 1}
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                        onClick={() => duplicateBlock(block.id)}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600"
                        onClick={() => removeBlock(block.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {["eyebrow", "heading", "text", "body"].includes(
                      block.type,
                    ) ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                        <textarea
                          className="field min-h-[120px] resize-y"
                          value={block.props.content || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { content: e.target.value })
                          }
                        />
                        <select
                          className="field md:self-start md:h-[48px]"
                          value={block.props.align || "left"}
                          onChange={(e) =>
                            updateBlock(block.id, { align: e.target.value })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    ) : null}
                    {block.type === "image" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          className="field md:col-span-2"
                          placeholder="Image URL"
                          value={block.props.imageUrl || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { imageUrl: e.target.value })
                          }
                        />
                        <input
                          className="field"
                          placeholder="Alt text"
                          value={block.props.alt || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { alt: e.target.value })
                          }
                        />
                        <input
                          className="field"
                          placeholder="Caption"
                          value={block.props.caption || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { caption: e.target.value })
                          }
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
                          <input
                            type="checkbox"
                            checked={Boolean(block.props.rounded)}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                rounded: e.target.checked,
                              })
                            }
                          />
                          Rounded corners
                        </label>
                      </div>
                    ) : null}
                    {block.type === "button" ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px]">
                        <input
                          className="field"
                          placeholder="Button text"
                          value={block.props.text || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { text: e.target.value })
                          }
                        />
                        <input
                          className="field"
                          placeholder="Button link"
                          value={block.props.url || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { url: e.target.value })
                          }
                        />
                        <select
                          className="field"
                          value={block.props.style || "solid"}
                          onChange={(e) =>
                            updateBlock(block.id, { style: e.target.value })
                          }
                        >
                          <option value="solid">Solid</option>
                          <option value="ghost">Ghost</option>
                        </select>
                        <select
                          className="field md:col-span-3"
                          value={block.props.align || "left"}
                          onChange={(e) =>
                            updateBlock(block.id, { align: e.target.value })
                          }
                        >
                          <option value="left">Left</option>
                          <option value="center">Center</option>
                          <option value="right">Right</option>
                        </select>
                      </div>
                    ) : null}
                    {block.type === "product" ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <select
                          className="field md:col-span-2"
                          value={block.props.productId || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { productId: e.target.value })
                          }
                        >
                          {productCatalog.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} - {money(p.price)}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={block.props.showPrice !== false}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                showPrice: e.target.checked,
                              })
                            }
                          />
                          Show price
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(block.props.showCompareAt)}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                showCompareAt: e.target.checked,
                              })
                            }
                          />
                          Show compare-at price
                        </label>
                      </div>
                    ) : null}
                    {block.type === "product_list" ? (
                      <div className="grid gap-3">
                        <input
                          className="field"
                          placeholder="Section title"
                          value={block.props.title || ""}
                          onChange={(e) =>
                            updateBlock(block.id, { title: e.target.value })
                          }
                        />
                        <div className="grid gap-3 md:grid-cols-[1fr_120px_160px]">
                          <input
                            className="field"
                            placeholder="Product ids, comma separated"
                            value={(block.props.productIds || []).join(", ")}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                productIds: e.target.value
                                  .split(",")
                                  .map((item) => item.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                          <input
                            className="field"
                            type="number"
                            min="1"
                            max="6"
                            value={block.props.limit || 3}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                limit: Number(e.target.value || 1),
                              })
                            }
                          />
                          <select
                            className="field"
                            value={block.props.layout || "grid"}
                            onChange={(e) =>
                              updateBlock(block.id, { layout: e.target.value })
                            }
                          >
                            <option value="grid">Grid</option>
                            <option value="stack">Stack</option>
                          </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(block.props.showCompareAt)}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                showCompareAt: e.target.checked,
                              })
                            }
                          />
                          Show compare-at price
                        </label>
                      </div>
                    ) : null}
                    {block.type === "divider" ? (
                      <p className="text-sm text-slate-500">
                        Divider block inserted. No extra settings needed.
                      </p>
                    ) : null}
                    {block.type === "spacer" ? (
                      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                        <label className="text-sm text-slate-600">
                          Spacer height
                        </label>
                        <input
                          className="field"
                          type="number"
                          min="8"
                          max="120"
                          value={block.props.size || 24}
                          onChange={(e) =>
                            updateBlock(block.id, {
                              size: Number(e.target.value || 24),
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <details
            className="rounded-3xl border border-slate-200 bg-white p-5"
            open={showAdvanced}
            onToggle={(e) => setShowAdvanced(e.currentTarget.open)}
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">
              Advanced HTML, optional
            </summary>
            <p className="mt-2 text-sm text-slate-500">
              Leave this empty to use the block builder output. Advanced users
              can paste a custom HTML override.
            </p>
            <textarea
              className="field mt-4 min-h-[220px] resize-y"
              placeholder="Optional HTML override for advanced users"
              value={form.advancedHtml}
              onChange={(e) => updateForm("advancedHtml", e.target.value)}
            />
          </details>

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
                  ? "Update builder"
                  : "Save builder"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <article className="shell-card p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Live preview
            </h3>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">
                {form.subject || "Subject preview"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {form.previewText || "Preview text"}
              </p>
              <div className="mt-4 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                {form.blocks.map((block) => (
                  <div key={block.id} className="mb-4 last:mb-0">
                    {previewBlock(block, form.accentColor || "#6d28d9")}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="shell-card p-6">
            <h3 className="text-xl font-semibold text-slate-900">
              Product catalog
            </h3>
            <div className="mt-4 space-y-3">
              {productCatalog.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {money(product.price)}
                    </p>
                    <p className="text-xs text-slate-400">
                      Was {money(product.compareAtPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </form>
    </div>
  );
}

export default EmailBuilderPage;
