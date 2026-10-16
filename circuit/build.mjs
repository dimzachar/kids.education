import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage } from "../shared/page.mjs";
import { auditPoses, settled } from "../shared/audit.mjs";
import spec from "./spec.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);
const OPEN = M.SWITCH.open;

// Taking it apart: the lamp lifts off its base, the switch off its base plate,
// the battery out of its holder. The wires stay on the board with their ends free.
const EXPLODE = { order: ["lamp", "switch", "battery"], moves: { lamp: [0, 0, 24], switch: [0, 0, 18], battery: [0, 0, 20] } };

// Paint in the order the kit measures: every overlapping pair ray-cast, nearer last.
// The blade is measured closed (its resting, touching pose) and keeps that slot while it moves.
const closed = settled(P, J.figureItems(P, M, 0, A), EXPLODE);
// the glow draws no body, so the sort can't place it: it goes just under the bulb
const glow = closed.splice(closed.findIndex((it) => it.name === "lamp.glow"), 1)[0];
closed.splice(closed.findIndex((it) => it.name === "lamp.bulb"), 0, glow);
const names = closed.map((it) => it.name);
const ordered = (deg) => J.figureItems(P, M, deg, A).sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name));
const wrap = (it, inner) => (it.piece ? `<g data-piece="${it.piece}">${inner}</g>` : inner);
const body = closed.map((it) => wrap(it, it.name === "switch.blade" ? `<g data-part="blade">${J.svgOf(J.bladeItems(P, M, OPEN))}</g>` : it.svg));

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "A battery, a knife switch and a lamp on a wooden board, joined into a loop by three copper wires. Closing the switch completes the loop and the lamp lights.",
  body: [...body, J.flowSvg(P, M)],
});

const CSS = `
.cx-wire{--anatomy-shade-2:#d98a5c;--anatomy-top:#f1b892;--anatomy-shade-0:#a85a33;--anatomy-lo:#8a4524}
.cx-flow{opacity:0;transition:opacity .4s}
.cx-flow .iso-line{stroke:#4f8fe6;stroke-width:1.6px}
.cx-flow .iso-wire-end{fill:#4f8fe6;stroke:#2c569a}
.cx-on .cx-flow{opacity:.9}
.cx-glow{fill:#ffd54a;opacity:0;filter:blur(14px);transition:opacity .5s}
.cx-on .cx-glow{opacity:.55}
.cx-bulb .iso-solid{transition:none}
.cx-on .cx-bulb .jk-white{--anatomy-paper:#ffd54a;--anatomy-face:#ffe27a;--anatomy-top:#fff1b8;--anatomy-shade-0:#e8a81c;--anatomy-shade-1:#f2b82a;--anatomy-shade-2:#f9c93a;--anatomy-shade-3:#ffd54a;--anatomy-hi:#b07a0a}
`;

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const svgEl = stage.querySelector("svg");
const bladeEl = svgEl.querySelector('[data-part="blade"]');
const flipBtn = document.getElementById("flip");
const s = { closed: false, theta: { at: ${OPEN}, rate: 0 }, on: false, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.8, quietUntil = 0, lastTheta = null;
const apart = explodeOf(stage, P, run);
function say() {
  const moving = s.theta.at !== (s.closed ? 0 : ${OPEN});
  chrome({
    read: s.on ? "switch closed · loop complete · lamp on" : "switch open · no loop · lamp off",
    sub: s.on ? "The loop is complete. Electricity flows all the way round and the lamp lights." : moving && s.closed ? "The blade is dropping onto the contact…" : "There is a gap in the loop. Nothing can flow.",
    status: s.on ? "Lamp on" : "Lamp off",
    dots: s.on ? ["blue", "red", "yellow"] : ["blue", "", ""],
    step: s.on ? 2 : s.closed ? 1 : 0,
  });
  flipBtn.textContent = s.closed ? "Open the switch" : "Close the switch";
  stage.setAttribute("aria-checked", String(s.closed));
}
function flip() { s.closed = !s.closed; say(); run(); }
function draw() {
  if (lastTheta === s.theta.at) return;
  bladeEl.innerHTML = svgOf(bladeItems(P, M, s.theta.at));
  lastTheta = s.theta.at;
}
function tick(now) {
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
  lastNow = now;
  s.clock += dt;
  if (touring && predicted && s.clock >= quietUntil && s.clock >= tourAt) { flip(); tourAt = s.clock + 3; }
  const settled = springStep(s.theta, s.closed ? 0 : ${OPEN}, dt, s.closed ? [160, 12] : [120, 16], still.matches);
  if (s.theta.at < 0) { s.theta.at = 0; s.theta.rate *= -0.25; } // the blade lands on the contact and bounces a little
  const on = s.closed && s.theta.at < 1.5;
  if (on !== s.on) { s.on = on; stage.classList.toggle("cx-on", on); say(); }
  const moving = apart.tick(dt, still.matches);
  draw();
  frame = visible && !(settled && !moving && !touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 8; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 8200); }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
flipBtn.addEventListener("click", () => { takeOver(); flip(); });
stage.addEventListener("pointerdown", (event) => { if (event.button === 0) { takeOver(); flip(); } });
stage.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); takeOver(); flip(); } });
armPredict(() => { takeOver(); if (!s.closed) flip(); });
say();
draw();
`;

auditPoses(P, { closed: { items: ordered(0), ...EXPLODE }, open: ordered(OPEN) });

const html = kidsPage({
  spec,
  svg,
  controls: `<button class="jk-btn jk-btn-red" id="flip" type="button">Close the switch</button>`,
  css: CSS,
  live,
  geometry: "circuit/geometry.mjs",
  explode: EXPLODE,
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote circuit/index.html", (html.length / 1024).toFixed(0) + " KB");
