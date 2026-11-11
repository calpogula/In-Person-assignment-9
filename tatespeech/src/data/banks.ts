export const TOPICS = [
  "A decision you made too slowly",
  "What you will not negotiate",
  "A standard you enforce",
  "Why you train",
  "A time you stayed silent",
  "The cost of a maybe",
  "What money is for",
  "A rule you live by",
  "Why most advice is noise",
  "A person you stopped explaining yourself to",
  "What pressure is for",
  "The last thing you quit",
  "How you want to be addressed",
  "A belief you will defend in one line",
  "What discipline looks like on a Tuesday",
  "The difference between busy and useful",
  "A risk you respect",
  "Why you do not chase",
  "What you would cut from this week",
  "A promise you kept",
  "The point of a morning",
  "What status actually is",
  "A conversation you will not have again",
  "Why you speak slower than you think",
  "The job of a leader in one minute",
  "What you owe your future self",
  "A boundary that cost you something",
  "Why comfort is a bad coach",
  "The last time you were early",
  "What you protect your attention from",
];

export const LINK_WORDS = [
  "money", "discipline", "status", "focus", "risk", "standards", "leverage", "respect",
  "pressure", "silence", "time", "power", "work", "fear", "pride", "loyalty", "weakness",
  "strength", "control", "chaos", "reputation", "debt", "freedom", "hunger", "patience",
  "speed", "weight", "trust", "doubt", "victory", "loss", "habit", "anger", "calm",
  "ambition", "failure", "proof", "noise", "clarity", "boundary", "ego", "craft", "health",
  "sleep", "morning", "decision", "excuse", "promise", "cost", "reward", "enemy", "ally",
  "crowd", "solitude", "training", "comfort", "pain", "rank", "name", "voice", "eyes",
  "hands", "pace", "frame", "truth", "room", "door", "line", "word", "cut", "hold",
  "move", "lead", "build", "own", "stop", "start", "wait", "strike", "guard",
];

export const METAPHORS = [
  "discipline", "loyalty", "debt", "reputation", "focus", "a weak standard",
  "silence in a negotiation", "a rushed decision", "status", "training", "a liar",
  "a good contract", "panic", "patience", "a crowded room", "money without skill",
  "skill without money", "a broken promise", "attention", "a leader who explains too much",
  "fear of looking slow", "respect", "a morning routine", "pressure", "an excuse",
  "a clean no", "ambition", "a team with no standard", "comfort", "time",
  "a public argument", "private work", "confidence", "a hedge", "a filler word",
  "eye contact", "a short sentence", "frame", "authority", "noise",
];

export const WEAK_LINES = [
  "I think this could maybe work.",
  "We should probably try to sort of improve it.",
  "I'm not sure, but maybe we can look into that?",
  "It might be kind of a good idea to start soon.",
  "I guess we could perhaps do something about it?",
  "This is very bad and we should maybe fix it.",
  "I feel like we are sort of losing here?",
  "Perhaps the team could try a bit harder?",
  "It's just something we might want to consider.",
  "I think people are maybe a little unhappy?",
  "We could potentially circle back on this.",
  "I'm wondering if this is sort of the right call?",
  "It would be nice if things got better somehow.",
  "I believe we should try to do our best?",
  "Maybe the plan is okay, I think.",
  "We might want to kind of raise the standard.",
  "I'm hoping this will probably be fine.",
  "It's very important that we sort of focus.",
  "I guess the answer is that we try?",
  "Could we maybe think about changing this?",
];

export const ACCUSATIONS = [
  "You're just arrogant.",
  "You only care about money.",
  "That sounds toxic.",
  "You think you're better than everyone.",
  "Nobody likes working with you.",
  "You're too intense.",
  "That's a cope.",
  "You don't know what you're talking about.",
  "You're just lucky.",
  "This is all ego.",
  "You talk too much.",
  "You're cold.",
  "You don't listen.",
  "That's manipulative.",
  "You're trying too hard.",
  "You peaked.",
  "That's not leadership.",
  "You're scared.",
  "You bought that opinion.",
  "You can't take a joke.",
];

export const COMEBACKS = [
  "Sure, buddy.",
  "Whatever you say.",
  "Must be nice.",
  "Okay, expert.",
  "Big talk.",
  "If you say so.",
  "Relax.",
  "Nobody asked.",
  "That's cute.",
  "Good for you.",
  "Try harder.",
  "You're not that guy.",
  "Sit down.",
  "Make it make sense.",
  "Who cares?",
  "Sounds like an excuse.",
  "Read the room.",
  "Stay in your lane.",
  "Prove it.",
  "We're done here.",
];

export const SCENARIOS = [
  "Two people argue over a deadline. The room is waiting.",
  "A teammate missed the standard and is explaining their week.",
  "Someone cracks a joke while the work is unfinished.",
  "The group wants a vote on a decision you already made.",
  "A new person is performing for attention.",
  "Money is on the table and nobody will name the number.",
  "The meeting has run long and the point was made ten minutes ago.",
  "Two lieutenants disagree in front of everyone.",
  "A plan failed. People are hunting for blame.",
  "The client is talking in circles.",
  "Training is sloppy and nobody wants to say it.",
  "A friend asks you to lower a standard just this once.",
  "The room is loud and the decision is simple.",
  "Someone public is misquoting you.",
  "The group is excited and unfocused.",
  "A deadline moved and people are negotiating with reality.",
];

export const SWAPS: { weak: string; strong: string }[] = [
  { weak: "very bad", strong: "unacceptable" },
  { weak: "very smart", strong: "sharp" },
  { weak: "very kind", strong: "generous" },
  { weak: "very big", strong: "vast" },
  { weak: "very tired", strong: "exhausted" },
  { weak: "very good", strong: "exceptional" },
  { weak: "very angry", strong: "furious" },
  { weak: "very small", strong: "minute" },
  { weak: "very rich", strong: "wealthy" },
  { weak: "very scared", strong: "terrified" },
  { weak: "very important", strong: "critical" },
  { weak: "very clear", strong: "unmistakable" },
];

export const BUILT_IN_LINES = [
  "I do not fill silence. I use silence.",
  "I speak less, but my words carry more weight.",
  "I think fast, speak clearly, and lead decisively.",
];

export function swapBank(): string[] {
  return SWAPS.map((swap) => `${swap.weak}\n${swap.strong}`);
}

export function bankFor(drillId: string, customLines: string[] = []): readonly string[] | null {
  switch (drillId) {
    case "filler-tax":
      return TOPICS;
    case "rapid-link":
    case "three-word":
      return LINK_WORDS;
    case "kill-very":
      return swapBank();
    case "metaphor":
      return METAPHORS;
    case "downward-line":
      return WEAK_LINES;
    case "frame-answer":
      return ACCUSATIONS;
    case "comeback":
      return COMEBACKS;
    case "weight":
      return SCENARIOS;
    case "final-line":
      return [...BUILT_IN_LINES, ...customLines];
    default:
      return null;
  }
}

export function rotateMs(drillId: string): number | null {
  switch (drillId) {
    case "rapid-link":
      return 2500;
    case "three-word":
      return 15000;
    case "kill-very":
      return 8000;
    case "metaphor":
      return 10000;
    case "downward-line":
      return 12000;
    default:
      return null;
  }
}
