import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage, statusHtml } from "../shared/page.mjs";
import { auditPoses } from "../shared/audit.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);
const draw = (items) => J.svgOf(items);
const START = { big: 2, little: 3 }; // tipped toward the big friend: the puzzle is to balance it

const pivot = pivotItems();
function pivotItems() {
  return J.pivotItems(P, M);
}
const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "A seesaw on a lawn: a yellow plank on an axle over a wooden block, with a big red friend on the left end and a little blue friend on the right. Moving either friend along the plank tips it one way or the other.",
  body: [draw(J.lawnItems(P, M)), draw(pivot.far), `<g data-part="seesaw">${draw(J.seesawItems(P, M, START.big, START.little, J.tiltOf(M, START.big, START.little)))}</g>`, draw(pivot.near)],
});

const plate = k.plateHtml({
  fig: "Fig 2",
  title: "Seesaw",
  hint: "Move the friends with the buttons",
  readout: "big 2 × 2 = 4 · little 3 × 1 = 3 · tips to the big friend",
  keys: [
    { mark: "red", label: "Big friend: counts double, he is twice as heavy" },
    { mark: "blue", label: "Little friend: counts once" },
    { mark: "green", label: "Balanced when both sides push the same: steps × weight" },
  ],
  caption: "A push on a seesaw is weight times distance from the middle. The little friend can balance the big one by sitting twice as far out.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Seesaw. Arrow keys move the little friend; Shift with arrow keys moves the big friend.">${svg}</div>`,
});

const CSS = `
.ss-grass-line{stroke:#8fbd70}
`;

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const seesawEl = stage.querySelector('[data-part="seesaw"]');
const s = { big: ${START.big}, little: ${START.little}, theta: { at: tiltOf(M, ${START.big}, ${START.little}), rate: 0 }, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 2.2, quietUntil = 0, tourIndex = 0, lastTheta = null;
const TOUR = [[2, 4], [3, 4], [1, 2], [2, 2], [2, 4], [4, 2], [1, 3]];

const pushOf = () => ({ big: M.BIG.weight * s.big, little: M.LITTLE.weight * s.little });
function say() {
  const { big, little } = pushOf();
  const verdict = big === little ? "balanced" : big > little ? "tips to the big friend" : "tips to the little friend";
  chrome({
    read: "big " + s.big + " × " + M.BIG.weight + " = " + big + " · little " + s.little + " × " + M.LITTLE.weight + " = " + little + " · " + verdict,
    sub: big === little ? "Balanced! " + s.big + " steps × 2 is the same as " + s.little + " steps × 1." : big > little ? "The big friend's side goes down. Can you balance it?" : "The little friend's side goes down. Can you balance it?",
    status: big === little ? "Balanced!" : big > little ? "Tips to the big friend" : "Tips to the little friend",
    dots: big === little ? ["red", "blue", "green"] : ["red", "blue", ""],
    step: big === little ? 2 : big > little ? 0 : 1,
  });
  for (const [id, on] of [["bigIn", s.big > 1], ["bigOut", s.big < M.STEPS], ["littleIn", s.little > 1], ["littleOut", s.little < M.STEPS]]) document.getElementById(id).disabled = !on;
}
function move(who, by) {
  const next = clamp(s[who] + by, 1, M.STEPS);
  if (next === s[who]) return;
  s[who] = next; say(); run();
}
function draw() {
  if (lastTheta === s.theta.at) return;
  seesawEl.innerHTML = svgOf(seesawItems(P, M, s.big, s.little, s.theta.at));
  lastTheta = s.theta.at;
}
function tick(now) {
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
  lastNow = now;
  s.clock += dt;
  if (touring && s.clock >= quietUntil && s.clock >= tourAt) {
    const [big, little] = TOUR[tourIndex++ % TOUR.length];
    s.big = big; s.little = little; say();
    tourAt = s.clock + 2.8;
  }
  const settled = springStep(s.theta, tiltOf(M, s.big, s.little), dt, [40, 6.5], still.matches);
  draw();
  frame = visible && !(settled && !touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 8; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 8200); }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
for (const [id, who, by] of [["bigIn", "big", -1], ["bigOut", "big", 1], ["littleIn", "little", -1], ["littleOut", "little", 1]]) {
  document.getElementById(id).addEventListener("click", () => { takeOver(); move(who, by); });
}
stage.addEventListener("keydown", (event) => {
  const who = event.shiftKey ? "big" : "little";
  if (event.key === "ArrowRight" || event.key === "ArrowUp") { event.preventDefault(); takeOver(); move(who, who === "big" ? -1 : 1); }
  if (event.key === "ArrowLeft" || event.key === "ArrowDown") { event.preventDefault(); takeOver(); move(who, who === "big" ? 1 : -1); }
});
say();
draw();
`;

auditPoses(P, { tipped: J.figureItems(P, M, START.big, START.little, A), balanced: J.figureItems(P, M, 2, 4, A) });

const html = kidsPage({
  title: "Why does the seesaw tip?",
  subtitle: "The big friend's side goes down. Can you balance it?",
  plate,
  controls: `
  <div class="jk-group"><span>Big friend</span><button class="jk-btn jk-btn-red" id="bigIn" type="button">In</button><button class="jk-btn jk-btn-red" id="bigOut" type="button">Out</button></div>
  <div class="jk-group"><span>Little friend</span><button class="jk-btn jk-btn-blue" id="littleIn" type="button">In</button><button class="jk-btn jk-btn-blue" id="littleOut" type="button">Out</button></div>
  ${statusHtml("Tips to the big friend")}`,
  steps: [
    { colour: "red", title: "Heavy pushes harder", text: "The big friend weighs twice as much, so every step he sits from the middle counts double." },
    { colour: "blue", title: "Far out pushes harder too", text: "Sitting further from the middle gives a longer lever. Each step out is one more push." },
    { colour: "green", title: "Same push, both sides: balanced", text: "When steps × weight is the same on both ends, the plank stays level. 2 steps × 2 equals 4 steps × 1." },
  ],
  grown: [
    ["Torque.", "The turning push on a lever is force × distance from the pivot (τ = F·d). A seesaw balances when the torques on both sides are equal."],
    ["Why distance matters.", "A small weight far from the pivot can balance a large weight near it. This is the law of the lever Archimedes wrote down: F₁·d₁ = F₂·d₂."],
    ["Levers everywhere.", "Crowbars, wheelbarrows, nutcrackers, scissors and your own forearm are all levers trading force for distance the same way."],
  ],
  css: CSS,
  live,
  geometry: "seesaw/geometry.mjs",
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote seesaw/index.html", (html.length / 1024).toFixed(0) + " KB");
