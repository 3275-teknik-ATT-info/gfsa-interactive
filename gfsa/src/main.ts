// Lightweight static checks – no LLM, no IaC interpretation
const ACTION_VERBS = ["build", "create", "analyze", "convert", "package", "deploy", "validate", "resolve"];
const MEDIA_BLACKLIST = ["image", "photo", "picture", "video", "generate image", "draw", "illustrate"];

function classifyTier(text: string): { tier: number; normalized: string; guidance: string } {
  const clean = text.trim().toLowerCase();
  if (clean.length < 12) {
    return { tier: 3, normalized: text, guidance: "Please provide a short project goal (at least a few words)." };
  }
  if (MEDIA_BLACKLIST.some(k => clean.includes(k))) {
    return { tier: 3, normalized: text, guidance: "This platform is for project-management tasking only. No image or video generation." };
  }
  const hasVerb = ACTION_VERBS.some(v => clean.includes(v));
  if (!hasVerb) {
    return { tier: 2, normalized: text, guidance: "Please include an action (build, create, analyze\ldots)." };
  }
  // Simple evidence/constraint heuristic
  const hasConstraint = /must|require|constraint|only|without|using/.test(clean);
  if (hasConstraint) {
    return { tier: 0, normalized: text, guidance: "High-confidence path ready." };
  }
  return { tier: 1, normalized: text, guidance: "Additional detail will raise confidence." };
}
