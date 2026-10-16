import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage, drawPieces } from "../shared/page.mjs";
import { auditPoses, settled } from "../shared/audit.mjs";
import spec from "./spec.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);

// Taking it apart: the frame lifts off the well, the wheel stays on its axle in
// the frame; the bucket, rope and grip stay where they hang.
const EXPLODE = { order: ["frame"], moves: { frame: [0, 0, 34] } };

// Paint in the order the kit measures at rest: every overlapping pair ray-cast,
// nearer last. Each item keeps its own group, so the page can redraw the parts
// that move (bucket, rope runs, grip) in their proven slots.
const ordered = settled(P, J.figureItems(P, M, 0, A), EXPLODE);
const names = ordered.map((it) => it.name);
const inOrder = (items) => [...items].sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name));
const body = () => ordered.map((it) => `<g data-item="${it.name}"${it.piece ? ` data-piece="${it.piece}"` : ""}>${it.svg}</g>`).join("");

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "A stone well on a lawn with a wooden frame over it. A pulley wheel hangs under the crossbar; a rope runs over it, down to a blue bucket in the well on one side and to a red grip on the other. Pulling the grip down lifts the bucket.",
  body: body(),
});

const CSS = `
.pw-grass-line{stroke:#8fbd70}
.jk-rope-knot{--anatomy-paper:#c9a071;--anatomy-face:#d9b48a;--anatomy-top:#e6c8a4;--anatomy-shade-0:#8f6a42;--anatomy-shade-1:#a07a50;--anatomy-shade-2:#b08a5e;--anatomy-shade-3:#c09a6c;--anatomy-hi:#5e4225}
`;

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const slots = new Map(Array.from(stage.querySelectorAll("[data-item]")).map((g) => [g.dataset.item, g]));
const pullBtn = document.getElementById("pull"), letGoBtn = document.getElementById("letgo");
const s = { target: 0, pull: { at: 0, rate: 0 }, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.6, quietUntil = 0, lastDrawn = null;
const apart = explodeOf(stage, P, run);
function say() {
  const p = Math.round(s.pull.at);
  const moving = s.pull.at !== s.target;
  const up = s.target >= M.PULL_MAX - 0.5 && !moving;
  chrome({
    read: "rope pulled " + p + " · bucket up " + p,
    sub: up ? "The bucket is at the top. You pulled " + p + ", it rose " + p + "." : moving ? (s.target > s.pull.at ? "Pull! The wheel turns and the bucket rises." : "Let go, and down it goes.") : p === 0 ? "The bucket is down in the water. Pull the rope!" : "Keep pulling: every bit you pull down, the bucket comes up.",
    status: up ? "Bucket at the top" : p === 0 && !moving ? "Bucket in the water" : "Bucket at " + p,
    dots: [p > 0 ? "red" : "", moving ? "yellow" : "", up ? "blue" : ""],
    step: moving ? 1 : up ? 2 : p > 0 ? 0 : -1,
  });
  pullBtn.disabled = s.target >= M.PULL_MAX;
  letGoBtn.disabled = s.target <= 0;
}
function pull() { if (s.target >= M.PULL_MAX) return false; s.target = clamp(s.target + M.PULL_STEP, 0, M.PULL_MAX); say(); run(); return true; }
function letGo() { if (s.target <= 0) return false; s.target = 0; say(); run(); return true; }
function draw() {
  if (lastDrawn === s.pull.at) return;
  for (const it of liveItems(P, M, s.pull.at)) { const g = slots.get(it.name); if (g && !it.name.startsWith("rope.arc")) g.innerHTML = it.svg; }
  lastDrawn = s.pull.at;
}
function tick(now) {
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
  lastNow = now;
  const calm = still.matches;
  s.clock += dt;
  if (touring && predicted && s.clock >= quietUntil && s.clock >= tourAt) {
    if (s.target < M.PULL_MAX) { pull(); tourAt = s.clock + 1.4; } else { letGo(); tourAt = s.clock + 3.2; }
  }
  const pulling = s.target > s.pull.at;
  const settled = springStep(s.pull, s.target, dt, pulling ? [90, 16] : [40, 9], calm);
  if (s.pull.at < 0) { s.pull.at = 0; s.pull.rate *= -0.2; } // the bucket lands on the water
  if (settled) say();
  const moving = apart.tick(dt, calm);
  draw();
  frame = visible && !(settled && !moving && !touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 8; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 8200); }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
pullBtn.addEventListener("click", () => { takeOver(); pull(); });
letGoBtn.addEventListener("click", () => { takeOver(); letGo(); });
stage.addEventListener("pointerdown", (event) => { if (event.button === 0) { takeOver(); pull() || letGo(); } });
stage.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") { event.preventDefault(); takeOver(); pull(); }
  if (event.key === "Backspace") { event.preventDefault(); takeOver(); letGo(); }
});
armPredict(() => { takeOver(); pull(); });
say();
draw();
`;

auditPoses(P, {
  down: { items: ordered, ...EXPLODE },
  up: inOrder(J.figureItems(P, M, M.PULL_MAX, A)),
});

const html = kidsPage({
  spec,
  svg,
  controls: `
  <button class="jk-btn jk-btn-red" id="pull" type="button">Pull the rope</button>
  <button class="jk-btn jk-btn-beige" id="letgo" type="button" disabled>Let go</button>`,
  css: CSS,
  live,
  geometry: "pulley/geometry.mjs",
  explode: EXPLODE,
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote pulley/index.html", (html.length / 1024).toFixed(0) + " KB");
