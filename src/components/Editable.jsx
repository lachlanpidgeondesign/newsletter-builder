import { useRef, useEffect, useState, useCallback } from "react";
import { Bold, Italic, Underline, Link, Strikethrough } from "lucide-react";

/**
 * Rich-text contenteditable that supports inline formatting.
 * Stores and emits HTML strings so bold/italic/links survive round-trips.
 */

function FormatToolbar({ containerRef }) {
  const [pos, setPos] = useState(null);
  const toolbarRef = useRef(null);

  const updatePosition = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current?.contains(sel.anchorNode)) {
      setPos(null);
      return;
    }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - containerRect.top - 40,
      left: rect.left - containerRect.left + rect.width / 2,
    });
  }, [containerRef]);

  useEffect(() => {
    document.addEventListener("selectionchange", updatePosition);
    return () => document.removeEventListener("selectionchange", updatePosition);
  }, [updatePosition]);

  const exec = (cmd, val) => {
    document.execCommand(cmd, false, val);
    containerRef.current?.focus();
  };

  const handleLink = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const existing = sel.anchorNode?.parentElement?.closest("a");
    if (existing) {
      document.execCommand("unlink");
    } else {
      const url = prompt("Enter URL:");
      if (url) exec("createLink", url);
    }
  };

  if (!pos) return null;

  const buttons = [
    { cmd: "bold", Icon: Bold, label: "Bold" },
    { cmd: "italic", Icon: Italic, label: "Italic" },
    { cmd: "underline", Icon: Underline, label: "Underline" },
    { cmd: "strikeThrough", Icon: Strikethrough, label: "Strikethrough" },
  ];

  return (
    <div
      ref={toolbarRef}
      className="absolute z-30 flex items-center bg-stone-900 rounded-lg shadow-xl px-1 py-1 gap-0.5 -translate-x-1/2"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {buttons.map(({ cmd, Icon, label }) => (
        <button
          key={cmd}
          onClick={() => exec(cmd)}
          className="p-1.5 rounded hover:bg-stone-700 text-stone-300 hover:text-white transition"
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
      <div className="w-px bg-stone-700 mx-0.5 h-5" />
      <button
        onClick={handleLink}
        className="p-1.5 rounded hover:bg-stone-700 text-stone-300 hover:text-white transition"
        title="Link"
      >
        <Link className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export default function Editable({ value, onChange, className = "", multiline = false, placeholder = "" }) {
  const ref = useRef(null);
  const wrapperRef = useRef(null);

  const sanitizePastedHtml = useCallback((html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const allowedInline = new Set(["b", "strong", "i", "em", "u", "s", "strike", "a", "br"]);
    const allowedBlock = new Set(["p", "div", "ul", "ol", "li"]);

    const escapeHtml = (str) =>
      str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const isSafeUrl = (url) => /^(https?:|mailto:|tel:|\/|#)/i.test(url);

    const sanitizeNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return escapeHtml(node.textContent || "");
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }

      const tag = node.tagName.toLowerCase();
      const children = Array.from(node.childNodes).map(sanitizeNode).join("");

      if (allowedInline.has(tag)) {
        if (tag === "br") return "<br>";
        if (tag === "a") {
          const href = (node.getAttribute("href") || "").trim();
          if (!href || !isSafeUrl(href)) return children;
          return `<a href="${escapeHtml(href)}">${children}</a>`;
        }
        return `<${tag}>${children}</${tag}>`;
      }

      if (allowedBlock.has(tag)) {
        return `<${tag}>${children}</${tag}>`;
      }

      // Drop unsupported tags but keep their text/children.
      return children;
    };

    return Array.from(doc.body.childNodes).map(sanitizeNode).join("");
  }, []);

  useEffect(() => {
    if (ref.current) {
      const next = value || "";
      if (ref.current.innerHTML !== next) {
        ref.current.innerHTML = next;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    onChange(html);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const html = clipboard?.getData("text/html") || "";
    const text = clipboard?.getData("text/plain") || "";

    let sanitized = "";
    if (html) {
      sanitized = sanitizePastedHtml(html);
    } else if (text) {
      const escaped = text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      sanitized = multiline ? escaped.replace(/\r?\n/g, "<br>") : escaped.replace(/\r?\n/g, " ");
    }

    if (sanitized) {
      document.execCommand("insertHTML", false, sanitized);
      handleInput();
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <FormatToolbar containerRef={wrapperRef} />
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        className={`outline-none focus:bg-amber-50 focus:ring-2 focus:ring-amber-300 rounded px-1 -mx-1 transition-colors ${className}`}
      />
    </div>
  );
}
