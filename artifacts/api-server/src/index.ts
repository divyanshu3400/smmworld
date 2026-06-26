import app from "./app";
import { logger } from "./lib/logger";
import { startSyncJob, stopSyncJob } from "./jobs/syncOrders";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start background jobs
  startSyncJob();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, stopping background jobs");
  stopSyncJob();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, stopping background jobs");
  stopSyncJob();
  process.exit(0);
});
