// The words of the toy. The geometry is in geometry.mjs; the numbers in the
// readout come from the same model that moves the parts.
export default {
  id: "pulley",
  fig: 5,
  family: "Levers and gears",
  name: "Well and pulley",
  title: "How does the well lift the bucket?",
  question: "How does the well lift the bucket?",
  subtitle: "The bucket is down in the water. Pull the rope!",
  blurb: "Pull the rope down and the bucket comes up. The wheel turns your pull around.",
  concept: "A fixed pulley changes the direction of a pull, not its size: the bucket rises exactly as far as the rope is pulled.",
  object: "A stone well with a wooden frame, a pulley wheel under the crossbar, a rope over the wheel, a bucket on one end and a wooden grip on the other.",
  hint: "Tap the toy, or press the buttons",
  readout: "rope pulled 0 · bucket up 0",
  status: "Bucket in the water",
  aria: "A well with a pulley. Space or Enter pulls the rope; Backspace lets it go.",
  keys: [
    { mark: "red", label: "Grip: pull it down" },
    { mark: "lit", label: "Pulley wheel: it turns the pull around" },
    { mark: "blue", label: "Bucket: it comes up as far as you pulled" },
  ],
  caption: "A single wheel does not make the bucket lighter. It lets you pull down, which is easier than pulling up, and the bucket rises the same distance you pulled.",
  predict: {
    question: "Pull the rope down. Where does the bucket go?",
    options: [
      { label: "Up", correct: true },
      { label: "Down", correct: false },
    ],
    explain: "The rope runs over the wheel, so pulling one end down lifts the other end up.",
  },
  steps: [
    { colour: "red", title: "Pull down", text: "Pulling down is easy: you can hang your weight on the rope." },
    { colour: "yellow", title: "The wheel turns the pull around", text: "The rope slides over the wheel, so a pull down on one side becomes a pull up on the other." },
    { colour: "blue", title: "Up as far as you pulled", text: "Pull the rope down a hand's length and the bucket rises a hand's length. One wheel changes direction, not distance." },
  ],
  home: "a thread spool on a pencil, a loop of string over it, and a cup of pennies as the bucket. Pull down, cup goes up.",
  grown: [
    ["A fixed pulley is a lever with equal arms.", "The wheel is a wheel-and-axle with the rope on both sides at the same radius, so the mechanical advantage is 1: you pull with the bucket's full weight, just in a more convenient direction."],
    ["Movable pulleys halve the force.", "Hang the wheel on the load instead and two rope segments share the weight: you pull half as hard, but twice as far. Block-and-tackle rigs stack these."],
    ["The wheel is there for friction.", "Without a wheel the rope would saw against the beam. A turning wheel on an axle lets the rope move with almost no loss."],
  ],
};
