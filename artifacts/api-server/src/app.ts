import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// The web app is served path-routed on the same origin as this API, so it
// needs no CORS at all, and native mobile apps don't send an Origin header.
// Cross-origin browser access is therefore opt-in only: set ALLOWED_ORIGINS
// (comma-separated) for cases like Expo web dev on a different domain.
// Previously this was `cors()` (allow-all), which let any website on the
// internet call our Claude proxy from its visitors' browsers.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
if (allowedOrigins.length > 0) {
  app.use(cors({ origin: allowedOrigins }));
}

// 5mb accommodates vision payloads (canvas snapshots, PDF pages as base64).
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
