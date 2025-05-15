import cron from "node-cron";
import { SyncService } from "./syncService.js";


const syncService = new SyncService();

export const startSyncJob = (syncService) => {
    // console.log("Scheduled sync job registered (every 5 minutes)");
    cron.schedule(process.env.SYNC_CRON || "*/5 * * * *", async () => {
      // console.log("\n🔔 CRON TRIGGERED:", new Date().toISOString());
      try {
        const count = await syncService.performSync();
        console.log(`Synced ${count} records`);
      } catch (error) {
        console.error("Sync error:", error);
      }
    });
  };