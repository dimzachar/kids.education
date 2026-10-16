import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import * as A from "../kit/audit.mjs";
import { kidsPage, statusHtml } from "../shared/page.mjs";
import { auditPoses, settled } from "../shared/audit.mjs";
import * as J from "./geometry.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const M = J.M;
const P = J.fit(M);
const OPEN = M.SWITCH.open;

// Paint in the order the kit measures: every overlapping pair ray-cast, nearer last.
// The blade is measured closed (its resting, touching pose) and keeps that slot while it moves.
const closed = settled(P, J.figureItems(P, M, 0, A));
// the glow draws no body, so the sort can't place it: it goes just under the bulb
const glow = closed.splice(closed.findIndex((it) => it.name === "lamp.glow"), 1)[0];
closed.splice(closed.findIndex((it) => it.name === "lamp.bulb"), 0, glow);
const names = closed.map((it) => it.name);
const ordered = (deg) => J.figureItems(P, M, deg, A).sort((a, b) => names.indexOf(a.name) - names.indexOf(b.name));
const body = closed.map((it) => (it.name === "switch.blade" ? `<g data-part="blade">${J.svgOf(J.bladeItems(P, M, OPEN))}</g>` : it.svg));

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label: "A battery, a knife switch and a lamp on a wooden board, joined into a loop by three copper wires. Closing the switch completes the loop and the lamp lights.",
  body: [...body, J.flowSvg(P, M)],
});

const plate = k.plateHtml({
  fig: "Fig 4",
  title: "Switch and lamp",
  hint: "Tap the switch, or press the button",
  readout: "switch open · no loop · lamp off",
  keys: [
    { mark: "blue", label: "Battery: it pushes the electricity round" },
    { mark: "red", label: "Switch: a gap in the loop, or a bridge across it" },
    { mark: "lit", label: "Lamp: it only lights when the loop is complete" },
  ],
  caption: "Electricity needs a complete loop from one end of the battery to the other. The switch opens a gap in it, or closes the gap.",
  body: `<div class="iso-stage" tabindex="0" role="switch" aria-checked="false" aria-label="Knife switch. Space or Enter flips it.">${svg}</div>`,
});

const CSS = `
.cx-wire{--anatomy-shade-2:#d98a5c;--anatomy-top:#f1b892;--anatomy-shade-0:#a85a33;--anatomy-lo:#8a4524}
.cx-flow{opacity:0;transition:opacity .4s}
.cx-flow .iso-line{stroke:#4f8fe6;stroke-width:1.6px}
.cx-flow .iso-wire-end{fill:#4f8fe6;stroke:#2c569a}
.cx-on .cx-flow{opacity:.9}
.cx-glow{fill:url(#cx-glow);opacity:0;transition:opacity .5s}
.cx-on .cx-glow{opacity:1}
.cx-bulb .iso-solid{transition:none}
.cx-on .cx-bulb .jk-white{--anatomy-paper:#ffd54a;--anatomy-face:#ffe27a;--anatomy-top:#fff1b8;--anatomy-shade-0:#e8a81c;--anatomy-shade-1:#f2b82a;--anatomy-shade-2:#f9c93a;--anatomy-shade-3:#ffd54a;--anatomy-hi:#b07a0a}
`;

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const svgEl = stage.querySelector("svg");
svgEl.insertAdjacentHTML("afterbegin", '<defs><radialGradient id="cx-glow"><stop offset="0" stop-color="#ffe27a" stop-opacity=".85"/><stop offset=".45" stop-color="#ffd54a" stop-opacity=".35"/><stop offset="1" stop-color="#ffd54a" stop-opacity="0"/></radialGradient></defs>');
const bladeEl = svgEl.querySelector('[data-part="blade"]');
const flipBtn = document.getElementById("flip");
const s = { closed: false, theta: { at: ${OPEN}, rate: 0 }, on: false, clock: 0 };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.8, quietUntil = 0, lastTheta = null;
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
  if (touring && s.clock >= quietUntil && s.clock >= tourAt) { flip(); tourAt = s.clock + 3; }
  const settled = springStep(s.theta, s.closed ? 0 : ${OPEN}, dt, s.closed ? [160, 12] : [120, 16], still.matches);
  if (s.theta.at < 0) { s.theta.at = 0; s.theta.rate *= -0.25; } // the blade lands on the contact and bounces a little
  const on = s.closed && s.theta.at < 1.5;
  if (on !== s.on) { s.on = on; stage.classList.toggle("cx-on", on); say(); }
  draw();
  frame = visible && !(settled && !touring) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 8; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 8200); }
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
flipBtn.addEventListener("click", () => { takeOver(); flip(); });
stage.addEventListener("pointerdown", (event) => { if (event.button === 0) { takeOver(); flip(); } });
stage.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); takeOver(); flip(); } });
say();
draw();
`;

auditPoses(P, { closed: ordered(0), open: ordered(OPEN) });

const html = kidsPage({
  title: "Why does the lamp light up?",
  subtitle: "There is a gap in the loop. Nothing can flow.",
  plate,
  controls: `
  <button class="jk-btn jk-btn-red" id="flip" type="button">Close the switch</button>
  ${statusHtml("Lamp off")}`,
  steps: [
    { colour: "blue", title: "The battery pushes", text: "A battery is like a pump for electricity. It pushes it out of one end and pulls it back in at the other." },
    { colour: "red", title: "The switch is a gap or a bridge", text: "With the blade up there is a gap, and the push goes nowhere. Drop the blade and the gap is bridged." },
    { colour: "yellow", title: "A full loop lights the lamp", text: "When the loop is complete, electricity runs all the way round and squeezes through the lamp's thin wire, which glows." },
  ],
  grown: [
    ["A circuit is a loop.", "Current only flows when there is an unbroken conducting path from the battery's positive terminal, through the load, back to the negative terminal. An open switch breaks that path anywhere, so nothing flows anywhere."],
    ["Voltage, current, resistance.", "The battery provides the push (voltage, V). The lamp's filament resists (R), and the current that results is I = V / R (Ohm's law). The filament gets hot enough to glow because it has the most resistance in the loop."],
    ["Series circuits.", "All three parts are in one loop, so the same current passes through each. That is why one open switch anywhere kills the whole thing, and why old string lights all went out when one bulb failed."],
  ],
  css: CSS,
  live,
  geometry: "circuit/geometry.mjs",
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote circuit/index.html", (html.length / 1024).toFixed(0) + " KB");
