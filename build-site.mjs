// Writes the gallery from every toy's spec. Run after the toys are built.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const TOYS = ["jack-in-the-box", "seesaw", "gears", "circuit", "pulley"];
const specs = await Promise.all(TOYS.map(async (id) => (await import(`./${id}/spec.mjs`)).default));
const COLOURS = { "Storing and releasing energy": "#e8575f", "Levers and gears": "#d9a520", "Loops and flow": "#4f8fe6", "Catches and triggers": "#3fae7a" };
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");

const families = [...new Set(specs.map((s) => s.family))];
const cards = families
  .map(
    (family) => `
  <h2 class="family" style="--c:${COLOURS[family] ?? "#6f6c7a"}"><i></i>${esc(family)}</h2>
  <div class="grid">${specs
    .filter((s) => s.family === family)
    .map(
      (s) => `
    <a class="card" href="${s.id}/" style="--c:${COLOURS[family] ?? "#6f6c7a"}">
      <span class="fig"><i></i>Fig ${s.fig} · ${esc(s.name)}</span>
      <h3>${esc(s.question)}</h3>
      <p>${esc(s.blurb)}</p>
      <div class="ask">Play →</div>
    </a>`,
    )
    .join("")}
  </div>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>How does it work? Toys for curious kids</title>
<meta name="description" content="Interactive isometric toys that show kids how everyday things work: ${specs.map((s) => s.name.toLowerCase()).join(", ")}." />
<style>
  :root { --bg: #f3ede3; --card: #fff; --ink: #2b2a33; --muted: #6f6c7a; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font-family: "Nunito", "Segoe UI", system-ui, -apple-system, sans-serif; padding: 48px 16px 72px; }
  main { max-width: 760px; margin: 0 auto; }
  h1 { text-align: center; margin: 0; font-size: clamp(1.6rem, 4.5vw, 2.4rem); letter-spacing: -0.01em; }
  .sub { text-align: center; color: var(--muted); margin: 8px 0 28px; font-size: 1.05rem; }
  .family { display: flex; align-items: center; gap: 10px; font-size: 1rem; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 28px 0 10px; }
  .family i { width: 12px; height: 12px; border-radius: 50%; background: var(--c); display: inline-block; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
  a.card { display: block; background: var(--card); border-radius: 22px; padding: 22px 22px 20px; text-decoration: none; color: inherit; box-shadow: 0 14px 32px rgba(60, 40, 20, .10), 0 2px 6px rgba(60, 40, 20, .05); transition: transform .15s, box-shadow .15s; border: 2px solid transparent; }
  a.card:hover, a.card:focus-visible { transform: translateY(-2px); box-shadow: 0 18px 40px rgba(60, 40, 20, .14), 0 2px 6px rgba(60, 40, 20, .06); outline: none; border-color: var(--c); }
  .fig { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 8px; }
  .fig i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); display: inline-block; }
  h3 { margin: 10px 0 6px; font-size: 1.2rem; }
  p { margin: 0; color: var(--muted); font-size: .95rem; line-height: 1.45; }
  .ask { margin-top: 12px; font-weight: 800; color: var(--c); font-size: .95rem; }
  footer { text-align: center; color: var(--muted); font-size: .85rem; margin-top: 36px; line-height: 1.5; }
  footer a { color: inherit; }
</style>
</head>
<body>
<main>
  <h1>How does it work?</h1>
  <p class="sub">Little see-through machines you can play with. Guess first, then tap, turn, push, and watch what moves.</p>
  ${cards}
  <footer>Each toy is a real little machine: every part rests on another part, and the numbers in the corner come from the same model that moves it.<br />Drawn with the <a href="https://github.com/wheresryan22/anatomy">Anatomy</a> kit.</footer>
</main>
</body>
</html>
`;
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote index.html for", specs.length, "toys");
