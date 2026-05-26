import Editable from "../components/Editable.jsx";
import ImageSlot from "../components/ImageSlot.jsx";

export default function ImageTextEditor({ block, update }) {
  const ImageHalf = (
    <div className="flex-1 min-w-0">
      <ImageSlot
        url={block.imageUrl}
        alt={block.alt}
        onChange={({ url, alt }) => update({ imageUrl: url, alt })}
      />
    </div>
  );
  const TextHalf = (
    <div className="flex-1 min-w-0 space-y-2">
      <Editable
        value={block.heading}
        onChange={(v) => update({ heading: v })}
        className="text-xl font-bold text-stone-900"
        placeholder="Section title"
      />
      <Editable
        value={block.body}
        onChange={(v) => update({ body: v })}
        multiline
        className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap"
        placeholder="Body text"
      />
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-5 items-start">
        {block.side === "left" ? ImageHalf : TextHalf}
        {block.side === "left" ? TextHalf : ImageHalf}
      </div>
      <button
        onClick={() => update({ side: block.side === "left" ? "right" : "left" })}
        className="text-xs text-stone-500 hover:text-stone-900 underline"
      >
        Flip image to {block.side === "left" ? "right" : "left"}
      </button>
    </div>
  );
}
