import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

export default function ImageSlot({ url, alt, onChange, aspect = "aspect-[4/3]" }) {
  const [draft, setDraft] = useState("");

  if (url) {
    return (
      <div className="relative group">
        <img src={url} alt={alt} className="w-full h-auto rounded block" />
        <button
          onClick={() => onChange({ url: "", alt: "" })}
          className="absolute top-2 right-2 bg-white/95 px-2 py-1 rounded text-xs shadow opacity-0 group-hover:opacity-100 transition"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${aspect} bg-stone-100 border-2 border-dashed border-stone-300 rounded p-3`}>
      <ImageIcon className="w-6 h-6 text-stone-400" />
      <span className="text-xs text-stone-500 mt-2 mb-2">Paste image URL</span>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft && onChange({ url: draft, alt })}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (draft) onChange({ url: draft, alt });
          }
        }}
        placeholder="https://..."
        className="px-2 py-1 text-xs border border-stone-300 rounded w-full text-center bg-white"
      />
    </div>
  );
}
