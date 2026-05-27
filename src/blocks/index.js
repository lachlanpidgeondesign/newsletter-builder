import { Type, Image as ImageIcon, Columns2, ImagePlus, CodeXml } from "lucide-react";
import HeadingTextEditor from "./HeadingTextEditor.jsx";
import ImageTextEditor from "./ImageTextEditor.jsx";
import TwoImagesEditor from "./TwoImagesEditor.jsx";
import SingleImageEditor from "./SingleImageEditor.jsx";
import CustomHtmlEditor from "./CustomHtmlEditor.jsx";

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

const hasHtmlContent = (s = "") => {
  const plain = String(s)
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();
  return plain.length > 0;
};

const sanitizeRichText = (html = "") => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html), "text/html");
  const allowedInline = new Set(["b", "strong", "i", "em", "u", "s", "strike", "a", "br"]);
  const allowedBlock = new Set(["ul", "ol", "li"]);

  const isSafeUrl = (url) => /^(https?:|mailto:|tel:|\/|#)/i.test(url);

  const sanitizeNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return esc(node.textContent || "");
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    const children = Array.from(node.childNodes).map(sanitizeNode).join("");

    if (allowedInline.has(tag)) {
      if (tag === "br") return "<br>";
      if (tag === "a") {
        const href = (node.getAttribute("href") || "").trim();
        if (!href || !isSafeUrl(href)) return children;
        return `<a href="${esc(href)}">${children}</a>`;
      }
      return `<${tag}>${children}</${tag}>`;
    }

    if (allowedBlock.has(tag)) {
      return `<${tag}>${children}</${tag}>`;
    }

    // Convert block-level elements (div, p, h1-h6, etc.) to line breaks for email safety.
    // Keeping them as-is can break Gmail when nested divs close MJML's wrapper div.
    if (tag === "div" || tag === "p" || /^h[1-6]$/.test(tag)) {
      // <div><br></div> is contentEditable's "empty line" — treat as single <br>
      const isEmptyLine =
        node.childNodes.length === 1 &&
        node.childNodes[0].nodeType === Node.ELEMENT_NODE &&
        node.childNodes[0].tagName.toLowerCase() === "br";
      if (isEmptyLine) return "<br>";
      return `<br>${children}`;
    }

    // Drop unsupported tags but keep their text/children.
    return children;
  };

  const raw = Array.from(doc.body.childNodes).map(sanitizeNode).join("");
  // Strip leading <br> tags and collapse runs of 3+ <br> down to 2 (one paragraph break)
  return raw
    .replace(/^(<br\s*\/?>)+/i, "")
    .replace(/(<br\s*\/?>){3,}/gi, "<br><br>");
};

const sectionPadding = (isFirst = false) => `${isFirst ? 24 : 0}px 16px 24px 16px`;

export const BLOCK_TYPES = {
  heading_text: {
    label: "Heading + Text",
    icon: Type,
    Editor: HeadingTextEditor,
    create: () => ({
      type: "heading_text",
      heading: "",
      body: "Write your paragraph here. Click any text to edit it directly.",
    }),
    toMJML: (b, opts = {}) => {
      const headingHtml = sanitizeRichText(b.heading);
      const bodyHtml = sanitizeRichText(b.body);
      const heading = hasHtmlContent(b.heading)
        ? `<mj-text font-size="20px" font-weight="700" line-height="1.25" color="#000000" padding-bottom="8px">
            ${headingHtml}
          </mj-text>`
        : "";
      return `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
        <mj-column>
          ${heading}
          <mj-text>
            ${bodyHtml}
          </mj-text>
        </mj-column>
      </mj-section>`;
    },
  },

  image_text: {
    label: "Text + Image",
    icon: ImageIcon,
    Editor: ImageTextEditor,
    create: () => ({
      type: "image_text",
      imageUrl: "",
      alt: "",
      heading: "",
      body: "Paragraph text sitting next to (or below, on mobile) your image.",
      side: "right",
    }),
    toMJML: (b, opts = {}) => {
      const headingHtml = sanitizeRichText(b.heading);
      const bodyHtml = sanitizeRichText(b.body);
      const imageCol = b.imageUrl
        ? `<mj-column width="50%" padding-${b.side === 'left' ? 'right' : 'left'}="8px" css-class="col-gap-reset${b.side === 'left' ? ' col-gap-mobile' : ''}">
             <mj-image src="${esc(b.imageUrl)}" alt="${esc(b.alt)}" padding="0" />
           </mj-column>`
        : `<mj-column width="50%" padding-${b.side === 'left' ? 'right' : 'left'}="8px" css-class="col-gap-reset${b.side === 'left' ? ' col-gap-mobile' : ''}"><mj-spacer height="1px" /></mj-column>`;
      const heading = hasHtmlContent(b.heading)
        ? `<mj-text font-size="20px" font-weight="700" line-height="1.25" color="#000000" padding-bottom="8px">
            ${headingHtml}
          </mj-text>`
        : "";
      const textCol = `<mj-column width="50%" padding-${b.side === 'left' ? 'left' : 'right'}="8px" css-class="col-gap-reset${b.side !== 'left' ? ' col-gap-mobile' : ''}">
          ${heading}
          <mj-text>
            ${bodyHtml}
          </mj-text>
        </mj-column>`;
      return `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
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
    toMJML: (b, opts = {}) => {
      const col = (url, alt, side) => `
        <mj-column width="50%" padding-${side === 'left' ? 'right' : 'left'}="8px" css-class="col-gap-reset${side === 'left' ? ' col-gap-mobile' : ''}">
          ${url ? `<mj-image src="${esc(url)}" alt="${esc(alt)}" padding="0" />` : `<mj-spacer height="1px" />`}
        </mj-column>`;
      return `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
        ${col(b.leftUrl, b.leftAlt, 'left')}
        ${col(b.rightUrl, b.rightAlt, 'right')}
      </mj-section>`;
    },
  },

  single_image: {
    label: "Single Image",
    icon: ImagePlus,
    Editor: SingleImageEditor,
    create: () => ({
      type: "single_image",
      imageUrl: "",
      alt: "",
    }),
    toMJML: (b, opts = {}) => {
      const img = b.imageUrl
        ? `<mj-image src="${esc(b.imageUrl)}" alt="${esc(b.alt)}" width="360px" padding="0" />`
        : `<mj-spacer height="1px" />`;
      return `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
        <mj-column>
          ${img}
        </mj-column>
      </mj-section>`;
    },
  },

  custom_html: {
    label: "Custom HTML",
    icon: CodeXml,
    Editor: CustomHtmlEditor,
    create: () => ({
      type: "custom_html",
      html: "",
    }),
    toMJML: (b, opts = {}) => b.html ? `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
        <mj-column>
          <mj-text>${b.html}</mj-text>
        </mj-column>
      </mj-section>` : "",
  },
};
