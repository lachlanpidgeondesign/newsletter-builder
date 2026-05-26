import Editable from "../components/Editable.jsx";
import ImageSlot from "../components/ImageSlot.jsx";

export default function TwoImagesEditor({ block, update }) {
  return (
    <div className="flex gap-5">
      {["left", "right"].map((side) => (
        <div key={side} className="flex-1 min-w-0 space-y-2">
          <ImageSlot
            url={block[`${side}Url`]}
            alt={block[`${side}Alt`]}
            onChange={({ url, alt }) => update({ [`${side}Url`]: url, [`${side}Alt`]: alt })}
          />
          <Editable
            value={block[`${side}Caption`]}
            onChange={(v) => update({ [`${side}Caption`]: v })}
            className="text-xs text-stone-600 italic"
            placeholder="Caption"
          />
        </div>
      ))}
    </div>
  );
}
