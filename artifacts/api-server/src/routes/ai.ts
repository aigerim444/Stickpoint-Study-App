import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { rateLimit } from "../middlewares/rateLimit";
import {
  NO_EM_DASH,
  askClaude,
  askJson,
  materialCtx,
  parseLooseJson,
  tidyMaterial,
} from "../lib/ai";

/**
 * Purpose-built AI endpoints — one per product feature, prompts server-side,
 * responses validated before they reach a client. These replace raw
 * /api/claude usage for the rebuilt app; every prompt is ported verbatim
 * from the web app (the behavioral spec).
 */

const router: IRouter = Router();

router.use(rateLimit({ windowMs: 60_000, max: 30 }));

// Student calibration accepted by every endpoint.
const student = {
  name: z.string().max(120).optional(),
  age: z.number().int().min(5).max(99).nullable().optional(),
};
const materialField = z.string().min(40).max(200_000);

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

function endpoint<S extends z.ZodTypeAny>(
  path: string,
  schema: S,
  handler: (body: z.infer<S>) => Promise<unknown | null>,
) {
  router.post(path, async (req: Request, res: Response): Promise<void> => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || "invalid request" });
      return;
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      req.log.error("ANTHROPIC_API_KEY is not configured");
      res.status(500).json({ error: "AI service is not configured" });
      return;
    }
    try {
      const result = await handler(parsed.data);
      if (result == null) {
        res.status(502).json({ error: "The AI reply could not be read. Try again." });
        return;
      }
      res.json(result);
    } catch (err) {
      req.log.error({ err }, "AI endpoint error");
      res.status(500).json({ error: "AI request failed" });
    }
  });
}

// ---------- Card extraction ----------

const cardShape = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  methodTag: z.string().optional(),
});

/** Rescue whatever complete cards a truncated reply contains. */
function salvageCards(text: string) {
  const found: { question: string; answer: string; methodTag: string }[] = [];
  const re = /\{[^{}]*"question"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*"answer"\s*:\s*"((?:[^"\\]|\\.)*)"[^{}]*\}/g;
  let m;
  while ((m = re.exec(text)) && found.length < 24) {
    try {
      found.push({
        question: JSON.parse('"' + m[1] + '"'),
        answer: JSON.parse('"' + m[2] + '"'),
        methodTag: "active_recall",
      });
    } catch {}
  }
  return found;
}

endpoint(
  "/ai/extract-cards",
  z.object({ material: materialField, ...student }),
  async (body) => {
    const material = tidyMaterial(body.material);
    const prompt =
      'Here is a student\'s study material:\n\n"""' + material + '"""\n\n' +
      "Read these notes carefully and identify every individual vocabulary word, key concept, important person, significant date, and core idea. Create one flashcard for EACH one you find, one card covers exactly one thing. Never combine multiple concepts, terms, or facts into a single card. For example, if the notes mention photosynthesis, chlorophyll, and the light reaction, that is three separate cards, not one card listing all three. If the notes have ten vocabulary words, generate ten cards, one per word.\n" +
      "Each flashcard has a question asking the student to recall that single thing, and a concise answer explaining just that one thing.\n" +
      "Return between 8 and 20 cards, scaling with how much material is in the notes: lots of notes means more cards, a short paragraph means fewer, but always one card per concept, never a fixed count.\n" +
      "Return JSON only, no markdown fences, no commentary, exactly this shape:\n" +
      'IMPORTANT: Set "is_math" to true if the material contains ANY of the following: equations, formulas, algebra, geometry, trigonometry, calculus, statistics, arithmetic, proofs, graphs/coordinates, number theory, vectors, matrices, probability, or any subject where the student must execute procedures or solve problems with numbers or symbols — not just read and memorise facts. Set it to false only if the material is purely prose-based (history, literature, biology definitions, etc.) with no maths procedures.\n' +
      '{"topic": "short topic name, 4-6 words", "is_math": true or false, "cards": [{"question": "a question asking the student to recall one single term, concept, person, date, or idea", "answer": "a concise answer explaining just that one thing", "methodTag": "one of: active_recall, blurting, practice_testing, feynman, concrete_examples, pomodoro, self_explanation, elaborative_interrogation, whichever study method this card suits best"}]}';
    const system =
      "You are a study assistant that turns student notes into individual study cards. " + NO_EM_DASH;

    for (let attempt = 0; attempt < 2; attempt++) {
      const ask =
        attempt === 0
          ? prompt
          : prompt +
            "\n\nIMPORTANT: your previous reply could not be read. Return ONLY the raw JSON object, starting with { and ending with }, and keep it short enough to finish completely.";
      const raw = await askClaude({ model: "haiku", system, prompt: ask, maxTokens: 3500, name: body.name, age: body.age });
      if (!raw) continue;
      const p = parseLooseJson(raw) as { topic?: unknown; is_math?: unknown; cards?: unknown } | null;
      const cards = z.array(cardShape).min(1).safeParse(p?.cards);
      if (cards.success) {
        return {
          topic: str(p?.topic, "Your notes"),
          isMath: !!p?.is_math,
          cards: cards.data.map((c) => ({ ...c, methodTag: c.methodTag || "active_recall" })),
        };
      }
      const rescued = salvageCards(String(raw));
      if (rescued.length >= 4) {
        return { topic: str(p?.topic, "Your notes"), isMath: !!p?.is_math, cards: rescued };
      }
    }
    return null;
  },
);

// ---------- Self-Explanation ----------

endpoint(
  "/ai/se-chunks",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 3500,
      name: body.name,
      age: body.age,
      system:
        "You split study notes into one-idea chunks, preserving original wording. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes in any text you return.",
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        'Read these notes and break them into individual sentences or short chunks of one to two sentences each. Each chunk should contain one complete idea, fact, or concept. Do not summarize or rewrite anything, keep the original wording from the notes. Return ONLY a JSON array where each object has a "chunk" field containing the original text and a "key_idea" field containing a two to three word label for what that chunk is about.',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const chunks = p
          .filter((c) => c && typeof c.chunk === "string" && c.chunk.trim())
          .map((c) => ({ chunk: c.chunk.trim(), keyIdea: str(c.key_idea, "Key idea") }))
          .slice(0, 30);
        return chunks.length ? { chunks } : null;
      },
    }),
);

endpoint(
  "/ai/se-grade",
  z.object({ chunk: z.string().min(1).max(4000), explanation: z.string().min(5).max(4000), ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system:
        "You evaluate whether a student's paraphrase captures the meaning of a text chunk. Be encouraging but honest. " + NO_EM_DASH,
      prompt:
        'A student is reading their notes one chunk at a time and explaining each chunk in their own words.\n\nOriginal chunk from the notes:\n"""' + body.chunk + '"""\n\n' +
        'The student\'s explanation:\n"""' + body.explanation + '"""\n\n' +
        'Evaluate whether the student\'s explanation captures the meaning of the chunk correctly. Grade strictly based on the original chunk above — if the student says something that contradicts it, mark it wrong. Keep feedback to ONE short sentence a student can read at a glance. A rough but essentially right paraphrase counts as correct. Return ONLY JSON: {"correct": true or false, "feedback": "ONE short sentence, what they got or what they missed", "simpler_version": "a one sentence plain English version of the original chunk"}',
      validate: (p) => {
        const o = p as { correct?: unknown; feedback?: unknown; simpler_version?: unknown } | null;
        if (!o || typeof o.correct !== "boolean" || typeof o.feedback !== "string") return null;
        return { correct: o.correct, feedback: o.feedback, simpler: str(o.simpler_version, body.chunk) };
      },
    }),
);

// ---------- Blurting ----------

endpoint(
  "/ai/blurt-topics",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 600,
      name: body.name,
      age: body.age,
      system:
        "You extract topic names from study notes. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes in any text you return.",
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        'Read these notes and identify the 5 to 10 most important topics, concepts, or vocabulary words. Return ONLY a JSON array where each object has a "topic" field containing just the name or title of the concept, no definitions, no explanations, just the topic names. Example: [{"topic": "Photosynthesis"}, {"topic": "The light reaction"}]',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const topics = p
          .filter((t) => t && typeof t.topic === "string" && t.topic.trim())
          .map((t) => ({ topic: t.topic.trim() }))
          .slice(0, 10);
        return topics.length ? { topics } : null;
      },
    }),
);

endpoint(
  "/ai/blurt-grade",
  z.object({ material: materialField, topic: z.string().min(1).max(300), text: z.string().min(10).max(20_000), ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 2000,
      name: body.name,
      age: body.age,
      system:
        "You compare a student's free recall against their study notes. " + NO_EM_DASH,
      prompt:
        'A student is doing a blurting exercise on the topic: "' + body.topic + '".\n\nHere are their original study notes:\n"""' + tidyMaterial(body.material, 3000) + '"""\n\n' +
        'Here is everything the student wrote from memory about this topic, without looking at their notes:\n"""' + body.text + '"""\n\n' +
        'Find the section of the notes relevant to this topic and identify its key terms and concepts. Determine which of those key concepts appear in the student\'s response and which do not. Return ONLY JSON: {"notesSection": "the relevant portion of the original notes for this topic, quoted as closely as possible", "covered": ["key terms or concepts from the notes that the student mentioned"], "missed": ["key terms or concepts from the notes that the student did not mention"]}',
      validate: (p) => {
        const o = p as { notesSection?: unknown; covered?: unknown; missed?: unknown } | null;
        if (!o || !Array.isArray(o.covered) || !Array.isArray(o.missed)) return null;
        return {
          notesSection: str(o.notesSection) || tidyMaterial(body.material, 800),
          covered: o.covered.filter((x): x is string => typeof x === "string"),
          missed: o.missed.filter((x): x is string => typeof x === "string"),
        };
      },
    }),
);

// ---------- Problem Sets ----------

const figureShape = (f: unknown) => {
  if (!f || typeof f !== "object") return null;
  const fig = f as Record<string, unknown>;
  const caption = str(fig.caption);
  if (fig.type === "table" && Array.isArray(fig.headers) && Array.isArray(fig.rows))
    return {
      type: "table" as const,
      headers: fig.headers.map(String),
      rows: fig.rows.filter(Array.isArray).map((r: unknown[]) => r.map(String)),
      caption,
    };
  if (fig.type === "chart" && Array.isArray(fig.bars)) {
    const bars = fig.bars.filter(
      (b): b is { label: unknown; value: number } =>
        !!b && (b as Record<string, unknown>).label != null && typeof (b as Record<string, unknown>).value === "number",
    );
    return bars.length
      ? { type: "chart" as const, bars: bars.map((b) => ({ label: String(b.label), value: b.value })), caption }
      : null;
  }
  if (fig.type === "diagram" && typeof fig.art === "string" && fig.art.trim())
    return { type: "diagram" as const, art: fig.art, caption };
  return null;
};

endpoint(
  "/ai/ps-generate",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "sonnet",
      maxTokens: 8000,
      name: body.name,
      age: body.age,
      system:
        "You are a maths tutor who builds worked examples and graded practice from a student's own material. " + NO_EM_DASH,
      prompt:
        'Here is a student\'s study material:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        'This student is studying MATH or a problem-based science. Do not make vocabulary cards. Instead identify the 3 to 6 PROBLEM TYPES (procedural skills) this material requires, things a student has to DO, like "solve a quadratic by factoring" or "differentiate a product".\n' +
        "For each skill give: one fully worked example broken into 3 to 6 steps, where every step has the algebra/working AND a short plain-English reason for that step; then 3 practice problems of increasing difficulty with their final answers and a one-line hint each.\n" +
        "Write all mathematics as plain text a student could type (x^2, sqrt(x), (a+b)/c, integral, pi), no LaTeX, no markdown.\n" +
        'IMPORTANT, visuals: geometry, data, functions and statistics problems are unreadable without a picture. Whenever a problem or worked example genuinely needs one, include a "figure" object on it. Use exactly one of these three shapes:\n' +
        '  {"type": "table", "headers": ["col", "col"], "rows": [["a", "b"], ["c", "d"]], "caption": "short caption"}\n' +
        '  {"type": "chart", "bars": [{"label": "Mon", "value": 12}, {"label": "Tue", "value": 30}], "caption": "short caption"}\n' +
        '  {"type": "diagram", "art": "a monospace ASCII drawing of the shape, triangle, number line, graph axes or tree, with the labels and measurements marked on it", "caption": "short caption"}\n' +
        'Use "diagram" for geometry shapes, number lines and coordinate graphs; make the ASCII art at most 34 characters wide and 14 lines tall, and put every given measurement, angle mark and label on it.\n' +
        'A "figure" is REQUIRED, not optional, on every worked example and every practice problem that involves geometry, shapes, triangles, angles, congruence or similarity proofs, number lines, coordinate graphs, functions being sketched, or any data/statistics. A student cannot do those problems without seeing the picture. Only omit "figure" when the problem is pure symbolic algebra or arithmetic with nothing to draw.\n' +
        'If the material genuinely contains no problems to solve (it is pure prose or vocabulary), return exactly {"not_math": true} instead.\n' +
        'Otherwise return ONLY JSON: {"skills": [{"skill": "short name of the procedure", "worked": {"problem": "the example problem", "steps": [{"step": "the working for this line", "why": "why you do this, one short sentence"}]}, "practice": [{"problem": "a problem of this type", "answer": "the final answer", "hint": "a one line nudge, no answer"}]}]}',
      validate: (p) => {
        const o = p as { not_math?: unknown; skills?: unknown } | null;
        if (o?.not_math) return { notMath: true as const, skills: [] };
        if (!o || !Array.isArray(o.skills)) return null;
        const skills = o.skills
          .filter(
            (x) =>
              x && x.skill && x.worked && Array.isArray(x.worked.steps) && x.worked.steps.length && Array.isArray(x.practice) && x.practice.length,
          )
          .slice(0, 6)
          .map((x) => ({
            skill: String(x.skill),
            worked: {
              problem: str(x.worked.problem),
              figure: figureShape(x.worked.figure),
              steps: x.worked.steps.map((st: Record<string, unknown>) => ({ step: str(st.step), why: str(st.why) })),
            },
            practice: x.practice.map((pr: Record<string, unknown>) => ({
              problem: str(pr.problem),
              answer: str(pr.answer),
              hint: str(pr.hint),
              figure: figureShape(pr.figure),
            })),
          }));
        return skills.length ? { notMath: false as const, skills } : null;
      },
    }),
);

const psMarkValidate = (lines: string[]) => (p: unknown) => {
  const o = p as Record<string, unknown> | null;
  if (!o || (typeof o.first_error_line !== "number" && o.first_error_line !== null)) return null;
  return {
    errLine: typeof o.first_error_line === "number" ? o.first_error_line : null,
    errorType: str(o.error_type),
    explanation: str(o.explanation),
    correctLine: str(o.correct_line),
    reached: !!o.reached_answer,
    lines,
  };
};

endpoint(
  "/ai/ps-mark",
  z.object({
    skill: z.string().min(1).max(300),
    problem: z.string().min(1).max(4000),
    answer: z.string().min(1).max(2000),
    lines: z.array(z.string().max(500)).min(1).max(40),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system:
        "You are a maths tutor marking a student's working line by line. You find the FIRST error and explain it without solving the rest for them. " + NO_EM_DASH,
      prompt:
        'A student is solving this ' + body.skill + ' problem:\n"""' + body.problem + '"""\nThe correct final answer is: "' + body.answer + '".\n\n' +
        "Here is their working, one step per numbered line:\n" +
        body.lines.map((l, i) => i + 1 + ". " + l).join("\n") + "\n\n" +
        "Check the working LINE BY LINE. Find the FIRST line that contains a mathematical error, everything before it is correct. Mathematically equivalent forms are correct (2/4 equals 1/2, x=-2 or x=-3 equals x=-3 or x=-2). Skipping several steps at once is fine as long as the result is right.\n" +
        'Name the error using a short reusable label describing the KIND of mistake a student keeps making, for example "sign error", "dropped a term", "wrong order of operations", "forgot to check the domain", "arithmetic slip", "used the wrong rule".\n' +
        'Return ONLY JSON: {"first_error_line": the 1-based line number of the first wrong line, or null if all correct, "error_type": "short reusable label, or empty string if none", "explanation": "one or two sentences saying what went wrong on that line and what to do instead, do NOT just give the final answer", "correct_line": "what that line should have said, or empty string", "reached_answer": true if their final line matches the correct answer}',
      validate: psMarkValidate(body.lines),
    }),
);

endpoint(
  "/ai/ps-mark-drawing",
  z.object({
    skill: z.string().min(1).max(300),
    problem: z.string().min(1).max(4000),
    answer: z.string().min(1).max(2000),
    imageBase64: z.string().min(100).max(4_000_000),
    drawAnswer: z.string().max(500).optional(),
    ...student,
  }),
  async (body) => {
    const answerNote = body.drawAnswer?.trim()
      ? '\nThe student also wrote their final answer as: "' + body.drawAnswer.trim() + '".'
      : "";
    const prompt =
      'A student is solving this ' + body.skill + ' problem:\n"""' + body.problem + '"""\nThe correct final answer is: "' + body.answer + '".' + answerNote + "\n\n" +
      'The student drew their working on the attached image. Read their handwritten work step by step. Check it LINE BY LINE. Find the FIRST line that contains a mathematical error. Name the error with a short reusable label (e.g. "sign error", "wrong operation", "arithmetic slip"). If the handwriting is unclear say so in explanation.\n' +
      'Return ONLY JSON: {"first_error_line": 1-based line number or null if all correct, "error_type": "short label or empty string", "explanation": "one or two sentences about what went wrong and what to do instead", "correct_line": "what that line should say, or empty string", "reached_answer": true if final answer matches}';
    return askJson({
      model: "sonnet",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system:
        "You are a maths tutor marking a student's handwritten working. Read the image carefully and check step by step. " + NO_EM_DASH,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/png", data: body.imageBase64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
      validate: psMarkValidate(["(drawn work — see feedback below)"]),
    });
  },
);

// ---------- Feynman ----------

endpoint(
  "/ai/feynman-concepts",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1000,
      name: body.name,
      age: body.age,
      system:
        "You extract key concepts from study notes. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes in any text you return.",
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        'Read these notes and identify the 5 to 8 most important concepts, theories, or processes. For each one return just the concept name and a one sentence plain English definition. Return ONLY a JSON array where each object has a "concept" field and a "definition" field.',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const items = p
          .filter((x) => x && typeof x.concept === "string" && typeof x.definition === "string")
          .slice(0, 8);
        return items.length ? { items } : null;
      },
    }),
);

endpoint(
  "/ai/feynman-grade",
  z.object({
    concept: z.string().min(1).max(500),
    definition: z.string().min(1).max(2000),
    text: z.string().min(10).max(10_000),
    firstText: z.string().max(10_000).optional(),
    secondPass: z.boolean().optional(),
    material: z.string().max(200_000).optional(),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system:
        "You grade Feynman-technique explanations strictly and accurately. A student writing off-topic or wrong content must receive a low score (1-2) regardless of writing quality. " + NO_EM_DASH,
      prompt:
        'A student is doing the Feynman technique. The concept is: "' + body.concept + '". The correct definition is: "' + body.definition + '".\n\n' +
        (body.secondPass
          ? 'This is their SECOND attempt, after being told the gap in their first. Their first attempt was:\n"""' + (body.firstText || "") + '"""\n\nTheir revised explanation:\n'
          : "Their explanation from memory:\n") +
        '"""' + body.text + '"""\n\n' +
        "STRICT SCORING RULES — apply these before anything else:\n" +
        '- Score 1: The explanation is off-topic, does not address the concept at all, is nonsensical, or is clearly unrelated to "' + body.concept + '". A confident-sounding wrong explanation is still wrong.\n' +
        "- Score 2: Mentions the concept but gets the meaning wrong or is mostly confused/superficial.\n" +
        "- Score 3: Gets the core idea but misses important parts of the definition.\n" +
        "- Score 4: Mostly correct, only minor gaps.\n" +
        "- Score 5: Covers all key points from the definition accurately and in plain terms.\n" +
        "If the student wrote random text, repeated the question, or described a completely different concept — score MUST be 1.\n" +
        "Compare strictly against the definition and source material below. Do not give credit for plausible-sounding guesses.\n" +
        'Return ONLY JSON: {"score": 1-5, "got_right": "what they explained correctly, one or two sentences, or empty string if nothing was right", "missed": "what was missing or wrong, one or two sentences, or empty string if nothing", "gap": "the single biggest thing missing or wrong, phrased as a short instruction such as: explain why it actually happens, not just what it is, never reveal the answer itself", "jargon": [{"term": "a word or phrase they used that they probably could not define themselves, leave array empty if none", "plain": "a plain-English replacement"}], "simpler_version": "a one sentence ideal explanation of this concept in plain English"}' +
        materialCtx(body.material),
      validate: (p) => {
        const o = p as Record<string, unknown> | null;
        if (!o || typeof o.score !== "number") return null;
        return {
          score: Math.max(1, Math.min(5, Math.round(o.score))),
          gotRight: str(o.got_right),
          missed: str(o.missed),
          gap: str(o.gap, "the part you skipped over, say it in plainer words"),
          jargon: Array.isArray(o.jargon)
            ? o.jargon.filter((j) => j && j.term && j.plain).slice(0, 3).map((j) => ({ term: String(j.term), plain: String(j.plain) }))
            : [],
          simpler: str(o.simpler_version, body.definition),
        };
      },
    }),
);

// ---------- Elaborative Interrogation ----------

endpoint(
  "/ai/ei-generate",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "sonnet",
      maxTokens: 8000,
      name: body.name,
      age: body.age,
      system:
        "You write elaborative-interrogation questions from study notes. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes in any text you return.",
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        "Read these notes and break them into individual facts, statements, or concepts FROM THE NOTES ONLY. Do not introduce facts or concepts not present in the student's notes. For each one generate a why question or a how question that pushes the student to think about the reasoning behind it. Also generate a connection question asking how this fact connects to something else IN THESE SAME NOTES. Also, for each item, build a small visual chain showing the reasoning as a sequence of 3 or 4 steps, each step a short label of 2 to 6 words, in causal order.\n\n" +
        'IMPORTANT: Every "fact", "model_answer", and "connection_question" MUST be grounded in the student\'s notes above. Only add extra context if it directly explains WHY a note-fact is true and would realistically appear on their test.\n\n' +
        "Return ONLY a JSON array (6 to 10 items) where each object has:\n" +
        '"fact" (the original statement copied word-for-word from the notes),\n' +
        '"plain_english" (a plain-English rewrite of that same fact — NO jargon, NO technical terms unless immediately defined in brackets, written as if texting a friend who has never studied this subject at all; 2 to 3 sentences, genuinely simpler than the original),\n' +
        '"why_question" (a why or how question about that fact),\n' +
        '"connection_question" (asking how it connects to other content IN THESE NOTES specifically),\n' +
        '"model_answer" (a strong answer to the why question, based on the notes — if the notes don\'t explain why, say so honestly and give the best answer the notes support),\n' +
        '"chain" (array of 3 or 4 short step labels in causal order),\n' +
        '"chain_caption" (one short sentence naming what the chain shows),\n' +
        '"primer_terms" (array of 0 to 3 objects with "term" and "means", defining any word in "fact" a beginner would not know).',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const items = p
          .filter((x) => x && x.fact && x.why_question && x.connection_question && x.model_answer)
          .slice(0, 10)
          .map((x) => ({
            fact: String(x.fact),
            plainEnglish: str(x.plain_english),
            whyQuestion: String(x.why_question),
            connectionQuestion: String(x.connection_question),
            modelAnswer: String(x.model_answer),
            chain: Array.isArray(x.chain)
              ? x.chain.filter((st: unknown) => typeof st === "string" && (st as string).trim()).map((st: string) => st.trim()).slice(0, 4)
              : [],
            chainCaption: str(x.chain_caption),
            primerTerms: Array.isArray(x.primer_terms)
              ? x.primer_terms
                  .filter((t: Record<string, unknown>) => t && t.term && t.means)
                  .slice(0, 3)
                  .map((t: Record<string, unknown>) => ({ term: String(t.term), means: String(t.means) }))
              : [],
          }));
        return items.length ? { items } : null;
      },
    }),
);

const verdictShape = z.enum(["correct", "partially_correct", "incorrect"]);

endpoint(
  "/ai/ei-grade-why",
  z.object({
    fact: z.string().min(1).max(2000),
    whyQuestion: z.string().min(1).max(1000),
    modelAnswer: z.string().min(1).max(4000),
    text: z.string().min(5).max(10_000),
    material: z.string().max(200_000).optional(),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system: "You grade a student's reasoning fairly. " + NO_EM_DASH,
      prompt:
        'The fact is: "' + body.fact + '". The question was: "' + body.whyQuestion + '". The model answer is: "' + body.modelAnswer + '".\n\nThe student answered:\n"""' + body.text + '"""\n\n' +
        'Evaluate whether the student\'s reasoning is correct, partially correct, or incorrect. Grade against the model answer above and the source material below — do not accept answers that contradict them even if plausible in general. Return ONLY JSON: {"verdict": "correct"|"partially_correct"|"incorrect", "feedback": "one or two sentences on what they got right, what they missed, and why the correct answer makes logical sense"}' +
        materialCtx(body.material, 1000),
      validate: (p) => {
        const o = p as Record<string, unknown> | null;
        const verdict = verdictShape.safeParse(o?.verdict);
        return verdict.success ? { verdict: verdict.data, feedback: str(o?.feedback) } : null;
      },
    }),
);

endpoint(
  "/ai/ei-grade-connection",
  z.object({
    fact: z.string().min(1).max(2000),
    connectionQuestion: z.string().min(1).max(1000),
    text: z.string().min(5).max(10_000),
    material: materialField,
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system: "You grade a student's conceptual connections fairly. " + NO_EM_DASH,
      prompt:
        'The fact is: "' + body.fact + '". The connection question was: "' + body.connectionQuestion + '".\n\nHere are the student\'s notes for context:\n"""' + tidyMaterial(body.material, 2000) + '"""\n\nThe student answered:\n"""' + body.text + '"""\n\n' +
        'Evaluate whether the connection the student made is accurate. Return ONLY JSON: {"verdict": "correct"|"partially_correct"|"incorrect", "feedback": "brief feedback on whether the connection was accurate", "ideal_connection": "one sentence describing an ideal connection to make"}',
      validate: (p) => {
        const o = p as Record<string, unknown> | null;
        const verdict = verdictShape.safeParse(o?.verdict);
        return verdict.success
          ? { verdict: verdict.data, feedback: str(o?.feedback), idealConnection: str(o?.ideal_connection) }
          : null;
      },
    }),
);

// ---------- Concrete Examples ----------

endpoint(
  "/ai/ce-generate",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "sonnet",
      maxTokens: 8000,
      name: body.name,
      age: body.age,
      system:
        'You write vivid, specific real-world examples for study concepts. Every "example" field must be a concrete story or scene written in full — never a prompt like "think of a time" or "imagine a moment". Respond with ONLY a valid JSON array. No markdown fences, no extra text. Never use em dashes.',
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        "Read these notes carefully. Identify the 5 to 10 most abstract, confusing, or hard-to-visualise concepts a student might struggle with.\n\n" +
        'For each concept, write a SPECIFIC, VIVID real-world example from daily life — a short scene or story the student has actually lived through (walking to school, scrolling their phone, eating, playing sport, cooking, shopping, arguing with a sibling, etc.). The example must name a real situation with real details. NEVER write vague instructions like "think of a moment", "imagine a time", or "consider how" — write the actual example directly.\n\n' +
        "For maths/science concepts also include a worked sample problem.\n\n" +
        "Return ONLY a raw JSON array, no markdown, no code fences:\n" +
        '[{"concept":"...","plain_definition":"one sentence","example":"the vivid specific scene — written out, not a prompt to think of one","sample_problem":"worked problem or empty string","connection_question":"question asking student to link example back to concept"}]',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const items = p
          .filter((x) => x && x.concept && x.plain_definition && x.example && x.connection_question)
          .map((x) => ({
            concept: String(x.concept),
            plainDefinition: String(x.plain_definition),
            example: String(x.example),
            sampleProblem: str(x.sample_problem),
            connectionQuestion: String(x.connection_question),
          }))
          .slice(0, 10);
        return items.length ? { items } : null;
      },
    }),
);

endpoint(
  "/ai/ce-grade",
  z.object({
    concept: z.string().min(1).max(500),
    plainDefinition: z.string().min(1).max(2000),
    example: z.string().min(1).max(4000),
    text: z.string().min(5).max(10_000),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1200,
      name: body.name,
      age: body.age,
      system: "You are a warm study coach checking concept-example connections. " + NO_EM_DASH,
      prompt:
        'The concept is: "' + body.concept + '". Plain definition: "' + body.plainDefinition + '". The real-world example given was: "' + body.example + '".\n\nThe student explained how the example connects back to the concept:\n"""' + body.text + '"""\n\n' +
        'Evaluate whether the student correctly identified the connection. Return ONLY JSON: {"correct": true or false, "got_right": "what they got right, one sentence", "missed": "what they missed, one sentence, or empty string", "reinforce": "one sentence reinforcing the connection clearly"}',
      validate: (p) => {
        const o = p as Record<string, unknown> | null;
        if (!o || typeof o.correct !== "boolean") return null;
        return { correct: o.correct, gotRight: str(o.got_right), missed: str(o.missed), reinforce: str(o.reinforce) };
      },
    }),
);

endpoint(
  "/ai/ce-new-example",
  z.object({
    concept: z.string().min(1).max(500),
    plainDefinition: z.string().min(1).max(2000),
    example: z.string().min(1).max(4000),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 800,
      name: body.name,
      age: body.age,
      system: "You invent relatable real-world analogies. " + NO_EM_DASH,
      prompt:
        'The concept is: "' + body.concept + '" (definition: "' + body.plainDefinition + '"). The previous real-world example was: "' + body.example + '".\n\n' +
        'Generate a COMPLETELY DIFFERENT real world example for the same concept, a fresh analogy from a teenager\'s everyday life, nothing like the previous one. Return ONLY JSON: {"example": "the new vivid real world example"}',
      validate: (p) => {
        const o = p as Record<string, unknown> | null;
        const ex = str(o?.example).trim();
        return ex ? { example: ex } : null;
      },
    }),
);

// ---------- Practice Testing ----------

endpoint(
  "/ai/pt-generate",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "sonnet",
      maxTokens: 8000,
      name: body.name,
      age: body.age,
      system:
        "You write practice tests from study notes. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes in any text you return.",
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        "Read these notes carefully and generate 10 practice test questions based on the most important and testable content. Mix the question types: multiple choice, true or false, and short answer.\n" +
        'For multiple choice provide exactly 4 answer options where only one is correct. For true or false the answer is either "True" or "False". For short answer provide a model answer the student\'s response will be compared against.\n' +
        'Return ONLY a JSON array where each object has: "question" (string), "type" ("multiple_choice", "true_or_false", or "short_answer"), "options" (array of 4 option strings WITHOUT letter prefixes, only for multiple_choice, omit otherwise), and "correct_answer" (for multiple_choice the letter "A", "B", "C" or "D" matching the option\'s position; for true_or_false "True" or "False"; for short_answer the model answer).',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const questions = p
          .filter(
            (q) =>
              q && typeof q.question === "string" && q.correct_answer != null &&
              (q.type === "true_or_false" || q.type === "short_answer" ||
                (q.type === "multiple_choice" && Array.isArray(q.options) && q.options.length === 4)),
          )
          .slice(0, 10)
          .map((q) => ({
            question: String(q.question),
            type: q.type as "multiple_choice" | "true_or_false" | "short_answer",
            options: Array.isArray(q.options) ? q.options.map(String) : undefined,
            correctAnswer: String(q.correct_answer),
          }));
        return questions.length >= 3 ? { questions } : null;
      },
    }),
);

const indexedItems = z.array(
  z.object({
    i: z.number().int().min(0),
    question: z.string().max(2000),
    modelAnswer: z.string().max(2000),
    studentResponse: z.string().max(4000),
  }),
).min(1).max(15);

endpoint(
  "/ai/pt-grade-sa",
  z.object({ items: indexedItems, ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 2000,
      name: body.name,
      age: body.age,
      system:
        "You grade short-answer test responses. Accept abbreviations and equivalent correct approaches. Be strict on factual accuracy but generous on phrasing and format. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes.",
      prompt:
        'Grade these short-answer responses from a student\'s practice test. For each, compare the student response to the model answer and decide if it is "correct", "partially_correct", or "incorrect".\n\n' +
        'IMPORTANT: Accept answers that are abbreviated (e.g. "DNA" instead of "deoxyribonucleic acid"), use equivalent phrasing, or reach the correct meaning through a different valid method or approach. Be lenient with format but strict about factual accuracy.\n\n' +
        JSON.stringify(body.items.map((x) => ({ i: x.i, question: x.question, model_answer: x.modelAnswer, student_response: x.studentResponse }))) +
        '\n\nReturn ONLY a JSON array: [{"i": number, "verdict": "correct"|"partially_correct"|"incorrect", "explanation": "one or two sentences — if incorrect/partially correct, explain clearly what was wrong or missing and what the correct idea is"}]',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const graded = p
          .filter((g) => g && typeof g.i === "number" && verdictShape.safeParse(g.verdict).success)
          .map((g) => ({ i: g.i, verdict: g.verdict as z.infer<typeof verdictShape>, explanation: str(g.explanation) }));
        return graded.length ? { graded } : null;
      },
    }),
);

endpoint(
  "/ai/pt-explain-wrong",
  z.object({
    items: z.array(
      z.object({
        i: z.number().int().min(0),
        question: z.string().max(2000),
        correctAnswer: z.string().max(2000),
        studentAnswer: z.string().max(4000),
      }),
    ).min(1).max(15),
    ...student,
  }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 1500,
      name: body.name,
      age: body.age,
      system:
        "You explain why test answers are wrong, clearly and helpfully. Respond with ONLY a valid JSON array, no markdown fences, no extra text. Never use em dashes.",
      prompt:
        "For each wrong answer below, write a brief 1-2 sentence explanation of why the correct answer is right and what the student likely misunderstood or got confused about.\n\n" +
        JSON.stringify(body.items.map((x) => ({ i: x.i, question: x.question, correct_answer: x.correctAnswer, student_answer: x.studentAnswer }))) +
        '\n\nReturn ONLY a JSON array: [{"i": number, "explanation": "1-2 sentences explaining why the correct answer is right and what went wrong"}]',
      validate: (p) => {
        if (!Array.isArray(p)) return null;
        const graded = p
          .filter((g) => g && typeof g.i === "number" && typeof g.explanation === "string")
          .map((g) => ({ i: g.i, explanation: g.explanation as string }));
        return graded.length ? { graded } : null;
      },
    }),
);

// ---------- Pomodoro ----------

endpoint(
  "/ai/pomodoro-chunks",
  z.object({ material: materialField, ...student }),
  async (body) =>
    askJson({
      model: "haiku",
      maxTokens: 3500,
      name: body.name,
      age: body.age,
      system: "You break study notes into bite-size focus chunks. " + NO_EM_DASH,
      prompt:
        'Here are a student\'s study notes:\n\n"""' + tidyMaterial(body.material) + '"""\n\n' +
        'Break these notes into study chunks where each chunk covers one single topic or concept and can be read and understood in approximately 3 to 5 minutes. Give each chunk a short title, and rewrite its content as clear plain English bullet points with the most important terms wrapped in **double asterisks** for bold. Also write 4 short fun facts related to this subject that a student could enjoy reading on a break. Return ONLY JSON: {"chunks": [{"title": "short title", "bullets": ["bullet point with **key term** bolded", "..."]}], "fun_facts": ["fun fact 1", "..."]}',
      validate: (p) => {
        const o = p as { chunks?: unknown; fun_facts?: unknown } | null;
        if (!o || !Array.isArray(o.chunks)) return null;
        const chunks = o.chunks
          .filter((c) => c && typeof c.title === "string" && Array.isArray(c.bullets) && c.bullets.length)
          .map((c) => ({ title: c.title as string, bullets: (c.bullets as unknown[]).filter((x): x is string => typeof x === "string") }))
          .slice(0, 12);
        if (!chunks.length) return null;
        const funFacts = Array.isArray(o.fun_facts)
          ? o.fun_facts.filter((x): x is string => typeof x === "string").slice(0, 8)
          : [];
        return {
          chunks,
          funFacts: funFacts.length
            ? funFacts
            : ["Taking real breaks actually improves how much you remember, your brain consolidates while you rest."],
        };
      },
    }),
);

export default router;
