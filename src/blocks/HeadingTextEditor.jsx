import Editable from "../components/Editable.jsx";

export default function HeadingTextEditor({ block, update, readOnly = false }) {
  return (
    <div className="space-y-2">
      <Editable
        value={block.heading}
        onChange={(v) => update({ heading: v })}
        className="text-2xl font-bold text-stone-900"
        placeholder="Headline (optional)"
        readOnly={readOnly}
      />
      <Editable
        value={block.body}
        onChange={(v) => update({ body: v })}
        multiline
        className="text-base text-stone-700 leading-relaxed whitespace-pre-wrap"
        placeholder="Body text"
        readOnly={readOnly}
      />
    </div>
  );
}
