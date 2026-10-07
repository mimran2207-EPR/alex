// Writes docs/video-scripts.md: one HeyGen video per step for the presenter (Alex Gur),
// with the exact script to paste, the file name and an estimated length.
//   npm run video-scripts
import { existsSync, writeFileSync } from "node:fs";
import { modules } from "../src/content/lessons";

const seconds = (t: string) => Math.round(t.trim().split(/\s+/).length / 2.5);
const lines: string[] = [
  "# תסריטים לסרטוני HeyGen — הדרכת ההרשמה לחוגים",
  "",
  "מציג: **אלכס גור**, EPR מערכות. סרטון אחד לכל שלב בהדרכה.",
  "",
  "## איך מקליטים",
  "",
  "1. ב-HeyGen בוחרים את האווטאר של אלכס, רקע שחור, פורמט Portrait.",
  "2. מדביקים את התסריט של השלב **מילה במילה** (הטקסט שבציטוט).",
  "3. מורידים את הסרטון ושומרים בשם הקובץ שמופיע ליד השלב, בתיקייה `public/avatar/`.",
  "4. מריצים `python scripts/process-video.py <מספר השלב>` ומעלים לגיטהב. שלב בלי סרטון ממשיך לעבוד עם הקריינות.",
  "",
  "## מצב ההפקה",
  "",
  "| שלב | כותרת | קובץ | אורך משוער | מצב |",
  "|---|---|---|---|---|",
];
for (const m of modules)
  for (const s of m.steps)
    lines.push(`| ${s.id} | ${s.title} | \`${s.id}.mp4\` | ≈ ${seconds(s.script)} שניות | ${existsSync(`public/avatar/${s.id}.webm`) ? "✅ באתר" : "⬜"} |`);
lines.push("", "## התסריטים", "");
for (const m of modules) {
  lines.push(`### ${m.icon} ${m.title}`, "");
  for (const s of m.steps) lines.push(`**${s.id} · ${s.title}** — קובץ \`${s.id}.mp4\``, "", `> ${s.script}`, "");
}
writeFileSync("docs/video-scripts.md", lines.join("\n"), "utf8");
console.log("wrote docs/video-scripts.md");
