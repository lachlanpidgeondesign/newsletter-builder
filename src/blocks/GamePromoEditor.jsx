const COLOR_OPTIONS = [
  { id: "orange", label: "Orange", bg: "#FEF7EC", border: "#F8CD8B" },
  { id: "pink", label: "Pink", bg: "#FBEAF2", border: "#E583B1" },
  { id: "purple", label: "Purple", bg: "#EEF0FF", border: "#9AA3FF" },
  { id: "green", label: "Green", bg: "#E5FAF5", border: "#66E0C4" },
];

export default function GamePromoEditor({ block, update }) {
  const color = COLOR_OPTIONS.find((c) => c.id === block.color) || COLOR_OPTIONS[0];

  return (
    <div className="space-y-3">
      {/* Preview card */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: color.bg, borderColor: color.border }}
      >
        <div className="flex items-center gap-3 p-3">
          <div
            className="w-[72px] h-[72px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: color.border }}
          >
            {block.svgUrl ? (
              <img src={block.svgUrl} alt={block.gameName} className="w-12 h-12" />
            ) : (
              <span className="text-white text-xs">Icon</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-stone-900" style={{ fontFamily: "'Literata', Inter, sans-serif" }}>
                {block.gameName || "Game Name"}
              </span>
              {block.showBadge && (
                <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded uppercase font-bold whitespace-nowrap">
                  New
                </span>
              )}
            </div>
            <p className="text-sm text-stone-600 mt-0.5">{block.description || "Game description"}</p>
          </div>
          <span className="text-lg" style={{ color: color.border }}>›</span>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Game Name</label>
          <input
            type="text"
            value={block.gameName}
            onChange={(e) => update({ gameName: e.target.value })}
            placeholder="GuessWord"
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-stone-200 rounded focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Description</label>
          <input
            type="text"
            value={block.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Decipher in six attempts"
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-stone-200 rounded focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Link URL</label>
          <input
            type="url"
            value={block.linkUrl}
            onChange={(e) => update({ linkUrl: e.target.value })}
            placeholder="https://..."
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-stone-200 rounded focus:border-amber-400 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">SVG Icon URL</label>
          <input
            type="url"
            value={block.svgUrl}
            onChange={(e) => update({ svgUrl: e.target.value })}
            placeholder="https://...icon.svg"
            className="w-full mt-0.5 px-2 py-1.5 text-sm border border-stone-200 rounded focus:border-amber-400 outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">Colour</span>
          <div className="flex gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => update({ color: c.id })}
                className={`w-6 h-6 rounded-full border-2 transition ${
                  block.color === c.id ? "border-stone-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: c.border }}
                title={c.label}
              />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={block.showBadge}
            onChange={(e) => update({ showBadge: e.target.checked })}
            className="rounded"
          />
          <span className="text-[10px] uppercase tracking-wide text-stone-500 font-medium">NEW badge</span>
        </label>
      </div>
    </div>
  );
}
