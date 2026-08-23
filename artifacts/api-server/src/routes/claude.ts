import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// The client asks for 'haiku' (cheap grading calls) or 'sonnet' (generation).
// Only these two aliases are honored — arbitrary model strings are ignored so
// the endpoint can't be used to reach other/pricier models on our key.
const MODELS: Record<string, string> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-5",
};
const DEFAULT_MODEL = MODELS.sonnet;

// Hard ceilings, regardless of what the request asks for.
const MAX_TOKENS_CAP = 8000;
const MAX_MESSAGES = 24;
const MAX_SYSTEM_CHARS = 20_000;
// Generous enough for pasted notes and a canvas snapshot / PDF page as base64.
const MAX_CONTENT_CHARS = 4_000_000;

/** Rough size of a message's content, for both string and content-block forms. */
function contentSize(content: unknown): number {
  if (typeof content === "string") return content.length;
  if (Array.isArray(content)) {
    let total = 0;
    for (const block of content) {
      try {
        total += JSON.stringify(block).length;
      } catch {
        return Infinity;
      }
    }
    return total;
  }
  return Infinity;
}

/** Validates the request body shape; returns an error string or null if OK. */
function validateBody(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return "body must be a JSON object";
  const { messages, system } = body as Record<string, unknown>;

  if (!Array.isArray(messages) || messages.length === 0)
    return "messages array is required";
  if (messages.length > MAX_MESSAGES)
    return `too many messages (max ${MAX_MESSAGES})`;

  let totalContent = 0;
  for (const m of messages) {
    if (typeof m !== "object" || m === null) return "each message must be an object";
    const { role, content } = m as Record<string, unknown>;
    if (role !== "user" && role !== "assistant")
      return "message role must be 'user' or 'assistant'";
    if (typeof content !== "string" && !Array.isArray(content))
      return "message content must be a string or an array of content blocks";
    totalContent += contentSize(content);
  }
  if (totalContent > MAX_CONTENT_CHARS) return "request content is too large";

  if (system !== undefined && typeof system !== "string")
    return "system must be a string";
  if (typeof system === "string" && system.length > MAX_SYSTEM_CHARS)
    return "system prompt is too large";

  return null;
}

/**
 * POST /api/claude
 * Proxies requests to Anthropic's Messages API for Stickpoint's AI features.
 * Body: { messages: MessageParam[], system?: string, max_tokens?: number, model?: 'haiku'|'sonnet' }
 * Returns: { text: string }
 *
 * Guardrails (Phase 0 — replaced by purpose-built, authenticated endpoints later):
 *  - per-IP rate limit
 *  - strict body-shape validation and size caps
 *  - model allowlist and max_tokens ceiling
 */
router.post(
  "/claude",
  rateLimit({ windowMs: 60_000, max: 20 }),
  async (req, res): Promise<void> => {
    const invalid = validateBody(req.body);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      req.log.error("ANTHROPIC_API_KEY is not configured");
      res.status(500).json({ error: "AI service is not configured" });
      return;
    }

    const { messages, system, max_tokens, model } = req.body;

    const cappedMaxTokens = Math.min(
      typeof max_tokens === "number" && max_tokens > 0 ? max_tokens : MAX_TOKENS_CAP,
      MAX_TOKENS_CAP,
    );
    const resolvedModel =
      (typeof model === "string" && MODELS[model]) || DEFAULT_MODEL;

    try {
      const response = await anthropic.messages.create({
        model: resolvedModel,
        max_tokens: cappedMaxTokens,
        system: typeof system === "string" ? system : undefined,
        messages,
      });

      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        res.status(500).json({ error: "No text content in response" });
        return;
      }

      res.json({ text: textContent.text });
    } catch (err) {
      req.log.error({ err }, "Anthropic API error");
      const status =
        err instanceof Anthropic.APIError ? err.status || 500 : 500;
      const message =
        err instanceof Anthropic.APIError
          ? err.message
          : "AI request failed";
      res.status(status).json({ error: message });
    }
  },
);

export default router;
