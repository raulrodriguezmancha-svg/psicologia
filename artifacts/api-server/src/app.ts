import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(cors());

// El webhook de Stripe necesita el body como Buffer — debe ir ANTES de express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const frontendDist = path.resolve(__dirname, "../../psicologia-web/dist/public");
const indexHtml = path.join(frontendDist, "index.html");

logger.info({ frontendDist, indexHtml, exists: fs.existsSync(indexHtml) }, "Frontend static path");

app.use(express.static(frontendDist, { index: "index.html" }));
app.get("/{*splat}", (req, res) => {
  res.sendFile(indexHtml);
});

export default app;
