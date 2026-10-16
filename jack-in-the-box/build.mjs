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

const svg = k.figureSvg({
  width: M.WIDTH,
  height: M.HEIGHT,
  label:
    "A see-through jack-in-the-box on a wooden base. A coil spring stands in the box under a clown called Jack. A crank on the right wall turns a wheel inside; a peg on the wheel comes round to a latch that holds the lid shut. When the peg lifts the latch, the lid flies open and the spring pushes Jack up.",
  body: [
    draw(J.baseItems(P, M)),
    draw(J.boxBackItems(P, M)),
    `<g data-slot="lid-open"><g data-part="lid">${draw(J.lidTopItems(P, M, M.LID_OPEN))}</g><g data-part="lid-under">${draw(J.lidUnderItems(P, M, M.LID_OPEN))}</g></g>`,
    draw(J.springBaseItems(P, M)),
    `<g data-part="spring">${draw(J.springItems(P, M, M.H_OUT))}</g>`,
    `<g data-part="jack" transform="${k.translateAlong(P, [0, 0, M.SPRING_Z + M.H_OUT])}">${draw(J.jackItems(P, M))}</g>`,
    `<g data-part="peg">${draw(J.pegItems(P, M, M.PEG_START))}</g>`,
    draw(J.wheelStaticItems(P, M)),
    `<g data-part="spokes">${draw(J.spokesItems(P, M, M.PEG_START))}</g>`,
    `<g data-slot="lid-under-closed"></g>`,
    `<g data-part="latch">${draw(J.latchItems(P, M, 0))}</g>`,
    draw(J.latchMountItems(P, M)),
    draw(J.glassItems(P, M)),
    `<g data-slot="lid-closed"></g>`,
    `<g data-part="crank">${draw(J.crankItems(P, M, M.PEG_START))}</g>`,
    J.popSvg(P, M),
  ],
});

const plate = k.plateHtml({
  fig: "Fig 1",
  title: "Jack-in-the-box",
  hint: "Tap the toy, or press the buttons",
  readout: "Jack is out · spring stretched",
  keys: [
    { mark: "red", label: "Jack: he squashes the spring when you push him in" },
    { mark: "blue", label: "Spring: it stores the push until the latch lets go" },
    { mark: "lit", label: "Handle, wheel and peg: three turns bring the peg round to the latch" },
  ],
  caption: "The handle is not a motor. It only winds a peg round to the latch; the push you stored in the spring does all the jumping.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Jack-in-the-box. Space or Enter does the next step: push Jack in, then turn the handle three times. P pushes, T turns.">${svg}</div>`,
});

const CSS = `
.jk-glass{--anatomy-paper:#cfeee2;--anatomy-face:#dcf3ea;--anatomy-top:#e4f8f0;--anatomy-shade-0:#9bd2bd;--anatomy-shade-1:#abdbc9;--anatomy-shade-2:#bde5d5;--anatomy-shade-3:#cdeee1;--anatomy-hi:#4a9a7f;--anatomy-faint:#a8d9c7}
.jk-glass .iso-fill{fill-opacity:.16}.jk-glass .iso-shade,.jk-glass .iso-top{fill-opacity:.22}
.jk-spring-under{stroke:#2f6fcc;stroke-width:3px}
.jk-spring{stroke:#7fb2f2;stroke-width:1.2px}
.jk-pop{font-family:"Baloo 2","Nunito",system-ui,sans-serif;font-weight:900;font-size:34px;fill:#e8575f;stroke:#fff;stroke-width:4px;paint-order:stroke fill;opacity:0;transform-box:fill-box;transform-origin:center}
.jk-star{fill:#f2c14e;opacity:0;transform-box:fill-box;transform-origin:center}
.jk-popfx.show .jk-pop{animation:jk-pop 1s cubic-bezier(.2,1.6,.4,1) forwards}
.jk-popfx.show .jk-star{animation:jk-twinkle .9s ease-out forwards;animation-delay:var(--d)}
@keyframes jk-pop{0%{opacity:0;transform:scale(.4) rotate(-8deg)}35%{opacity:1;transform:scale(1.15) rotate(4deg)}70%{opacity:1;transform:scale(1) rotate(-2deg)}100%{opacity:0;transform:scale(1.05) translateY(-14px)}}
@keyframes jk-twinkle{0%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(.8) translateY(-12px)}}
@media (prefers-reduced-motion:reduce){.jk-popfx.show .jk-pop{animation:jk-still 1.2s linear forwards}.jk-popfx.show .jk-star{animation:none}}
@keyframes jk-still{0%,80%{opacity:1;transform:none}100%{opacity:0}}
`;

const live = `
const P = ${JSON.stringify(P)};
const stage = document.querySelector(".iso-stage");
const svgEl = stage.querySelector("svg");
const q = (sel) => svgEl.querySelector(sel);
const springEl = q('[data-part="spring"]'), jackEl = q('[data-part="jack"]'), lidEl = q('[data-part="lid"]'), lidUnderEl = q('[data-part="lid-under"]');
const pegEl = q('[data-part="peg"]'), spokesEl = q('[data-part="spokes"]'), crankEl = q('[data-part="crank"]'), latchEl = q('[data-part="latch"]'), popEl = q('[data-part="pop"]');
const slots = { open: q('[data-slot="lid-open"]'), closed: q('[data-slot="lid-closed"]'), under: q('[data-slot="lid-under-closed"]') };
const pushBtn = document.getElementById("pushBtn"), turnBtn = document.getElementById("turnBtn");

// The model. Every number on the page comes from here.
const s = {
  state: "out", // out | pushing | in | pop
  h: { at: M.H_OUT, rate: 0 }, hTarget: M.H_OUT, hK: [140, 24],
  theta: { at: M.LID_OPEN, rate: 0 }, thetaTarget: M.LID_OPEN, thetaK: [70, 8],
  phi: M.PEG_START, phiTarget: M.PEG_START,
  psi: { at: 0, rate: 0 },
  turnsLeft: M.TURNS, clock: 0, popUntil: -1,
};
const last = { h: null, theta: null, phi: null, psi: null, lidOpen: true };
let frame = 0, lastNow = 0, visible = false, touring = !still.matches, tourAt = 1.6, quietUntil = 0;

const words = () => {
  const n = s.turnsLeft;
  switch (s.state) {
    case "pushing": return { read: "squashing the spring", sub: "Push! The spring squashes up tight.", status: "Squashing the spring…", dots: ["red", "", ""], step: 0 };
    case "in":
      if (n === M.TURNS) return { read: n + " turns to go · lid latched", sub: "Click! The latch holds the lid. Now turn the handle.", status: n + " turns to go", dots: ["red", "yellow", ""], step: 0 };
      if (n === 0) return { read: "peg at the latch · lid latched", sub: "Look! The peg pushes the latch.", status: "Peg pushing the latch…", dots: ["red", "yellow", ""], step: 1 };
      return { read: n + (n === 1 ? " turn" : " turns") + " to go · peg coming round", sub: n === 1 ? "Look! One more turn and the peg reaches the latch." : "Look! The peg is coming round.", status: n + (n === 1 ? " turn" : " turns") + " to go", dots: ["red", "yellow", ""], step: 1 };
    case "pop": return { read: "POP! the spring let go", sub: "POP! The spring pushed him up!", status: "POP! The spring let go", dots: ["red", "yellow", "blue"], step: 2 };
    default: return { read: "Jack is out · spring stretched", sub: "Can you see the spring? Push Jack in to try again.", status: "Jack is out", dots: ["", "", ""], step: -1 };
  }
};
function say() {
  chrome(words());
  pushBtn.disabled = s.state !== "out";
  turnBtn.disabled = s.state !== "in";
}

function push() {
  if (s.state !== "out") return false;
  s.state = "pushing"; s.hTarget = M.H_IN; s.hK = [140, 24]; say(); run(); return true;
}
function turnHandle() {
  if (s.state !== "in") return false;
  s.phiTarget += M.TURN; s.turnsLeft -= 1; say(); run(); return true;
}
function act() { return push() || turnHandle(); }
function pop() {
  popEl.classList.remove("show"); void popEl.getBoundingClientRect(); popEl.classList.add("show");
  s.popUntil = s.clock + 1.2;
}

function draw() {
  if (last.h !== s.h.at) { springEl.innerHTML = svgOf(springItems(P, M, s.h.at)); jackEl.setAttribute("transform", k.translateAlong(P, [0, 0, M.SPRING_Z + s.h.at])); last.h = s.h.at; }
  if (last.theta !== s.theta.at) {
    lidEl.innerHTML = svgOf(lidTopItems(P, M, s.theta.at));
    lidUnderEl.innerHTML = svgOf(lidUnderItems(P, M, s.theta.at));
    const open = s.theta.at > 60;
    if (open !== last.lidOpen) {
      if (open) { slots.open.appendChild(lidEl); slots.open.appendChild(lidUnderEl); } else { slots.under.appendChild(lidUnderEl); slots.closed.appendChild(lidEl); }
      last.lidOpen = open;
    }
    last.theta = s.theta.at;
  }
  if (last.phi !== s.phi) { pegEl.innerHTML = svgOf(pegItems(P, M, s.phi)); spokesEl.innerHTML = svgOf(spokesItems(P, M, s.phi)); crankEl.innerHTML = svgOf(crankItems(P, M, s.phi)); last.phi = s.phi; }
  if (last.psi !== s.psi.at) { latchEl.innerHTML = svgOf(latchItems(P, M, s.psi.at)); last.psi = s.psi.at; }
}

function tick(now) {
  const dt = lastNow ? Math.min((now - lastNow) / 1000, 1 / 30) : 1 / 60;
  lastNow = now;
  const calm = still.matches;
  s.clock += dt;
  if (touring && s.clock >= quietUntil && s.clock >= tourAt) {
    if (s.state === "out") { push(); tourAt = s.clock + 3; }
    else if (s.state === "in") { turnHandle(); tourAt = s.clock + 1.15; }
  }
  s.phi = follow(s.phi, s.phiTarget, dt, 0.4, calm);
  const psiSettled = springStep(s.psi, latchAngle(M, s.phi), dt, [600, 30], calm);
  if (s.state === "pushing" && s.thetaTarget !== 0 && s.h.at - M.H_IN < 2) { s.thetaTarget = 0; s.thetaK = [130, 20]; }
  if (s.state === "pushing" && s.thetaTarget === 0 && s.theta.at < 1 && Math.abs(s.theta.rate) < 6) { s.state = "in"; s.turnsLeft = M.TURNS; tourAt = s.clock + 1.3; say(); }
  if (s.state === "in" && s.psi.at < M.LATCH_OPEN * 0.6) {
    s.state = "pop"; s.thetaTarget = M.LID_OPEN; s.thetaK = [70, 8]; s.hTarget = M.H_OUT; s.hK = [420, 9];
    s.phiTarget += M.PEG_START - 90; // the wheel coasts on, so the peg slips off the latch and it springs back
    pop(); say();
  }
  const hSettled = springStep(s.h, s.hTarget, dt, s.hK, calm);
  const thetaSettled = springStep(s.theta, s.thetaTarget, dt, s.thetaK, calm);
  if (s.theta.at < 0) { s.theta.at = 0; s.theta.rate *= -0.15; }
  if (s.state === "pop" && hSettled && thetaSettled) { s.state = "out"; tourAt = s.clock + 2.4; say(); }
  draw();
  const popping = s.clock < s.popUntil;
  const settled = !touring && hSettled && thetaSettled && psiSettled && s.phi === s.phiTarget && !popping && (s.state === "out" || s.state === "in");
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { lastNow = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; quietUntil = s.clock + 7; clearTimeout(takeOver.timer); takeOver.timer = setTimeout(() => { if (!still.matches) { touring = true; tourAt = s.clock; run(); } }, 7200); }

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
pushBtn.addEventListener("click", () => { takeOver(); push(); });
turnBtn.addEventListener("click", () => { takeOver(); turnHandle(); });
stage.addEventListener("pointerdown", (event) => { if (event.button === 0) { takeOver(); act(); } });
stage.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (key === " " || key === "enter") { event.preventDefault(); takeOver(); act(); }
  if (key === "p") { takeOver(); push(); }
  if (key === "t") { takeOver(); turnHandle(); }
});
document.addEventListener("keydown", (event) => {
  if (event.target !== document.body) return;
  const key = event.key.toLowerCase();
  if (key === "p") { takeOver(); push(); }
  if (key === "t") { takeOver(); turnHandle(); }
});
say();
draw();
`;

// `node build.mjs --audit` proves the geometry in both rest poses.
auditPoses(P, { out: J.figureItems(P, M, "out", A), in: J.figureItems(P, M, "in", A) });

const html = kidsPage({
  title: "Why does Jack jump out?",
  subtitle: "Can you see the spring?",
  plate,
  controls: `
  <button class="jk-btn jk-btn-red" id="pushBtn" type="button">Push Jack in</button>
  <button class="jk-btn jk-btn-beige" id="turnBtn" type="button" disabled>Turn the handle</button>
  ${statusHtml("Jack is out")}`,
  steps: [
    { colour: "red", title: "Push Jack down", text: "Jack squashes the spring. The lid shuts and the latch hooks over a pin on the lid." },
    { colour: "yellow", title: "Turn the handle", text: "The handle spins the wheel inside. A peg on the wheel creeps round toward the latch." },
    { colour: "blue", title: "The spring lets go", text: "The peg bumps the latch off the pin. The squashed spring stretches and shoves Jack up. POP!" },
  ],
  grown: [
    ["Stored energy.", "Pushing Jack down compresses the spring. The work you do is kept as elastic potential energy, about ½·k·x² for a spring of stiffness k squashed by x."],
    ["The latch is a catch.", "It holds the lid shut against the spring's push, so nothing moves until it is released."],
    ["The crank is a trigger, not a motor.", "It turns a wheel carrying a peg, a one-lobe cam. The peg touches the latch only once per turn, which is why the pop is a surprise. Real toys put a music-box comb on the same shaft so the tune plays while the peg creeps round."],
    ["Release.", "When the peg lifts the latch, the stored energy turns into motion almost at once and the spring flings Jack upward. He bounces because the spring overshoots its rest length and settles."],
  ],
  css: CSS,
  live,
  geometry: "jack-in-the-box/geometry.mjs",
});
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote jack-in-the-box/index.html", (html.length / 1024).toFixed(0) + " KB");
