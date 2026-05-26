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
  const lastProp = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastProp.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || "";
      lastProp.current = value;
    }
  }, [value]);

  const handleInput = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastProp.current = html;
    onChange(html);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
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
        data-placeholder={placeholder}
        className={`outline-none focus:bg-amber-50 focus:ring-2 focus:ring-amber-300 rounded px-1 -mx-1 transition-colors ${className}`}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    </div>
  );
}
