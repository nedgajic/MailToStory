import { describe, expect, it } from "vitest";
import {
  sanitizeEmailHtml,
  takeInitialEmailHtml,
} from "@/lib/sanitizeEmailHtml";

describe("sanitizeEmailHtml", () => {
  it("strips script tags", () => {
    const out = sanitizeEmailHtml(
      '<p>Hi</p><script>alert(1)</script><p>Bye</p>',
    );
    expect(out).toContain("Hi");
    expect(out).toContain("Bye");
    expect(out.toLowerCase()).not.toContain("script");
  });

  it("takeInitialEmailHtml strips Apple Mail On…wrote block before blockquote", () => {
    const html = [
      '<div dir="ltr">Hi Ned,<br><br>Thanks for your understanding.',
      "<br>Cheers</div>",
      "<div><br></div>",
      "<div>On 27 Apr 2026, at 8:46 pm, Ned Gajic &lt;ned@gmail.com&gt; wrote:</div>",
      "<blockquote>Hi Craig, quoted thread...</blockquote>",
    ].join("");
    const out = takeInitialEmailHtml(html);
    expect(out).toContain("Thanks for your understanding");
    expect(out).not.toContain("Ned Gajic");
    expect(out).not.toContain("blockquote");
  });

  it("takeInitialEmailHtml drops gmail_quote tail", () => {
    const html =
      '<div>Hello</div><div class="gmail_quote">On Mon someone wrote...</div>';
    expect(takeInitialEmailHtml(html)).toBe("<div>Hello</div>");
  });
});