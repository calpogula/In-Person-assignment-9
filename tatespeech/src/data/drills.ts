import type { SubscoreKey } from "../types";

export interface DrillDef {
  id: string;
  name: string;
  seconds: number;
  goal: string;
  rules: string[];
  framework: string;
  line: string;
  subscores: SubscoreKey[];
}

export const VOICE_LINE = "I speak clearly. I speak directly. I do not rush. I control the room.";

export const DRILLS: DrillDef[] = [
  {
    id: "voice-lock",
    name: "Voice lock",
    seconds: 60,
    goal: "Same line, three passes. Normal, louder, then slow and downward.",
    rules: ["Do not add words.", "The third pass is slower than the first.", "The last word goes down."],
    framework: "One line. Three deliveries. Statement, not a question.",
    line: "End every sentence like a statement, not a question.",
    subscores: ["projection", "pace", "clarity", "downward", "eye"],
  },
  {
    id: "filler-tax",
    name: "Filler tax",
    seconds: 120,
    goal: "Talk on the topic. Under 2 fillers a minute, then under 1, then none.",
    rules: ["When a filler hits, stop.", "Restart that sentence clean.", "Silence is allowed. A filler is not."],
    framework: "Pause, then the sentence. Do not decorate the pause.",
    line: "Silence is safe. Pause, then speak.",
    subscores: ["fillers", "pace", "conviction", "style"],
  },
  {
    id: "rapid-link",
    name: "Rapid link",
    seconds: 120,
    goal: "A word lands. Say the first related idea out loud. Do not filter it.",
    rules: ["No polishing.", "One idea, then the next word.", "Speed of thought. Not speed of mouth."],
    framework: "See it. Say the link. Stop.",
    line: "Fast thought. Slow mouth.",
    subscores: ["pace", "confidence", "fillers", "eye"],
  },
  {
    id: "three-word",
    name: "Three-word chain",
    seconds: 120,
    goal: "See the word, name a related concept, expand into one sentence. Keep the first sentence.",
    rules: ["No rephrasing.", "One sentence.", "Finish it."],
    framework: "Word → concept → one sentence.",
    line: "The first sentence is the sentence.",
    subscores: ["structure", "style", "substance", "fillers"],
  },
  {
    id: "kill-very",
    name: "Kill very",
    seconds: 60,
    goal: "Replace the weak pair with the precise word.",
    rules: ["Say the strong word.", "Do not say very.", "One word, clean."],
    framework: "Very + weak word dies. The precise word stays.",
    line: "Very is a stall. Name the thing.",
    subscores: ["vocabulary", "fillers", "clarity"],
  },
  {
    id: "metaphor",
    name: "Metaphor snap",
    seconds: 60,
    goal: "Within 10 seconds: it is like a physical thing, plus the point.",
    rules: ["One sentence if you can.", "A thing you can see or hold.", "Then the takeaway."],
    framework: "It is like … + image + point.",
    line: "Abstract talk is fog. Put a thing in the sentence.",
    subscores: ["structure", "substance", "style", "clarity"],
  },
  {
    id: "downward-line",
    name: "Downward line",
    seconds: 60,
    goal: "The weak sentence is on screen. Speak a shorter decisive version. Hold the last syllable down.",
    rules: ["Shorter than the prompt.", "No hedge.", "The last word falls."],
    framework: "Cut it. Land it. Down.",
    line: "End every sentence like a statement, not a question.",
    subscores: ["downward", "style", "conviction", "pace"],
  },
  {
    id: "frame-answer",
    name: "Frame answer",
    seconds: 90,
    goal: "An accusation appears. Answer with Reframe, Explain, Assert. Do not deny inside their wording.",
    rules: ["One or two sentences.", "Do not open with no.", "Leave their frame."],
    framework: "Reframe → Explain → Assert.",
    line: "Do not plead inside the charge.",
    subscores: ["structure", "authority", "claim", "style"],
  },
  {
    id: "comeback",
    name: "One-line comeback",
    seconds: 60,
    goal: "A dismissive line in. One sentence out. No explanation.",
    rules: ["One sentence.", "No because.", "Dismiss and redirect, expose the dodge, or a short authority line."],
    framework: "One line. Then silence.",
    line: "Long comebacks sound needy.",
    subscores: ["style", "authority", "conviction", "fillers"],
  },
  {
    id: "weight",
    name: "Weight in the room",
    seconds: 90,
    goal: "A messy room. Maximum three sentences: Diagnosis, Decision, Direction. End with a named next action.",
    rules: ["Three sentences or fewer.", "Eyes up.", "The last sentence names the action."],
    framework: "Diagnosis → Decision → Direction.",
    line: "End with the action and a name.",
    subscores: ["structure", "eye", "authority", "substance", "claim"],
  },
  {
    id: "final-line",
    name: "Final line",
    seconds: 60,
    goal: "One identity line, five times. Each rep slower. The last one loud, slow, downward, eyes on the camera.",
    rules: ["Same words.", "Slower each time.", "Last rep: loud, slow, down, eyes up."],
    framework: "Five reps. The fifth one is the standard.",
    line: "I speak less, but the words stay.",
    subscores: ["projection", "downward", "eye", "pace", "conviction"],
  },
];

export const FREE_DRILL: DrillDef = {
  id: "free",
  name: "Free speak",
  seconds: 20 * 60,
  goal: "Camera and mic. No script. Stop when the rep is done.",
  rules: ["Speak in statements.", "Pause instead of filling.", "Eyes on the lens."],
  framework: "No prompt. Your line.",
  line: "Silence is safe. Pause, then speak.",
  subscores: ["fillers", "pace", "clarity", "eye", "downward", "conviction", "style"],
};

export function drillById(id: string): DrillDef | undefined {
  return DRILLS.find((drill) => drill.id === id);
}
