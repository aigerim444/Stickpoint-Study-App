/**
 * Client-side math detection — used as a fallback when the AI is unavailable
 * or returns a malformed response. Only matches terms that are unambiguously
 * mathematical so subjects like psychology, biology, and history don't get
 * false positives. Ported from the web app.
 */
export function detectMath(text: string): boolean {
  const t = String(text || '').slice(0, 4000);
  const keywords =
    /\b(equat|calcul|theorem|triangle|derivative|integral|algebra|geometry|trigonometr|quadratic|polynomial|sine|cosine|tangent|vector|matrix|logarithm|exponent|parabola|hyperbola|radical|pythagor|differentiat|integrat|eigenvalue|determinant|binomial|modular|number theory|set theory|congruent|perpendicular|hypotenuse)\b/i.test(
      t,
    );
  const symbols = /[±√π∫∑∏∂∇]|\d+\s*[\+\-\*\/\^]\s*\d|\^\d/.test(t);
  return keywords || symbols;
}
