// Placeholder so Vercel's config validation finds the declared function.
// The real handler is bundled over this file by the buildCommand
// (artifacts/api-server/build.vercel.mjs) before the function is packaged —
// this code never runs in a completed deploy.
module.exports = (req, res) => {
  res.statusCode = 503;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "API was not built - buildCommand did not run" }));
};
