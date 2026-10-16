import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const strip = (file) => readFileSync(join(ROOT, file), "utf8").replace(/^export /gm, "").replace(/^import .*$/gm, "");

// The iso kit as plain top-level code, followed by a `k` namespace so shared
// geometry can be written once with `k.` and run in Node and in the page.
export function kitScript() {
  return (
    strip("kit/iso-kit.mjs") +
    "\nconst k = { iso, depthOf, pathOf, solidSvg, lineSvg, dotsSvg, groupSvg, translateAlong, slabOf, cylinder, extrude, circleRing, corners, insetPlan, planOutline, lineOnTop, onTop, ring, sideSeam, faceTextSvg, fadedSvg, haloOf, fitProjection, boxCorners, roundedPlan };\n"
  );
}

// kit/lathe.mjs wrapped so its private constants can't clash with the kit's.
export function latheScript() {
  const names = [
    "dot3", "add3", "sub3", "mul3", "len3", "unit3", "cross3", "lerp3", "viewOf", "lightOf", "scaleOf",
    "frameAlong", "frameOf", "pointOf", "radialOf", "tangentOf", "hullOf", "lathe", "solidOf", "disc", "ringBand",
    "sphereOf", "prismOf", "stadium", "arcOf", "circleOf", "spokesOf", "dotsOf", "ribsOf", "fadeOf",
  ];
  return `const G = (() => {\n${strip("kit/lathe.mjs")}\nreturn { ${names.join(", ")} };\n})();\n`;
}

export function geometryScript() {
  return strip("jack-in-the-box/geometry.mjs");
}
