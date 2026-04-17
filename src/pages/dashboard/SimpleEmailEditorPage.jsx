import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingState from "../../components/ui/LoadingState.jsx";
import { ToastContext } from "../../context/ToastContext.jsx";
import { api } from "../../lib/api.js";

const MERGE_TAGS = ["{{firstName}}", "{{lastName}}", "{{email}}"];
const EMOJIS = ["😀", "✨", "🔥", "💬", "🎉", "✅", "📣", "💡", "🚀"];
const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Helvetica",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];

const createEmptyTemplate = () => ({
  name: "New template",
  subject: "",
  previewText: "",
  htmlContent: "<p>Start writing your email here.</p>",
  plainTextContent: "Start writing your email here.",
  designJson: {
    editor: "simple",
  },
});

const stripHtml = (html = "") => {
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
};

const countWords = (text = "") => {
  const trimmed = String(text).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

const getSelectionRange = (root) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  return range;
};

const decodeEntities = (html = "") => {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || "";
};

const insertHtmlAtSelection = (root, html) => {
  root?.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    root?.insertAdjacentHTML("beforeend", html);
    return;
  }
  const range = selection.getRangeAt(0);
  if (root && !root.contains(range.commonAncestorContainer)) {
    root.insertAdjacentHTML("beforeend", html);
    return;
  }
  range.deleteContents();
  const container = document.createElement("div");
  container.innerHTML = html;
  const fragment = document.createDocumentFragment();
  while (container.firstChild) fragment.appendChild(container.firstChild);
  const lastNode = fragment.lastChild;
  range.insertNode(fragment);
  if (lastNode) {
    range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

const execCommand = (command, value = null) => {
  document.execCommand(command, false, value);
};

const ToolbarButton = ({ active, children, title, onClick }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
      active ? "border-[#1f5eff] bg-[#eaf0ff] text-[#1231a2]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
    }`}
  >
    {children}
  </button>
);

function SimpleEmailEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useContext(ToastContext);
  const [template, setTemplate] = useState(createEmptyTemplate());
  const [isLoading, setIsLoading] = useState(Boolean(id));
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [showImagePrompt, setShowImagePrompt] = useState(false);
  const [imageUrlValue, setImageUrlValue] = useState("");
  const [cursorSelection, setCursorSelection] = useState(null);
  const editorRef = useRef(null);
  const sourceRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);
  const selectionRef = useRef(null);
  const lastSavedSignatureRef = useRef("");

  useEffect(() => {
    if (!id) {
      const next = createEmptyTemplate();
      setTemplate(next);
      setHtmlSource(next.htmlContent);
      lastSavedSignatureRef.current = JSON.stringify(next);
      return;
    }

    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/templates/${id}`);
        const next = {
          ...createEmptyTemplate(),
          name: data.name || "New template",
          subject: data.subject || "",
          previewText: data.previewText || "",
          htmlContent: data.htmlContent || data.designJson?.htmlContent || createEmptyTemplate().htmlContent,
          plainTextContent:
            data.plainTextContent ||
            stripHtml(data.htmlContent || data.designJson?.htmlContent || "") ||
            "Start writing your email here.",
          designJson: {
            ...(data.designJson || {}),
            editor: "simple",
          },
        };
        if (!mounted) return;
        setTemplate(next);
        setHtmlSource(next.htmlContent);
        lastSavedSignatureRef.current = JSON.stringify(next);
      } catch (error) {
        toast.error(error.response?.data?.message || "Unable to load template");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, toast]);

  useEffect(() => {
    const handlePointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowMenu(false);
        setShowPreview(false);
      }
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (sourceMode) {
      setHtmlSource(template.htmlContent);
      return;
    }

    if (editorRef.current && editorRef.current.innerHTML !== template.htmlContent) {
      editorRef.current.innerHTML = template.htmlContent;
    }
  }, [sourceMode, template.htmlContent]);

  const plainText = useMemo(() => stripHtml(template.htmlContent), [template.htmlContent]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const characterCount = useMemo(() => decodeEntities(plainText).length, [plainText]);
  const syncFromEditor = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = stripHtml(html);
    setTemplate((current) => ({
      ...current,
      htmlContent: html,
      plainTextContent: text,
    }));
  };

  const syncFromSource = (value) => {
    setHtmlSource(value);
    setTemplate((current) => ({
      ...current,
      htmlContent: value,
      plainTextContent: stripHtml(value),
    }));
  };

  const rememberSelection = () => {
    if (sourceMode) {
      const source = sourceRef.current;
      if (source) {
        setCursorSelection({
          start: source.selectionStart,
          end: source.selectionEnd,
        });
      }
      return;
    }

    const range = getSelectionRange(editorRef.current);
    if (range) selectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    if (sourceMode) {
      const source = sourceRef.current;
      if (source && cursorSelection) {
        source.focus();
        source.setSelectionRange(cursorSelection.start, cursorSelection.end);
      }
      return;
    }

    if (editorRef.current && selectionRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(selectionRef.current);
    }
  };

  const applyCommand = (command, value = null) => {
    if (sourceMode) return;
    restoreSelection();
    execCommand(command, value);
    syncFromEditor();
  };

  const handleFontChange = (value) => {
    applyCommand("fontName", value);
  };

  const handleFontSizeChange = (value) => {
    if (sourceMode) return;
    restoreSelection();
    execCommand("fontSize", "7");
    const spans = editorRef.current?.querySelectorAll('font[size="7"]');
    spans?.forEach((node) => {
      node.removeAttribute("size");
      node.style.fontSize = `${value}px`;
      node.style.fontFamily = node.style.fontFamily || "inherit";
    });
    syncFromEditor();
  };

  const handleColorChange = (value) => {
    applyCommand("foreColor", value);
  };

  const handleClearFormatting = () => {
    applyCommand("removeFormat");
    applyCommand("unlink");
  };

  const handleInsertMergeTag = (tag) => {
    if (sourceMode) {
      const source = sourceRef.current;
      if (!source) return;
      const start = source.selectionStart ?? source.value.length;
      const end = source.selectionEnd ?? source.value.length;
      const value = `${source.value.slice(0, start)}${tag}${source.value.slice(end)}`;
      syncFromSource(value);
      setTimeout(() => {
        source.focus();
        source.setSelectionRange(start + tag.length, start + tag.length);
      }, 0);
      return;
    }

    restoreSelection();
    insertHtmlAtSelection(editorRef.current, tag);
    syncFromEditor();
  };

  const handleInsertEmoji = (emoji) => {
    if (sourceMode) {
      const source = sourceRef.current;
      if (!source) return;
      const start = source.selectionStart ?? source.value.length;
      const end = source.selectionEnd ?? source.value.length;
      const value = `${source.value.slice(0, start)}${emoji}${source.value.slice(end)}`;
      syncFromSource(value);
      setTimeout(() => {
        source.focus();
        source.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
      return;
    }

    restoreSelection();
    insertHtmlAtSelection(editorRef.current, emoji);
    syncFromEditor();
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter link URL");
    if (!url) return;

    if (sourceMode) {
      const source = sourceRef.current;
      if (!source) return;
      const selected = source.value.slice(source.selectionStart || 0, source.selectionEnd || 0) || url;
      const html = `<a href="${url}" target="_blank" rel="noreferrer">${selected}</a>`;
      const next = `${source.value.slice(0, source.selectionStart || 0)}${html}${source.value.slice(source.selectionEnd || 0)}`;
      syncFromSource(next);
      return;
    }

    restoreSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() || url;
    execCommand("createLink", url);
    const anchor = editorRef.current?.querySelector("a[href]");
    if (anchor) {
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      if (!anchor.textContent) anchor.textContent = selectedText;
    }
    syncFromEditor();
  };

  const handleInsertImage = () => {
    if (sourceMode) {
      setShowImagePrompt(true);
      return;
    }
    setShowImagePrompt(true);
  };

  const confirmInsertImage = () => {
    const value = imageUrlValue.trim();
    if (!value) return;
    const html = `<p><img src="${value}" alt="Inserted image" style="max-width:100%; height:auto; border-radius:16px; display:block;" /></p>`;
    if (sourceMode) {
      const source = sourceRef.current;
      if (!source) return;
      const start = source.selectionStart ?? source.value.length;
      const end = source.selectionEnd ?? source.value.length;
      const next = `${source.value.slice(0, start)}${html}${source.value.slice(end)}`;
      syncFromSource(next);
      setShowImagePrompt(false);
      setImageUrlValue("");
      return;
    }

    restoreSelection();
    insertHtmlAtSelection(editorRef.current, html);
    syncFromEditor();
    setShowImagePrompt(false);
    setImageUrlValue("");
  };

  const handleInsertTable = () => {
    const html = `
      <table style="width:100%; border-collapse:collapse; margin:12px 0;">
        <tr>
          <td style="border:1px solid #d9d9e3; padding:10px;">Cell 1</td>
          <td style="border:1px solid #d9d9e3; padding:10px;">Cell 2</td>
        </tr>
      </table>
    `;
    if (sourceMode) {
      const source = sourceRef.current;
      if (!source) return;
      const start = source.selectionStart ?? source.value.length;
      const end = source.selectionEnd ?? source.value.length;
      const next = `${source.value.slice(0, start)}${html}${source.value.slice(end)}`;
      syncFromSource(next);
      return;
    }

    restoreSelection();
    insertHtmlAtSelection(editorRef.current, html);
    syncFromEditor();
  };

  const handleToggleSource = () => {
    if (!sourceMode) {
      syncFromEditor();
      setHtmlSource(editorRef.current?.innerHTML || template.htmlContent);
    } else {
      syncFromSource(htmlSource || "");
    }
    setSourceMode((current) => !current);
  };

  const handleSave = async ({ quit = false } = {}) => {
    setIsSaving(true);
    try {
      const payload = {
        name: template.name.trim() || "New template",
        subject: template.subject.trim(),
        previewText: template.previewText.trim(),
        htmlContent: sourceMode ? htmlSource : template.htmlContent,
        plainTextContent: stripHtml(sourceMode ? htmlSource : template.htmlContent),
        designJson: {
          ...(template.designJson || {}),
          editor: "simple",
        },
      };

      let savedId = id;
      if (id) {
        await api.put(`/templates/${id}`, payload);
        toast.success("Template saved");
      } else {
        const { data } = await api.post("/templates", payload);
        savedId = data?._id || savedId;
        toast.success("Template created");
      }

      const savedSignature = JSON.stringify({
        ...template,
        htmlContent: payload.htmlContent,
        plainTextContent: payload.plainTextContent,
      });
      lastSavedSignatureRef.current = savedSignature;
      setTemplate((current) => ({
        ...current,
        htmlContent: payload.htmlContent,
        plainTextContent: payload.plainTextContent,
      }));
      if (sourceMode) setHtmlSource(payload.htmlContent);

      if (quit) {
        navigate("/templates");
        return;
      }

      if (!id && savedId) {
        navigate(`/simple-editor/${savedId}`, { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintPreview = () => {
    const previewHtml = sourceMode ? htmlSource : template.htmlContent;
    const win = window.open("", "_blank", "width=900,height=800");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${template.name || "Preview"}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f7fb; padding: 32px; }
            .mail { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 18px; padding: 32px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }
            img { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="mail">${previewHtml}</div>
          <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    win.document.close();
  };

  if (isLoading) return <LoadingState message="Loading simple editor..." />;

  const editorHtml = sourceMode ? htmlSource : template.htmlContent;

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/96 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/templates")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              aria-label="Back to templates"
            >
              ←
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Preview &amp; Test
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave({ quit: true })}
              className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
            >
              Save &amp; Quit
            </button>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu((current) => !current)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-600 hover:bg-slate-50"
                aria-label="More actions"
              >
                ⋮
              </button>
              {showMenu ? (
                <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleSave({ quit: false });
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handlePrintPreview();
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Save as PDF
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ToolbarButton title="HTML source" active={sourceMode} onClick={handleToggleSource}>
              {"<>"}
            </ToolbarButton>
          </div>

          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <select
              className="h-10 rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
              value="Arial"
              onChange={(event) => handleFontChange(event.target.value)}
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border-0 bg-transparent px-3 text-sm outline-none"
              value="16"
              onChange={(event) => handleFontSizeChange(Number(event.target.value || 16))}
            >
              {FONT_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ToolbarButton title="Bold" onClick={() => applyCommand("bold")}>
              <strong>B</strong>
            </ToolbarButton>
            <ToolbarButton title="Italic" onClick={() => applyCommand("italic")}>
              <em>I</em>
            </ToolbarButton>
            <ToolbarButton title="Underline" onClick={() => applyCommand("underline")}>
              <u>U</u>
            </ToolbarButton>
            <ToolbarButton title="Strikethrough" onClick={() => applyCommand("strikeThrough")}>
              S
            </ToolbarButton>
            <ToolbarButton title="Clear formatting" onClick={handleClearFormatting}>
              ⌫
            </ToolbarButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <input
              type="color"
              className="h-10 w-10 cursor-pointer rounded-xl border-0 bg-transparent p-1"
              onChange={(event) => handleColorChange(event.target.value)}
              aria-label="Text color"
            />
            <ToolbarButton title="Insert link" onClick={handleInsertLink}>
              🔗
            </ToolbarButton>
            <ToolbarButton
              title="Insert image"
              onClick={() => {
                setShowImagePrompt(true);
              }}
            >
              🖼
            </ToolbarButton>
            <ToolbarButton title="Emoji" onClick={() => handleInsertEmoji(EMOJIS[0])}>
              ☺
            </ToolbarButton>
            <ToolbarButton
              title="Merge tags"
              onClick={() => {
                const tag = window.prompt(`Choose a merge tag:\n${MERGE_TAGS.join("\n")}`, MERGE_TAGS[0]);
                if (tag && MERGE_TAGS.includes(tag.trim())) handleInsertMergeTag(tag.trim());
              }}
            >
              {"{}"}
            </ToolbarButton>
            <ToolbarButton title="Insert table" onClick={handleInsertTable}>
              ⊞
            </ToolbarButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ToolbarButton title="Align left" onClick={() => applyCommand("justifyLeft")}>L</ToolbarButton>
            <ToolbarButton title="Align center" onClick={() => applyCommand("justifyCenter")}>C</ToolbarButton>
            <ToolbarButton title="Align right" onClick={() => applyCommand("justifyRight")}>R</ToolbarButton>
            <ToolbarButton title="Justify" onClick={() => applyCommand("justifyFull")}>J</ToolbarButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ToolbarButton title="Bulleted list" onClick={() => applyCommand("insertUnorderedList")}>•</ToolbarButton>
            <ToolbarButton title="Numbered list" onClick={() => applyCommand("insertOrderedList")}>1.</ToolbarButton>
            <ToolbarButton title="Outdent" onClick={() => applyCommand("outdent")}>←</ToolbarButton>
            <ToolbarButton title="Indent" onClick={() => applyCommand("indent")}>→</ToolbarButton>
          </div>

          <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <ToolbarButton title="Paragraph" onClick={() => applyCommand("formatBlock", "p")}>P</ToolbarButton>
            <ToolbarButton title="Heading" onClick={() => applyCommand("formatBlock", "h2")}>H</ToolbarButton>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
            <span>Words: {wordCount}</span>
            <span>Characters: {characterCount}</span>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1380px] px-4 py-6 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-[#fbfcff] p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] md:p-6">
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-3 text-sm text-slate-500">
              Clean text editor
            </div>
            <div className="relative min-h-[68vh]">
              {sourceMode ? (
                <textarea
                  ref={sourceRef}
                  value={htmlSource}
                  onChange={(event) => syncFromSource(event.target.value)}
                  onClick={rememberSelection}
                  onKeyUp={rememberSelection}
                  className="min-h-[68vh] w-full resize-none border-0 bg-white px-6 py-6 font-mono text-sm leading-7 text-slate-800 outline-none"
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onInput={syncFromEditor}
                  onMouseUp={rememberSelection}
                  onKeyUp={rememberSelection}
                  onFocus={rememberSelection}
                  className="min-h-[68vh] px-6 py-6 text-[16px] leading-7 text-slate-800 outline-none"
                  style={{ fontFamily: "Arial" }}
                />
              )}

              {!sourceMode && !stripHtml(editorHtml) ? (
                <div className="pointer-events-none absolute left-6 top-6 text-slate-400">
                  Start writing your email here.
                </div>
              ) : null}

              <div className="pointer-events-none absolute bottom-4 right-5 text-sm text-slate-500">
                Words: {wordCount} &nbsp;&nbsp; Characters: {characterCount}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showImagePrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-[24px] bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Insert image</h3>
            <p className="mt-1 text-sm text-slate-500">Paste an image URL or upload a file.</p>
            <div className="mt-4 space-y-3">
              <input
                value={imageUrlValue}
                onChange={(event) => setImageUrlValue(event.target.value)}
                className="field"
                placeholder="https://..."
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload file
                </button>
                <button type="button" className="primary-button" onClick={confirmInsertImage}>
                  Insert
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setShowImagePrompt(false);
                    setImageUrlValue("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showPreview ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
                <p className="text-sm text-slate-500">{template.subject || "No subject"}</p>
              </div>
              <button
                type="button"
                className="secondary-button px-4 py-2 text-sm"
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[calc(90vh-78px)] overflow-auto bg-slate-100 p-6">
              <div className="mx-auto mb-4 flex max-w-3xl justify-end">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                  onClick={handlePrintPreview}
                >
                  Save as PDF
                </button>
              </div>
              <div className="mx-auto max-w-3xl rounded-[24px] bg-white p-8 shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: sourceMode ? htmlSource : template.htmlContent }} />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            setImageUrlValue(String(reader.result || ""));
            setShowImagePrompt(true);
          };
          reader.readAsDataURL(file);
          event.target.value = "";
        }}
      />

    </div>
  );
}

export default SimpleEmailEditorPage;
