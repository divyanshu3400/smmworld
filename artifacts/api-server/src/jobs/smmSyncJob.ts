import cron, { ScheduledTask } from "node-cron";
import { logger } from "../lib/logger";
import { syncExchangeRates, syncSmmServices } from "../services/syncServices";

let ratesTask: ScheduledTask | null = null;
let servicesTask: ScheduledTask | null = null;

export function startSmmSyncJob(): void {
    ratesTask = cron.schedule("0 0,12 * * *", async () => {
        logger.info("Cron: Exchange rate sync triggered");
        const result = await syncExchangeRates();
        logger.info({ result }, "Cron: Exchange rate sync finished");
    });

    servicesTask = cron.schedule("5 0,6,12,18 * * *", async () => {
        logger.info("Cron: SMM services sync triggered");
        const result = await syncSmmServices();
        logger.info({ result }, "Cron: SMM services sync finished");
    });

    logger.info("SMM sync cron jobs registered");
}

export function stopSmmSyncJob(): void {
    ratesTask?.stop();
    servicesTask?.stop();
    logger.info("SMM sync cron jobs stopped");
}