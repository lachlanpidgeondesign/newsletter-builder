import { useRef, useEffect } from "react";

/**
 * Contenteditable text that commits on blur.
 *
 * Why we don't sync value -> DOM on every render:
 * React would overwrite the user's caret position mid-typing. Instead we
 * only write the prop into the DOM when it changes from outside (e.g.
 * load from JSON), tracked via a ref.
 */
export default function Editable({ value, onChange, className = "", multiline = false, placeholder = "" }) {
  const ref = useRef(null);
  const lastProp = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastProp.current && value !== ref.current.innerText) {
      ref.current.innerText = value || "";
      lastProp.current = value;
    }
  }, [value]);

  const handleBlur = () => {
    if (!ref.current) return;
    const text = ref.current.innerText;
    lastProp.current = text;
    onChange(text);
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-placeholder={placeholder}
      className={`outline-none focus:bg-amber-50 focus:ring-2 focus:ring-amber-300 rounded px-1 -mx-1 transition-colors ${className}`}
    >
      {value}
    </div>
  );
}
