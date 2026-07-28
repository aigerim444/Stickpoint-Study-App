import { Router, type IRouter } from "express";
import Anthropic from "@anthropic-ai/sdk";

const router: IRouter = Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * POST /api/claude
 * Proxies requests to Anthropic's Messages API for Stickpoint's AI features.
 * Body: { messages: MessageParam[], system?: string, max_tokens?: number }
 * Returns: { content: string }
 */
router.post("/claude", async (req, res): Promise<void> => {
  const { messages, system, max_tokens } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages array is required" });
    return;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    req.log.error("ANTHROPIC_API_KEY is not configured");
    res.status(500).json({ error: "AI service is not configured" });
    return;
  }

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: typeof max_tokens === "number" ? max_tokens : 8000,
      system: typeof system === "string" ? system : undefined,
      messages,
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") {
      res.status(500).json({ error: "No text content in response" });
      return;
    }

    res.json({ content: textContent.text });
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
});

export default router;
