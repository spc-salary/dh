import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Serve the single-file directory app at root
// Walk up from the package dir to the workspace root where index.html lives
const INDEX_HTML = (() => {
  const candidates = [
    path.resolve(process.cwd(), "index.html"),
    path.resolve(process.cwd(), "..", "..", "index.html"),
    "/home/runner/workspace/index.html",
  ];
  const fs = require("fs") as typeof import("fs");
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
})();
app.get("/", (_req, res) => {
  res.sendFile(INDEX_HTML);
});

export default app;
