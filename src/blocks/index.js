import { Type, Image as ImageIcon, Columns2, ImagePlus, CodeXml, Gamepad2 } from "lucide-react";
import HeadingTextEditor from "./HeadingTextEditor.jsx";
import ImageTextEditor from "./ImageTextEditor.jsx";
import TwoImagesEditor from "./TwoImagesEditor.jsx";
import SingleImageEditor from "./SingleImageEditor.jsx";
import CustomHtmlEditor from "./CustomHtmlEditor.jsx";
import GamePromoEditor from "./GamePromoEditor.jsx";

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

const GAME_COLORS = {
  orange: { bg: "#FEF7EC", border: "#F8CD8B", chevron: "#926725" },
  pink:   { bg: "#FBEAF2", border: "#E583B1", chevron: "#7F1D4B" },
  purple: { bg: "#EEF0FF", border: "#9AA3FF", chevron: "#343D99" },
  green:  { bg: "#E5FAF5", border: "#66E0C4", chevron: "#007A5E" },
};

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

  game_promo: {
    label: "Games Promo",
    icon: Gamepad2,
    Editor: GamePromoEditor,
    create: () => ({
      type: "game_promo",
      gameName: "",
      description: "",
      linkUrl: "",
      svgUrl: "",
      color: "orange",
      showBadge: false,
    }),
    toMJML: (b, opts = {}) => {
      const c = GAME_COLORS[b.color] || GAME_COLORS.orange;
      const name = esc(b.gameName || "Game");
      const desc = esc(b.description || "");
      const href = esc(b.linkUrl || "#");
      const badge = b.showBadge
        ? ` <span style="display:inline-block;background-color:#191919;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;padding:3px 6px;border-radius:4px;text-transform:uppercase;vertical-align:middle;white-space:nowrap;">NEW</span>`
        : "";
      const icon = b.svgUrl
        ? `<img src="${esc(b.svgUrl)}" width="48" height="48" alt="${name}" style="display:block;" />`
        : `<span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;">&#9654;</span>`;
      return `
      <mj-section padding="${sectionPadding(opts.isFirst)}">
        <mj-column>
          <mj-text padding="0"><a href="${href}" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:${c.bg};border-radius:12px;border:1px solid ${c.border};overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:${c.border};border-radius:8px;">${icon}</td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;line-height:1.3;">${name}${badge}</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">${desc}</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:${c.chevron};">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>
        </mj-column>
      </mj-section>`;
    },
  },
};
