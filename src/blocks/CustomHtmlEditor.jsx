import { useState } from "react";

export default function CustomHtmlEditor({ block, update }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Custom HTML</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-stone-500 hover:text-stone-900 underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>
      <textarea
        value={block.html}
        onChange={(e) => update({ html: e.target.value })}
        className={`w-full font-mono text-xs bg-stone-50 border border-stone-200 rounded p-3 focus:outline-none focus:border-stone-400 resize-y ${
          expanded ? "min-h-[300px]" : "min-h-[100px]"
        }`}
        placeholder="Paste your HTML here..."
        spellCheck={false}
      />
      {block.html && (
        <details className="text-xs text-stone-500">
          <summary className="cursor-pointer hover:text-stone-700">Preview</summary>
          <div
            className="mt-2 p-3 bg-white border border-stone-200 rounded overflow-auto"
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </details>
      )}
    </div>
  );
}
