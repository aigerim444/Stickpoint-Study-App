// Bundles the API into a plain-JS Vercel function (api/index.js).
// Vercel's own TS compilation uses different module-resolution rules than
// this workspace, so we hand it pre-built JavaScript instead.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const here = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(here, "..", "..");
mkdirSync(join(repoRoot, "api"), { recursive: true });

await build({
  entryPoints: [join(here, "src", "vercel.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: join(repoRoot, "api", "index.js"),
  logLevel: "info",
});
