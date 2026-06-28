import app from "./app";
import { logger } from "./lib/logger";
import { startSyncJob, stopSyncJob } from "./jobs/syncOrders";
import { startSmmSyncJob, stopSmmSyncJob } from "./jobs/smmSyncJob";
import { syncExchangeRates, syncSmmServices } from "./services/syncServices";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed on startup so cache is never empty after fresh deploy
  logger.info("Running initial SMM sync...");
  await syncExchangeRates();
  await syncSmmServices();
  logger.info("Initial SMM sync complete");

  // Start background jobs
  startSyncJob();
  startSmmSyncJob();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, stopping background jobs");
  stopSyncJob();
  stopSmmSyncJob();
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, stopping background jobs");
  stopSyncJob();
  stopSmmSyncJob();
  process.exit(0);
});