import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../kit/iso-kit.mjs";
import { kitScript, latheScript, geometryScript } from "../scripts/inline-kit.mjs";
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
  caption:
    "The handle is not a motor. It only winds a peg round to the latch; the push you stored in the spring does all the jumping.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="Jack-in-the-box. Space or Enter does the next step: push Jack in, then turn the handle three times. P pushes, T turns.">${svg}</div>`,
});

const page = `
<header class="jk-head">
  <h1>Why does Jack jump out?</h1>
  <p class="jk-sub" id="subtitle">Can you see the spring?</p>
</header>
${plate}
<div class="jk-controls">
  <button class="jk-btn jk-btn-push" id="pushBtn" type="button">Push Jack in</button>
  <button class="jk-btn jk-btn-turn" id="turnBtn" type="button" disabled>Turn the handle</button>
  <div class="jk-status" aria-live="polite">
    <span class="jk-dots"><i class="jk-dot" id="d1"></i><i class="jk-dot" id="d2"></i><i class="jk-dot" id="d3"></i></span>
    <span id="statusText">Jack is out</span>
  </div>
</div>
<section class="jk-steps" aria-label="How it works, step by step">
  <div class="jk-step jk-step-red" id="step1"><span class="jk-num">1</span><h3>Push Jack down</h3><p>Jack squashes the spring. The lid shuts and the latch hooks over a pin on the lid.</p></div>
  <div class="jk-step jk-step-yellow" id="step2"><span class="jk-num">2</span><h3>Turn the handle</h3><p>The handle spins the wheel inside. A peg on the wheel creeps round toward the latch.</p></div>
  <div class="jk-step jk-step-blue" id="step3"><span class="jk-num">3</span><h3>The spring lets go</h3><p>The peg bumps the latch off the pin. The squashed spring stretches and shoves Jack up. POP!</p></div>
</section>
<details class="jk-grown">
  <summary>For grown-ups: what is really happening</summary>
  <ul>
    <li><b>Stored energy.</b> Pushing Jack down compresses the spring. The work you do is kept as elastic potential energy, about ½·k·x² for a spring of stiffness k squashed by x.</li>
    <li><b>The latch is a catch.</b> It holds the lid shut against the spring's push, so nothing moves until it is released.</li>
    <li><b>The crank is a trigger, not a motor.</b> It turns a wheel carrying a peg, a one-lobe cam. The peg touches the latch only once per turn, which is why the pop is a surprise. Real toys put a music-box comb on the same shaft so the tune plays while the peg creeps round.</li>
    <li><b>Release.</b> When the peg lifts the latch, the stored energy turns into motion almost at once and the spring flings Jack upward. He bounces because the spring overshoots its rest length and settles.</li>
  </ul>
</details>
`;

const CSS = `
.iso[data-theme="light"]{--anatomy-page:#f3ede3;--anatomy-card:#ffffff;--anatomy-mid:#a09a8f;--anatomy-faint:#e9e3d8}
body{font-family:"Nunito","Segoe UI",system-ui,-apple-system,sans-serif}
.iso-page{margin:40px auto 72px}
.jk-head{text-align:center;margin-bottom:-18px}
.jk-head h1{margin:0;font-size:clamp(1.5rem,4vw,2.1rem);color:#2b2a33;letter-spacing:-.01em}
.jk-sub{margin:6px 0 0;color:#6f6c7a;font-size:1.05rem;min-height:1.6em;transition:opacity .25s}
.jk-sub.swap{opacity:0}
.iso-plate{border-radius:24px;box-shadow:0 18px 40px rgba(60,40,20,.12),0 2px 6px rgba(60,40,20,.06);padding:44px 20px 40px}
.iso-stage{outline:none;touch-action:pan-y;cursor:pointer}
.iso-stage:focus-visible{outline:3px solid #4f8fe6;outline-offset:6px;border-radius:12px}
.iso-figure{margin:28px 0 20px}
.iso-legend{color:#6f6c7a}
.iso-swatch[data-mark="red"] path{stroke:#e8575f}.iso-swatch[data-mark="blue"] path{stroke:#4f8fe6}.iso-swatch[data-mark="lit"] path{stroke:#d9a520}

/* part colours: each class is a full token set, so the kit's own shading does the work */
.jk-wood{--anatomy-paper:#e9cfa6;--anatomy-face:#f0dbb9;--anatomy-top:#f3e2c4;--anatomy-shade-0:#c9a26f;--anatomy-shade-1:#d4ae7e;--anatomy-shade-2:#ddba8e;--anatomy-shade-3:#e6c89c;--anatomy-hi:#8a6236;--anatomy-faint:#cfae84;--anatomy-mid:#a9804f;--anatomy-lo:#b58e5d}
.jk-wood-line{stroke:#c9a26f}
.jk-mint{--anatomy-paper:#cfeee2;--anatomy-face:#dcf3ea;--anatomy-top:#e4f8f0;--anatomy-shade-0:#9bd2bd;--anatomy-shade-1:#abdbc9;--anatomy-shade-2:#bde5d5;--anatomy-shade-3:#cdeee1;--anatomy-hi:#4a9a7f;--anatomy-faint:#a8d9c7;--anatomy-mid:#6fb79d}
.jk-mint-lid{--anatomy-paper:#bfe6d6;--anatomy-face:#d4f0e4;--anatomy-top:#e4f8f0;--anatomy-shade-0:#8fcbb3;--anatomy-shade-1:#9ed3bf;--anatomy-shade-2:#addcca;--anatomy-shade-3:#bfe6d6;--anatomy-hi:#4a9a7f;--anatomy-faint:#9ed3bf;--anatomy-mid:#6fb79d}
.jk-mint-dark{--anatomy-paper:#b4dfce;--anatomy-face:#bfe6d6;--anatomy-top:#c8ead9;--anatomy-shade-0:#86c3ac;--anatomy-shade-1:#93cbb6;--anatomy-shade-2:#a2d4c1;--anatomy-shade-3:#b0dccb;--anatomy-hi:#4a9a7f;--anatomy-faint:#93cbb6;--anatomy-mid:#6fb79d}
.jk-glass{--anatomy-paper:#cfeee2;--anatomy-face:#dcf3ea;--anatomy-top:#e4f8f0;--anatomy-shade-0:#9bd2bd;--anatomy-shade-1:#abdbc9;--anatomy-shade-2:#bde5d5;--anatomy-shade-3:#cdeee1;--anatomy-hi:#4a9a7f;--anatomy-faint:#a8d9c7}
.jk-glass .iso-fill{fill-opacity:.16}.jk-glass .iso-shade,.jk-glass .iso-top{fill-opacity:.22}
.jk-red{--anatomy-paper:#e8575f;--anatomy-face:#ef6b72;--anatomy-top:#f58b92;--anatomy-shade-0:#c23b45;--anatomy-shade-1:#d1444e;--anatomy-shade-2:#e04f59;--anatomy-shade-3:#ec6a71;--anatomy-hi:#9e2c35;--anatomy-faint:#c23b45;--anatomy-mid:#b0333c}
.jk-white{--anatomy-paper:#f4f4f7;--anatomy-face:#fafafc;--anatomy-top:#ffffff;--anatomy-shade-0:#d7d7de;--anatomy-shade-1:#e2e2e8;--anatomy-shade-2:#ececf1;--anatomy-shade-3:#f4f4f7;--anatomy-hi:#8f8fa0;--anatomy-faint:#d7d7de;--anatomy-mid:#a7a7b5}
.jk-skin{--anatomy-paper:#f7d6ba;--anatomy-face:#fbe0c8;--anatomy-top:#fde8d4;--anatomy-shade-0:#e5b48f;--anatomy-shade-1:#edc1a0;--anatomy-shade-2:#f3cdb0;--anatomy-shade-3:#f8d9c0;--anatomy-hi:#c48a60;--anatomy-faint:#e5b48f;--anatomy-mid:#d09c72}
.jk-yellow{--anatomy-paper:#f2c14e;--anatomy-face:#f6cd67;--anatomy-top:#f8d47a;--anatomy-shade-0:#c79a1f;--anatomy-shade-1:#d8a82b;--anatomy-shade-2:#e6b43a;--anatomy-shade-3:#f0c04c;--anatomy-hi:#8f6a0c;--anatomy-faint:#c79a1f;--anatomy-mid:#a07a12}
.jk-steel{--anatomy-paper:#a9a6b8;--anatomy-face:#bdbac9;--anatomy-top:#cbc8d6;--anatomy-shade-0:#7c7890;--anatomy-shade-1:#8b879e;--anatomy-shade-2:#9b97ac;--anatomy-shade-3:#aba8ba;--anatomy-hi:#4f4b62;--anatomy-faint:#7c7890;--anatomy-mid:#66627a}
.jk-rubber{--anatomy-paper:#5a5866;--anatomy-face:#66646f;--anatomy-top:#6c6a78;--anatomy-shade-0:#45434f;--anatomy-shade-1:#4d4b57;--anatomy-shade-2:#55535f;--anatomy-shade-3:#5f5d69;--anatomy-hi:#2e2c36;--anatomy-faint:#45434f}
.jk-eye .iso-dots circle{fill:#2b2a33;opacity:1}
.jk-cheek .iso-dots circle{fill:#ff9aa2;opacity:.75}
.jk-smile{stroke:#9e2c35;stroke-width:1.1px}
.jk-spring-under{stroke:#2f6fcc;stroke-width:3px}
.jk-spring{stroke:#7fb2f2;stroke-width:1.2px}

/* the pop */
.jk-pop{font-family:"Baloo 2","Nunito",system-ui,sans-serif;font-weight:900;font-size:34px;fill:#e8575f;stroke:#fff;stroke-width:4px;paint-order:stroke fill;opacity:0;transform-box:fill-box;transform-origin:center}
.jk-star{fill:#f2c14e;opacity:0;transform-box:fill-box;transform-origin:center}
.jk-popfx.show .jk-pop{animation:jk-pop 1s cubic-bezier(.2,1.6,.4,1) forwards}
.jk-popfx.show .jk-star{animation:jk-twinkle .9s ease-out forwards;animation-delay:var(--d)}
@keyframes jk-pop{0%{opacity:0;transform:scale(.4) rotate(-8deg)}35%{opacity:1;transform:scale(1.15) rotate(4deg)}70%{opacity:1;transform:scale(1) rotate(-2deg)}100%{opacity:0;transform:scale(1.05) translateY(-14px)}}
@keyframes jk-twinkle{0%{opacity:0;transform:scale(.3)}40%{opacity:1;transform:scale(1.3)}100%{opacity:0;transform:scale(.8) translateY(-12px)}}
@media (prefers-reduced-motion:reduce){.jk-popfx.show .jk-pop{animation:jk-still 1.2s linear forwards}.jk-popfx.show .jk-star{animation:none}}
@keyframes jk-still{0%,80%{opacity:1;transform:none}100%{opacity:0}}

/* kid controls */
.jk-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center;margin-top:4px}
.jk-btn{border:none;border-radius:999px;padding:14px 24px;font:inherit;font-weight:800;font-size:1.05rem;cursor:pointer;transition:transform .12s,box-shadow .12s,opacity .2s;box-shadow:0 4px 0 rgba(0,0,0,.08)}
.jk-btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 2px 0 rgba(0,0,0,.08)}
.jk-btn:disabled{opacity:.45;cursor:not-allowed}
.jk-btn:focus-visible{outline:3px solid #4f8fe6;outline-offset:3px}
.jk-btn-push{background:#e8575f;color:#fff}.jk-btn-push:hover:not(:disabled){background:#c63f47}
.jk-btn-turn{background:#efe6d8;color:#2b2a33}.jk-btn-turn:hover:not(:disabled){background:#e0d3bf}
.jk-status{display:flex;align-items:center;gap:8px;font-size:.95rem;color:#6f6c7a;padding:8px 14px;border-radius:999px;background:#faf7f2;margin-left:auto}
.jk-dots{display:flex;gap:4px}.jk-dot{width:9px;height:9px;border-radius:50%;background:#ddd8cf;transition:background .3s;display:inline-block}
.jk-dot.red{background:#e8575f}.jk-dot.yellow{background:#f2c14e}.jk-dot.blue{background:#4f8fe6}
.jk-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}
.jk-step{border-radius:18px;padding:14px 14px 12px;background:#faf7f2;border:2px solid transparent;transition:border-color .3s,background .3s}
.jk-step.active{background:#fff}
.jk-step-red.active{border-color:#e8575f}.jk-step-yellow.active{border-color:#e4b434}.jk-step-blue.active{border-color:#4f8fe6}
.jk-num{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;color:#fff;font-weight:900;font-size:.9rem;margin-bottom:8px}
.jk-step-red .jk-num{background:#e8575f}.jk-step-yellow .jk-num{background:#f2c14e}.jk-step-blue .jk-num{background:#4f8fe6}
.jk-step h3{margin:0 0 4px;font-size:1rem;color:#2b2a33}.jk-step p{margin:0;font-size:.9rem;color:#6f6c7a;line-height:1.4}
.jk-grown{margin-top:20px;border-top:1px dashed #e4ddd0;padding-top:14px;color:#6f6c7a;font-size:.92rem;line-height:1.5}
.jk-grown summary{cursor:pointer;font-weight:800;color:#2b2a33}.jk-grown ul{padding-left:20px;margin:8px 0 0}.jk-grown li{margin-bottom:4px}.jk-grown b{color:#2b2a33}
@media (max-width:560px){.jk-steps{grid-template-columns:1fr}.jk-status{margin-left:0;width:100%;justify-content:center}.jk-head{margin-bottom:-8px}.iso-plate{padding:40px 6px 56px}}
`;

const live = `
const P = ${JSON.stringify(P)};
const RADS = Math.PI / 180;
const stage = document.querySelector(".iso-stage");
const svgEl = stage.querySelector("svg");
const q = (sel) => svgEl.querySelector(sel);
const springEl = q('[data-part="spring"]'), jackEl = q('[data-part="jack"]'), lidEl = q('[data-part="lid"]'), lidUnderEl = q('[data-part="lid-under"]');
const pegEl = q('[data-part="peg"]'), spokesEl = q('[data-part="spokes"]'), crankEl = q('[data-part="crank"]'), latchEl = q('[data-part="latch"]'), popEl = q('[data-part="pop"]');
const slots = { open: q('[data-slot="lid-open"]'), closed: q('[data-slot="lid-closed"]'), under: q('[data-slot="lid-under-closed"]') };
const readout = document.querySelector("[data-readout]");
const subtitle = document.getElementById("subtitle"), statusText = document.getElementById("statusText");
const pushBtn = document.getElementById("pushBtn"), turnBtn = document.getElementById("turnBtn");
const dots = ["d1", "d2", "d3"].map((id) => document.getElementById(id));
const steps = ["step1", "step2", "step3"].map((id) => document.getElementById(id));
const still = matchMedia("(prefers-reduced-motion: reduce)");

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

function springStep(v, target, dt, [stiff, drag], calm) {
  if (calm) { v.at = target; v.rate = 0; return true; }
  for (let i = 0; i < 4; i++) { v.rate += ((target - v.at) * stiff - v.rate * drag) * dt / 4; v.at += v.rate * dt / 4; }
  if (Math.abs(target - v.at) < 0.02 && Math.abs(v.rate) < 0.05) { v.at = target; v.rate = 0; return true; }
  return false;
}

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
  const w = words();
  if (readout.textContent !== w.read) readout.textContent = w.read;
  if (statusText.textContent !== w.status) statusText.textContent = w.status;
  if (subtitle.textContent !== w.sub) { subtitle.classList.add("swap"); setTimeout(() => { subtitle.textContent = w.sub; subtitle.classList.remove("swap"); }, 200); }
  dots.forEach((d, i) => { d.className = "jk-dot" + (w.dots[i] ? " " + w.dots[i] : ""); });
  steps.forEach((el, i) => el.classList.toggle("active", i === w.step));
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
  s.phi = calm ? s.phiTarget : s.phi + (s.phiTarget - s.phi) * (1 - Math.exp(-dt / 0.4));
  if (Math.abs(s.phiTarget - s.phi) < 0.05) s.phi = s.phiTarget;
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

// `node build.mjs --audit` proves the geometry in both rest poses: nothing sunk into
// anything, every part held by another part down to the base, the spring's wire
// resting on its plates, and every overlap painted in true depth order.
if (process.argv.includes("--audit")) {
  const A = await import("../kit/audit.mjs");
  let failed = 0;
  for (const pose of ["out", "in"]) {
    const started = Date.now();
    const R = A.recorder(P);
    J.figureItems(P, M, pose, A).forEach((it, index) => {
      if (!it.shapes.length) return; // the halo and the spokes draw no body of their own
      const shapes = it.shapes.flatMap((shape) => (shape.kind === "tube" ? R.route(shape.name, shape.points, shape.radii[0], { owner: shape.owner, ends: shape.ends, touch: shape.touch }) : [R.solid(shape)]));
      R.put({ name: it.name, key: index, shapes, svg: it.svg });
    });
    const overlaps = A.overlapsOf(R.items, P, { states: [0] });
    R.settled = { items: R.items, overlaps, solved: { rules: 0, dropped: [] }, states: [0] };
    const result = A.audit(R, P, { frames: [], apart: false });
    console.log(`--- pose: ${pose}`);
    console.log(A.report(result));
    console.log(`audit · ${R.tubes.length} tubes · ${R.solids.length} solids · ${R.items.length} items · ${overlaps.pairs.length} overlaps · ${((Date.now() - started) / 1000).toFixed(1)} s`);
    failed += A.failures(result);
  }
  console.log(failed ? `audit failed: ${failed} problem${failed === 1 ? "" : "s"}` : "audit passed");
  process.exitCode = failed ? 1 : 0;
}

const script = `${kitScript()}\n${latheScript()}\n(() => {\n${geometryScript()}\n${live}\n})();`;
const html = k
  .pageHtml({ title: "Why does Jack jump out?", theme: "light", body: page, script, width: 720 })
  .replace("</style>", `${CSS}</style>`);
writeFileSync(join(HERE, "index.html"), html);
console.log("wrote jack-in-the-box/index.html", (html.length / 1024).toFixed(0) + " KB");
