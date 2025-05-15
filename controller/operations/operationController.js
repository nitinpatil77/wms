import axios from "axios";
import { io } from "../../config/socket.js";
import mongoose from "mongoose";
import OperationModel from "../../models/operatonModel/operationModel.js";
import StorageLocation from "../../models/master/addStorageLocationmodel.js";
import MachinePickUpLocation from "../../models/master/addNewMachinePickupLcationsModel.js";
import RetrievalDropLocation from "../../models/master/addNewRetrievalDropLocationModel.js";
import StockModel from "../../models/stockModel/stockModel.js";
import ManualRetrieval from "../../models/operatonModel/manualOperation.js";
import RobotStatus from "../../models/robotsStatus/robotStatusModel.js";
import OperationHistory from "../../models/operatonModel/OperationHistory .js";
import EmptyPalletDropLocation from "../../models/master/addNewEmptyPalletDropModel.js";
import EmptyPalletPickUpLocation from "../../models/master/addNewEmptyPalletPickUpModel.js";
import RobotErrorLog from "../../models/agvLogModel/robotErrorLoggerModel.js";
import RobotWaitLog from "../../models/agvLogModel/robotWaitLoggerModel.js";

// --------------- Operation Controller ---------------
const operationQueue = [];
let currentOperation = null; // NEW: to track running operation
let isProcessing = false;

// --------------- Save Operation into the Queue & DB ---------------
export const createOperation = async (req, res) => {
  // console.log("Received Payload:", req.body);

  const { userId, role } = req.query;
  console.log(`Received userId: ${userId}, role: ${role}`);
  // Validate userId before proceeding
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }
  if (!role) {
    return res.status(400).json({ message: "Role is required" });
  }
  let {
    fromLoc,
    toLoc,
    noOfBatches,
    skuDetails,
    timestamps,
    compoundAge,
    operationType,
    warehouse,
    batch,
  } = req.body;

  if (!fromLoc || !toLoc || !operationType) {
    return res
      .status(400)
      .json({ message: "fromLoc, toLoc, and operationType are required" });
  }

  // Ensure noOfBatches and skuDetails are properly set for EmptyStorage
  if (operationType === "EmptyStorage" && operationType === "RETRIEVAL") {
    noOfBatches = null;
    skuDetails = null;
    timestamps = null;
    compoundAge = null;
    warehouse = null;
    batch = null;
  }
  if (operationType === "RETRIEVAL") {
    timestamps = null;
    compoundAge = null;
  }

  const newOperation = new OperationModel({
    fromLoc,
    toLoc,
    noOfBatches,
    skuDetails,
    operationType,
    timestamps,
    compoundAge,
    batch,
    warehouse,
    userId,
    role,
    status: "INQUEUE",
  });

  await newOperation.save();

  io.emit("operationSaved", {
    message: "Operation saved successfully!",
    operation: newOperation,
  });
  // Operation type storage then we need freez the storage location
  if (operationType === "STORAGE") {
    await StorageLocation.updateOne(
      { user_storage_name: toLoc },
      { $set: { status: 2 } }
    );
  }
  // Add operation to queue
  operationQueue.push(newOperation);
  io.emit("queueUpdated", { queue: operationQueue, current: currentOperation });

  // Start processing if not already running
  if (!isProcessing) {
    processNextOperation();
  }

  return res.status(201).json({
    message: "Operation added to queue successfully!",
    queue: operationQueue,
  });
};
// --------------- Get All Operations ---------------
export const getAllOperations = async (req, res) => {
  try {
    const operations = await OperationModel.find().sort({ createdAt: -1 }); // newest first
    res.status(200).json(operations);
  } catch (error) {
    console.error("Error fetching operations:", error.message);
    res.status(500).json({ error: "Failed to fetch operations" });
  }
};
// --------------- Get Queue Status ---------------
export const getQueueStatus = (req, res) => {
  res.status(200).json({
    current: currentOperation,
    queue: operationQueue,
  });
};
// --------------- Get Full Poll Status from Client ---------------
let latestFullRobotResponse = {
  data: null,
  lastUpdated: null,
};
// --------------- Poll Robot Status ---------------
const processNextOperation = async () => {
  if (operationQueue.length === 0) {
    console.log("No pending operations.");
    currentOperation = null;
    io.emit("queueUpdated", { queue: operationQueue, current: null });
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const operation = operationQueue.shift();
  currentOperation = operation;
  operation.status = "RUNNING";
  const startedAt = new Date();

  // Save the RUNNING status with start time in OperationHistory
  await OperationHistory.create({
    operationId: operation._id.toString(),
    fromLoc: operation.fromLoc,
    toLoc: operation.toLoc,
    fromLoc2: operation.fromLoc2,
    toLoc2: operation.toLoc2,
    noOfBatches: operation.noOfBatches,
    skuDetails: operation.skuDetails,
    operationType: operation.operationType,
    timestamps: operation.timestamps,
    compoundAge: operation.compoundAge,
    batch: operation.batch,
    warehouse: operation.warehouse,
    userId: operation.userId,
    role: operation.role,
    status: "RUNNING",
    startedAt: startedAt,
  });

  io.emit("queueUpdated", { queue: operationQueue, current: currentOperation });
  await OperationModel.findByIdAndUpdate(operation._id, { status: "RUNNING" });

  try {
    let fromLoc2, toLoc2;

    if (operation.operationType === "STORAGE") {
      const machinePickup = await MachinePickUpLocation.findOne({
        user_storage_name: operation.fromLoc,
      });
      const storageLocation = await StorageLocation.findOne({
        user_storage_name: operation.toLoc,
      });

      fromLoc2 = machinePickup?.landmark || null;
      toLoc2 = storageLocation?.landmark || null;
    } else if (operation.operationType === "RETRIEVAL") {
      const storageLocation = await StorageLocation.findOne({
        user_storage_name: operation.fromLoc,
      });
      const machineDrop = await RetrievalDropLocation.findOne({
        user_storage_name: operation.toLoc,
      });

      fromLoc2 = storageLocation?.landmark || null;
      toLoc2 = machineDrop?.landmark || null;
    } else if (operation.operationType === "EmptyStorage") {
      const emptyPickup = await EmptyPalletPickUpLocation.findOne({
        user_storage_name: operation.fromLoc,
      });
      const emptyDrop = await EmptyPalletDropLocation.findOne({
        user_storage_name: operation.toLoc,
      });

      fromLoc2 = emptyPickup?.landmark || null;
      toLoc2 = emptyDrop?.landmark || null;
    }

    if (!fromLoc2 || !toLoc2) {
      console.error("Invalid location mapping");
      await OperationModel.findByIdAndDelete(operation._id);
      return processNextOperation();
    }

    operation.fromLoc2 = fromLoc2;
    operation.toLoc2 = toLoc2;
    await operation.save();

    const operationData = {
      Id: operation._id.toString(),
      Source: operation.fromLoc.toString(),
      Destination: operation.toLoc.toString(),
      SourcePrePoint: fromLoc2.toString(),
      DesPrePoint: toLoc2.toString(),
    };

    io.emit("operationCreated", operationData);

    const clientApiUrl = "http://192.168.40.21:8080/script-api/postOrder";
    await axios.post(clientApiUrl, JSON.stringify(operationData), {
      headers: { "Content-Type": "application/json" },
    });

    const success = await pollRobotStatus(
      operation,
      operation.toLoc,
      operation.operationType
    );

    const completedAt = new Date(); // Capture operation end time
    const duration = completedAt - startedAt; // Compute task duration in milliseconds

    if (success) {
      // Update the operation history with completion time and duration
      await OperationHistory.findOneAndUpdate(
        { operationId: operation._id.toString(), status: "RUNNING" },
        {
          $set: {
            status: "FINISHED",
            completedAt: completedAt,
            duration: duration,
          },
        }
      );
    } else {
      await OperationHistory.findOneAndUpdate(
        { operationId: operation._id.toString(), status: "RUNNING" },
        {
          $set: {
            status: "Terminated",
            completedAt: completedAt,
            duration: duration,
          },
        }
      );
    }

    await OperationModel.findByIdAndDelete(operation._id);
    await RobotStatus.deleteMany({ operationId: operation._id });

    currentOperation = null;
    isProcessing = false;
    io.emit("queueUpdated", { queue: operationQueue, current: null });

    processNextOperation();
  } catch (error) {
    console.error("Error processing operation:", error.message);
    await OperationModel.findByIdAndDelete(operation._id);
    isProcessing = false;
    processNextOperation();
  }
};
// --------------- get all operations history ---------------
export const getOperationHistory = async (req, res) => {
  try {
    const operations = await OperationHistory.find({
      status: { $in: ["FINISHED", "STOPPED"] },
    }).sort({ completedAt: -1, stoppedAt: -1 });

    const formattedOperations = operations.map((op) => ({
      ...op._doc,
      durationInSeconds: op.duration ? (op.duration / 1000).toFixed(2) : null,
      durationInMinutes: op.duration ? (op.duration / 60000).toFixed(2) : null,
      stoppedAt: op.status === "STOPPED" ? op.stoppedAt : null,
    }));

    res.status(200).json(formattedOperations);
  } catch (error) {
    console.error("Error fetching operation history:", error.message);
    res.status(500).json({ error: "Failed to fetch operation history" });
  }
};
// Add these global variables at the top with other declarations
let activeErrors = {};
let isWaiting = false;
let waitStartTime = null;
// --------------- Poll Robot Status ---------------
const pollRobotStatus = async (operation, toLoc, operationType) => {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          "http://192.168.40.21:8088/robotsStatus"
        );
        const report = response.data?.report?.[0];

        latestFullRobotResponse = {
          data: response.data,
          lastUpdated: new Date(),
        };

        if (!report || !report.current_order) {
          console.warn("No current order found.");
          return;
        }
        // update history and ocation status if operation is stopped
        const current_order = report.current_order;
        if (current_order?.state === "STOPPED") {
          console.error(`Operation ${operation._id} stopped.`);
          const stoppedAt = new Date();

          await OperationHistory.findOneAndUpdate(
            { operationId: operation._id.toString(), status: "RUNNING" },
            {
              $set: {
                status: "STOPPED",
                stoppedAt: stoppedAt,
                duration: stoppedAt - operation.createdAt,
              },
            }
          );

          // Cleanup operations
          await OperationModel.findByIdAndDelete(operation._id);
          await RobotStatus.deleteMany({ operationId: operation._id });

          // Reset storage location if needed
          if (operationType === "STORAGE") {
            await StorageLocation.updateOne(
              { user_storage_name: toLoc },
              { $set: { status: 0 } }
            );
          }

          clearInterval(interval);
          resolve(false);
          return;
        }

        // Update the Stock status in the database when the operation is finished
        if (
          current_order.blocks.length >= 4 &&
          current_order.blocks[0].state === "FINISHED" &&
          current_order.blocks[1].state === "FINISHED" &&
          current_order.blocks[2].state === "FINISHED" &&
          current_order.blocks[3].state === "FINISHED"
        ) {
          console.log("Operation finished:", operation._id);

          if (operationType === "STORAGE") {
            await StorageLocation.updateOne(
              { user_storage_name: toLoc },
              { $set: { status: 1 } }
            );

            await StockModel.create({
              operationId: operation._id.toString(),
              noOfBatches: operation.noOfBatches,
              skuDetails: operation.skuDetails,
              fromLoc: operation.fromLoc,
              toLoc: operation.toLoc,
              fromLoc2: operation.fromLoc2,
              toLoc2: operation.toLoc2,
              createdAt: operation.timestamps,
              compoundAge: operation.compoundAge,
              batch: operation.batch,
              warehouse: operation.warehouse,
              qaStatus: "Hold",
              userId: operation.userId,
              role: operation.role,
            });
          } else if (operationType === "RETRIEVAL") {
            const stockEntry = await StockModel.findOne({
              toLoc: operation.fromLoc,
              skuDetails: operation.skuDetails,
            });

            if (stockEntry) {
              if (stockEntry.noOfBatches <= operation.noOfBatches) {
                await StockModel.deleteOne({ _id: stockEntry._id });
              } else {
                stockEntry.noOfBatches -= operation.noOfBatches;
                await stockEntry.save();
              }
            }

            await StorageLocation.updateOne(
              { user_storage_name: operation.fromLoc },
              { $set: { status: 0 } }
            );
          }
          // EmptyStorage operations are recorded in history
          // else if (operationType === "EmptyStorage") {
          //   await OperationHistory.create({
          //     operationId: operation._id.toString(),
          //     fromLoc: operation.fromLoc,
          //     toLoc: operation.toLoc,
          //     fromLoc2: operation.fromLoc2 || null,
          //     toLoc2: operation.toLoc2 || null,
          //     noOfBatches: null,
          //     skuDetails: null,
          //     operationType: operation.operationType,
          //     status: "FINISHED",
          //     completedAt: new Date(),
          //   });
          // }

          // Delete Operation and Clear Robot Status
          await OperationModel.findByIdAndDelete(operation._id);
          await RobotStatus.deleteMany({ operationId: operation._id });

          clearInterval(interval);
          resolve(true);
        }

        // Enhanced error/warning/fatal handling
        if (report.rbk_report?.alarms) {
          const allIssues = [
            ...(report.rbk_report.alarms.notices || []).map((n) => ({
              ...n,
              severity: "notice",
            })),
            ...(report.rbk_report.alarms.warnings || []).map((w) => ({
              ...w,
              severity: "warning",
            })),
            ...(report.rbk_report.alarms.errors || []).map((e) => ({
              ...e,
              severity: "error",
            })),
            ...(report.rbk_report.alarms.fatals || []).map((f) => ({
              ...f,
              severity: "fatal",
            })),
          ];

          // Process new issues
          for (const issue of allIssues) {
            const errorKey = `${issue.code}-${issue.severity}`;

            if (!activeErrors[errorKey]) {
              activeErrors[errorKey] = {
                startTime: new Date(),
                data: issue,
              };

              await RobotErrorLog.create({
                errorCode: issue.code,
                description: issue.desc || issue.describe,
                severity: issue.severity,
                startTime: new Date(),
                operationId: operation?._id?.toString(),
                timestamp: issue.timestamp || Math.floor(Date.now() / 1000),
                occurrences: issue.times || 1,
              });
            } else {
              // Update existing error if still active
              await RobotErrorLog.updateOne(
                {
                  errorCode: issue.code,
                  severity: issue.severity,
                  resolved: false,
                },
                { $inc: { occurrences: 1 }, $set: { updatedAt: new Date() } }
              );
            }
          }

          // Check for resolved issues
          const activeErrorKeys = Object.keys(activeErrors);
          for (const key of activeErrorKeys) {
            const [code, severity] = key.split("-");
            if (
              !allIssues.some(
                (i) => i.code.toString() === code && i.severity === severity
              )
            ) {
              // Issue resolved
              const error = activeErrors[key];
              const endTime = new Date();
              const duration = endTime - error.startTime;

              await RobotErrorLog.updateOne(
                {
                  errorCode: code,
                  severity: severity,
                  resolved: false,
                },
                {
                  endTime,
                  duration,
                  resolved: true,
                }
              );

              delete activeErrors[key];
            }
          }
        }
        // update the robot ideal status in the database
        if (current_order?.state === "WAITING") {
          if (!isWaiting) {
            isWaiting = true;
            waitStartTime = new Date();
            console.log(`[WAITING START] ${waitStartTime}`);
          }
        } else {
          if (isWaiting) {
            const endTime = new Date();
            const totalTime = ((endTime - waitStartTime) / 60000).toFixed(2);
            await RobotWaitLog.create({
              startTime: waitStartTime,
              endTime,
              totalTime,
            });

            console.log(`[WAITING END] Total Wait Time: ${totalTime} seconds`);

            // Reset
            isWaiting = false;
            waitStartTime = null;
          }
        }
      } catch (error) {
        console.error("Error fetching robot status:", error.message);
      }
    }, 1000);
  });
};
// --------------- Get Full Poll Status from Client for FrontEnd ---------------
export const getClientFullPollStatus = (req, res) => {
  if (!latestFullRobotResponse.data) {
    return res
      .status(404)
      .json({ message: "No data polled yet from robot client." });
  }
  res.status(200).json(latestFullRobotResponse);
};
// --------------- Poll Robot Errors ---------------
export const getRobotErrors = async (req, res) => {
  try {
    const errors = await RobotErrorLog.find().sort({ startTime: -1 }).lean();
    
    // Ensure descriptions are arrays
    const formattedErrors = errors.map(error => ({
      ...error,
      description: Array.isArray(error.description) 
        ? error.description 
        : [error.description].filter(Boolean)
    }));

    res.status(200).json(formattedErrors);
  } catch (error) {
    console.error("Error fetching robot errors:", error.message);
    res.status(500).json({ error: "Failed to fetch robot errors" });
  }
};
// --------------- Manual Retrieval for Mannaul Forklefter ---------------
export const manualRetrieval = async (req, res) => {
  try {
    // console.log("Manual Retrieval Payload:", req.body);

    const { skuDetails, noOfBatches, storagelocNumber } = req.body;

    // Validate input
    if (!skuDetails || !noOfBatches || !storagelocNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find stock entry for the given storage location
    const stockEntry = await StockModel.findOne({
      toLoc: storagelocNumber,
      skuDetails,
    });

    if (!stockEntry) {
      return res
        .status(404)
        .json({ message: "Stock not found for the given location" });
    }

    // Check if there are enough batches to retrieve
    if (stockEntry.noOfBatches < noOfBatches) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    // Move retrieved stock details to ManualRetrieval table
    const manualRetrievalEntry = new ManualRetrieval({
      operationId: stockEntry.operationId,
      skuDetails,
      noOfBatches,
      fromLoc: stockEntry.fromLoc,
      toLoc: stockEntry.toLoc,
      fromLoc2: stockEntry.fromLoc2,
      toLoc2: stockEntry.toLoc2,
      retrievedAt: new Date(),
    });

    await manualRetrievalEntry.save();
    // console.log("Moved to ManualRetrieval table:", manualRetrievalEntry);

    // Handle stock deletion or update
    if (stockEntry.noOfBatches - noOfBatches <= 0) {
      console.log(`Deleting stock entry: ${stockEntry._id}`);
      const deleteResult = await StockModel.deleteOne({ _id: stockEntry._id });

      if (deleteResult.deletedCount === 1) {
        console.log(`Stock entry ${stockEntry._id} deleted successfully.`);
      } else {
        console.log(`STOPPED to delete stock entry ${stockEntry._id}.`);
      }
    } else {
      stockEntry.noOfBatches -= noOfBatches;
      await stockEntry.save();
      console.log(
        `Stock updated. Remaining batches: ${stockEntry.noOfBatches}`
      );
    }

    // Update storage location status to 0 (empty)
    await StorageLocation.updateOne(
      { user_storage_name: storagelocNumber },
      { $set: { status: 0 } }
    );
    // console.log(`Storage location ${storagelocNumber} status updated to 0`);

    res
      .status(200)
      .json({ message: "Manual retrieval completed successfully" });
  } catch (error) {
    console.error("Error in manual retrieval:", error);
    res.status(500).json({ error: error.message });
  }
};
//-------------- Get error statistics----------------
export const getErrorStatistics = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // Parse and validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Set UTC time boundaries
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    // Match criteria using CORRECT FIELD (startTime)
    const match = {
      startTime: { 
        $gte: startDate,
        $lte: endDate 
      },
      severity: { $in: ["error", "warning"] }
    };

    const aggregationPipeline = [
  { $match: match },
  {
    $facet: {
      errorStats: [
        {
          $group: {
            _id: "$errorCode",
            description: { $first: "$description" },
            severity: { $first: "$severity" },
            count: { $sum: 1 },
            totalDuration: { $sum: "$duration" },
            avgDuration: { $avg: "$duration" },
            lastOccurred: { $max: "$startTime" },
          }
        },
        {
          $project: {
            errorCode: "$_id",
            description: 1,
            severity: 1,
            count: 1,
            totalMinutes: { 
              $round: [
                { $divide: ["$totalDuration", 60000] }, // 60,000 ms = 1 minute
                2
              ] 
            },
            avgMinutes: { 
              $round: [
                { $divide: ["$avgDuration", 60000] },
                2
              ] 
            },
            lastOccurred: 1,
            _id: 0,
          }
        },
        { $sort: { totalMinutes: -1 } }
      ],
      totalLoss: [
        {
          $group: {
            _id: null,
            totalDuration: { $sum: "$duration" }
          }
        },
        {
          $project: {
            _id: 0,
            totalMinutes: { 
              $round: [
                { $divide: ["$totalDuration", 60000] },
                2
              ] 
            }
          }
        }
      ]
    }
  },
  {
    $project: {
      stats: "$errorStats",
      totalTimeLoss: { $arrayElemAt: ["$totalLoss.totalMinutes", 0] }
    }
  }
];

    const [result] = await RobotErrorLog.aggregate(aggregationPipeline);
    
    res.status(200).json({
      stats: result?.stats || [],
      totalTimeLoss: result?.totalTimeLoss || 0
    });
  } catch (error) {
    console.error("Error fetching error statistics:", error);
    res.status(500).json({ error: "Failed to fetch error statistics" });
  }
};
//--------------- Get time lost by severity----------------------
export const getTimeLostBySeverity = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    const stats = await RobotErrorLog.aggregate([
      { $match: { createdAt: { $gte: dateThreshold } } },
      {
        $group: {
          _id: "$severity",
          totalSeconds: { $sum: { $divide: ["$duration", 1000] } },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          severity: "$_id",
          totalHours: { $divide: ["$totalSeconds", 3600] },
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching time lost stats:", error);
    res.status(500).json({ error: "Failed to fetch time lost statistics" });
  }
};
// --------------- Get Robot Waiting Time-----------------
export const getWaitTimes = async (req, res) => {
  try {
    const { start, end } = req.query;
    
    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Set to start of day and end of day in UTC
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const aggregationPipeline = [
      {
        $match: {
          startTime: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startTime",
              timezone: "UTC"
            }
          },
          totalWaitTime: { $sum: "$totalTime" },
          averageWaitTime: { $avg: "$totalTime" },
          numberOfWaits: { $sum: 1 },
          timestamps: { $push: "$startTime" }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromString: {
              dateString: { $concat: ["$_id", "T00:00:00.000Z"] }
            }
          },
          totalWaitTime: { $round: ["$totalWaitTime", 2] },
          averageWaitTime: { $round: ["$averageWaitTime", 2] },
          numberOfWaits: 1,
          timestamps: 1
        }
      },
      { $sort: { date: 1 } }
    ];

    const results = await RobotWaitLog.aggregate(aggregationPipeline);
    
    // Fill gaps for same-day requests
    const finalResults = results.length > 0 ? results : [{
      date: startDate,
      totalWaitTime: 0,
      averageWaitTime: 0,
      numberOfWaits: 0,
      timestamps: []
    }];

    res.status(200).json(finalResults);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ 
      error: "Server error",
      details: error.message
    });
  }
};

// Helper function to fill missing dates in timeseries data
function fillMissingDates(data, startDate, endDate, interval) {
  const filledData = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const isoString = currentDate.toISOString();
    const existing = data.find((d) => d.date === isoString);

    filledData.push(
      existing || {
        date: isoString,
        totalWaitTime: 0,
        averageWaitTime: 0,
        numberOfWaits: 0,
        timestamps: [],
      }
    );

    interval === "hour"
      ? currentDate.setHours(currentDate.getHours() + 1)
      : currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
}

// --------------- Terminate Queue Operations --------------
export const terminateQueueOperations = async (req, res) => {
  try {
    const { ids, operationType, toLoc } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res
        .status(400)
        .json({ error: "Invalid or missing operation IDs" });
    }

    // Validate storage operation parameters
    if (operationType === "STORAGE" && !toLoc) {
      return res.status(400).json({ error: "Missing storage location" });
    }

    // Convert to ObjectIds safely
    const objectIds = ids.map((id) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid ID format: ${id}`);
      }
      return new mongoose.Types.ObjectId(id);
    });

    // Filter out terminated operations from queue
    const filteredQueue = operationQueue.filter(
      (op) => !objectIds.some((id) => id.equals(op._id))
    );
    operationQueue.length = 0;
    operationQueue.push(...filteredQueue);

    // Check if current operation needs termination
    if (
      currentOperation &&
      objectIds.some((id) => id.equals(currentOperation._id))
    ) {
      // Update operation history to STOPPED
      await OperationHistory.findOneAndUpdate(
        { operationId: currentOperation._id.toString() },
        {
          status: "STOPPED",
          stoppedAt: new Date(),
          duration: new Date() - currentOperation.createdAt,
        }
      );

      // Reset storage location for storage operations
      if (operationType === "STORAGE") {
        await StorageLocation.updateOne(
          { user_storage_name: toLoc },
          { $set: { status: 0 } }
        );
      }

      // Cleanup operation data
      await OperationModel.findByIdAndDelete(currentOperation._id);
      await RobotStatus.deleteMany({ operationId: currentOperation._id });

      // Reset current operation state
      currentOperation = null;
      isProcessing = false;
    }

    // Delete operations from database
    await OperationModel.deleteMany({ _id: { $in: objectIds } });

    // Immediately trigger next operation processing
    processNextOperation();

    res.status(200).json({
      message: "Operations terminated successfully",
      terminatedIds: ids,
    });
  } catch (error) {
    console.error("Error terminating operations:", error.message);
    res.status(500).json({
      error: "Failed to terminate operations",
      details: error.message,
    });
  }
};
