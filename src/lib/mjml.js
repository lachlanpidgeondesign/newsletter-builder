import mjml2html from "mjml-browser";
import { BLOCK_TYPES } from "../blocks/index.js";

// ── Locked header: purple bar with logo ──
const LOCKED_HEADER = `
    <mj-section background-color="#594FE6" padding="28px 32px 24px 32px">
      <mj-column>
        <mj-image src="https://i.dailymail.co.uk/i/pix/2026/04/01/DMplusGames-white.png" width="160px" alt="Daily Mail Games" padding="0" />
      </mj-column>
    </mj-section>
    <!-- Games Channel link -->
    <mj-section background-color="#ffffff" padding="10px 16px 0 16px">
      <mj-column>
        <mj-text align="right" font-family="Inter, Montserrat, sans-serif" font-size="14px" font-weight="400" color="#000000" padding="0"><a href="https://www.dailymail.com/games/index.html" target="_blank" style="color:#000000;text-decoration:underline;">Play now</a></mj-text>
      </mj-column>
    </mj-section>
<!-- Byline section -->
<mj-section background-color="#ffffff" padding="16px 16px 0 16px" text-align="left">
  <mj-column padding="0">
    <mj-table role="presentation" cellpadding="0" cellspacing="0" width="100%" padding="0">
      <tr>
        <td width="88" valign="middle" style="padding:0 16px 0 0;">
          <img src="https://media.sailthru.com/fss/f1dzxt/e1db1c6a-e866-437b-a593-234baa4258ef/Sam-Marsden_1.png" width="88" alt="Oliver Price" style="display:block;width:88px;max-width:88px;height:auto;border:0;" />
        </td>
        <td valign="middle" style="font-family:Inter, Montserrat, sans-serif;font-size:18px;font-weight:400;line-height:1.3;color:#000000;text-align:left;">
          Oliver Price<br />
          Puzzles Editor
        </td>
      </tr>
    </mj-table>
  </mj-column>
</mj-section>

    <!-- Byline divider -->
    <mj-section background-color="#ffffff" padding="16px 16px 0 16px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#CCCCCC" padding="0" />
      </mj-column>
    </mj-section>`;


// ── Locked footer: games section + legal ──
const LOCKED_FOOTER = `
    <!-- Divider -->
    <mj-section background-color="#ffffff" padding="0 16px 24px 16px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#CCCCCC" padding="0" />
      </mj-column>
    </mj-section>

    <!-- Section heading -->
    <mj-section background-color="#ffffff" padding="24px 16px 0 16px">
      <mj-column>
        <mj-text align="center" font-family="'Literata',Inter,Arial,Helvetica,sans-serif" font-size="28px" font-weight="800" color="#191919" line-height="1.2" padding="0 0 6px 0">Today's Puzzles</mj-text>
        <mj-text align="center" font-family="Arial,Helvetica,sans-serif" font-size="15px" font-weight="400" color="#333333" line-height="1.5" padding="0 0 20px 0">Your daily dose of brain-teasing fun – two great games to play today.</mj-text>
      </mj-column>
    </mj-section>

<!-- Featured games: Trace + Relink -->
<mj-section background-color="#ffffff" padding="0 16px 28px 16px">
  <mj-column width="48%" padding="0" background-color="#FEF7EC" border="1px solid #F8CD8B" border-radius="12px" inner-border-radius="12px" css-class="game-card-first">
    <mj-text font-family="'Literata',Inter,Arial,Helvetica,sans-serif" font-size="17px" font-weight="800" color="#000000" padding="10px 12px 0 12px" line-height="1.2">Trace</mj-text>
    <mj-text font-family="Arial,Helvetica,sans-serif" font-size="12px" color="#333333" padding="4px 12px 8px 12px" line-height="1.4">Can you beat the clock?</mj-text>
    <mj-image src="https://i.dailymail.co.uk/i/pix/PuzzleReminder/Trace_260526.png" alt="Today's Trace Puzzle" padding="0" fluid-on-mobile="true" />
    <mj-button href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=word-flow&amp;type=aW50ZWdyYXRpb24x" background-color="#191919" border-radius="50px" font-family="Arial,Helvetica,sans-serif" font-size="14px" font-weight="700" color="#ffffff" padding="12px" inner-padding="12px 24px">Play Trace &#8594;</mj-button>
  </mj-column>
  <mj-column width="4%" padding="0">
    <mj-spacer height="1px" />
  </mj-column>
  <mj-column width="48%" padding="0" background-color="#EEF0FF" border="1px solid #9AA3FF" border-radius="12px" inner-border-radius="12px">
        <mj-text padding="10px 12px 0 12px" line-height="1.2"><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td valign="middle"><p style="margin:0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:17px;font-weight:800;color:#000000;display:inline;">Relink</p></td><td valign="middle" style="padding-left:6px;"><span style="display:inline-block;background-color:#191919;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;padding:3px 6px;border-radius:4px;text-transform:uppercase;">NEW</span></td></tr></table></mj-text>
    <mj-text font-family="Arial,Helvetica,sans-serif" font-size="12px" color="#333333" padding="4px 12px 8px 12px" line-height="1.4">Find the imposters</mj-text>
    <mj-image src="https://i.dailymail.co.uk/i/pix/PuzzleReminder/Trace_260526.png" alt="Relink – find the secret link" padding="0" fluid-on-mobile="true" />
    <mj-button href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=relink&amp;type=default" background-color="#191919" border-radius="50px" font-family="Arial,Helvetica,sans-serif" font-size="14px" font-weight="700" color="#ffffff" padding="12px" inner-padding="12px 24px">Play Relink &#8594;</mj-button>
  </mj-column>
</mj-section>

    <!-- About Relink blurb -->
    <mj-section background-color="#ffffff" padding="0 16px 28px 16px">
      <mj-column background-color="#EEF0FF" border="1px solid #9AA3FF" border-radius="12px">
        <mj-text font-family="Arial,Helvetica,sans-serif" font-size="14px" color="#191919" line-height="1.5" padding="14px 16px"><strong style="font-family:'Literata',Inter,Arial,Helvetica,sans-serif;color:#343D99;">New to Relink?</strong> Four rows of words, four imposters, one secret link, and a hidden answer. Can you find what connects them all?</mj-text>
      </mj-column>
    </mj-section>

    <!-- Divider -->
    <mj-section background-color="#ffffff" padding="0 16px 24px 16px">
      <mj-column>
        <mj-divider border-width="1px" border-color="#CCCCCC" padding="0" />
      </mj-column>
    </mj-section>

    <!-- More popular games heading -->
    <mj-section background-color="#ffffff" padding="0 16px 16px 16px">
      <mj-column>
        <mj-text align="center" font-family="'Literata',Inter,Arial,Helvetica,sans-serif" font-size="22px" font-weight="800" color="#191919" line-height="1.2">More popular games</mj-text>
      </mj-column>
    </mj-section>

    <!-- Game cards -->
    <mj-section background-color="#ffffff" padding="0 16px">
      <mj-column>
        <mj-text padding="0 0 10px 0"><a href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=guessword&amp;meta=guessword&amp;type=default" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:#FEF7EC;border-radius:12px;border:1px solid #F8CD8B;overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:#F8CD8B;border-radius:8px;"><img src="https://scripts.dailymail.com/static/mol-fe/static/mol-fe-xpmodule-games-channel/1.6.0/guessword-2-99e1eaa6b2f6390b.svg" width="48" height="48" alt="GuessWord" style="display:block;" /></td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;">GuessWord</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">Decipher in six attempts - or you're out</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#926725;">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>

        <mj-text padding="0 0 10px 0"><a href="https://www.dailymail.com/games/game/index.html?game=color-connect&amp;type=aW50ZWdyYXRpb24x" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:#EEF0FF;border-radius:12px;border:1px solid #9AA3FF;overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:#9AA3FF;border-radius:8px;"><img src="https://scripts.dailymail.com/static/mol-fe/static/mol-fe-xpmodule-games-channel/1.13.1/color-connect-064a227ce9b1b620.svg" width="48" height="48" alt="Colour Connect" style="display:block;" /></td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;line-height:1.3;"><span style="display:inline;">Colour Connect</span> <span style="display:inline-block;background-color:#191919;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:800;padding:3px 6px;border-radius:4px;text-transform:uppercase;vertical-align:middle;white-space:nowrap;">NEW</span></p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">Join the dots</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#343D99;">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>

        <mj-text padding="0 0 10px 0"><a href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=master-quiz&amp;meta=quiz&amp;type=default" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:#E5FAF5;border-radius:12px;border:1px solid #66E0C4;overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:#66E0C4;border-radius:8px;"><img src="https://scripts.dailymail.com/static/mol-fe/static/mol-fe-xpmodule-games-channel/1.6.0/master-quiz-0fdd8b78de968998.svg" width="48" height="48" alt="Master Quiz" style="display:block;" /></td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;">Master Quiz</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">Test your general knowledge</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#007A5E;">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>

        <mj-text padding="0 0 10px 0"><a href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=quick-crossword&amp;meta=crossword&amp;type=default" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:#FEF7EC;border-radius:12px;border:1px solid #F8CD8B;overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:#F8CD8B;border-radius:8px;"><img src="https://scripts.dailymail.com/static/mol-fe/static/mol-fe-xpmodule-games-channel/1.6.0/quick-crossword-c48d767e083c13a3.svg" width="48" height="48" alt="Quick Crossword" style="display:block;" /></td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;">Quick Crossword</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">Play against the clock!</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#926725;">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>

        <mj-text padding="0 0 0 0"><a href="https://www.dailymail.co.uk/games/game/index.html?build=15.0.3&amp;game=mini-sudoku&amp;meta=sudoku&amp;type=default" style="display:block;text-decoration:none;" target="_blank"><div style="background-color:#FBEAF2;border-radius:12px;border:1px solid #E583B1;overflow:hidden;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:12px;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td width="84" valign="middle" style="padding:0;"><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="72"><tr><td width="72" height="72" align="center" valign="middle" style="background-color:#E583B1;border-radius:8px;"><img src="https://scripts.dailymail.com/static/mol-fe/static/mol-fe-xpmodule-games-channel/1.6.0/mini-sudoku-4245eab06c739f3e.svg" width="48" height="48" alt="Mini Sudoku" style="display:block;" /></td></tr></table></td><td valign="middle"><p style="margin:0 0 4px 0;font-family:'Literata',Inter,Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#1a1a2e;">Mini Sudoku</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:400;color:#333333;line-height:1.4;">Bite sized take on a classic</p></td><td width="20" valign="middle" align="right"><span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#7F1D4B;">&#8250;</span></td></tr></table></td></tr></table></div></a></mj-text>
      </mj-column>
    </mj-section>

    <!-- Want more + CTA -->
    <mj-section background-color="#ffffff" padding="32px 16px 8px 16px">
      <mj-column>
        <mj-text align="center" font-family="Arial,Helvetica,sans-serif" font-size="12px" font-weight="700" color="#666666" padding="0 0 14px 0" text-transform="uppercase" letter-spacing="0.1em">Want more?</mj-text>
        <mj-text align="center" font-family="Arial,Helvetica,sans-serif" font-size="15px" font-weight="700" color="#1a1a2e" padding="0 0 16px 0">Head over to the <a href="https://www.dailymail.co.uk/games/index.html" target="_blank" style="color:#285cff;text-decoration:none;font-weight:700;">Games channel</a> for the full collection.</mj-text>
        <mj-button href="https://www.dailymail.co.uk/games/index.html" background-color="#191919" border-radius="50px" font-family="Arial,Helvetica,sans-serif" font-size="16px" font-weight="700" color="#ffffff" padding="0 0 8px 0" inner-padding="16px 44px">Play now &#8594;</mj-button>
      </mj-column>
    </mj-section>

    <!-- Legal footer -->
    <mj-section padding="16px 16px 8px 16px">
      <mj-column>
        <mj-text align="center" font-family="Verdana,sans-serif" font-size="12px" line-height="18px" color="#666666" padding="0">If you would like to stop receiving this newsletter at any time, please <a href="{UnsubLink}" target="_blank" style="color:#285cff;text-decoration:none;">click here</a>.</mj-text>
        <mj-text align="center" font-family="Verdana,sans-serif" font-size="12px" line-height="18px" color="#666666" padding="4px 0 0 0">This email was sent by Associated Newspapers Limited, Northcliffe House, 9 Derry Street, London W8 5HY Registered in England and Wales with company number 3363661</mj-text>
      </mj-column>
    </mj-section>`;

/**
 * Build a full MJML document from editor state, then compile to HTML.
 */
export function generateMJML(blocks, subject) {
  const body = blocks
    .map((b, index) => BLOCK_TYPES[b.type]?.toMJML(b, { isFirst: index === 0 }) || "")
    .join("\n");

  return `<mjml>
<mj-head>
  <mj-title>${escapeXml(subject || "Your Daily Puzzles")}</mj-title>
  <mj-font name="Literata" href="https://fonts.googleapis.com/css2?family=Literata:wght@800&amp;display=swap" />
  <mj-attributes>
    <mj-all font-family="Inter, Montserrat, sans-serif" />
    <mj-section background-color="#ffffff" />
    <mj-text font-size="17px" font-weight="400" line-height="1.55" color="#000000" letter-spacing="0" padding="0" />
  </mj-attributes>
  <mj-style>
    a { color: #285cff; }
    @media only screen and (max-width: 480px) {
      .col-gap-reset > table > tbody > tr > td { padding-left: 0 !important; padding-right: 0 !important; }
      .col-gap-mobile > table > tbody > tr > td { padding-bottom: 16px !important; }
      .game-card-first { margin-bottom: 16px !important; }
    }
  </mj-style>
  <mj-preview>Play today's Trace &amp; brand-new Relink – plus GuessWord, Master Quiz, and more!</mj-preview>
</mj-head>
  <mj-body background-color="#EEF0FF" width="600px">
    <mj-raw>
      <div style="display:none">{beacon}</div>
    </mj-raw>
    ${LOCKED_HEADER}
    ${body}
    ${LOCKED_FOOTER}
    <mj-raw>
      <span style="display:none">{optout_confirm_url}</span>
    </mj-raw>
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
