// Captures the training screenshots from the live public classes site (1440×810) and writes the
// highlighted element of each step to src/content/highlights.ts.
// Read-only: it searches, opens the registration wizard and moves from step 1 to the (empty) step 2
// form. It never types personal details and never submits a registration.
//   npm run capture
import { writeFileSync } from "node:fs";
import { chromium, type Locator, type Page } from "playwright-core";

const SITE = "https://hugim.eprmuni.co.il";
const MUNI = "municipalityCode=1780";
const W = 1440;
const H = 810;
const WIZARD = `${SITE}/registration/rate-selection?${MUNI}&categories=10&classCode=2199&classGroupCode=1350`;

type Shot = { id: string; go: (p: Page) => Promise<void>; hl: (p: Page) => Locator[]; pad?: number };

const open = async (p: Page, url: string) => {
  await p.goto(url, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500); // illustrations load late
  // the site's logo image is broken on this municipality — hide the broken-image icon
  await p.addStyleTag({ content: "header img[alt=logo]{visibility:hidden}" });
};
const home = (p: Page) => open(p, `${SITE}/main?${MUNI}`);
const pickDomain = async (p: Page) => {
  await p.getByText("בחירת תחום").first().click();
  await p.getByText("כדורגל", { exact: true }).last().click();
  await p.keyboard.press("Escape");
  await p.waitForTimeout(400);
};
const search = (p: Page) => p.locator("button:has(mat-icon:text('search'))").last().click();
const results = async (p: Page) => {
  await home(p);
  await pickDomain(p);
  await search(p);
  await p.waitForSelector(".class-row");
};
const calendar = async (p: Page) => {
  const box = await p.locator("input[placeholder='DD/MM/YYYY']").first().boundingBox();
  await p.mouse.click(box!.x + 36, box!.y + box!.height / 2); // the calendar icon at the field's end (RTL)
  await p.waitForTimeout(500);
};
const step2 = async (p: Page) => {
  await open(p, WIZARD);
  await calendar(p);
  await p.locator(".mat-calendar-body-cell:not(.mat-calendar-body-disabled)").first().click();
  await p.getByRole("button", { name: "המשך" }).click();
  await p.waitForURL(/applicant-details/);
};

const SHOTS: Shot[] = [
  { id: "0.1", go: home, hl: (p) => [p.getByText("מצאו את החוג הבא שלכם").first(), p.locator("input").first(), p.locator("button:has(mat-icon:text('search'))").last()], pad: 28 },
  { id: "1.1", go: home, hl: (p) => [p.getByText("מצאו את החוג הבא שלכם").first(), p.locator("input").first(), p.locator("button:has(mat-icon:text('search'))").last()], pad: 28 },
  { id: "1.2", go: async (p) => { await home(p); await p.locator("input").first().fill("כדורגל"); }, hl: (p) => [p.locator("input").first()] },
  { id: "1.3", go: async (p) => { await home(p); await p.getByText("בחירת תחום").first().click(); await p.waitForTimeout(500); }, hl: (p) => [p.locator(".cdk-overlay-pane").first()] },
  { id: "1.4", go: async (p) => { await home(p); await pickDomain(p); await p.getByText("בחירת חוג").first().click(); await p.waitForTimeout(500); }, hl: (p) => [p.locator(".cdk-overlay-pane").first()] },
  { id: "1.5", go: results, hl: (p) => [p.locator(".class-row").first()] },
  { id: "1.6", go: results, hl: (p) => [p.locator(".found-result").first(), p.locator("mat-chip, mat-chip-row, [class*=chip]").first()] },
  { id: "1.7", go: results, hl: (p) => [p.getByText("הרשמה", { exact: true }).first()] },
  { id: "2.1", go: (p) => open(p, WIZARD), hl: (p) => [p.getByText("בחירת מסלול").first(), p.getByText("סיום", { exact: true }).first()], pad: 44 },
  { id: "2.2", go: (p) => open(p, WIZARD), hl: (p) => [p.locator("mat-radio-button").first()] },
  { id: "2.3", go: async (p) => { await open(p, WIZARD); await calendar(p); }, hl: (p) => [p.locator("mat-calendar").first()] },
  { id: "2.4", go: async (p) => { await open(p, WIZARD); await p.getByRole("button", { name: "המשך" }).click(); await p.waitForTimeout(500); }, hl: (p) => [p.locator("input[placeholder='DD/MM/YYYY']").first(), p.getByText("שדה חובה").first()] },
  { id: "3.1", go: step2, hl: (p) => [p.getByText("שם פרטי").first(), p.locator("input").nth(2)] },
  { id: "3.2", go: step2, hl: (p) => [p.getByText("תאריך לידה").first(), p.getByPlaceholder("רחוב ומספר בית")] },
  { id: "3.3", go: async (p) => { await step2(p); await p.getByRole("button", { name: "המשך" }).click(); await p.waitForTimeout(600); }, hl: (p) => [p.getByText("פרטי הנרשמ/ת").first(), p.getByPlaceholder("רחוב ומספר בית")], pad: 20 },
  { id: "3.4", go: step2, hl: (p) => [p.getByText("פרטים נוספים", { exact: true }).first(), p.getByText("סיום", { exact: true }).first()], pad: 44 },
  { id: "4.1", go: step2, hl: (p) => [p.getByText("חזרה לחיפוש").first()], pad: 14 },
];

async function union(ls: Locator[], pad: number) {
  const boxes = (await Promise.all(ls.map((l) => l.boundingBox()))).filter((b) => b !== null);
  if (!boxes.length) return null;
  const x1 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y1 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  const x2 = Math.min(W, Math.max(...boxes.map((b) => b.x + b.width)) + pad);
  const y2 = Math.min(H, Math.max(...boxes.map((b) => b.y + b.height)) + pad);
  const r = (v: number, d: number) => Math.round((v / d) * 1000) / 10;
  return { x: r(x1, W), y: r(y1, H), w: r(x2 - x1, W), h: r(y2 - y1, H) };
}

async function main() {
  const only = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const boxes: Record<string, unknown> = {};
  for (const s of SHOTS) {
    if (only.length && !only.includes(s.id)) continue;
    const p = await browser.newPage({ viewport: { width: W, height: H }, locale: "he-IL" });
    await s.go(p);
    await p.waitForTimeout(800);
    boxes[s.id] = await union(s.hl(p), s.pad ?? 10);
    await p.screenshot({ path: `public/screens/${s.id}.jpg`, type: "jpeg", quality: 80 });
    console.log(s.id, JSON.stringify(boxes[s.id]));
    await p.close();
  }
  await browser.close();
  if (!only.length)
    writeFileSync(
      "src/content/highlights.ts",
      `// Generated by scripts/capture-screens.ts — the highlighted element of each screenshot, in %.\n` +
        `import type { Highlight } from "./types";\n\n` +
        `export const HIGHLIGHTS: Record<string, Highlight> = ${JSON.stringify(boxes, null, 2)};\n`,
    );
}
void main();
