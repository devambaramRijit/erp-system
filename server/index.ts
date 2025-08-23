import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import express from "express";
import type { Request, Response, NextFunction } from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware: log API requests + response bodies (shortened)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json.bind(res);
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson, ...args);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler
app.use(((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
}) as express.ErrorRequestHandler);

  // Detect environment safely (works on Windows too)
  const nodeEnv = process.env.NODE_ENV || "production";

  if (nodeEnv === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Always serve on process.env.PORT (default 5000)
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`✅ Serving on http://localhost:${port} [${nodeEnv}]`);
  });
})();
