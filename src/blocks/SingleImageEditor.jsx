import ImageSlot from "../components/ImageSlot.jsx";

export default function SingleImageEditor({ block, update }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[360px]">
        <ImageSlot
          url={block.imageUrl}
          alt={block.alt}
          onChange={({ url, alt }) => update({ imageUrl: url, alt })}
        />
      </div>
    </div>
  );
}
