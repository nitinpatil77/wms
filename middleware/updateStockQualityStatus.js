import cron from "node-cron";
import Stock from "../models/stockModel/stockModel.js";
import ClientBeforeQaCheck from "../models/clientDataModel/clientBeforeQaCheckModel.js";

export const initQualityStatusUpdater = () => {
  // Scheduled job (every 4 hours)
  cron.schedule("0 */4 * * *", async () => {
    console.log("Scheduled quality check triggered at", new Date().toISOString());
    const updatedCount = await updateQualityStatus();
    console.log(`Job completed. Total stocks updated: ${updatedCount}\n`);
  });
};

const updateQualityStatus = async () => {
  let totalUpdated = 0;
  
  try {
    const approvedEntries = await ClientBeforeQaCheck.find({
      quality_status: "approve"
    });

    for (const qaEntry of approvedEntries) {
      const updateResult = await Stock.updateMany(
        {
          batch: qaEntry.batch,
          skuDetails: qaEntry.material,
          qaStatus: "hold"
        },
        { $set: { qaStatus: "ok" } }
      );

      const entryUpdateCount = updateResult.modifiedCount;
      totalUpdated += entryUpdateCount;
     
    }

    return totalUpdated;
  } catch (error) {
    console.error("[CRON] Error:", error);
    return totalUpdated;
  }
};