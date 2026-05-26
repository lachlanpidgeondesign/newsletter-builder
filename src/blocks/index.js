import { Type, Image as ImageIcon, Columns2 } from "lucide-react";
import HeadingTextEditor from "./HeadingTextEditor.jsx";
import ImageTextEditor from "./ImageTextEditor.jsx";
import TwoImagesEditor from "./TwoImagesEditor.jsx";

// Escape user text for MJML attribute and content contexts.
// MJML is parsed as XML, so &, <, >, ", ' all need escaping inside tags.
const esc = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

// Preserve newlines in body text by converting them to <br />.
// We escape first, then introduce the <br />, so the tag isn't escaped.
const escMultiline = (s = "") => esc(s).replace(/\n/g, "<br />");

export const BLOCK_TYPES = {
  heading_text: {
    label: "Heading + Text",
    icon: Type,
    Editor: HeadingTextEditor,
    create: () => ({
      type: "heading_text",
      heading: "Your headline goes here",
      body: "Write your paragraph here. Click any text to edit it directly.",
    }),
    toMJML: (b) => `
      <mj-section padding="24px 16px">
        <mj-column>
          <mj-text font-size="24px" font-weight="700" line-height="1.25" color="#000000" padding-bottom="8px">
            ${esc(b.heading)}
          </mj-text>
          <mj-text>
            ${escMultiline(b.body)}
          </mj-text>
        </mj-column>
      </mj-section>`,
  },

  image_text: {
    label: "Text + Image",
    icon: ImageIcon,
    Editor: ImageTextEditor,
    create: () => ({
      type: "image_text",
      imageUrl: "",
      alt: "",
      heading: "Section title",
      body: "Paragraph text sitting next to (or below, on mobile) your image.",
      side: "right",
    }),
    toMJML: (b) => {
      const imageCol = b.imageUrl
        ? `<mj-column width="50%">
             <mj-image src="${esc(b.imageUrl)}" alt="${esc(b.alt)}" padding="0" />
           </mj-column>`
        : `<mj-column width="50%"><mj-spacer height="1px" /></mj-column>`;
      const textCol = `<mj-column width="50%">
          <mj-text font-size="20px" font-weight="700" line-height="1.25" color="#000000" padding-bottom="8px">
            ${esc(b.heading)}
          </mj-text>
          <mj-text>
            ${escMultiline(b.body)}
          </mj-text>
        </mj-column>`;
      return `
      <mj-section padding="24px 16px">
        ${b.side === "left" ? imageCol + textCol : textCol + imageCol}
      </mj-section>`;
    },
  },

  two_images: {
    label: "Two Images",
    icon: Columns2,
    Editor: TwoImagesEditor,
    create: () => ({
      type: "two_images",
      leftUrl: "",
      leftAlt: "",
      leftUrl: "",
      leftAlt: "",
      rightUrl: "",
      rightAlt: "",
    }),
    toMJML: (b) => {
      const col = (url, alt) => `
        <mj-column width="50%">
          ${url ? `<mj-image src="${esc(url)}" alt="${esc(alt)}" padding="0" />` : `<mj-spacer height="1px" />`}
        </mj-column>`;
      return `
      <mj-section padding="24px 16px">
        ${col(b.leftUrl, b.leftAlt)}
        ${col(b.rightUrl, b.rightAlt)}
      </mj-section>`;
    },
  },
};
