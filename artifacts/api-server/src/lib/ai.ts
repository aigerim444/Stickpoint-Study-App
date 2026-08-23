import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-side AI plumbing for Stickpoint's purpose-built endpoints.
 *
 * Prompts live HERE, not in clients: they can't be tampered with, they don't
 * drift between web and mobile, and the server controls model choice and
 * token spend per feature.
 */

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// haiku = cheap grading calls; sonnet = complex generation only.
export const MODELS = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-5",
} as const;
export type ModelAlias = keyof typeof MODELS;

export const NO_EM_DASH =
  "Respond with ONLY valid JSON, no markdown fences, no extra text. Never use em dashes in any text you return.";

/**
 * Audience calibration appended to every system prompt so explanations,
 * examples, feedback and hints all stay at one consistent level.
 * Ported verbatim from the web app.
 */
export function ageDirective(name?: string | null, age?: number | null): string {
  const a = age;
  if (!a) return "";
  let band: string;
  if (a <= 10)
    band =
      "They are " + a + " years old, in elementary school. Use very short sentences and everyday words. Examples come from home, school, pets, food, games and playgrounds.";
  else if (a <= 13)
    band =
      "They are " + a + " years old, in middle school. Plain language, short sentences, no academic register. Examples come from school life, sports, video games, phones, music and family.";
  else if (a <= 18)
    band =
      "They are " + a + " years old, in high school. Talk to them like a capable peer, not a child. Full technical vocabulary is fine as long as you define it once. Examples can be sports, driving, part-time jobs, social media, money, science they have already met in class.";
  else if (a <= 22)
    band =
      "They are " + a + " years old, a university student. Assume solid background knowledge, use precise technical terms without over-explaining, and draw examples from coursework, labs, research and real professional practice.";
  else
    band =
      "They are " + a + " years old, an adult learner. Write to an intelligent adult. Use precise terminology and draw examples from work, finance, health, news and everyday adult life.";
  return (
    "\n\nAUDIENCE: You are writing for a student named " + (name || "the student") + ". " + band +
    "\nMatch that level exactly. Never talk down to them, never use baby analogies with an older student (do not tell a teenager a cell membrane is like a club bouncer), and never use vocabulary or references an older audience would need that this student would not have met yet. Skip slang and forced jokes; be warm and direct instead. Keep humour dry and light if you use any at all. Never use em dashes."
  );
}

/** Source-material grading context to improve fact-checking accuracy. */
export function materialCtx(material: string | undefined, maxChars = 1400): string {
  const m = (material || "").trim().slice(0, maxChars);
  return m
    ? '\n\nSource material (grade against this, not general knowledge):\n"""\n' + m + '\n"""'
    : "";
}

/**
 * PDF text arrives with page furniture and broken spacing. Tidy it so the
 * model sees clean prose rather than layout noise. (Ported from the web app.)
 */
export function tidyMaterial(raw: string, cap = 6000): string {
  return String(raw || "")
    .trim()
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .split("\n")
    .filter((line) => !/^\s*(page\s*)?\d{1,3}\s*$/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, cap);
}

/**
 * Lenient JSON extraction for model replies: strips code fences, pulls the
 * outermost object/array out of surrounding prose, and repairs truncated
 * replies by closing open brackets. Ported from the web app's parseJson.
 */
export function parseLooseJson(raw: unknown): unknown {
  if (!raw) return null;
  const body = String(raw).replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(body);
  } catch {}
  const starts = [body.indexOf("{"), body.indexOf("[")].filter((n) => n >= 0);
  const first = starts.length ? Math.min(...starts) : NaN;
  const last = Math.max(body.lastIndexOf("}"), body.lastIndexOf("]"));
  if (Number.isFinite(first) && last > first) {
    try {
      return JSON.parse(body.slice(first, last + 1));
    } catch {}
  }
  // Truncated reply: close any open brackets and retry.
  if (Number.isFinite(first)) {
    const slice = body.slice(first).replace(/,\s*$/, "");
    const opens = (slice.match(/[{[]/g) || []).length;
    const closes = (slice.match(/[}\]]/g) || []).length;
    if (opens > closes) {
      const stack: string[] = [];
      for (const ch of slice) {
        if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
        else if (ch === "}" || ch === "]") stack.pop();
      }
      const trimmed = slice.replace(/[^}\]"]*$/, "").replace(/,\s*$/, "");
      const candidate = trimmed + stack.reverse().join("");
      try {
        return JSON.parse(candidate);
      } catch {}
    }
  }
  return null;
}

export interface AskOptions {
  model: ModelAlias;
  system: string;
  prompt?: string;
  /** Full content-block messages (for vision). Overrides prompt. */
  messages?: Anthropic.MessageParam[];
  maxTokens: number;
  /** Student calibration, appended to the system prompt. */
  name?: string | null;
  age?: number | null;
}

/** One raw model call; returns the text reply or null on failure. */
export async function askClaude(opts: AskOptions): Promise<string | null> {
  try {
    const response = await anthropic.messages.create({
      model: MODELS[opts.model],
      max_tokens: opts.maxTokens,
      system: opts.system + ageDirective(opts.name, opts.age),
      messages: opts.messages ?? [{ role: "user", content: opts.prompt || "" }],
    });
    const text = response.content.find((c) => c.type === "text");
    return text && text.type === "text" ? text.text : null;
  } catch {
    return null;
  }
}

/**
 * Model call returning validated JSON. Retries once with an explicit
 * "your previous reply could not be read" nudge, mirroring the web app.
 * `validate` returns the cleaned value, or null to reject the reply.
 */
export async function askJson<T>(
  opts: AskOptions & { validate: (parsed: unknown) => T | null },
): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0 || !opts.prompt
        ? opts.prompt
        : opts.prompt +
          "\n\nIMPORTANT: your previous reply could not be read. Return ONLY the raw JSON, and keep it short enough to finish completely.";
    const raw = await askClaude({ ...opts, prompt });
    if (raw == null) continue;
    const cleaned = opts.validate(parseLooseJson(raw));
    if (cleaned != null) return cleaned;
  }
  return null;
}
