import mjml2html from "mjml-browser";
import { BLOCK_TYPES } from "../blocks/index.js";

/**
 * Build a full MJML document from editor state, then compile to HTML.
 *
 * Note on width: 600px is the email industry standard. Going wider risks
 * horizontal scrolling on older Outlook clients.
 */
export function generateMJML(blocks, subject) {
  const body = blocks
    .map((b) => BLOCK_TYPES[b.type]?.toMJML(b) || "")
    .join("\n");

  return `<mjml>
  <mj-head>
    <mj-title>${escapeXml(subject || "Newsletter")}</mj-title>
    <mj-attributes>
      <mj-all font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif" />
      <mj-text line-height="1.55" />
    </mj-attributes>
    <mj-style>
      a { color: #b45309; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f4f4f4" width="600px">
    ${body}
  </mj-body>
</mjml>`;
}

export function compileMJML(mjml) {
  const result = mjml2html(mjml, {
    validationLevel: "soft", // Don't throw on warnings — show them.
    keepComments: false,
    minify: false,
  });
  return { html: result.html, errors: result.errors || [] };
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
