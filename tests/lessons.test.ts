import { modules, allSteps, findStep } from "../src/content/lessons";
test("ids unique and match N.M", () => {
  const ids = allSteps.map(s => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  ids.forEach(id => expect(id).toMatch(/^\d+\.\d+$/));
});
test("every step has a Hebrew script of 20-90 words", () => {
  allSteps.forEach(s => {
    const words = s.script.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(18);
    expect(words).toBeLessThanOrEqual(90);
    expect(s.script).toMatch(/[֐-׿]/);
  });
});
test("5 modules, findStep works", () => {
  expect(modules).toHaveLength(5);
  expect(findStep("3.2")?.module.id).toBe("3");
  expect(findStep("9.9")).toBeUndefined();
});

test("exact ordered list of step ids", () => {
  expect(allSteps.map(s => s.id)).toEqual([
    "0.1",
    "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7",
    "2.1", "2.2", "2.3", "2.4",
    "3.1", "3.2", "3.3", "3.4",
    "4.1",
  ]);
});

test("every step has a highlight from its screenshot", () => {
  allSteps.forEach(s => expect(s.highlight, s.id).toBeDefined());
});

test("warnings on the two required-field steps", () => {
  expect(allSteps.filter(s => s.warning).map(s => s.id)).toEqual(["2.4", "3.3"]);
});

it.each(allSteps)("step $id: Hebrew script of 20-90 words, highlight inside the screen", (s) => {
  const words = s.script.trim().split(/\s+/).length;
  expect(words).toBeGreaterThanOrEqual(18);
  expect(words).toBeLessThanOrEqual(90);
  expect(s.script).toMatch(/[֐-׿]/);
  if (s.highlight) {
    const { x, y, w, h } = s.highlight;
    expect(Math.min(x, y, w, h)).toBeGreaterThanOrEqual(0);
    expect(x + w).toBeLessThanOrEqual(100);
    expect(y + h).toBeLessThanOrEqual(100);
  }
});

test("no warning starts with the duplicated 'שימו לב' prefix", () => {
  for (const s of allSteps) if (s.warning) expect(s.warning.startsWith("שימו לב")).toBe(false);
});
